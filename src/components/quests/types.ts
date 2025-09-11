
import type { RewardItem } from '../users/types';

export enum QuestType {
  Duty = 'Duty',
  Venture = 'Venture',
  Journey = 'Journey',
}

export enum QuestKind {
    Personal = 'Personal',
    Guild = 'Guild',
    GuildCollaborative = 'GuildCollaborative',
    Redemption = 'Redemption',
}

export enum QuestCompletionStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export enum QuestMediaType {
  AITeacher = 'AI_TEACHER',
  AIStory = 'AI_STORY',
  Video = 'VIDEO',
  PDF = 'PDF',
  EPUB = 'EPUB',
}

export interface Checkpoint {
  id: string;
  description: string;
  rewards: RewardItem[];
  trophyId?: string;
}

export interface Bookmark {
  label: string;
  cfi: string;
  createdAt: string;
}

// FIX: Added QuizQuestion and QuizChoice types for AI Teacher feature
export interface QuizChoice {
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  question: string;
  choices: QuizChoice[];
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  kind: QuestKind;
  mediaType?: QuestMediaType;
  aiTutorSessionMinutes?: number;
  videoUrl?: string | null;
  epubUrl?: string | null;
  pdfUrl?: string | null;
  iconType: 'emoji' | 'image';
  icon: string;
  imageUrl?: string;
  tags: string[];
  startDateTime: string | null;
  endDateTime: string | null;
  allDay: boolean;
  rrule: string | null;
  startTime: string | null;
  endTime: string | null;
  dailyCompletionsLimit?: number;
  totalCompletionsLimit?: number;
  rewards: RewardItem[];
  lateSetbacks: RewardItem[];
  incompleteSetbacks: RewardItem[];
  isActive: boolean;
  isOptional: boolean;
  assignedUserIds: string[];
  guildId?: string;
  groupIds?: string[];
  requiresApproval: boolean;
  claimedByUserIds: string[];
  dismissals: { userId: string; dismissedAt: string; }[];
  todoUserIds?: string[];
  checkpoints?: Checkpoint[];
  checkpointCompletionTimestamps?: { [userId: string]: { [checkpointId: string]: string } };
  requiresClaim?: boolean;
  claimLimit?: number;
  pendingClaims?: { userId: string; claimedAt: string; }[];
  approvedClaims?: { userId: string; claimedAt: string; approvedBy: string; approvedAt: string; }[];
  conditionSetIds?: string[];
  isRedemptionFor?: string;
  readingProgress?: { [userId: string]: { totalSeconds?: number; sessionSeconds?: number; pageNumber?: number; bookmarks?: Bookmark[]; locationCfi?: string; } };
  // FIX: Added optional properties to support GuildCollaborative quests.
  contributions?: { userId: string; timestamp: string }[];
  completionGoal?: number;
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

export interface QuestCompletion {
  id: string;
  questId: string;
  userId: string;
  completedAt: string;
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
    groupId?: string | null;
    addTags?: string[];
    removeTags?: string[];
    assignUsers?: string[];
    unassignUsers?: string[];
}