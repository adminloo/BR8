import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const REVIEW_TAGS = [
  { id: 'clean', label: 'Clean' },
  { id: 'maintained', label: 'Well-maintained' },
  { id: 'accessible', label: 'Accessible' },
  { id: 'private', label: 'Private' },
  { id: 'spacious', label: 'Spacious' },
  { id: 'quiet', label: 'Quiet' },
  { id: 'safe', label: 'Safe' },
  { id: 'bright', label: 'Well-lit' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (review: { rating: number; comment: string; tags: string[] }) => void;
}

export const ReviewModal: React.FC<Props> = ({ visible, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSubmit = () => {
    onSubmit({
      rating,
      comment: comment.trim(),
      tags: selectedTags,
    });
    resetForm();
  };

  const resetForm = () => {
    setRating(0);
    setComment('');
    setSelectedTags([]);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
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
            <Text style={styles.title}>Write a Review</Text>
            <TouchableOpacity 
              onPress={onClose}
              accessibilityLabel="Close review form"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Rating Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rating</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    accessibilityLabel={`Rate ${star} stars`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: rating >= star }}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={rating >= star ? 'star' : 'star-outline'}
                      size={32}
                      color={rating >= star ? '#FFD700' : '#8E8E93'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Quick Tags Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Tags</Text>
              <View style={styles.tagsContainer}>
                {REVIEW_TAGS.map((tag) => (
                  <TouchableOpacity
                    key={tag.id}
                    onPress={() => toggleTag(tag.id)}
                    style={[
                      styles.tagButton,
                      selectedTags.includes(tag.id) && styles.tagButtonSelected,
                    ]}
                    accessibilityLabel={`${tag.label} tag ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedTags.includes(tag.id) }}
                  >
                    <Text style={[
                      styles.tagText,
                      selectedTags.includes(tag.id) && styles.tagTextSelected,
                    ]}>
                      {tag.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Comment Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Comments (Optional)</Text>
              <TextInput
                style={styles.commentInput}
                value={comment}
                onChangeText={setComment}
                placeholder="Share more about your experience..."
                multiline
                numberOfLines={4}
                maxLength={500}
                accessibilityLabel="Review comment input"
                accessibilityHint="Enter additional comments about your experience"
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, !rating && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!rating}
              accessibilityLabel="Submit review"
              accessibilityRole="button"
              accessibilityState={{ disabled: !rating }}
            >
              <Text style={styles.submitButtonText}>Submit Review</Text>
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
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
  },
  tagButtonSelected: {
    backgroundColor: '#007AFF',
  },
  tagText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  tagTextSelected: {
    color: '#fff',
  },
  commentInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
}); 