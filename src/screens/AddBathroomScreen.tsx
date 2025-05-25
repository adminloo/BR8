import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HoursSelector, WeeklyHours } from '../components/HoursSelector';
import { RateLimitAlert } from '../components/RateLimitAlert';
import { SUPPORTED_CITIES } from '../config/cities';
import { addBathroom } from '../services/firebase';
import { canSubmitBathroom, getRemainingCooldownSeconds, showCooldownAlert, updateLastSubmissionTime } from '../utils/cooldown';
import { isLocationWithinCityBounds } from '../utils/locationUtils';

export const AddBathroomScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const latitude = typeof params.latitude === 'string' ? parseFloat(params.latitude) : 0;
  const longitude = typeof params.longitude === 'string' ? parseFloat(params.longitude) : 0;
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hoursModalVisible, setHoursModalVisible] = useState(false);
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours | null>(null);
  const [rating, setRating] = useState(0);
  const [isAccessible, setIsAccessible] = useState(false);
  const [hasChangingTables, setHasChangingTables] = useState(false);
  const [requiresKey, setRequiresKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string>('');
  const [rateLimitTime, setRateLimitTime] = useState<number>(0);

  const formatHoursForDisplay = () => {
    if (!weeklyHours) return '';
    if (weeklyHours.is24_7) return '24/7';
    if (weeklyHours.isUnsure) return 'Hours unknown';
    return 'Custom hours set';
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for the bathroom');
      return;
    }

    if (rating === 0) {
      Alert.alert('Error', 'Please provide a rating');
      return;
    }

    // Check cooldown before proceeding
    const canSubmit = await canSubmitBathroom();
    if (!canSubmit) {
      const remainingSeconds = await getRemainingCooldownSeconds();
      showCooldownAlert(remainingSeconds);
      return;
    }

    try {
      setIsSubmitting(true);
      setRateLimitError('');
      
      const bathroomData = {
        name: name.trim(),
        description: description.trim(),
        latitude,
        longitude,
        hours: weeklyHours || undefined,
        isAccessible,
        hasChangingTables,
        requiresKey,
        source: 'user-submitted' as const,
        ratingCount: 1,
        totalRating: rating
      };

      const cityId = determineCityId(latitude, longitude);
      await addBathroom(bathroomData, cityId);

      // Update cooldown timestamp after successful submission
      await updateLastSubmissionTime();

      Alert.alert(
        'Success',
        'Bathroom added successfully! It will be reviewed before appearing on the map.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Rate limit')) {
        setRateLimitError(error.message);
        // Extract remaining time from error message if available
        const timeMatch = error.message.match(/wait (\d+) seconds/);
        if (timeMatch) {
          setRateLimitTime(parseInt(timeMatch[1], 10));
        }
      } else {
        Alert.alert('Error', 'Failed to add bathroom. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {rateLimitError && (
          <RateLimitAlert 
            message={rateLimitError}
            remainingTime={rateLimitTime}
          />
        )}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter bathroom name"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Hours of Operation</Text>
          <TouchableOpacity 
            style={styles.hoursButton}
            onPress={() => setHoursModalVisible(true)}
          >
            <Text style={styles.hoursButtonText}>
              {formatHoursForDisplay() || 'Set hours'}
            </Text>
            <Ionicons name="time-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <HoursSelector
          visible={hoursModalVisible}
          onClose={() => setHoursModalVisible(false)}
          onSave={setWeeklyHours}
          initialHours={weeklyHours || undefined}
        />

        <View style={styles.formGroup}>
          <Text style={styles.label}>Rating *</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity 
                key={star} 
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={32}
                  color={star <= rating ? '#FFD700' : '#000'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Wheelchair Accessible</Text>
            <Switch
              value={isAccessible}
              onValueChange={setIsAccessible}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Changing Tables</Text>
            <Switch
              value={hasChangingTables}
              onValueChange={setHasChangingTables}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Requires Key/Code</Text>
            <Switch
              value={requiresKey}
              onValueChange={setRequiresKey}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled
          ]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Add Bathroom</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper function to determine city based on location
function determineCityId(latitude: number, longitude: number): string {
  for (const city of Object.values(SUPPORTED_CITIES)) {
    if (isLocationWithinCityBounds({ latitude, longitude }, city.bounds)) {
      return city.id;
    }
  }
  // If no matching city is found, determine nearest city
  let nearestCity = Object.values(SUPPORTED_CITIES)[0];
  let shortestDistance = Number.MAX_VALUE;
  
  Object.values(SUPPORTED_CITIES).forEach(city => {
    const distance = Math.sqrt(
      Math.pow(latitude - city.center.latitude, 2) + 
      Math.pow(longitude - city.center.longitude, 2)
    );
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestCity = city;
    }
  });
  
  return nearestCity.id;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  starButton: {
    padding: 5,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hoursButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  hoursButtonText: {
    fontSize: 16,
    color: '#333',
  },
}); 