export interface DayItem {
  date: Date;
  empty?: boolean;
  IS_AVAILABLE?: boolean;
  START_TIME: Date | null;
  END_TIME: Date | null;
  TECHNICIAN_ID: string | null;
  isSelected?: boolean;
  isWorkingDay?: boolean;
  isOnLeave?: boolean;
  isHoliday?: boolean;
  isToday?: boolean;
  isCurrentMonth?: boolean;
  isDisabled?: boolean;
  [key: string]: any; // Allow indexing with string keys
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
} 