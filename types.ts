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
  aboutMe?: string;
  adminNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export enum QuestType {
  Duty = 'Duty',
  Venture = 'Venture',
}

export enum QuestKind {
    Personal = 'Personal', // Personal scope, personal rewards
    Guild = 'Guild', // Guild scope, but each person completes it for themselves
    GuildCollaborative = 'GuildCollaborative', // Guild scope, requires multiple people to complete
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
  // How many units of the real-world currency are equal to 1 unit of this reward.
  baseValue: number; 
  createdAt?: string;
  updatedAt?: string;
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
  kind: QuestKind; // New field to distinguish quest types
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
  
  availabilityCount: number | null; // For Ventures that can be completed multiple times.
  completionGoal?: number; // For collaborative quests
  contributions?: { userId: string, contributedAt: string }[]; // For collaborative quests

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
  todoUserIds?: string[];
  nextQuestId?: string; // ID of the quest unlocked by this one
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
  guildId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GameAsset {
  id: string;
  name: string;
  description: string;
  iconType: 'emoji' | 'image';
  icon: string;
  imageUrl?: string;
  category: string;
  avatarSlot?: string;
  isForSale: boolean;
  costGroups: RewardItem[][];
  payouts?: RewardItem[];
  marketIds: string[];
  creatorId: string;
  createdAt: string;
  updatedAt?: string;
  purchaseLimit: number | null; // null for infinite
  purchaseLimitType: 'Total' | 'PerUser';
  purchaseCount: number;
  useCount?: number;
  requiresApproval: boolean;
  linkedThemeId?: string; // Links this asset to a theme that gets unlocked on purchase
  recipe?: {
    ingredients: {
      assetId: string;
      quantity: number;
    }[];
  };
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
  createdAt?: string;
  updatedAt?: string;
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
  actedAt?: string;
  actedById?: string; // ID of the user who approved, rejected, or cancelled.
  status: PurchaseRequestStatus;
  assetDetails: {
      name: string;
      description: string;
      cost: RewardItem[];
  };
  guildId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Guild {
  id: string;
  name: string;
  purpose: string;
  memberIds: string[];
  isDefault?: boolean;
  themeId?: string;
  treasury: {
    purse: { [rewardTypeId: string]: number };
    ownedAssetIds: string[];
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Rank {
  id:string;
  name: string;
  xpThreshold: number;
  iconType: 'emoji' | 'image';
  icon: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

export enum TrophyRequirementType {
    CompleteQuestType = 'COMPLETE_QUEST_TYPE',
    CompleteQuestTag = 'COMPLETE_QUEST_TAG',
    AchieveRank = 'ACHIEVE_RANK',
    QuestCompleted = 'QUEST_COMPLETED',
}

interface BaseTrophyRequirement {
    type: TrophyRequirementType;
    count: number;
}
export interface CompleteQuestTypeRequirement extends BaseTrophyRequirement {
    type: TrophyRequirementType.CompleteQuestType;
    value: QuestType;
}
export interface CompleteQuestTagRequirement extends BaseTrophyRequirement {
    type: TrophyRequirementType.CompleteQuestTag;
    value: string; // tag name
}
export interface AchieveRankRequirement extends BaseTrophyRequirement {
    type: TrophyRequirementType.AchieveRank;
    value: string; // rankId
}

export interface QuestCompletedRequirement extends BaseTrophyRequirement {
    type: TrophyRequirementType.QuestCompleted;
    value: string; // questId
}

export type TrophyRequirement = CompleteQuestTypeRequirement | CompleteQuestTagRequirement | AchieveRankRequirement | QuestCompletedRequirement;

export interface UserTrophy {
  id: string;
  userId: string;
  trophyId: string;
  awardedAt: string; // ISO 8601 format string
  guildId?: string;
  createdAt?: string;
  updatedAt?: string;
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
    createdAt?: string;
    updatedAt?: string;
}
export interface SystemLog {
    id: string;
    timestamp: string;
    type: 'QUEST_LATE' | 'QUEST_INCOMPLETE';
    questId: string;
    userIds: string[];
    setbacksApplied: RewardItem[];
    createdAt?: string;
    updatedAt?: string;
}

export type Page =
  | 'Dashboard'
  | 'Avatar'
  | 'Collection'
  | 'Themes'
  | 'Quests'
  | 'Marketplace'
  | 'Calendar'
  | 'Progress'
  | 'Trophies'
  | 'Ranks'
  | 'Chronicles'
  | 'Guild'
  | 'Manage Users'
  | 'Manage Rewards'
  | 'Manage Quests'
  | 'Manage Quest Groups'
  | 'Manage Rotations'
  | 'Manage Goods'
  | 'Manage Markets'
  | 'Manage Guilds'
  | 'Manage Ranks'
  | 'Manage Trophies'
  | 'Manage Events'
  | 'Manage Setbacks'
  | 'Suggestion Engine'
  | 'Approvals'
  | 'Settings'
  | 'Appearance'
  | 'Object Exporter'
  | 'Asset Manager'
  | 'Backup & Import'
  | 'Asset Library'
  | 'Profile'
  | 'About'
  | 'Help Guide'
  | 'Chat'
  | 'Bug Tracker';

export type ThemeStyle = {
  [key: string]: string;
};

export interface ThemeDefinition {
  id: string;
  name: string;
  isCustom: boolean;
  styles: ThemeStyle;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId?: string;
  guildId?: string;
  message: string;
  timestamp: string; // ISO string
  readBy: string[];
  isAnnouncement?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export enum SystemNotificationType {
    Announcement = 'Announcement',
    QuestAssigned = 'QuestAssigned',
    TrophyAwarded = 'TrophyAwarded',
    ApprovalRequired = 'ApprovalRequired',
}

export interface SystemNotification {
  id: string;
  senderId?: string;
  message: string;
  type: SystemNotificationType;
  timestamp: string; // ISO string
  recipientUserIds: string[];
  readByUserIds: string[];
  link?: Page;
  guildId?: string;
  iconType?: 'emoji' | 'image';
  icon?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type EventType = 'Announcement' | 'Vacation' | 'BonusXP' | 'MarketSale';

export interface ScheduledEvent {
  id: string;
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isAllDay: boolean;
  eventType: EventType;
  guildId?: string;
  icon?: string;
  color?: string;
  modifiers: {
    // For BonusXP
    xpMultiplier?: number;
    affectedRewardIds?: string[];
    // For MarketSale
    marketId?: string;
    assetIds?: string[];
    discountPercent?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export type BackupSchedule = {
  id: string;
  frequency: number;
  unit: 'hours' | 'days' | 'weeks';
  maxBackups: number;
  lastBackupTimestamp?: number;
}

export interface AppSettings {
  contentVersion: number;
  favicon: string;
  forgivingSetbacks: boolean;
  questDefaults: {
    requiresApproval: boolean;
    isOptional: boolean;
    isActive: boolean;
  };
  security: {
    requirePinForUsers: boolean;
    requirePasswordForAdmin: boolean;
    allowProfileEditing: boolean;
    allowAdminSelfApproval: boolean;
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
    schedules: BackupSchedule[];
    format: 'json' | 'sqlite' | 'both';
  };
  loginNotifications: {
    enabled: boolean;
  };
  theme: string;
  terminology: Terminology;
  enableAiFeatures: boolean;
  rewardValuation: {
    enabled: boolean;
    realWorldCurrency: string;
    currencyExchangeFeePercent: number;
    xpExchangeFeePercent: number;
  };
  chat: {
    enabled: boolean;
    chatEmoji: string;
  };
  sidebars: {
    main: SidebarConfigItem[];
  };
  googleCalendar: {
    enabled: boolean;
    apiKey: string;
    calendarId: string;
  };
  developerMode: {
    enabled: boolean;
  };
}

export type SidebarLink = {
  type: 'link';
  id: Page;
  emoji: string;
  isVisible: boolean;
  level: number;
  role: Role;
  termKey?: keyof Terminology;
};

export type SidebarHeader = {
  type: 'header';
  id: string;
  title: string;
  emoji?: string;
  isVisible: boolean;
  level: number;
  role: Role;
};
export type SidebarSeparator = { type: 'separator', id: string, level: number, role: Role, isVisible: boolean };
export type SidebarConfigItem = SidebarLink | SidebarHeader | SidebarSeparator;


export interface Terminology {
    appName: string;
    task: string;
    tasks: string;
    recurringTask: string;
    recurringTasks: string;
    singleTask: string;
    singleTasks: string;
    shoppingCenter: string;
    store: string;
    stores: string;
    history: string;
    group: string;
    groups: string;
    level: string;
    levels: string;
    award: string;
    awards: string;
    point: string;
    points: string;
    xp: string;
    currency: string;
    negativePoint: string;
    negativePoints: string;
    admin: string;
    moderator: string;
    user: string;
    [key: `link_${string}`]: string;
}

export type ShareableAssetType = 'quests' | 'questGroups' | 'rewardTypes' | 'ranks' | 'trophies' | 'markets' | 'gameAssets' | 'users' | 'rotations' | 'setbackDefinitions';

export interface AssetPackAssets {
    quests?: Quest[];
    questGroups?: QuestGroup[];
    rewardTypes?: RewardTypeDefinition[];
    ranks?: Rank[];
    trophies?: Trophy[];
    markets?: Market[];
    gameAssets?: GameAsset[];
    users?: UserTemplate[];
}

export interface AssetPack {
  manifest: {
    id: string;
    name: string;
    author: string;
    version: string;
    description: string;
    emoji?: string;
    category?: string;
  };
  assets: AssetPackAssets;
}

export interface UserTemplate extends Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'> {}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'trophy';
  message: string;
  duration?: number; // in ms, 0 for persistent
  icon?: string; // for trophy notifications
}

export interface BackupInfo {
  filename: string;
  size: number;
  createdAt: number; // timestamp
  parsed: {
    date: string; // ISO string
    version: string;
    type: 'manual' | string; // e.g. 'auto-daily'
    format: 'json' | 'sqlite';
  } | null;
}

export interface AssetPackManifestInfo {
  manifest: AssetPack['manifest'];
  filename: string;
  summary: {
    quests: { title: string; icon: string }[];
    gameAssets: { name: string; icon: string }[];
    trophies: { name: string; icon: string }[];
    users: { gameName: string; role: Role }[];
    markets: { title: string; icon: string }[];
    ranks: { name: string; icon: string }[];
    rewardTypes: { name: string; icon: string }[];
    questGroups: { name: string; icon: string }[];
  };
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
  themes: ThemeDefinition[];
  chatMessages: ChatMessage[];
  systemNotifications: SystemNotification[];
  scheduledEvents: ScheduledEvent[];
  settings: AppSettings;
  loginHistory: string[];
  bugReports: BugReport[];
  rotations: Rotation[];
  setbackDefinitions: SetbackDefinition[];
  appliedSetbacks: AppliedSetback[];
  tradeOffers: TradeOffer[];
  gifts: Gift[];
}

export interface ImportResolution {
    type: ShareableAssetType;
    id: string;
    name: string;
    status: 'new' | 'conflict';
    resolution: 'keep' | 'skip' | 'rename';
    newName?: string;
    selected: boolean;
}

export interface ChronicleEvent {
  id: string;
  originalId: string;
  date: string;
  type: 'Quest' | 'Purchase' | 'Trophy' | 'Adjustment' | 'System' | 'Gift' | 'Trade';
  title: string;
  status: any;
  note?: string;
  icon: string;
  color: string;
  userId?: string;
  actorName?: string;
  guildId?: string | null;
}

export interface SystemStatus {
  geminiConnected: boolean;
  database: {
    connected: boolean;
    isCustomPath: boolean;
  };
  jwtSecretSet: boolean;
}
export enum BugReportType {
  Bug = 'Bug Report',
  Feature = 'Feature Request',
  Feedback = 'UI/UX Feedback',
  Content = 'Content Suggestion',
}
export type BugReportStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface BugReportLogEntry {
  timestamp: string;
  type: 'ACTION' | 'NAVIGATION' | 'STATE_CHANGE' | 'NOTE' | 'ELEMENT_PICK' | 'COMMENT';
  message: string;
  element?: {
    tag: string;
    id?: string;
    classes?: string;
    text?: string;
  };
  author?: string;
  isDimmed?: boolean;
  lastCopiedAt?: string;
}

export interface BugReport {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  status: BugReportStatus;
  tags: string[];
  logs: BugReportLogEntry[];
}

export interface Rotation {
    id: string;
    name: string;
    description: string;
    questIds: string[];
    userIds: string[];
    frequency: 'DAILY' | 'WEEKLY';
    activeDays: number[]; // 0 for Sunday, 6 for Saturday
    lastAssignmentDate: string | null; // YYYY-MM-DD
    lastUserIndex: number;
    lastQuestIndex: number;
    createdAt?: string;
    updatedAt?: string;
}

export enum SetbackEffectType {
    DeductRewards = 'DEDUCT_REWARDS',
    CloseMarket = 'CLOSE_MARKET',
}

interface BaseSetbackEffect {
    type: SetbackEffectType;
}

export interface DeductRewardsEffect extends BaseSetbackEffect {
    type: SetbackEffectType.DeductRewards;
    rewards: RewardItem[];
}

export interface CloseMarketEffect extends BaseSetbackEffect {
    type: SetbackEffectType.CloseMarket;
    marketIds: string[];
    durationHours: number;
}

export type SetbackEffect = DeductRewardsEffect | CloseMarketEffect;

export interface SetbackDefinition {
    id: string;
    name: string;
    description: string;
    icon: string;
    effects: SetbackEffect[];
    createdAt?: string;
    updatedAt?: string;
}

export interface AppliedSetback {
    id: string;
    userId: string;
    setbackDefinitionId: string;
    appliedAt: string;
    expiresAt: string | null;
    reason: string;
    appliedById: string; // User ID of the admin who applied it
    createdAt?: string;
    updatedAt?: string;
}

export enum TradeStatus {
  Pending = 'Pending',
  OfferUpdated = 'OfferUpdated',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  Rejected = 'Rejected',
}

export interface TradeOffer {
  id: string;
  initiatorId: string;
  recipientId: string;
  guildId: string;
  status: TradeStatus;
  initiatorOffer: {
    assetIds: string[];
    rewards: RewardItem[];
  };
  recipientOffer: {
    assetIds: string[];
    rewards: RewardItem[];
  };
  initiatorLocked: boolean;
  recipientLocked: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Gift {
  id: string;
  senderId: string;
  recipientId: string;
  assetId: string;
  sentAt: string;
  guildId?: string;
  createdAt?: string;
  updatedAt?: string;
}