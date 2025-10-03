import type { RewardItem } from '../rewards/types';
import type { AITutorSessionLog } from '../tutors/types';

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

export enum QuestMediaType {
  AITutor = 'AITutor',
  AIStory = 'AIStory',
  Video = 'Video',
  PDF = 'PDF',
  Images = 'Images',
  PlayMiniGame = 'PlayMiniGame',
}

export interface ImageSlide {
  url: string;
  caption: string;
}

export interface QuestVideo {
  id: string;
  url: string;
  title: string;
  description?: string;
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

export interface QuestTimerConfig {
    mode: 'stopwatch' | 'countdown';
    durationSeconds?: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  kind: QuestKind;
  mediaType?: QuestMediaType;
  aiTutorId?: string;
  videos?: QuestVideo[] | null;
  pdfUrl?: string | null;
  images?: ImageSlide[];
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
  completionGoal?: number;
  checkpoints?: Checkpoint[];
  checkpointCompletionTimestamps?: { [userId: string]: { [checkpointId: string]: string } };
  contributions?: { userId: string, contributedAt: string }[];

  requiresClaim?: boolean;
  claimLimit?: number;
  pendingClaims?: { userId: string; claimedAt: string; }[];
  approvedClaims?: { userId: string; claimedAt: string; approvedBy: string; approvedAt: string; }[];

  rewards: RewardItem[];
  lateSetbacks: RewardItem[];
  incompleteSetbacks: RewardItem[];
  allowSetbackSubstitution?: boolean;
  isActive: boolean;
  isOptional: boolean;
  assignedUserIds: string[];
  guildId?: string;
  groupIds?: string[];
  requiresApproval: boolean;
  claimedByUserIds: string[];
  dismissals: { userId: string; dismissedAt: string; }[];
  todoUserIds?: string[];
  timerConfig?: QuestTimerConfig;
  conditionSetIds?: string[];
  isRedemptionFor?: string;
  readingProgress?: { [userId: string]: { totalSeconds?: number; sessionSeconds?: number; pageNumber?: number; bookmarks?: Bookmark[]; locationCfi?: string; } };
  
  minigameId?: string;
  minigameMinScore?: number;
  
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
  timerDurationSeconds?: number;
  aiTutorSessionLog?: AITutorSessionLog;
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