// This file is a JavaScript adaptation of the necessary initial data from the frontend's `initialData.ts`.
// It ensures the backend can correctly initialize the app on the very first run.

const INITIAL_MAIN_SIDEBAR_CONFIG = [
  // Top Level
  { type: 'link', id: 'Dashboard', emoji: '🏠', isVisible: true, level: 0, role: 'Explorer', termKey: 'link_dashboard' },
  { type: 'link', id: 'Quests', emoji: '🗺️', isVisible: true, level: 0, role: 'Explorer', termKey: 'link_quests' },
  { type: 'link', id: 'Calendar', emoji: '🗓️', isVisible: true, level: 0, role: 'Explorer', termKey: 'link_calendar' },
  { type: 'link', id: 'Marketplace', emoji: '💰', isVisible: true, level: 0, role: 'Explorer', termKey: 'link_marketplace' },

  // Explorer Section
  { type: 'header', id: 'header-character', title: 'Explorer', emoji: '🧑‍🚀', level: 0, role: 'Explorer', isVisible: true },
  { type: 'link', id: 'Chronicles', emoji: '📜', isVisible: true, level: 1, role: 'Explorer', termKey: 'link_chronicles' },
  { type: 'link', id: 'Guild', emoji: '🏰', isVisible: true, level: 1, role: 'Explorer', termKey: 'link_guild' },
  { type: 'link', id: 'Progress', emoji: '📊', isVisible: true, level: 1, role: 'Explorer', termKey: 'link_progress' },
  { type: 'link', id: 'Avatar', emoji: '🧑‍🎤', isVisible: true, level: 1, role: 'Explorer', termKey: 'link_avatar' },
  { type: 'link', id: 'Ranks', emoji: '🎖️', isVisible: true, level: 1, role: 'Explorer', termKey: 'link_ranks' },
  { type: 'link', id: 'Collection', emoji: '🎒', isVisible: true, level: 1, role: 'Explorer', termKey: 'link_collection' },
  { type: 'link', id: 'Themes', emoji: '🎨', isVisible: true, level: 1, role: 'Explorer', termKey: 'link_themes' },
  { type: 'link', id: 'Trophies', emoji: '🏆', isVisible: true, level: 1, role: 'Explorer', termKey: 'link_trophies' },

  // User Management Section
  { type: 'header', id: 'header-admin-community', title: 'User Management', emoji: '🛡️', level: 0, role: 'Gatekeeper', isVisible: true },
  { type: 'link', id: 'Approvals', emoji: '✅', isVisible: true, level: 1, role: 'Gatekeeper', termKey: 'link_approvals' },
  { type: 'link', id: 'Manage Users', emoji: '👥', isVisible: true, level: 1, role: 'Donegeon Master', termKey: 'link_manage_users' },
  { type: 'link', id: 'Manage Guilds', emoji: '🏰', isVisible: true, level: 1, role: 'Donegeon Master', termKey: 'link_manage_guilds' },
  { type: 'link', id: 'Triumphs & Trials', emoji: '⚖️', isVisible: true, level: 1, role: 'Donegeon Master', termKey: 'link_triumphs_trials' },

  // Content Management Section
  { type: 'header', id: 'header-admin-content', title: 'Content Management', emoji: '📚', level: 0, role: 'Donegeon Master', isVisible: true },
  { type: 'link', id: 'Manage Quests', emoji: '📜', isVisible: true, level: 1, role: 'Donegeon Master', termKey: 'link_manage_quests' },
  { type: 'link', id: 'Manage Quest Groups', emoji: '📂', isVisible: true, level: 1, role: 'Donegeon Master', termKey: 'link_manage_quest_groups' },
  { type: 'link', id: 'Manage Rotations', emoji: '🔄', isVisible: true, level: 1, role: 'Donegeon Master', termKey: 'link_manage_rotations' },
  { type: 'link', id: 'Manage Markets', emoji: '🛒', isVisible: true, level: 1, role: 'Donegeon Master', termKey: 'link_manage_markets' },
  { type: 'link', id: 'Manage Goods', emoji: '⚔️', isVisible: true, level: 1, role: 'Donegeon Master', termKey: 'link_manage_items' },
  { type: 'link', id: 'Manage Trophies', emoji: '🏆', isVisible: true, level: 1, role: 'Donegeon Master', termKey: 'link_manage_trophies' },
  { type: 'link', id: 'Manage Ranks', emoji: '🏅', isVisible: true, level: 1, role: 'Donegeon Master', termKey: 'link_manage_ranks' },
  { type: 'link', id: 'Manage Rewards', emoji: '💎', isVisible: true, level: 1, role: 'Donegeon Master', termKey: 'link_manage_rewards' },
  { type: 'link', id: 'Manage Events', emoji: '🎉', isVisible: true, level: 1, role: 'Donegeon Master', termKey: 'link_manage_events' },
  { type: 'link', id: 'Manage Condition Sets', emoji: '🔗', isVisible: true, level: 1, role: 'Donegeon Master', termKey: 'link_manage_condition_sets' },
  { type: 'link', id: 'Manage Minigames', emoji: '🕹️', isVisible: true, level: 1, role: 'Donegeon Master', termKey: 'link_manage_minigames' },
  
  // System Tools Section
  { type: 'header', id: 'header-admin-system', title: 'System Tools', emoji: '🛠️', level: 0, role: 'Donegeon Master', isVisible: true },
  { type: 'link', id: 'Asset Manager', emoji: '🖼️', isVisible: true, level: 1, role: 'Donegeon Master', termKey: 'link_asset_manager' },
  { type: 'link', id: 'Backup & Import', emoji: '💾', isVisible: true, level: 1, role: 'Donegeon Master', termKey: 'link_backup_import' },
  { type: 'link', id: 'Object Exporter', emoji: '🗂️', isVisible: true, level: 1, role: 'Donegeon Master', termKey: 'link_object_exporter' },
  { type: 'link', id: 'Appearance', emoji: '🖌️', isVisible: true, level: 1, role: 'Donegeon Master', termKey: 'link_appearance' },
  { type: 'link', id: 'Asset Library', emoji: '📚', isVisible: true, level: 1, role: 'Donegeon Master', termKey: 'link_asset_library' },
  { type: 'link', id: 'Suggestion Engine', emoji: '✨', isVisible: true, level: 1, role: 'Donegeon Master', termKey: 'link_suggestion_engine' },
  { type: 'link', id: 'Bug Tracker', emoji: '🐞', isVisible: true, level: 1, role: 'Donegeon Master', termKey: 'link_bug_tracker' },
  
  { type: 'separator', id: 'sep-system-settings', level: 0, role: 'Donegeon Master', isVisible: true },

  // Top Level
  { type: 'link', id: 'Settings', emoji: '⚙️', isVisible: true, level: 0, role: 'Donegeon Master', termKey: 'link_settings' },
  
  { type: 'separator', id: 'sep-settings-chat', level: 0, role: 'Explorer', isVisible: true },

  { type: 'link', id: 'Chat', emoji: '💬', isVisible: true, level: 0, role: 'Explorer', termKey: 'link_chat' },

  // Help Section
  { type: 'header', id: 'header-help', title: 'Help', emoji: '❓', level: 0, role: 'Explorer', isVisible: true },
  { type: 'link', id: 'Help Guide', emoji: '❓', isVisible: true, level: 1, role: 'Explorer', termKey: 'link_help_guide' },
  { type: 'link', id: 'About', emoji: 'ℹ️', isVisible: true, level: 1, role: 'Explorer', termKey: 'link_about' },
];

const INITIAL_SETTINGS = {
    contentVersion: 0,
    favicon: '🏰',
    setbacks: {
        enabled: true,
        forgiveLate: true,
    },
    questDefaults: {
        requiresApproval: false,
        isOptional: false,
        isActive: true,
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
    },
    automatedBackups: {
        enabled: false,
        schedules: [{
            id: 'default-daily',
            frequency: 24,
            unit: 'hours',
            maxBackups: 7,
        }],
        format: 'json',
    },
    loginNotifications: {
        enabled: true,
    },
    theme: 'emerald',
    terminology: {
      appName: 'Task Donegeon',
      task: 'Quest',
      tasks: 'Quests',
      recurringTask: 'Duty',
      recurringTasks: 'Duties',
      singleTask: 'Venture',
      singleTasks: 'Ventures',
      journey: 'Journey',
      journeys: 'Journeys',
      shoppingCenter: 'Marketplace',
      store: 'Market',
      stores: 'Markets',
      history: 'Chronicles',
      group: 'Guild',
      groups: 'Guilds',
      level: 'Rank',
      levels: 'Ranks',
      award: 'Trophy',
      awards: 'Trophies',
      point: 'Reward',
      points: 'Rewards',
      xp: 'XP',
      currency: 'Currency',
      negativePoint: 'Setback',
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
};

const INITIAL_QUEST_GROUPS = [
    { id: 'qg-household', name: 'Household Chores', description: 'General tasks related to keeping the house clean and tidy.', icon: '🏡' },
    { id: 'qg-school', name: 'School & Learning', description: 'Quests related to homework, studying, and educational activities.', icon: '📚' },
    { id: 'qg-personal', name: 'Personal Goals', description: 'Quests for self-improvement, habits, and personal projects.', icon: '🎯' },
    { id: 'qg-health', name: 'Health & Wellness', description: 'Tasks for physical and mental well-being, like exercise and hygiene.', icon: '❤️‍🩹' },
    { id: 'qg-family', name: 'Family & Social', description: 'Quests that involve spending time with or helping family and friends.', icon: '👨‍👩‍👧‍👦' },
    { id: 'qg-creative', name: 'Creative & Hobbies', description: 'Quests for art, music, building, and other creative pursuits.', icon: '🎨' },
    { id: 'qg-outdoor', name: 'Outdoor & Adventure', description: 'Tasks related to yard work, playing outside, and exploring nature.', icon: '🌳' },
    { id: 'qg-kindness', name: 'Kindness & Service', description: 'Quests focused on helping others, showing appreciation, and community service.', icon: '💖' },
];

const INITIAL_REWARD_TYPES = [
    { id: 'core-gold', name: 'Gold Coins', category: 'Currency', description: 'Can be exchanged for real money or items.', isCore: true, iconType: 'emoji', icon: '💰', baseValue: 0.20 },
    { id: 'core-gems', name: 'Gems', category: 'Currency', description: 'Earned from service or helping. Used for experiences.', isCore: true, iconType: 'emoji', icon: '💎', baseValue: 1.00 },
    { id: 'core-crystal', name: 'Crystals', category: 'Currency', description: 'Earned from small tasks. Used for screen time.', isCore: true, iconType: 'emoji', icon: '🔮', baseValue: 0.10 },
    { id: 'core-token', name: 'Game Token', category: 'Currency', description: 'Used to play minigames in The Arcade.', isCore: true, iconType: 'emoji', icon: '🪙', baseValue: 0.25 },
    { id: 'core-strength', name: 'Strength', category: 'XP', description: 'Earned from physical tasks.', isCore: true, iconType: 'emoji', icon: '💪', baseValue: 0.05 },
    { id: 'core-diligence', name: 'Diligence', category: 'XP', description: 'Earned from careful, persistent work like cleaning and organizing.', isCore: true, iconType: 'emoji', icon: '🧹', baseValue: 0.05 },
    { id: 'core-wisdom', name: 'Wisdom', category: 'XP', description: 'Earned from learning activities.', isCore: true, iconType: 'emoji', icon: '🧠', baseValue: 0.05 },
    { id: 'core-skill', name: 'Skill', category: 'XP', description: 'Earned from practice and sports.', isCore: true, iconType: 'emoji', icon: '🎯', baseValue: 0.05 },
    { id: 'core-creative', name: 'Creativity', category: 'XP', description: 'Earned from artistic and creative endeavors.', isCore: true, iconType: 'emoji', icon: '🎨', baseValue: 0.05 },
];

const rankNames = [
    "Novice", "Initiate", "Apprentice", "Journeyman", "Adept", 
    "Squire", "Knight", "Guardian", "Sentinel", "Champion", 
    "Vanguard", "Paladin", "Myrmidon", "Justicar", "Marshal", 
    "Baron", "Viscount", "Earl", "Marquess", "Duke", 
    "Warlord", "Conqueror", "Highlord", "Overlord", "Master",
    "Grandmaster", "Elder", "Mystic", "Sage", "Archsage", 
    "Shadow", "Phantom", "Spectre", "Wraith", "Lich", 
    "Paragon", "Exemplar", "Titan", "Colossus", "Behemoth",
    "Celestial", "Empyrean", "Astral", "Ethereal", "Cosmic",
    "Demigod", "Ascendant", "Immortal", "Transcendent", "The Absolute"
];

const rankIcons = [
    '🔰', '🌱', '🛠️', '🧭', '🔥', '🛡️', '⚔️', '🏰', '🔭', '🏆',
    '🎖️', '⚜️', '💠', '⚖️', '👑', '🌍', '🚀', '🌌', '🌟', '✨',
    '🔥', '💥', '💫', '☄️', '🪐', '⭐', '🥇', '🏅', '🎖️', '🏆',
    '👻', '💀', '☠️', '🎃', '👽', '💎', '💍', '👑', '🔱', '⚡',
    '🌈', '🌊', '🌋', '🏔️', '🌪️', '☀️', '🌕', '🌠', '🎇', '💥'
];


const INITIAL_RANKS = Array.from({ length: 50 }, (_, i) => ({
    id: `rank-${i + 1}`,
    name: rankNames[i] || `Level ${i + 1}`,
    xpThreshold: Math.floor(i * (50 + i * 5)),
    iconType: 'emoji',
    icon: rankIcons[i] || '❓',
}));

const rawThemes = {
  emerald: { '--font-display': "'MedievalSharp', cursive", '--font-body': "'Roboto', sans-serif", '--font-label': "'IM Fell English SC', serif", '--font-span': "'Roboto', sans-serif", '--font-button': "'Roboto', sans-serif", '--font-size-h1': '2.25rem', '--font-size-h2': '1.75rem', '--font-size-h3': '1.5rem', '--font-size-body': '1rem', '--font-size-label': '0.875rem', '--font-size-span': '1rem', '--color-bg-primary-hsl': "224 71% 4%", '--color-bg-secondary-hsl': "224 39% 10%", '--color-bg-tertiary-hsl': "240 10% 19%", '--color-text-primary-hsl': "240 8% 90%", '--color-text-secondary-hsl': "240 6% 65%", '--color-border-hsl': "240 6% 30%", '--color-primary-hue': "158", '--color-primary-saturation': "84%", '--color-primary-lightness': "39%", '--color-accent-hue': "158", '--color-accent-saturation': "75%", '--color-accent-lightness': "58%", '--color-accent-light-hue': "158", '--color-accent-light-saturation': "70%", '--color-accent-light-lightness': "45%" },
  rose: { '--font-display': "'MedievalSharp', cursive", '--font-body': "'Roboto', sans-serif", '--font-label': "'IM Fell English SC', serif", '--font-span': "'Roboto', sans-serif", '--font-button': "'Roboto', sans-serif", '--font-size-h1': '2.25rem', '--font-size-h2': '1.75rem', '--font-size-h3': '1.5rem', '--font-size-body': '1rem', '--font-size-label': '0.875rem', '--font-size-span': '1rem', '--color-bg-primary-hsl': "334 27% 10%", '--color-bg-secondary-hsl': "334 20% 15%", '--color-bg-tertiary-hsl': "334 15% 22%", '--color-text-primary-hsl': "346 33% 94%", '--color-text-secondary-hsl': "346 20% 70%", '--color-border-hsl': "346 15% 40%", '--color-primary-hue': "346", '--color-primary-saturation': "84%", '--color-primary-lightness': "59%", '--color-accent-hue': "346", '--color-accent-saturation': "91%", '--color-accent-lightness': "71%", '--color-accent-light-hue': "346", '--color-accent-light-saturation': "80%", '--color-accent-light-lightness': "60%" },
  sky: { '--font-display': "'MedievalSharp', cursive", '--font-body': "'Roboto', sans-serif", '--font-label': "'IM Fell English SC', serif", '--font-span': "'Roboto', sans-serif", '--font-button': "'Roboto', sans-serif", '--font-size-h1': '2.25rem', '--font-size-h2': '1.75rem', '--font-size-h3': '1.5rem', '--font-size-body': '1rem', '--font-size-label': '0.875rem', '--font-size-span': '1rem', '--color-bg-primary-hsl': "217 33% 12%", '--color-bg-secondary-hsl': "217 28% 17%", '--color-bg-tertiary-hsl': "217 25% 25%", '--color-text-primary-hsl': "210 40% 98%", '--color-text-secondary-hsl': "215 25% 75%", '--color-border-hsl': "215 20% 40%", '--color-primary-hue': "204", '--color-primary-saturation': "85%", '--color-primary-lightness': "54%", '--color-accent-hue': "202", '--color-accent-saturation': "90%", '--color-accent-lightness': "70%", '--color-accent-light-hue': "202", '--color-accent-light-saturation': "80%", '--color-accent-light-lightness': "60%" },
  sapphire: { '--font-display': "'MedievalSharp', cursive", '--font-body': "'Roboto', sans-serif", '--font-label': "'IM Fell English SC', serif", '--font-span': "'Roboto', sans-serif", '--font-button': "'Roboto', sans-serif", '--font-size-h1': '2.25rem', '--font-size-h2': '1.75rem', '--font-size-h3': '1.5rem', '--font-size-body': '1rem', '--font-size-label': '0.875rem', '--font-size-span': '1rem', '--color-bg-primary-hsl': "217 33% 12%", '--color-bg-secondary-hsl': "217 28% 17%", '--color-bg-tertiary-hsl': "217 25% 25%", '--color-text-primary-hsl': "210 40% 98%", '--color-text-secondary-hsl': "215 25% 75%", '--color-border-hsl': "215 20% 40%", '--color-primary-hue': "217", '--color-primary-saturation': "90%", '--color-primary-lightness': "61%", '--color-accent-hue': "217", '--color-accent-saturation': "85%", '--color-accent-lightness': "75%", '--color-accent-light-hue': "217", '--color-accent-light-saturation': "95%", '--color-accent-light-lightness': "85%" },
  arcane: { '--font-display': "'Uncial Antiqua', cursive", '--font-body': "'Roboto', sans-serif", '--font-label': "'IM Fell English SC', serif", '--font-span': "'Roboto', sans-serif", '--font-button': "'Roboto', sans-serif", '--font-size-h1': '2.25rem', '--font-size-h2': '1.75rem', '--font-size-h3': '1.5rem', '--font-size-body': '1rem', '--font-size-label': '0.875rem', '--font-size-span': '1rem', '--color-bg-primary-hsl': "265 39% 12%", '--color-bg-secondary-hsl': "265 30% 18%", '--color-bg-tertiary-hsl': "265 25% 25%", '--color-text-primary-hsl': "271 67% 93%", '--color-text-secondary-hsl': "271 25% 75%", '--color-border-hsl': "271 20% 45%", '--color-primary-hue': "265", '--color-primary-saturation': "60%", '--color-primary-lightness': "55%", '--color-accent-hue': "265", '--color-accent-saturation': "70%", '--color-accent-lightness': "75%", '--color-accent-light-hue': "45", '--color-accent-light-saturation': "80%", '--color-accent-light-lightness': "65%" },
  cartoon: { '--font-display': "'Comic Neue', cursive", '--font-body': "'Comic Neue', cursive", '--font-label': "'Comic Neue', cursive", '--font-span': "'Comic Neue', cursive", '--font-button': "'Comic Neue', cursive", '--font-size-h1': '2.25rem', '--font-size-h2': '1.75rem', '--font-size-h3': '1.5rem', '--font-size-body': '1rem', '--font-size-label': '0.875rem', '--font-size-span': '1rem', '--color-bg-primary-hsl': "214 53% 15%", '--color-bg-secondary-hsl': "214 43% 22%", '--color-bg-tertiary-hsl': "214 38% 30%", '--color-text-primary-hsl': "210 40% 96%", '--color-text-secondary-hsl': "210 30% 75%", '--color-border-hsl': "210 25% 45%", '--color-primary-hue': "25", '--color-primary-saturation': "95%", '--color-primary-lightness': "55%", '--color-accent-hue': "200", '--color-accent-saturation': "85%", '--color-accent-lightness': "60%", '--color-accent-light-hue': "200", '--color-accent-light-saturation': "90%", '--color-accent-light-lightness': "70%" },
  forest: { '--font-display': "'Metamorphous', serif", '--font-body': "'Roboto', sans-serif", '--font-label': "'IM Fell English SC', serif", '--font-span': "'Roboto', sans-serif", '--font-button': "'Roboto', sans-serif", '--font-size-h1': '2.25rem', '--font-size-h2': '1.75rem', '--font-size-h3': '1.5rem', '--font-size-body': '1rem', '--font-size-label': '0.875rem', '--font-size-span': '1rem', '--color-bg-primary-hsl': "120 25% 10%", '--color-bg-secondary-hsl': "120 20% 15%", '--color-bg-tertiary-hsl': "120 15% 22%", '--color-text-primary-hsl': "90 30% 90%", '--color-text-secondary-hsl': "90 15% 65%", '--color-border-hsl': "120 10% 35%", '--color-primary-hue': "130", '--color-primary-saturation': "60%", '--color-primary-lightness': "40%", '--color-accent-hue': "90", '--color-accent-saturation': "50%", '--color-accent-lightness': "65%", '--color-accent-light-hue': "40", '--color-accent-light-saturation': "50%", '--color-accent-light-lightness': "55%" },
  ocean: { '--font-display': "'Uncial Antiqua', cursive", '--font-body': "'Roboto', sans-serif", '--font-label': "'IM Fell English SC', serif", '--font-span': "'Roboto', sans-serif", '--font-button': "'Roboto', sans-serif", '--font-size-h1': '2.25rem', '--font-size-h2': '1.75rem', '--font-size-h3': '1.5rem', '--font-size-body': '1rem', '--font-size-label': '0.875rem', '--font-size-span': '1rem', '--color-bg-primary-hsl': "200 100% 10%", '--color-bg-secondary-hsl': "200 80% 18%", '--color-bg-tertiary-hsl': "200 70% 25%", '--color-text-primary-hsl': "190 70% 95%", '--color-text-secondary-hsl': "190 40% 75%", '--color-border-hsl': "190 40% 40%", '--color-primary-hue': '180', '--color-primary-saturation': '85%', '--color-primary-lightness': '45%', '--color-accent-hue': '190', '--color-accent-saturation': '80%', '--color-accent-lightness': '60%', '--color-accent-light-hue': '190', '--color-accent-light-saturation': '70%', '--color-accent-light-lightness': '70%' },
  vulcan: { '--font-display': "'Metamorphous', serif", '--font-body': "'Roboto', sans-serif", '--font-label': "'IM Fell English SC', serif", '--font-span': "'Roboto', sans-serif", '--font-button': "'Roboto', sans-serif", '--font-size-h1': '2.25rem', '--font-size-h2': '1.75rem', '--font-size-h3': '1.5rem', '--font-size-body': '1rem', '--font-size-label': '0.875rem', '--font-size-span': '1rem', '--color-bg-primary-hsl': "10 50% 8%", '--color-bg-secondary-hsl': "10 40% 12%", '--color-bg-tertiary-hsl': "10 35% 18%", '--color-text-primary-hsl': "10 10% 90%", '--color-text-secondary-hsl': "10 5% 65%", '--color-border-hsl': "10 10% 35%", '--color-primary-hue': "0", '--color-primary-saturation': "85%", '--color-primary-lightness': "50%", '--color-accent-hue': "25", '--color-accent-saturation': "90%", '--color-accent-lightness': "60%", '--color-accent-light-hue': "45", '--color-accent-light-saturation': "80%", '--color-accent-light-lightness': "65%" },
  royal: { '--font-display': "'Uncial Antiqua', cursive", '--font-body': "'Roboto', sans-serif", '--font-label': "'IM Fell English SC', serif", '--font-span': "'Roboto', sans-serif", '--font-button': "'Roboto', sans-serif", '--font-size-h1': '2.25rem', '--font-size-h2': '1.75rem', '--font-size-h3': '1.5rem', '--font-size-body': '1rem', '--font-size-label': '0.875rem', '--font-size-span': '1rem', '--color-bg-primary-hsl': "250 40% 10%", '--color-bg-secondary-hsl': "250 30% 16%", '--color-bg-tertiary-hsl': "250 25% 24%", '--color-text-primary-hsl': "250 50% 92%", '--color-text-secondary-hsl': "250 25% 70%", '--color-border-hsl': "250 20% 40%", '--color-primary-hue': "250", '--color-primary-saturation': "60%", '--color-primary-lightness': "50%", '--color-accent-hue': "45", '--color-accent-saturation': "80%", '--color-accent-lightness': "60%", '--color-accent-light-hue': "45", '--color-accent-light-saturation': "85%", '--color-accent-light-lightness': "70%" },
  winter: { '--font-display': "'Metamorphous', serif", '--font-body': "'Roboto', sans-serif", '--font-label': "'IM Fell English SC', serif", '--font-span': "'Roboto', sans-serif", '--font-button': "'Roboto', sans-serif", '--font-size-h1': '2.25rem', '--font-size-h2': '1.75rem', '--font-size-h3': '1.5rem', '--font-size-body': '1rem', '--font-size-label': '0.875rem', '--font-size-span': '1rem', '--color-bg-primary-hsl': "205 30% 15%", '--color-bg-secondary-hsl': "205 25% 22%", '--color-bg-tertiary-hsl': "205 20% 30%", '--color-text-primary-hsl': "205 60% 95%", '--color-text-secondary-hsl': "205 30% 75%", '--color-border-hsl': "205 20% 45%", '--color-primary-hue': "205", '--color-primary-saturation': "70%", '--color-primary-lightness': "50%", '--color-accent-hue': "195", '--color-accent-saturation': "80%", '--color-accent-lightness': "65%", '--color-accent-light-hue': "215", '--color-accent-light-saturation': "60%", '--color-accent-light-lightness': "55%" },
  sunset: { '--font-display': "'MedievalSharp', cursive", '--font-body': "'Roboto', sans-serif", '--font-label': "'IM Fell English SC', serif", '--font-span': "'Roboto', sans-serif", '--font-button': "'Roboto', sans-serif", '--font-size-h1': '2.25rem', '--font-size-h2': '1.75rem', '--font-size-h3': '1.5rem', '--font-size-body': '1rem', '--font-size-label': '0.875rem', '--font-size-span': '1rem', '--color-bg-primary-hsl': "20 50% 10%", '--color-bg-secondary-hsl': "20 40% 15%", '--color-bg-tertiary-hsl': "20 35% 22%", '--color-text-primary-hsl': "30 80% 90%", '--color-text-secondary-hsl': "30 40% 70%", '--color-border-hsl': "30 20% 40%", '--color-primary-hue': "15", '--color-primary-saturation': "90%", '--color-primary-lightness': "60%", '--color-accent-hue': "35", '--color-accent-saturation': "95%", '--color-accent-lightness': "65%", '--color-accent-light-hue': "340", '--color-accent-light-saturation': "80%", '--color-accent-light-lightness': "70%" },
  cyberpunk: { '--font-display': "'Press Start 2P', cursive", '--font-body': "'Roboto', sans-serif", '--font-label': "'IM Fell English SC', serif", '--font-span': "'Roboto', sans-serif", '--font-button': "'Roboto', sans-serif", '--font-size-h1': '2.25rem', '--font-size-h2': '1.75rem', '--font-size-h3': '1.5rem', '--font-size-body': '1rem', '--font-size-label': '0.875rem', '--font-size-span': '1rem', '--color-bg-primary-hsl': "260 50% 5%", '--color-bg-secondary-hsl': "280 40% 10%", '--color-bg-tertiary-hsl': "300 30% 15%", '--color-text-primary-hsl': "320 100% 95%", '--color-text-secondary-hsl': "300 50% 75%", '--color-border-hsl': "300 30% 35%", '--color-primary-hue': "320", '--color-primary-saturation': "100%", '--color-primary-lightness': "60%", '--color-accent-hue': "180", '--color-accent-saturation': "100%", '--color-accent-lightness': "50%", '--color-accent-light-hue': "55", '--color-accent-light-saturation': "100%", '--color-accent-light-lightness': "50%" },
  steampunk: { '--font-display': "'IM Fell English SC', serif", '--font-body': "'Roboto', sans-serif", '--font-label': "'IM Fell English SC', serif", '--font-span': "'Roboto', sans-serif", '--font-button': "'Roboto', sans-serif", '--font-size-h1': '2.25rem', '--font-size-h2': '1.75rem', '--font-size-h3': '1.5rem', '--font-size-body': '1rem', '--font-size-label': '0.875rem', '--font-size-span': '1rem', '--color-bg-primary-hsl': "30 20% 12%", '--color-bg-secondary-hsl': "30 15% 18%", '--color-bg-tertiary-hsl': "30 10% 25%", '--color-text-primary-hsl': "35 30% 85%", '--color-text-secondary-hsl': "35 20% 65%", '--color-border-hsl': "35 15% 40%", '--color-primary-hue': "30", '--color-primary-saturation': "60%", '--color-primary-lightness': "50%", '--color-accent-hue': "190", '--color-accent-saturation': "40%", '--color-accent-lightness': "55%", '--color-accent-light-hue': "20", '--color-accent-light-saturation': "30%", '--color-accent-light-lightness': "60%" },
  parchment: { '--font-display': "'IM Fell English SC', serif", '--font-body': "'Roboto', sans-serif", '--font-label': "'IM Fell English SC', serif", '--font-span': "'Roboto', sans-serif", '--font-button': "'Roboto', sans-serif", '--font-size-h1': '2.25rem', '--font-size-h2': '1.75rem', '--font-size-h3': '1.5rem', '--font-size-body': '1rem', '--font-size-label': '0.875rem', '--font-size-span': '1rem', '--color-bg-primary-hsl': "40 30% 85%", '--color-bg-secondary-hsl': "40 25% 90%", '--color-bg-tertiary-hsl': "40 20% 95%", '--color-text-primary-hsl': "35 40% 15%", '--color-text-secondary-hsl': "35 30% 35%", '--color-border-hsl': "35 20% 70%", '--color-primary-hue': "20", '--color-primary-saturation': "50%", '--color-primary-lightness': "40%", '--color-accent-hue': "0", '--color-accent-saturation': "50%", '--color-accent-lightness': "45%", '--color-accent-light-hue': "10", '--color-accent-light-saturation': "40%", '--color-accent-light-lightness': "50%" },
  eerie: { '--font-display': "'Metamorphous', serif", '--font-body': "'Roboto', sans-serif", '--font-label': "'IM Fell English SC', serif", '--font-span': "'Roboto', sans-serif", '--font-button': "'Roboto', sans-serif", '--font-size-h1': '2.25rem', '--font-size-h2': '1.75rem', '--font-size-h3': '1.5rem', '--font-size-body': '1rem', '--font-size-label': '0.875rem', '--font-size-span': '1rem', '--color-bg-primary-hsl': "120 10% 8%", '--color-bg-secondary-hsl': "120 8% 12%", '--color-bg-tertiary-hsl': "120 5% 18%", '--color-text-primary-hsl': "120 30% 88%", '--color-text-secondary-hsl': "120 15% 65%", '--color-border-hsl': "120 10% 30%", '--color-primary-hue': "120", '--color-primary-saturation': "40%", '--color-primary-lightness': "45%", '--color-accent-hue': "80", '--color-accent-saturation': "50%", '--color-accent-lightness': "55%", '--color-accent-light-hue': "30", '--color-accent-light-saturation': "40%", '--color-accent-light-lightness': "50%" },
};

export const INITIAL_THEMES: ThemeDefinition[] = Object.entries(rawThemes).map(([id, styles]) => ({
  id,
  name: id.charAt(0).toUpperCase() + id.slice(1),
  isCustom: false,
  styles: styles as ThemeStyle,
}));

// This function is for creating mock data, but is not used on initial load.
// It remains here in case it's needed for testing or blueprints.
export const createInitialQuestCompletions = (users: User[], quests: Quest[]): QuestCompletion[] => {
    // This function can be used to populate some initial "completed" quests for demonstration
    return [];
};

export const INITIAL_TROPHIES: Trophy[] = [
    { id: 'trophy-1', name: 'First Quest', description: 'Complete your first quest.', iconType: 'emoji', icon: '🎉', isManual: false, requirements: [{type: TrophyRequirementType.CompleteQuestType, value: QuestType.Duty, count: 1}] },
    { id: 'trophy-2', name: 'First Customization', description: 'Change your theme for the first time.', iconType: 'emoji', icon: '🎨', isManual: true, requirements: [] },
    { id: 'trophy-3', name: 'The Adjudicator', description: 'Approve or reject a pending quest.', iconType: 'emoji', icon: '⚖️', isManual: true, requirements: [] },
    { id: 'trophy-4', name: 'World Builder', description: 'Create a new quest.', iconType: 'emoji', icon: '🛠️', isManual: true, requirements: [] },
    { id: 'trophy-5', name: 'The Name Changer', description: 'Rename a user in the Manage Users panel.', iconType: 'emoji', icon: '✍️', isManual: true, requirements: [] },
    { id: 'trophy-6', name: 'Initiate Rank', description: 'Achieve the rank of Initiate', iconType: 'emoji', icon: '🌱', isManual: false, requirements: [{type: TrophyRequirementType.AchieveRank, value: 'rank-2', count: 1}]},
    { id: 'trophy-bday-5', name: 'Happy 5th Birthday!', description: 'Awarded for celebrating a 5th birthday.', iconType: 'emoji', icon: '5️⃣', isManual: true, requirements: [] },
    { id: 'trophy-bday-6', name: 'Happy 6th Birthday!', description: 'Awarded for celebrating a 6th birthday.', iconType: 'emoji', icon: '6️⃣', isManual: true, requirements: [] },
    { id: 'trophy-bday-7', name: 'Happy 7th Birthday!', description: 'Awarded for celebrating a 7th birthday.', iconType: 'emoji', icon: '7️⃣', isManual: true, requirements: [] },
    { id: 'trophy-bday-8', name: 'Happy 8th Birthday!', description: 'Awarded for celebrating an 8th birthday.', iconType: 'emoji', icon: '8️⃣', isManual: true, requirements: [] },
    { id: 'trophy-bday-9', name: 'Happy 9th Birthday!', description: 'Awarded for celebrating a 9th birthday.', iconType: 'emoji', icon: '9️⃣', isManual: true, requirements: [] },
    { id: 'trophy-bday-10', name: 'Happy 10th Birthday!', description: 'Awarded for celebrating a 10th birthday.', iconType: 'emoji', icon: '🔟', isManual: true, requirements: [] },
    { id: 'trophy-bday-11', name: 'Happy 11th Birthday!', description: 'Awarded for celebrating an 11th birthday.', iconType: 'emoji', icon: '1️⃣1️⃣', isManual: true, requirements: [] },
    { id: 'trophy-bday-12', name: 'Happy 12th Birthday!', description: 'Awarded for celebrating a 12th birthday.', iconType: 'emoji', icon: '1️⃣2️⃣', isManual: true, requirements: [] },
    { id: 'trophy-bday-13', name: 'Happy 13th Birthday!', description: 'Awarded for celebrating a 13th birthday.', iconType: 'emoji', icon: '1️⃣3️⃣', isManual: true, requirements: [] },
    { id: 'trophy-bday-14', name: 'Happy 14th Birthday!', description: 'Awarded for celebrating a 14th birthday.', iconType: 'emoji', icon: '1️⃣4️⃣', isManual: true, requirements: [] },
    { id: 'trophy-bday-15', name: 'Happy 15th Birthday!', description: 'Awarded for celebrating a 15th birthday.', iconType: 'emoji', icon: '1️⃣5️⃣', isManual: true, requirements: [] },
    { id: 'trophy-bday-16', name: 'Happy 16th Birthday!', description: 'Awarded for celebrating a 16th birthday.', iconType: 'emoji', icon: '1️⃣6️⃣', isManual: true, requirements: [] },
    { id: 'trophy-bday-17', name: 'Happy 17th Birthday!', description: 'Awarded for celebrating a 17th birthday.', iconType: 'emoji', icon: '1️⃣7️⃣', isManual: true, requirements: [] },
    { id: 'trophy-bday-18', name: 'Happy 18th Birthday!', description: 'Awarded for celebrating an 18th birthday.', iconType: 'emoji', icon: '1️⃣8️⃣', isManual: true, requirements: [] },
    { id: 'trophy-bday-19', name: 'Happy 19th Birthday!', description: 'Awarded for celebrating a 19th birthday.', iconType: 'emoji', icon: '1️⃣9️⃣', isManual: true, requirements: [] },
    { id: 'trophy-bday-20', name: 'Happy 20th Birthday!', description: 'Awarded for celebrating a 20th birthday.', iconType: 'emoji', icon: '2️⃣0️⃣', isManual: true, requirements: [] },
    { id: 'trophy-7', name: 'The Philanthropist', description: 'Donate an item to a guildmate.', iconType: 'emoji', icon: '🎁', isManual: true, requirements: [] },
    { id: 'trophy-8', name: 'Master of Coin', description: 'Amass 1,000 gold.', iconType: 'emoji', icon: '💰', isManual: true, requirements: [] },
    { id: 'trophy-9', name: 'Dungeon Crawler', description: 'Complete 10 Ventures.', iconType: 'emoji', icon: '🗺️', isManual: true, requirements: [] },
    { id: 'trophy-10', name: 'Daily Grind', description: 'Complete 25 Duties.', iconType: 'emoji', icon: '⚙️', isManual: true, requirements: [] },
    { id: 'trophy-11', name: 'The Collector', description: 'Own 10 unique items.', iconType: 'emoji', icon: '📦', isManual: true, requirements: [] },
    { id: 'trophy-12', name: 'Fashionista', description: 'Own 5 pieces of avatar equipment.', iconType: 'emoji', icon: '🧑‍🎤', isManual: true, requirements: [] },
    { id: 'trophy-13', name: 'The Completionist', description: 'Complete all available quests for a day.', iconType: 'emoji', icon: '💯', isManual: true, requirements: [] },
    { id: 'trophy-14', name: 'The Achiever', description: 'Earn 5 other trophies.', iconType: 'emoji', icon: '🏆', isManual: true, requirements: [] },
    { id: 'trophy-15', name: 'The Socialite', description: 'Join a guild.', iconType: 'emoji', icon: '🤝', isManual: true, requirements: [] },
    { id: 'trophy-16', name: 'The Founder', description: 'Create a guild.', iconType: 'emoji', icon: '🏰', isManual: true, requirements: [] },
    { id: 'trophy-17', name: 'The Merchant', description: 'Sell an item in the marketplace.', iconType: 'emoji', icon: '📈', isManual: true, requirements: [] },
    { id: 'trophy-18', name: 'The Artisan', description: 'Craft an item.', iconType: 'emoji', icon: '🔨', isManual: true, requirements: [] },
    { id: 'trophy-19', name: 'The Explorer', description: 'Discover a hidden area or secret.', iconType: 'emoji', icon: '🧭', isManual: true, requirements: [] },
    { id: 'trophy-20', name: 'The Loremaster', description: 'Read 10 in-game books or lore entries.', iconType: 'emoji', icon: '📚', isManual: true, requirements: [] },
    { id: 'trophy-21', name: 'The Beastmaster', description: 'Tame a pet.', iconType: 'emoji', icon: '🐾', isManual: true, requirements: [] },
    { id: 'trophy-22', name: 'The Angler', description: 'Catch 50 fish.', iconType: 'emoji', icon: '🎣', isManual: true, requirements: [] },
    { id: 'trophy-23', name: 'The Gardener', description: 'Harvest 100 plants.', iconType: 'emoji', icon: '🌱', isManual: true, requirements: [] },
    { id: 'trophy-24', name: 'The Chef', description: 'Cook 20 different recipes.', iconType: 'emoji', icon: '🍳', isManual: true, requirements: [] },
    { id: 'trophy-25', name: 'The Alchemist', description: 'Brew 15 different potions.', iconType: 'emoji', icon: '⚗️', isManual: true, requirements: [] },
    { id: 'trophy-26', name: 'The Enchanter', description: 'Enchant an item.', iconType: 'emoji', icon: '✨', isManual: true, requirements: [] },
    { id: 'trophy-27', name: 'The Blacksmith', description: 'Forge an item.', iconType: 'emoji', icon: '🔥', isManual: true, requirements: [] },
    { id: 'trophy-28', name: 'The Jeweler', description: 'Cut a gemstone.', iconType: 'emoji', icon: '💎', isManual: true, requirements: [] },
    { id: 'trophy-29', name: 'The Scribe', description: 'Write a scroll.', iconType: 'emoji', icon: '📜', isManual: true, requirements: [] },
    { id: 'trophy-30', name: 'The Cartographer', description: 'Map out a new zone.', iconType: 'emoji', icon: '🗺️', isManual: true, requirements: [] },
    { id: 'trophy-31', name: 'The Archaeologist', description: 'Uncover a lost artifact.', iconType: 'emoji', icon: '🏺', isManual: true, requirements: [] },
    { id: 'trophy-32', name: 'The Linguist', description: 'Learn a new language.', iconType: 'emoji', icon: '🗣️', isManual: true, requirements: [] },
    { id: 'trophy-33', name: 'The Musician', description: 'Master a musical instrument.', iconType: 'emoji', icon: '🎶', isManual: true, requirements: [] },
    { id: 'trophy-34', name: 'The Dancer', description: 'Learn a new dance.', iconType: 'emoji', icon: '💃', isManual: true, requirements: [] },
    { id: 'trophy-35', name: 'The Painter', description: 'Paint a masterpiece.', iconType: 'emoji', icon: '🎨', isManual: true, requirements: [] },
    { id: 'trophy-36', name: 'The Sculptor', description: 'Carve a statue.', iconType: 'emoji', icon: '🗿', isManual: true, requirements: [] },
    { id: 'trophy-37', name: 'The Artist', description: 'For creating a masterpiece of art.', iconType: 'emoji', icon: '🎨', isManual: true, requirements: [] },
    { id: 'trophy-38', name: 'The Bard', description: 'For a wonderful musical performance.', iconType: 'emoji', icon: '🎵', isManual: true, requirements: [] },
    { id: 'trophy-39', name: 'The Architect', description: 'For building an impressive creation (LEGOs, Minecraft, etc).', iconType: 'emoji', icon: '🏰', isManual: true, requirements: [] },
    { id: 'trophy-40', name: 'The Director', description: 'For creating and editing a video.', iconType: 'emoji', icon: '🎬', isManual: true, requirements: [] },
    { id: 'trophy-41', name: 'The Photographer', description: 'For taking a beautiful photograph.', iconType: 'emoji', icon: '📷', isManual: true, requirements: [] },
    { id: 'trophy-42', name: 'Team Player', description: 'For excellent teamwork in a game.', iconType: 'emoji', icon: '🏅', isManual: true, requirements: [] },
    { id: 'trophy-43', name: 'Personal Best', description: 'For beating your own record.', iconType: 'emoji', icon: '📈', isManual: true, requirements: [] },
    { id: 'trophy-44', name: 'Tournament Victor', description: 'For winning a tournament.', iconType: 'emoji', icon: '🥇', isManual: true, requirements: [] },
    { id: 'trophy-45', name: 'Good Sport', description: 'For showing great sportsmanship, win or lose.', iconType: 'emoji', icon: '🤝', isManual: true, requirements: [] },
    { id: 'trophy-46', name: 'Practice Pays Off', description: 'For mastering a new skill through practice.', iconType: 'emoji', icon: '🎯', isManual: true, requirements: [] },
    { id: 'trophy-47', name: 'Master of the Mop', description: 'For mopping the floors to a sparkling shine.', iconType: 'emoji', icon: '✨', isManual: true, requirements: [] },
    { id: 'trophy-48', name: 'Laundry Lord', description: 'For washing, drying, and folding 5 loads of laundry.', iconType: 'emoji', icon: '🧺', isManual: