

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
  enableAiFeatures: false,
};


export const INITIAL_TROPHIES: Trophy[] = [
    // --- Automatic Trophies ---
    { id: 'auto-trophy-1', name: 'Duty Demon', description: 'Complete 10 Duties.', icon: '😈', isManual: false, requirements: [{ type: TrophyRequirementType.CompleteQuestType, value: QuestType.Duty, count: 10, }] },
    { id: 'auto-trophy-2', name: 'Venture Capitalist', description: 'Complete 10 Ventures.', icon: '🚀', isManual: false, requirements: [{ type: TrophyRequirementType.CompleteQuestType, value: QuestType.Venture, count: 10, }] },
    { id: 'auto-trophy-3', name: 'Knighted', description: 'Achieve the rank of Knight.', icon: '🛡️', isManual: false, requirements: [{ type: TrophyRequirementType.AchieveRank, value: 'rank-7', count: 1 }] },
    { id: 'auto-trophy-4', name: 'Grandmaster', description: 'Achieve the rank of Grandmaster.', icon: '⭐', isManual: false, requirements: [{ type: TrophyRequirementType.AchieveRank, value: 'rank-26', count: 1 }] },
    { id: 'auto-trophy-5', name: 'Quest Tycoon', description: 'Complete 50 quests total.', icon: '📈', isManual: false, requirements: [{ type: TrophyRequirementType.CompleteQuestType, value: QuestType.Duty, count: 25 }, { type: TrophyRequirementType.CompleteQuestType, value: QuestType.Venture, count: 25 }] },
    { id: 'auto-trophy-6', name: 'Chore Champion', description: 'Complete 20 quests with the "chore" tag.', icon: '🧼', isManual: false, requirements: [{ type: TrophyRequirementType.CompleteQuestTag, value: 'chore', count: 20 }] },
    { id: 'auto-trophy-7', name: 'Scholar', description: 'Complete 15 quests with the "learning" tag.', icon: '🎓', isManual: false, requirements: [{ type: TrophyRequirementType.CompleteQuestTag, value: 'learning', count: 15 }] },
    { id: 'auto-trophy-8', name: 'Iron Will', description: 'Complete 10 quests with the "fitness" tag.', icon: '🏋️', isManual: false, requirements: [{ type: TrophyRequirementType.CompleteQuestTag, value: 'fitness', count: 10 }] },
    
    // --- Manual Trophies ---
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
    { id: 'manual-trophy-11', name: 'The Diplomat', description: 'For resolving a conflict with grace and wisdom.', icon: '🤝', isManual: true, requirements: [] },
    { id: 'manual-trophy-12', name: 'Tech Whiz', description: 'For skillfully fixing a technical issue.', icon: '💻', isManual: true, requirements: [] },
    { id: 'manual-trophy-13', name: 'Perfect Attendance', description: 'For impeccable reliability and showing up on time.', icon: '🗓️', isManual: true, requirements: [] },
    { id: 'manual-trophy-14', name: 'The Comedian', description: 'For making everyone laugh when they needed it most.', icon: '😂', isManual: true, requirements: [] },
    { id: 'manual-trophy-15', name: 'Master Collaborator', description: 'For being an exceptional team player.', icon: '🧑‍🤝‍🧑', isManual: true, requirements: [] },
    { id: 'manual-trophy-16', name: 'Bug Squasher', description: 'For finding and reporting a bug in the app.', icon: '🐞', isManual: true, requirements: [] },
    { id: 'manual-trophy-17', name: 'The Organizer', description: 'For an impressive feat of tidiness and organization.', icon: '🗂️', isManual: true, requirements: [] },
    { id: 'manual-trophy-18', name: 'Animal Whisperer', description: 'For showing special care to a pet or animal.', icon: '🐾', isManual: true, requirements: [] },
    { id: 'manual-trophy-19', name: 'The Mentor', description: 'For patiently teaching someone a new skill.', icon: '👨‍🏫', isManual: true, requirements: [] },
    { id: 'manual-trophy-20', name: 'Financial Sense', description: 'For making a very wise purchase or saving decision.', icon: '💸', isManual: true, requirements: [] },
    { id: 'manual-trophy-21', name: 'The Builder', description: 'For constructing something amazing, physically or digitally.', icon: '🏗️', isManual: true, requirements: [] },
    { id: 'manual-trophy-22', name: 'Good Neighbor', description: 'For helping a neighbor without being asked.', icon: '🏡', isManual: true, requirements: [] },
    { id: 'manual-trophy-23', name: 'The Artist', description: 'For creating a beautiful piece of art.', icon: '🖼️', isManual: true, requirements: [] },
    { id: 'manual-trophy-24', name: 'The Musician', description: 'For a wonderful musical performance.', icon: '🎵', isManual: true, requirements: [] },
    { id: 'manual-trophy-25', name: 'The Pillar', description: 'For being exceptionally strong during a tough time.', icon: '🏛️', isManual: true, requirements: [] },
];

export const createSampleMarkets = (): Market[] => {
    return [
        { id: 'market-tailor', title: "The Tailor's Shop", description: 'Purchase new hairstyles and outfits to customize your avatar.', icon: '👕' },
        { id: 'market-themes', title: "Lumina Weaver's Atelier", description: "Purchase new visual themes to change the entire look and feel of your Donegeon.", icon: '🎨' },
        { id: 'market-bank', title: 'Personal Bank of Donegeon', description: 'Exchange your personal currencies here.', icon: '🏦' },
        { id: 'market-exp', title: 'Personal Hall of Experiences', description: 'Spend your personal Gems on memorable experiences.', icon: '🎬' },
        { id: 'market-guild', title: 'The Guild Hall Market', description: 'Spend your guild rewards on special items.', icon: '🏛️', guildId: 'guild-default-1' },
        { id: 'market-gadget', title: "The Gadgeteer's Workshop", description: 'Spend your crystals on screen time and digital goods.', icon: '🎮' },
        { id: 'market-treasury', title: 'The Treasury of Taste', description: 'Spend guild gold on delicious treats for everyone!', icon: '🍕', guildId: 'guild-default-1' },
        { id: 'market-blacksmith', title: "The Blacksmith's Forge", description: "Cosmetic tools, weapons, and armor for your avatar.", icon: '⚒️' },
        { id: 'market-menagerie', title: "The Menagerie", description: 'Adopt virtual pets and companions.', icon: '🦄' },
        { id: 'market-alchemist', title: "The Alchemist's Lab", description: "Purchase rare and interesting power-ups (coming soon).", icon: '⚗️' },
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
        { ...createBaseQuest(), icon: '🛏️', title: "Morning Room Tidy", description: "Make your bed and put away any clothes on the floor before school.", type: QuestType.Duty, rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], lateSetbacks: [{ rewardTypeId: 'core-crystal', amount: 1 }], incompleteSetbacks: [{ rewardTypeId: 'core-crystal', amount: 3 }], tags: ['chore', 'home', 'daily', 'morning'], lateTime: '08:00', incompleteTime: '12:00' },
        { ...createBaseQuest(), icon: '🎒', title: "Evening Bag Prep", description: "Pack your school bag for tomorrow and place it by the door.", type: QuestType.Duty, rewards: [{ rewardTypeId: 'core-wisdom', amount: 5 }], lateSetbacks: [{ rewardTypeId: 'core-crystal', amount: 2 }], incompleteSetbacks: [], tags: ['chore', 'school', 'daily', 'evening'], lateTime: '20:00' },

        // --- UNTIMED DUTIES ---
        { ...createBaseQuest(), icon: '🍎', title: "Empty Your Lunchbox", description: "Take out all containers and trash from your lunchbox after school.", type: QuestType.Duty, rewards: [{ rewardTypeId: 'core-crystal', amount: 2 }], lateSetbacks: [], incompleteSetbacks: [], tags: ['chore', 'daily'] },
        { ...createBaseQuest(), icon: '📚', title: "Read for 20 Minutes", description: "Read a book of your choice for at least 20 minutes.", type: QuestType.Duty, rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], lateSetbacks: [], incompleteSetbacks: [], tags: ['learning', 'daily'] },
        { ...createBaseQuest(), icon: '🍽️', title: "Clear Your Dishes", description: "After eating, bring your plate, cup, and utensils to the kitchen.", type: QuestType.Duty, rewards: [{ rewardTypeId: 'core-diligence', amount: 3 }], lateSetbacks: [], incompleteSetbacks: [], tags: ['chore', 'daily', 'kitchen'] },
        { ...createBaseQuest(), icon: '🦷', title: "Brush Your Teeth", description: "Brush your teeth in the morning and evening.", type: QuestType.Duty, rewards: [{ rewardTypeId: 'core-diligence', amount: 2 }], lateSetbacks: [], incompleteSetbacks: [], tags: ['health', 'daily'] },
        { ...createBaseQuest(), icon: '💧', title: "Drink a Full Glass of Water", description: "Stay hydrated by drinking a full glass of water upon waking up.", type: QuestType.Duty, rewards: [{ rewardTypeId: 'core-strength', amount: 1 }], lateSetbacks: [], incompleteSetbacks: [], tags: ['health', 'daily', 'morning'] },
        { ...createBaseQuest(), icon: '👟', title: "Put Away Your Shoes", description: "When you come inside, take off your shoes and put them where they belong.", type: QuestType.Duty, rewards: [{ rewardTypeId: 'core-diligence', amount: 2 }], lateSetbacks: [], incompleteSetbacks: [], tags: ['chore', 'daily'] },
        { ...createBaseQuest(), icon: '🎹', title: "Practice Your Instrument", description: "Practice your musical instrument for 15 minutes.", type: QuestType.Duty, rewards: [{ rewardTypeId: 'core-skill', amount: 15 }], lateSetbacks: [], incompleteSetbacks: [], tags: ['learning', 'daily', 'music'] },
        { ...createBaseQuest(), icon: '🤔', title: "Daily Journal Entry", description: "Write one sentence in your journal about your day.", type: QuestType.Duty, rewards: [{ rewardTypeId: 'core-creative', amount: 5 }], lateSetbacks: [], incompleteSetbacks: [], tags: ['creative', 'daily'] },
        
        // --- WEEKLY DUTIES ---
        { ...createBaseQuest(), icon: '🌿', title: "Water the Plants", description: "Check and water all the indoor plants.", type: QuestType.Duty, rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], lateSetbacks: [], incompleteSetbacks: [], availabilityType: QuestAvailability.Weekly, weeklyRecurrenceDays: [3, 6], requiresApproval: true, tags: ['chore', 'home', 'weekly'] },
        { ...createBaseQuest(), icon: '🗑️', title: "Take Out the Trash & Recycling", description: "Gather all trash and recycling and take it to the curb.", type: QuestType.Duty, rewards: [{ rewardTypeId: 'core-strength', amount: 10 }], lateSetbacks: [], incompleteSetbacks: [], availabilityType: QuestAvailability.Weekly, weeklyRecurrenceDays: [2], guildId: 'guild-default-1', tags: ['chore', 'weekly', 'guild'] },
        { ...createBaseQuest(), icon: '⚽', title: "Attend Sports Practice", description: "Go to your scheduled sports practice and give it your best effort.", type: QuestType.Duty, rewards: [{ rewardTypeId: 'core-skill', amount: 20 }], lateSetbacks: [], incompleteSetbacks: [], availabilityType: QuestAvailability.Weekly, weeklyRecurrenceDays: [1, 4], tags: ['fitness', 'weekly', 'sports'] },
        { ...createBaseQuest(), icon: '🛒', title: "Help with Groceries", description: "Help bring in and put away the groceries.", type: QuestType.Duty, rewards: [{ rewardTypeId: 'core-strength', amount: 5 }], lateSetbacks: [], incompleteSetbacks: [], availabilityType: QuestAvailability.Weekly, weeklyRecurrenceDays: [5], tags: ['chore', 'weekly'] },
        
        // --- TIMED VENTURES ---
        { ...createBaseQuest(), icon: '🍁', guildId: 'guild-default-1', title: "The Great Yard Crusade", description: "Work together to rake all the leaves in the front yard before the weekend is over.", type: QuestType.Venture, rewards: [{ rewardTypeId: 'core-strength', amount: 30 }, { rewardTypeId: 'core-gold', amount: 5 }], lateSetbacks: [{ rewardTypeId: 'core-gold', amount: 1 }], incompleteSetbacks: [{ rewardTypeId: 'core-gold', amount: 3 }], availabilityType: QuestAvailability.Unlimited, requiresApproval: true, lateDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), incompleteDateTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), tags: ['chore', 'outdoors', 'guild'] },
        { ...createBaseQuest(), icon: '🔬', title: "Science Fair Project", description: "Finish the research and build the display for the science fair.", type: QuestType.Venture, rewards: [{ rewardTypeId: 'core-wisdom', amount: 50 }, { rewardTypeId: 'core-gems', amount: 10 }], lateSetbacks: [], incompleteSetbacks: [{ rewardTypeId: 'core-gems', amount: 5 }], availabilityType: QuestAvailability.Unlimited, requiresApproval: true, lateDateTime: undefined, incompleteDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), tags: ['learning', 'school', 'project'] },
        
        // --- PRE-FAILED QUESTS FOR DEMO ---
        { ...createBaseQuest(), icon: '📦', title: "Sort the Storage Room (INCOMPLETE)", description: "This quest was not completed in time and is now marked incomplete.", type: QuestType.Venture, rewards: [{ rewardTypeId: 'core-diligence', amount: 50 }], lateSetbacks: [], incompleteSetbacks: [{ rewardTypeId: 'core-diligence', amount: 10 }], availabilityType: QuestAvailability.Unlimited, requiresApproval: true, lateDateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), incompleteDateTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), tags: ['chore', 'organizing', 'demo'] },
        { ...createBaseQuest(), icon: '🐶', title: "Walk the Dog (LATE)", description: "This daily quest is now late! Complete it before it's too late.", type: QuestType.Duty, rewards: [{ rewardTypeId: 'core-strength', amount: 5 }], lateSetbacks: [{ rewardTypeId: 'core-crystal', amount: 5 }], incompleteSetbacks: [{ rewardTypeId: 'core-crystal', amount: 10 }], tags: ['chore', 'pet', 'daily', 'demo'], lateTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), incompleteTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) },
        
        // --- UNTIMED VENTURES ---
        { ...createBaseQuest(), icon: '💌', title: "Write a Thank You Note", description: "Write a thoughtful thank you note to a family member or friend.", type: QuestType.Venture, availabilityType: QuestAvailability.Unlimited, rewards: [{ rewardTypeId: 'core-gems', amount: 5 }], lateSetbacks: [], incompleteSetbacks: [], isOptional: true, tags: ['social', 'kindness'] },
        { ...createBaseQuest(), icon: '🧱', title: "Build a LEGO Masterpiece", description: "Create something amazing out of LEGOs and show it off.", type: QuestType.Venture, availabilityType: QuestAvailability.Unlimited, rewards: [{ rewardTypeId: 'core-creative', amount: 10 }], lateSetbacks: [], incompleteSetbacks: [], requiresApproval: true, tags: ['creative', 'play'] },
        { ...createBaseQuest(), icon: '🎲', guildId: 'guild-default-1', title: "Organize the Game Cabinet", description: "Team up to sort and organize all board games and video games.", type: QuestType.Venture, rewards: [{ rewardTypeId: 'core-diligence', amount: 20 }, { rewardTypeId: 'core-gems', amount: 2 }], lateSetbacks: [], incompleteSetbacks: [], availabilityType: QuestAvailability.Unlimited, tags: ['organizing', 'guild'] },
        { ...createBaseQuest(), icon: '🚲', title: "Bike Ride Adventure", description: "Go for a 30-minute bike ride around the neighborhood or on a trail.", type: QuestType.Venture, availabilityType: QuestAvailability.Unlimited, rewards: [{ rewardTypeId: 'core-strength', amount: 15 }], lateSetbacks: [], incompleteSetbacks: [], tags: ['fitness', 'outdoors'] },
        { ...createBaseQuest(), icon: '🤝', title: "Help a Sibling", description: "Offer to help a sibling with one of their chores or with their homework.", type: QuestType.Venture, availabilityType: QuestAvailability.Unlimited, rewards: [{ rewardTypeId: 'core-gems', amount: 10 }], lateSetbacks: [], incompleteSetbacks: [], tags: ['social', 'kindness', 'home'] },
        { ...createBaseQuest(), icon: '🧑‍🍳', title: "Cook a Meal", description: "Help plan and cook a meal for the family.", type: QuestType.Venture, rewards: [{ rewardTypeId: 'core-skill', amount: 25 }, { rewardTypeId: 'core-diligence', amount: 10 }], lateSetbacks: [], incompleteSetbacks: [], requiresApproval: true, tags: ['chore', 'home', 'kitchen'] },
        { ...createBaseQuest(), icon: '🧹', title: "Deep Clean Your Room", description: "Do a thorough cleaning of your room: dust, vacuum, and organize.", type: QuestType.Venture, availabilityType: QuestAvailability.Unlimited, rewards: [{ rewardTypeId: 'core-diligence', amount: 40 }], lateSetbacks: [], incompleteSetbacks: [], tags: ['chore', 'organizing'] },
        { ...createBaseQuest(), icon: '🌳', title: "Plant Something", description: "Plant a flower, herb, or vegetable in the garden.", type: QuestType.Venture, availabilityType: QuestAvailability.Unlimited, rewards: [{ rewardTypeId: 'core-creative', amount: 15 }], lateSetbacks: [], incompleteSetbacks: [], tags: ['outdoors', 'creative'] },
        { ...createBaseQuest(), icon: '🗺️', title: "Plan a Family Outing", description: "Research and plan a fun, low-cost outing for the family.", type: QuestType.Venture, availabilityType: QuestAvailability.Unlimited, rewards: [{ rewardTypeId: 'core-wisdom', amount: 20 }], lateSetbacks: [], incompleteSetbacks: [], tags: ['social', 'planning'] },
        { ...createBaseQuest(), icon: '💻', title: "Learn a New Skill Online", description: "Complete a tutorial for a new software, language, or skill (e.g., coding, photo editing).", type: QuestType.Venture, availabilityType: QuestAvailability.Unlimited, rewards: [{ rewardTypeId: 'core-skill', amount: 30 }], lateSetbacks: [], incompleteSetbacks: [], tags: ['learning', 'tech'] },
        { ...createBaseQuest(), icon: '🎨', title: "Create a Piece of Art", description: "Draw, paint, or sculpt a piece of original artwork.", type: QuestType.Venture, availabilityType: QuestAvailability.Unlimited, rewards: [{ rewardTypeId: 'core-creative', amount: 20 }], lateSetbacks: [], incompleteSetbacks: [], requiresApproval: true, tags: ['creative', 'art'] },
        { ...createBaseQuest(), icon: '🏃', title: "Run a 5K", description: "Train for and complete a 5K run.", type: QuestType.Venture, availabilityType: QuestAvailability.Unlimited, rewards: [{ rewardTypeId: 'core-strength', amount: 100 }], lateSetbacks: [], incompleteSetbacks: [], tags: ['fitness', 'milestone'] },
        { ...createBaseQuest(), icon: '🤖', title: "Build a Simple Robot", description: "Use a kit or online guide to build and program a simple robot.", type: QuestType.Venture, availabilityType: QuestAvailability.Unlimited, rewards: [{ rewardTypeId: 'core-skill', amount: 50 }], lateSetbacks: [], incompleteSetbacks: [], requiresApproval: true, tags: ['tech', 'learning'] },
        { ...createBaseQuest(), icon: '🧺', title: "Do a Load of Laundry", description: "Wash, dry, fold, and put away one full load of your own laundry.", type: QuestType.Venture, rewards: [{ rewardTypeId: 'core-diligence', amount: 15 }], lateSetbacks: [], incompleteSetbacks: [], tags: ['chore', 'home'] },
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