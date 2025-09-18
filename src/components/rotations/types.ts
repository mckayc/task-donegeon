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
  // Tracks the index of the last user who started a round.
  lastUserIndex: number;
  // Tracks the index of the quest that started the last assignment round.
  lastQuestStartIndex: number;
  // How many quests to assign per user, per run.
  questsPerUser: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt?: string;
  updatedAt?: string;
}