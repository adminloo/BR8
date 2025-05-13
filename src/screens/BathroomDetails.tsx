import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { AccessTypeInfo } from '../components/AccessTypeInfo';
import { OperatingHoursSection } from '../components/OperatingHoursSection';
import { PhotoGallery } from '../components/PhotoGallery';
import { ReportModal } from '../components/ReportModal';
import { convertTo24Hour, useBathrooms } from '../hooks/useBathrooms';
import { addReport, addReview, getReviews } from '../services/firebase';
import type { Review } from '../types/index';
import { isOpen } from '../utils/availability';

export const BathroomDetailsScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const bathroomId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  console.log('=== DEBUG: Bathroom Details Screen ===');
  console.log('Params:', params);
  console.log('Bathroom ID:', bathroomId);
  
  const router = useRouter();
  const { bathrooms, isLoading } = useBathrooms();
  const [activeTab, setActiveTab] = useState('about');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isCurrentlyOpen, setIsCurrentlyOpen] = useState(false);
  
  const bathroom = bathrooms.find(b => b.id === bathroomId);
  console.log('Found bathroom:', bathroom);

  useEffect(() => {
    loadReviews();
  }, [bathroomId]);

  useEffect(() => {
    if (bathroom) {
      const now = new Date();
      console.log('Selected bathroom details:', {
        id: bathroom.id,
        name: bathroom.name,
        currentTime: {
          hours: now.getHours(),
          minutes: now.getMinutes(),
          day: now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        },
        hours: bathroom.hours,
        isCurrentlyOpen: isOpen(bathroom)
      });
    }
  }, [bathroom]);

  const loadReviews = async () => {
    try {
      const bathroomReviews = await getReviews(bathroomId);
      setReviews(bathroomReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
      Alert.alert('Error', 'Failed to load reviews');
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    if (!newReview.trim()) {
      Alert.alert('Error', 'Please enter a review comment');
      return;
    }

    try {
      setIsSubmitting(true);
      await addReview({
        bathroomId,
        rating,
        comment: newReview.trim(),
        tags: selectedTags,
      });

      // Reset form
      setNewReview('');
      setRating(0);
      setSelectedTags([]);
      // Reload reviews
      await loadReviews();
      Alert.alert('Success', 'Review added successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text>Loading bathroom details...</Text>
      </View>
    );
  }

  if (!bathroom) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text>Bathroom not found</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const averageRating = bathroom.ratingCount > 0 
    ? (bathroom.totalRating / bathroom.ratingCount).toFixed(1) 
    : 'New';

  return (
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <Text style={[
            styles.title,
            bathroom?.address && styles.titleWithAddress
          ]}>
            {bathroom?.name}
          </Text>
          {bathroom?.address && (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color="#666" />
              <Text style={styles.locationText} numberOfLines={1}>
                {bathroom.address}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusIndicator, 
            { backgroundColor: isCurrentlyOpen ? '#34C759' : '#FF3B30' },
            isCurrentlyOpen && styles.statusIndicatorGlow
          ]} />
          <View>
            <Text style={styles.statusText}>
              {isCurrentlyOpen ? 'Open Now' : 'Closed'}
            </Text>
          </View>
        </View>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>{averageRating}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.directionsButton}
          onPress={async () => {
            const scheme = Platform.select({ ios: 'maps:', android: 'geo:' });
            const url = Platform.select({
              ios: `maps:0,0?q=${bathroom.name}@${bathroom.latitude},${bathroom.longitude}`,
              android: `geo:0,0?q=${bathroom.latitude},${bathroom.longitude}(${bathroom.name})`
            });
            const supported = await Linking.canOpenURL(url!);
            if (supported) {
              await Linking.openURL(url!);
            } else {
              await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${bathroom.latitude},${bathroom.longitude}`);
            }
          }}
        >
          <Ionicons name="navigate" size={20} color="#fff" />
          <Text style={styles.directionsButtonText}>Directions</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.reportButton}
          onPress={() => setIsReportModalVisible(true)}
        >
          <Ionicons name="flag-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabsList}>
          {['about', 'features', 'reviews'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.activeTabButton
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabButtonText,
                activeTab === tab && styles.activeTabButtonText
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'about' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Description</Text>
              <Text style={styles.descriptionText}>{bathroom?.description}</Text>
            </View>
            
            {bathroom && (
              <OperatingHoursSection 
                hours={(() => {
                  const hours = bathroom.hours;
                  console.log('DEBUG - Hours data:', JSON.stringify(hours, null, 2));
                  if (!hours) return { isUnsure: true };
                  
                  if (typeof hours === 'string') {
                    if (hours === '24/7') return { is24_7: true };
                    if (hours === 'UNK') return { isUnsure: true };
                    
                    // Parse the schedule format
                    try {
                      const schedule: Record<string, { open: string; close: string }> = {};
                      const hoursString = String(hours).trim();
                      
                      hoursString.split(', ').forEach((dayHour: string) => {
                        if (!dayHour) return;
                        const [day, timeRange] = dayHour.split(': ');
                        if (!timeRange) return;
                        
                        const [openTime, closeTime] = timeRange.split(' to ');
                        if (!openTime || !closeTime) return;
                        
                        schedule[day.toLowerCase()] = { 
                          open: convertTo24Hour(openTime) || openTime,
                          close: convertTo24Hour(closeTime) || closeTime
                        };
                      });
                      
                      return Object.keys(schedule).length > 0 ? { schedule } : { isUnsure: true };
                    } catch (e) {
                      console.error('Error parsing hours:', e);
                      return { isUnsure: true };
                    }
                  }
                  
                  return hours;
                })()}
                onStatusChange={setIsCurrentlyOpen}
              />
            )}
          </View>
        )}

        {activeTab === 'features' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Amenities</Text>
              <AccessTypeInfo 
                isAccessible={bathroom.isAccessible}
                hasChangingTables={bathroom.hasChangingTables}
                requiresKey={bathroom.requiresKey}
              />
            </View>
          </View>
        )}

        {activeTab === 'reviews' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Reviews</Text>
              <Text style={styles.reviewsSubtitle}>
                {bathroom.ratingCount} reviews • {averageRating} average
              </Text>

              {/* Review List */}
              {reviews.length > 0 ? (
                <View style={styles.reviewsList}>
                  {reviews.map((review, index) => (
                    <View key={review.id}>
                      <View style={styles.reviewContent}>
                        <View style={styles.reviewHeader}>
                          <Text style={styles.reviewDate}>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </Text>
                          <View style={styles.reviewRating}>
                            <Ionicons name="star" size={16} color="#FFD700" />
                            <Text style={styles.reviewRatingText}>{review.rating}</Text>
                          </View>
                        </View>
                        <Text style={styles.reviewComment}>{review.comment}</Text>
                        {review.tags && review.tags.length > 0 && (
                          <View style={styles.reviewTags}>
                            {review.tags.map((tag, tagIndex) => (
                              <View key={tagIndex} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                      {index < reviews.length - 1 && <View style={styles.reviewDivider} />}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyReviewsContainer}>
                  <Text style={styles.emptyReviewsText}>
                    No one's shared yet — you could be first 🌟
                  </Text>
                </View>
              )}

              <TouchableOpacity 
                style={styles.addReviewButton}
                onPress={() => setIsReviewModalVisible(true)}
              >
                <Text style={styles.addReviewButtonText}>Write a Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <PhotoGallery 
        photos={bathroom.photos || []} 
      />

      {/* Review Modal */}
      <Modal
        visible={isReviewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Write a Review</Text>
                <TouchableOpacity 
                  onPress={() => setIsReviewModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                  >
                    <Ionicons
                      name={rating >= star ? "star" : "star-outline"}
                      size={32}
                      color="#FFD700"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.reviewInput}
                placeholder="Share your experience..."
                value={newReview}
                onChangeText={setNewReview}
                multiline
                numberOfLines={4}
              />

              <View style={styles.quickTags}>
                {['Clean', 'Dirty', 'Spacious', 'Safe', 'Well-maintained'].map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.quickTag, selectedTags.includes(tag) && styles.quickTagSelected]}
                    onPress={() => {
                      setSelectedTags(prev => 
                        prev.includes(tag) 
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                  >
                    <Text style={[
                      styles.quickTagText,
                      selectedTags.includes(tag) && styles.quickTagTextSelected
                    ]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={[
                  styles.submitButton,
                  (isSubmitting || !rating || !newReview.trim()) && styles.submitButtonDisabled
                ]}
                onPress={async () => {
                  await handleSubmitReview();
                  setIsReviewModalVisible(false);
                }}
                disabled={isSubmitting || !rating || !newReview.trim()}
              >
                <Text style={styles.submitButtonText}>Submit Review</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <ReportModal
        visible={isReportModalVisible}
        onClose={() => setIsReportModalVisible(false)}
        onSubmit={async (report) => {
          try {
            await addReport({
              bathroomId: bathroom.id,
              type: report.type,
              details: report.details,
              timestamp: new Date(),
            });
          } catch (error) {
            console.error('Error submitting report:', error);
            throw error;
          }
        }}
        bathroomDetails={bathroom}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  heroSection: {
    height: 120,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 16,
    paddingTop: 8,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  heroContent: {
    marginBottom: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 0,
  },
  titleWithAddress: {
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: -24,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusIndicatorGlow: {
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statusSubtext: {
    fontSize: 14,
    color: '#666',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
    color: '#1A1A1A',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  directionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    height: 48,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  directionsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  reportButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
  },
  tabsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tabsList: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#fff',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: '#1A1A1A',
  },
  tabContent: {
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 20,
  },
  reviewsSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  reviewsList: {
    marginTop: 8,
  },
  reviewContent: {
    paddingVertical: 16,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: -20,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewDate: {
    fontSize: 15,
    color: '#666',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewRatingText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
    color: '#1A1A1A',
  },
  reviewComment: {
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 22,
    marginBottom: 12,
  },
  reviewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: '#666',
  },
  addReviewButton: {
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  addReviewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyReviewsContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyReviewsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  reviewInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#B4B4B4',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickTag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quickTagSelected: {
    backgroundColor: '#007AFF',
  },
  quickTagText: {
    fontSize: 13,
    color: '#666',
  },
  quickTagTextSelected: {
    color: '#fff',
  },
}); 