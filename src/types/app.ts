
import { Role } from '../../components/users/types';
import { ThemeDefinition } from '../../components/themes/types';

// This file is for truly global types that don't belong to a specific feature domain.

export type AppMode = {
    mode: 'personal';
} | {
    mode: 'guild';
    guildId: string;
};

export interface Terminology {
  appName: string;
  // Singular
  task: string;
  recurringTask: string;
  singleTask: string;
  journey: string;
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
  journeys: string;
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
  link_manage_events: string;
  link_manage_rotations: string;
  link_triumphs_trials: string;
  link_appearance: string;
  link_approvals: string;
  link_manage_users: string;
  link_manage_guilds: string;
  link_suggestion_engine: string;
  link_object_exporter: string;
  link_asset_manager: string;
  link_backup_import: string;
  link_asset_library: string;
  link_settings: string;
  link_about: string;
  link_help_guide: string;
  link_chat: string;
  link_bug_tracker: string;
  link_themes: string;
  link_test_cases: string;
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
