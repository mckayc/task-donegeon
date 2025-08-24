// --- From components/users/types.ts ---
export enum Role {
  DonegeonMaster = 'Donegeon Master',
  Gatekeeper = 'Gatekeeper',
  Explorer = 'Explorer',
}

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

export type UserTemplate = Omit<User, 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>;

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
    rewards: { rewardTypeId: string; amount: number; }[];
    setbacks: { rewardTypeId: string; amount: number; }[];
    trophyId?: string;
    reason: string;
    adjustedAt: string;
    guildId?: string;
    createdAt?: string;
    updatedAt?: string;
}

// --- From components/ranks/types.ts ---
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

// --- From components/quests/types.ts ---
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
export interface Checkpoint {
  id: string;
  description: string;
  rewards: RewardItem[];
  trophyId?: string;
}
export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  kind: QuestKind;
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
  isRedemptionFor?: string;
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
  completedAt: string;
  status: QuestCompletionStatus;
  note?: string;
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

// --- From components/items/types.ts ---
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
  baseValue: number; 
  createdAt?: string;
  updatedAt?: string;
}
export interface RewardItem {
  rewardTypeId: string;
  amount: number;
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
  purchaseLimit: number | null;
  purchaseLimitType: 'Total' | 'PerUser';
  purchaseCount: number;
  useCount?: number;
  requiresApproval: boolean;
  linkedThemeId?: string;
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
    days: number[];
}
export interface DateRangeCondition extends BaseMarketCondition {
    type: MarketConditionType.DateRange;
    start: string;
    end: string;
}
export interface QuestCompletedCondition extends BaseMarketCondition {
    type: MarketConditionType.QuestCompleted;
    questId: string;
}
export type MarketCondition = MinRankCondition | DayOfWeekCondition | DateRangeCondition | QuestCompletedCondition;
export type MarketStatus =
  | { type: 'open' }
  | { type: 'closed' }
  | { type: 'conditional', conditions: MarketCondition[], logic: 'all' | 'any' };
export type MarketOpenStatus = {
    isOpen: true;
    discountPercent?: number;
} | {
    isOpen: false;
    reason: 'SETBACK' | 'CLOSED' | 'CONDITIONAL';
    message: string;
    redemptionQuest?: Quest;
};
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
  actedById?: string;
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

// --- From components/trophies/types.ts ---
export enum TrophyRequirementType {
    CompleteQuestType = 'COMPLETE_QUEST_TYPE',
    EarnTotalReward = 'EARN_TOTAL_REWARD',
    AchieveRank = 'ACHIEVE_RANK',
    CompleteQuestTag = 'COMPLETE_QUEST_TAG',
    QuestCompleted = 'QUEST_COMPLETED',
}
export interface TrophyRequirement {
    type: TrophyRequirementType;
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
    createdAt?: string;
    updatedAt?: string;
}
export interface UserTrophy {
    id: string;
    userId: string;
    trophyId: string;
    awardedAt: string;
    guildId?: string;
    createdAt?: string;
    updatedAt?: string;
}

// --- From components/rotations/types.ts ---
export interface Rotation {
  id: string;
  name: string;
  description: string;
  questIds: string[];
  userIds: string[];
  activeDays: number[];
  frequency: 'DAILY' | 'WEEKLY';
  lastAssignmentDate: string | null;
  lastUserIndex: number;
  lastQuestStartIndex: number;
  questsPerUser: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// --- From components/guilds/types.ts ---
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

// --- From components/modifiers/types.ts ---
export enum ModifierEffectType {
  DeductRewards = 'DEDUCT_REWARDS',
  CloseMarket = 'CLOSE_MARKET',
  GrantRewards = 'GRANT_REWARDS',
  OpenMarket = 'OPEN_MARKET',
  MarketDiscount = 'MARKET_DISCOUNT',
}
export type ModifierEffect = 
  | { type: ModifierEffectType.DeductRewards; rewards: RewardItem[] }
  | { type: ModifierEffectType.CloseMarket; marketIds: string[]; durationHours: number }
  | { type: ModifierEffectType.GrantRewards; rewards: RewardItem[] }
  | { type: ModifierEffectType.OpenMarket; marketIds: string[]; durationHours: number }
  | { type: ModifierEffectType.MarketDiscount; marketId: string; discountPercent: number; durationHours: number };
export interface ModifierDefinition {
  id: string;
  category: 'Triumph' | 'Trial';
  name: string;
  description: string;
  icon: string;
  effects: ModifierEffect[];
  defaultRedemptionQuestId?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface AppliedModifier {
  id: string;
  userId: string;
  modifierDefinitionId: string;
  appliedAt: string;
  expiresAt?: string;
  status: 'Active' | 'Completed' | 'Dismissed';
  redemptionQuestId?: string;
  resolvedAt?: string;
  resolvedById?: string;
  resolutionNote?: string;
  overrides?: Partial<ModifierDefinition>;
  reason: string;
  appliedById: string;
  createdAt?: string;
  updatedAt?: string;
}

// --- From components/events/types.ts ---
export interface ScheduledEvent {
    id: string;
    title: string;
    description: string;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    isAllDay: boolean;
    eventType: 'Announcement' | 'BonusXP' | 'MarketSale' | 'Vacation';
    guildId?: string;
    icon?: string;
    color?: string;
    modifiers: {
        xpMultiplier?: number;
        affectedRewardIds?: string[];
        marketId?: string;
        assetIds?: string[];
        discountPercent?: number;
    };
    createdAt?: string;
    updatedAt?: string;
}

// --- From components/system/types.ts ---
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
export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'trophy';
  iconType?: 'emoji' | 'image';
  icon?: string;
  imageUrl?: string;
  duration?: number;
}
export enum SystemNotificationType {
    Announcement = 'Announcement',
    QuestAssigned = 'QuestAssigned',
    TrophyAwarded = 'TrophyAwarded',
    ApprovalRequired = 'ApprovalRequired',
    GiftReceived = 'GiftReceived',
    TradeRequestReceived = 'TradeRequestReceived',
    TradeAccepted = 'TradeAccepted',
    TradeCancelled = 'TradeCancelled',
    TradeRejected = 'TradeRejected',
}
export interface SystemNotification {
    id: string;
    senderId?: string;
    message: string;
    type: SystemNotificationType;
    timestamp: string;
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

// --- From components/sharing/types.ts ---
export type ShareableAssetType = 'quests' | 'rewardTypes' | 'ranks' | 'trophies' | 'markets' | 'gameAssets' | 'questGroups' | 'users' | 'rotations' | 'modifierDefinitions';
export interface AssetPackAssets {
  quests?: Quest[];
  questGroups?: QuestGroup[];
  rewardTypes?: RewardTypeDefinition[];
  ranks?: Rank[];
  trophies?: Trophy[];
  markets?: Market[];
  gameAssets?: GameAsset[];
  users?: UserTemplate[];
  rotations?: Rotation[];
  modifierDefinitions?: ModifierDefinition[];
}
export interface AssetPackManifest {
  id: string;
  name: string;
  author: string;
  version: string;
  description: string;
  emoji?: string;
  category?: string;
}
export interface AssetPack {
  manifest: AssetPackManifest;
  assets: AssetPackAssets;
}
export interface AssetPackSummary {
    quests: { title: string; icon: string; description: string; emoji?: string; }[];
    gameAssets: { name: string; icon?: string; description: string; emoji?: string; }[];
    trophies: { name: string; icon: string; description: string; emoji?: string; }[];
    users: { gameName: string; role: Role; }[];
    markets: { title: string; icon: string; description: string; emoji?: string; }[];
    ranks: { name: string; icon: string }[];
    rewardTypes: { name: string; icon: string; description: string; emoji?: string; }[];
    questGroups: { name: string; icon: string; description: string; emoji?: string; }[];
}
export interface AssetPackManifestInfo {
  manifest: AssetPackManifest;
  filename: string;
  summary: AssetPackSummary;
}
export interface ImportResolution {
  type: ShareableAssetType;
  id: string;
  name: string;
  status: 'new' | 'conflict';
  resolution: 'skip' | 'rename' | 'keep';
  newName?: string;
  selected?: boolean;
}
export interface BackupInfo {
    filename: string;
    size: number;
    createdAt: string;
    parsed: {
        date: string;
        version: string;
        type: string;
        format: 'json' | 'sqlite';
    } | null;
}

// --- From components/themes/types.ts ---
export interface ThemeStyle {
  '--font-display': string;
  '--font-body': string;
  '--font-label': string;
  '--font-size-h1': string;
  '--font-size-h2': string;
  '--font-size-h3': string;
  '--font-size-body': string;
  '--font-size-label': string;
  '--color-bg-primary-hsl': string;
  '--color-bg-secondary-hsl': string;
  '--color-bg-tertiary-hsl': string;
  '--color-text-primary-hsl': string;
  '--color-text-secondary-hsl': string;
  '--color-border-hsl': string;
  '--color-primary-hue': string;
  '--color-primary-saturation': string;
  '--color-primary-lightness': string;
  '--color-accent-hue': string;
  '--color-accent-saturation': string;
  '--color-accent-lightness': string;
  '--color-accent-light-hue': string;
  '--color-accent-light-saturation': string;
  '--color-accent-light-lightness': string;
  '--color-text-muted-hsl'?: string;
  '--input-bg-hsl'?: string;
  '--button-radius'?: string;
}
export interface ThemeDefinition {
  id: string;
  name: string;
  isCustom: boolean;
  styles: ThemeStyle;
  createdAt?: string;
  updatedAt?: string;
}
// --- From components/chat/types.ts ---
export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId?: string;
  guildId?: string;
  message: string;
  timestamp: string;
  readBy: string[];
  isAnnouncement?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// --- From components/dev/types.ts ---
export type BugReportStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export enum BugReportType {
    Bug = 'Bug Report',
    Feature = 'Feature Request',
    Feedback = 'UI/UX Feedback',
    Content = 'Content Suggestion',
}
export interface BugReportLogEntry {
  timestamp: string;
  type: 'ACTION' | 'NOTE' | 'NAVIGATION' | 'STATE_CHANGE' | 'ELEMENT_PICK' | 'COMMENT';
  message: string;
  author?: string;
  element?: {
    tag: string;
    id?: string;
    classes?: string;
    text?: string;
  };
  lastCopiedAt?: string;
  isDimmed?: boolean;
  commentStatus?: 'good' | 'review';
}
export interface BugReport {
  id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
  status: BugReportStatus;
  tags: string[];
  logs: BugReportLogEntry[];
}

// --- From components/trading/types.ts ---
export enum TradeStatus {
    Pending = 'Pending',
    OfferUpdated = 'OfferUpdated',
    AcceptedByInitiator = 'AcceptedByInitiator',
    AcceptedByRecipient = 'AcceptedByRecipient',
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
    guildId: string;
    sentAt: string;
    createdAt?: string;
    updatedAt?: string;
}

// --- From components/chronicles/types.ts ---
export type ChronicleEvent = {
    id: string;
    originalId: string;
    date: string;
    type: 'Quest' | 'Purchase' | 'Trophy' | 'Adjustment' | 'System' | 'Announcement' | 'ScheduledEvent' | 'Crafting' | 'Donation' | 'Gift' | 'Trade' | 'Triumph' | 'Trial' | 'Checkpoint';
    title: string;
    note?: string;
    status: string;
    iconType?: 'emoji' | 'image';
    icon: string;
    imageUrl?: string;
    color: string;
    userId?: string;
    actorName?: string;
    recipientUserIds?: string[];
    questType?: QuestType;
    guildId?: string;
};

// --- From src/types/app.ts ---
export type AppMode = {
    mode: 'personal';
} | {
    mode: 'guild';
    guildId: string;
};
export interface Terminology {
  appName: string;
  task: string; tasks: string; recurringTask: string; recurringTasks: string;
  singleTask: string; singleTasks: string; journey: string; journeys: string;
  store: string; stores: string; shoppingCenter: string;
  history: string; group: string; groups: string;
  level: string; levels: string; award: string; awards: string;
  point: string; points: string; xp: string; currency: string;
  negativePoint: string; negativePoints: string;
  admin: string; moderator: string; user: string;
  link_dashboard: string; link_quests: string; link_marketplace: string;
  link_calendar: string; link_avatar: string; link_collection: string;
  link_guild: string; link_progress: string; link_trophies: string;
  link_ranks: string; link_chronicles: string; link_manage_quests: string;
  link_manage_quest_groups: string; link_manage_items: string; link_manage_markets: string;
  link_manage_rewards: string; link_manage_ranks: string; link_manage_trophies: string;
  link_manage_events: string; link_manage_rotations: string; link_triumphs_trials: string;
  link_appearance: string; link_approvals: string; link_manage_users: string;
  link_manage_guilds: string; link_suggestion_engine: string; link_object_exporter: string;
  link_asset_manager: string; link_backup_import: string; link_asset_library: string;
  link_settings: string; link_about: string; link_help_guide: string;
  link_chat: string; link_bug_tracker: string; link_themes: string; link_test_cases: string;
}
export type Page = 'Dashboard' | 'Avatar' | 'Quests' | 'Marketplace' | 'Chronicles' | 'Guild' | 'Calendar' | 'Progress' | 'Trophies' | 'Ranks' | 'Manage Users' | 'Manage Rewards' | 'Manage Quests' | 'Manage Goods' | 'Approvals' | 'Manage Markets' | 'Manage Guilds' | 'Settings' | 'Profile' | 'About' | 'Help Guide' | 'Manage Ranks' | 'Manage Trophies' | 'Collection' | 'Suggestion Engine' | 'Appearance'
| 'Object Exporter' | 'Asset Manager' | 'Backup & Import' | 'Asset Library'
| 'Chat' | 'Manage Quest Groups' | 'Manage Events' | 'Manage Rotations' | 'Triumphs & Trials'
| 'Bug Tracker' | 'Themes' | 'Test Cases';
export interface SidebarLink {
  type: 'link';
  id: Page;
  emoji: string;
  isVisible: boolean;
  level: number;
  role: Role;
  termKey?: keyof Terminology;
}
export interface SidebarHeader {
    type: 'header';
    title: string;
    emoji?: string;
    id: string;
    level: 0;
    role: Role;
    isVisible: boolean;
}
export interface SidebarSeparator {
    type: 'separator';
    id: string;
    level: 0;
    role: Role;
    isVisible: boolean;
}
export type SidebarConfigItem = SidebarLink | SidebarHeader | SidebarSeparator;
export interface RewardValuationSettings {
  enabled: boolean;
  realWorldCurrency: string;
  currencyExchangeFeePercent: number;
  xpExchangeFeePercent: number;
}
export interface BackupSchedule {
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
  rewardValuation: RewardValuationSettings;
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
  updatedAt?: string;
}
export interface SystemStatus {
  geminiConnected: boolean;
  database: {
    connected: boolean;
    isCustomPath: boolean;
  };
  jwtSecretSet: boolean;
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
  scheduledEvents: ScheduledEvent[];
  rotations: Rotation[];
  bugReports: BugReport[];
  modifierDefinitions: ModifierDefinition[];
  appliedModifiers: AppliedModifier[];
  tradeOffers: TradeOffer[];
  gifts: Gift[];
}
