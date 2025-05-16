import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (report: { type: string; details: string }) => Promise<void>;
  bathroomDetails?: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    isAccessible: boolean;
    hasChangingTables: boolean;
    requiresKey: boolean;
  };
}

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  onSubmit,
  bathroomDetails
}) => {
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const scrollViewRef = useRef<ScrollView>(null);

  const reportTypes = [
    { id: 'CLOSED', label: 'Permanently Closed' },
    { id: 'WRONG_HOURS', label: 'Incorrect Hours' },
    { id: 'WRONG_LOCATION', label: 'Wrong Location' },
    { id: 'ACCESS_CHANGED', label: 'Accessibility Changed' },
    { id: 'OTHER', label: 'Other Issue' }
  ];

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Error', 'Please select an issue type');
      return;
    }

    if (!details.trim()) {
      Alert.alert('Error', 'Please provide details about the issue');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        type: selectedType,
        details: details.trim()
      });
      Alert.alert('Thank You', 'Your report has been submitted for review.');
      setDetails('');
      setSelectedType('');
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalContent}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Report an Issue</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            ref={scrollViewRef}
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.sectionTitle}>What's the issue?</Text>
            {reportTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeButton,
                  selectedType === type.id && styles.selectedTypeButton
                ]}
                onPress={() => setSelectedType(type.id)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    selectedType === type.id && styles.selectedTypeButtonText
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={[styles.sectionTitle, styles.detailsTitle]}>
              Additional Details
            </Text>
            <TextInput
              style={styles.detailsInput}
              value={details}
              onChangeText={setDetails}
              placeholder="Please provide more information..."
              multiline
              numberOfLines={4}
              maxLength={500}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
            />

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    paddingTop: 50,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    maxHeight: '85%',
    minHeight: 600,
    marginHorizontal: 12,
    marginVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  detailsTitle: {
    marginTop: 28,
  },
  typeButton: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#F8F8F8',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedTypeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 17,
    color: '#1A1A1A',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedTypeButtonText: {
    color: '#FFFFFF',
  },
  detailsInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 16,
    padding: 16,
    fontSize: 17,
    textAlignVertical: 'top',
    marginBottom: 24,
    backgroundColor: '#F8F8F8',
    color: '#1A1A1A',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E5E5',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
}); 