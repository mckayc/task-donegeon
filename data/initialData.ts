import { User, Role, RewardTypeDefinition, RewardCategory, Rank, Trophy, TrophyRequirementType, QuestType, Market, Quest, QuestAvailability, Guild, AppSettings, SidebarConfigItem, GameAsset, ThemeDefinition, ThemeStyle, QuestCompletion, QuestCompletionStatus } from '../types';

export const createMockUsers = (): User[] => {
    const usersData: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>[] = [
        // Donegeon Masters
        { firstName: 'The', lastName: 'Admin', username: 'admin', email: 'admin@donegeon.com', gameName: 'admin', birthday: '2000-01-01', role: Role.DonegeonMaster, password: '123456', pin: '1234' },
        
        // Gatekeepers
        { firstName: 'Gate', lastName: 'Keeper', username: 'gatekeeper', email: 'gatekeeper@donegeon.com', gameName: 'Gatekeeper', birthday: '1995-08-20', role: Role.Gatekeeper, password: '123456', pin: '1234' },

        // Explorers
        { firstName: 'New', lastName: 'Explorer', username: 'explorer', email: 'explorer@donegeon.com', gameName: 'Explorer', birthday: '2010-04-15', role: Role.Explorer, pin: '1234' },
    ];

    const initialUsers = usersData.map((u, i) => ({
        ...u,
        id: `user-${i + 1}`,
        avatar: {},
        ownedAssetIds: [],
        personalPurse: {},
        personalExperience: {},
        guildBalances: {},
        ownedThemes: ['emerald', 'rose', 'sky'],
        hasBeenOnboarded: false,
    }));

    // Give explorer starting gold for the tutorial quest
    const explorer = initialUsers.find(u => u.username === 'explorer');
    if (explorer) {
        explorer.personalPurse = { 'core-gold': 100 };
    }
    
    return initialUsers;
};

export const INITIAL_REWARD_TYPES: RewardTypeDefinition[] = [
    { id: 'core-gold', name: 'Gold Coins', category: RewardCategory.Currency, description: 'Can be exchanged for real money or items.', isCore: true, icon: '💰' },
    { id: 'core-gems', name: 'Gems', category: RewardCategory.Currency, description: 'Earned from service or helping. Used for experiences.', isCore: true, icon: '💎' },
    { id: 'core-crystal', name: 'Crystals', category: RewardCategory.Currency, description: 'Earned from small tasks. Used for screen time.', isCore: true, icon: '🔮' },
    { id: 'core-strength', name: 'Strength', category: RewardCategory.XP, description: 'Earned from physical tasks.', isCore: true, icon: '💪' },
    { id: 'core-diligence', name: 'Diligence', category: RewardCategory.XP, description: 'Earned from careful, persistent work like cleaning and organizing.', isCore: true, icon: '🧹' },
    { id: 'core-wisdom', name: 'Wisdom', category: RewardCategory.XP, description: 'Earned from learning activities.', isCore: true, icon: '🧠' },
    { id: 'core-skill', name: 'Skill', category: RewardCategory.XP, description: 'Earned from practice and sports.', isCore: true, icon: '🎯' },
    { id: 'core-creative', name: 'Creativity', category: RewardCategory.XP, description: 'Earned from artistic and creative endeavors.', isCore: true, icon: '🎨' },
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


export const INITIAL_RANKS: Rank[] = Array.from({ length: 50 }, (_, i) => ({
    id: `rank-${i + 1}`,
    name: rankNames[i] || `Level ${i + 1}`,
    xpThreshold: Math.floor(i * (50 + i * 5)),
    icon: rankIcons[i] || '❓',
}));

export const INITIAL_MAIN_SIDEBAR_CONFIG: SidebarConfigItem[] = [
  // Top Level - The Core Four
  { type: 'link', id: 'Dashboard', emoji: '🏠', isVisible: true, level: 0, role: Role.Explorer, termKey: 'link_dashboard' },
  { type: 'link', id: 'Quests', emoji: '🗺️', isVisible: true, level: 0, role: Role.Explorer, termKey: 'link_quests' },
  { type: 'link', id: 'Marketplace', emoji: '💰', isVisible: true, level: 0, role: Role.Explorer, termKey: 'link_marketplace' },
  { type: 'link', id: 'Calendar', emoji: '🗓️', isVisible: true, level: 0, role: Role.Explorer, termKey: 'link_calendar' },
  
  // Character Section
  { type: 'header', id: 'header-character', title: 'Character', level: 0, role: Role.Explorer, isVisible: true },
  { type: 'link', id: 'Avatar', emoji: '🧑‍🎤', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_avatar' },
  { type: 'link', id: 'Collection', emoji: '🎒', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_collection' },
  { type: 'link', id: 'Themes', emoji: '🎨', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_themes' },
  { type: 'link', id: 'Guild', emoji: '🏰', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_guild' },
  { type: 'link', id: 'Progress', emoji: '📊', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_progress' },
  { type: 'link', id: 'Trophies', emoji: '🏆', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_trophies' },
  { type: 'link', id: 'Ranks', emoji: '🎖️', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_ranks' },
  { type: 'link', id: 'Chronicles', emoji: '📜', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_chronicles' },

  // Administration Section
  { type: 'header', id: 'header-admin-content', title: 'Content Management', level: 0, role: Role.DonegeonMaster, isVisible: true },
  { type: 'link', id: 'Manage Quests', emoji: '📜', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_quests' },
  { type: 'link', id: 'Manage Items', emoji: '⚔️', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_items' },
  { type: 'link', id: 'Manage Markets', emoji: '🛒', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_markets' },
  { type: 'link', id: 'Manage Rewards', emoji: '💎', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_rewards' },
  { type: 'link', id: 'Manage Ranks', emoji: '🏅', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_ranks' },
  { type: 'link', id: 'Manage Trophies', emoji: '🏆', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_trophies' },
  { type: 'link', id: 'Theme Editor', emoji: '🎭', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_theme_editor' },

  { type: 'header', id: 'header-admin-community', title: 'Manage Guild', level: 0, role: Role.Gatekeeper, isVisible: true },
  { type: 'link', id: 'Approvals', emoji: '✅', isVisible: true, level: 1, role: Role.Gatekeeper, termKey: 'link_approvals' },
  { type: 'link', id: 'Manage Users', emoji: '👥', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_users' },
  { type: 'link', id: 'Manage Guilds', emoji: '🏰', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_guilds' },

  { type: 'header', id: 'header-admin-system', title: 'System Tools', level: 0, role: Role.DonegeonMaster, isVisible: true },
  { type: 'link', id: 'AI Studio', emoji: '✨', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_ai_studio' },
  { type: 'link', id: 'Appearance', emoji: '🖌️', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_appearance' },
  { type: 'link', id: 'Data Management', emoji: '🗃️', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_data_management' },
  
  { type: 'link', id: 'Settings', emoji: '⚙️', isVisible: true, level: 0, role: Role.DonegeonMaster, termKey: 'link_settings' },

  // Help Section
  { type: 'header', id: 'header-help', title: 'Help', level: 0, role: Role.Explorer, isVisible: true },
  { type: 'link', id: 'About', emoji: 'ℹ️', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_about' },
  { type: 'link', id: 'Help Guide', emoji: '❓', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_help_guide' },
];

const rawThemes: { [key: string]: ThemeStyle } = {
  emerald: { '--font-display': "'MedievalSharp', cursive", '--font-body': "'Roboto', sans-serif", '--font-size-display': '2.75rem', '--font-size-body': '1rem', '--color-bg-primary': "224 71% 4%", '--color-bg-secondary': "224 39% 10%", '--color-bg-tertiary': "240 10% 19%", '--color-text-primary': "240 8% 90%", '--color-text-secondary': "240 6% 65%", '--color-border': "240 6% 30%", '--color-primary-hue': "158", '--color-primary-saturation': "84%", '--color-primary-lightness': "39%", '--color-accent-hue': "158", '--color-accent-saturation': "75%", '--color-accent-lightness': "58%", '--color-accent-light-hue': "158", '--color-accent-light-saturation': "70%", '--color-accent-light-lightness': "45%" },
  rose: { '--font-display': "'MedievalSharp', cursive", '--font-body': "'Roboto', sans-serif", '--font-size-display': '2.75rem', '--font-size-body': '1rem', '--color-bg-primary': "334 27% 10%", '--color-bg-secondary': "334 20% 15%", '--color-bg-tertiary': "334 15% 22%", '--color-text-primary': "346 33% 94%", '--color-text-secondary': "346 20% 70%", '--color-border': "346 15% 40%", '--color-primary-hue': "346", '--color-primary-saturation': "84%", '--color-primary-lightness': "59%", '--color-accent-hue': "346", '--color-accent-saturation': "91%", '--color-accent-lightness': "71%", '--color-accent-light-hue': "346", '--color-accent-light-saturation': "80%", '--color-accent-light-lightness': "60%" },
  sky: { '--font-display': "'MedievalSharp', cursive", '--font-body': "'Roboto', sans-serif", '--font-size-display': '2.75rem', '--font-size-body': '1rem', '--color-bg-primary': "217 33% 12%", '--color-bg-secondary': "217 28% 17%", '--color-bg-tertiary': "217 25% 25%", '--color-text-primary': "210 40% 98%", '--color-text-secondary': "215 25% 75%", '--color-border': "215 20% 40%", '--color-primary-hue': "204", '--color-primary-saturation': "85%", '--color-primary-lightness': "54%", '--color-accent-hue': "202", '--color-accent-saturation': "90%", '--color-accent-lightness': "70%", '--color-accent-light-hue': "202", '--color-accent-light-saturation': "80%", '--color-accent-light-lightness': "60%" },
  sapphire: { '--font-display': "'MedievalSharp', cursive", '--font-body': "'Roboto', sans-serif", '--font-size-display': '2.75rem', '--font-size-body': '1rem', '--color-bg-primary': "217 33% 12%", '--color-bg-secondary': "217 28% 17%", '--color-bg-tertiary': "217 25% 25%", '--color-text-primary': "210 40% 98%", '--color-text-secondary': "215 25% 75%", '--color-border': "215 20% 40%", '--color-primary-hue': "217", '--color-primary-saturation': "90%", '--color-primary-lightness': "61%", '--color-accent-hue': "217", '--color-accent-saturation': "85%", '--color-accent-lightness': "75%", '--color-accent-light-hue': "217", '--color-accent-light-saturation': "95%", '--color-accent-light-lightness': "85%" },
  arcane: { '--font-display': "'Uncial Antiqua', cursive", '--font-body': "'Roboto', sans-serif", '--font-size-display': '2.75rem', '--font-size-body': '1rem', '--color-bg-primary': "265 39% 12%", '--color-bg-secondary': "265 30% 18%", '--color-bg-tertiary': "265 25% 25%", '--color-text-primary': "271 67% 93%", '--color-text-secondary': "271 25% 75%", '--color-border': "271 20% 45%", '--color-primary-hue': "265", '--color-primary-saturation': "60%", '--color-primary-lightness': "55%", '--color-accent-hue': "265", '--color-accent-saturation': "70%", '--color-accent-lightness': "75%", '--color-accent-light-hue': "45", '--color-accent-light-saturation': "80%", '--color-accent-light-lightness': "65%" },
  cartoon: { '--font-display': "'Comic Neue', cursive", '--font-body': "'Comic Neue', cursive", '--font-size-display': '2.75rem', '--font-size-body': '1rem', '--color-bg-primary': "214 53% 15%", '--color-bg-secondary': "214 43% 22%", '--color-bg-tertiary': "214 38% 30%", '--color-text-primary': "210 40% 96%", '--color-text-secondary': "210 30% 75%", '--color-border': "210 25% 45%", '--color-primary-hue': "25", '--color-primary-saturation': "95%", '--color-primary-lightness': "55%", '--color-accent-hue': "200", '--color-accent-saturation': "85%", '--color-accent-lightness': "60%", '--color-accent-light-hue': "200", '--color-accent-light-saturation': "90%", '--color-accent-light-lightness': "70%" },
  forest: { '--font-display': "'Metamorphous', serif", '--font-body': "'Roboto', sans-serif", '--font-size-display': '2.75rem', '--font-size-body': '1rem', '--color-bg-primary': "120 25% 10%", '--color-bg-secondary': "120 20% 15%", '--color-bg-tertiary': "120 15% 22%", '--color-text-primary': "90 30% 90%", '--color-text-secondary': "90 15% 65%", '--color-border': "120 10% 35%", '--color-primary-hue': "130", '--color-primary-saturation': "60%", '--color-primary-lightness': "40%", '--color-accent-hue': "90", '--color-accent-saturation': "50%", '--color-accent-lightness': "65%", '--color-accent-light-hue': "40", '--color-accent-light-saturation': "50%", '--color-accent-light-lightness': "55%" },
  ocean: { '--font-display': "'Uncial Antiqua', cursive", '--font-body': "'Roboto', sans-serif", '--font-size-display': '2.75rem', '--font-size-body': '1rem', '--color-bg-primary': "200 100% 10%", '--color-bg-secondary': "200 80% 18%", '--color-bg-tertiary': "200 70% 25%", '--color-text-primary': "190 70% 95%", '--color-text-secondary': "190 40% 75%", '--color-border': "190 40% 40%", '--color-primary-hue': '180', '--color-primary-saturation': '85%', '--color-primary-lightness': '45%', '--color-accent-hue': '190', '--color-accent-saturation': '80%', '--color-accent-lightness': '60%', '--color-accent-light-hue': '190', '--color-accent-light-saturation': '70%', '--color-accent-light-lightness': '70%' },
  vulcan: { '--font-display': "'Metamorphous', serif", '--font-body': "'Roboto', sans-serif", '--font-size-display': '2.75rem', '--font-size-body': '1rem', '--color-bg-primary': "10 50% 8%", '--color-bg-secondary': "10 40% 12%", '--color-bg-tertiary': "10 35% 18%", '--color-text-primary': "10 10% 90%", '--color-text-secondary': "10 5% 65%", '--color-border': "10 10% 35%", '--color-primary-hue': "0", '--color-primary-saturation': "85%", '--color-primary-lightness': "50%", '--color-accent-hue': "25", '--color-accent-saturation': "90%", '--color-accent-lightness': "60%", '--color-accent-light-hue': "45", '--color-accent-light-saturation': "80%", '--color-accent-light-lightness': "65%" },
  royal: { '--font-display': "'Uncial Antiqua', cursive", '--font-body': "'Roboto', sans-serif", '--font-size-display': '2.75rem', '--font-size-body': '1rem', '--color-bg-primary': "250 40% 10%", '--color-bg-secondary': "250 30% 16%", '--color-bg-tertiary': "250 25% 24%", '--color-text-primary': "250 50% 92%", '--color-text-secondary': "250 25% 70%", '--color-border': "250 20% 40%", '--color-primary-hue': "250", '--color-primary-saturation': "60%", '--color-primary-lightness': "50%", '--color-accent-hue': "45", '--color-accent-saturation': "80%", '--color-accent-lightness': "60%", '--color-accent-light-hue': "45", '--color-accent-light-saturation': "85%", '--color-accent-light-lightness': "70%" },
  winter: { '--font-display': "'Metamorphous', serif", '--font-body': "'Roboto', sans-serif", '--font-size-display': '2.75rem', '--font-size-body': '1rem', '--color-bg-primary': "205 30% 15%", '--color-bg-secondary': "205 25% 22%", '--color-bg-tertiary': "205 20% 30%", '--color-text-primary': "205 60% 95%", '--color-text-secondary': "205 30% 75%", '--color-border': "205 20% 45%", '--color-primary-hue': "205", '--color-primary-saturation': "70%", '--color-primary-lightness': "50%", '--color-accent-hue': "195", '--color-accent-saturation': "80%", '--color-accent-lightness': "65%", '--color-accent-light-hue': "215", '--color-accent-light-saturation': "60%", '--color-accent-light-lightness': "55%" },
  sunset: { '--font-display': "'MedievalSharp', cursive", '--font-body': "'Roboto', sans-serif", '--font-size-display': '2.75rem', '--font-size-body': '1rem', '--color-bg-primary': "20 50% 10%", '--color-bg-secondary': "20 40% 15%", '--color-bg-tertiary': "20 35% 22%", '--color-text-primary': "30 80% 90%", '--color-text-secondary': "30 40% 70%", '--color-border': "30 20% 40%", '--color-primary-hue': "15", '--color-primary-saturation': "90%", '--color-primary-lightness': "60%", '--color-accent-hue': "35", '--color-accent-saturation': "95%", '--color-accent-lightness': "65%", '--color-accent-light-hue': "340", '--color-accent-light-saturation': "80%", '--color-accent-light-lightness': "70%" },
  cyberpunk: { '--font-display': "'Press Start 2P', cursive", '--font-body': "'Roboto', sans-serif", '--font-size-display': '2.75rem', '--font-size-body': '1rem', '--color-bg-primary': "260 50% 5%", '--color-bg-secondary': "280 40% 10%", '--color-bg-tertiary': "300 30% 15%", '--color-text-primary': "320 100% 95%", '--color-text-secondary': "300 50% 75%", '--color-border': "300 30% 35%", '--color-primary-hue': "320", '--color-primary-saturation': "100%", '--color-primary-lightness': "60%", '--color-accent-hue': "180", '--color-accent-saturation': "100%", '--color-accent-lightness': "50%", '--color-accent-light-hue': "55", '--color-accent-light-saturation': "100%", '--color-accent-light-lightness': "50%" },
  steampunk: { '--font-display': "'IM Fell English SC', serif", '--font-body': "'Roboto', sans-serif", '--font-size-display': '2.75rem', '--font-size-body': '1rem', '--color-bg-primary': "30 20% 12%", '--color-bg-secondary': "30 15% 18%", '--color-bg-tertiary': "30 10% 25%", '--color-text-primary': "35 30% 85%", '--color-text-secondary': "35 20% 65%", '--color-border': "35 15% 40%", '--color-primary-hue': "30", '--color-primary-saturation': "60%", '--color-primary-lightness': "50%", '--color-accent-hue': "190", '--color-accent-saturation': "40%", '--color-accent-lightness': "55%", '--color-accent-light-hue': "20", '--color-accent-light-saturation': "30%", '--color-accent-light-lightness': "60%" },
  parchment: { '--font-display': "'IM Fell English SC', serif", '--font-body': "'Roboto', sans-serif", '--font-size-display': '2.75rem', '--font-size-body': '1rem', '--color-bg-primary': "40 30% 85%", '--color-bg-secondary': "40 25% 90%", '--color-bg-tertiary': "40 20% 95%", '--color-text-primary': "35 40% 15%", '--color-text-secondary': "35 30% 35%", '--color-border': "35 20% 70%", '--color-primary-hue': "20", '--color-primary-saturation': "50%", '--color-primary-lightness': "40%", '--color-accent-hue': "0", '--color-accent-saturation': "50%", '--color-accent-lightness': "45%", '--color-accent-light-hue': "10", '--color-accent-light-saturation': "40%", '--color-accent-light-lightness': "50%" },
  eerie: { '--font-display': "'Metamorphous', serif", '--font-body': "'Roboto', sans-serif", '--font-size-display': '2.75rem', '--font-size-body': '1rem', '--color-bg-primary': "120 10% 8%", '--color-bg-secondary': "120 8% 12%", '--color-bg-tertiary': "120 5% 18%", '--color-text-primary': "120 30% 88%", '--color-text-secondary': "120 15% 65%", '--color-border': "120 10% 30%", '--color-primary-hue': "120", '--color-primary-saturation': "40%", '--color-primary-lightness': "45%", '--color-accent-hue': "80", '--color-accent-saturation': "50%", '--color-accent-lightness': "55%", '--color-accent-light-hue': "30", '--color-accent-light-saturation': "40%", '--color-accent-light-lightness': "50%" },
};

export const INITIAL_THEMES: ThemeDefinition[] = Object.entries(rawThemes).map(([id, styles]) => ({
  id,
  name: id.charAt(0).toUpperCase() + id.slice(1),
  isCustom: false,
  styles
}));

export const INITIAL_SETTINGS: AppSettings = {
    forgivingSetbacks: true,
    vacationMode: {
        enabled: false,
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
    },
    sharedMode: {
        enabled: false,
        quickUserSwitchingEnabled: true,
        allowCompletion: false,
        autoExit: false,
        autoExitMinutes: 2,
        userIds: [],
    },
    automatedBackups: {
        enabled: false,
        frequencyHours: 24,
        maxBackups: 7,
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
      admin: 'Donegeon Master',
      moderator: 'Gatekeeper',
      user: 'Explorer',
      link_dashboard: 'Dashboard',
      link_quests: 'Quests',
      link_marketplace: 'Marketplace',
      link_calendar: 'Calendar',
      link_avatar: 'Avatar',
      link_collection: 'Collection',
      link_themes: 'Themes',
      link_guild: 'Guild',
      link_progress: 'Progress',
      link_trophies: 'Trophies',
      link_ranks: 'Ranks',
      link_chronicles: 'Chronicles',
      link_manage_quests: 'Manage Quests',
      link_manage_items: 'Manage Items',
      link_manage_markets: 'Manage Markets',
      link_manage_rewards: 'Manage Rewards',
      link_manage_ranks: 'Manage Ranks',
      link_manage_trophies: 'Manage Trophies',
      link_theme_editor: 'Theme Editor',
      link_approvals: 'Approvals',
      link_manage_users: 'Manage Users',
      link_manage_guilds: 'Manage Guilds',
      link_ai_studio: 'AI Studio',
      link_appearance: 'Appearance',
      link_object_exporter: 'Object Exporter',
      link_asset_manager: 'Asset Manager',
      link_backup_import: 'Backup & Import',
      link_asset_library: 'Asset Library',
      link_data_management: 'Data Management',
      link_settings: 'Settings',
      link_about: 'About',
      link_help_guide: 'Help Guide',
      link_chat: 'Chat',
    },
    enableAiFeatures: false,
    chat: {
        enabled: false,
        chatEmoji: '💬',
    },
    sidebars: {
        main: INITIAL_MAIN_SIDEBAR_CONFIG,
        dataManagement: [
            { type: 'link', id: 'Object Exporter', emoji: '🗂️', isVisible: true, level: 0, role: Role.DonegeonMaster, termKey: 'link_object_exporter' },
            { type: 'link', id: 'Asset Manager', emoji: '🖼️', isVisible: true, level: 0, role: Role.DonegeonMaster, termKey: 'link_asset_manager' },
            { type: 'link', id: 'Asset Library', emoji: '📚', isVisible: true, level: 0, role: Role.DonegeonMaster, termKey: 'link_asset_library' },
            { type: 'link', id: 'Backup & Import', emoji: '💾', isVisible: true, level: 0, role: Role.DonegeonMaster, termKey: 'link_backup_import' },
        ]
    }
};

export const INITIAL_TROPHIES: Trophy[] = [
    { id: 'trophy-1', name: 'First Quest', description: 'Complete your first quest.', icon: '🎉', isManual: false, requirements: [{type: TrophyRequirementType.CompleteQuestType, value: QuestType.Duty, count: 1}] },
    { id: 'trophy-2', name: 'First Customization', description: 'Change your theme for the first time.', icon: '🎨', isManual: true, requirements: [] },
    { id: 'trophy-3', name: 'The Adjudicator', description: 'Approve or reject a pending quest.', icon: '⚖️', isManual: true, requirements: [] },
    { id: 'trophy-4', name: 'World Builder', description: 'Create a new quest.', icon: '🛠️', isManual: true, requirements: [] },
    { id: 'trophy-5', name: 'The Name Changer', description: 'Rename a user in the Manage Users panel.', icon: '✍️', isManual: true, requirements: [] },
    { id: 'trophy-6', name: 'Initiate Rank', description: 'Achieve the rank of Initiate', icon: '🌱', isManual: false, requirements: [{type: TrophyRequirementType.AchieveRank, value: 'rank-2', count: 1}]},
    { id: 'trophy-7', name: 'The Philanthropist', description: 'Donate an item to a guildmate.', icon: '🎁', isManual: true, requirements: [] },
    { id: 'trophy-8', name: 'Master of Coin', description: 'Amass 1,000 gold.', icon: '💰', isManual: true, requirements: [] },
    { id: 'trophy-9', name: 'Dungeon Crawler', description: 'Complete 10 Ventures.', icon: '🗺️', isManual: true, requirements: [] },
    { id: 'trophy-10', name: 'Daily Grind', description: 'Complete 25 Duties.', icon: '⚙️', isManual: true, requirements: [] },
    { id: 'trophy-11', name: 'The Collector', description: 'Own 10 unique items.', icon: '📦', isManual: true, requirements: [] },
    { id: 'trophy-12', name: 'Fashionista', description: 'Own 5 pieces of avatar equipment.', icon: '🧑‍🎤', isManual: true, requirements: [] },
    { id: 'trophy-13', name: 'The Completionist', description: 'Complete all available quests for a day.', icon: '💯', isManual: true, requirements: [] },
    { id: 'trophy-14', name: 'The Achiever', description: 'Earn 5 other trophies.', icon: '🏆', isManual: true, requirements: [] },
    { id: 'trophy-15', name: 'The Socialite', description: 'Join a guild.', icon: '🤝', isManual: true, requirements: [] },
    { id: 'trophy-16', name: 'The Founder', description: 'Create a guild.', icon: '🏰', isManual: true, requirements: [] },
    { id: 'trophy-17', name: 'The Merchant', description: 'Sell an item in the marketplace.', icon: '📈', isManual: true, requirements: [] },
    { id: 'trophy-18', name: 'The Artisan', description: 'Craft an item.', icon: '🔨', isManual: true, requirements: [] },
    { id: 'trophy-19', name: 'The Explorer', description: 'Discover a hidden area or secret.', icon: '🧭', isManual: true, requirements: [] },
    { id: 'trophy-20', name: 'The Loremaster', description: 'Read 10 in-game books or lore entries.', icon: '📚', isManual: true, requirements: [] },
    { id: 'trophy-21', name: 'The Beastmaster', description: 'Tame a pet.', icon: '🐾', isManual: true, requirements: [] },
    { id: 'trophy-22', name: 'The Angler', description: 'Catch 50 fish.', icon: '🎣', isManual: true, requirements: [] },
    { id: 'trophy-23', name: 'The Gardener', description: 'Harvest 100 plants.', icon: '🌱', isManual: true, requirements: [] },
    { id: 'trophy-24', name: 'The Chef', description: 'Cook 20 different recipes.', icon: '🍳', isManual: true, requirements: [] },
    { id: 'trophy-25', name: 'The Alchemist', description: 'Brew 15 different potions.', icon: '⚗️', isManual: true, requirements: [] },
    { id: 'trophy-26', name: 'The Enchanter', description: 'Enchant an item.', icon: '✨', isManual: true, requirements: [] },
    { id: 'trophy-27', name: 'The Blacksmith', description: 'Forge an item.', icon: '🔥', isManual: true, requirements: [] },
    { id: 'trophy-28', name: 'The Jeweler', description: 'Cut a gemstone.', icon: '💎', isManual: true, requirements: [] },
    { id: 'trophy-29', name: 'The Scribe', description: 'Write a scroll.', icon: '📜', isManual: true, requirements: [] },
    { id: 'trophy-30', name: 'The Cartographer', description: 'Map out a new zone.', icon: '🗺️', isManual: true, requirements: [] },
    { id: 'trophy-31', name: 'The Archaeologist', description: 'Uncover a lost artifact.', icon: '🏺', isManual: true, requirements: [] },
    { id: 'trophy-32', name: 'The Linguist', description: 'Learn a new language.', icon: '🗣️', isManual: true, requirements: [] },
    { id: 'trophy-33', name: 'The Musician', description: 'Master a musical instrument.', icon: '🎶', isManual: true, requirements: [] },
    { id: 'trophy-34', name: 'The Dancer', description: 'Learn a new dance.', icon: '💃', isManual: true, requirements: [] },
    { id: 'trophy-35', name: 'The Painter', description: 'Paint a masterpiece.', icon: '🎨', isManual: true, requirements: [] },
    { id: 'trophy-36', name: 'The Sculptor', description: 'Carve a statue.', icon: '🗿', isManual: true, requirements: [] },
    { id: 'trophy-37', name: 'The Artist', description: 'For creating a masterpiece of art.', icon: '🎨', isManual: true, requirements: [] },
    { id: 'trophy-38', name: 'The Bard', description: 'For a wonderful musical performance.', icon: '🎵', isManual: true, requirements: [] },
    { id: 'trophy-39', name: 'The Architect', description: 'For building an impressive creation (LEGOs, Minecraft, etc).', icon: '🏰', isManual: true, requirements: [] },
    { id: 'trophy-40', name: 'The Director', description: 'For creating and editing a video.', icon: '🎬', isManual: true, requirements: [] },
    { id: 'trophy-41', name: 'The Photographer', description: 'For taking a beautiful photograph.', icon: '📷', isManual: true, requirements: [] },
    { id: 'trophy-42', name: 'Team Player', description: 'For excellent teamwork in a game.', icon: '🏅', isManual: true, requirements: [] },
    { id: 'trophy-43', name: 'Personal Best', description: 'For beating your own record.', icon: '📈', isManual: true, requirements: [] },
    { id: 'trophy-44', name: 'Tournament Victor', description: 'For winning a tournament.', icon: '🥇', isManual: true, requirements: [] },
    { id: 'trophy-45', name: 'Good Sport', description: 'For showing great sportsmanship, win or lose.', icon: '🤝', isManual: true, requirements: [] },
    { id: 'trophy-46', name: 'Practice Pays Off', description: 'For mastering a new skill through practice.', icon: '🎯', isManual: true, requirements: [] },
    { id: 'trophy-47', name: 'Master of the Mop', description: 'For mopping the floors to a sparkling shine.', icon: '✨', isManual: true, requirements: [] },
    { id: 'trophy-48', name: 'Laundry Lord', description: 'For washing, drying, and folding 5 loads of laundry.', icon: '🧺', isManual: true, requirements: [] },
    { id: 'trophy-49', name: 'The Green Thumb', description: 'For keeping a plant alive for a month.', icon: '🪴', isManual: true, requirements: [] },
    { id: 'trophy-50', name: 'The Organizer', description: 'For decluttering a messy drawer or closet.', icon: '🗂️', isManual: true, requirements: [] },
    { id: 'trophy-51', name: 'The Recycler', description: 'For consistently sorting the recycling correctly.', icon: '♻️', isManual: true, requirements: [] },
    { id: 'trophy-52', name: 'The Repairman', description: 'For fixing something that was broken.', icon: '🛠️', isManual: true, requirements: [] },
    { id: 'trophy-53', name: 'The Pet Pal', description: 'For taking excellent care of a pet.', icon: '🐾', isManual: true, requirements: [] },
    { id: 'trophy-54', name: 'The Dust Slayer', description: 'For dusting the entire house.', icon: '🌬️', isManual: true, requirements: [] },
    { id: 'trophy-55', name: 'Honor Roll', description: 'For getting straight A\'s on a report card.', icon: '🅰️', isManual: true, requirements: [] },
    { id: 'trophy-56', name: 'Perfect Attendance', description: 'For not missing a single day of school.', icon: '🗓️', isManual: true, requirements: [] },
    { id: 'trophy-57', name: 'Science Fair Winner', description: 'For winning a prize at the science fair.', icon: '🥇', isManual: true, requirements: [] },
    { id: 'trophy-58', name: 'Spelling Bee Champ', description: 'For winning the spelling bee.', icon: '🐝', isManual: true, requirements: [] },
    { id: 'trophy-59', name: 'Book Worm', description: 'For reading 25 books in a school year.', icon: '🐛', isManual: true, requirements: [] },
    { id: 'trophy-60', name: 'The Punisher', description: 'For telling an exceptionally great (or terrible) pun.', icon: '😂', isManual: true, requirements: [] },
    { id: 'trophy-61', name: 'Klutz of the Week', description: 'For a spectacular, harmless trip or fall.', icon: '🤕', isManual: true, requirements: [] },
    { id: 'trophy-62', name: 'Bed Head', description: 'For having the most epic bed head one morning.', icon: '🛌', isManual: true, requirements: [] },
    { id: 'trophy-63', name: 'The Snorter', description: 'For laughing so hard you snorted.', icon: '🐽', isManual: true, requirements: [] },
    { id: 'trophy-64', name: 'Brain Fart', description: 'For a truly memorable moment of forgetfulness.', icon: '💨', isManual: true, requirements: [] },
    { id: 'trophy-65', name: 'The Snackinator', description: 'For impressively finishing a bag of snacks.', icon: '🍿', isManual: true, requirements: [] },
    { id: 'trophy-66', name: 'The Drama Llama', description: 'For an award-worthy dramatic performance over something small.', icon: '🎭', isManual: true, requirements: [] },
    { id: 'trophy-67', name: 'Early Bird', description: 'For waking up on time without being told for a whole week.', icon: '🌅', isManual: true, requirements: [] },
    { id: 'trophy-68', name: 'Night Owl', description: 'For staying up late to finish a project.', icon: '🦉', isManual: true, requirements: [] },
    { id: 'trophy-69', name: 'Hydration Hero', description: 'For drinking 8 glasses of water in a day.', icon: '💧', isManual: true, requirements: [] },
    { id: 'trophy-70', name: 'The Diplomat', description: 'For resolving an argument peacefully.', icon: '🕊️', isManual: true, requirements: [] },
    { id: 'trophy-71', name: 'The Comedian', description: 'For making the entire family laugh out loud.', icon: '🤣', isManual: true, requirements: [] },
    { id: 'trophy-72', name: 'The Encourager', description: 'For cheering up a family member who was feeling down.', icon: '🤗', isManual: true, requirements: [] },
    { id: 'trophy-73', name: 'The Listener', description: 'For being a great listener when someone needed to talk.', icon: '👂', isManual: true, requirements: [] },
    { id: 'trophy-74', name: 'The Giver', description: 'For giving a thoughtful, handmade gift.', icon: '🎁', isManual: true, requirements: [] },
    { id: 'trophy-75', name: 'The Helper', description: 'For helping a sibling with their homework.', icon: '🧑‍🏫', isManual: true, requirements: [] },
    { id: 'trophy-76', name: 'The Collaborator', description: 'For working well on a family project.', icon: '🧑‍🤝‍🧑', isManual: true, requirements: [] },
    { id: 'trophy-77', name: 'The Welcomer', description: 'For making a guest feel welcome and included.', icon: '👋', isManual: true, requirements: [] },
    { id: 'trophy-78', name: 'Speed Runner', description: 'For getting ready for school in record time.', icon: '⏱️', isManual: true, requirements: [] },
    { id: 'trophy-79', name: 'Completionist', description: 'For finishing all your homework before dinner.', icon: '💯', isManual: true, requirements: [] },
    { id: 'trophy-80', name: 'The Strategist', description: 'For winning a board game with a clever strategy.', icon: '♟️', isManual: true, requirements: [] },
    { id: 'trophy-81', 'name': 'The Farmer', 'description': 'For helping with gardening or yard work.', 'icon': '🧑‍🌾', 'isManual': true, 'requirements': [] },
    { id: 'trophy-82', name: 'The Co-op King', description: 'For successfully completing a two-person chore with a sibling.', icon: '🤝', isManual: true, requirements: [] },
    { id: 'trophy-83', name: 'The Patient One', description: 'For waiting patiently without complaining.', icon: '⏳', isManual: true, requirements: [] },
    { id: 'trophy-84', name: 'The Brave', description: 'For going to the doctor or dentist without any fuss.', icon: '씩', isManual: true, requirements: [] },
    { id: 'trophy-85', name: 'The Problem Solver', description: 'For figuring out a tricky problem on your own.', icon: '💡', isManual: true, requirements: [] },
    { id: 'trophy-86', name: 'The Tidy Titan', description: 'For keeping your room clean for a whole week.', icon: '✨', isManual: true, requirements: [] },
    { id: 'trophy-87', name: 'The Gracious', description: 'For remembering to say "please" and "thank you" all day.', icon: '🙏', isManual: true, requirements: [] },
    { id: 'trophy-88', name: 'The Independent', description: 'For completing your morning routine all by yourself.', icon: '🧍', isManual: true, requirements: [] },
    { id: 'trophy-89', name: 'The Tech Support', description: 'For helping a family member with a tech problem.', icon: '💻', isManual: true, requirements: [] },
    { id: 'trophy-90', name: 'The Foodie', description: 'For trying a new food without complaining.', icon: '😋', isManual: true, requirements: [] },
    { id: 'trophy-91', name: 'The On-Time Arrival', description: 'For being ready to leave on time.', icon: '⏰', isManual: true, requirements: [] },
    { id: 'trophy-92', name: 'The Car Cleaner', description: 'For helping to clean out the inside of the car.', icon: '🚗', isManual: true, requirements: [] },
    { id: 'trophy-93', name: 'The Toy Tamer', description: 'For putting away all the toys after playing.', icon: '🧸', isManual: true, requirements: [] },
    { id: 'trophy-94', name: 'The Leftover Legend', description: 'For eating leftovers without a fuss.', icon: '🍲', isManual: true, requirements: [] },
    { id: 'trophy-95', name: 'The Chore Champion', description: 'For doing an extra chore without being asked.', icon: '🌟', isManual: true, requirements: [] },
    { id: 'trophy-96', name: 'The Lost and Found', description: 'For finding something important that was lost.', icon: '🔍', isManual: true, requirements: [] },
    { id: 'trophy-97', name: 'The Penny Pincher', description: 'For saving up your allowance for a goal.', icon: '🐷', isManual: true, requirements: [] },
];

export const createSampleMarkets = (): Market[] => ([
  { id: 'market-tutorial', title: 'Tutorial Market', description: 'A place to complete your first quests.', icon: '🎓', status: 'open' },
  { id: 'market-bank', title: 'The Royal Bank', description: 'Exchange your various currencies here for a small fee.', icon: '🏦', status: 'open' },
  { id: 'market-experiences', title: 'The Guild of Adventurers', description: 'Spend your hard-earned gems on real-world experiences and privileges.', icon: '🎟️', status: 'open' },
  { id: 'market-candy', title: 'The Sugar Cube', description: 'A delightful shop for purchasing sweet treats with your crystals.', icon: '🍬', status: 'open' },
]);

export const createSampleGameAssets = (): GameAsset[] => ([
    { 
        id: 'ga-theme-sapphire', 
        name: 'Sapphire Theme Unlock', 
        description: 'Unlocks the cool blue Sapphire theme for your account.', 
        url: 'https://placehold.co/150/3b82f6/FFFFFF?text=Sapphire', 
        icon: '🎨', 
        category: 'Theme', 
        avatarSlot: undefined, 
        isForSale: true, 
        cost: [{rewardTypeId: 'core-gold', amount: 50}], 
        marketIds: ['market-tutorial'], 
        creatorId: 'user-1', 
        createdAt: new Date().toISOString(), 
        purchaseLimit: 1, 
        purchaseCount: 0,
        linkedThemeId: 'sapphire',
    },
    { id: 'ga-bank-gold-to-gems', name: 'Exchange 10 Gold for 1 Gem', description: 'Exchange your Gold for valuable Gems.', url: 'https://placehold.co/150/4ade80/FFFFFF?text=10G%3D1Gem', icon: '🤝', category: 'Currency Exchange', isForSale: true, cost: [{rewardTypeId: 'core-gold', amount: 10}], payouts: [{rewardTypeId: 'core-gems', amount: 1}], marketIds: ['market-bank'], creatorId: 'system', createdAt: new Date().toISOString(), purchaseLimit: null, purchaseCount: 0 },
    { id: 'ga-bank-gems-to-gold', name: 'Exchange 1 Gem for 8 Gold', description: 'Exchange your Gems for Gold at a slight loss.', url: 'https://placehold.co/150/f43f5e/FFFFFF?text=1Gem%3D8G', icon: '🤝', category: 'Currency Exchange', isForSale: true, cost: [{rewardTypeId: 'core-gems', amount: 1}], payouts: [{rewardTypeId: 'core-gold', amount: 8}], marketIds: ['market-bank'], creatorId: 'system', createdAt: new Date().toISOString(), purchaseLimit: null, purchaseCount: 0 },
    { id: 'ga-exp-movie', name: 'Movie Night Choice', description: 'You get to pick the movie for the next family movie night.', url: 'https://placehold.co/150/f97316/FFFFFF?text=Movie', icon: '🎬', category: 'Real-World Reward', isForSale: true, cost: [{rewardTypeId: 'core-gems', amount: 10}], marketIds: ['market-experiences'], creatorId: 'system', createdAt: new Date().toISOString(), purchaseLimit: 1, purchaseCount: 0 },
    { id: 'ga-exp-game-hour', name: 'One Hour of Gaming', description: 'A voucher for one hour of video games.', url: 'https://placehold.co/150/3b82f6/FFFFFF?text=1+Hour', icon: '🎮', category: 'Real-World Reward', isForSale: true, cost: [{rewardTypeId: 'core-gems', amount: 5}], marketIds: ['market-experiences'], creatorId: 'system', createdAt: new Date().toISOString(), purchaseLimit: null, purchaseCount: 0 },
    { id: 'ga-candy-chocolate', name: 'Chocolate Bar', description: 'A delicious bar of chocolate.', url: 'https://placehold.co/150/78350f/FFFFFF?text=Chocolate', icon: '🍫', category: 'Treat', isForSale: true, cost: [{rewardTypeId: 'core-crystal', amount: 20}], marketIds: ['market-candy'], creatorId: 'system', createdAt: new Date().toISOString(), purchaseLimit: null, purchaseCount: 0 },
    { id: 'ga-candy-lollipop', name: 'Lollipop', description: 'A sweet, colorful lollipop.', url: 'https://placehold.co/150/ec4899/FFFFFF?text=Lollipop', icon: '🍭', category: 'Treat', isForSale: true, cost: [{rewardTypeId: 'core-crystal', amount: 10}], marketIds: ['market-candy'], creatorId: 'system', createdAt: new Date().toISOString(), purchaseLimit: null, purchaseCount: 0 },
]);

export const createInitialGuilds = (users: User[]): Guild[] => ([
  { id: 'guild-1', name: 'The First Guild', purpose: 'The default guild for all new adventurers.', memberIds: users.map(u => u.id), isDefault: true },
]);

export const createSampleQuests = (users: User[]): Quest[] => {
  const explorer = users.find(u => u.role === Role.Explorer);
  const gatekeeper = users.find(u => u.role === Role.Gatekeeper);
  const donegeonMaster = users.find(u => u.role === Role.DonegeonMaster);

  const quests: Quest[] = [
    // For Explorer
    {
      id: 'quest-explorer-1', title: 'Change Your Theme', description: "First, visit the Marketplace and buy the 'Sapphire Theme Unlock' from the Tutorial Market. Then, go to the 'Themes' page from the sidebar to activate it!", type: QuestType.Venture, icon: '🎨', tags: ['tutorial', 'tutorial-explorer'],
      rewards: [{ rewardTypeId: 'core-wisdom', amount: 50 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: explorer ? [explorer.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [],
    },
    {
      id: 'quest-explorer-2', title: 'Consult the Sages', description: "Knowledge is power! Visit the 'Help Guide' from the sidebar to learn the secrets of the Donegeon, then complete this quest.", type: QuestType.Venture, icon: '📖', tags: ['tutorial', 'tutorial-explorer', 'learning'],
      rewards: [{ rewardTypeId: 'core-wisdom', amount: 20 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: explorer ? [explorer.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [],
    },
    {
      id: 'quest-gatekeeper-approval-setup', title: 'Submit A Note', description: "Complete this quest to test the approval system.", type: QuestType.Venture, icon: '📝', tags: ['tutorial', 'tutorial-explorer'],
      rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: explorer ? [explorer.id] : [], requiresApproval: true, claimedByUserIds: [], dismissals: [],
    },
    {
      id: 'quest-explorer-3', title: 'Plan Your Week', description: "The wise adventurer is always prepared. Visit the 'Calendar' page from the sidebar to see your upcoming schedule.", type: QuestType.Venture, icon: '🗓️', tags: ['tutorial', 'tutorial-explorer'],
      rewards: [{ rewardTypeId: 'core-wisdom', amount: 15 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: explorer ? [explorer.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [],
    },
    {
      id: 'quest-explorer-4', title: 'Customize Your Look', description: "Every hero needs a unique look. Visit the 'Avatar' page from the sidebar to see your character customization options.", type: QuestType.Venture, icon: '🧑‍🎤', tags: ['tutorial', 'tutorial-explorer'],
      rewards: [{ rewardTypeId: 'core-creative', amount: 10 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: explorer ? [explorer.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [],
    },
    {
      id: 'quest-explorer-5', title: 'Behold Your Accolades', description: "See what honors you can earn. Visit the 'Trophies' page from the sidebar to view all available awards.", type: QuestType.Venture, icon: '🏆', tags: ['tutorial', 'tutorial-explorer'],
      rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: explorer ? [explorer.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [],
    },
    // For Gatekeeper
    {
      id: 'quest-gatekeeper-1', title: 'Approve a Quest', description: "An explorer has submitted a quest for approval. Go to the 'Approvals' page (under Manage Guild) and verify their work.", type: QuestType.Venture, icon: '✅', tags: ['tutorial', 'tutorial-gatekeeper'],
      rewards: [{ rewardTypeId: 'core-wisdom', amount: 50 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: gatekeeper ? [gatekeeper.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [],
    },
    {
      id: 'quest-gatekeeper-2', title: 'Observe the Timestream', description: "A Gatekeeper must be aware of all events. Visit the 'Chronicles' page to see the history of all completed quests and actions.", type: QuestType.Venture, icon: '📜', tags: ['tutorial', 'tutorial-gatekeeper'],
      rewards: [{ rewardTypeId: 'core-wisdom', amount: 20 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: gatekeeper ? [gatekeeper.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [],
    },
    {
      id: 'quest-gatekeeper-3', title: 'Bestow a Boon', description: "As a Gatekeeper, you can reward adventurers. Go to 'Manage Users', find the Explorer, click 'Adjust', and give them a small bonus of your choice for their hard work.", type: QuestType.Venture, icon: '✨', tags: ['tutorial', 'tutorial-gatekeeper'],
      rewards: [{ rewardTypeId: 'core-wisdom', amount: 30 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: gatekeeper ? [gatekeeper.id] : [], requiresApproval: true, claimedByUserIds: [], dismissals: [],
    },
    // For Donegeon Master
    {
      id: 'quest-dm-1', title: 'Create a Venture', description: "Go to 'Manage Quests' (under Content Management) and create a new one-time quest (a Venture) for your adventurers.", type: QuestType.Venture, icon: '📜', tags: ['tutorial', 'tutorial-donegeon-master'],
      rewards: [{ rewardTypeId: 'core-wisdom', amount: 50 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: donegeonMaster ? [donegeonMaster.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [],
    },
    {
      id: 'quest-dm-2', title: 'Rename an Explorer', description: "Go to 'Manage Users' (under Manage Guild), select the Explorer, and edit their 'Game Name' to something new.", type: QuestType.Venture, icon: '✍️', tags: ['tutorial', 'tutorial-donegeon-master'],
      rewards: [{ rewardTypeId: 'core-wisdom', amount: 25 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: donegeonMaster ? [donegeonMaster.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [],
    },
    {
      id: 'quest-dm-3', title: 'Expand the Armory', description: "Visit 'Backup & Import' > 'Asset Library' from the sidebar and import one of the pre-made content packs to add new content to your game instantly.", type: QuestType.Venture, icon: '📚', tags: ['tutorial', 'admin', 'tutorial-donegeon-master'],
      rewards: [{ rewardTypeId: 'core-wisdom', amount: 20 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: donegeonMaster ? [donegeonMaster.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [],
    },
    {
      id: 'quest-dm-4', title: 'Establish a Daily Duty', description: "A Donegeon needs routine. Go to 'Manage Quests' (under Content Management) and create a new recurring 'Duty', such as 'Morning Bed Making', and assign it to the Explorer.", type: QuestType.Venture, icon: '🔄', tags: ['tutorial', 'admin', 'tutorial-donegeon-master'],
      rewards: [{ rewardTypeId: 'core-wisdom', amount: 50 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: donegeonMaster ? [donegeonMaster.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [],
    },
    {
      id: 'quest-dm-5', title: 'Stock the Shelves', description: "A marketplace needs goods. Go to 'Manage Items', create a new asset, and then list it for sale in one of the markets.", type: QuestType.Venture, icon: '📦', tags: ['tutorial', 'admin', 'tutorial-donegeon-master'],
      rewards: [{ rewardTypeId: 'core-wisdom', amount: 50 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: donegeonMaster ? [donegeonMaster.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [],
    },
    {
      id: 'quest-dm-6', title: 'Make Your Mark', description: "Personalize your world. Go to 'Settings' > 'Terminology' and change the 'App Name' to something unique.", type: QuestType.Venture, icon: '🖋️', tags: ['tutorial', 'admin', 'tutorial-donegeon-master'],
      rewards: [{ rewardTypeId: 'core-wisdom', amount: 30 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: donegeonMaster ? [donegeonMaster.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [],
    },
  ];

  return quests;
};


export const createInitialQuestCompletions = (users: User[], quests: Quest[]): QuestCompletion[] => {
    const explorer = users.find(u => u.role === Role.Explorer);
    const questToComplete = quests.find(q => q.id === 'quest-gatekeeper-approval-setup');

    if (explorer && questToComplete) {
        return [{
            id: `comp-initial-${Date.now()}`,
            questId: questToComplete.id,
            userId: explorer.id,
            completedAt: new Date().toISOString(),
            status: QuestCompletionStatus.Pending,
            note: "I've completed this to test the approval system. Please approve!"
        }];
    }
    return [];
};