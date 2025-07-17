
import { User, Role, RewardTypeDefinition, RewardCategory, Rank, Trophy, TrophyRequirementType, QuestType, Market, Quest, QuestAvailability, Guild, AppSettings, SidebarConfigItem, GameAsset, ThemeDefinition, ThemeStyle, QuestCompletion, QuestCompletionStatus } from '../types';

// Helper function to create quests with default values, moved here to resolve scope issues.
const createQuest = (data: Partial<Quest>): Quest => ({
    id: `lib-q-${data.title?.toLowerCase().replace(/ /g, '-')}-${Math.random().toString(36).substring(7)}`,
    title: 'Untitled',
    description: '',
    type: QuestType.Duty,
    icon: '📝',
    tags: [],
    rewards: [],
    lateSetbacks: [],
    incompleteSetbacks: [],
    isActive: true,
    isOptional: false,
    requiresApproval: false,
    availabilityType: QuestAvailability.Daily,
    availabilityCount: null,
    weeklyRecurrenceDays: [],
    monthlyRecurrenceDays: [],
    assignedUserIds: [],
    claimedByUserIds: [],
    dismissals: [],
    todoUserIds: [],
    ...data,
});

export const createMockUsers = (adminUser: User): User[] => {
    const usersData: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>[] = [
        // Gatekeepers
        { firstName: 'Gate', lastName: 'Keeper', username: 'gatekeeper', email: 'gatekeeper@donegeon.com', gameName: 'Gatekeeper', birthday: '1995-08-20', role: Role.Gatekeeper, password: '123456', pin: '1234' },

        // Explorers
        { firstName: 'New', lastName: 'Explorer', username: 'explorer', email: 'explorer@donegeon.com', gameName: 'Explorer', birthday: '2010-04-15', role: Role.Explorer, pin: '1234' },
    ];

    const sampleUsers = usersData.map((u, i) => ({
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
    const explorer = sampleUsers.find(u => u.username === 'explorer');
    if (explorer) {
        explorer.personalPurse = { 'core-gold': 100 };
    }
    
    return [adminUser, ...sampleUsers];
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
  { type: 'link', id: 'Profile', emoji: '👤', isVisible: true, level: 1, role: Role.Explorer },
  { type: 'link', id: 'Collection', emoji: '🎒', isVisible: true, level: 1, role: Role.Explorer },
  { type: 'link', id: 'Themes', emoji: '🎨', isVisible: true, level: 1, role: Role.Explorer },
  { type: 'link', id: 'Guild', emoji: '🏰', isVisible: true, level: 1, role: Role.Explorer, termKey: 'groups' },
  { type: 'link', id: 'Progress', emoji: '📊', isVisible: true, level: 1, role: Role.Explorer },
  { type: 'link', id: 'Trophies', emoji: '🏆', isVisible: true, level: 1, role: Role.Explorer, termKey: 'awards' },
  { type: 'link', id: 'Ranks', emoji: '🎖️', isVisible: true, level: 1, role: Role.Explorer, termKey: 'levels' },
  { type: 'link', id: 'Chronicles', emoji: '📜', isVisible: true, level: 1, role: Role.Explorer, termKey: 'history' },

  // Administration Section
  { type: 'header', id: 'header-admin-content', title: 'Content Management', level: 0, role: Role.DonegeonMaster, isVisible: true },
  { type: 'link', id: 'Manage Quests', emoji: '📜', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'tasks' },
  { type: 'link', id: 'Manage Items', emoji: '⚔️', isVisible: true, level: 1, role: Role.DonegeonMaster },
  { type: 'link', id: 'Manage Markets', emoji: '🛒', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'stores' },
  { type: 'link', id: 'Manage Rewards', emoji: '💎', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'points' },
  { type: 'link', id: 'Manage Ranks', emoji: '🏅', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'levels' },
  { type: 'link', id: 'Manage Trophies', emoji: '🏆', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'awards' },
  { type: 'link', id: 'Theme Editor', emoji: '🎭', isVisible: true, level: 1, role: Role.DonegeonMaster },

  { type: 'header', id: 'header-admin-community', title: 'Manage Guild', level: 0, role: Role.Gatekeeper, isVisible: true },
  { type: 'link', id: 'Approvals', emoji: '✅', isVisible: true, level: 1, role: Role.Gatekeeper },
  { type: 'link', id: 'Manage Users', emoji: '👥', isVisible: true, level: 1, role: Role.DonegeonMaster },
  { type: 'link', id: 'Manage Guilds', emoji: '🏰', isVisible: true, level: 1, role: Role.DonegeonMaster, termKey: 'groups' },

  { type: 'header', id: 'header-admin-system', title: 'System Tools', level: 0, role: Role.DonegeonMaster, isVisible: true },
  { type: 'link', id: 'AI Studio', emoji: '✨', isVisible: true, level: 1, role: Role.DonegeonMaster },
  { type: 'link', id: 'Appearance', emoji: '🖌️', isVisible: true, level: 1, role: Role.DonegeonMaster },
  { type: 'link', id: 'Object Manager', emoji: '🗂️', isVisible: true, level: 1, role: Role.DonegeonMaster },
  { type: 'link', id: 'Asset Manager', emoji: '🖼️', isVisible: true, level: 1, role: Role.DonegeonMaster },
  { type: 'link', id: 'Backup & Import', emoji: '💾', isVisible: true, level: 1, role: Role.DonegeonMaster },
  { type: 'link', id: 'Asset Library', emoji: '📚', isVisible: true, level: 1, role: Role.DonegeonMaster },
  
  { type: 'link', id: 'Settings', emoji: '⚙️', isVisible: true, level: 0, role: Role.DonegeonMaster },

  // Help Section
  { type: 'header', id: 'header-help', title: 'Help', level: 0, role: Role.Explorer, isVisible: true },
  { type: 'link', id: 'About', emoji: 'ℹ️', isVisible: true, level: 1, role: Role.Explorer },
  { type: 'link', id: 'Help Guide', emoji: '❓', isVisible: true, level: 1, role: Role.Explorer },
];

const rawThemes: { [key: string]: Omit<ThemeStyle, ''> } = {
  emerald: { '--font-h1': "'MedievalSharp', cursive", '--font-size-h1': "2.8rem", '--font-p': "'Roboto', sans-serif", '--font-size-p': "1rem", '--font-span': "'Roboto', sans-serif", '--font-size-span': "1rem", '--font-button': "'Roboto', sans-serif", '--font-size-button': "1rem", '--color-bg-primary': "224 71% 4%", '--color-bg-secondary': "224 39% 10%", '--color-bg-tertiary': "240 10% 19%", '--color-text-primary': "240 8% 90%", '--color-text-secondary': "240 6% 65%", '--color-border': "240 6% 30%", '--color-primary-hue': "158", '--color-primary-saturation': "84%", '--color-primary-lightness': "39%", '--color-accent-hue': "158", '--color-accent-saturation': "75%", '--color-accent-lightness': "58%", '--color-accent-light-hue': "158", '--color-accent-light-saturation': "70%", '--color-accent-light-lightness': "45%" },
  rose: { '--font-h1': "'MedievalSharp', cursive", '--font-size-h1': "2.8rem", '--font-p': "'Roboto', sans-serif", '--font-size-p': "1rem", '--font-span': "'Roboto', sans-serif", '--font-size-span': "1rem", '--font-button': "'Roboto', sans-serif", '--font-size-button': "1rem", '--color-bg-primary': "334 27% 10%", '--color-bg-secondary': "334 20% 15%", '--color-bg-tertiary': "334 15% 22%", '--color-text-primary': "346 33% 94%", '--color-text-secondary': "346 20% 70%", '--color-border': "346 15% 40%", '--color-primary-hue': "346", '--color-primary-saturation': "84%", '--color-primary-lightness': "59%", '--color-accent-hue': "346", '--color-accent-saturation': "91%", '--color-accent-lightness': "71%", '--color-accent-light-hue': "346", '--color-accent-light-saturation': "80%", '--color-accent-light-lightness': "60%" },
  sky: { '--font-h1': "'MedievalSharp', cursive", '--font-size-h1': "2.8rem", '--font-p': "'Roboto', sans-serif", '--font-size-p': "1rem", '--font-span': "'Roboto', sans-serif", '--font-size-span': "1rem", '--font-button': "'Roboto', sans-serif", '--font-size-button': "1rem", '--color-bg-primary': "217 33% 12%", '--color-bg-secondary': "217 28% 17%", '--color-bg-tertiary': "217 25% 25%", '--color-text-primary': "210 40% 98%", '--color-text-secondary': "215 25% 75%", '--color-border': "215 20% 40%", '--color-primary-hue': "204", '--color-primary-saturation': "85%", '--color-primary-lightness': "54%", '--color-accent-hue': "202", '--color-accent-saturation': "90%", '--color-accent-lightness': "70%", '--color-accent-light-hue': "202", '--color-accent-light-saturation': "80%", '--color-accent-light-lightness': "60%" },
  sapphire: { '--font-h1': "'MedievalSharp', cursive", '--font-size-h1': "2.8rem", '--font-p': "'Roboto', sans-serif", '--font-size-p': "1rem", '--font-span': "'Roboto', sans-serif", '--font-size-span': "1rem", '--font-button': "'Roboto', sans-serif", '--font-size-button': "1rem", '--color-bg-primary': "217 33% 12%", '--color-bg-secondary': "217 28% 17%", '--color-bg-tertiary': "217 25% 25%", '--color-text-primary': "210 40% 98%", '--color-text-secondary': "215 25% 75%", '--color-border': "215 20% 40%", '--color-primary-hue': "217", '--color-primary-saturation': "90%", '--color-primary-lightness': "61%", '--color-accent-hue': "217", '--color-accent-saturation': "85%", '--color-accent-lightness': "75%", '--color-accent-light-hue': "217", '--color-accent-light-saturation': "95%", '--color-accent-light-lightness': "85%" },
  arcane: { '--font-h1': "'Uncial Antiqua', cursive", '--font-size-h1': "2.8rem", '--font-p': "'Roboto', sans-serif", '--font-size-p': "1rem", '--font-span': "'Roboto', sans-serif", '--font-size-span': "1rem", '--font-button': "'Roboto', sans-serif", '--font-size-button': "1rem", '--color-bg-primary': "265 39% 12%", '--color-bg-secondary': "265 30% 18%", '--color-bg-tertiary': "265 25% 25%", '--color-text-primary': "271 67% 93%", '--color-text-secondary': "271 25% 75%", '--color-border': "271 20% 45%", '--color-primary-hue': "265", '--color-primary-saturation': "60%", '--color-primary-lightness': "55%", '--color-accent-hue': "265", '--color-accent-saturation': "70%", '--color-accent-lightness': "75%", '--color-accent-light-hue': "45", '--color-accent-light-saturation': "80%", '--color-accent-light-lightness': "65%" },
  cartoon: { '--font-h1': "'Comic Neue', cursive", '--font-size-h1': "2.8rem", '--font-p': "'Comic Neue', cursive", '--font-size-p': "1rem", '--font-span': "'Comic Neue', cursive", '--font-size-span': "1rem", '--font-button': "'Comic Neue', cursive", '--font-size-button': "1rem", '--color-bg-primary': "214 53% 15%", '--color-bg-secondary': "214 43% 22%", '--color-bg-tertiary': "214 35% 30%", '--color-text-primary': "0 0% 100%", '--color-text-secondary': "214 15% 80%", '--color-border': "214 25% 45%", '--color-primary-hue': "346", '--color-primary-saturation': "84%", '--color-primary-lightness': "59%", '--color-accent-hue': "45", '--color-accent-saturation': "100%", '--color-accent-lightness': "60%", '--color-accent-light-hue': "195", '--color-accent-light-saturation': "80%", '--color-accent-light-lightness': "70%" },
  inferno: { '--font-h1': "'New Rocker', cursive", '--font-size-h1': "3.0rem", '--font-p': "'Lora', serif", '--font-size-p': "1.05rem", '--font-span': "'Lora', serif", '--font-size-span': "1.05rem", '--font-button': "'Lora', serif", '--font-size-button': "1rem", '--color-bg-primary': "15 80% 5%", '--color-bg-secondary': "15 70% 10%", '--color-bg-tertiary': "15 60% 18%", '--color-text-primary': "30 70% 90%", '--color-text-secondary': "30 40% 70%", '--color-border': "30 30% 40%", '--color-primary-hue': "25", '--color-primary-saturation': "85%", '--color-primary-lightness': "50%", '--color-accent-hue': "50", '--color-accent-saturation': "90%", '--color-accent-lightness': "65%", '--color-accent-light-hue': "55", '--color-accent-light-saturation': "95%", '--color-accent-light-lightness': "75%" }
};

export const INITIAL_THEMES: ThemeDefinition[] = Object.entries(rawThemes).map(([id, styles]) => ({
  id,
  name: id.charAt(0).toUpperCase() + id.slice(1),
  isCustom: false,
  styles: styles as ThemeStyle,
}));


export const INITIAL_SETTINGS: AppSettings = {
  forgivingSetbacks: true,
  vacationMode: {
    enabled: false,
    startDate: undefined,
    endDate: undefined
  },
  questDefaults: {
    requiresApproval: false,
    isOptional: false,
    isActive: true,
  },
  security: {
    requirePinForUsers: true,
    requirePasswordForAdmin: true,
    allowProfileEditing: false,
  },
  sharedMode: {
    enabled: false,
    quickUserSwitchingEnabled: true,
    allowCompletion: false,
    autoExit: true,
    autoExitMinutes: 5,
    userIds: [],
  },
  chat: {
    enabled: true,
    chatEmoji: '💬',
  },
  theme: 'emerald',
  terminology: {
      appName: 'Task Donegeon',
      task: 'Quest', recurringTask: 'Duty', singleTask: 'Venture',
      store: 'Market', history: 'Chronicles', group: 'Guild',
      level: 'Rank', award: 'Trophy', point: 'Reward',
      xp: 'XP', currency: 'Currency', negativePoint: 'Setback',
      tasks: 'Quests', recurringTasks: 'Duties', singleTasks: 'Ventures',
      shoppingCenter: 'Marketplace', stores: 'Markets', groups: 'Guilds',
      levels: 'Ranks', awards: 'Trophies', points: 'Rewards',
      negativePoints: 'Setbacks',
      admin: 'Donegeon Master', moderator: 'Gatekeeper', user: 'Explorer',
  },
  enableAiFeatures: true,
  sidebars: {
    main: INITIAL_MAIN_SIDEBAR_CONFIG,
    dataManagement: [
        { type: 'link', id: 'Object Manager', emoji: '🗂️', isVisible: true, level: 0, role: Role.DonegeonMaster },
        { type: 'link', id: 'Asset Manager', emoji: '🖼️', isVisible: true, level: 0, role: Role.DonegeonMaster },
        { type: 'link', id: 'Backup & Import', emoji: '💾', isVisible: true, level: 0, role: Role.DonegeonMaster },
        { type: 'link', id: 'Asset Library', emoji: '📚', isVisible: true, level: 0, role: Role.DonegeonMaster },
    ]
  }
};


// The rest of this file contains sample data for a first run.

export const INITIAL_TROPHIES: Trophy[] = [
    { id: 'trophy-1', name: 'First Quest Complete', description: 'Awarded for completing your very first quest.', icon: '🎉', isManual: true, requirements: [] },
    { id: 'trophy-2', name: 'Duty Bound', description: 'Complete 10 Duties.', icon: '🛡️', isManual: false, requirements: [{ type: TrophyRequirementType.CompleteQuestType, value: QuestType.Duty, count: 10 }] },
    { id: 'trophy-3', name: 'Venturous Spirit', description: 'Complete 10 Ventures.', icon: '🗺️', isManual: false, requirements: [{ type: TrophyRequirementType.CompleteQuestType, value: QuestType.Venture, count: 10 }] },
    { id: 'trophy-4', name: 'Knighted', description: 'Achieve the rank of Knight.', icon: '⚔️', isManual: false, requirements: [{ type: TrophyRequirementType.AchieveRank, value: 'rank-7', count: 1 }] },
];

export const createThemeAssets = (): GameAsset[] => {
    return INITIAL_THEMES.filter(t => !t.isCustom).map(theme => ({
        id: `theme-asset-${theme.id}`,
        name: `${theme.name} Theme`,
        description: `Unlocks the ${theme.name} theme, a new look for your Donegeon.`,
        url: 'https://placehold.co/150/a855f7/FFFFFF?text=Theme', // Generic placeholder
        icon: '🎨',
        category: 'Theme',
        isForSale: true,
        cost: [{ rewardTypeId: 'core-gold', amount: 100 }], // Standard cost
        marketIds: ['market-themes'],
        purchaseLimit: 1, // Can only buy a theme once
        purchaseCount: 0,
        creatorId: 'system',
        createdAt: new Date().toISOString(),
        linkedThemeId: theme.id,
        avatarSlot: undefined,
    }));
};

export const createSampleMarkets = (): Market[] => [
    { id: 'market-1', title: 'The Adventurer\'s Outfitter', description: 'Basic gear for new heroes.', icon: '👕', guildId: undefined },
    { id: 'market-2', title: 'The Treasury of Fun', description: 'Spend your gems on memorable experiences.', icon: '🎬', guildId: undefined },
    { id: 'market-themes', title: 'The Theme Shoppe', description: 'Purchase new visual themes for your Donegeon!', icon: '🎨', guildId: undefined },
];

export const createSampleGameAssets = (): GameAsset[] => [
    { id: 'asset-1', name: 'Adventurer\'s Tunic', description: 'A simple but sturdy green tunic.', url: 'https://placehold.co/150/166534/FFFFFF?text=Tunic', icon: '👕', category: 'Avatar', avatarSlot: 'shirt', isForSale: true, cost: [{ rewardTypeId: 'core-gold', amount: 50 }], marketIds: ['market-1'], purchaseLimit: null, purchaseCount: 0, creatorId: 'system', createdAt: new Date().toISOString() },
    { id: 'asset-2', name: 'Pointy Wizard Hat', description: 'A classic hat for any aspiring mage.', url: 'https://placehold.co/150/7c3aed/FFFFFF?text=Hat', icon: '🎩', category: 'Avatar', avatarSlot: 'hat', isForSale: true, cost: [{ rewardTypeId: 'core-gold', amount: 75 }], marketIds: ['market-1'], purchaseLimit: null, purchaseCount: 0, creatorId: 'system', createdAt: new Date().toISOString() },
    { id: 'asset-3', name: 'Movie Night Choice', description: 'You get to pick the movie for the next family movie night.', url: 'https://placehold.co/150/f97316/FFFFFF?text=Movie', icon: '🎬', category: 'Real-World Reward', isForSale: true, cost: [{ rewardTypeId: 'core-gems', amount: 100 }], marketIds: ['market-2'], purchaseLimit: 1, purchaseCount: 0, creatorId: 'system', createdAt: new Date().toISOString() },
    { id: 'asset-4', name: 'Pizza Night Feast', description: 'The family will order pizza for dinner tonight!', url: 'https://placehold.co/150/ef4444/FFFFFF?text=Pizza', icon: '🍕', category: 'Real-World Reward', isForSale: true, cost: [{ rewardTypeId: 'core-gems', amount: 200 }], marketIds: ['market-2'], purchaseLimit: null, purchaseCount: 0, creatorId: 'system', createdAt: new Date().toISOString() },
    ...createThemeAssets(),
];

export const createInitialGuilds = (users: User[]): Guild[] => [
    { id: 'guild-1', name: 'The Donegeon', purpose: 'The primary household group.', memberIds: users.map(u => u.id), isDefault: true },
];

export const createSampleQuests = (users: User[]): Quest[] => {
    const tutorialUser = users.find(u => u.username === 'explorer');
    const tutorialGatekeeper = users.find(u => u.username === 'gatekeeper');
    const tutorialAdmin = users.find(u => u.role === Role.DonegeonMaster);

    return [
        // Duty
        createQuest({ icon: '🛏️', title: 'Sunrise Readiness', description: 'Make your bed and ensure your sleeping area is tidy.', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['home', 'morning'], type: QuestType.Duty, availabilityType: QuestAvailability.Daily, assignedUserIds: [] }),
        // Venture
        createQuest({ icon: '🛒', title: 'First Purchase (Tutorial)', description: 'Visit the Marketplace and purchase your first item. You have been given 100 Gold to start.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['tutorial', 'tutorial-explorer'], type: QuestType.Venture, availabilityType: QuestAvailability.Unlimited, assignedUserIds: tutorialUser ? [tutorialUser.id] : [] }),
        // Venture for approval
        createQuest({ icon: '✅', title: 'Approval Process (Tutorial)', description: 'Complete this quest to learn how approvals work. It will need to be approved by a Gatekeeper or Donegeon Master.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['tutorial', 'tutorial-explorer'], type: QuestType.Venture, availabilityType: QuestAvailability.Unlimited, assignedUserIds: tutorialUser ? [tutorialUser.id] : [], requiresApproval: true }),
        // Venture for Gatekeeper
        createQuest({ icon: '🛡️', title: 'First Approval (Tutorial)', description: 'Go to the Approvals page and approve a user\'s pending quest.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['tutorial', 'tutorial-gatekeeper'], type: QuestType.Venture, availabilityType: QuestAvailability.Unlimited, assignedUserIds: tutorialGatekeeper ? [tutorialGatekeeper.id] : [] }),
        // Venture for Admin
        createQuest({ icon: '👑', title: 'First Decree (Tutorial)', description: 'Go to Manage Quests and create a new quest for your group.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['tutorial', 'tutorial-donegeon-master'], type: QuestType.Venture, availabilityType: QuestAvailability.Unlimited, assignedUserIds: tutorialAdmin ? [tutorialAdmin.id] : [] }),
    ];
};

export const createInitialQuestCompletions = (users: User[], quests: Quest[]): QuestCompletion[] => {
    const admin = users.find(u => u.role === Role.DonegeonMaster);
    const quest = quests.find(q => q.title === 'Sunrise Readiness');
    if (!admin || !quest) return [];

    return [{
        id: 'comp-1',
        questId: quest.id,
        userId: admin.id,
        completedAt: new Date().toISOString(),
        status: QuestCompletionStatus.Approved,
        note: 'This is an example of a completed quest.'
    }];
};