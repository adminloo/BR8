import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Report an Issue</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
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
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailsTitle: {
    marginTop: 20,
  },
  typeButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  selectedTypeButton: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#333',
  },
  selectedTypeButtonText: {
    color: '#fff',
  },
  detailsInput: {
    height: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 