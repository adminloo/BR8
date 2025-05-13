import type { DayHours } from '../components/HoursSelector';

type DayName = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface WeeklyHours {
  [key: string]: DayHours | boolean | undefined;
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
  is24_7?: boolean;
  isUnsure?: boolean;
}

type ScheduleHours = {
  is24_7?: boolean;
  isUnsure?: boolean;
  schedule?: Record<DayName, { open: string; close: string; }>;
};

interface Bathroom {
  id: string;
  name: string;
  description?: string;
  address?: string;
  latitude: number;
  longitude: number;
  isAccessible: boolean;
  hasChangingTables: boolean;
  requiresKey: boolean;
  source: 'user-submitted' | 'official';
  ratingCount: number;
  totalRating: number;
  averageRating?: number;
  status?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  hours?: ScheduleHours | WeeklyHours;
  createdAt?: any;
  updatedAt?: any;
  cityId?: string;
  photos?: string[];
}

function isDayHours(value: any): value is DayHours {
  return value && typeof value === 'object' && 'open' in value && 'close' in value && 'isClosed' in value;
}

function isWeeklyHours(hours: ScheduleHours | WeeklyHours | undefined | null): hours is WeeklyHours {
  return !!hours && typeof hours === 'object' && 'monday' in hours;
}

function isScheduleHours(hours: ScheduleHours | WeeklyHours | undefined | null): hours is ScheduleHours {
  return !!hours && typeof hours === 'object' && ('schedule' in hours || 'is24_7' in hours || 'isUnsure' in hours);
}

function normalizeTimeFormat(timeStr: string): string {
  // If it's already in 24-hour format (e.g., "04:00"), return as is
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
    return timeStr;
  }

  // Handle 12-hour format (e.g., "11:30 PM" or "4 AM")
  const cleanTime = timeStr.trim().toUpperCase();
  const [timeComponent, period] = cleanTime.split(' ');
  const [hours, minutes = '00'] = timeComponent.split(':');
  let hour = parseInt(hours);

  // Convert to 24-hour format
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }

  return `${hour.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

function parseTimeString(timeStr: string): { hours: number, minutes: number } {
  try {
    // For "11:30 PM" format, first convert to 24-hour format
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      const cleanTime = timeStr.trim().toUpperCase();
      const [timeComponent, period] = cleanTime.split(' ');
      const [hours, minutes = '00'] = timeComponent.split(':');
      let hour = parseInt(hours);

      // Convert to 24-hour format
      if (period === 'PM' && hour !== 12) {
        hour += 12;
      } else if (period === 'AM' && hour === 12) {
        hour = 0;
      }

      return {
        hours: hour,
        minutes: parseInt(minutes)
      };
    }

    // For already normalized "HH:MM" format
    const [hours, minutes] = timeStr.split(':').map(Number);
    return {
      hours: hours,
      minutes: minutes
    };
  } catch (e) {
    console.error('Error parsing time:', timeStr, e);
    return { hours: 0, minutes: 0 };
  }
}

export function isOpen(bathroom: Bathroom): boolean {
  console.log('\n=== DEBUG: Checking if bathroom is open ===');
  console.log('Bathroom:', bathroom.name);
  
  if (!bathroom?.hours) {
    console.log('No hours data available');
    return false;
  }

  console.log('Hours data:', bathroom.hours);

  // Handle string format (e.g. "Saturday: 4 AM to 11:30 PM, Sunday: 4 AM to 11:30 PM, ...")
  if (typeof bathroom.hours === 'string') {
    const hoursString = bathroom.hours as string;
    console.log('Using string hours format');
    
    if (hoursString === '24/7') {
      console.log('Is 24/7');
      return true;
    }
    if (hoursString === 'UNK') {
      console.log('Hours are unknown');
      return false;
    }

    try {
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;

      console.log('Current time info:', {
        currentDay,
        currentHour,
        currentMinute,
        currentTime
      });

      // Parse the hours string
      const hoursArray = hoursString.split(', ');
      for (const dayHours of hoursArray) {
        const [day, timeRange] = dayHours.split(': ');
        if (day === currentDay) {
          console.log('Found schedule for current day:', timeRange);
          const [openTime, closeTime] = timeRange.split(' to ');
          
          // Parse opening time
          const openMatch = openTime.match(/(\d+)(?::(\d+))?\s*(AM|PM)/i);
          if (!openMatch) continue;
          let openHour = parseInt(openMatch[1]);
          const openMinute = openMatch[2] ? parseInt(openMatch[2]) : 0;
          if (openMatch[3].toUpperCase() === 'PM' && openHour !== 12) openHour += 12;
          if (openMatch[3].toUpperCase() === 'AM' && openHour === 12) openHour = 0;
          
          // Parse closing time
          const closeMatch = closeTime.match(/(\d+)(?::(\d+))?\s*(AM|PM)/i);
          if (!closeMatch) continue;
          let closeHour = parseInt(closeMatch[1]);
          const closeMinute = closeMatch[2] ? parseInt(closeMatch[2]) : 0;
          if (closeMatch[3].toUpperCase() === 'PM' && closeHour !== 12) closeHour += 12;
          if (closeMatch[3].toUpperCase() === 'AM' && closeHour === 12) closeHour = 0;

          const openTimeMinutes = openHour * 60 + openMinute;
          const closeTimeMinutes = closeHour * 60 + closeMinute;

          console.log('Parsed times:', {
            openTimeMinutes,
            closeTimeMinutes,
            currentTime
          });

          if (closeTimeMinutes < openTimeMinutes) {
            // Handle overnight hours
            const isOpen = currentTime >= openTimeMinutes || currentTime <= closeTimeMinutes;
            console.log('Overnight hours check:', isOpen);
            return isOpen;
          }

          const isOpen = currentTime >= openTimeMinutes && currentTime <= closeTimeMinutes;
          console.log('Regular hours check:', isOpen);
          return isOpen;
        }
      }
      console.log('No matching schedule found for current day');
      return false;
    } catch (e) {
      console.error('Error parsing hours string:', e);
      return false;
    }
  }

  // Handle 24/7 case
  if (isScheduleHours(bathroom.hours)) {
    console.log('Using ScheduleHours format');
    
    if (bathroom.hours.is24_7 === true) {
      console.log('Is 24/7');
      return true;
    }
    if (bathroom.hours.isUnsure === true) {
      console.log('Hours are unsure');
      return false;
    }
    
    if (bathroom.hours.schedule) {
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as DayName;
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;

      console.log('Current time info:', {
        currentDay,
        currentHour,
        currentMinute,
        currentTime
      });

      const daySchedule = bathroom.hours.schedule[currentDay];
      
      if (!daySchedule) {
        console.log('No schedule found for current day');
        return false;
      }

      console.log('Day schedule:', daySchedule);

      try {
        const openTime = parseTimeString(daySchedule.open);
        const closeTime = parseTimeString(daySchedule.close);
        
        const openTimeMinutes = openTime.hours * 60 + openTime.minutes;
        const closeTimeMinutes = closeTime.hours * 60 + closeTime.minutes;

        console.log('Parsed times:', {
          openTime: daySchedule.open,
          closeTime: daySchedule.close,
          openTimeMinutes,
          closeTimeMinutes,
          currentTime
        });

        if (closeTimeMinutes < openTimeMinutes) {
          // Handle overnight hours
          const isOpen = currentTime >= openTimeMinutes || currentTime <= closeTimeMinutes;
          console.log('Overnight hours check:', isOpen);
          return isOpen;
        }

        const isOpen = currentTime >= openTimeMinutes && currentTime <= closeTimeMinutes;
        console.log('Regular hours check:', isOpen);
        return isOpen;
      } catch (e) {
        console.error('Error parsing schedule hours:', e);
        return false;
      }
    }
    console.log('No schedule data found');
    return false;
  }

  // Handle WeeklyHours format
  if (isWeeklyHours(bathroom.hours)) {
    console.log('Using WeeklyHours format');
    
    if (bathroom.hours.is24_7 === true) {
      console.log('Is 24/7');
      return true;
    }
    if (bathroom.hours.isUnsure === true) {
      console.log('Hours are unsure');
      return false;
    }

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as DayName;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    console.log('Current time info:', {
      currentDay,
      currentHour,
      currentMinute,
      currentTime
    });

    const dayHours = bathroom.hours[currentDay as keyof WeeklyHours];

    if (!dayHours || !isDayHours(dayHours)) {
      console.log('No hours found for current day');
      return false;
    }
    if (dayHours.isClosed) {
      console.log('Marked as closed for today');
      return false;
    }
    
    try {
      const [openHours, openMinutes] = (dayHours.open || '').split(':').map(Number);
      const [closeHours, closeMinutes] = (dayHours.close || '').split(':').map(Number);
      
      const openTime = openHours * 60 + openMinutes;
      const closeTime = closeHours * 60 + closeMinutes;

      console.log('Parsed times:', {
        openTime,
        closeTime,
        currentTime
      });

      if (closeTime < openTime) {
        // Handle overnight hours
        const isOpen = currentTime >= openTime || currentTime <= closeTime;
        console.log('Overnight hours check:', isOpen);
        return isOpen;
      }

      const isOpen = currentTime >= openTime && currentTime <= closeTime;
      console.log('Regular hours check:', isOpen);
      return isOpen;
    } catch (e) {
      console.error('Error parsing hours:', e);
      return false;
    }
  }

  console.log('Unknown hours format');
  return false; // Default to closed if we can't determine hours
}

export function getAvailabilityStatus(bathroom: Bathroom): {
  isOpen: boolean;
  nextOpenTime?: string;
  message: string;
} {
  const open = isOpen(bathroom);
  return {
    isOpen: open,
    message: open ? 'Open' : 'Closed',
    nextOpenTime: bathroom.hours ? (typeof bathroom.hours === 'string' ? bathroom.hours : undefined) : undefined
  };
}

function isDateInRange(current: number, start: number, end: number): boolean {
  if (start <= end) {
    return current >= start && current <= end;
  } else {
    // Handle wrapping around the week (e.g., Sat-Mon)
    return current >= start || current <= end;
  }
}

function isTimeInRange(timeRange: string, currentHour: number, currentMinutes: number): boolean {
  // Handle formats like "10am - 6pm" or "7AM - 7/9PM"
  const [start, end] = timeRange.split('-').map(t => t.trim());
  
  // Convert current time to minutes since midnight
  const currentTimeInMinutes = currentHour * 60 + currentMinutes;
  
  // Parse start time
  const startTimeInMinutes = parseTimeToMinutes(start);
  
  // Parse end time (handle cases like "7/9PM" where closing time varies)
  const endTimes = end.split('/').map(t => parseTimeToMinutes(t.trim()));
  const latestEndTime = Math.max(...endTimes);
  
  if (startTimeInMinutes <= latestEndTime) {
    return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= latestEndTime;
  } else {
    // Handle overnight hours (e.g., 10PM - 6AM)
    return currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes <= latestEndTime;
  }
}

function parseTimeToMinutes(timeStr: string): number {
  // Convert "10am", "6pm", "7AM", "9PM" etc. to minutes since midnight
  const match = timeStr.toLowerCase().match(/(\d+)(am|pm)/);
  if (!match) return 0;
  
  let hours = parseInt(match[1]);
  const isPM = match[2] === 'pm';
  
  // Convert to 24-hour format
  if (isPM && hours !== 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;
  
  return hours * 60;
}

export function is24Hours(bathroom: Bathroom): boolean {
  if (!bathroom?.hours) return false;
  if (isScheduleHours(bathroom.hours)) return !!bathroom.hours.is24_7;
  if (isWeeklyHours(bathroom.hours)) return !!bathroom.hours.is24_7;
  return false;
}

export function getNextOpenTime(bathroom: Bathroom, findOpening: boolean): string {
  if (!bathroom?.hours) return 'Unknown';
  if (!isWeeklyHours(bathroom.hours)) return 'Unknown';

  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as DayName;
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  const currentDayIndex = days.indexOf(currentDay as typeof days[number]);

  // Check current day first
  const todayHours = bathroom.hours[currentDay as keyof WeeklyHours];
  if (isDayHours(todayHours) && !todayHours.isClosed) {
    const [openHour, openMinute] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = todayHours.close.split(':').map(Number);

    if (findOpening) {
      // Looking for next opening time
      if (currentHour < openHour || (currentHour === openHour && currentMinute < openMinute)) {
        return todayHours.open;
      }
    } else {
      // Looking for closing time
      if (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
        return todayHours.close;
      }
    }
  }

  // Check subsequent days
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const nextDay = days[nextDayIndex];
    const nextDayHours = bathroom.hours[nextDay];

    if (isDayHours(nextDayHours) && !nextDayHours.isClosed) {
      return findOpening ? nextDayHours.open : nextDayHours.close;
    }
  }

  return 'Unknown';
} 