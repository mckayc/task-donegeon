
export enum Role {
  DonegeonMaster = 'Donegeon Master',
  Gatekeeper = 'Gatekeeper',
  Explorer = 'Explorer',
}

export type AppMode = {
    mode: 'personal';
} | {
    mode: 'guild';
    guildId: string;
};

export interface User {
  id: string;
  firstName: string;
  lastName:string;
  username: string;
  email: string;
  gameName: string;
  birthday: string;
  role: Role;
  avatar: { [slot: string]: string }; // Now uses GameAsset['id']
  ownedAssetIds: string[];
  pin?: string;
  password?: string;
  personalPurse: { [rewardTypeId: string]: number };
  personalExperience: { [rewardTypeId: string]: number };
  guildBalances: {
    [guildId: string]: {
      purse: { [rewardTypeId: string]: number };
      experience: { [rewardTypeId: string]: number };
    }
  };
  theme?: Theme;
  ownedThemes: Theme[];
}

export enum QuestType {
  Duty = 'Duty',
  Venture = 'Venture',
}

export enum RewardCategory {
  Currency = 'Currency',
  XP = 'XP',
}

export interface RewardTypeDefinition {
  id: string;
  name: string;
  category: RewardCategory;
  description: string;
  isCore: boolean;
  icon?: string;
}

export interface RewardItem {
  rewardTypeId: string;
  amount: number;
}

export enum QuestAvailability {
    Daily = 'Daily',
    Weekly = 'Weekly',
    Monthly = 'Monthly',
    Frequency = 'Frequency',
    Unlimited = 'Unlimited',
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  icon?: string;
  tags: string[];
  lateDateTime?: string; // For Ventures with deadlines
  incompleteDateTime?: string; // For Ventures with deadlines
  lateTime?: string; // HH:mm format for recurring Duties
  incompleteTime?: string; // HH:mm format for recurring Duties
  rewards: RewardItem[];
  lateSetbacks: RewardItem[];
  incompleteSetbacks: RewardItem[];
  isActive: boolean;
  isOptional: boolean;
  availabilityType: QuestAvailability;
  availabilityCount: number | null; // For Frequency type
  weeklyRecurrenceDays: number[]; // For Weekly type
  monthlyRecurrenceDays: number[]; // For Monthly type
  assignedUserIds: string[];
  guildId?: string;
  requiresApproval: boolean;
  claimedByUserIds: string[];
  dismissals: { userId: string; dismissedAt: string; }[];
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
  completedAt: string;
  status: QuestCompletionStatus;
  note?: string;
  guildId?: string;
}

export interface GameAsset {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  avatarSlot?: string;
  isForSale: boolean;
  cost: RewardItem[];
  marketIds: string[];
  creatorId: string;
  createdAt: string;
}

export interface Market {
  id:string;
  title: string;
  description: string;
  icon?: string;
  guildId?: string;
}

export enum PurchaseRequestStatus {
  Pending = 'Pending',
  Completed = 'Completed',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled',
}

export interface PurchaseRequest {
  id: string;
  userId: string;
  assetId: string;
  requestedAt: string;
  status: PurchaseRequestStatus;
  assetDetails: {
      name: string;
      description: string;
      cost: RewardItem[];
  };
  guildId?: string;
}

export interface Guild {
  id: string;
  name: string;
  purpose: string;
  memberIds: string[];
  isDefault?: boolean;
}

export interface Rank {
  id:string;
  name: string;
  xpThreshold: number;
  icon?: string;
}

export enum TrophyRequirementType {
    CompleteQuestType = 'COMPLETE_QUEST_TYPE',
    EarnTotalReward = 'EARN_TOTAL_REWARD',
    AchieveRank = 'ACHIEVE_RANK',
    CompleteQuestTag = 'COMPLETE_QUEST_TAG',
}

export interface TrophyRequirement {
    type: TrophyRequirementType;
    // For QuestType, this is 'Duty' or 'Venture'
    // For Reward, this is the rewardTypeId
    // For Rank, this is the rankId
    // For QuestTag, this is the tag string
    value: string; 
    count: number;
}

export interface Trophy {
    id: string;
    name: string;
    description: string;
    icon: string;
    isManual: boolean;
    requirements: TrophyRequirement[];
}

export interface UserTrophy {
    id: string;
    userId: string;
    trophyId: string;
    awardedAt: string;
    guildId?: string;
}

export enum AdminAdjustmentType {
    Reward = 'Reward',
    Setback = 'Setback',
    Trophy = 'Trophy',
}

export interface AdminAdjustment {
    id: string;
    userId: string;
    adjusterId: string;
    type: AdminAdjustmentType;
    rewards: RewardItem[];
    setbacks: RewardItem[];
    trophyId?: string;
    reason: string;
    adjustedAt: string;
    guildId?: string;
}

export interface SystemLog {
    id: string;
    timestamp: string;
    type: 'QUEST_LATE' | 'QUEST_INCOMPLETE';
    questId: string;
    userIds: string[];
    setbacksApplied: RewardItem[];
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'trophy';
  icon?: string;
}

export type Theme = 'emerald' | 'rose' | 'sky' | 'arcane' | 'cartoon' | 'forest' | 'ocean' | 'vulcan' | 'royal' | 'winter' | 'sunset' | 'cyberpunk' | 'steampunk' | 'parchment' | 'eerie';

export interface Terminology {
  appName: string;
  // Singular
  task: string;
  recurringTask: string;
  singleTask: string;
  store: string;
  history: string;
  group: string;
  level: string;
  award: string;
  point: string;
  xp: string;
  currency: string;
  negativePoint: string;
  // Plural
  tasks: string;
  recurringTasks: string;
  singleTasks: string;
  shoppingCenter: string;
  stores: string;
  groups: string;
  levels: string;
  awards: string;
  points: string;
  negativePoints: string;
  // Roles
  admin: string;
  moderator: string;
  user: string;
}


export interface AppSettings {
  forgivingSetbacks: boolean;
  vacationMode: {
    enabled: boolean;
    startDate?: string;
    endDate?: string;
  };
  questDefaults: {
    requiresApproval: boolean;
    isOptional: boolean;
    isActive: boolean;
  };
  theme: Theme;
  terminology: Terminology;
}

export type Page = 'Dashboard' | 'Avatar' | 'Quests' | 'Marketplace' | 'Chronicles' | 'Guild' | 'Calendar' | 'Progress' | 'Trophies' | 'Ranks' | 'Manage Users' | 'Rewards' | 'Manage Quests' | 'Approvals' | 'Manage Markets' | 'Manage Guilds' | 'Settings' | 'Profile' | 'About' | 'Help' | 'Manage Ranks' | 'Manage Trophies' | 'Themes' | 'Data Management' | 'Collection';

export type ShareableAssetType = 'quests' | 'rewardTypes' | 'ranks' | 'trophies' | 'markets';

export interface BlueprintAssets {
  quests: Quest[];
  rewardTypes: RewardTypeDefinition[];
  ranks: Rank[];
  trophies: Trophy[];
  markets: Market[];
}

export interface Blueprint {
  name: string;
  author: string;
  description: string;
  version: 1;
  exportedAt: string;
  assets: BlueprintAssets;
}

export interface IAppData {
  users: User[];
  currentUser: User | null;
  quests: Quest[];
  markets: Market[];
  rewardTypes: RewardTypeDefinition[];
  questCompletions: QuestCompletion[];
  purchaseRequests: PurchaseRequest[];
  guilds: Guild[];
  ranks: Rank[];
  trophies: Trophy[];
  userTrophies: UserTrophy[];
  adminAdjustments: AdminAdjustment[];
  gameAssets: GameAsset[];
  systemLogs: SystemLog[];
  appMode: AppMode;
  settings: AppSettings;
}

export interface ImportResolution {
  type: ShareableAssetType;
  id: string; // Original ID from blueprint
  name: string;
  status: 'new' | 'conflict';
  resolution: 'skip' | 'rename' | 'keep';
  newName?: string;
}