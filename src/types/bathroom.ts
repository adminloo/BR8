export interface DayHours {
  isClosed: boolean;
  open: string;
  close: string;
}

export interface WeeklyHours {
  [key: string]: DayHours;
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
} 