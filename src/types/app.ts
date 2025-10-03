

import { Role } from '../components/users/types';
import { ConditionSet } from '../components/conditions/types';
import { SystemState } from '../context/SystemContext';
import { QuestsState } from '../context/QuestsContext';
import { AuthState } from '../context/AuthContext';
import { EconomyState } from '../context/EconomyContext';
import { ProgressionState } from '../context/ProgressionContext';
import { CommunityState } from '../context/CommunityContext';
import { BugReportTemplate } from '../components/dev/types';

export type Page =
  | 'Dashboard' | 'Quests' | 'Calendar' | 'Marketplace' | 'Avatar' | 'Collection'
  | 'Guild' | 'Progress' | 'Trophies' | 'Ranks' | 'Chronicles' | 'Profile'
  | 'Approvals' | 'Manage Users' | 'Manage Guilds' | 'Manage Quests' | 'Manage Quest Groups'
  | 'Manage Rotations' | 'Manage Goods' | 'Manage Markets' | 'Manage Rewards'
  | 'Manage Ranks' | 'Manage Trophies' | 'Manage Events' | 'Triumphs & Trials'
  | 'Suggestion Engine' | 'Object Exporter' | 'Asset Manager' | 'Backup & Import'
  | 'Asset Library' | 'Appearance' | 'Settings' | 'About' | 'Help Guide' | 'Themes'
  | 'Bug Tracker' | 'Test Cases' | 'Manage Condition Sets' | 'Manage Minigames'
  | 'Statistics' | 'Manage AI Tutors';

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
  users: string;
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
  link_manage_condition_sets: string;
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
  link_manage_minigames: string;
  link_manage_ai_tutors: string;
  link_statistics: string;
}

export type SidebarConfigItem = 
  | { type: 'link'; id: Page | 'Chat'; emoji: string; isVisible: boolean; level: number; role: string; termKey?: keyof Terminology }
  | { type: 'header'; id: string; title: string; emoji?: string; level: number; role: string; isVisible: boolean; }
  | { type: 'separator'; id: string; level: number; role: string; isVisible: boolean; };

export type SidebarLink = Extract<SidebarConfigItem, { type: 'link' }>;
export type SidebarHeader = Extract<SidebarConfigItem, { type: 'header' }>;

export interface AppSettings {
    contentVersion: number;
    favicon: string;
    theme: string;
    terminology: Terminology;
    enableAiFeatures: boolean;
    rewardValuation: {
        enabled: boolean;
        realWorldCurrency: string;
        currencyExchangeFeePercent: number;
        xpExchangeFeePercent: number;
    };
    gracePeriod: {
        isGlobalGracePeriodActive: boolean;
    };
    setbacks: {
        enabled: boolean;
        forgiveLate: boolean;
    };
    questDefaults: {
        requiresApproval: boolean;
        isOptional: boolean;
        isActive: boolean;
        // FIX: Added missing 'allowSetbackSubstitution' property to questDefaults.
        allowSetbackSubstitution?: boolean;
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
        requirePinForCompletion: boolean;
        autoExit: boolean;
        autoExitMinutes: number;
        userIds: string[];
        showBattery?: boolean;
        autoDim?: boolean;
        autoDimStartTime?: string;
        autoDimStopTime?: string;
        autoDimInactivitySeconds?: number;
        autoDimLevel?: number;
    };
    automatedBackups: {
        enabled: boolean;
        schedules: BackupSchedule[];
        format: 'json' | 'sqlite' | 'both';
    };
    loginNotifications: {
        enabled: boolean;
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
    conditionSets: ConditionSet[];
    bugReportTemplates: BugReportTemplate[];
}

export interface BackupSchedule {
    id: string;
    frequency: number;
    unit: 'hours' | 'days' | 'weeks';
    maxBackups: number;
    lastBackupTimestamp?: number;
}

export type AppMode =
  | { mode: 'personal' }
  | { mode: 'guild', guildId: string };

export interface IAppData extends SystemState, QuestsState, AuthState, EconomyState, ProgressionState, CommunityState {}