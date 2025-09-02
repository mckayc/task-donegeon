import { RewardItem } from '../items/types';
import { Role } from '../users/types';

export enum QuestType {
  Duty = 'Duty',
  Venture = 'Venture',
  Journey = 'Journey',
}

export enum QuestKind {
    Personal = 'Personal', // Personal scope, personal rewards
    Guild = 'Guild', // Guild scope, but each person completes it for themselves
    GuildCollaborative = 'GuildCollaborative', // Guild scope, requires multiple people to complete
    Redemption = 'Redemption', // A quest to redeem a setback
}

export enum QuestAvailability {
    Daily = 'Daily',
    Weekly = 'Weekly',
    Monthly = 'Monthly',
    Frequency = 'Frequency',
    Unlimited = 'Unlimited',
}

export enum QuestMediaType {
  AITeacher = 'AI_TEACHER',
  AIStory = 'AI_STORY',
}

export interface Checkpoint {
  id: string;
  description: string;
  rewards: RewardItem[];
  trophyId?: string;
}

export interface QuizChoice {
    text: string;
    isCorrect: boolean;
}

export interface QuizQuestion {
    question: string;
    choices: QuizChoice[];
}

export interface QuizState {
    questions: QuizQuestion[];
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  kind: QuestKind; // New field to distinguish quest types
  mediaType?: QuestMediaType;
  aiTutorSessionMinutes?: number;
  iconType: 'emoji' | 'image';
  icon: string;
  imageUrl?: string;
  tags: string[];
  
  // New Unified Scheduling Model
  startDateTime: string | null; // Full ISO string for one-time events (Ventures).
  endDateTime: string | null;   // Full ISO string for one-time events (Ventures).
  allDay: boolean;              // Indicates if the event is for the whole day.
  rrule: string | null;         // iCalendar RRULE string for recurring events (Duties).
  startTime: string | null;     // 'HH:mm' for recurring events (Duties).
  endTime: string | null;       // 'HH:mm' for recurring events (Duties).
  
  dailyCompletionsLimit?: number; // How many times it can be completed per day. 0 for unlimited.
  totalCompletionsLimit?: number; // How many times it can be completed in total. 0 for unlimited.
  completionGoal?: number; // For collaborative quests
  checkpoints?: Checkpoint[]; // For Journeys
  checkpointCompletionTimestamps?: { [userId: string]: { [checkpointId: string]: string } }; // For Journeys
  contributions?: { userId: string, contributedAt: string }[]; // For collaborative quests

  // Claiming Feature
  requiresClaim?: boolean;
  claimLimit?: number;
  pendingClaims?: { userId: string; claimedAt: string; }[];
  approvedClaims?: { userId: string; claimedAt: string; approvedBy: string; approvedAt: string; }[];

  rewards: RewardItem[];
  lateSetbacks: RewardItem[];
  incompleteSetbacks: RewardItem[];
  isActive: boolean;
  isOptional: boolean;
  assignedUserIds: string[];
  guildId?: string;
  groupId?: string;
  requiresApproval: boolean;
  claimedByUserIds: string[];
  dismissals: { userId: string; dismissedAt: string; }[];
  todoUserIds?: string[]; // Kept for Ventures
  conditionSetIds?: string[];
  isRedemptionFor?: string; // ID of the AppliedSetback this quest is for
  createdAt?: string;
  updatedAt?: string;
}

export interface QuestGroup {
  id: string;
  name: string;
  description: string;
  icon: string;
  createdAt?: string;
  updatedAt?: string;
}

export enum QuestCompletionStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export interface QuestCompletion {
  id: string;
  questId: string;
  userId: string;
  completedAt: string; // ISO 8601 format string
  status: QuestCompletionStatus;
  note?: string;
  adminNote?: string;
  guildId?: string;
  actedById?: string;
  actedAt?: string;
  checkpointId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BulkQuestUpdates {
    isActive?: boolean;
    isOptional?: boolean;
    requiresApproval?: boolean;
    groupId?: string | null; // null to set as uncategorized
    addTags?: string[];
    removeTags?: string[];
    assignUsers?: string[];
    unassignUsers?: string[];
}