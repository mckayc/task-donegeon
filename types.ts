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
  profilePictureUrl?: string;
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
  iconType: 'emoji' | 'image';
  icon: string;
  imageUrl?: string;
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
  iconType: 'emoji' | 'image';
  icon: string;
  imageUrl?: string;
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
  groupId?: string;
  requiresApproval: boolean;
  claimedByUserIds: string[];
  dismissals: { userId: string; dismissedAt: string; }[];
  todoUserIds?: string[];
}

export interface QuestGroup {
  id: string;
  name: string;
  description: string;
  icon: string;
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
  costGroups: RewardItem[][];
  payouts?: RewardItem[];
  marketIds: string[];
  creatorId: string;
  createdAt: string;
  purchaseLimit: number | null; // null for infinite
  purchaseLimitType: 'Total' | 'PerUser';
  purchaseCount: number;
  requiresApproval: boolean;
  linkedThemeId?: string; // Links this asset to a theme that gets unlocked on purchase
}

export enum MarketConditionType {
    MinRank = 'MIN_RANK',
    DayOfWeek = 'DAY_OF_WEEK',
    DateRange = 'DATE_RANGE',
    QuestCompleted = 'QUEST_COMPLETED',
}

interface BaseMarketCondition {
    type: MarketConditionType;
}

export interface MinRankCondition extends BaseMarketCondition {
    type: MarketConditionType.MinRank;
    rankId: string;
}

export interface DayOfWeekCondition extends BaseMarketCondition {
    type: MarketConditionType.DayOfWeek;
    days: number[]; // 0 for Sunday, 6 for Saturday
}

export interface DateRangeCondition extends BaseMarketCondition {
    type: MarketConditionType.DateRange;
    start: string; // YYYY-MM-DD
    end: string;   // YYYY-MM-DD
}

export interface QuestCompletedCondition extends BaseMarketCondition {
    type: MarketConditionType.QuestCompleted;
    questId: string;
}

export type MarketCondition = MinRankCondition | DayOfWeekCondition | DateRangeCondition | QuestCompletedCondition;

export type MarketStatus =
  | { type: 'open' }
  | { type: 'closed' }
  | { type: 'conditional', conditions: MarketCondition[], logic: 'all' | 'any' }; // 'all' for AND, 'any' for OR

export interface Market {
  id:string;
  title: string;
  description: string;
  iconType: 'emoji' | 'image';
  icon: string;
  imageUrl?: string;
  guildId?: string;
  status: MarketStatus;
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
  themeId?: string;
}

export interface Rank {
  id:string;
  name: string;
  xpThreshold: number;
  iconType: 'emoji' | 'image';
  icon: string;
  imageUrl?: string;
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
    iconType: 'emoji' | 'image';
    icon: string;
    imageUrl?: string;
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
  iconType?: 'emoji' | 'image';
  icon?: string;
  imageUrl?: string;
}

export enum SystemNotificationType {
    Announcement = 'Announcement',
    QuestAssigned = 'QuestAssigned',
    TrophyAwarded = 'TrophyAwarded',
    ApprovalRequired = 'ApprovalRequired'
}

export interface SystemNotification {
    id: string;
    senderId?: string;
    message: string;
    type: SystemNotificationType;
    timestamp: string;
    recipientUserIds: string[]; // Specific users this is for
    readByUserIds: string[];
    link?: Page; // Optional link to a relevant page
    guildId?: string;
    iconType?: 'emoji' | 'image';
    icon?: string;
    imageUrl?: string;
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
  // Sidebar Links
  link_dashboard: string;
  link_quests: string;
  link_marketplace: string;
  link_calendar: string;
  link_avatar: string;
  link_collection: string;
  link_themes: string;
  link_guild: string;
  link_progress: string;
  link_trophies: string;
  link_ranks: string;
  link_chronicles: string;
  link_manage_quests: string;
  link_manage_quest_groups: string;
  link_manage_items: string;
  link_manage_markets: string;
  link_manage_rewards: string;
  link_manage_ranks: string;
  link_manage_trophies: string;
  link_theme_editor: string;
  link_approvals: string;
  link_manage_users: string;
  link_manage_guilds: string;
  link_ai_studio: string;
  link_appearance: string;
  link_object_exporter: string;
  link_asset_manager: string;
  link_backup_import: string;
  link_asset_library: string;
  link_settings: string;
  link_about: string;
  link_help_guide: string;
  link_chat: string;
}

export type Page = 'Dashboard' | 'Avatar' | 'Quests' | 'Marketplace' | 'Chronicles' | 'Guild' | 'Calendar' | 'Progress' | 'Trophies' | 'Ranks' | 'Manage Users' | 'Manage Rewards' | 'Manage Quests' | 'Manage Goods' | 'Approvals' | 'Manage Markets' | 'Manage Guilds' | 'Settings' | 'Profile' | 'About' | 'Help Guide' | 'Manage Ranks' | 'Manage Trophies' | 'Themes' | 'Data Management' | 'Collection' | 'AI Studio' | 'Appearance'
| 'Object Exporter' | 'Asset Manager' | 'Backup & Import' | 'Asset Library'
| 'Theme Editor' | 'Chat' | 'Manage Quest Groups'
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

export interface RewardValuationSettings {
  enabled: boolean;
  anchorRewardId: string; // Must be a currency ID
  exchangeRates: { [rewardTypeId: string]: number }; // Rates for ALL other rewards against the anchor
  currencyExchangeFeePercent: number;
  xpExchangeFeePercent: number;
}


export interface AppSettings {
  contentVersion: number;
  favicon: string;
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
    allowProfileEditing: boolean;
  };
  sharedMode: {
    enabled: boolean;
    quickUserSwitchingEnabled: boolean;
    allowCompletion: boolean;
    autoExit: boolean;
    autoExitMinutes: number;
    userIds: string[];
  };
  automatedBackups: {
    enabled: boolean;
    frequencyHours: number; // e.g., 24 for daily
    maxBackups: number; // e.g., 7 for a week's worth
  };
  loginNotifications: {
    enabled: boolean;
  };
  theme: string;
  terminology: Terminology;
  enableAiFeatures: boolean;
  rewardValuation: RewardValuationSettings;
  chat: {
    enabled: boolean;
    chatEmoji: string;
  };
  sidebars: {
      main: SidebarConfigItem[];
      dataManagement: SidebarConfigItem[];
  };
}

export type ShareableAssetType = 'quests' | 'rewardTypes' | 'ranks' | 'trophies' | 'markets' | 'gameAssets';

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
  '--font-display': string;
  '--font-body': string;
  '--font-size-display': string;
  '--font-size-body': string;
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

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId?: string; // For DMs
  guildId?: string; // For guild chats
  message: string;
  timestamp: string;
  readBy: string[]; // Array of user IDs who have read it
  isAnnouncement?: boolean;
}

export interface IAppData {
  users: User[];
  quests: Quest[];
  questGroups: QuestGroup[];
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
  chatMessages: ChatMessage[];
  systemNotifications: SystemNotification[];
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

export type ChronicleEvent = {
    id: string;
    date: string;
    type: 'Quest' | 'Purchase' | 'Trophy' | 'Adjustment' | 'System' | 'Announcement';
    title: string;
    note?: string;
    status: string;
    iconType?: 'emoji' | 'image';
    icon: string;
    imageUrl?: string;
    color: string;
    userId?: string; // The primary actor/user
    recipientUserIds?: string[]; // The users this event applies to (for announcements, system logs)
    questType?: QuestType;
    guildId?: string; // The scope of the event
};