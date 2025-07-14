
import { User, Role, RewardTypeDefinition, RewardCategory, Rank, Trophy, TrophyRequirementType, QuestType, Market, Quest, QuestAvailability, Guild, AppSettings, Theme, GameAsset } from '../types';

export const createMockUsers = (): User[] => {
    const users: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes'>[] = [
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
        ownedAssetIds: [],
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

export const createSampleMarkets = (): Market[] => {
    return [
        {
            id: 'market-tailor',
            title: "The Tailor's Shop",
            description: 'Purchase new hairstyles and outfits to customize your avatar.',
            icon: '👕',
        },
        {
            id: 'market-themes',
            title: "Lumina Weaver's Atelier",
            description: "Purchase new visual themes to change the entire look and feel of your Donegeon.",
            icon: '🎨',
        },
        {
            id: 'market-bank',
            title: 'Personal Bank of Donegeon',
            description: 'Exchange your personal currencies here.',
            icon: '🏦',
        },
        {
            id: 'market-exp',
            title: 'Personal Hall of Experiences',
            description: 'Spend your personal Gems on memorable experiences.',
            icon: '🎬',
        },
        {
            id: 'market-guild',
            title: 'The Guild Hall Market',
            description: 'Spend your guild rewards on special items.',
            icon: '🏛️',
            guildId: 'guild-default-1',
        },
        {
            id: 'market-gadget',
            title: "The Gadgeteer's Workshop",
            description: 'Spend your crystals on screen time and digital goods.',
            icon: '🎮',
        },
        {
            id: 'market-treasury',
            title: 'The Treasury of Taste',
            description: 'Spend guild gold on delicious treats for everyone!',
            icon: '🍕',
            guildId: 'guild-default-1',
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
