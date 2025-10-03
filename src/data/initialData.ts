import { User, Role } from '../components/users/types';
import { RewardTypeDefinition, RewardCategory } from '../types';
import { Rank } from '../components/ranks/types';
import { Trophy, TrophyRequirementType } from '../components/trophies/types';
import { QuestType, Quest, QuestGroup, QuestCompletion } from '../components/quests/types';
import { Market } from '../types';
import { Guild } from '../components/guilds/types';
import { AppSettings, SidebarConfigItem, Terminology } from '../types/app';
import { GameAsset } from '../components/items/types';
import { ThemeDefinition, ThemeStyle } from '../components/themes/types';

export const INITIAL_MAIN_SIDEBAR_CONFIG: SidebarConfigItem[] = [
  // Top Level
  { type: 'link', id: 'Dashboard', emoji: '🏠', isVisible: true, level: 0, role: Role.Explorer, termKey: 'link_dashboard' },
  { type: 'link', id: 'Quests', emoji: '🗺️', isVisible: true, level: 0, role: Role.Explorer, termKey: 'link_quests' },
  { type: 'link', id: 'Calendar', emoji: '🗓️', isVisible: true, level: 0, role: Role.Explorer, termKey: 'link_calendar' },
  { type: 'link', id: 'Marketplace', emoji: '💰', isVisible: true, level: 0, role: Role.Explorer, termKey: 'link_marketplace' },

  // Explorer Section
  { type: 'header', id: 'header-character', title: 'Explorer', emoji: '🧑‍🚀', level: 0, role: Role.Explorer, isVisible: true },
  { type: 'link', id: 'Chronicles', emoji: '📜', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_chronicles' },
  { type: 'link', id: 'Guild', emoji: '🏰', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_guild' },
  { type: 'link', id: 'Progress', emoji: '📊', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_progress' },
  { type: 'link', id: 'Avatar', emoji: '🧑‍🎤', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_avatar' },
  { type: 'link', id: 'Ranks', emoji: '🎖️', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_ranks' },
  { type: 'link', id: 'Collection', emoji: '🎒', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_collection' },
  { type: 'link', id: 'Themes', emoji: '🎨', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_themes' },
  { type: 'link', id: 'Trophies', emoji: '🏆', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_trophies' },

  // User Management Section
  { type: 'header', id: 'header-admin-community', title: 'User Management', emoji: '🛡️', level: 0, role: Role.Gatekeeper, isVisible: true },
  { type: 'link', id: 'Approvals', emoji: '✅', isVisible: true, level: 1, role: Role.Gatekeeper, termKey: 'link_approvals' },
  { type: 'link', id: 'Manage Users', emoji: '👥', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_users' },
  { type: 'link', id: 'Manage Guilds', emoji: '🏰', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_guilds' },
  { type: 'link', id: 'Triumphs & Trials', emoji: '⚖️', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_triumphs_trials' },

  // Content Management Section
  { type: 'header', id: 'header-admin-content', title: 'Content Management', emoji: '📚', level: 0, role: Role.DonegeonMaster, isVisible: true },
  { type: 'link', id: 'Manage Quests', emoji: '📜', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_quests' },
  { type: 'link', id: 'Manage Quest Groups', emoji: '📂', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_quest_groups' },
  { type: 'link', id: 'Manage AI Tutors', emoji: '🤖', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_ai_tutors' },
  { type: 'link', id: 'Manage Rotations', emoji: '🔄', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_rotations' },
  { type: 'link', id: 'Manage Markets', emoji: '🛒', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_markets' },
  { type: 'link', id: 'Manage Goods', emoji: '⚔️', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_items' },
  { type: 'link', id: 'Manage Trophies', emoji: '🏆', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_trophies' },
  { type: 'link', id: 'Manage Ranks', emoji: '🏅', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_ranks' },
  { type: 'link', id: 'Manage Rewards', emoji: '💎', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_rewards' },
  { type: 'link', id: 'Manage Events', emoji: '🎉', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_events' },
  { type: 'link', id: 'Manage Condition Sets', emoji: '🔗', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_condition_sets' },
  { type: 'link', id: 'Manage Minigames', emoji: '🕹️', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_minigames' },
  
  // System Tools Section
  { type: 'header', id: 'header-admin-system', title: 'System Tools', emoji: '🛠️', level: 0, role: Role.DonegeonMaster, isVisible: true },
  { type: 'link', id: 'Statistics', emoji: '📈', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_statistics' },
  { type: 'link', id: 'Asset Manager', emoji: '🖼️', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_asset_manager' },
  { type: 'link', id: 'Backup & Import', emoji: '💾', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_backup_import' },
  { type: 'link', id: 'Object Exporter', emoji: '🗂️', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_object_exporter' },
  { type: 'link', id: 'Appearance', emoji: '🖌️', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_appearance' },
  { type: 'link', id: 'Asset Library', emoji: '📚', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_asset_library' },
  { type: 'link', id: 'Suggestion Engine', emoji: '✨', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_suggestion_engine' },
  { type: 'link', id: 'Bug Tracker', emoji: '🐞', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_bug_tracker' },
  
  { type: 'separator', id: 'sep-system-settings', level: 0, role: Role.DonegeonMaster, isVisible: true },

  // Top Level
  { type: 'link', id: 'Settings', emoji: '⚙️', isVisible: true, level: 0, role: Role.DonegeonMaster, termKey: 'link_settings' },
  
  { type: 'separator', id: 'sep-settings-chat', level: 0, role: Role.Explorer, isVisible: true },

  { type: 'link', id: 'Chat', emoji: '💬', isVisible: true, level: 0, role: Role.Explorer, termKey: 'link_chat' },

  // Help Section
  { type: 'header', id: 'header-help', title: 'Help', emoji: '❓', level: 0, role: Role.Explorer, isVisible: true },
  { type: 'link', id: 'Help Guide', emoji: '❓', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_help_guide' },
  { type: 'link', id: 'About', emoji: 'ℹ️', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_about' },
];

export const INITIAL_SETTINGS: AppSettings = {
    contentVersion: 0,
    favicon: '🏰',
    gracePeriod: {
        isGlobalGracePeriodActive: false,
    },
    setbacks: {
        enabled: true,
        forgiveLate: true,
    },
    questDefaults: {
        requiresApproval: false,
        isOptional: false,
        isActive: true,
        allowSetbackSubstitution: false,
    },
    security: {
      requirePinForUsers: true,
      requirePasswordForAdmin: true,
      allowProfileEditing: true,
      allowAdminSelfApproval: false,
    },
    sharedMode: {
        enabled: false,
        quickUserSwitchingEnabled: true,
        allowCompletion: false,
        requirePinForCompletion: true,
        autoExit: false,
        autoExitMinutes: 2,
        userIds: [],
        showBattery: false,
        autoDim: false,
        autoDimStartTime: '21:00',
        autoDimStopTime: '06:00',
        autoDimInactivitySeconds: 30,
        autoDimLevel: 0.8,
    },
    automatedBackups: {
        enabled: false,
        schedules: [{
            id: 'default-daily',
            frequency: 24,
            unit: 'hours',
            maxBackups: 7,
            lastBackupTimestamp: 0
        }],
        format: 'json',
    },
    loginNotifications: {
        enabled: true,
    },
    theme: 'emerald',
    terminology: {
      appName: 'Task Donegeon',
      // Singular
      task: 'Quest',
      recurringTask: 'Duty',
      singleTask: 'Venture',
      journey: 'Journey',
      store: 'Market',
      history: 'Chronicles',
      group: 'Guild',
      level: 'Rank',
      award: 'Trophy',
      point: 'Reward',
      xp: 'XP',
      currency: 'Currency',
      negativePoint: 'Setback',
      // Plural
      tasks: 'Quests',
      recurringTasks: 'Duties',
      singleTasks: 'Ventures',
      journeys: 'Journeys',
      shoppingCenter: 'Marketplace',
      stores: 'Markets',
      groups: 'Guilds',
      levels: 'Ranks',
      awards: 'Trophies',
      points: 'Rewards',
      negativePoints: 'Setbacks',
      // Roles
      admin: 'Donegeon Master',
      moderator: 'Gatekeeper',
      user: 'Explorer',
      users: 'Explorers',
      // Sidebar Links
      link_dashboard: 'Dashboard',
      link_quests: 'Quests',
      link_marketplace: 'Marketplace',
      link_calendar: 'Calendar',
      link_avatar: 'Avatar',
      link_collection: 'Collection',
      link_guild: 'Guild',
      link_progress: 'Progress',
      link_trophies: 'Trophies',
      link_ranks: 'Ranks',
      link_chronicles: 'Chronicles',
      link_manage_quests: 'Manage Quests',
      link_manage_quest_groups: 'Manage Quest Groups',
      link_manage_items: 'Manage Goods',
      link_manage_markets: 'Manage Markets',
      link_manage_rewards: 'Manage Rewards',
      link_manage_ranks: 'Manage Ranks',
      link_manage_trophies: 'Manage Trophies',
      link_manage_events: 'Manage Events',
      link_manage_rotations: 'Manage Rotations',
      link_manage_condition_sets: 'Manage Condition Sets',
      link_triumphs_trials: 'Triumphs & Trials',
      link_appearance: 'Appearance',
      link_approvals: 'Approvals',
      link_manage_users: 'Manage Users',
      link_manage_guilds: 'Manage Guilds',
      link_suggestion_engine: 'Suggestion Engine',
      link_object_exporter: 'Object Exporter',
      link_asset_manager: 'Asset Manager',
      link_backup_import: 'Backup & Import',
      link_asset_library: 'Asset Library',
      link_settings: 'Settings',
      link_about: 'About',
      link_help_guide: 'Help Guide',
      link_chat: 'Chat',
      link_bug_tracker: 'Bug Tracker',
      link_themes: 'Themes',
      link_test_cases: 'Test Cases',
      link_manage_minigames: 'Manage Minigames',
      link_manage_ai_tutors: 'Manage AI Tutors',
      link_statistics: 'Statistics',
    },
    enableAiFeatures: false,
    rewardValuation: {
      enabled: true,
      realWorldCurrency: 'USD',
      currencyExchangeFeePercent: 5,
      xpExchangeFeePercent: 10,
    },
    chat: {
        enabled: true,
        chatEmoji: '💬',
    },
    sidebars: {
        main: INITIAL_MAIN_SIDEBAR_CONFIG,
    },
    googleCalendar: {
      enabled: false,
      apiKey: '',
      calendarId: '',
    },
    developerMode: {
      enabled: false,
    },
    conditionSets: [],
    bugReportTemplates: [],
};

// FIX: Corrected duplicate variable declaration. This `export` block was causing redeclaration errors and has been removed as the constants are already exported individually.
