import { User, Role, RewardTypeDefinition, RewardCategory, Rank, Trophy, TrophyRequirementType, QuestType, Market, Quest, QuestAvailability, Guild, AppSettings, SidebarConfigItem, GameAsset, ThemeDefinition, ThemeStyle, QuestCompletion, QuestCompletionStatus, MarketStatus, LibraryPack, BlueprintAssets, RewardItem, TrophyRequirement } from '../types';

const createQuest = (title: string, description: string, type: QuestType, icon: string, rewards: RewardItem[], tags: string[] = []): Quest => ({
    id: `lib-quest-${title.replace(/\s+/g, '-').toLowerCase()}-${Math.random()}`,
    title,
    description,
    type,
    iconType: 'emoji',
    icon,
    imageUrl: undefined,
    tags,
    rewards,
    lateSetbacks: [],
    incompleteSetbacks: [],
    isActive: true,
    isOptional: false,
    availabilityType: type === QuestType.Duty ? QuestAvailability.Daily : QuestAvailability.Unlimited,
    availabilityCount: null,
    weeklyRecurrenceDays: [],
    monthlyRecurrenceDays: [],
    assignedUserIds: [],
    requiresApproval: false,
    claimedByUserIds: [],
    dismissals: [],
    todoUserIds: [],
    lateDateTime: undefined,
    incompleteDateTime: undefined,
    lateTime: undefined,
    incompleteTime: undefined,
    guildId: undefined,
});

const createTrophy = (name: string, description: string, icon: string, isManual: boolean, requirements: TrophyRequirement[]): Trophy => ({
    id: `lib-trophy-${name.replace(/\s+/g, '-').toLowerCase()}-${Math.random()}`,
    name,
    description,
    iconType: 'emoji',
    icon,
    imageUrl: undefined,
    isManual,
    requirements,
});

const createMarket = (title: string, description: string, icon: string): Omit<Market, 'id'> => ({
    title,
    description,
    iconType: 'emoji',
    icon,
    status: { type: 'open' },
});

const createReward = (name: string, description: string, category: RewardCategory, icon: string): Omit<RewardTypeDefinition, 'id' | 'isCore'> => ({
    name,
    description,
    category,
    iconType: 'emoji',
    icon,
});

const createAsset = (name: string, description: string, category: string, avatarSlot: string | undefined, costGroups: RewardItem[][], marketIds: string[], icon?: string): Omit<GameAsset, 'id' | 'creatorId' | 'createdAt' | 'purchaseCount'> => ({
    name,
    description,
    category,
    avatarSlot,
    costGroups,
    marketIds,
    icon,
    url: `https://placehold.co/150/84cc16/FFFFFF?text=${encodeURIComponent(icon || '🎁')}`,
    isForSale: true,
    requiresApproval: false,
    purchaseLimit: null,
    purchaseLimitType: 'Total',
});

const starterChores: Partial<BlueprintAssets> = {
    quests: [
        createQuest('Make Bed', 'Make your bed neatly.', QuestType.Duty, '🛏️', [{ rewardTypeId: 'core-diligence', amount: 5 }, { rewardTypeId: 'core-crystal', amount: 1 }], ['morning', 'bedroom']),
        createQuest('Brush Teeth', 'Brush your teeth for 2 minutes.', QuestType.Duty, '🦷', [{ rewardTypeId: 'core-diligence', amount: 5 }], ['morning', 'evening', 'health']),
        createQuest('Get Dressed', 'Get dressed for the day.', QuestType.Duty, '👕', [{ rewardTypeId: 'core-diligence', amount: 3 }], ['morning']),
        createQuest('Empty Dishwasher', 'Empty the dishwasher completely.', QuestType.Duty, '🍽️', [{ rewardTypeId: 'core-diligence', amount: 10 }, { rewardTypeId: 'core-gems', amount: 1 }], ['kitchen']),
        createQuest('Set the Table', 'Set the table for dinner.', QuestType.Duty, '🍴', [{ rewardTypeId: 'core-diligence', amount: 5 }], ['evening', 'kitchen']),
        createQuest('Clear Your Plate', 'Clear your own plate after a meal.', QuestType.Duty, '🧼', [{ rewardTypeId: 'core-diligence', amount: 3 }], ['evening', 'kitchen']),
        createQuest('Pack Backpack', 'Pack your backpack for school.', QuestType.Duty, '🎒', [{ rewardTypeId: 'core-wisdom', amount: 5 }], ['evening', 'school']),
        createQuest('Tidy Room (5 Min)', 'Spend 5 minutes tidying your room.', QuestType.Duty, '🧹', [{ rewardTypeId: 'core-diligence', amount: 10 }], ['bedroom']),
        createQuest('Feed Pet', 'Feed the family pet.', QuestType.Duty, '🐾', [{ rewardTypeId: 'core-diligence', amount: 5 }], ['pets']),
        createQuest('Put Away Shoes & Coat', 'Put away your shoes and coat when you come inside.', QuestType.Duty, '🧥', [{ rewardTypeId: 'core-diligence', amount: 3 }], ['organization']),
    ],
};

const familyVentures: Partial<BlueprintAssets> = {
    quests: [
        createQuest('Clean Your Room', 'Deep clean your room: dust, vacuum, and organize.', QuestType.Venture, '✨', [{ rewardTypeId: 'core-diligence', amount: 50 }, { rewardTypeId: 'core-gems', amount: 5 }], ['bedroom', 'cleaning']),
        createQuest('Help with Groceries', 'Help bring in and put away the groceries.', QuestType.Venture, '🛒', [{ rewardTypeId: 'core-strength', amount: 15 }], ['helping', 'kitchen']),
        createQuest('Rake the Leaves', 'Rake all the leaves in the front yard.', QuestType.Venture, '🍁', [{ rewardTypeId: 'core-strength', amount: 30 }, { rewardTypeId: 'core-gems', amount: 3 }], ['yardwork']),
        createQuest('Wash the Car', 'Help wash the family car.', QuestType.Venture, '🚗', [{ rewardTypeId: 'core-diligence', amount: 40 }, { rewardTypeId: 'core-gems', amount: 4 }], ['yardwork']),
        createQuest('Organize the Pantry', 'Organize all the food in the pantry neatly.', QuestType.Venture, '🥫', [{ rewardTypeId: 'core-diligence', amount: 25 }], ['kitchen', 'organization']),
        createQuest('Walk the Dog', 'Take the dog for a 20-minute walk.', QuestType.Venture, '🐕', [{ rewardTypeId: 'core-strength', amount: 10 }], ['pets']),
        createQuest('Mow the Lawn', 'Mow the entire lawn.', QuestType.Venture, '🌱', [{ rewardTypeId: 'core-strength', amount: 50 }, { rewardTypeId: 'core-gems', amount: 5 }], ['yardwork']),
        createQuest('Cook Dinner', 'Help cook dinner for the family.', QuestType.Venture, '🍳', [{ rewardTypeId: 'core-creative', amount: 20 }], ['kitchen', 'helping']),
        createQuest('Babysit a Sibling', 'Watch a younger sibling for one hour.', QuestType.Venture, '👶', [{ rewardTypeId: 'core-wisdom', amount: 30 }, { rewardTypeId: 'core-gems', amount: 3 }], ['helping', 'family']),
        createQuest('Build Something', 'Build a cool fort or LEGO creation.', QuestType.Venture, '🏰', [{ rewardTypeId: 'core-creative', amount: 25 }], ['creative']),
    ],
}

const selfImprovementVentures: Partial<BlueprintAssets> = {
     quests: [
        createQuest('Read a Book', 'Read a book for 30 minutes.', QuestType.Venture, '📚', [{ rewardTypeId: 'core-wisdom', amount: 20 }], ['learning', 'quiet time']),
        createQuest('Practice an Instrument', 'Practice your musical instrument for 20 minutes.', QuestType.Venture, '🎸', [{ rewardTypeId: 'core-skill', amount: 20 }], ['practice', 'music']),
        createQuest('Learn a New Skill', 'Spend 30 minutes learning a new skill online (e.g., coding, drawing).', QuestType.Venture, '💻', [{ rewardTypeId: 'core-wisdom', amount: 30 }], ['learning', 'skill']),
        createQuest('Exercise', 'Do 20 minutes of physical activity.', QuestType.Venture, '🏃', [{ rewardTypeId: 'core-strength', amount: 25 }], ['health', 'exercise']),
        createQuest('Write a Story', 'Write a short story of at least 100 words.', QuestType.Venture, '✍️', [{ rewardTypeId: 'core-creative', amount: 20 }], ['creative', 'writing']),
        createQuest('Draw a Picture', 'Spend time drawing or painting a picture.', QuestType.Venture, '🎨', [{ rewardTypeId: 'core-creative', amount: 15 }], ['creative', 'art']),
        createQuest('Help Someone', 'Do something kind for someone without being asked.', QuestType.Venture, '🤗', [{ rewardTypeId: 'core-gems', amount: 10 }], ['kindness', 'helping']),
        createQuest('Learn to Cook Something New', 'Follow a recipe and cook a new dish.', QuestType.Venture, '🧑‍🍳', [{ rewardTypeId: 'core-skill', amount: 25 }], ['cooking', 'skill']),
        createQuest('Organize Your Desk', 'Tidy up and organize your desk or workspace.', QuestType.Venture, '🗂️', [{ rewardTypeId: 'core-diligence', amount: 15 }], ['organization']),
        createQuest('Plan Your Week', 'Write down your goals and schedule for the week.', QuestType.Venture, '🗓️', [{ rewardTypeId: 'core-wisdom', amount: 10 }], ['planning']),
    ],
}

const funnyTrophies: Partial<BlueprintAssets> = {
    trophies: [
        createTrophy('The Punisher', 'For telling an exceptionally great (or terrible) pun.', '😂', true, []),
        createTrophy('Klutz of the Week', 'For a spectacular, harmless trip or fall.', '🤕', true, []),
        createTrophy('Bed Head', 'For having the most epic bed head one morning.', '🛌', true, []),
        createTrophy('The Snorter', 'For laughing so hard you snorted.', '🐽', true, []),
        createTrophy('Brain Fart', 'For a truly memorable moment of forgetfulness.', '💨', true, []),
        createTrophy('The Snackinator', 'For impressively finishing a bag of snacks.', '🍿', true, []),
        createTrophy('The Drama Llama', 'For an award-worthy dramatic performance over something small.', '🎭', true, []),
    ],
}

export const libraryPacks: LibraryPack[] = [
    {
        id: 'pack-starter-chores',
        type: 'Quests',
        title: 'Starter Daily Chores',
        description: 'A pack of 10 simple, common daily chores perfect for getting a new game started.',
        emoji: '🧹',
        color: 'border-sky-500',
        assets: starterChores
    },
     {
        id: 'pack-family-ventures',
        type: 'Quests',
        title: 'Family Project Ventures',
        description: 'A pack of 10 one-time quests that promote helping out around the house and yard.',
        emoji: '🏡',
        color: 'border-amber-500',
        assets: familyVentures
    },
    {
        id: 'pack-self-improvement',
        type: 'Quests',
        title: 'Self-Improvement Ventures',
        description: '10 one-time quests focused on learning, creativity, and personal growth.',
        emoji: '🌱',
        color: 'border-amber-500',
        assets: selfImprovementVentures
    },
     {
        id: 'pack-funny-trophies',
        type: 'Trophies',
        title: 'Funny & Silly Trophies',
        description: 'A collection of lighthearted, manual-award trophies for funny family moments.',
        emoji: '🤪',
        color: 'border-yellow-500',
        assets: funnyTrophies
    }
];