import { User, Role, RewardTypeDefinition, RewardCategory, Rank, Trophy, TrophyRequirementType, QuestType, Market, Quest, QuestAvailability, Guild, AppSettings, SidebarConfigItem, GameAsset, ThemeDefinition, ThemeStyle, QuestCompletion, QuestCompletionStatus, MarketStatus, QuestGroup } from '../types';

export const AI_ASSISTANT: User = {
    id: 'user-ai-assistant',
    firstName: 'Donegeon',
    lastName: 'Sage',
    username: 'ai_sage',
    email: 'sage@donegeon.com',
    gameName: 'Donegeon Sage',
    birthday: '2024-01-01',
    role: Role.DonegeonMaster,
    avatar: {},
    profilePictureUrl: 'https://placehold.co/150/8b5cf6/FFFFFF?text=✨',
    ownedAssetIds: [] as string[],
    pin: '',
    personalPurse: {},
    personalExperience: {},
    guildBalances: {},
    ownedThemes: [],
    hasBeenOnboarded: true,
    isAi: true,
};

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
    const usersData: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>[] = [
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
        ownedAssetIds: [] as string[],
        personalPurse: {},
        personalExperience: {},
        guildBalances: {},
        ownedThemes: ['emerald', 'rose', 'sky'],
        hasBeenOnboarded: false,
    }));

    // Give explorer starting gold for the tutorial quest
    const explorer = initialUsers.find((u: User) => u.username === 'explorer');
    if (explorer) {
        explorer.personalPurse = { 'core-gold': 100 };
    }
    
    initialUsers.push(AI_ASSISTANT);
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

export const createInitialGuilds = (users: User[]): Guild[] => ([
  { id: 'guild-1', name: 'The First Guild', purpose: 'The default guild for all new adventurers.', memberIds: users.map((u: User) => u.id), isDefault: true },
]);

export const createSampleQuests = (users: User[]): Quest[] => {
  const explorer = users.find((u: User) => u.role === Role.Explorer);
  const gatekeeper = users.find((u: User) => u.role === Role.Gatekeeper);
  const donegeonMaster = users.find((u: User) => u.role === Role.DonegeonMaster);

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

export function createInitialData(setupChoice = 'guided', adminUserData?: any, blueprint?: any) {
    let users: User[] = [];
    let baseData;

    if (setupChoice === 'scratch') {
        const adminUser = { ...adminUserData, id: `user-admin-${Date.now()}`, avatar: {}, ownedAssetIds: [], personalPurse: {}, personalExperience: {}, guildBalances: {}, ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: false };
        users.push(adminUser);
        baseData = {
            quests: [],
            questGroups: [],
            markets: createSampleMarkets().filter(m => m.id === 'market-bank'), // Only include bank
            rewardTypes: INITIAL_REWARD_TYPES,
            questCompletions: [],
            purchaseRequests: [],
            guilds: createInitialGuilds(users),
            ranks: INITIAL_RANKS,
            trophies: [],
            userTrophies: [],
            adminAdjustments: [],
            gameAssets: [],
            systemLogs: [],
            settings: INITIAL_SETTINGS,
            themes: INITIAL_THEMES,
            loginHistory: [],
            chatMessages: [],
            systemNotifications: [],
            scheduledEvents: [],
        };
    } else if (setupChoice === 'import' && blueprint) {
        const adminUser = { ...adminUserData, id: `user-admin-${Date.now()}`, avatar: {}, ownedAssetIds: [], personalPurse: {}, personalExperience: {}, guildBalances: {}, ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: false };
        users.push(adminUser);
        const finalRewardTypes = [ ...INITIAL_REWARD_TYPES, ...(blueprint.assets.rewardTypes || []).filter((rt: RewardTypeDefinition) => !INITIAL_REWARD_TYPES.some(coreRt => coreRt.id === rt.id)) ];
        let finalMarkets = blueprint.assets.markets || [];
        if (!finalMarkets.some((m: Market) => m.id === 'market-bank')) {
            const bankMarket = createSampleMarkets().find((m: Market) => m.id === 'market-bank');
            if (bankMarket) finalMarkets.push(bankMarket);
        }
        baseData = {
            ...blueprint.assets,
            rewardTypes: finalRewardTypes,
            markets: finalMarkets,
            guilds: createInitialGuilds(users),
            // Fill in missing empty arrays from blueprint
            questCompletions: [], purchaseRequests: [], userTrophies: [], adminAdjustments: [], systemLogs: [], loginHistory: [], chatMessages: [], systemNotifications: [], scheduledEvents: [],
            settings: INITIAL_SETTINGS,
            themes: INITIAL_THEMES,
        };
    } else { // 'guided'
        users = createMockUsers();
        // Overwrite first mock user with actual admin data
        if (adminUserData) {
            users[0] = { ...users[0], ...adminUserData };
        }
        baseData = {
            quests: createSampleQuests(users),
            questGroups: INITIAL_QUEST_GROUPS,
            markets: createSampleMarkets(),
            rewardTypes: INITIAL_REWARD_TYPES,
            questCompletions: [],
            purchaseRequests: [],
            guilds: createInitialGuilds(users),
            ranks: INITIAL_RANKS,
            trophies: INITIAL_TROPHIES,
            userTrophies: [],
            adminAdjustments: [],
            gameAssets: createSampleGameAssets(),
            systemLogs: [],
            settings: INITIAL_SETTINGS,
            themes: INITIAL_THEMES,
            loginHistory: [],
            chatMessages: [],
            systemNotifications: [],
            scheduledEvents: [],
        };
    }

    // This is the single source of truth for creating the admin user
    const finalAdminUser = users.find(u => u.role === Role.DonegeonMaster);
    if (finalAdminUser && adminUserData) {
        Object.assign(finalAdminUser, adminUserData);
        finalAdminUser.id = `user-admin-${Date.now()}`;
    }

    // Always add the AI assistant
    if (!users.some(u => u.isAi)) {
        users.push(AI_ASSISTANT);
    }

    return {
        ...baseData,
        users, // Use the user array which contains the final admin user and AI
        settings: {
            ...baseData.settings,
            isFirstRunComplete: true, // Always set to true on creation
        }
    };
}

export function createInitialQuestCompletions(quests: Quest[], users: User[]): QuestCompletion[] {
  const explorer = users.find((u: User) => u.username === 'explorer');
  const gatekeeper = users.find((u: User) => u.username === 'gatekeeper');
  
  if (!explorer || !gatekeeper) return [];

  const completion: QuestCompletion = {
    id: `qc-initial-${Date.now()}`,
    questId: 'quest-gatekeeper-approval-setup',
    userId: explorer.id,
    completedAt: new Date().toISOString(),
    status: QuestCompletionStatus.Pending,
    note: 'This is my first note for approval!'
  };

  return [completion];
}
