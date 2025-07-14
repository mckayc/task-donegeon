import { Quest, QuestType, QuestAvailability, GameAsset, Market, RewardTypeDefinition, Trophy, TrophyRequirementType, RewardCategory, LibraryPack } from '../types';

const createQuest = (data: Partial<Omit<Quest, 'claimedByUserIds' | 'dismissals'>>): Omit<Quest, 'claimedByUserIds' | 'dismissals'> => ({
    id: `lib-q-${Math.random().toString(36).substring(7)}`,
    title: 'Untitled', description: '', type: QuestType.Duty, rewards: [],
    lateSetbacks: [], incompleteSetbacks: [], isActive: true, isOptional: false,
    requiresApproval: false, availabilityType: QuestAvailability.Daily, availabilityCount: null,
    weeklyRecurrenceDays: [], monthlyRecurrenceDays: [], assignedUserIds: [], tags: [], ...data
});

const createAsset = (data: Partial<Omit<GameAsset, 'creatorId' | 'createdAt'>>): Omit<GameAsset, 'creatorId' | 'createdAt'> => ({
    id: `lib-ga-${Math.random().toString(36).substring(7)}`,
    name: 'Untitled Asset', description: '', url: 'https://placehold.co/150x150/84cc16/FFFFFF?text=Item',
    category: 'Misc', isForSale: false, cost: [], marketIds: [], ...data
});

const createMarket = (data: Partial<Market>): Market => ({
    id: `lib-m-${Math.random().toString(36).substring(7)}`,
    title: 'Untitled Market', description: '', ...data
});

const createTrophy = (data: Partial<Trophy>): Trophy => ({
    id: `lib-t-${Math.random().toString(36).substring(7)}`,
    name: 'Untitled Trophy', description: '', icon: '🏆', isManual: true, requirements: [], ...data
});

const morningQuests = Array.from({ length: 20 }, (_, i) => createQuest({ title: `Morning Task ${i + 1}`, description: `A sample morning task.`, rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['home', 'morning'] }));
const eveningQuests = Array.from({ length: 20 }, (_, i) => createQuest({ title: `Evening Task ${i + 1}`, description: `A sample evening task.`, rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['home', 'evening'] }));
const kitchenQuests = Array.from({ length: 20 }, (_, i) => createQuest({ title: `Kitchen Duty ${i + 1}`, description: `A sample kitchen chore.`, rewards: [{ rewardTypeId: 'core-diligence', amount: 8 }], tags: ['kitchen', 'chore'] }));
const petQuests = Array.from({ length: 20 }, (_, i) => createQuest({ title: `Pet Care ${i + 1}`, description: `A sample pet care task.`, rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['pet', 'chore'] }));
const learningQuests = Array.from({ length: 20 }, (_, i) => createQuest({ title: `Learning Quest ${i + 1}`, description: `A sample learning activity.`, rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['learning'] }));
const fitnessQuests = Array.from({ length: 20 }, (_, i) => createQuest({ title: `Fitness Challenge ${i + 1}`, description: `A sample physical activity.`, rewards: [{ rewardTypeId: 'core-strength', amount: 15 }], tags: ['fitness'] }));
const creativeQuests = Array.from({ length: 20 }, (_, i) => createQuest({ title: `Creative Project ${i + 1}`, description: `A sample creative task.`, rewards: [{ rewardTypeId: 'core-creative', amount: 10 }], tags: ['creative'] }));
const householdQuests = Array.from({ length: 20 }, (_, i) => createQuest({ title: `Household Chore ${i + 1}`, description: `A sample household chore.`, rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['chore', 'home'] }));
const musicQuests = Array.from({ length: 20 }, (_, i) => createQuest({ title: `Music Practice ${i + 1}`, description: `A sample music practice.`, rewards: [{ rewardTypeId: 'core-skill', amount: 15 }], tags: ['music', 'learning'] }));
const socialQuests = Array.from({ length: 20 }, (_, i) => createQuest({ title: `Social Goal ${i + 1}`, description: `A sample social skill task.`, rewards: [{ rewardTypeId: 'core-gems', amount: 5 }], tags: ['social', 'kindness'] }));
const yardQuests = Array.from({ length: 20 }, (_, i) => createQuest({ title: `Yard Work ${i + 1}`, description: `A sample yard work chore.`, rewards: [{ rewardTypeId: 'core-strength', amount: 10 }], tags: ['chore', 'outdoors'] }));
const screenFreeQuests = Array.from({ length: 20 }, (_, i) => createQuest({ title: `Screen-Free Activity ${i + 1}`, description: `A sample screen-free task.`, rewards: [{ rewardTypeId: 'core-gems', amount: 10 }], tags: ['social', 'play'] }));
const teenQuests = Array.from({ length: 20 }, (_, i) => createQuest({ title: `Teen Responsibility ${i + 1}`, description: `A sample chore for teens.`, rewards: [{ rewardTypeId: 'core-skill', amount: 10 }], tags: ['kitchen', 'chore'] }));
const financeQuests = Array.from({ length: 20 }, (_, i) => createQuest({ title: `Finance Lesson ${i + 1}`, description: `A sample financial literacy task.`, rewards: [{ rewardTypeId: 'core-wisdom', amount: 20 }], tags: ['learning', 'finance'] }));
const mindfulnessQuests = Array.from({ length: 20 }, (_, i) => createQuest({ title: `Mindful Moment ${i + 1}`, description: `A sample mindfulness exercise.`, rewards: [{ rewardTypeId: 'core-wisdom', amount: 5 }], tags: ['health', 'mindfulness'] }));
const orgQuests = Array.from({ length: 20 }, (_, i) => createQuest({ title: `Organization Task ${i + 1}`, description: `A sample organizing task.`, rewards: [{ rewardTypeId: 'core-diligence', amount: 15 }], tags: ['chore', 'organizing'] }));
const techQuests = Array.from({ length: 20 }, (_, i) => createQuest({ title: `Tech Skill ${i + 1}`, description: `A sample tech skill task.`, rewards: [{ rewardTypeId: 'core-skill', amount: 5 }], tags: ['tech', 'learning'] }));
const langQuests = Array.from({ length: 20 }, (_, i) => createQuest({ title: `Language Lesson ${i + 1}`, description: `A sample language learning task.`, rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['learning', 'language'] }));
const carQuests = Array.from({ length: 20 }, (_, i) => createQuest({ title: `Car Care ${i + 1}`, description: `A sample car care task.`, rewards: [{ rewardTypeId: 'core-strength', amount: 15 }], tags: ['chore', 'home'] }));
const helpingQuests = Array.from({ length: 20 }, (_, i) => createQuest({ title: `Helping Hand ${i + 1}`, description: `A sample helping task.`, rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['social', 'planning'] }));

const milestoneTrophies = Array.from({ length: 20 }, (_, i) => createTrophy({ name: `Milestone Trophy ${i+1}`, description: `A sample milestone trophy.`}));
const kindnessTrophies = Array.from({ length: 20 }, (_, i) => createTrophy({ name: `Kindness Award ${i+1}`, description: `A sample kindness award.`}));
const creativeTrophies = Array.from({ length: 20 }, (_, i) => createTrophy({ name: `Creative Trophy ${i+1}`, description: `A sample creative trophy.`}));
const academicTrophies = Array.from({ length: 20 }, (_, i) => createTrophy({ name: `Academic Trophy ${i+1}`, description: `A sample academic trophy.`}));

const avatarItems = Array.from({ length: 20 }, (_, i) => createAsset({ name: `Avatar Item ${i+1}`, category: 'Avatar' }));

export const libraryPacks: LibraryPack[] = [
    // --- QUESTS ---
    { id: 'pack-q-1', type: 'Quests', title: 'Morning Routine', description: 'A set of daily quests to start the day right.', assets: { quests: morningQuests }},
    { id: 'pack-q-2', type: 'Quests', title: 'Evening Wind-Down', description: 'Quests to prepare for a good night\'s sleep.', assets: { quests: eveningQuests }},
    { id: 'pack-q-3', type: 'Quests', title: 'Kitchen Helper', description: 'A collection of kitchen-related chores.', assets: { quests: kitchenQuests }},
    { id: 'pack-q-4', type: 'Quests', title: 'Pet Care Basics', description: 'Essential duties for looking after a furry friend.', assets: { quests: petQuests }},
    { id: 'pack-q-5', type: 'Quests', title: 'Learning & Knowledge', description: 'Quests focused on expanding your mind.', assets: { quests: learningQuests }},
    { id: 'pack-q-6', type: 'Quests', title: 'Fitness Fun', description: 'Get moving with these physical activities.', assets: { quests: fitnessQuests }},
    { id: 'pack-q-7', type: 'Quests', title: 'Creative Corner', description: 'Quests to spark imagination and creativity.', assets: { quests: creativeQuests }},
    { id: 'pack-q-8', type: 'Quests', title: 'Household Upkeep', description: 'General chores to keep the house in order.', assets: { quests: householdQuests }},
    { id: 'pack-q-9', type: 'Quests', title: 'Musical Practice', description: 'Hone your musical talents.', assets: { quests: musicQuests }},
    { id: 'pack-q-10', type: 'Quests', title: 'Social Skills', description: 'Quests to improve interaction and kindness.', assets: { quests: socialQuests }},
    { id: 'pack-q-11', type: 'Quests', title: 'Yard Work Warriors', description: 'Tackle the great outdoors.', assets: { quests: yardQuests }},
    { id: 'pack-q-12', type: 'Quests', title: 'Screen Time Alternatives', description: 'Fun things to do away from screens.', assets: { quests: screenFreeQuests }},
    { id: 'pack-q-13', type: 'Quests', title: 'Teen Responsibilities', description: 'More advanced chores for older kids.', assets: { quests: teenQuests }},
    { id: 'pack-q-14', type: 'Quests', title: 'Financial Literacy', description: 'Quests about understanding money.', assets: { quests: financeQuests }},
    { id: 'pack-q-15', type: 'Quests', title: 'Mindfulness Moments', description: 'Quests for calm and focus.', assets: { quests: mindfulnessQuests }},
    { id: 'pack-q-16', type: 'Quests', title: 'Organization Overhaul', description: 'Tackle a messy area.', assets: { quests: orgQuests }},
    { id: 'pack-q-17', type: 'Quests', title: 'Tech Skills', description: 'Improve your digital literacy.', assets: { quests: techQuests }},
    { id: 'pack-q-18', type: 'Quests', title: 'Language Learning', description: 'Practice a new language.', assets: { quests: langQuests }},
    { id: 'pack-q-19', type: 'Quests', title: 'Car Care Crew', description: 'Help maintain the family vehicle.', assets: { quests: carQuests }},
    { id: 'pack-q-20', type: 'Quests', title: 'Helping Others', description: 'Quests focused on community and service.', assets: { quests: helpingQuests }},

    // --- TROPHIES ---
    { id: 'pack-t-1', type: 'Trophies', title: 'Milestone Trophies', description: 'A set of trophies for reaching key milestones.', assets: { trophies: milestoneTrophies }},
    { id: 'pack-t-2', type: 'Trophies', title: 'Kindness Awards', description: 'Recognizing acts of kindness.', assets: { trophies: kindnessTrophies }},
    { id: 'pack-t-3', type: 'Trophies', title: 'Creative Awards', description: 'For imaginative and artistic achievements.', assets: { trophies: creativeTrophies }},
    { id: 'pack-t-4', type: 'Trophies', title: 'Academic Achievements', description: 'Trophies for school and learning.', assets: { trophies: academicTrophies }},

    // --- MARKETS & ITEMS ---
    { id: 'pack-m-1', type: 'Markets & Items', title: 'Avatar Starter Pack', description: 'A market with basic avatar clothing.', assets: {
        markets: [createMarket({ id: 'market-starter-clothes', title: 'The Common Thread', description: 'Basic and comfortable avatar attire.', icon: '👕'})],
        gameAssets: avatarItems
    }},
];
