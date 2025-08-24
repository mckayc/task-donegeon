export interface Rotation {
  id: string;
  name: string;
  description: string;
  questIds: string[];
  userIds: string[];
  // 0=Sun, 6=Sat
  activeDays: number[];
  // How often the assignment rotates
  frequency: 'DAILY' | 'WEEKLY';
  // Tracks the last date an assignment was made to prevent duplicates on the same day.
  lastAssignmentDate: string | null;
  // Tracks the index of the last user assigned a quest in the userIds array.
  lastUserIndex: number;
  // Tracks the index of the last quest assigned a quest in the questIds array.
  lastQuestIndex: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt?: string;
  updatedAt?: string;
}
