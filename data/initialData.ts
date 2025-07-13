


import { User, Role, RewardTypeDefinition, RewardCategory, Rank, Trophy, TrophyRequirementType, QuestType, Market, Quest, QuestAvailability, Guild, DigitalAsset, AppSettings, Theme, AvatarAsset } from '../types';

export const createMockUsers = (): User[] => {
    const users: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAvatarAssets' | 'ownedThemes'>[] = [
        { firstName: 'Alistair', lastName: 'Blackwood', username: 'dmaster', email: 'dm@example.com', gameName: 'The Donegeon Master', birthday: '1980-01-01', role: Role.DonegeonMaster, password: 'password123' },
        { firstName: 'Brynn', lastName: 'Stonehand', username: 'brynn', email: 'brynn@example.com', gameName: 'Warden Brynn', birthday: '1995-05-10', role: Role.Gatekeeper, password: 'password123' },
        { firstName: 'Kaelen', lastName: 'Swift', username: 'kaelen', email: 'kaelen@example.com', gameName: 'Swift Shadow', birthday: '1998-09-20', role: Role.Gatekeeper, password: 'password123' },
        { firstName: 'Elara', lastName: 'Meadowlight', username: 'elara', email: 'elara@example.com', gameName: 'Whisperwind', birthday: '2010-03-15', role: Role.Explorer, password: 'password123', pin: '1234' },
        { firstName: 'Ronan', lastName: 'Ironhide', username: 'ronan', email: 'ronan@example.com', gameName: 'The Bull', birthday: '2012-07-22', role: Role.Explorer, password: 'password123' },
        { firstName: 'Lyra', lastName: 'Nightbreeze', username: 'lyra', email: 'lyra@example.com', gameName: 'Starlight', birthday: '2011-11-05', role: Role.Explorer, password: 'password123', pin: '5678' },
        { firstName: 'Finnian', lastName: 'Riverbend', username: 'finn', email: 'finn@example.com', gameName: 'Finn the Agile', birthday: '2013-02-28', role: Role.Explorer, password: 'password123' },
        { firstName: 'Seraphina', lastName: 'Flameheart', username: 'seraphina', email: 'seraphina@example.com', gameName: 'Ember', birthday: '2014-06-12', role: Role.Explorer, password: 'password123' }
    ];

    const initialUsers = users.map((u, i) => ({
        ...u,
        id: `user-${i + 1}`,
        avatar: {},
        ownedAvatarAssets: [] as AvatarAsset[],
        personalPurse: {},
        personalExperience: {},
        guildBalances: {},
        ownedThemes: ['emerald', 'rose', 'sky'] as Theme[],
    }));

    // Add some initial balances for the DM
    const dm = initialUsers.find(u => u.role === Role.DonegeonMaster);
    if (dm) {
        dm.personalPurse = { 'core-gold': 100, 'core-gems': 50 };
        dm.personalExperience = { 'core-wisdom': 50, 'core-strength': 150 };
        dm.avatar = { hair: 'hair-style-1', shirt: 'shirt-blue-simple' };
        dm.ownedAvatarAssets = [
            { slot: 'hair', assetId: 'hair-style-1' },
            { slot: 'hair', assetId: 'hair-style-2' },
            { slot: 'hair', assetId: 'hair-style-3' },
            { slot: 'shirt', assetId: 'shirt-red-simple' },
            { slot: 'shirt', assetId: 'shirt-blue-simple' },
            { slot: 'shirt', assetId: 'shirt-green-simple' },
        ];
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

export const INITIAL_SETTINGS: AppSettings = {
  forgivingSetbacks: false,
  vacationMode: {
    enabled: false,
    startDate: undefined,
    endDate: undefined,
  },
  questDefaults: {
    requiresApproval: false,
    isOptional: false,
    isActive: true,
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
    xp: 'Experience Points',
    currency: 'Currency',
    negativePoint: 'Setback',
    negativePoints: 'Setbacks',
    admin: 'Donegeon Master',
    moderator: 'Gatekeeper',
    user: 'Explorer',
  },
};


export const INITIAL_TROPHIES: Trophy[] = [
    // Automatic Trophies
    { id: 'auto-trophy-1', name: 'Duty Demon', description: 'Complete 10 Duties.', icon: '😈', isManual: false, requirements: [{ type: TrophyRequirementType.CompleteQuestType, value: QuestType.Duty, count: 10, }] },
    { id: 'auto-trophy-2', name: 'Venture Capitalist', description: 'Complete 10 Ventures.', icon: '🚀', isManual: false, requirements: [{ type: TrophyRequirementType.CompleteQuestType, value: QuestType.Venture, count: 10, }] },
    { id: 'auto-trophy-6', name: 'Knighted', description: 'Achieve the rank of Knight.', icon: '🛡️', isManual: false, requirements: [{ type: TrophyRequirementType.AchieveRank, value: 'rank-7', count: 1 }] },
    { id: 'auto-trophy-7', name: 'Grandmaster', description: 'Achieve the rank of Grandmaster.', icon: '⭐', isManual: false, requirements: [{ type: TrophyRequirementType.AchieveRank, value: 'rank-26', count: 1 }] },
    { id: 'auto-trophy-8', name: 'Quest Tycoon', description: 'Complete 50 quests total.', icon: '📈', isManual: false, requirements: [{ type: TrophyRequirementType.CompleteQuestType, value: QuestType.Duty, count: 25 }, { type: TrophyRequirementType.CompleteQuestType, value: QuestType.Venture, count: 25 }] },
    
    // Manual Trophies
    { id: 'manual-trophy-1', name: 'First Quest', description: 'Awarded for completing your very first quest.', icon: '🏆', isManual: true, requirements: [] },
    { id: 'manual-trophy-2', name: 'Act of Kindness', description: 'Awarded for an outstanding act of kindness or helpfulness.', icon: '❤️', isManual: true, requirements: [] },
    { id: 'manual-trophy-3', name: 'Creative Genius', description: 'Awarded for a particularly creative solution or idea.', icon: '💡', isManual: true, requirements: [] },
    { id: 'manual-trophy-4', name: 'Leadership', description: 'Awarded for demonstrating strong leadership qualities.', icon: '👑', isManual: true, requirements: [] },
    { id: 'manual-trophy-5', name: 'Sportsmanship Award', description: 'Awarded for excellent sportsmanship.', icon: '🏅', isManual: true, requirements: [] },
    { id: 'manual-trophy-6', name: 'The Strategist', description: 'Awarded for brilliant planning or strategy.', icon: '♟️', isManual: true, requirements: [] },
    { id: 'manual-trophy-7', name: 'Problem Solver', description: 'Awarded for solving a difficult problem.', icon: '🧩', isManual: true, requirements: [] },
    { id: 'manual-trophy-8', name: 'Fearless Explorer', description: 'Awarded for trying something new and challenging.', icon: '🧭', isManual: true, requirements: [] },
    { id: 'manual-trophy-9', name: 'Master Chef', description: 'Awarded for exceptional cooking or help in the kitchen.', icon: '🧑‍🍳', isManual: true, requirements: [] },
    { id: 'manual-trophy-10', name: 'Green Thumb', description: 'Awarded for excellent work in the garden or with plants.', icon: '🌱', isManual: true, requirements: [] },
];

export const createInitialDigitalAssets = (): DigitalAsset[] => {
    return [
        { id: 'da-hair-1', name: 'Brown Spikes', description: 'A spiky brown hairdo.', slot: 'hair', assetId: 'hair-style-1', cost: [{ rewardTypeId: 'core-gems', amount: 5 }] },
        { id: 'da-hair-2', name: 'Blonde Top', description: 'A stylish blonde look.', slot: 'hair', assetId: 'hair-style-2', cost: [{ rewardTypeId: 'core-gems', amount: 5 }] },
        { id: 'da-hair-3', name: 'Black Spikes', description: 'A cool, spiky black hairstyle.', slot: 'hair', assetId: 'hair-style-3', cost: [{ rewardTypeId: 'core-gems', amount: 5 }] },
        { id: 'da-shirt-1', name: 'Red Tunic', description: 'A simple, heroic red tunic.', slot: 'shirt', assetId: 'shirt-red-simple', cost: [{ rewardTypeId: 'core-gold', amount: 10 }] },
        { id: 'da-shirt-2', name: 'Blue Tunic', description: 'A sturdy blue tunic.', slot: 'shirt', assetId: 'shirt-blue-simple', cost: [{ rewardTypeId: 'core-gold', amount: 10 }] },
        { id: 'da-shirt-3', name: 'Green Tunic', description: "A classic adventurer's green tunic.", slot: 'shirt', assetId: 'shirt-green-simple', cost: [{ rewardTypeId: 'core-gold', amount: 10 }] },
    ];
};

const THEMES: Theme[] = ['emerald', 'rose', 'sky', 'arcane', 'cartoon', 'forest', 'ocean', 'vulcan', 'royal', 'winter', 'sunset', 'cyberpunk', 'steampunk', 'parchment', 'eerie'];

export const createSampleMarkets = (): Market[] => {
    return [
        {
            id: 'market-tailor',
            title: "The Tailor's Shop",
            description: 'Purchase new hairstyles and outfits to customize your avatar.',
            icon: '👕',
            items: [
                { id: 'item-hair-1', title: 'Brown Spikes', description: 'A spiky brown hairdo.', cost: [{ rewardTypeId: 'core-gems', amount: 5 }], payout: [], avatarAssetPayout: { slot: 'hair', assetId: 'hair-style-1'} },
                { id: 'item-hair-2', title: 'Blonde Top', description: 'A stylish blonde look.', cost: [{ rewardTypeId: 'core-gems', amount: 5 }], payout: [], avatarAssetPayout: { slot: 'hair', assetId: 'hair-style-2'} },
                { id: 'item-hair-3', title: 'Black Spikes', description: 'A cool, spiky black hairstyle.', cost: [{ rewardTypeId: 'core-gems', amount: 5 }], payout: [], avatarAssetPayout: { slot: 'hair', assetId: 'hair-style-3'} },
                { id: 'item-shirt-1', title: 'Red Tunic', description: 'A simple, heroic red tunic.', cost: [{ rewardTypeId: 'core-gold', amount: 10 }], payout: [], avatarAssetPayout: { slot: 'shirt', assetId: 'shirt-red-simple'} },
                { id: 'item-shirt-2', title: 'Blue Tunic', description: 'A sturdy blue tunic.', cost: [{ rewardTypeId: 'core-gold', amount: 10 }], payout: [], avatarAssetPayout: { slot: 'shirt', assetId: 'shirt-blue-simple'} },
                { id: 'item-shirt-3', title: 'Green Tunic', description: 'A classic adventurer\'s green tunic.', cost: [{ rewardTypeId: 'core-gold', amount: 10 }], payout: [], avatarAssetPayout: { slot: 'shirt', assetId: 'shirt-green-simple'} },
            ]
        },
        {
            id: 'market-themes',
            title: "Lumina Weaver's Atelier",
            description: "Purchase new visual themes to change the entire look and feel of your Donegeon.",
            icon: '🎨',
            items: THEMES.filter(t => !['emerald', 'rose', 'sky'].includes(t)) // Don't sell the default themes
                .map((theme, index) => ({
                    id: `theme-item-${theme}`,
                    title: `Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`,
                    description: `Unlocks the "${theme}" visual theme for your account.`,
                    cost: [{ rewardTypeId: 'core-gems', amount: 20 + index * 5 }],
                    payout: [],
                    themePayout: theme
                }))
        },
        {
            id: 'market-bank',
            title: 'Personal Bank of Donegeon',
            description: 'Exchange your personal currencies here.',
            icon: '🏦',
            items: [
                { id: 'item-1', title: '1 Gem', description: 'Trade 10 Crystals for 1 Gem.', cost: [{ rewardTypeId: 'core-crystal', amount: 10 }], payout: [{ rewardTypeId: 'core-gems', amount: 1 }] },
                { id: 'item-2', title: '1 Gold Coin', description: 'Trade 5 Gems for 1 Gold Coin.', cost: [{ rewardTypeId: 'core-gems', amount: 5 }], payout: [{ rewardTypeId: 'core-gold', amount: 1 }] },
            ]
        },
        {
            id: 'market-exp',
            title: 'Personal Hall of Experiences',
            description: 'Spend your personal Gems on memorable experiences.',
            icon: '🎬',
            items: [
                { id: 'item-3', title: 'Movie Night', description: 'Pick a movie for the family to watch.', cost: [{ rewardTypeId: 'core-gems', amount: 10 }], payout: [] },
                { id: 'item-4', title: 'Ice Cream Trip', description: 'A special trip to the ice cream parlor.', cost: [{ rewardTypeId: 'core-gems', amount: 20 }], payout: [] },
            ]
        },
        {
            id: 'market-guild',
            title: 'The Guild Hall Market',
            description: 'Spend your guild rewards on special items.',
            icon: '🏛️',
            guildId: 'guild-default-1',
            items: [
                { id: 'item-5', title: 'Guild Banner', description: 'A decorative banner for your profile.', cost: [{ rewardTypeId: 'core-gold', amount: 25 }], payout: []},
            ]
        },
        {
            id: 'market-gadget',
            title: "The Gadgeteer's Workshop",
            description: 'Spend your crystals on screen time and digital goods.',
            icon: '🎮',
            items: [
                { id: 'item-gadget-1', title: '30 Mins Bonus Screen Time', cost: [{ rewardTypeId: 'core-crystal', amount: 50 }], payout: [], description: 'An extra half hour of tablet or TV time.' },
                { id: 'item-gadget-2', title: 'New App/Game (Under $5)', cost: [{ rewardTypeId: 'core-crystal', amount: 250 }], payout: [], description: 'Purchase a new application or game for your device.' },
                { id: 'item-gadget-3', title: 'Co-op Gaming with DM', cost: [{ rewardTypeId: 'core-gems', amount: 15 }], payout: [], description: 'Schedule a 1-hour gaming session with the Donegeon Master.' },
                { id: 'item-gadget-4', title: 'Choose the Weekend Movie', cost: [{ rewardTypeId: 'core-gems', amount: 10 }], payout: [], description: 'You get to pick the movie for family movie night.' },
                { id: 'item-gadget-5', title: 'Late Night Pass (30 Mins)', cost: [{ rewardTypeId: 'core-crystal', amount: 75 }], payout: [], description: 'Stay up 30 minutes past your normal bedtime.' },
            ]
        },
        {
            id: 'market-treasury',
            title: 'The Treasury of Taste',
            description: 'Spend guild gold on delicious treats for everyone!',
            icon: '🍕',
            guildId: 'guild-default-1',
            items: [
                { id: 'item-treasury-1', title: 'Guild Pizza Night', cost: [{ rewardTypeId: 'core-gold', amount: 20 }], payout: [], description: 'The guild orders pizza for dinner.' },
                { id: 'item-treasury-2', title: 'Ice Cream Sundae Bar', cost: [{ rewardTypeId: 'core-gold', amount: 15 }], payout: [], description: 'An epic ice cream sundae bar for dessert.' },
                { id: 'item-treasury-3', title: 'Guild Baking Day', cost: [{ rewardTypeId: 'core-gold', amount: 10 }], payout: [], description: 'Bake cookies or a cake together as a guild.' },
                { id: 'item-treasury-4', title: 'No-Chore Dinner', cost: [{ rewardTypeId: 'core-gold', amount: 30 }], payout: [], description: "The guild gets takeout, and no one has to do dishes." },
                { id: 'item-treasury-5', title: 'Breakfast for Dinner', cost: [{ rewardTypeId: 'core-gold', amount: 12 }], payout: [], description: 'Pancakes and waffles for dinner tonight!' },
            ]
        },
    ];
};

const createBaseQuest = (): Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals' | 'title' | 'description' | 'type' | 'rewards' | 'lateSetbacks' | 'incompleteSetbacks' | 'icon'> => ({
    isActive: true,
    isOptional: false,
    requiresApproval: false,
    availabilityType: QuestAvailability.Daily,
    availabilityCount: null,
    weeklyRecurrenceDays: [],
    monthlyRecurrenceDays: [],
    assignedUserIds: [],
    tags: [],
});

export const createSampleQuests = (): Quest[] => {
    const quests: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>[] = [
        // --- TIMED DAILY DUTIES ---
        { 
            ...createBaseQuest(),
            icon: '🛏️', 
            title: "Morning Room Tidy", 
            description: "Make your bed and put away any clothes on the floor before school.", 
            type: QuestType.Duty, 
            rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], 
            lateSetbacks: [{ rewardTypeId: 'core-crystal', amount: 1 }], 
            incompleteSetbacks: [{ rewardTypeId: 'core-crystal', amount: 3 }], 
            tags: ['chore', 'home', 'daily', 'morning'],
            lateTime: '08:00',
            incompleteTime: '12:00',
        },
        { 
            ...createBaseQuest(), 
            icon: '🎒', 
            title: "Evening Bag Prep", 
            description: "Pack your school bag for tomorrow and place it by the door.", 
            type: QuestType.Duty, 
            rewards: [{ rewardTypeId: 'core-wisdom', amount: 5 }], 
            lateSetbacks: [{ rewardTypeId: 'core-crystal', amount: 2 }], 
            incompleteSetbacks: [], 
            tags: ['chore', 'school', 'daily', 'evening'],
            lateTime: '20:00',
        },

        // --- UNTIMED DUTIES ---
        { ...createBaseQuest(), icon: '🍎', title: "Empty Your Lunchbox", description: "Take out all containers and trash from your lunchbox after school.", type: QuestType.Duty, rewards: [{ rewardTypeId: 'core-crystal', amount: 2 }], lateSetbacks: [], incompleteSetbacks: [], tags: ['chore', 'daily'] },
        { ...createBaseQuest(), icon: '📚', title: "Read for 20 Minutes", description: "Read a book of your choice for at least 20 minutes.", type: QuestType.Duty, rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], lateSetbacks: [], incompleteSetbacks: [], tags: ['learning', 'daily'] },
        
        // --- WEEKLY DUTY ---
        { ...createBaseQuest(), icon: '🌿', title: "Water the Plants", description: "Check and water all the indoor plants.", type: QuestType.Duty, rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], lateSetbacks: [], incompleteSetbacks: [], availabilityType: QuestAvailability.Weekly, weeklyRecurrenceDays: [3, 6], requiresApproval: true, tags: ['chore', 'home', 'weekly'] },

        // --- TIMED VENTURES ---
        { 
            ...createBaseQuest(), 
            icon: '🍁', 
            guildId: 'guild-default-1', 
            title: "The Great Yard Crusade", 
            description: "Work together to rake all the leaves in the front yard before the weekend is over.", 
            type: QuestType.Venture, 
            rewards: [{ rewardTypeId: 'core-strength', amount: 30 }, { rewardTypeId: 'core-gold', amount: 5 }], 
            lateSetbacks: [{ rewardTypeId: 'core-gold', amount: 1 }],
            incompleteSetbacks: [{ rewardTypeId: 'core-gold', amount: 3 }],
            availabilityType: QuestAvailability.Unlimited,
            requiresApproval: true, 
            lateDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Due in 3 days
            incompleteDateTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // Incomplete in 4 days
            tags: ['chore', 'outdoors', 'guild'],
        },
        { 
            ...createBaseQuest(), 
            icon: '🔬',
            title: "Science Fair Project", 
            description: "Finish the research and build the display for the science fair.", 
            type: QuestType.Venture, 
            rewards: [{ rewardTypeId: 'core-wisdom', amount: 50 }, { rewardTypeId: 'core-gems', amount: 10 }], 
            lateSetbacks: [],
            incompleteSetbacks: [{ rewardTypeId: 'core-gems', amount: 5 }],
            availabilityType: QuestAvailability.Unlimited,
            requiresApproval: true, 
            lateDateTime: undefined,
            incompleteDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // Incomplete in 2 weeks
            tags: ['learning', 'school', 'project'],
        },
        
        // --- PRE-FAILED QUESTS FOR DEMO ---
        { 
            ...createBaseQuest(), 
            icon: '📦',
            title: "Sort the Storage Room (INCOMPLETE)", 
            description: "This quest was not completed in time and is now marked incomplete.", 
            type: QuestType.Venture, 
            rewards: [{ rewardTypeId: 'core-diligence', amount: 50 }], 
            lateSetbacks: [],
            incompleteSetbacks: [{ rewardTypeId: 'core-diligence', amount: 10 }],
            availabilityType: QuestAvailability.Unlimited,
            requiresApproval: true, 
            lateDateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Was late 2 days ago
            incompleteDateTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Became incomplete 1 day ago
            tags: ['chore', 'organizing', 'demo'],
        },
         { 
            ...createBaseQuest(),
            icon: '🐶', 
            title: "Walk the Dog (LATE)", 
            description: "This daily quest is now late! Complete it before it's too late.", 
            type: QuestType.Duty, 
            rewards: [{ rewardTypeId: 'core-strength', amount: 5 }], 
            lateSetbacks: [{ rewardTypeId: 'core-crystal', amount: 5 }], 
            incompleteSetbacks: [{ rewardTypeId: 'core-crystal', amount: 10 }], 
            tags: ['chore', 'pet', 'daily', 'demo'],
            lateTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), // Late 2 hours ago
            incompleteTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), // Incomplete in 2 hours
        },
        
        // --- UNTIMED VENTURES ---
        { ...createBaseQuest(), icon: '💌', title: "Write a Thank You Note", description: "Write a thoughtful thank you note to a family member or friend.", type: QuestType.Venture, availabilityType: QuestAvailability.Unlimited, rewards: [{ rewardTypeId: 'core-gems', amount: 5 }], lateSetbacks: [], incompleteSetbacks: [], isOptional: true, tags: ['social', 'kindness'] },
        { ...createBaseQuest(), icon: '🧱', title: "Build a LEGO Masterpiece", description: "Create something amazing out of LEGOs and show it off.", type: QuestType.Venture, availabilityType: QuestAvailability.Unlimited, rewards: [{ rewardTypeId: 'core-creative', amount: 10 }], lateSetbacks: [], incompleteSetbacks: [], requiresApproval: true, tags: ['creative', 'play'] },
        { ...createBaseQuest(), icon: '🎲', guildId: 'guild-default-1', title: "Organize the Game Cabinet", description: "Team up to sort and organize all board games and video games.", type: QuestType.Venture, rewards: [{ rewardTypeId: 'core-diligence', amount: 20 }, { rewardTypeId: 'core-gems', amount: 2 }], lateSetbacks: [], incompleteSetbacks: [], availabilityType: QuestAvailability.Unlimited, tags: ['organizing', 'guild'] },
    ];
    
    return quests.map((q, index) => ({
        ...q,
        id: `quest-sample-${index + 1}`,
        claimedByUserIds: [],
        dismissals: [],
    }));
};

export const createInitialGuilds = (allUsers: User[]): Guild[] => {
    const dm = allUsers.find(u => u.role === Role.DonegeonMaster);
    if (dm) {
        return [{
            id: 'guild-default-1',
            name: `${dm.firstName}'s Guild`,
            purpose: 'The main guild for all adventurers.',
            memberIds: allUsers.map(u => u.id),
            isDefault: true
        }];
    }
    return [];
}