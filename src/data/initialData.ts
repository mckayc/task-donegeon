import { Role, RewardCategory, QuestType, QuestAvailability, TrophyRequirementType, QuestCompletionStatus, AppSettings, Trophy, Rank, Market, GameAsset, Guild, QuestCompletion, User, ThemeDefinition, QuestGroup, ThemeStyle, SidebarConfigItem } from '../types';

export const INITIAL_QUEST_GROUPS: QuestGroup[] = [
    { id: 'qg-household', name: 'Household Chores', description: 'General tasks related to keeping the house clean and tidy.', icon: '🏡' },
    { id: 'qg-school', name: 'School & Learning', description: 'Quests related to homework, studying, and educational activities.', icon: '📚' },
    { id: 'qg-personal', name: 'Personal Goals', description: 'Quests for self-improvement, habits, and personal projects.', icon: '🎯' },
    { id: 'qg-health', name: 'Health & Wellness', description: 'Tasks for physical and mental well-being, like exercise and hygiene.', icon: '❤️‍🩹' },
    { id: 'qg-family', name: 'Family & Social', description: 'Quests that involve spending time with or helping family and friends.', icon: '👨‍👩‍👧‍👦' },
    { id: 'qg-creative', name: 'Creative & Hobbies', description: 'Quests for art, music, building, and other creative pursuits.', icon: '🎨' },
    { id: 'qg-outdoor', name: 'Outdoor & Adventure', description: 'Tasks related to yard work, playing outside, and exploring nature.', icon: '🌳' },
    { id: 'qg-kindness', name: 'Kindness & Service', description: 'Quests focused on helping others, showing appreciation, and community service.', icon: '💖' },
];

export const createMockUsers = (): User[] => {
    const usersData = [
        // Donegeon Masters
        { firstName: 'The', lastName: 'Admin', username: 'admin', email: 'admin@donegeon.com', gameName: 'admin', birthday: '2000-01-01', role: Role.DonegeonMaster, password: '123456', pin: '1234' },
        
        // Gatekeepers
        { firstName: 'Gate', lastName: 'Keeper', username: 'gatekeeper', email: 'gatekeeper@donegeon.com', gameName: 'Gatekeeper', birthday: '1995-08-20', role: Role.Gatekeeper, password: '123456', pin: '1234' },

        // Explorers
        { firstName: 'New', lastName: 'Explorer', username: 'explorer', email: 'explorer@donegeon.com', gameName: 'Explorer', birthday: '2010-04-15', role: Role.Explorer, pin: '1234' },
    ];

    const initialUsers: User[] = usersData.map((u, i) => ({
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
    const explorer = initialUsers.find((u) => u.username === 'explorer');
    if (explorer) {
        explorer.personalPurse = { 'core-gold': 100 };
    }
    
    return initialUsers;
};

export const INITIAL_REWARD_TYPES: RewardTypeDefinition[] = [
    { id: 'core-gold', name: 'Gold Coins', category: RewardCategory.Currency, description: 'Can be exchanged for real money or items.', isCore: true, iconType: 'emoji', icon: '💰' },
    { id: 'core-gems', name: 'Gems', category: RewardCategory.Currency, description: 'Earned from service or helping. Used for experiences.', isCore: true, iconType: 'emoji', icon: '💎' },
    { id: 'core-crystal', name: 'Crystals', category: RewardCategory.Currency, description: 'Earned from small tasks. Used for screen time.', isCore: true, iconType: 'emoji', icon: '🔮' },
    { id: 'core-strength', name: 'Strength', category: RewardCategory.XP, description: 'Earned from physical tasks.', isCore: true, iconType: 'emoji', icon: '💪' },
    { id: 'core-diligence', name: 'Diligence', category: RewardCategory.XP, description: 'Earned from careful, persistent work like cleaning and organizing.', isCore: true, iconType: 'emoji', icon: '🧹' },
    { id: 'core-wisdom', name: 'Wisdom', category: RewardCategory.XP, description: 'Earned from learning activities.', isCore: true, iconType: 'emoji', icon: '🧠' },
    { id: 'core-skill', name: 'Skill', category: RewardCategory.XP, description: 'Earned from practice and sports.', isCore: true, iconType: 'emoji', icon: '🎯' },
    { id: 'core-creative', name: 'Creativity', category: RewardCategory.XP, description: 'Earned from artistic and creative endeavors.', isCore: true, iconType: 'emoji', icon: '🎨' },
];

export const INITIAL_TAGS: string[] = [
    'Cleaning', 'Learning', 'Health', 'Yardwork', 'Organization', 
    'Helping', 'Family Time', 'Creative', 'Pets', 'Kitchen', 
    'Bedroom', 'Bathroom', 'School'
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
    iconType: 'emoji',
    icon: rankIcons[i] || '❓',
}));

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
  { type: 'link', id: 'Trophies', emoji: '🏆', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_trophies' },
  { type: 'link', id: 'Themes', emoji: '🎨', isVisible: true, level: 1, role: Role.Explorer, termKey: 'link_themes' },

  // User Management Section
  { type: 'header', id: 'header-admin-community', title: 'User Management', emoji: '🛡️', level: 0, role: Role.Gatekeeper, isVisible: true },
  { type: 'link', id: 'Approvals', emoji: '✅', isVisible: true, level: 1, role: Role.Gatekeeper, termKey: 'link_approvals' },
  { type: 'link', id: 'Manage Users', emoji: '👥', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_users' },
  { type: 'link', id: 'Manage Guilds', emoji: '🏰', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_guilds' },

  // Content Management Section
  { type: 'header', id: 'header-admin-content', title: 'Content Management', emoji: '📚', level: 0, role: Role.DonegeonMaster, isVisible: true },
  { type: 'link', id: 'Manage Quests', emoji: '📜', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_quests' },
  { type: 'link', id: 'Manage Quest Groups', emoji: '📂', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_quest_groups' },
  { type: 'link', id: 'Manage Markets', emoji: '🛒', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_markets' },
  { type: 'link', id: 'Manage Goods', emoji: '⚔️', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_items' },
  { type: 'link', id: 'Manage Trophies', emoji: '🏆', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_trophies' },
  { type: 'link', id: 'Manage Ranks', emoji: '🏅', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_ranks' },
  { type: 'link', id: 'Manage Rewards', emoji: '💎', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_rewards' },
  { type: 'link', id: 'Manage Events', emoji: '🎉', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_manage_events' },
  { type: 'link', id: 'Theme Editor', emoji: '🎭', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_theme_editor' },

  // System Tools Section
  { type: 'header', id: 'header-admin-system', title: 'System Tools', emoji: '🛠️', level: 0, role: Role.DonegeonMaster, isVisible: true },
  { type: 'link', id: 'Asset Manager', emoji: '🖼️', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_asset_manager' },
  { type: 'link', id: 'Backup & Import', emoji: '💾', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_backup_import' },
  { type: 'link', id: 'Object Exporter', emoji: '🗂️', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_object_exporter' },
  { type: 'link', id: 'Appearance', emoji: '🖌️', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_appearance' },
  { type: 'link', id: 'Asset Library', emoji: '📚', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_asset_library' },
  { type: 'link', id: 'AI Studio', emoji: '✨', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'link_ai_studio' },
  
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
    contentVersion: 2,
    isFirstRunComplete: false,
    favicon: '🏰',
    forgivingSetbacks: true,
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
        allowCompletion: true,
        autoExit: false,
        autoExitMinutes: 2,
        userIds: [],
    },
    automatedBackups: {
        profiles: [
            { enabled: false, frequency: 'daily', keep: 7 },
            { enabled: false, frequency: 'weekly', keep: 4 },
            { enabled: false, frequency: 'monthly', keep: 3 }
        ]
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
      link_manage_quest_groups: 'Manage Quest Groups',
      link_manage_items: 'Manage Goods',
      link_manage_markets: 'Manage Markets',
      link_manage_rewards: 'Manage Rewards',
      link_manage_ranks: 'Manage Ranks',
      link_manage_trophies: 'Manage Trophies',
      link_manage_events: 'Manage Events',
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
      link_settings: 'Settings',
      link_about: 'About',
      link_help_guide: 'Help Guide',
      link_chat: 'Chat',
    },
    enableAiFeatures: false,
    rewardValuation: {
      enabled: true,
      anchorRewardId: 'core-gems',
      exchangeRates: {
        'core-gold': 5,
        'core-crystal': 10,
        'core-strength': 20,
        'core-diligence': 20,
        'core-wisdom': 20,
        'core-skill': 20,
        'core-creative': 20,
      },
      currencyExchangeFeePercent: 10,
      xpExchangeFeePercent: 20,
    },
    chat: {
        enabled: true,
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
    { id: 'trophy-1', name: 'First Quest', description: 'Complete your first quest.', iconType: 'emoji', icon: '🎉', isManual: false, requirements: [{type: TrophyRequirementType.CompleteQuestType, value: QuestType.Duty, count: 1}] },
    { id: 'trophy-2', name: 'First Customization', description: 'Change your theme for the first time.', iconType: 'emoji', icon: '🎨', isManual: true, requirements: [] },
    { id: 'trophy-3', name: 'The Adjudicator', description: 'Approve or reject a pending quest.', iconType: 'emoji', icon: '⚖️', isManual: true, requirements: [] },
    { id: 'trophy-4', name: 'World Builder', description: 'Create a new quest.', iconType: 'emoji', icon: '🛠️', isManual: true, requirements: [] },
    { id: 'trophy-5', name: 'The Name Changer', description: 'Rename a user in the Manage Users panel.', iconType: 'emoji', icon: '✍️', isManual: true, requirements: [] },
    { id: 'trophy-6', name: 'Initiate Rank', description: 'Achieve the rank of Initiate', iconType: 'emoji', icon: '🌱', isManual: false, requirements: [{type: TrophyRequirementType.AchieveRank, value: 'rank-2', count: 1}]},
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
    { id: 'trophy-48', name: 'Laundry Lord', description: 'For washing, drying, and folding 5 loads of laundry.', iconType: 'emoji', icon: '🧺', isManual: true, requirements: [] },
    { id: 'trophy-49', name: 'The Green Thumb', description: 'For keeping a plant alive for a month.', iconType: 'emoji', icon: '🪴', isManual: true, requirements: [] },
    { id: 'trophy-50', name: 'The Organizer', description: 'For decluttering a messy drawer or closet.', iconType: 'emoji', icon: '🗂️', isManual: true, requirements: [] },
    { id: 'trophy-51', name: 'The Recycler', description: 'For consistently sorting the recycling correctly.', iconType: 'emoji', icon: '♻️', isManual: true, requirements: [] },
    { id: 'trophy-52', name: 'The Repairman', description: 'For fixing something that was broken.', iconType: 'emoji', icon: '🛠️', isManual: true, requirements: [] },
    { id: 'trophy-53', name: 'The Pet Pal', description: 'For taking excellent care of a pet.', iconType: 'emoji', icon: '🐾', isManual: true, requirements: [] },
    { id: 'trophy-54', name: 'The Dust Slayer', description: 'For dusting the entire house.', iconType: 'emoji', icon: '🌬️', isManual: true, requirements: [] },
    { id: 'trophy-55', name: 'Honor Roll', description: 'For getting straight A\'s on a report card.', iconType: 'emoji', icon: '🅰️', isManual: true, requirements: [] },
    { id: 'trophy-56', name: 'Perfect Attendance', description: 'For not missing a single day of school.', iconType: 'emoji', icon: '🗓️', isManual: true, requirements: [] },
    { id: 'trophy-57', name: 'Science Fair Winner', description: 'For winning a prize at the science fair.', iconType: 'emoji', icon: '🥇', isManual: true, requirements: [] },
    { id: 'trophy-58', name: 'Spelling Bee Champ', description: 'For winning the spelling bee.', iconType: 'emoji', icon: '🐝', isManual: true, requirements: [] },
    { id: 'trophy-59', name: 'Book Worm', description: 'For reading 25 books in a school year.', iconType: 'emoji', icon: '🐛', isManual: true, requirements: [] },
    { id: 'trophy-60', name: 'The Punisher', description: 'For telling an exceptionally great (or terrible) pun.', iconType: 'emoji', icon: '😂', isManual: true, requirements: [] },
    { id: 'trophy-61', name: 'Klutz of the Week', description: 'For a spectacular, harmless trip or fall.', iconType: 'emoji', icon: '🤕', isManual: true, requirements: [] },
    { id: 'trophy-62', name: 'Bed Head', description: 'For having the most epic bed head one morning.', iconType: 'emoji', icon: '🛌', isManual: true, requirements: [] },
    { id: 'trophy-63', name: 'The Snorter', description: 'For laughing so hard you snorted.', iconType: 'emoji', icon: '🐽', isManual: true, requirements: [] },
    { id: 'trophy-64', name: 'Brain Fart', description: 'For a truly memorable moment of forgetfulness.', iconType: 'emoji', icon: '💨', isManual: true, requirements: [] },
    { id: 'trophy-65', name: 'The Snackinator', description: 'For impressively finishing a bag of snacks.', iconType: 'emoji', icon: '🍿', isManual: true, requirements: [] },
    { id: 'trophy-66', name: 'The Drama Llama', description: 'For an award-worthy dramatic performance over something small.', iconType: 'emoji', icon: '🎭', isManual: true, requirements: [] },
    { id: 'trophy-67', name: 'Early Bird', description: 'For waking up on time without being told for a whole week.', iconType: 'emoji', icon: '🌅', isManual: true, requirements: [] },
    { id: 'trophy-68', name: 'Night Owl', description: 'For staying up late to finish a project.', iconType: 'emoji', icon: '🦉', isManual: true, requirements: [] },
    { id: 'trophy-69', name: 'Hydration Hero', description: 'For drinking 8 glasses of water in a day.', iconType: 'emoji', icon: '💧', isManual: true, requirements: [] },
    { id: 'trophy-70', name: 'The Diplomat', description: 'For resolving an argument peacefully.', iconType: 'emoji', icon: '🕊️', isManual: true, requirements: [] },
    { id: 'trophy-71', name: 'The Comedian', description: 'For making the entire family laugh out loud.', iconType: 'emoji', icon: '🤣', isManual: true, requirements: [] },
    { id: 'trophy-72', name: 'The Encourager', description: 'For cheering up a family member who was feeling down.', iconType: 'emoji', icon: '🤗', isManual: true, requirements: [] },
    { id: 'trophy-73', name: 'The Listener', description: 'For being a great listener when someone needed to talk.', iconType: 'emoji', icon: '👂', isManual: true, requirements: [] },
    { id: 'trophy-74', name: 'The Giver', description: 'For giving a thoughtful, handmade gift.', iconType: 'emoji', icon: '🎁', isManual: true, requirements: [] },
    { id: 'trophy-75', name: 'The Helper', description: 'For helping a sibling with their homework.', iconType: 'emoji', icon: '🧑‍🏫', isManual: true, requirements: [] },
    { id: 'trophy-76', name: 'The Collaborator', description: 'For working well on a family project.', iconType: 'emoji', icon: '🧑‍🤝‍🧑', isManual: true, requirements: [] },
    { id: 'trophy-77', name: 'The Welcomer', description: 'For making a guest feel welcome and included.', iconType: 'emoji', icon: '👋', isManual: true, requirements: [] },
    { id: 'trophy-78', name: 'Speed Runner', description: 'For getting ready for school in record time.', iconType: 'emoji', icon: '⏱️', isManual: true, requirements: [] },
    { id: 'trophy-79', name: 'Completionist', description: 'For finishing all your homework before dinner.', iconType: 'emoji', icon: '💯', isManual: true, requirements: [] },
    { id: 'trophy-80', name: 'The Strategist', description: 'For winning a board game with a clever strategy.', iconType: 'emoji', icon: '♟️', isManual: true, requirements: [] },
    { id: 'trophy-81', 'name': 'The Farmer', 'description': 'For helping with gardening or yard work.', iconType: 'emoji', 'icon': '🧑‍🌾', 'isManual': true, 'requirements': [] },
    { id: 'trophy-82', name: 'The Co-op King', description: 'For successfully completing a two-person chore with a sibling.', iconType: 'emoji', icon: '🤝', isManual: true, requirements: [] },
    { id: 'trophy-83', name: 'The Patient One', description: 'For waiting patiently without complaining.', iconType: 'emoji', icon: '⏳', isManual: true, requirements: [] },
    { id: 'trophy-84', name: 'The Brave', description: 'For going to the doctor or dentist without any fuss.', iconType: 'emoji', icon: '씩', isManual: true, requirements: [] },
    { id: 'trophy-85', name: 'The Problem Solver', description: 'For figuring out a tricky problem on your own.', iconType: 'emoji', icon: '💡', isManual: true, requirements: [] },
    { id: 'trophy-86', name: 'The Tidy Titan', description: 'For keeping your room clean for a whole week.', iconType: 'emoji', icon: '✨', isManual: true, requirements: [] },
    { id: 'trophy-87', name: 'The Gracious', description: 'For remembering to say "please" and "thank you" all day.', iconType: 'emoji', icon: '🙏', isManual: true, requirements: [] },
    { id: 'trophy-88', name: 'The Independent', description: 'For completing your morning routine all by yourself.', iconType: 'emoji', icon: '🧍', isManual: true, requirements: [] },
    { id: 'trophy-89', name: 'The Tech Support', description: 'For helping a family member with a tech problem.', iconType: 'emoji', icon: '💻', isManual: true, requirements: [] },
    { id: 'trophy-90', name: 'The Foodie', description: 'For trying a new food without complaining.', iconType: 'emoji', icon: '😋', isManual: true, requirements: [] },
    { id: 'trophy-91', name: 'The On-Time Arrival', description: 'For being ready to leave on time.', iconType: 'emoji', icon: '⏰', isManual: true, requirements: [] },
    { id: 'trophy-92', name: 'The Car Cleaner', description: 'For helping to clean out the inside of the car.', iconType: 'emoji', icon: '🚗', isManual: true, requirements: [] },
    { id: 'trophy-93', name: 'The Toy Tamer', description: 'For putting away all the toys after playing.', iconType: 'emoji', icon: '🧸', isManual: true, requirements: [] },
    { id: 'trophy-94', name: 'The Leftover Legend', description: 'For eating leftovers without a fuss.', iconType: 'emoji', icon: '🍲', isManual: true, requirements: [] },
    { id: 'trophy-95', name: 'The Chore Champion', description: 'For doing an extra chore without being asked.', iconType: 'emoji', icon: '🌟', isManual: true, requirements: [] },
    { id: 'trophy-96', name: 'The Lost and Found', description: 'For finding something important that was lost.', iconType: 'emoji', icon: '🔍', isManual: true, requirements: [] },
    { id: 'trophy-97', name: 'The Penny Pincher', description: 'For saving up your allowance for a goal.', iconType: 'emoji', icon: '🐷', isManual: true, requirements: [] },
];

export const createSampleMarkets = (): Market[] => ([
  { id: 'market-tutorial', title: 'Tutorial Market', description: 'A place to complete your first quests.', iconType: 'emoji', icon: '🎓', status: { type: 'open' } },
  { id: 'market-themes', title: 'The Gilded Brush (Themes)', description: 'Purchase new visual themes to customize your entire application.', iconType: 'emoji', icon: '🎨', status: { type: 'open' } },
  { id: 'market-bank', title: 'The Exchange Post', description: 'Exchange your various currencies and experience points.', iconType: 'emoji', icon: '⚖️', status: { type: 'open' } },
  { id: 'market-experiences', title: 'The Guild of Adventurers', description: 'Spend your hard-earned gems on real-world experiences and privileges.', iconType: 'emoji', icon: '🎟️', status: { type: 'open' } },
  { id: 'market-candy', title: 'The Sugar Cube', description: 'A delightful shop for purchasing sweet treats with your crystals.', iconType: 'emoji', icon: '🍬', status: { type: 'open' } },
]);

export const createSampleGameAssets = (): GameAsset[] => {
    const allAssets: GameAsset[] = [
    { 
        id: 'ga-theme-sapphire', 
        name: 'Sapphire Theme Unlock', 
        description: 'Unlocks the cool blue Sapphire theme for your account.', 
        url: 'https://placehold.co/150/3b82f6/FFFFFF?text=Sapphire', 
        icon: '🎨', 
        category: 'Theme', 
        avatarSlot: undefined, 
        isForSale: true, 
        costGroups: [[{rewardTypeId: 'core-gold', amount: 50}]], 
        marketIds: ['market-tutorial'], 
        creatorId: 'user-1', 
        createdAt: new Date().toISOString(), 
        purchaseLimit: 1,
        purchaseLimitType: 'PerUser',
        purchaseCount: 0,
        requiresApproval: false,
        linkedThemeId: 'sapphire',
    },
    { id: 'ga-theme-arcane', name: 'Theme: Arcane', description: 'Unlocks a magical, purple-hued theme.', url: 'https://placehold.co/150/8b5cf6/FFFFFF?text=Arcane', icon: '🎨', category: 'Theme', isForSale: true, costGroups: [[{ rewardTypeId: 'core-gold', amount: 100 }]], marketIds: ['market-themes'], creatorId: 'system', createdAt: new Date().toISOString(), purchaseLimit: 1, purchaseLimitType: 'PerUser', purchaseCount: 0, requiresApproval: false, linkedThemeId: 'arcane' },
    { id: 'ga-theme-cartoon', name: 'Theme: Cartoon', description: 'A bright, fun, and cartoony theme.', url: 'https://placehold.co/150/3b82f6/FFFFFF?text=Cartoon', icon: '🎨', category: 'Theme', isForSale: true, costGroups: [[{ rewardTypeId: 'core-gold', amount: 100 }]], marketIds: ['market-themes'], creatorId: 'system', createdAt: new Date().toISOString(), purchaseLimit: 1, purchaseLimitType: 'PerUser', purchaseCount: 0, requiresApproval: false, linkedThemeId: 'cartoon' },
    { id: 'ga-theme-forest', name: 'Theme: Forest', description: 'A calming theme of greens and browns.', url: 'https://placehold.co/150/166534/FFFFFF?text=Forest', icon: '🎨', category: 'Theme', isForSale: true, costGroups: [[{ rewardTypeId: 'core-gold', amount: 100 }]], marketIds: ['market-themes'], creatorId: 'system', createdAt: new Date().toISOString(), purchaseLimit: 1, purchaseLimitType: 'PerUser', purchaseCount: 0, requiresApproval: false, linkedThemeId: 'forest' },
    { id: 'ga-theme-ocean', name: 'Theme: Ocean', description: 'Dive deep with this aquatic theme.', url: 'https://placehold.co/150/0e7490/FFFFFF?text=Ocean', icon: '🎨', category: 'Theme', isForSale: true, costGroups: [[{ rewardTypeId: 'core-gold', amount: 100 }]], marketIds: ['market-themes'], creatorId: 'system', createdAt: new Date().toISOString(), purchaseLimit: 1, purchaseLimitType: 'PerUser', purchaseCount: 0, requiresApproval: false, linkedThemeId: 'ocean' },
    { id: 'ga-theme-vulcan', name: 'Theme: Vulcan', description: 'A fiery theme of reds and blacks.', url: 'https://placehold.co/150/991b1b/FFFFFF?text=Vulcan', icon: '🎨', category: 'Theme', isForSale: true, costGroups: [[{ rewardTypeId: 'core-gold', amount: 100 }]], marketIds: ['market-themes'], creatorId: 'system', createdAt: new Date().toISOString(), purchaseLimit: 1, purchaseLimitType: 'PerUser', purchaseCount: 0, requiresApproval: false, linkedThemeId: 'vulcan' },
    { id: 'ga-theme-royal', name: 'Theme: Royal', description: 'A regal theme of purple and gold.', url: 'https://placehold.co/150/7e22ce/FFFFFF?text=Royal', icon: '🎨', category: 'Theme', isForSale: true, costGroups: [[{ rewardTypeId: 'core-gold', amount: 100 }]], marketIds: ['market-themes'], creatorId: 'system', createdAt: new Date().toISOString(), purchaseLimit: 1, purchaseLimitType: 'PerUser', purchaseCount: 0, requiresApproval: false, linkedThemeId: 'royal' },
    { id: 'ga-theme-winter', name: 'Theme: Winter', description: 'An icy theme of blues and whites.', url: 'https://placehold.co/150/60a5fa/FFFFFF?text=Winter', icon: '🎨', category: 'Theme', isForSale: true, costGroups: [[{ rewardTypeId: 'core-gold', amount: 100 }]], marketIds: ['market-themes'], creatorId: 'system', createdAt: new Date().toISOString(), purchaseLimit: 1, purchaseLimitType: 'PerUser', purchaseCount: 0, requiresApproval: false, linkedThemeId: 'winter' },
    { id: 'ga-theme-sunset', name: 'Theme: Sunset', description: 'A warm theme of orange and pink.', url: 'https://placehold.co/150/f97316/FFFFFF?text=Sunset', icon: '🎨', category: 'Theme', isForSale: true, costGroups: [[{ rewardTypeId: 'core-gold', amount: 100 }]], marketIds: ['market-themes'], creatorId: 'system', createdAt: new Date().toISOString(), purchaseLimit: 1, purchaseLimitType: 'PerUser', purchaseCount: 0, requiresApproval: false, linkedThemeId: 'sunset' },
    { id: 'ga-theme-cyberpunk', name: 'Theme: Cyberpunk', description: 'A neon-drenched, futuristic theme.', url: 'https://placehold.co/150/db2777/FFFFFF?text=Cyber', icon: '🎨', category: 'Theme', isForSale: true, costGroups: [[{ rewardTypeId: 'core-gold', amount: 100 }]], marketIds: ['market-themes'], creatorId: 'system', createdAt: new Date().toISOString(), purchaseLimit: 1, purchaseLimitType: 'PerUser', purchaseCount: 0, requiresApproval: false, linkedThemeId: 'cyberpunk' },
    { id: 'ga-theme-steampunk', name: 'Theme: Steampunk', description: 'A theme of brass, copper, and gears.', url: 'https://placehold.co/150/a16207/FFFFFF?text=Steam', icon: '🎨', category: 'Theme', isForSale: true, costGroups: [[{ rewardTypeId: 'core-gold', amount: 100 }]], marketIds: ['market-themes'], creatorId: 'system', createdAt: new Date().toISOString(), purchaseLimit: 1, purchaseLimitType: 'PerUser', purchaseCount: 0, requiresApproval: false, linkedThemeId: 'steampunk' },
    { id: 'ga-theme-parchment', name: 'Theme: Parchment', description: 'A light theme resembling an old scroll.', url: 'https://placehold.co/150/fef3c7/000000?text=Parchment', icon: '🎨', category: 'Theme', isForSale: true, costGroups: [[{ rewardTypeId: 'core-gold', amount: 100 }]], marketIds: ['market-themes'], creatorId: 'system', createdAt: new Date().toISOString(), purchaseLimit: 1, purchaseLimitType: 'PerUser', purchaseCount: 0, requiresApproval: false, linkedThemeId: 'parchment' },
    { id: 'ga-theme-eerie', name: 'Theme: Eerie', description: 'A spooky theme with dark greens.', url: 'https://placehold.co/150/14532d/FFFFFF?text=Eerie', icon: '🎨', category: 'Theme', isForSale: true, costGroups: [[{ rewardTypeId: 'core-gold', amount: 100 }]], marketIds: ['market-themes'], creatorId: 'system', createdAt: new Date().toISOString(), purchaseLimit: 1, purchaseLimitType: 'PerUser', purchaseCount: 0, requiresApproval: false, linkedThemeId: 'eerie' },
    { id: 'ga-exp-movie', name: 'Movie Night Choice', description: 'You get to pick the movie for the next family movie night.', url: 'https://placehold.co/150/f97316/FFFFFF?text=Movie', icon: '🎬', category: 'Real-World Reward', isForSale: true, costGroups: [[{rewardTypeId: 'core-gems', amount: 10}]], marketIds: ['market-experiences'], creatorId: 'system', createdAt: new Date().toISOString(), purchaseLimit: 1, purchaseLimitType: 'PerUser', purchaseCount: 0, requiresApproval: true },
    { id: 'ga-exp-game-hour', name: 'One Hour of Gaming', description: 'A voucher for one hour of video games.', url: 'https://placehold.co/150/3b82f6/FFFFFF?text=1+Hour', icon: '🎮', category: 'Real-World Reward', isForSale: true, costGroups: [[{rewardTypeId: 'core-gems', amount: 5}]], marketIds: ['market-experiences'], creatorId: 'system', createdAt: new Date().toISOString(), purchaseLimit: null, purchaseLimitType: 'Total', purchaseCount: 0, requiresApproval: false },
    { id: 'ga-candy-chocolate', name: 'Chocolate Bar', description: 'A delicious bar of chocolate.', url: 'https://placehold.co/150/78350f/FFFFFF?text=Chocolate', icon: '🍫', category: 'Treat', isForSale: true, costGroups: [[{rewardTypeId: 'core-crystal', amount: 20}]], marketIds: ['market-candy'], creatorId: 'system', createdAt: new Date().toISOString(), purchaseLimit: 10, purchaseLimitType: 'Total', purchaseCount: 0, requiresApproval: false },
    { id: 'ga-candy-lollipop', name: 'Lollipop', description: 'A sweet, colorful lollipop.', url: 'https://placehold.co/150/ec4899/FFFFFF?text=Lollipop', icon: '🍭', category: 'Treat', isForSale: true, costGroups: [[{rewardTypeId: 'core-crystal', amount: 10}]], marketIds: ['market-candy'], creatorId: 'system', createdAt: new Date().toISOString(), purchaseLimit: null, purchaseLimitType: 'Total', purchaseCount: 0, requiresApproval: false },
    {
        id: 'ga-special-item',
        name: 'Mysterious Amulet',
        description: 'An amulet that can be bought with different resources.',
        url: 'https://placehold.co/150/8b5cf6/FFFFFF?text=Amulet',
        icon: '🧿',
        category: 'Trinket',
        isForSale: true,
        costGroups: [
            [{rewardTypeId: 'core-wisdom', amount: 5}, {rewardTypeId: 'core-skill', amount: 3}],
            [{rewardTypeId: 'core-crystal', amount: 1}, {rewardTypeId: 'core-gold', amount: 1}]
        ],
        marketIds: ['market-experiences'],
        creatorId: 'system',
        createdAt: new Date().toISOString(),
        purchaseLimit: 1,
        purchaseLimitType: 'PerUser',
        purchaseCount: 0,
        requiresApproval: false,
    }
  ];
  
  const exchangeAssetIds = new Set(['ga-bank-gold-to-gems', 'ga-bank-gems-to-gold', 'ga-bank-gold-to-strength', 'ga-bank-strength-to-gold', 'ga-bank-gems-to-wisdom', 'ga-bank-wisdom-to-gems']);

  return allAssets.filter(asset => !exchangeAssetIds.has(asset.id));
};

export const createInitialGuilds = (users: any): Guild[] => ([
  { id: 'guild-1', name: 'The First Guild', purpose: 'The default guild for all new adventurers.', memberIds: users.map((u: any) => u.id), isDefault: true },
]);

export const createSampleQuests = (users: any): Quest[] => {
  const explorer = users.find((u: any) => u.role === Role.Explorer);
  const gatekeeper = users.find((u: any) => u.role === Role.Gatekeeper);
  const donegeonMaster = users.find((u: any) => u.role === Role.DonegeonMaster);

  const quests: Quest[] = [
    // For Explorer
    {
      id: 'quest-explorer-1', title: 'Change Your Theme', description: "First, visit the Marketplace and buy the 'Sapphire Theme Unlock' from the Tutorial Market. Then, go to the 'Themes' page from the sidebar to activate it!", type: QuestType.Venture, iconType: 'emoji', icon: '🎨', tags: ['tutorial', 'tutorial-explorer'],
      rewards: [{ rewardTypeId: 'core-wisdom', amount: 50 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: explorer ? [explorer.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [], groupId: 'qg-personal'
    },
    {
      id: 'quest-explorer-2', title: 'Consult the Sages', description: "Knowledge is power! Visit the 'Help Guide' from the sidebar to learn the secrets of the Donegeon, then complete this quest.", type: QuestType.Venture, iconType: 'emoji', icon: '📖', tags: ['tutorial', 'tutorial-explorer', 'learning'],
      rewards: [{ rewardTypeId: 'core-wisdom', amount: 20 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: explorer ? [explorer.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [], groupId: 'qg-school'
    },
    {
      id: 'quest-gatekeeper-approval-setup', title: 'Submit A Note', description: "Complete this quest to test the approval system.", type: QuestType.Venture, iconType: 'emoji', icon: '📝', tags: ['tutorial', 'tutorial-explorer'],
      rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: explorer ? [explorer.id] : [], requiresApproval: true, claimedByUserIds: [], dismissals: [], groupId: 'qg-personal'
    },
    {
      id: 'quest-explorer-3', title: 'Plan Your Week', description: "The wise adventurer is always prepared. Visit the 'Calendar' page from the sidebar to see your upcoming schedule.", type: QuestType.Venture, iconType: 'emoji', icon: '🗓️', tags: ['tutorial', 'tutorial-explorer'],
      rewards: [{ rewardTypeId: 'core-wisdom', amount: 15 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: explorer ? [explorer.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [], groupId: 'qg-personal'
    },
    // For Gatekeeper
    {
      id: 'quest-gatekeeper-1', title: 'The First Approval', description: "An Explorer has submitted a quest for approval. Go to the 'Approvals' page and either approve or reject it.", type: QuestType.Venture, iconType: 'emoji', icon: '✅', tags: ['tutorial', 'tutorial-gatekeeper'],
      rewards: [{ rewardTypeId: 'core-wisdom', amount: 25 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: gatekeeper ? [gatekeeper.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [], groupId: 'qg-personal'
    },
    {
      id: 'quest-gatekeeper-2', title: 'Review the Troops', description: "Visit the 'Guild' page to review all members of your guild.", type: QuestType.Venture, iconType: 'emoji', icon: '🏰', tags: ['tutorial', 'tutorial-gatekeeper'],
      rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: gatekeeper ? [gatekeeper.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [], groupId: 'qg-family'
    },
    // For Donegeon Master
    {
      id: 'quest-dm-1', title: 'Create a Quest', description: "Go to 'Manage Quests' and create a new quest of any type. Assign it to the Explorer.", type: QuestType.Venture, iconType: 'emoji', icon: '🛠️', tags: ['tutorial', 'tutorial-donegeon-master'],
      rewards: [{ rewardTypeId: 'core-wisdom', amount: 50 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: donegeonMaster ? [donegeonMaster.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [], groupId: 'qg-personal'
    },
    {
      id: 'quest-dm-2', title: 'Customize the Donegeon', description: "Visit the 'Settings' page and change the app's name in the 'Terminology' section.", type: QuestType.Venture, iconType: 'emoji', icon: '⚙️', tags: ['tutorial', 'tutorial-donegeon-master'],
      rewards: [{ rewardTypeId: 'core-wisdom', amount: 25 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: donegeonMaster ? [donegeonMaster.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [], groupId: 'qg-personal'
    },
    {
      id: 'quest-dm-3', title: 'Manual Adjustment', description: "An adventurer did something great outside the app! Go to 'Manage Users' and use the 'Adjust' button on the Explorer to grant them a bonus reward.", type: QuestType.Venture, iconType: 'emoji', icon: '✨', tags: ['tutorial', 'tutorial-donegeon-master'],
      rewards: [{ rewardTypeId: 'core-wisdom', amount: 25 }], lateSetbacks: [], incompleteSetbacks: [],
      isActive: true, isOptional: false, availabilityType: QuestAvailability.Unlimited, availabilityCount: 1, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [],
      assignedUserIds: donegeonMaster ? [donegeonMaster.id] : [], requiresApproval: false, claimedByUserIds: [], dismissals: [], groupId: 'qg-personal'
    },
  ];
  return quests;
};

export function createInitialData(setupChoice = 'guided', adminUserData: any, blueprint: any) {
    if (setupChoice === 'scratch') {
        const users = [adminUserData];
        const guilds = createInitialGuilds(users);
        const bankMarket = createSampleMarkets().find(m => m.id === 'market-bank');
        return {
            users: users,
            quests: [],
            questGroups: [],
            markets: bankMarket ? [bankMarket--- START OF FILE src/data/assetLibrary.ts ---

import { User, Role, RewardTypeDefinition, RewardCategory, Rank, Trophy, TrophyRequirementType, QuestType, Market, Quest, QuestAvailability, Guild, AppSettings, SidebarConfigItem, GameAsset, ThemeDefinition, ThemeStyle, QuestCompletion, QuestCompletionStatus, MarketStatus, LibraryPack, BlueprintAssets, RewardItem, TrophyRequirement, QuestGroup } from '../types';

// ====================================================================================
// == ASSET CREATION HELPERS ==========================================================
// ====================================================================================

// Helper to create a quest object with defaults
const createQuest = (data: Partial<Quest> & { title: string; description: string; }): Quest => ({
  id: `pack-quest-${Math.random().toString(36).substring(2, 9)}`,
  type: QuestType.Venture,
  iconType: 'emoji',
  icon: '📝',
  tags: [],
  rewards: [],
  lateSetbacks: [],
  incompleteSetbacks: [],
  isActive: true,
  isOptional: false,
  availabilityType: QuestAvailability.Unlimited,
  availabilityCount: 1,
  weeklyRecurrenceDays: [],
  monthlyRecurrenceDays: [],
  assignedUserIds: [],
  requiresApproval: false,
  claimedByUserIds: [],
  dismissals: [],
  ...data,
});

// Helper to create a trophy object with defaults
const createTrophy = (data: Partial<Trophy> & { name: string; description: string; }): Trophy => ({
  id: `pack-trophy-${Math.random().toString(36).substring(2, 9)}`,
  iconType: 'emoji',
  icon: '🏆',
  isManual: true,
  requirements: [],
  ...data,
});

// Helper to create a game asset (item) object with defaults
const createGameAsset = (data: Partial<GameAsset> & { name: string; description: string; url: string; }): GameAsset => ({
  id: `pack-g-asset-${Math.random().toString(36).substring(2, 9)}`,
  category: 'Miscellaneous',
  isForSale: true,
  costGroups: [],
  marketIds: [],
  creatorId: 'system',
  createdAt: new Date().toISOString(),
  purchaseLimit: null,
  purchaseLimitType: 'Total',
  purchaseCount: 0,
  requiresApproval: false,
  ...data,
});

// Helper to create a market object with defaults
const createMarket = (data: Partial<Market> & { title: string; description: string; }): Market => ({
  id: `pack-market-${Math.random().toString(36).substring(2, 9)}`,
  iconType: 'emoji',
  icon: '🛒',
  status: { type: 'open' },
  ...data,
});

// Helper to create a reward type object with defaults
const createReward = (data: Partial<RewardTypeDefinition> & { name: string; description: string; category: RewardCategory }): RewardTypeDefinition => ({
  id: `pack-reward-${Math.random().toString(36).substring(2, 9)}`,
  isCore: false,
  iconType: 'emoji',
  icon: '💎',
  ...data,
});

// Helper to create a quest group object with defaults
const createQuestGroup = (data: Partial<QuestGroup> & { name: string; }): QuestGroup => ({
    id: `pack-qg-${Math.random().toString(36).substring(2, 9)}`,
    description: '',
    icon: '📂',
    ...data,
});

// ====================================================================================
// == LIBRARY PACK DEFINITIONS ========================================================
// ====================================================================================

export const libraryPacks: LibraryPack[] = [
  // =================================================================================
  // == QUEST PACKS ==================================================================
  // =================================================================================
  {
    id: 'pack-household-chores',
    type: 'Quests',
    title: 'Household Chores Starter',
    description: 'A basic set of daily and weekly chores to keep any household running smoothly.',
    emoji: '🏡',
    color: 'border-sky-500',
    assets: {
      questGroups: [createQuestGroup({id: 'qg-household', name: 'Household Chores', icon: '🏡'})],
      quests: [
        createQuest({ title: 'Make Bed', description: 'Start the day right by making your bed.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🛏️', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['Bedroom', 'Cleaning'], groupId: 'qg-household' }),
        createQuest({ title: 'Tidy Room', description: 'Spend 10 minutes tidying up your personal space.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🧹', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['Bedroom', 'Cleaning', 'Organization'], groupId: 'qg-household' }),
        createQuest({ title: 'Take Out Trash', description: 'Collect trash from all bins and take it to the curb.', type: QuestType.Duty, availabilityType: QuestAvailability.Weekly, weeklyRecurrenceDays: [2], icon: '🗑️', rewards: [{ rewardTypeId: 'core-strength', amount: 15 }], tags: ['Kitchen', 'Cleaning'], groupId: 'qg-household' }),
        createQuest({ title: 'Set the Table', description: 'Set the table for dinner.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🍽️', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['Kitchen', 'Helping'], groupId: 'qg-household' }),
        createQuest({ title: 'Help with Dishes', description: 'Help load or unload the dishwasher, or wash dishes by hand.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🧼', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['Kitchen', 'Helping'], groupId: 'qg-household' }),
      ],
    },
  },
  {
    id: 'pack-academic-adventures',
    type: 'Quests',
    title: 'Academic Adventures',
    description: 'A collection of quests focused on school, learning, and intellectual growth.',
    emoji: '📚',
    color: 'border-sky-500',
    assets: {
      questGroups: [createQuestGroup({id: 'qg-school', name: 'School & Learning', icon: '📚'})],
      quests: [
        createQuest({ title: 'Finish Homework', description: 'Complete all assigned homework for the day.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '✏️', rewards: [{ rewardTypeId: 'core-wisdom', amount: 20 }], tags: ['School', 'Learning'], groupId: 'qg-school' }),
        createQuest({ title: 'Read for 20 Minutes', description: 'Read a book for at least 20 minutes.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '📖', rewards: [{ rewardTypeId: 'core-wisdom', amount: 15 }], tags: ['School', 'Learning'], groupId: 'qg-school' }),
        createQuest({ title: 'Study for a Test', description: 'Spend 30 minutes studying for an upcoming test or quiz.', type: QuestType.Venture, icon: '🧠', rewards: [{ rewardTypeId: 'core-wisdom', amount: 25 }], tags: ['School', 'Learning'], groupId: 'qg-school' }),
        createQuest({ title: 'Organize Backpack', description: 'Clean out and organize your backpack for the week.', type: QuestType.Duty, availabilityType: QuestAvailability.Weekly, weeklyRecurrenceDays: [0], icon: '🎒', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['School', 'Organization'], groupId: 'qg-school' }),
        createQuest({ title: 'Teach Someone Something New', description: 'Share a cool fact or explain a concept you learned to a family member.', type: QuestType.Venture, icon: '🧑‍🏫', rewards: [{ rewardTypeId: 'core-wisdom', amount: 15 }], tags: ['Learning', 'Family Time'], groupId: 'qg-school' }),
      ],
    },
  },
  {
    id: 'pack-outdoor-explorer',
    type: 'Quests',
    title: 'Outdoor Explorer',
    description: 'Get outside, get active, and help with yard work with these outdoor quests.',
    emoji: '🌳',
    color: 'border-sky-500',
    assets: {
      questGroups: [createQuestGroup({id: 'qg-outdoor', name: 'Outdoor & Adventure', icon: '🌳'})],
      quests: [
        createQuest({ title: 'Water the Plants', description: 'Give all the indoor and outdoor plants a drink of water.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '💧', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['Yardwork', 'Helping'], groupId: 'qg-outdoor' }),
        createQuest({ title: 'Rake Leaves', description: 'Rake the leaves in a section of the yard.', type: QuestType.Venture, icon: '🍂', rewards: [{ rewardTypeId: 'core-strength', amount: 30 }], tags: ['Yardwork'], groupId: 'qg-outdoor' }),
        createQuest({ title: 'Pull Weeds', description: 'Spend 15 minutes pulling weeds from the garden or flower beds.', type: QuestType.Venture, icon: '🌿', rewards: [{ rewardTypeId: 'core-diligence', amount: 20 }], tags: ['Yardwork'], groupId: 'qg-outdoor' }),
        createQuest({ title: 'Play Outside for 30 Minutes', description: 'Get some fresh air! Ride a bike, play a sport, or just run around.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '⚽', rewards: [{ rewardTypeId: 'core-strength', amount: 15 }], tags: ['Health'], groupId: 'qg-outdoor' }),
        createQuest({ title: 'Help with the Harvest', description: 'Help pick ripe vegetables or fruits from the garden.', type: QuestType.Venture, icon: '🍎', rewards: [{ rewardTypeId: 'core-diligence', amount: 15 }], tags: ['Yardwork', 'Helping'], groupId: 'qg-outdoor' }),
      ],
    },
  },
  {
    id: 'pack-kindness-crew',
    type: 'Quests',
    title: 'Kindness Crew',
    description: 'Quests designed to promote kindness, helping others, and positive social interactions.',
    emoji: '💖',
    color: 'border-sky-500',
    assets: {
      questGroups: [createQuestGroup({id: 'qg-kindness', name: 'Kindness & Service', icon: '💖'})],
      quests: [
        createQuest({ title: 'Give a Compliment', description: 'Give a sincere compliment to someone.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '😊', rewards: [{ rewardTypeId: 'core-gems', amount: 5 }], tags: ['Helping', 'Family Time'], groupId: 'qg-kindness' }),
        createQuest({ title: 'Help Without Being Asked', description: 'Find a way to help a family member without them having to ask you.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🤝', rewards: [{ rewardTypeId: 'core-gems', amount: 15 }], tags: ['Helping', 'Family Time'], groupId: 'qg-kindness' }),
        createQuest({ title: 'Write a Thank You Note', description: 'Write a short note to someone thanking them for something they did.', type: QuestType.Venture, icon: '💌', rewards: [{ rewardTypeId: 'core-gems', amount: 10 }], tags: ['Helping', 'Creative'], groupId: 'qg-kindness' }),
        createQuest({ title: 'Share Your Toys', description: 'Willingly share your toys or games with a sibling or friend.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🧸', rewards: [{ rewardTypeId: 'core-gems', amount: 5 }], tags: ['Family Time'], groupId: 'qg-kindness' }),
        createQuest({ title: 'Donate to Charity', description: 'Pick out old toys or clothes to donate to those in need.', type: QuestType.Venture, icon: '💝', rewards: [{ rewardTypeId: 'core-gems', amount: 25 }], tags: ['Helping', 'Organization'], groupId: 'qg-kindness' }),
      ],
    },
  },
   {
    id: 'pack-pet-care',
    type: 'Quests',
    title: 'Pet Care Patrol',
    description: 'Essential duties for taking care of your furry, scaled, or feathered friends.',
    emoji: '🐾',
    color: 'border-sky-500',
    assets: {
      questGroups: [createQuestGroup({id: 'qg-pets', name: 'Pet Care', icon: '🐾'})],
      quests: [
        createQuest({ title: 'Feed the Pet(s)', description: 'Provide the correct amount of food for your pet(s) at their mealtime.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '밥', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['Pets', 'Helping'], groupId: 'qg-pets' }),
        createQuest({ title: 'Fresh Water for Pet(s)', description: 'Empty, rinse, and refill your pet\'s water bowl with fresh water.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '💧', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['Pets', 'Helping'], groupId: 'qg-pets' }),
        createQuest({ title: 'Walk the Dog', description: 'Take the dog for a walk of at least 15 minutes.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🐕', rewards: [{ rewardTypeId: 'core-strength', amount: 15 }], tags: ['Pets', 'Health'], groupId: 'qg-pets' }),
        createQuest({ title: 'Clean the Litter Box', description: 'Scoop the litter box and dispose of the waste properly.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🐈', rewards: [{ rewardTypeId: 'core-diligence', amount: 15 }], tags: ['Pets', 'Cleaning'], groupId: 'qg-pets' }),
        createQuest({ title: 'Playtime with Pet', description: 'Spend 10 minutes actively playing with your pet.', type: QuestType.Venture, icon: '🎾', rewards: [{ rewardTypeId: 'core-skill', amount: 10 }], tags: ['Pets', 'Family Time'], groupId: 'qg-pets' }),
      ]
    }
  },
  {
    id: 'pack-personal-hygiene',
    type: 'Quests',
    title: 'Personal Hygiene Heroes',
    description: 'Important daily routines for staying clean and healthy.',
    emoji: '🧼',
    color: 'border-sky-500',
    assets: {
      questGroups: [createQuestGroup({id: 'qg-health', name: 'Health & Wellness', icon: '❤️‍🩹'})],
      quests: [
        createQuest({ title: 'Brush Teeth (Morning)', description: 'Brush your teeth for 2 minutes in the morning.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, lateTime: '09:00', icon: '☀️', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['Health'], groupId: 'qg-health' }),
        createQuest({ title: 'Brush Teeth (Evening)', description: 'Brush your teeth for 2 minutes before bed.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, lateTime: '21:00', icon: '🌙', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['Health'], groupId: 'qg-health' }),
        createQuest({ title: 'Take a Bath/Shower', description: 'Take a bath or shower and get squeaky clean.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🚿', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['Health'], groupId: 'qg-health' }),
        createQuest({ title: 'Get Dressed', description: 'Get dressed for the day, including putting away your pajamas.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '👕', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['Health'], groupId: 'qg-health' }),
        createQuest({ title: 'Wash Hands Before Meals', description: 'Wash your hands with soap and water before eating.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '👏', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['Health'], groupId: 'qg-health' }),
      ]
    }
  },
  {
    id: 'pack-financial-future',
    type: 'Quests',
    title: 'Financial Future',
    description: 'Learn about money management, saving, and smart spending.',
    emoji: '💰',
    color: 'border-sky-500',
    assets: {
      quests: [
        createQuest({ title: 'Save Your Allowance', description: 'Put at least 10% of your allowance into savings.', type: QuestType.Venture, icon: '🐷', rewards: [{ rewardTypeId: 'core-wisdom', amount: 15 }], tags: ['Learning', 'Finance'] }),
        createQuest({ title: 'Track Your Spending', description: 'For one week, write down everything you spend money on.', type: QuestType.Venture, icon: '🧾', rewards: [{ rewardTypeId: 'core-diligence', amount: 25 }], tags: ['Learning', 'Finance'] }),
        createQuest({ title: 'Research a Big Purchase', description: 'Before asking for an expensive item, research different options and prices.', type: QuestType.Venture, icon: '🔍', rewards: [{ rewardTypeId: 'core-wisdom', amount: 20 }], tags: ['Learning', 'Finance'] }),
        createQuest({ title: 'Learn About Compound Interest', description: 'Watch a short video or read an article about how compound interest works.', type: QuestType.Venture, icon: '📈', rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['Learning', 'Finance'] }),
      ]
    }
  },
  {
    id: 'pack-culinary-champion',
    type: 'Quests',
    title: 'Culinary Champion',
    description: 'Quests for aspiring chefs to help in the kitchen and learn cooking skills.',
    emoji: '🧑‍🍳',
    color: 'border-sky-500',
    assets: {
      quests: [
        createQuest({ title: 'Help Plan a Meal', description: 'Help decide what to have for dinner one night this week.', type: QuestType.Venture, icon: '🤔', rewards: [{ rewardTypeId: 'core-creative', amount: 10 }], tags: ['Kitchen', 'Helping'] }),
        createQuest({ title: 'Wash Vegetables', description: 'Help wash and prepare vegetables for a meal.', type: QuestType.Venture, icon: '🥕', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['Kitchen', 'Helping'] }),
        createQuest({ title: 'Measure Ingredients', description: 'Help measure out the ingredients for a recipe.', type: QuestType.Venture, icon: '🥣', rewards: [{ rewardTypeId: 'core-skill', amount: 15 }], tags: ['Kitchen', 'Helping', 'Learning'] }),
        createQuest({ title: 'Stir the Pot', description: 'With supervision, help stir ingredients in a pot or bowl.', type: QuestType.Venture, icon: '🍳', rewards: [{ rewardTypeId: 'core-skill', amount: 5 }], tags: ['Kitchen', 'Helping'] }),
        createQuest({ title: 'Help Clean Up After Baking', description: 'Wipe counters, put away ingredients, and help with baking dishes.', type: QuestType.Venture, icon: '✨', rewards: [{ rewardTypeId: 'core-diligence', amount: 15 }], tags: ['Kitchen', 'Helping', 'Cleaning'] }),
      ]
    }
  },
   {
    id: 'pack-mindful-moments',
    type: 'Quests',
    title: 'Mindful Moments',
    description: 'A set of quests to encourage relaxation, focus, and mental well-being.',
    emoji: '🧘',
    color: 'border-sky-500',
    assets: {
      quests: [
        createQuest({ title: '5 Minutes of Quiet Time', description: 'Sit quietly for 5 minutes without any screens. You can meditate, listen to music, or just be still.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🤫', rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['Health', 'Mindfulness'] }),
        createQuest({ title: 'Gratitude Journal', description: 'Write down three things you are grateful for today.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '✍️', rewards: [{ rewardTypeId: 'core-creative', amount: 10 }], tags: ['Health', 'Mindfulness'] }),
        createQuest({ title: 'Mindful Breathing', description: 'Practice deep breathing for 2 minutes. Inhale for 4 seconds, hold for 4, and exhale for 6.', type: QuestType.Venture, icon: '😮‍💨', rewards: [{ rewardTypeId: 'core-wisdom', amount: 5 }], tags: ['Health', 'Mindfulness'] }),
        createQuest({ title: 'Go for a Nature Walk', description: 'Take a 15-minute walk and pay attention to the sights, sounds, and smells of nature.', type: QuestType.Venture, icon: '🌲', rewards: [{ rewardTypeId: 'core-strength', amount: 15 }], tags: ['Health', 'Mindfulness', 'Outdoors'] }),
      ]
    }
  },
  {
    id: 'pack-artistic-expression',
    type: 'Quests',
    title: 'Artistic Expression',
    description: 'Unleash your creativity with these arts and crafts quests.',
    emoji: '🎨',
    color: 'border-sky-500',
    assets: {
      quests: [
        createQuest({ title: 'Draw a Picture', description: 'Spend 15 minutes drawing or coloring a picture.', type: QuestType.Venture, icon: '🖍️', rewards: [{ rewardTypeId: 'core-creative', amount: 10 }], tags: ['Creative', 'Art'] }),
        createQuest({ title: 'Build with LEGOs', description: 'Create something cool with LEGOs or other building blocks for 20 minutes.', type: QuestType.Venture, icon: '🧱', rewards: [{ rewardTypeId: 'core-creative', amount: 15 }], tags: ['Creative', 'Building'] }),
        createQuest({ title: 'Write a Short Story', description: 'Write a story that is at least one paragraph long.', type: QuestType.Venture, icon: '📜', rewards: [{ rewardTypeId: 'core-creative', amount: 20 }], tags: ['Creative', 'Writing'] }),
        createQuest({ title: 'Learn a New Song', description: 'Practice a song on an instrument or learn the lyrics to a new song.', type: QuestType.Venture, icon: '🎶', rewards: [{ rewardTypeId: 'core-skill', amount: 15 }], tags: ['Creative', 'Music'] }),
      ]
    }
  },
  {
    id: 'pack-holiday-helper',
    type: 'Quests',
    title: 'Holiday Helper',
    description: 'Get into the festive spirit by helping with holiday preparations.',
    emoji: '🎄',
    color: 'border-sky-500',
    assets: {
      quests: [
        createQuest({ title: 'Help Decorate', description: 'Help put up holiday decorations for 30 minutes.', type: QuestType.Venture, icon: '✨', rewards: [{ rewardTypeId: 'core-creative', amount: 20 }], tags: ['Holiday', 'Helping'] }),
        createQuest({ title: 'Wrap a Present', description: 'Help wrap a gift for a family member or friend.', type: QuestType.Venture, icon: '🎁', rewards: [{ rewardTypeId: 'core-skill', amount: 10 }], tags: ['Holiday', 'Helping'] }),
        createQuest({ title: 'Bake Holiday Treats', description: 'Help bake cookies or other treats for the holiday.', type: QuestType.Venture, icon: '🍪', rewards: [{ rewardTypeId: 'core-creative', amount: 15 }], tags: ['Holiday', 'Kitchen'] }),
        createQuest({ title: 'Shovel a Neighbor\'s Walkway', description: 'As an act of kindness, shovel the snow from a neighbor\'s walkway.', type: QuestType.Venture, icon: '❄️', rewards: [{ rewardTypeId: 'core-gems', amount: 30 }], tags: ['Holiday', 'Helping', 'Outdoors'] }),
      ]
    }
  },
  {
    id: 'pack-screen-free-fun',
    type: 'Quests',
    title: 'Screen-Free Fun',
    description: 'A pack of activities to do instead of looking at a screen.',
    emoji: '📵',
    color: 'border-sky-500',
    assets: {
      quests: [
        createQuest({ title: 'Play a Board Game', description: 'Play a full game of a board game or card game with the family.', type: QuestType.Venture, icon: '🎲', rewards: [{ rewardTypeId: 'core-wisdom', amount: 15 }], tags: ['Family Time', 'Screen-Free'] }),
        createQuest({ title: 'Read a Physical Book', description: 'Read a book that is not on a screen for 20 minutes.', type: QuestType.Venture, icon: '📖', rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['Learning', 'Screen-Free'] }),
        createQuest({ title: 'Do a Puzzle', description: 'Spend 20 minutes working on a jigsaw puzzle.', type: QuestType.Venture, icon: '🧩', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['Family Time', 'Screen-Free'] }),
        createQuest({ title: 'Help with a Project', description: 'Help a parent or sibling with a real-world project (like building furniture or cooking).', type: QuestType.Venture, icon: '🛠️', rewards: [{ rewardTypeId: 'core-skill', amount: 20 }], tags: ['Helping', 'Screen-Free'] }),
      ]
    }
  },
  {
    id: 'pack-the-librarian',
    type: 'Quests',
    title: 'The Librarian',
    description: 'Quests that encourage reading and learning through books.',
    emoji: '📚',
    color: 'border-sky-500',
    assets: {
      quests: [
        createQuest({ title: 'Visit the Library', description: 'Go to the local library and check out a book.', type: QuestType.Venture, icon: '🏛️', rewards: [{ rewardTypeId: 'core-wisdom', amount: 20 }], tags: ['Learning', 'Outdoors'] }),
        createQuest({ title: 'Finish a Book', description: 'Read a book from start to finish.', type: QuestType.Venture, icon: '✅', rewards: [{ rewardTypeId: 'core-wisdom', amount: 50 }], tags: ['Learning'] }),
        createQuest({ title: 'Read to Someone', description: 'Read a book out loud to a younger sibling or a parent.', type: QuestType.Venture, icon: '🗣️', rewards: [{ rewardTypeId: 'core-gems', amount: 15 }], tags: ['Family Time', 'Learning'] }),
        createQuest({ title: 'Organize a Bookshelf', description: 'Tidy up and organize one of the bookshelves in the house.', type: QuestType.Venture, icon: ' bookshelf', rewards: [{ rewardTypeId: 'core-diligence', amount: 15 }], tags: ['Organization', 'Cleaning'] }),
      ]
    }
  },
  {
    id: 'pack-sports-superstar',
    type: 'Quests',
    title: 'Sports Superstar',
    description: 'Practice skills and stay active with these sports-related quests.',
    emoji: '🏅',
    color: 'border-sky-500',
    assets: {
      quests: [
        createQuest({ title: 'Practice for 30 Minutes', description: 'Practice your sport (soccer, basketball, etc.) for 30 minutes.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🏀', rewards: [{ rewardTypeId: 'core-skill', amount: 20 }], tags: ['Health', 'Sports'] }),
        createQuest({ title: 'Stretch After Practice', description: 'Do a full stretching routine after your practice or game.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🧘', rewards: [{ rewardTypeId: 'core-strength', amount: 5 }], tags: ['Health', 'Sports'] }),
        createQuest({ title: 'Clean Your Equipment', description: 'Wipe down and properly store your sports equipment after use.', type: QuestType.Venture, icon: '🧼', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['Cleaning', 'Sports'] }),
        createQuest({ title: 'Watch a Game Film', description: 'Watch a professional game or a recording of your own to learn new strategies.', type: QuestType.Venture, icon: '📺', rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['Learning', 'Sports'] }),
      ]
    }
  },
  {
    id: 'pack-secret-agent',
    type: 'Quests',
    title: 'Secret Agent Service',
    description: 'A set of stealthy quests about doing good deeds without being noticed.',
    emoji: '🕵️',
    color: 'border-sky-500',
    assets: {
      quests: [
        createQuest({ title: 'Secretly Tidy a Room', description: 'Tidy up a common area (like the living room) without anyone seeing you do it.', type: QuestType.Venture, icon: '🤫', rewards: [{ rewardTypeId: 'core-gems', amount: 20 }], tags: ['Cleaning', 'Helping', 'Stealth'] }),
        createQuest({ title: 'Leave a Kind Note', description: 'Leave an anonymous, kind note for a family member to find.', type: QuestType.Venture, icon: '💌', rewards: [{ rewardTypeId: 'core-gems', amount: 10 }], tags: ['Kindness', 'Stealth'] }),
        createQuest({ title: 'Do a Chore for a Sibling', description: 'Do one of your sibling\'s chores for them, without telling them it was you.', type: QuestType.Venture, icon: '🎁', rewards: [{ rewardTypeId: 'core-gems', amount: 25 }], tags: ['Helping', 'Stealth'] }),
        createQuest({ title: 'Refill the TP', description: 'If you use the last of the toilet paper, replace the roll without being told.', type: QuestType.Venture, icon: '🧻', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['Helping', 'Stealth'] }),
      ]
    }
  },

  // =================================================================================
  // == ITEM PACKS ===================================================================
  // =================================================================================
  {
    id: 'pack-avatar-starter-kit',
    type: 'Items',
    title: 'Starter Avatar Kit',
    description: 'A few basic cosmetic items to get your avatar customization started.',
    emoji: '🧑‍🎤',
    color: 'border-violet-500',
    assets: {
        markets: [createMarket({ id: 'market-avatar-basics', title: 'The Tailor\'s Shop', description: 'Basic gear for a new adventurer.'})],
        gameAssets: [
            createGameAsset({ name: 'Simple Tunic', icon: '👕', description: 'A basic but sturdy tunic for a starting adventurer.', url: 'https://placehold.co/150/a16207/FFFFFF?text=Tunic', category: 'Avatar-shirt', avatarSlot: 'shirt', costGroups: [[{rewardTypeId: 'core-gold', amount: 20}]], marketIds: ['market-avatar-basics'] }),
            createGameAsset({ name: 'Leather Boots', icon: '👢', description: 'Simple boots, good for walking.', url: 'https://placehold.co/150/3f2f25/FFFFFF?text=Boots', category: 'Avatar-feet', avatarSlot: 'feet', costGroups: [[{rewardTypeId: 'core-gold', amount: 15}]], marketIds: ['market-avatar-basics'] }),
            createGameAsset({ name: 'Pointy Hat', icon: '🎩', description: 'A whimsical, pointy hat.', url: 'https://placehold.co/150/1d4ed8/FFFFFF?text=Hat', category: 'Avatar-hat', avatarSlot: 'hat', costGroups: [[{rewardTypeId: 'core-gold', amount: 25}]], marketIds: ['market-avatar-basics'] }),
            createGameAsset({ name: 'Wooden Staff', icon: '🌲', description: 'A simple wooden staff.', url: 'https://placehold.co/150/5f5244/FFFFFF?text=Staff', category: 'Avatar-hand-right', avatarSlot: 'hand-right', costGroups: [[{rewardTypeId: 'core-gold', amount: 30}]], marketIds: ['market-avatar-basics'] }),
        ]
    }
  },
  {
    id: 'pack-real-world-rewards',
    type: 'Items',
    title: 'Real World Rewards',
    description: 'A set of vouchers for real-world privileges and treats.',
    emoji: '🎟️',
    color: 'border-violet-500',
    assets: {
        markets: [createMarket({ id: 'market-privileges', title: 'The Reward Board', description: 'Cash in your points for real rewards!'})],
        gameAssets: [
            createGameAsset({ name: '30 Minutes of Screen Time', icon: '📱', description: 'A voucher for 30 minutes of video games, TV, or tablet time.', url: 'https://placehold.co/150/4f46e5/FFFFFF?text=30m', category: 'Real-World Reward', costGroups: [[{rewardTypeId: 'core-crystal', amount: 50}]], marketIds: ['market-privileges'], requiresApproval: true }),
            createGameAsset({ name: 'Pick Dinner', icon: '🍕', description: 'You get to choose what the family has for dinner one night.', url: 'https://placehold.co/150/db2777/FFFFFF?text=Dinner', category: 'Real-World Reward', costGroups: [[{rewardTypeId: 'core-gems', amount: 100}]], marketIds: ['market-privileges'], requiresApproval: true }),
            createGameAsset({ name: 'Dessert After Dinner', icon: '🍰', description: 'A voucher for a special dessert after your meal.', url: 'https://placehold.co/150/f59e0b/FFFFFF?text=Dessert', category: 'Real-World Reward', costGroups: [[{rewardTypeId: 'core-crystal', amount: 30}]], marketIds: ['market-privileges'], requiresApproval: false }),
        ]
    }
  },
   {
    id: 'pack-knights-armory',
    type: 'Items',
    title: 'The Knight\'s Armory',
    description: 'A full set of armor and weapons for a valiant knight.',
    emoji: '🛡️',
    color: 'border-violet-500',
    assets: {
      markets: [createMarket({ id: 'market-knights', title: 'The Knight\'s Armory', description: 'Fine steel for the kingdom\'s defenders.' })],
      gameAssets: [
        createGameAsset({ name: 'Steel Helm', icon: '⛑️', description: 'A protective steel helmet.', url: 'https://placehold.co/150/9ca3af/FFFFFF?text=Helm', category: 'Avatar', avatarSlot: 'hat', costGroups: [[{ rewardTypeId: 'core-gold', amount: 50 }]], marketIds: ['market-knights'] }),
        createGameAsset({ name: 'Steel Chestplate', icon: '🛡️', description: 'A sturdy steel chestplate.', url: 'https://placehold.co/150/6b7280/FFFFFF?text=Plate', category: 'Avatar', avatarSlot: 'shirt', costGroups: [[{ rewardTypeId: 'core-gold', amount: 80 }]], marketIds: ['market-knights'] }),
        createGameAsset({ name: 'Steel Gauntlets', icon: '🧤', description: 'Protective steel gloves.', url: 'https://placehold.co/150/4b5563/FFFFFF?text=Gauntlets', category: 'Avatar', avatarSlot: 'hands', costGroups: [[{ rewardTypeId: 'core-gold', amount: 30 }]], marketIds: ['market-knights'] }),
        createGameAsset({ name: 'Steel Greaves', icon: '🦵', description: 'Protective steel leg armor.', url: 'https://placehold.co/150/374151/FFFFFF?text=Greaves', category: 'Avatar', avatarSlot: 'legs', costGroups: [[{ rewardTypeId: 'core-gold', amount: 40 }]], marketIds: ['market-knights'] }),
        createGameAsset({ name: 'Knight\'s Longsword', icon: '⚔️', description: 'A sharp and reliable longsword.', url: 'https://placehold.co/150/d1d5db/FFFFFF?text=Sword', category: 'Avatar', avatarSlot: 'hand-right', costGroups: [[{ rewardTypeId: 'core-gold', amount: 100 }]], marketIds: ['market-knights'] }),
        createGameAsset({ name: 'Kite Shield', icon: '🛡️', description: 'A classic shield for defense.', url: 'https://placehold.co/150/e5e7eb/FFFFFF?text=Shield', category: 'Avatar', avatarSlot: 'hand-left', costGroups: [[{ rewardTypeId: 'core-gold', amount: 70 }]], marketIds: ['market-knights'] }),
      ]
    }
  },
  {
    id: 'pack-wizards-workshop',
    type: 'Items',
    title: 'The Wizard\'s Workshop',
    description: 'Mystical robes and implements for the aspiring spellcaster.',
    emoji: '🧙',
    color: 'border-violet-500',
    assets: {
      markets: [createMarket({ id: 'market-wizards', title: 'The Wizard\'s Workshop', description: 'Arcane artifacts and enchanted apparel.' })],
      gameAssets: [
        createGameAsset({ name: 'Wizard Hat', icon: '🧙', description: 'A tall, pointy hat brimming with magic.', url: 'https://placehold.co/150/5b21b6/FFFFFF?text=Hat', category: 'Avatar', avatarSlot: 'hat', costGroups: [[{ rewardTypeId: 'core-gold', amount: 45 }]], marketIds: ['market-wizards'] }),
        createGameAsset({ name: 'Starry Robes', icon: '✨', description: 'Robes embroidered with celestial patterns.', url: 'https://placehold.co/150/4c1d95/FFFFFF?text=Robes', category: 'Avatar', avatarSlot: 'shirt', costGroups: [[{ rewardTypeId: 'core-gold', amount: 70 }]], marketIds: ['market-wizards'] }),
        createGameAsset({ name: 'Crystal Staff', icon: '🔮', description: 'A staff topped with a glowing crystal.', url: 'https://placehold.co/150/a78bfa/FFFFFF?text=Staff', category: 'Avatar', avatarSlot: 'hand-right', costGroups: [[{ rewardTypeId: 'core-gold', amount: 120 }]], marketIds: ['market-wizards'] }),
        createGameAsset({ name: 'Spellbook', icon: '📖', description: 'A heavy tome filled with ancient spells.', url: 'https://placehold.co/150/7c3aed/FFFFFF?text=Book', category: 'Avatar', avatarSlot: 'hand-left', costGroups: [[{ rewardTypeId: 'core-gold', amount: 60 }]], marketIds: ['market-wizards'] }),
      ]
    }
  },
  {
    id: 'pack-rogues-den',
    type: 'Items',
    title: 'The Rogue\'s Den',
    description: 'Gear for the silent and swift rogue.',
    emoji: '🔪',
    color: 'border-violet-500',
    assets: {
      markets: [createMarket({ id: 'market-rogues', title: 'The Rogue\'s Den', description: 'Tools for those who prefer the shadows.' })],
      gameAssets: [
        createGameAsset({ name: 'Shadow Cowl', icon: '👤', description: 'A dark hood that conceals your identity.', url: 'https://placehold.co/150/171717/FFFFFF?text=Cowl', category: 'Avatar', avatarSlot: 'hat', costGroups: [[{ rewardTypeId: 'core-gold', amount: 40 }]], marketIds: ['market-rogues'] }),
        createGameAsset({ name: 'Leather Jerkin', icon: '🧥', description: 'Light and flexible leather armor.', url: 'https://placehold.co/150/44403c/FFFFFF?text=Jerkin', category: 'Avatar', avatarSlot: 'shirt', costGroups: [[{ rewardTypeId: 'core-gold', amount: 60 }]], marketIds: ['market-rogues'] }),
        createGameAsset({ name: 'Twin Daggers', icon: '🔪', description: 'A pair of perfectly balanced daggers.', url: 'https://placehold.co/150/a8a29e/FFFFFF?text=Daggers', category: 'Avatar', avatarSlot: 'hands', costGroups: [[{ rewardTypeId: 'core-gold', amount: 90 }]], marketIds: ['market-rogues'] }),
        createGameAsset({ name: 'Thieves\' Tools', icon: '🔧', description: 'A set of lockpicks and other useful devices.', url: 'https://placehold.co/150/78716c/FFFFFF?text=Tools', category: 'Tool', costGroups: [[{ rewardTypeId: 'core-gold', amount: 150 }]], marketIds: ['market-rogues'], requiresApproval: true }),
        createGameAsset({ name: 'Grappling Hook', icon: '🪝', description: 'For reaching high places.', url: 'https://placehold.co/150/57534e/FFFFFF?text=Hook', category: 'Tool', costGroups: [[{ rewardTypeId: 'core-gold', amount: 75 }]], marketIds: ['market-rogues'] }),
      ]
    }
  },
  {
    id: 'pack-sci-fi-explorer',
    type: 'Items',
    title: 'The Sci-Fi Explorer',
    description: 'Futuristic gear for exploring the final frontier.',
    emoji: '🚀',
    color: 'border-violet-500',
    assets: {
      markets: [createMarket({ id: 'market-scifi', title: 'Starship Outfitters', description: 'Gear for the modern spacefarer.' })],
      gameAssets: [
        createGameAsset({ name: 'Explorer Helmet', icon: '🪖', description: 'A helmet with a holographic display.', url: 'https://placehold.co/150/e0e7ff/000000?text=Helm', category: 'Avatar', avatarSlot: 'hat', costGroups: [[{ rewardTypeId: 'core-gold', amount: 60 }]], marketIds: ['market-scifi'] }),
        createGameAsset({ name: 'Jumpsuit', icon: '👨‍🚀', description: 'A sleek, form-fitting exploration suit.', url: 'https://placehold.co/150/3730a3/FFFFFF?text=Suit', category: 'Avatar', avatarSlot: 'shirt', costGroups: [[{ rewardTypeId: 'core-gold', amount: 75 }]], marketIds: ['market-scifi'] }),
        createGameAsset({ name: 'Laser Pistol', icon: '🔫', description: 'A reliable sidearm for dangerous planets.', url: 'https://placehold.co/150/ef4444/FFFFFF?text=Laser', category: 'Avatar', avatarSlot: 'hand-right', costGroups: [[{ rewardTypeId: 'core-gold', amount: 110 }]], marketIds: ['market-scifi'] }),
        createGameAsset({ name: 'Scanner', icon: '📡', description: 'A handheld device for analyzing lifeforms.', url: 'https://placehold.co/150/3b82f6/FFFFFF?text=Scan', category: 'Avatar', avatarSlot: 'hand-left', costGroups: [[{ rewardTypeId: 'core-gold', amount: 50 }]], marketIds: ['market-scifi'] }),
      ]
    }
  },
  {
    id: 'pack-pet-companions',
    type: 'Items',
    title: 'Pet Companions',
    description: 'Loyal pets to accompany you on your adventures.',
    emoji: '🐕',
    color: 'border-violet-500',
    assets: {
      markets: [createMarket({ id: 'market-pets', title: 'The Menagerie', description: 'Find a loyal friend to join you.' })],
      gameAssets: [
        createGameAsset({ name: 'Baby Dragon', icon: '🐉', description: 'A tiny dragon that sits on your shoulder.', url: 'https://placehold.co/150/dc2626/FFFFFF?text=Dragon', category: 'Avatar', avatarSlot: 'pet', costGroups: [[{ rewardTypeId: 'core-gems', amount: 200 }]], marketIds: ['market-pets'] }),
        createGameAsset({ name: 'Wise Owl', icon: '🦉', description: 'A knowledgeable owl companion.', url: 'https://placehold.co/150/a16207/FFFFFF?text=Owl', category: 'Avatar', avatarSlot: 'pet', costGroups: [[{ rewardTypeId: 'core-gems', amount: 150 }]], marketIds: ['market-pets'] }),
        createGameAsset({ name: 'Floating Sprite', icon: '🧚', description: 'A small, glowing fairy that flits around you.', url: 'https://placehold.co/150/d946ef/FFFFFF?text=Sprite', category: 'Avatar', avatarSlot: 'pet', costGroups: [[{ rewardTypeId: 'core-gems', amount: 120 }]], marketIds: ['market-pets'] }),
        createGameAsset({ name: 'Loyal Wolf Pup', icon: '🐺', description: 'A brave wolf pup that follows at your heels.', url: 'https://placehold.co/150/a8a29e/FFFFFF?text=Wolf', category: 'Avatar', avatarSlot: 'pet', costGroups: [[{ rewardTypeId: 'core-gems', amount: 180 }]], marketIds: ['market-pets'] }),
        createGameAsset({ name: 'Miniature Griffin', icon: '🦅', description: 'A proud and noble griffin, but smol.', url: 'https://placehold.co/150/f59e0b/000000?text=Griffin', category: 'Avatar', avatarSlot: 'pet', costGroups: [[{ rewardTypeId: 'core-gems', amount: 250 }]], marketIds: ['market-pets'] }),
      ]
    }
  },
  {
    id: 'pack-fun-vouchers',
    type: 'Items',
    title: 'Family Fun Night Picks',
    description: 'Vouchers for choosing the next family activity.',
    emoji: '🎲',
    color: 'border-violet-500',
    assets: {
      markets: [createMarket({ id: 'market-fun', title: 'The Fun Emporium', description: 'Redeem points for family fun!' })],
      gameAssets: [
        createGameAsset({ name: 'Board Game Choice', icon: '🎲', description: 'You pick the next board game for family game night.', url: 'https://placehold.co/150/16a34a/FFFFFF?text=Game', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-gems', amount: 50 }]], marketIds: ['market-fun'], requiresApproval: true }),
        createGameAsset({ name: 'Takeout Dinner Choice', icon: '🥡', description: 'You get to pick which restaurant to order takeout from.', url: 'https://placehold.co/150/ea580c/FFFFFF?text=Takeout', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-gems', amount: 80 }]], marketIds: ['market-fun'], requiresApproval: true }),
        createGameAsset({ name: 'Choose the Weekend Activity', icon: '🏞️', description: 'You decide what the family does this weekend (e.g. park, museum, hiking).', url: 'https://placehold.co/150/0891b2/FFFFFF?text=Weekend', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-gems', amount: 150 }]], marketIds: ['market-fun'], requiresApproval: true }),
        createGameAsset({ name: 'Family Baking Session', icon: '🍪', description: 'Choose a recipe and lead a family baking session.', url: 'https://placehold.co/150/d97706/FFFFFF?text=Baking', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-gems', amount: 60 }]], marketIds: ['market-fun'], requiresApproval: true }),
      ]
    }
  },
   {
    id: 'pack-screen-time-vouchers',
    type: 'Items',
    title: 'Screen Time Vouchers',
    description: 'Trade your hard-earned crystals for screen time.',
    emoji: '📱',
    color: 'border-violet-500',
    assets: {
      markets: [createMarket({ id: 'market-screentime', title: 'The Crystal Arcade', description: 'Your portal to the digital world.' })],
      gameAssets: [
        createGameAsset({ name: '15 Min Screen Time', icon: '⏳', description: 'A voucher for 15 minutes of screen time.', url: 'https://placehold.co/150/8b5cf6/FFFFFF?text=15m', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-crystal', amount: 25 }]], marketIds: ['market-screentime'] }),
        createGameAsset({ name: '30 Min Screen Time', icon: '⌛', description: 'A voucher for 30 minutes of screen time.', url: 'https://placehold.co/150/7c3aed/FFFFFF?text=30m', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-crystal', amount: 45 }]], marketIds: ['market-screentime'] }),
        createGameAsset({ name: '1 Hour Screen Time', icon: '⏰', description: 'A voucher for a full hour of screen time.', url: 'https://placehold.co/150/6d28d9/FFFFFF?text=1hr', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-crystal', amount: 80 }]], marketIds: ['market-screentime'] }),
      ]
    }
  },
  {
    id: 'pack-sweet-treats',
    type: 'Items',
    title: 'Sweet Treats',
    description: 'A collection of delicious candy and dessert rewards.',
    emoji: '🍬',
    color: 'border-violet-500',
    assets: {
      markets: [createMarket({ id: 'market-sweets', title: 'The Candy Shop', description: 'A sweet reward for a job well done.' })],
      gameAssets: [
        createGameAsset({ name: 'Gummy Bears', icon: '🐻', description: 'A small bag of gummy bears.', url: 'https://placehold.co/150/f59e0b/FFFFFF?text=Gummies', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-crystal', amount: 20 }]], marketIds: ['market-sweets'] }),
        createGameAsset({ name: 'Ice Cream Cone', icon: '🍦', description: 'A voucher for a single scoop of ice cream.', url: 'https://placehold.co/150/ec4899/FFFFFF?text=Ice+Cream', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-crystal', amount: 50 }]], marketIds: ['market-sweets'], requiresApproval: true }),
        createGameAsset({ name: 'Chocolate Coin', icon: '🪙', description: 'A single, delicious chocolate coin.', url: 'https://placehold.co/150/ca8a04/FFFFFF?text=Coin', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-crystal', amount: 10 }]], marketIds: ['market-sweets'] }),
        createGameAsset({ name: 'Bag of Sour Candies', icon: '🍬', description: 'A puckeringly-good bag of sour candies.', url: 'https://placehold.co/150/84cc16/FFFFFF?text=Sours', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-crystal', amount: 25 }]], marketIds: ['market-sweets'] }),
        createGameAsset({ name: 'Slice of Cake', icon: '🍰', description: 'A voucher for one slice of your favorite cake.', url: 'https://placehold.co/150/f472b6/FFFFFF?text=Cake', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-crystal', amount: 60 }]], marketIds: ['market-sweets'], requiresApproval: true }),
      ]
    }
  },
  {
    id: 'pack-elemental-orbs',
    type: 'Items',
    title: 'Elemental Orbs',
    description: 'Magical orbs that can be exchanged for XP.',
    emoji: '✨',
    color: 'border-violet-500',
    assets: {
      markets: [createMarket({ id: 'market-orbs', title: 'The Alchemist\'s Hut', description: 'Transmute powerful orbs into experience.' })],
      gameAssets: [
        createGameAsset({ name: 'Orb of Strength', icon: '🔥', description: 'Crush this orb to gain Strength XP.', url: 'https://placehold.co/150/b91c1c/FFFFFF?text=Strength', category: 'Consumable', costGroups: [[{ rewardTypeId: 'core-gold', amount: 10 }]], payouts: [{ rewardTypeId: 'core-strength', amount: 100 }], marketIds: ['market-orbs'] }),
        createGameAsset({ name: 'Orb of Wisdom', icon: '💧', description: 'Gaze into this orb to gain Wisdom XP.', url: 'https://placehold.co/150/2563eb/FFFFFF?text=Wisdom', category: 'Consumable', costGroups: [[{ rewardTypeId: 'core-gold', amount: 10 }]], payouts: [{ rewardTypeId: 'core-wisdom', amount: 100 }], marketIds: ['market-orbs'] }),
        createGameAsset({ name: 'Orb of Creativity', icon: '✨', description: 'This swirling orb inspires you, granting Creativity XP.', url: 'https://placehold.co/150/db2777/FFFFFF?text=Creativity', category: 'Consumable', costGroups: [[{ rewardTypeId: 'core-gold', amount: 10 }]], payouts: [{ rewardTypeId: 'core-creative', amount: 100 }], marketIds: ['market-orbs'] }),
      ]
    }
  },
   { id: 'pack-pirate-bounty', type: 'Items', title: 'Pirate\'s Bounty', description: 'Swashbuckling gear for a high-seas adventurer.', emoji: '🏴‍☠️', color: 'border-violet-500', assets: {
        markets: [createMarket({id: 'market-pirate-bounty', title: 'The Salty Siren', description: 'Treasures from the seven seas.'})],
        gameAssets: [
            createGameAsset({ name: 'Tricorn Hat', icon: '🎩', description: 'A classic pirate captain\'s hat.', url: 'https://placehold.co/150/1e293b/FFFFFF?text=Hat', category: 'Avatar', avatarSlot: 'hat', costGroups: [[{rewardTypeId: 'core-gold', amount: 40}]], marketIds: ['market-pirate-bounty'] }),
            createGameAsset({ name: 'Eyepatch', icon: '👁️', description: 'A mysterious eyepatch. What\'s underneath?', url: 'https://placehold.co/150/0f172a/FFFFFF?text=Patch', category: 'Avatar', avatarSlot: 'face', costGroups: [[{rewardTypeId: 'core-gold', amount: 15}]], marketIds: ['market-pirate-bounty'] }),
            createGameAsset({ name: 'Cutlass', icon: '⚔️', description: 'A curved sword, perfect for ship-to-ship combat.', url: 'https://placehold.co/150/94a3b8/FFFFFF?text=Cutlass', category: 'Avatar', avatarSlot: 'hand-right', costGroups: [[{rewardTypeId: 'core-gold', amount: 80}]], marketIds: ['market-pirate-bounty'] }),
            createGameAsset({ name: 'Parrot Companion', icon: '🦜', description: 'A colorful parrot to sit on your shoulder.', url: 'https://placehold.co/150/16a34a/FFFFFF?text=Parrot', category: 'Avatar', avatarSlot: 'pet', costGroups: [[{rewardTypeId: 'core-gems', amount: 150}]], marketIds: ['market-pirate-bounty'] }),
        ]
    } },
   { id: 'pack-ninja-scrolls', type: 'Items', title: 'Ninja Scrolls', description: 'Secretive tools and garb for the aspiring shinobi.', emoji: '🥷', color: 'border-violet-500', assets: {
        markets: [createMarket({id: 'market-ninja-scrolls', title: 'The Silent Shadow Bazaar', description: 'Tools for those who walk unseen.'})],
        gameAssets: [
            createGameAsset({ name: 'Ninja Mask', icon: '🥷', description: 'A mask to conceal your identity.', url: 'https://placehold.co/150/171717/FFFFFF?text=Mask', category: 'Avatar', avatarSlot: 'face', costGroups: [[{rewardTypeId: 'core-gold', amount: 35}]], marketIds: ['market-ninja-scrolls'] }),
            createGameAsset({ name: 'Katana', icon: '🗡️', description: 'A swift and silent blade.', url: 'https://placehold.co/150/e5e7eb/FFFFFF?text=Katana', category: 'Avatar', avatarSlot: 'hand-right', costGroups: [[{rewardTypeId: 'core-gold', amount: 120}]], marketIds: ['market-ninja-scrolls'] }),
            createGameAsset({ name: 'Shuriken', icon: '🌟', description: 'A set of throwing stars. For display only!', url: 'https://placehold.co/150/737373/FFFFFF?text=Shuriken', category: 'Avatar', avatarSlot: 'hand-left', costGroups: [[{rewardTypeId: 'core-gold', amount: 50}]], marketIds: ['market-ninja-scrolls'] }),
            createGameAsset({ name: 'Smoke Bomb', icon: '💨', description: 'Allows for a stylish, smoke-filled escape.', url: 'https://placehold.co/150/a1a1aa/FFFFFF?text=Smoke', category: 'Consumable', isForSale: false, costGroups: [[{rewardTypeId: 'core-gold', amount: 20}]], marketIds: ['market-ninja-scrolls'] }),
        ]
    } },
   { id: 'pack-viking-hoard', type: 'Items', title: 'Viking Hoard', description: 'Rugged armor and axes for the northern warrior.', emoji: '🪓', color: 'border-violet-500', assets: {
        markets: [createMarket({id: 'market-viking-hoard', title: 'The Great Mead Hall', description: 'Gear for the raiders of the north.'})],
        gameAssets: [
            createGameAsset({ name: 'Horned Helm', icon: '🪖', description: 'A historically inaccurate but awesome horned helmet.', url: 'https://placehold.co/150/facc15/000000?text=Helm', category: 'Avatar', avatarSlot: 'hat', costGroups: [[{rewardTypeId: 'core-gold', amount: 60}]], marketIds: ['market-viking-hoard'] }),
            createGameAsset({ name: 'Bearded Axe', icon: '🪓', description: 'A mighty axe for mighty warriors.', url: 'https://placehold.co/150/a8a29e/FFFFFF?text=Axe', category: 'Avatar', avatarSlot: 'hand-right', costGroups: [[{rewardTypeId: 'core-gold', amount: 95}]], marketIds: ['market-viking-hoard'] }),
            createGameAsset({ name: 'Viking Shield', icon: '🛡️', description: 'A round shield for fending off blows.', url: 'https://placehold.co/150/b91c1c/FFFFFF?text=Shield', category: 'Avatar', avatarSlot: 'hand-left', costGroups: [[{rewardTypeId: 'core-gold', amount: 70}]], marketIds: ['market-viking-hoard'] }),
            createGameAsset({ name: 'Fur Cloak', icon: '🧥', description: 'A warm cloak made from the finest furs.', url: 'https://placehold.co/150/78350f/FFFFFF?text=Cloak', category: 'Avatar', avatarSlot: 'back', costGroups: [[{rewardTypeId: 'core-gold', amount: 55}]], marketIds: ['market-viking-hoard'] }),
        ]
    } },
   { id: 'pack-royal-regalia', type: 'Items', title: 'Royal Regalia', description: 'Crowns, scepters, and fine clothes for royalty.', emoji: '👑', color: 'border-violet-500', assets: {
        markets: [createMarket({id: 'market-royal-regalia', title: 'The Gilded Palace', description: 'Items fit for a king or queen.'})],
        gameAssets: [
            createGameAsset({ name: 'Royal Crown', icon: '👑', description: 'A crown of pure gold, beset with jewels.', url: 'https://placehold.co/150/fde047/000000?text=Crown', category: 'Avatar', avatarSlot: 'hat', costGroups: [[{rewardTypeId: 'core-gems', amount: 500}]], marketIds: ['market-royal-regalia'] }),
            createGameAsset({ name: 'Scepter of Power', icon: '🔱', description: 'A symbol of your authority over the realm.', url: 'https://placehold.co/150/facc15/000000?text=Scepter', category: 'Avatar', avatarSlot: 'hand-right', costGroups: [[{rewardTypeId: 'core-gems', amount: 350}]], marketIds: ['market-royal-regalia'] }),
            createGameAsset({ name: 'Ermine Mantle', icon: '🧥', description: 'A luxurious cloak of white fur.', url: 'https://placehold.co/150/f1f5f9/000000?text=Mantle', category: 'Avatar', avatarSlot: 'back', costGroups: [[{rewardTypeId: 'core-gold', amount: 200}]], marketIds: ['market-royal-regalia'] }),
            createGameAsset({ name: 'Orb of Command', icon: '🔮', description: 'A crystal ball that shows your dominion.', url: 'https://placehold.co/150/a78bfa/FFFFFF?text=Orb', category: 'Avatar', avatarSlot: 'hand-left', costGroups: [[{rewardTypeId: 'core-gems', amount: 300}]], marketIds: ['market-royal-regalia'] }),
        ]
    } },


  // =================================================================================
  // == TROPHY PACKS =================================================================
  // =================================================================================
  {
    id: 'pack-getting-started-trophies',
    type: 'Trophies',
    title: 'Getting Started Trophies',
    description: 'A set of introductory trophies for new players to achieve.',
    emoji: '🏆',
    color: 'border-amber-500',
    assets: {
      trophies: [
        createTrophy({ name: 'The First Step', description: 'Complete your very first quest.', icon: '🎉', isManual: false, requirements: [{ type: TrophyRequirementType.CompleteQuestType, value: QuestType.Duty, count: 1 }] }),
        createTrophy({ name: 'Venture Forth', description: 'Complete your first Venture.', icon: '🗺️', isManual: false, requirements: [{ type: TrophyRequirementType.CompleteQuestType, value: QuestType.Venture, count: 1 }] }),
        createTrophy({ name: 'Shopkeeper', description: 'Make your first purchase from a market.', icon: '🛍️', isManual: true }),
        createTrophy({ name: 'A New Look', description: 'Equip an avatar item for the first time.', icon: '🧑‍🎤', isManual: true }),
      ]
    }
  },
  {
    id: 'pack-household-hero-trophies',
    type: 'Trophies',
    title: 'Household Hero',
    description: 'Trophies awarded for consistency and excellence in completing chores.',
    emoji: '🦸',
    color: 'border-amber-500',
    assets: {
      trophies: [
        createTrophy({ name: 'Tidy Titan', description: 'Complete 10 "Cleaning" quests.', icon: '✨', isManual: false, requirements: [{ type: TrophyRequirementType.CompleteQuestTag, value: 'Cleaning', count: 10 }] }),
        createTrophy({ name: 'Master of the Mundane', description: 'Complete 50 Duties.', icon: '⚙️', isManual: false, requirements: [{ type: TrophyRequirementType.CompleteQuestType, value: QuestType.Duty, count: 50 }] }),
        createTrophy({ name: 'Kitchen Captain', description: 'Complete 25 quests with the "Kitchen" tag.', icon: '🧑‍🍳', isManual: false, requirements: [{ type: TrophyRequirementType.CompleteQuestTag, value: 'Kitchen', count: 25 }] }),
        createTrophy({ name: 'Yardwork Yarl', description: 'Complete 10 "Yardwork" quests.', icon: '🌳', isManual: false, requirements: [{ type: TrophyRequirementType.CompleteQuestTag, value: 'Yardwork', count: 10 }] }),
      ]
    }
  },
   { id: 'pack-academic-excellence', type: 'Trophies', title: 'Academic Excellence', description: 'Awards for diligence in studies and learning.', emoji: '🎓', color: 'border-amber-500', assets: {
       trophies: [
           createTrophy({name: 'Honor Roll', description: 'For getting straight A\'s on a report card.', icon: '🅰️'}),
           createTrophy({name: 'Perfect Attendance', description: 'For not missing a single day of school.', icon: '🗓️'}),
           createTrophy({name: 'Bookworm', description: 'For reading 25 books in a school year.', icon: '🐛'}),
           createTrophy({name: 'Homework Hero', description: 'Complete homework on time for a full month.', icon: '💯'}),
       ]
   } },
   { id: 'pack-creative-mind', type: 'Trophies', title: 'Creative Mind', description: 'Recognizing achievements in art, music, and writing.', emoji: '🎨', color: 'border-amber-500', assets: {
       trophies: [
            createTrophy({name: 'The Artist', description: 'For creating a masterpiece of art.', icon: '🎨'}),
            createTrophy({name: 'The Bard', description: 'For a wonderful musical performance.', icon: '🎵'}),
            createTrophy({name: 'The Architect', description: 'For building an impressive creation (LEGOs, Minecraft, etc).', icon: '🏰'}),
            createTrophy({name: 'The Director', description: 'For creating and editing a video.', icon: '🎬'}),
       ]
   } },
   { id: 'pack-sportsmanship', type: 'Trophies', title: 'Sportsmanship', description: 'Trophies for teamwork, practice, and athletic achievements.', emoji: '🏅', color: 'border-amber-500', assets: {
       trophies: [
            createTrophy({name: 'Team Player', description: 'For excellent teamwork in a game.', icon: '🏅'}),
            createTrophy({name: 'Personal Best', description: 'For beating your own record.', icon: '📈'}),
            createTrophy({name: 'Tournament Victor', description: 'For winning a tournament.', icon: '🥇'}),
            createTrophy({name: 'Good Sport', description: 'For showing great sportsmanship, win or lose.', icon: '🤝'}),
       ]
   } },
   { id: 'pack-social-butterfly', type: 'Trophies', title: 'Social Butterfly', description: 'Awards for kindness, helping, and family participation.', emoji: '🦋', color: 'border-amber-500', assets: {
       trophies: [
            createTrophy({name: 'The Encourager', description: 'For cheering up a family member who was feeling down.', icon: '🤗'}),
            createTrophy({name: 'The Listener', description: 'For being a great listener when someone needed to talk.', icon: '👂'}),
            createTrophy({name: 'The Giver', description: 'For giving a thoughtful, handmade gift.', icon: '🎁'}),
            createTrophy({name: 'The Collaborator', description: 'For working well on a family project.', icon: '🧑‍🤝‍🧑'}),
       ]
   } },
   { id: 'pack-adventurer-milestones', type: 'Trophies', title: 'Adventurer Milestones', description: 'Major milestones in an adventurer\'s career.', emoji: '🗺️', color: 'border-amber-500', assets: {
       trophies: [
            createTrophy({name: 'Apprentice Adventurer', description: 'Achieve the rank of Apprentice.', icon: '🛠️', isManual: false, requirements: [{ type: TrophyRequirementType.AchieveRank, value: 'rank-3', count: 1 }]}),
            createTrophy({name: 'Quest Completionist (10)', description: 'Complete 10 total quests.', icon: '🔟'}),
            createTrophy({name: 'Gold Hoarder', description: 'Amass 1,000 gold coins.', icon: '💰'}),
            createTrophy({name: 'Level Up!', description: 'Reach Rank 5.', icon: '🌟'}),
       ]
   } },
   { id: 'pack-financial-whiz', type: 'Trophies', title: 'Financial Whiz', description: 'Trophies for saving money and learning financial literacy.', emoji: '💰', color: 'border-amber-500', assets: {
       trophies: [
            createTrophy({name: 'The Penny Pincher', description: 'For saving up your allowance for a big goal.', icon: '🐷'}),
            createTrophy({name: 'Smart Saver', description: 'Save 50% of your earnings for a month.', icon: '💹'}),
            createTrophy({name: 'Budget Boss', description: 'Create and stick to a personal budget for a month.', icon: '📋'}),
       ]
   } },
   { id: 'pack-pet-champion', type: 'Trophies', title: 'Pet Champion', description: 'Awards for excellent care of pets.', emoji: '🐾', color: 'border-amber-500', assets: {
       trophies: [
            createTrophy({name: 'The Pet Pal', description: 'For taking excellent care of a pet.', icon: '🐾'}),
            createTrophy({name: 'Happy & Healthy', description: 'Remember to feed and water the pets every day for a week.', icon: '❤️'}),
            createTrophy({name: 'The Trainer', description: 'Teach a pet a new trick.', icon: '🎓'}),
       ]
   } },
   { id: 'pack-funny-bone', type: 'Trophies', title: 'Funny Bone Awards', description: 'A collection of humorous, light-hearted achievements.', emoji: '😂', color: 'border-amber-500', assets: {
       trophies: [
            createTrophy({name: 'The Punisher', description: 'For telling an exceptionally great (or terrible) pun.', icon: '😂'}),
            createTrophy({name: 'Klutz of the Week', description: 'For a spectacular, harmless trip or fall.', icon: '🤕'}),
            createTrophy({name: 'The Snorter', description: 'For laughing so hard you snorted.', icon: '🐽'}),
            createTrophy({name: 'The Snackinator', description: 'For impressively finishing a bag of snacks.', icon: '🍿'}),
       ]
   } },

  // =================================================================================
  // == MARKET PACKS =================================================================
  // =================================================================================
  {
    id: 'pack-starter-markets',
    type: 'Markets',
    title: 'Starter Markets',
    description: 'A few essential markets to get your economy going, including a bank and reward board.',
    emoji: '🏪',
    color: 'border-lime-500',
    assets: {
        markets: [
            createMarket({ title: 'The Exchange Post', description: 'Exchange your various currencies and experience points.', icon: '⚖️' }),
            createMarket({ title: 'The Reward Board', description: 'Cash in your points for real rewards!', icon: '🎟️' }),
            createMarket({ title: 'The Adventurer\'s Guild', description: 'Purchase gear and supplies for your quests.', icon: '⚔️' }),
        ]
    }
  },
  { id: 'pack-fantasy-shops', type: 'Markets', title: 'Fantasy Shops', description: 'A collection of classic fantasy-themed shops.', emoji: '🧙', color: 'border-lime-500', assets: {
      markets: [
          createMarket({ title: 'The Dragon\'s Hoard', description: 'A shop for rare and magical items.', icon: '🐲' }),
          createMarket({ title: 'The Dwarven Forge', description: 'The finest weapons and armor.', icon: '🔥' }),
          createMarket({ title: 'The Elven Grove', description: 'Potions, herbs, and natural remedies.', icon: '🌿' }),
      ]
  } },
  { id: 'pack-modern-stores', type: 'Markets', title: 'Modern Stores', description: 'Stores with a modern or everyday theme.', emoji: '🏬', color: 'border-lime-500', assets: {
       markets: [
          createMarket({ title: 'The Tech Hub', description: 'Gadgets, games, and electronics.', icon: '💻' }),
          createMarket({ title: 'The Corner Store', description: 'Snacks, drinks, and everyday essentials.', icon: '🏪' }),
          createMarket({ title: 'The Hobby Shop', description: 'Models, games, and creative supplies.', icon: '🎨' }),
      ]
  } },
  { id: 'pack-sci-fi-terminals', type: 'Markets', title: 'Sci-Fi Terminals', description: 'Futuristic vendors and data terminals.', emoji: '🤖', color: 'border-lime-500', assets: {
       markets: [
          createMarket({ title: 'Starship Requisitions', description: 'Parts and upgrades for your starship.', icon: '🚀' }),
          createMarket({ title: 'Cybernetics Clinic', description: 'Augmentations and cybernetic implants.', icon: '🦾' }),
          createMarket({ title: 'Data Broker', description: 'Information is the most valuable currency.', icon: '🌐' }),
      ]
  } },
  { id: 'pack-nature-stalls', type: 'Markets', title: 'Nature\'s Stalls', description: 'Markets themed around nature, farming, and the outdoors.', emoji: '🌿', color: 'border-lime-500', assets: {
       markets: [
            createMarket({ title: 'The Farmer\'s Market', description: 'Fresh produce and farm goods.', icon: '🧑‍🌾' }),
            createMarket({ title: 'The Herbalist\'s Hut', description: 'Natural remedies and potent potions.', icon: '🌿' }),
            createMarket({ title: 'The Beast Tamer', description: 'Find a new loyal companion.', icon: '🐾' }),
        ]
  } },
  { id: 'pack-services-guilds', type: 'Markets', title: 'Services & Guilds', description: 'Places to buy services or access guild-specific items.', emoji: '🤝', color: 'border-lime-500', assets: {
        markets: [
            createMarket({ title: 'Thieves\' Guild', description: 'Need something... acquired? For a price.', icon: '🤫' }),
            createMarket({ title: 'Mages\' College', description: 'Purchase spells and enchanting services.', icon: '✨' }),
            createMarket({ title: 'Warriors\' Guild', description: 'Hire mercenaries or train your skills.', icon: '⚔️' }),
        ]
  } },
  { id: 'pack-food-vendors', type: 'Markets', title: 'Food & Drink Vendors', description: 'Taverns, bakeries, and candy shops.', emoji: '🍔', color: 'border-lime-500', assets: {
        markets: [
            createMarket({ title: 'The Prancing Pony Tavern', description: 'A cozy place for a hearty meal.', icon: '🍺' }),
            createMarket({ title: 'The Sweet Hearth Bakery', description: 'Delicious breads, cakes, and pastries.', icon: '🥐' }),
            createMarket({ title: 'The Fizzing Cauldron', description: 'Potions, elixirs, and bubbly drinks.', icon: '⚗️' }),
        ]
  } },
  { id: 'pack-seasonal-markets', type: 'Markets', title: 'Seasonal Markets', description: 'Markets for holidays like Halloween or Christmas.', emoji: '🎃', color: 'border-lime-500', assets: {
        markets: [
            createMarket({ title: 'The Spooky Shack', description: 'Costumes, candy, and creepy decorations.', icon: '🎃' }),
            createMarket({ title: 'The Winter Solstice Market', description: 'Gifts, warm drinks, and festive cheer.', icon: '🎄' }),
        ]
  } },
  { id: 'pack-underground-bazaar', type: 'Markets', title: 'Underground Bazaar', description: 'Mysterious and shady places to find rare goods.', emoji: '🤫', color: 'border-lime-500', assets: {
        markets: [
            createMarket({ title: 'The Black Market', description: 'Don\'t ask where these items came from.', icon: '💀' }),
            createMarket({ title: 'The Smuggler\'s Cove', description: 'Rare goods from distant lands.', icon: '⚓' }),
        ]
  } },
  { id: 'pack-crafting-stations', type: 'Markets', title: 'Crafting Stations', description: 'Workshops for crafting, enchanting, and alchemy.', emoji: '🛠️', color: 'border-lime-500', assets: {
        markets: [
            createMarket({ title: 'The Alchemist\'s Lab', description: 'Brew powerful potions and elixirs.', icon: '⚗️' }),
            createMarket({ title: 'The Blacksmith\'s Forge', description: 'Craft your own weapons and armor.', icon: '🔥' }),
            createMarket({ title: 'The Scribe\'s Desk', description: 'Create magical scrolls and maps.', icon: '📜' }),
        ]
  } },

  // =================================================================================
  // == REWARD PACKS =================================================================
  // =================================================================================
  {
    id: 'pack-expanded-economy',
    type: 'Rewards',
    title: 'Expanded Economy',
    description: 'Adds new currencies and XP types for more complex economic systems.',
    emoji: '💸',
    color: 'border-cyan-500',
    assets: {
        rewardTypes: [
            createReward({ name: 'Reputation', description: 'Points earned for completing guild-specific tasks.', category: RewardCategory.XP, icon: '🌟' }),
            createReward({ name: 'Arcane Dust', description: 'A magical currency for enchanting items.', category: RewardCategory.Currency, icon: '✨' }),
            createReward({ name: 'Crafting Components', description: 'Resources used for building and crafting.', category: RewardCategory.Currency, icon: '🔩' }),
        ]
    }
  },
   { id: 'pack-elemental-xp', type: 'Rewards', title: 'Elemental XP', description: 'XP types based on Fire, Water, Earth, and Air.', emoji: '🔥', color: 'border-cyan-500', assets: {
       rewardTypes: [
            createReward({ name: 'Fire Essence', description: 'XP earned from destructive or passionate tasks.', category: RewardCategory.XP, icon: '🔥' }),
            createReward({ name: 'Water Droplets', description: 'XP earned from cleaning or healing tasks.', category: RewardCategory.XP, icon: '💧' }),
            createReward({ name: 'Earth Runes', description: 'XP earned from building or gardening tasks.', category: RewardCategory.XP, icon: '🌿' }),
            createReward({ name: 'Air Wisps', description: 'XP earned from tasks requiring speed or intellect.', category: RewardCategory.XP, icon: '💨' }),
        ]
   } },
];