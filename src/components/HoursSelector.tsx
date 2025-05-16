import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export interface DayHours {
  open: string;
  close: string;
  isClosed: boolean;
}

export interface WeeklyHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
  is24_7: boolean;
  isUnsure: boolean;
}

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const isDayKey = (key: string): key is DayKey => {
  return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(key);
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (hours: WeeklyHours) => void;
  initialHours?: WeeklyHours;
}

const DEFAULT_HOURS: WeeklyHours = {
  sunday: { open: '09:00', close: '17:00', isClosed: false },
  monday: { open: '09:00', close: '17:00', isClosed: false },
  tuesday: { open: '09:00', close: '17:00', isClosed: false },
  wednesday: { open: '09:00', close: '17:00', isClosed: false },
  thursday: { open: '09:00', close: '17:00', isClosed: false },
  friday: { open: '09:00', close: '17:00', isClosed: false },
  saturday: { open: '09:00', close: '17:00', isClosed: false },
  is24_7: false,
  isUnsure: false,
};

export const HoursSelector: React.FC<Props> = ({
  visible,
  onClose,
  onSave,
  initialHours = DEFAULT_HOURS,
}) => {
  const [hours, setHours] = useState<WeeklyHours>(initialHours);
  const [previousHours, setPreviousHours] = useState<WeeklyHours>(DEFAULT_HOURS);
  const [editingDay, setEditingDay] = useState<keyof WeeklyHours | null>(null);
  const [editingType, setEditingType] = useState<'open' | 'close' | null>(null);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());

  const handleTimeSelect = (day: keyof WeeklyHours, type: 'open' | 'close') => {
    if (!isDayKey(day)) return;
    const dayHours = hours[day];
    if (dayHours.isClosed) return;
    
    setEditingDay(day);
    setEditingType(type);
    
    const timeStr = type === 'open' ? dayHours.open : dayHours.close;
    const [hours24, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours24);
    date.setMinutes(minutes);
    setSelectedTime(date);
    setTimePickerVisible(true);
  };

  const formatTimeWithAmPm = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const isValidTimeRange = (open: string, close: string) => {
    const [openHours, openMinutes] = open.split(':').map(Number);
    const [closeHours, closeMinutes] = close.split(':').map(Number);
    
    const openMinutesSinceMidnight = openHours * 60 + openMinutes;
    const closeMinutesSinceMidnight = closeHours * 60 + closeMinutes;
    
    return closeMinutesSinceMidnight > openMinutesSinceMidnight;
  };

  const handleTimeChange = (event: any, date?: Date) => {
    setTimePickerVisible(Platform.OS === 'ios');
    
    if (date && editingDay && editingType && isDayKey(editingDay)) {
      const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      
      // Check if the new time would create an invalid range
      if (editingType === 'open') {
        const closeTime = hours[editingDay].close;
        if (!isValidTimeRange(timeStr, closeTime)) {
          alert('Opening time must be before closing time');
          return;
        }
      } else {
        const openTime = hours[editingDay].open;
        if (!isValidTimeRange(openTime, timeStr)) {
          alert('Closing time must be after opening time');
          return;
        }
      }
      
      setSelectedTime(date);
      setHours(prev => ({
        ...prev,
        [editingDay]: {
          ...prev[editingDay],
          [editingType]: timeStr,
        },
      }));
    }
  };

  const toggleDayClosed = (day: keyof WeeklyHours) => {
    if (!isDayKey(day)) return;
    
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isClosed: !prev[day].isClosed,
      },
    }));
  };

  const handleSet24_7 = () => {
    if (hours.is24_7) {
      setHours(prevHours => ({
        ...previousHours,
        is24_7: false,
        isUnsure: false
      }));
    } else {
      setPreviousHours(current => ({...current}));
      setHours(prevHours => ({
        ...prevHours,
        is24_7: true,
        isUnsure: false
      }));
    }
  };

  const handleSetUnsure = () => {
    if (hours.isUnsure) {
      setHours(prevHours => ({
        ...previousHours,
        is24_7: false,
        isUnsure: false
      }));
    } else {
      setPreviousHours(current => ({...current}));
      setHours(prevHours => ({
        ...prevHours,
        is24_7: false,
        isUnsure: true
      }));
    }
  };

  const handleSave = () => {
    onSave(hours);
    onClose();
  };

  const handleEditAll = () => {
    if (!editingType) return;
    
    const timeStr = `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`;
    setHours(prev => {
      const newHours = { ...prev };
      Object.keys(prev).forEach(day => {
        if (isDayKey(day) && !prev[day].isClosed) {
          newHours[day] = {
            ...prev[day],
            [editingType]: timeStr,
          };
        }
      });
      return newHours;
    });
  };

  const renderDayRow = (day: keyof WeeklyHours) => {
    if (!isDayKey(day)) return null;
    
    const dayHours = hours[day];
    
    return (
      <View style={styles.dayRow} key={day}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayText}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
          <TouchableOpacity
            style={[styles.closedButton, dayHours.isClosed && styles.closedButtonActive]}
            onPress={() => toggleDayClosed(day)}
          >
            <Text style={[styles.closedButtonText, dayHours.isClosed && styles.closedButtonTextActive]}>
              {dayHours.isClosed ? 'Closed' : 'Open'}
            </Text>
          </TouchableOpacity>
        </View>
        {!dayHours.isClosed && (
          <View style={styles.timeContainer}>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => handleTimeSelect(day, 'open')}
            >
              <Text style={styles.timeText}>{formatTimeWithAmPm(dayHours.open)}</Text>
            </TouchableOpacity>
            <Text style={styles.dashText}>—</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => handleTimeSelect(day, 'close')}
            >
              <Text style={styles.timeText}>{formatTimeWithAmPm(dayHours.close)}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Hours</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.specialButton,
              hours.is24_7 && styles.specialButtonActive,
            ]}
            onPress={handleSet24_7}
          >
            <Ionicons name="time" size={24} color={hours.is24_7 ? '#fff' : '#007AFF'} />
            <Text style={[styles.specialButtonText, hours.is24_7 && styles.specialButtonTextActive]}>
              Mark as 24/7
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.specialButton,
              hours.isUnsure && styles.specialButtonActive,
            ]}
            onPress={handleSetUnsure}
          >
            <Ionicons name="help-circle" size={24} color={hours.isUnsure ? '#fff' : '#007AFF'} />
            <Text style={[styles.specialButtonText, hours.isUnsure && styles.specialButtonTextActive]}>
              Unsure of hours
            </Text>
          </TouchableOpacity>

          {!hours.is24_7 && !hours.isUnsure && (
            <ScrollView style={styles.daysContainer}>
              {Object.keys(hours).map(day => renderDayRow(day as keyof WeeklyHours))}
            </ScrollView>
          )}

          {timePickerVisible && (
            <View style={styles.timePickerContainer}>
              <DateTimePicker
                value={selectedTime}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                minuteInterval={15}
                themeVariant="light"
                textColor="#000000"
                style={{ backgroundColor: 'white' }}
              />
              {Platform.OS === 'ios' && (
                <View style={styles.timePickerButtons}>
                  <TouchableOpacity
                    style={styles.editAllButton}
                    onPress={handleEditAll}
                  >
                    <Text style={styles.editAllButtonText}>
                      Apply to all {editingType === 'open' ? 'opening' : 'closing'} times
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
            <Text style={styles.submitButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  specialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginBottom: 10,
  },
  specialButtonActive: {
    backgroundColor: '#007AFF',
  },
  specialButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#007AFF',
  },
  specialButtonTextActive: {
    color: '#fff',
  },
  daysContainer: {
    marginTop: 10,
  },
  dayRow: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  closedButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#E8E8E8',
  },
  closedButtonActive: {
    backgroundColor: '#FF3B30',
  },
  closedButtonText: {
    fontSize: 14,
    color: '#666',
  },
  closedButtonTextActive: {
    color: '#FFF',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    minWidth: 100,
  },
  timeText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
  },
  dashText: {
    marginHorizontal: 10,
    color: '#666',
  },
  timePickerContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  timePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  editAllButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  editAllButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 