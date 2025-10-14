import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Bathroom } from '../types';
import { isOpen } from '../utils/availability';
import type { DayHours, WeeklyHours } from './HoursSelector';

interface Props {
  hours?: WeeklyHours | { schedule?: Record<string, { open: string; close: string }>, is24_7?: boolean, isUnsure?: boolean } | null;
  onStatusChange?: (isOpen: boolean) => void;
}

type HoursMap = {
  [key: string]: string;
};

function isDayHours(value: any): value is DayHours {
  return value && typeof value === 'object' && 'open' in value && 'close' in value && 'isClosed' in value;
}

function formatTime(time24: string): string {
  if (!time24) return '';
  
  // Check if the time already includes AM/PM
  if (time24.includes('AM') || time24.includes('PM')) {
    return time24;
  }

  try {
    // Handle 24-hour format
    const [hours, minutes] = time24.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
      return '';
    }
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    
    const formattedMinutes = minutes > 0 ? ':' + minutes.toString().padStart(2, '0') : '';
    return `${hours12}${formattedMinutes} ${period}`;
  } catch (e) {
    console.error('Error formatting time:', e);
    return '';
  }
}

export const OperatingHoursSection: React.FC<Props> = ({ hours, onStatusChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  
  const bathroom: Bathroom = {
    id: '',
    name: '',
    description: '',
    latitude: 0,
    longitude: 0,
    isAccessible: false,
    hasChangingTables: false,
    requiresKey: false,
    source: 'user-submitted',
    ratingCount: 0,
    totalRating: 0,
    averageRating: 0,
    hours: hours || { isUnsure: true }
  };
  
  const isCurrentlyOpen = isOpen(bathroom);

  useEffect(() => {
    onStatusChange?.(isCurrentlyOpen);
  }, [isCurrentlyOpen, onStatusChange]);

  const hasUnverifiedHours = !hours || (typeof hours === 'object' && 'isUnsure' in hours && hours.isUnsure);

  // Show warning if hours are unverified
  React.useEffect(() => {
    if (hasUnverifiedHours) {
      setShowWarningModal(true);
    }
  }, [hasUnverifiedHours]);

  const parseHours = (hours: Props['hours']): HoursMap => {
    if (!hours || typeof hours !== 'object') {
      return daysOfWeek.reduce((acc, day) => ({
        ...acc,
        [day]: 'Hours unknown'
      }), {} as HoursMap);
    }

    // Handle 24/7 case
    if ('is24_7' in hours && hours.is24_7) {
      return daysOfWeek.reduce((acc, day) => ({
        ...acc,
        [day]: 'Open 24 hours'
      }), {} as HoursMap);
    }
    
    // Handle unsure case
    if ('isUnsure' in hours && hours.isUnsure) {
      return daysOfWeek.reduce((acc, day) => ({
        ...acc,
        [day]: 'Hours unknown'
      }), {} as HoursMap);
    }

    // Handle schedule format
    if ('schedule' in hours && hours.schedule) {
      return daysOfWeek.reduce((acc, day) => {
        try {
          const daySchedule = hours.schedule?.[day.toLowerCase()];
          if (!daySchedule || !daySchedule.open || !daySchedule.close) {
            return { ...acc, [day]: 'Closed' };
          }
          const openTime = formatTime(daySchedule.open);
          const closeTime = formatTime(daySchedule.close);
          if (!openTime || !closeTime) {
            return { ...acc, [day]: 'Closed' };
          }
          return { ...acc, [day]: `${openTime} to ${closeTime}` };
        } catch (e) {
          console.error('Error parsing schedule for day:', day, e);
          return { ...acc, [day]: 'Closed' };
        }
      }, {} as HoursMap);
    }

    // Handle WeeklyHours format
    if ('monday' in hours) {
      return daysOfWeek.reduce((acc, day) => {
        try {
          const dayKey = day.toLowerCase() as keyof WeeklyHours;
          const dayHours = hours[dayKey];
          
          if (!dayHours || !isDayHours(dayHours) || dayHours.isClosed) {
            return { ...acc, [day]: 'Closed' };
          }

          const openTime = formatTime(dayHours.open);
          const closeTime = formatTime(dayHours.close);
          if (!openTime || !closeTime) {
            return { ...acc, [day]: 'Closed' };
          }
          return { ...acc, [day]: `${openTime} to ${closeTime}` };
        } catch (e) {
          console.error('Error parsing weekly hours for day:', day, e);
          return { ...acc, [day]: 'Closed' };
        }
      }, {} as HoursMap);
    }

    return daysOfWeek.reduce((acc, day) => ({
      ...acc,
      [day]: 'Hours unknown'
    }), {} as HoursMap);
  };

  const hoursMap = parseHours(hours);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayHours = hoursMap[today] || 'Closed';

  return (
    <View style={styles.card}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showWarningModal}
        onRequestClose={() => setShowWarningModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚠️ Hours Unverified</Text>
            <Text style={styles.modalText}>
              The operating hours for this bathroom have not been verified. Please verify the hours yourself or proceed with caution.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowWarningModal(false)}
            >
              <Text style={styles.modalButtonText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="time" size={24} color="#1A1A1A" style={styles.icon} />
          <Text style={styles.title}>Hours of Operation</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[
            styles.statusText,
            hasUnverifiedHours ? styles.unknownText : (isCurrentlyOpen ? styles.openText : styles.closedText)
          ]}>
            {hasUnverifiedHours ? 'Unknown' : (isCurrentlyOpen ? 'Open' : 'Closed')}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.viewAllButton}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.viewAllText}>View all hours</Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#666"
        />
      </TouchableOpacity>

      {isExpanded ? (
        <View style={styles.expandedHours}>
          {daysOfWeek.map((day, index) => (
            <View
              key={day}
              style={[
                styles.dayRow,
                index % 2 === 0 && styles.alternateRow,
                day === today && styles.todayRow
              ]}
            >
              <Text style={[
                styles.dayText,
                day === today && styles.todayText
              ]}>
                {day}
              </Text>
              <Text style={[
                styles.hoursText,
                day === today && styles.todayText
              ]}>
                {hoursMap[day]}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.todayHoursContainer}>
          <Text style={styles.todayLabel}>Today</Text>
          <Text style={styles.todayHours}>{todayHours}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  openText: {
    color: '#34C759',
    backgroundColor: '#34C75915',
  },
  closedText: {
    color: '#FF3B30',
    backgroundColor: '#FF3B3015',
  },
  unknownText: {
    color: '#666666',
    backgroundColor: '#66666615',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  viewAllText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  expandedHours: {
    marginTop: 8,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  alternateRow: {
    backgroundColor: '#F8F8F8',
  },
  todayRow: {
    backgroundColor: '#E1F5FF',
  },
  dayText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  hoursText: {
    fontSize: 15,
    color: '#666',
  },
  todayText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  todayHoursContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  todayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  todayHours: {
    fontSize: 16,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    margin: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#FF6B6B',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#4A4A4A',
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 