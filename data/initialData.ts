
import { User, Role, RewardTypeDefinition, RewardCategory, Rank, Trophy, TrophyRequirementType, QuestType, Market, Quest, QuestAvailability, Guild, AppSettings, SidebarConfigItem, GameAsset, ThemeDefinition, ThemeStyle } from '../types';

export const createMockUsers = (): User[] => {
    const usersData: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>[] = [
        // Donegeon Masters
        { firstName: 'The', lastName: 'Admin', username: 'admin', email: 'admin@donegeon.com', gameName: 'admin', birthday: '2000-01-01', role: Role.DonegeonMaster, password: '123456', pin: '1234' },
        { firstName: 'Valerius', lastName: 'Crow', username: 'valerius', email: 'valerius@donegeon.com', gameName: 'Crow', birthday: '1985-05-10', role: Role.DonegeonMaster, password: '123456', pin: '1234' },
        
        // Gatekeepers
        { firstName: 'Seraphina', lastName: 'Ironhand', username: 'sera', email: 'sera@donegeon.com', gameName: 'Sera', birthday: '1995-08-20', role: Role.Gatekeeper, password: '123456', pin: '1234' },
        { firstName: 'Gideon', lastName: 'Blackwood', username: 'gideon', email: 'gideon@donegeon.com', gameName: 'Gideon', birthday: '1992-11-30', role: Role.Gatekeeper, password: '123456', pin: '1234' },

        // Explorers
        { firstName: 'Lyra', lastName: 'Swift', username: 'lyra', email: 'lyra@donegeon.com', gameName: 'Lyra', birthday: '2010-04-15', role: Role.Explorer, pin: '1234' },
        { firstName: 'Finn', lastName: 'Riverbend', username: 'finn', email: 'finn@donegeon.com', gameName: 'Finn', birthday: '2012-06-22', role: Role.Explorer, pin: '1234' },
        { firstName: 'Elara', lastName: 'Meadowlight', username: 'elara', email: 'elara@donegeon.com', gameName: 'Elara', birthday: '2011-09-05', role: Role.Explorer, pin: '1234' },
        { firstName: 'Ronan', lastName: 'Stonefist', username: 'ronan', email: 'ronan@donegeon.com', gameName: 'Ronan', birthday: '2013-01-18', role: Role.Explorer, pin: '1234' },
        { firstName: 'Kael', lastName: 'Shadowsun', username: 'kael', email: 'kael@donegeon.com', gameName: 'Kael', birthday: '2014-03-25', role: Role.Explorer, pin: '1234' },
        { firstName: 'Orion', lastName: 'Starfall', username: 'orion', email: 'orion@donegeon.com', gameName: 'Orion', birthday: '2015-07-30', role: Role.Explorer, pin: '1234' },
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

    // Add some initial balances for the main admin
    const dm = initialUsers.find(u => u.username === 'admin');
    if (dm) {
        dm.personalPurse = { 'core-gold': 100, 'core-gems': 50 };
        dm.personalExperience = { 'core-wisdom': 50, 'core-strength': 150 };
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
  { type: 'link', id: 'Dashboard', emoji: '🏠', isVisible: true, level: 0, role: Role.Explorer },
  { type: 'link', id: 'Quests', emoji: '🗺️', isVisible: true, level: 0, role: Role.Explorer, termKey: 'tasks' },
  { type: 'link', id: 'Marketplace', emoji: '💰', isVisible: true, level: 0, role: Role.Explorer, termKey: 'shoppingCenter' },
  { type: 'link', id: 'Calendar', emoji: '🗓️', isVisible: true, level: 0, role: Role.Explorer },
  
  // Character Section
  { type: 'header', id: 'header-character', title: 'Character', level: 0, role: Role.Explorer, isVisible: true },
  { type: 'link', id: 'Avatar', emoji: '🧑‍🎤', isVisible: true, level: 1, role: Role.Explorer },
  { type: 'link', id: 'Collection', emoji: '🎒', isVisible: true, level: 1, role: Role.Explorer },
  { type: 'link', id: 'Themes', emoji: '🎨', isVisible: true, level: 1, role: Role.Explorer },
  { type: 'link', id: 'Guild', emoji: '🏰', isVisible: true, level: 1, role: Role.Explorer, termKey: 'groups' },
  { type: 'link', id: 'Progress', emoji: '📊', isVisible: true, level: 1, role: Role.Explorer },
  { type: 'link', id: 'Trophies', emoji: '🏆', isVisible: true, level: 1, role: Role.Explorer, termKey: 'awards' },
  { type: 'link', id: 'Ranks', emoji: '🎖️', isVisible: true, level: 1, role: Role.Explorer, termKey: 'levels' },
  { type: 'link', id: 'Chronicles', emoji: '📜', isVisible: true, level: 1, role: Role.Explorer, termKey: 'history' },

  // Administration Section
  { type: 'header', id: 'header-admin', title: 'Administration', level: 0, role: Role.Gatekeeper, isVisible: true },
  { type: 'link', id: 'Approvals', emoji: '✅', isVisible: true, level: 1, role: Role.Gatekeeper },
  { type: 'link', id: 'Manage Users', emoji: '👥', isVisible: true, level: 1, role: Role.DonegeonMaster },
  { type: 'link', id: 'Manage Guilds', emoji: '🏰', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'groups' },
  { type: 'link', id: 'Manage Quests', emoji: '📜', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'tasks' },
  { type: 'link', id: 'Manage Items', emoji: '⚔️', isVisible: true, level: 1, role: Role.DonegeonMaster },
  { type: 'link', id: 'Manage Markets', emoji: '🛒', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'stores' },
  { type: 'link', id: 'Manage Rewards', emoji: '💎', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'points' },
  { type: 'link', id: 'Manage Ranks', emoji: '🏅', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'levels' },
  { type: 'link', id: 'Manage Trophies', emoji: '🏆', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'awards' },
  { type: 'link', id: 'AI Studio', emoji: '✨', isVisible: true, level: 1, role: Role.DonegeonMaster },
  { type: 'link', id: 'Appearance', emoji: '🖌️', isVisible: true, level: 1, role: Role.DonegeonMaster },
  { type: 'link', id: 'Theme Editor', emoji: '🎭', isVisible: true, level: 1, role: Role.DonegeonMaster },
  { type: 'link', id: 'Settings', emoji: '⚙️', isVisible: true, level: 1, role: Role.DonegeonMaster },
  { type: 'link', id: 'Object Manager', emoji: '🗂️', isVisible: true, level: 1, role: Role.DonegeonMaster },
  { type: 'link', id: 'Asset Manager', emoji: '🖼️', isVisible: true, level: 1, role: Role.DonegeonMaster },
  { type: 'link', id: 'Backup & Import', emoji: '💾', isVisible: true, level: 1, role: Role.DonegeonMaster },
  { type: 'link', id: 'Asset Library', emoji: '📚', isVisible: true, level: 1, role: Role.DonegeonMaster },

  // Help Section
  { type: 'header', id: 'header-help', title: 'Help', level: 0, role: Role.Explorer, isVisible: true },
  { type: 'link', id: 'About', emoji: 'ℹ️', isVisible: true, level: 1, role: Role.Explorer },
  { type: 'link', id: 'Help Guide', emoji: '❓', isVisible: true, level: 1, role: Role.Explorer },
];

const rawThemes: { [key: string]: ThemeStyle } = {
  emerald: { '--font-display': "'MedievalSharp', cursive", '--font-body': "'Roboto', sans-serif", '--color-bg-primary': "224 71% 4%", '--color-bg-secondary': "224 39% 10%", '--color-bg-tertiary': "240 10% 19%", '--color-text-primary': "240 8% 90%", '--color-text-secondary': "240 6% 65%", '--color-border': "240 6% 30%", '--color-primary-hue': "158", '--color-primary-saturation': "84%", '--color-primary-lightness': "39%", '--color-accent-hue': "158", '--color-accent-saturation': "75%", '--color-accent-lightness': "58%", '--color-accent-light-hue': "158", '--color-accent-light-saturation': "70%", '--color-accent-light-lightness': "45%" },
  rose: { '--font-display': "'MedievalSharp', cursive", '--font-body': "'Roboto', sans-serif", '--color-bg-primary': "334 27% 10%", '--color-bg-secondary': "334 20% 15%", '--color-bg-tertiary': "334 15% 22%", '--color-text-primary': "346 33% 94%", '--color-text-secondary': "346 20% 70%", '--color-border': "346 15% 40%", '--color-primary-hue': "346", '--color-primary-saturation': "84%", '--color-primary-lightness': "59%", '--color-accent-hue': "346", '--color-accent-saturation': "91%", '--color-accent-lightness': "71%", '--color-accent-light-hue': "346", '--color-accent-light-saturation': "80%", '--color-accent-light-lightness': "60%" },
  sky: { '--font-display': "'MedievalSharp', cursive", '--font-body': "'Roboto', sans-serif", '--color-bg-primary': "217 33% 12%", '--color-bg-secondary': "217 28% 17%", '--color-bg-tertiary': "217 25% 25%", '--color-text-primary': "210 40% 98%", '--color-text-secondary': "215 25% 75%", '--color-border': "215 20% 40%", '--color-primary-hue': "204", '--color-primary-saturation': "85%", '--color-primary-lightness': "54%", '--color-accent-hue': "202", '--color-accent-saturation': "90%", '--color-accent-lightness': "70%", '--color-accent-light-hue': "202", '--color-accent-light-saturation': "80%", '--color-accent-light-lightness': "60%" },
  arcane: { '--font-display': "'Uncial Antiqua', cursive", '--font-body': "'Roboto', sans-serif", '--color-bg-primary': "265 39% 12%", '--color-bg-secondary': "265 30% 18%", '--color-bg-tertiary': "265 25% 25%", '--color-text-primary': "271 67% 93%", '--color-text-secondary': "271 25% 75%", '--color-border': "271 20% 45%", '--color-primary-hue': "265", '--color-primary-saturation': "60%", '--color-primary-lightness': "55%", '--color-accent-hue': "265", '--color-accent-saturation': "70%", '--color-accent-lightness': "75%", '--color-accent-light-hue': "45", '--color-accent-light-saturation': "80%", '--color-accent-light-lightness': "65%" },
  cartoon: { '--font-display': "'Comic Neue', cursive", '--font-body': "'Comic Neue', cursive", '--color-bg-primary': "214 53% 15%", '--color-bg-secondary': "214 43% 22%", '--color-bg-tertiary': "214 38% 30%", '--color-text-primary': "210 40% 96%", '--color-text-secondary': "210 30% 75%", '--color-border': "210 25% 45%", '--color-primary-hue': "25", '--color-primary-saturation': "95%", '--color-primary-lightness': "55%", '--color-accent-hue': "200", '--color-accent-saturation': "85%", '--color-accent-lightness': "60%", '--color-accent-light-hue': "200", '--color-accent-light-saturation': "90%", '--color-accent-light-lightness': "70%" },
  forest: { '--font-display': "'Metamorphous', serif", '--font-body': "'Roboto', sans-serif", '--color-bg-primary': "120 25% 10%", '--color-bg-secondary': "120 20% 15%", '--color-bg-tertiary': "120 15% 22%", '--color-text-primary': "90 30% 90%", '--color-text-secondary': "90 15% 65%", '--color-border': "120 10% 35%", '--color-primary-hue': "130", '--color-primary-saturation': "60%", '--color-primary-lightness': "40%", '--color-accent-hue': "90", '--color-accent-saturation': "50%", '--color-accent-lightness': "65%", '--color-accent-light-hue': "40", '--color-accent-light-saturation': "50%", '--color-accent-light-lightness': "55%" },
  ocean: { '--font-display': "'Uncial Antiqua', cursive", '--font-body': "'Roboto', sans-serif", '--color-bg-primary': "200 100% 10%", '--color-bg-secondary': "200 80% 18%", '--color-bg-tertiary': "200 70% 25%", '--color-text-primary': "190 70% 95%", '--color-text-secondary': "190 40% 75%", '--color-border': "190 40% 40%", '--color-primary-hue': '180', '--color-primary-saturation': '85%', '--color-primary-lightness': '45%', '--color-accent-hue': '190', '--color-accent-saturation': '80%', '--color-accent-lightness': '60%', '--color-accent-light-hue': '190', '--color-accent-light-saturation': '70%', '--color-accent-light-lightness': '70%' },
  vulcan: { '--font-display': "'Metamorphous', serif", '--font-body': "'Roboto', sans-serif", '--color-bg-primary': "10 50% 8%", '--color-bg-secondary': "10 40% 12%", '--color-bg-tertiary': "10 35% 18%", '--color-text-primary': "10 10% 90%", '--color-text-secondary': "10 5% 65%", '--color-border': "10 10% 35%", '--color-primary-hue': "0", '--color-primary-saturation': "85%", '--color-primary-lightness': "50%", '--color-accent-hue': "25", '--color-accent-saturation': "90%", '--color-accent-lightness': "60%", '--color-accent-light-hue': "45", '--color-accent-light-saturation': "80%", '--color-accent-light-lightness': "65%" },
  royal: { '--font-display': "'Uncial Antiqua', cursive", '--font-body': "'Roboto', sans-serif", '--color-bg-primary': "250 40% 10%", '--color-bg-secondary': "250 30% 16%", '--color-bg-tertiary': "250 25% 24%", '--color-text-primary': "250 50% 92%", '--color-text-secondary': "250 25% 70%", '--color-border': "250 20% 40%", '--color-primary-hue': "250", '--color-primary-saturation': "60%", '--color-primary-lightness': "50%", '--color-accent-hue': "45", '--color-accent-saturation': "80%", '--color-accent-lightness': "60%", '--color-accent-light-hue': "45", '--color-accent-light-saturation': "85%", '--color-accent-light-lightness': "70%" },
  winter: { '--font-display': "'Metamorphous', serif", '--font-body': "'Roboto', sans-serif", '--color-bg-primary': "205 30% 15%", '--color-bg-secondary': "205 25% 22%", '--color-bg-tertiary': "205 20% 30%", '--color-text-primary': "205 60% 95%", '--color-text-secondary': "205 30% 75%", '--color-border': "205 20% 45%", '--color-primary-hue': "205", '--color-primary-saturation': "70%", '--color-primary-lightness': "50%", '--color-accent-hue': "195", '--color-accent-saturation': "80%", '--color-accent-lightness': "65%", '--color-accent-light-hue': "215", '--color-accent-light-saturation': "60%", '--color-accent-light-lightness': "55%" },
  sunset: { '--font-display': "'MedievalSharp', cursive", '--font-body': "'Roboto', sans-serif", '--color-bg-primary': "20 50% 10%", '--color-bg-secondary': "20 40% 15%", '--color-bg-tertiary': "20 35% 22%", '--color-text-primary': "30 80% 90%", '--color-text-secondary': "30 40% 70%", '--color-border': "30 20% 40%", '--color-primary-hue': "15", '--color-primary-saturation': "90%", '--color-primary-lightness': "60%", '--color-accent-hue': "35", '--color-accent-saturation': "95%", '--color-accent-lightness': "65%", '--color-accent-light-hue': "340", '--color-accent-light-saturation': "80%", '--color-accent-light-lightness': "70%" },
  cyberpunk: { '--font-display': "'Press Start 2P', cursive", '--font-body': "'Roboto', sans-serif", '--color-bg-primary': "260 50% 5%", '--color-bg-secondary': "280 40% 10%", '--color-bg-tertiary': "300 30% 15%", '--color-text-primary': "320 100% 95%", '--color-text-secondary': "300 50% 75%", '--color-border': "300 30% 35%", '--color-primary-hue': "320", '--color-primary-saturation': "100%", '--color-primary-lightness': "60%", '--color-accent-hue': "180", '--color-accent-saturation': "100%", '--color-accent-lightness': "50%", '--color-accent-light-hue': "55", '--color-accent-light-saturation': "100%", '--color-accent-light-lightness': "50%" },
  steampunk: { '--font-display': "'IM Fell English SC', serif", '--font-body': "'Roboto', sans-serif", '--color-bg-primary': "30 20% 12%", '--color-bg-secondary': "30 15% 18%", '--color-bg-tertiary': "30 10% 25%", '--color-text-primary': "35 30% 85%", '--color-text-secondary': "35 20% 65%", '--color-border': "35 15% 40%", '--color-primary-hue': "30", '--color-primary-saturation': "60%", '--color-primary-lightness': "50%", '--color-accent-hue': "190", '--color-accent-saturation': "40%", '--color-accent-lightness': "55%", '--color-accent-light-hue': "20", '--color-accent-light-saturation': "30%", '--color-accent-light-lightness': "60%" },
  parchment: { '--font-display': "'IM Fell English SC', serif", '--font-body': "'Roboto', sans-serif", '--color-bg-primary': "40 30% 85%", '--color-bg-secondary': "40 25% 90%", '--color-bg-tertiary': "40 20% 95%", '--color-text-primary': "35 40% 15%", '--color-text-secondary': "35 30% 35%", '--color-border': "35 20% 70%", '--color-primary-hue': "20", '--color-primary-saturation': "50%", '--color-primary-lightness': "40%", '--color-accent-hue': "0", '--color-accent-saturation': "50%", '--color-accent-lightness': "45%", '--color-accent-light-hue': "10", '--color-accent-light-saturation': "40%", '--color-accent-light-lightness': "50%" },
  eerie: { '--font-display': "'Metamorphous', serif", '--font-body': "'Roboto', sans-serif", '--color-bg-primary': "120 10% 8%", '--color-bg-secondary': "120 8% 12%", '--color-bg-tertiary': "120 5% 18%", '--color-text-primary': "120 30% 88%", '--color-text-secondary': "120 15% 65%", '--color-border': "120 10% 30%", '--color-primary-hue': "120", '--color-primary-saturation': "40%", '--color-primary-lightness': "45%", '--color-accent-hue': "80", '--color-accent-saturation': "50%", '--color-accent-lightness': "55%", '--color-accent-light-hue': "30", '--color-accent-light-saturation': "40%", '--color-accent-light-lightness': "50%" },
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
      quickUserSwitchingEnabled: true,
      requirePinForUsers: true,
      requirePasswordForAdmin: true,
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
    },
    enableAiFeatures: true,
    sidebars: {
        main: INITIAL_MAIN_SIDEBAR_CONFIG,
        dataManagement: [
            { type: 'link', id: 'Object Manager', emoji: '🗂️', isVisible: true, level: 0, role: Role.DonegeonMaster },
            { type: 'link', id: 'Asset Manager', emoji: '🖼️', isVisible: true, level: 0, role: Role.DonegeonMaster },
            { type: 'link', id: 'Asset Library', emoji: '📚', isVisible: true, level: 0, role: Role.DonegeonMaster },
            { type: 'link', id: 'Backup & Import', emoji: '💾', isVisible: true, level: 0, role: Role.DonegeonMaster },
        ]
    }
};

export const INITIAL_TROPHIES: Trophy[] = [
    { id: 'trophy-1', name: 'First Quest', description: 'Complete your first quest.', icon: '🎉', isManual: false, requirements: [{type: TrophyRequirementType.CompleteQuestType, value: QuestType.Duty, count: 1}] },
    { id: 'trophy-2', name: 'Duty-Bound', description: 'Complete 10 Duties.', icon: '🛡️', isManual: false, requirements: [{type: TrophyRequirementType.CompleteQuestType, value: QuestType.Duty, count: 10}] },
    { id: 'trophy-3', name: 'Venture Forth', description: 'Complete 10 Ventures.', icon: '🗺️', isManual: false, requirements: [{type: TrophyRequirementType.CompleteQuestType, value: QuestType.Venture, count: 10}] },
    { id: 'trophy-4', name: 'The Janitor', description: 'For exceptional cleanliness.', icon: '🧹', isManual: true, requirements: [] },
    { id: 'trophy-5', name: 'Bookworm', description: 'Complete 5 learning quests.', icon: '📚', isManual: false, requirements: [{type: TrophyRequirementType.CompleteQuestTag, value: 'learning', count: 5}] },
    { id: 'trophy-6', name: 'Initiate Rank', description: 'Achieve the rank of Initiate', icon: '🌱', isManual: false, requirements: [{type: TrophyRequirementType.AchieveRank, value: 'rank-2', count: 1}]}
];

export const createSampleMarkets = (): Market[] => ([
  { id: 'market-1', title: 'The Adventurer\'s Sundries', description: 'General goods for the everyday hero.', icon: '🛍️' },
  { id: 'market-2', title: 'The Treasure Trove', description: 'Rare and valuable items for purchase.', icon: '💎', guildId: 'guild-1' },
]);

export const createSampleGameAssets = (): GameAsset[] => ([
    { id: 'ga-1', name: 'Health Potion', description: 'A common potion for healing.', url: 'https://placehold.co/150/ef4444/FFFFFF?text=HP', icon: '🧪', category: 'Item', avatarSlot: undefined, isForSale: true, cost: [{rewardTypeId: 'core-gold', amount: 10}], marketIds: ['market-1'], creatorId: 'user-1', createdAt: new Date().toISOString(), purchaseLimit: null, purchaseCount: 0 },
    { id: 'ga-2', name: 'Cool Blue Shirt', description: 'A cool blue shirt for your avatar.', url: 'https://placehold.co/150/3b82f6/FFFFFF?text=Shirt', icon: '👕', category: 'Avatar', avatarSlot: 'shirt', isForSale: true, cost: [{rewardTypeId: 'core-gold', amount: 50}], marketIds: ['market-1'], creatorId: 'user-1', createdAt: new Date().toISOString(), purchaseLimit: null, purchaseCount: 0 },
    { id: 'ga-3', name: 'Guild Banner', description: 'A banner representing the main guild.', url: 'https://placehold.co/150/f97316/FFFFFF?text=Banner', icon: '🚩', category: 'Trophy Display', avatarSlot: undefined, isForSale: true, cost: [{rewardTypeId: 'core-gems', amount: 20}], marketIds: ['market-2'], creatorId: 'user-1', createdAt: new Date().toISOString(), purchaseLimit: 1, purchaseCount: 0 },
]);

export const createInitialGuilds = (users: User[]): Guild[] => ([
  { id: 'guild-1', name: 'The Vanguard', purpose: 'The primary guild for all adventurers.', memberIds: users.map(u => u.id), isDefault: true },
]);

export const createSampleQuests = (): Quest[] => ([
  {
    id: 'quest-1', title: 'Morning Bed Making', description: 'Make your bed every morning.', type: QuestType.Duty, icon: '🛏️', tags: ['chore', 'morning'],
    rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], lateSetbacks: [], incompleteSetbacks: [{ rewardTypeId: 'core-gems', amount: 1 }],
    isActive: true, isOptional: false, availabilityType: QuestAvailability.Daily, availabilityCount: null, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
    assignedUserIds: [], requiresApproval: false, claimedByUserIds: [], dismissals: [], lateTime: '09:00', incompleteTime: '12:00'
  },
  {
    id: 'quest-2', title: 'Clean Your Room', description: 'Clean your room once a week.', type: QuestType.Duty, icon: '🧹', tags: ['chore', 'weekly'],
    rewards: [{ rewardTypeId: 'core-diligence', amount: 25 }], lateSetbacks: [{ rewardTypeId: 'core-gems', amount: 2 }], incompleteSetbacks: [{ rewardTypeId: 'core-gems', amount: 5 }],
    isActive: true, isOptional: false, availabilityType: QuestAvailability.Weekly, availabilityCount: null, weeklyRecurrenceDays: [6], monthlyRecurrenceDays: [],
    assignedUserIds: [], requiresApproval: true, claimedByUserIds: [], dismissals: []
  },
  {
    id: 'quest-3', title: 'Read a Book', description: 'Read a book for 30 minutes.', type: QuestType.Venture, icon: '📚', tags: ['learning'],
    rewards: [{ rewardTypeId: 'core-wisdom', amount: 15 }], lateSetbacks: [], incompleteSetbacks: [],
    isActive: true, isOptional: true, availabilityType: QuestAvailability.Unlimited, availabilityCount: null, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
    assignedUserIds: [], requiresApproval: false, claimedByUserIds: [], dismissals: []
  },
  {
    id: 'quest-4', title: 'Take out the Trash', description: 'Take out the kitchen trash when it is full.', type: QuestType.Venture, icon: '🗑️', tags: ['chore'],
    rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], lateSetbacks: [], incompleteSetbacks: [],
    isActive: true, isOptional: false, availabilityType: QuestAvailability.Frequency, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
    assignedUserIds: [], requiresApproval: true, claimedByUserIds: [], dismissals: [], guildId: 'guild-1'
  }
]);
