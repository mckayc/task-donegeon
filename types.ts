
import { GenerateContentResponse } from "@google/genai";


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
  pin: string;
  password?: string;
  personalPurse: { [rewardTypeId: string]: number };
  personalExperience: { [rewardTypeId: string]: number };
  guildBalances: {
    [guildId: string]: {
      purse: { [rewardTypeId: string]: number };
      experience: { [rewardTypeId: string]: number };
    }
  };
  theme?: string; // Theme ID
  ownedThemes: string[]; // Array of Theme IDs
  hasBeenOnboarded?: boolean;
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
  todoUserIds?: string[];
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
  guildId?: string;
}

export interface GameAsset {
  id: string;
  name: string;
  description: string;
  url: string;
  icon?: string;
  category: string;
  avatarSlot?: string;
  isForSale: boolean;
  cost: RewardItem[];
  marketIds: string[];
  creatorId: string;
  createdAt: string;
  purchaseLimit: number | null; // null for infinite
  purchaseCount: number;
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

export type Page = 'Dashboard' | 'Avatar' | 'Quests' | 'Marketplace' | 'Chronicles' | 'Guild' | 'Calendar' | 'Progress' | 'Trophies' | 'Ranks' | 'Manage Users' | 'Manage Rewards' | 'Manage Quests' | 'Manage Items' | 'Approvals' | 'Manage Markets' | 'Manage Guilds' | 'Settings' | 'Profile' | 'About' | 'Help Guide' | 'Manage Ranks' | 'Manage Trophies' | 'Themes' | 'Data Management' | 'Collection' | 'AI Studio' | 'Appearance'
| 'Object Manager' | 'Asset Manager' | 'Backup & Import' | 'Asset Library'
| 'Theme Editor'
;

export interface SidebarLink {
  type: 'link';
  id: Page;
  emoji: string;
  isVisible: boolean;
  level: number; // 0 for top-level, 1 for nested, etc.
  role: Role;
  termKey?: keyof Terminology;
}

export interface SidebarHeader {
    type: 'header';
    title: string;
    id: string; // Unique ID for key prop
    level: 0; // Headers are always top-level
    role: Role; // For visibility filtering
    isVisible: boolean;
}

export type SidebarConfigItem = SidebarLink | SidebarHeader;

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
  security: {
    requirePinForUsers: boolean;
    requirePasswordForAdmin: boolean;
  };
  sharedMode: {
    enabled: boolean;
    quickUserSwitchingEnabled: boolean;
    allowCompletion: boolean;
    autoExit: boolean;
    autoExitMinutes: number;
    userIds: string[];
  };
  theme: string;
  terminology: Terminology;
  enableAiFeatures: boolean;
  sidebars: {
      main: SidebarConfigItem[];
      dataManagement: SidebarConfigItem[];
  };
}

export type ShareableAssetType = 'quests' | 'rewardTypes' | 'ranks' | 'trophies' | 'markets';

export interface BlueprintAssets {
  quests: Quest[];
  rewardTypes: RewardTypeDefinition[];
  ranks: Rank[];
  trophies: Trophy[];
  markets: Market[];
  gameAssets: GameAsset[];
}

export interface Blueprint {
  name: string;
  author: string;
  description: string;
  version: 1;
  exportedAt: string;
  assets: BlueprintAssets;
}

export interface ImportResolution {
  type: ShareableAssetType;
  id: string; // Original ID from blueprint
  name: string;
  status: 'new' | 'conflict';
  resolution: 'skip' | 'rename' | 'keep';
  newName?: string;
}

export interface ThemeStyle {
  '--font-h1': string;
  '--font-size-h1': string;
  '--font-p': string;
  '--font-size-p': string;
  '--font-span': string;
  '--font-size-span': string;
  '--font-button': string;
  '--font-size-button': string;
  '--color-bg-primary': string;
  '--color-bg-secondary': string;
  '--color-bg-tertiary': string;
  '--color-text-primary': string;
  '--color-text-secondary': string;
  '--color-border': string;
  '--color-primary-hue': string;
  '--color-primary-saturation': string;
  '--color-primary-lightness': string;
  '--color-accent-hue': string;
  '--color-accent-saturation': string;
  '--color-accent-lightness': string;
  '--color-accent-light-hue': string;
  '--color-accent-light-saturation': string;
  '--color-accent-light-lightness': string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  isCustom: boolean;
  styles: ThemeStyle;
}

export type Theme = ThemeDefinition;

export interface IAppData {
  users: User[];
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
  settings: AppSettings;
  themes: ThemeDefinition[];
  loginHistory: string[];
}

export type LibraryPackType = 'Quests' | 'Items' | 'Markets' | 'Trophies' | 'Rewards';

export interface LibraryPack {
  id: string;
  type: LibraryPackType;
  title: string;
  description: string;
  emoji: string;
  color: string;
  assets: Partial<BlueprintAssets>;
}
