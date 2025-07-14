


import { Quest, QuestType, QuestAvailability, GameAsset, Market, RewardTypeDefinition, Trophy, TrophyRequirementType, RewardCategory } from '../types';

export interface LibraryPack {
    id: string;
    type: 'Quests' | 'Markets & Items' | 'Trophies' | 'Rewards';
    title: string;
    description: string;
    assets: {
        quests?: Omit<Quest, 'claimedByUserIds' | 'dismissals'>[];
        gameAssets?: Omit<GameAsset, 'creatorId' | 'createdAt'>[];
        markets?: Market[];
        rewardTypes?: Omit<RewardTypeDefinition, 'isCore'>[];
        trophies?: Trophy[];
    };
}

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
    id: 'temp-m',
    title: 'Untitled Market', description: '', ...data
});

const createTrophy = (data: Partial<Trophy>): Trophy => ({
    id: `lib-t-${Math.random().toString(36).substring(7)}`,
    name: 'Untitled Trophy', description: '', icon: '🏆', isManual: true, requirements: [], ...data
});

export const libraryPacks: LibraryPack[] = [
    // --- QUESTS ---
    { id: 'pack-q-1', type: 'Quests', title: 'Morning Routine', description: 'A set of daily quests to start the day right.', assets: { quests: [
        createQuest({ title: 'Make Your Bed', description: 'Tidy your sheets and pillows after waking up.', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['home', 'morning'] }),
        createQuest({ title: 'Morning Hygiene', description: 'Brush your teeth and wash your face.', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['health', 'morning'] }),
        createQuest({ title: 'Eat a Healthy Breakfast', description: 'Fuel your body for the day ahead.', rewards: [{ rewardTypeId: 'core-strength', amount: 5 }], tags: ['health', 'morning'] }),
    ]}},
    { id: 'pack-q-2', type: 'Quests', title: 'Evening Wind-Down', description: 'Quests to prepare for a good night\'s sleep.', assets: { quests: [
        createQuest({ title: 'Pack School Bag', description: 'Get your bag ready for tomorrow.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 5 }], tags: ['home', 'evening', 'school'] }),
        createQuest({ title: 'Tidy Up Your Space', description: 'Spend 5 minutes putting things away in your room.', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['home', 'evening', 'chore'] }),
        createQuest({ title: 'Read Before Bed', description: 'Read a book for 15 minutes instead of screen time.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['learning', 'evening'] }),
    ]}},
    { id: 'pack-q-3', type: 'Quests', title: 'Kitchen Helper', description: 'A collection of kitchen-related chores.', assets: { quests: [
        createQuest({ title: 'Set the Table', description: 'Set the table for dinner.', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['kitchen', 'chore'] }),
        createQuest({ title: 'Clear the Table', description: 'Clear plates and utensils after a meal.', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['kitchen', 'chore'] }),
        createQuest({ title: 'Help with Dishes', description: 'Help load or unload the dishwasher, or wash dishes.', type: QuestType.Venture, rewards: [{ rewardTypeId: 'core-diligence', amount: 15 }], availabilityType: QuestAvailability.Frequency, availabilityCount: 3, tags: ['kitchen', 'chore'] }),
    ]}},
    { id: 'pack-q-4', type: 'Quests', title: 'Pet Care Basics', description: 'Essential duties for looking after a furry friend.', assets: { quests: [
        createQuest({ title: 'Feed the Pet', description: 'Provide food for your pet at their scheduled time.', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['pet', 'chore'] }),
        createQuest({ title: 'Fresh Water for Pet', description: 'Ensure your pet has fresh, clean water.', rewards: [{ rewardTypeId: 'core-diligence', amount: 3 }], tags: ['pet', 'chore'] }),
        createQuest({ title: 'Walk the Dog', description: 'Take the dog for a 15-minute walk.', type: QuestType.Venture, rewards: [{ rewardTypeId: 'core-strength', amount: 10 }], availabilityType: QuestAvailability.Frequency, availabilityCount: 2, tags: ['pet', 'fitness'] }),
    ]}},
    { id: 'pack-q-5', type: 'Quests', title: 'Learning & Knowledge', description: 'Quests focused on expanding your mind.', assets: { quests: [
        createQuest({ title: 'Complete Homework', description: 'Finish all assigned homework for the day.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 15 }], tags: ['learning', 'school'] }),
        createQuest({ title: 'Study for a Test', description: 'Spend 30 minutes studying for an upcoming test.', type: QuestType.Venture, availabilityType: QuestAvailability.Unlimited, rewards: [{ rewardTypeId: 'core-wisdom', amount: 20 }], tags: ['learning', 'school'] }),
        createQuest({ title: 'Learn a New Fact', description: 'Watch a short educational video and share what you learned.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 5 }], tags: ['learning'] }),
    ]}},
    // ... Add 15 more quest packs
    { id: 'pack-q-6', type: 'Quests', title: 'Fitness Fun', description: 'Get moving with these physical activities.', assets: { quests: [ createQuest({ title: '30-minute Walk/Run', description: 'Get outside and get your heart rate up.', rewards: [{rewardTypeId: 'core-strength', amount: 15}], tags: ['fitness', 'health']}) ]}},
    { id: 'pack-q-7', type: 'Quests', title: 'Creative Corner', description: 'Quests to spark imagination and creativity.', assets: { quests: [ createQuest({ title: 'Draw a Picture', description: 'Spend 20 minutes drawing or painting.', rewards: [{rewardTypeId: 'core-creative', amount: 10}], tags: ['creative', 'art']}) ]}},
    { id: 'pack-q-8', type: 'Quests', title: 'Household Upkeep', description: 'General chores to keep the house in order.', assets: { quests: [ createQuest({ title: 'Take out the Trash', description: 'Empty all indoor trash cans into the main bin.', rewards: [{rewardTypeId: 'core-diligence', amount: 5}], tags: ['chore', 'home']}) ]}},
    { id: 'pack-q-9', type: 'Quests', title: 'Musical Practice', description: 'Hone your musical talents.', assets: { quests: [ createQuest({ title: 'Practice Instrument', description: 'Practice your instrument for 20 minutes.', rewards: [{rewardTypeId: 'core-skill', amount: 15}], tags: ['music', 'learning']}) ]}},
    { id: 'pack-q-10', type: 'Quests', title: 'Social Skills', description: 'Quests to improve interaction and kindness.', assets: { quests: [ createQuest({ title: 'Compliment Someone', description: 'Give a sincere compliment to a family member.', rewards: [{rewardTypeId: 'core-gems', amount: 5}], tags: ['social', 'kindness']}) ]}},
    { id: 'pack-q-11', type: 'Quests', title: 'Yard Work Warriors', description: 'Tackle the great outdoors.', assets: { quests: [ createQuest({ title: 'Pull Weeds', description: 'Spend 15 minutes weeding a garden bed.', type: QuestType.Venture, rewards: [{rewardTypeId: 'core-strength', amount: 10}], tags: ['chore', 'outdoors']}) ]}},
    { id: 'pack-q-12', type: 'Quests', title: 'Screen Time Alternatives', description: 'Fun things to do away from screens.', assets: { quests: [ createQuest({ title: 'Play a Board Game', description: 'Play a complete board game with family or friends.', type: QuestType.Venture, rewards: [{rewardTypeId: 'core-gems', amount: 10}], tags: ['social', 'play']}) ]}},
    { id: 'pack-q-13', type: 'Quests', title: 'Teen Responsibilities', description: 'More advanced chores for older kids.', assets: { quests: [ createQuest({ title: 'Help with Dinner Prep', description: 'Assist in preparing a meal (chopping, mixing, etc).', rewards: [{rewardTypeId: 'core-skill', amount: 10}], tags: ['kitchen', 'chore']}) ]}},
    { id: 'pack-q-14', type: 'Quests', title: 'Financial Literacy', description: 'Quests about understanding money.', assets: { quests: [ createQuest({ title: 'Track Your Spending', description: 'For one week, write down everything you spend money on.', type: QuestType.Venture, rewards: [{rewardTypeId: 'core-wisdom', amount: 20}], tags: ['learning', 'finance']}) ]}},
    { id: 'pack-q-15', type: 'Quests', title: 'Mindfulness Moments', description: 'Quests for calm and focus.', assets: { quests: [ createQuest({ title: '5-Minute Meditation', description: 'Sit quietly and focus on your breathing for 5 minutes.', rewards: [{rewardTypeId: 'core-wisdom', amount: 5}], tags: ['health', 'mindfulness']}) ]}},
    { id: 'pack-q-16', type: 'Quests', title: 'Organization Overhaul', description: 'Tackle a messy area.', assets: { quests: [ createQuest({ title: 'Organize One Drawer', description: 'Completely empty and reorganize one drawer in your room.', type: QuestType.Venture, rewards: [{rewardTypeId: 'core-diligence', amount: 15}], tags: ['chore', 'organizing']}) ]}},
    { id: 'pack-q-17', type: 'Quests', title: 'Tech Skills', description: 'Improve your digital literacy.', assets: { quests: [ createQuest({ title: 'Learn a Keyboard Shortcut', description: 'Learn and use a new keyboard shortcut today.', rewards: [{rewardTypeId: 'core-skill', amount: 5}], tags: ['tech', 'learning']}) ]}},
    { id: 'pack-q-18', type: 'Quests', title: 'Language Learning', description: 'Practice a new language.', assets: { quests: [ createQuest({ title: 'Duolingo Session', description: 'Complete one lesson in a language-learning app.', rewards: [{rewardTypeId: 'core-wisdom', amount: 10}], tags: ['learning', 'language']}) ]}},
    { id: 'pack-q-19', type: 'Quests', title: 'Car Care Crew', description: 'Help maintain the family vehicle.', assets: { quests: [ createQuest({ title: 'Help Wash the Car', description: 'Assist in washing the exterior of a car.', type: QuestType.Venture, rewards: [{rewardTypeId: 'core-strength', amount: 15}], tags: ['chore', 'home']}) ]}},
    { id: 'pack-q-20', type: 'Quests', title: 'Helping Others', description: 'Quests focused on community and service.', assets: { quests: [ createQuest({ title: 'Volunteer Brainstorm', description: 'Research and list 3 local places you could volunteer.', type: QuestType.Venture, rewards: [{rewardTypeId: 'core-wisdom', amount: 10}], tags: ['social', 'planning']}) ]}},

    // --- TROPHIES ---
    { id: 'pack-t-1', type: 'Trophies', title: 'Milestone Trophies', description: 'A set of trophies for reaching key milestones.', assets: { trophies: [
        createTrophy({ name: 'First Venture', description: 'For completing your first one-time Venture.', icon: '🎉'}),
        createTrophy({ name: 'Duty Master', description: 'For completing 100 Duties.', icon: '💯', isManual: false, requirements: [{type: TrophyRequirementType.CompleteQuestType, value: QuestType.Duty, count: 100}]}),
    ]}},
    // ... 9 more trophy packs
    { id: 'pack-t-2', type: 'Trophies', title: 'Kindness Awards', description: 'Recognizing acts of kindness.', assets: { trophies: [ createTrophy({ name: 'Good Samaritan', description: 'For helping someone without being asked.', icon: '🤝'}) ]}},
    { id: 'pack-t-3', type: 'Trophies', title: 'Creative Awards', description: 'For imaginative and artistic achievements.', assets: { trophies: [ createTrophy({ name: 'The Innovator', description: 'For a unique and creative solution.', icon: '💡'}) ]}},
    { id: 'pack-t-4', type: 'Trophies', title: 'Academic Achievements', description: 'Trophies for school and learning.', assets: { trophies: [ createTrophy({ name: 'Honor Roll', description: 'For achieving excellent grades.', icon: 'A+'}) ]}},
    { id: 'pack-t-5', type: 'Trophies', title: 'Fitness Feats', description: 'Celebrating physical accomplishments.', assets: { trophies: [ createTrophy({ name: 'Endurance Runner', description: 'For completing a long-distance run.', icon: '🏃‍♀️'}) ]}},
    { id: 'pack-t-6', type: 'Trophies', title: 'Home Helper Honors', description: 'For going above and beyond with chores.', assets: { trophies: [ createTrophy({ name: 'Tidy Titan', description: 'For an exceptional cleaning job.', icon: '✨'}) ]}},
    { id: 'pack-t-7', type: 'Trophies', title: 'Teamwork Trophies', description: 'Recognizing great collaboration.', assets: { trophies: [ createTrophy({ name: 'Team Player', description: 'For being a fantastic collaborator.', icon: '🧑‍🤝‍🧑'}) ]}},
    { id: 'pack-t-8', type: 'Trophies', title: 'Funny Bone Awards', description: 'For bringing laughter and joy.', assets: { trophies: [ createTrophy({ name: 'Class Clown', description: 'For making everyone laugh.', icon: '😂'}) ]}},
    { id: 'pack-t-9', type: 'Trophies', title: 'Pet Pal Awards', description: 'For excellent care of animals.', assets: { trophies: [ createTrophy({ name: 'Animal Friend', description: 'For showing extra love to a pet.', icon: '🐾'}) ]}},
    { id: 'pack-t-10', type: 'Trophies', title: 'Adventurous Spirit', description: 'For trying new things.', assets: { trophies: [ createTrophy({ name: 'The Daredevil', description: 'For bravely trying something new.', icon: '🧗'}) ]}},

    // --- MARKETS & ITEMS ---
    { id: 'pack-m-1', type: 'Markets & Items', title: 'Avatar Starter Pack', description: 'A market with basic avatar clothing.', assets: {
        markets: [createMarket({ id: 'market-starter-clothes', title: 'The Common Thread', description: 'Basic and comfortable avatar attire.', icon: '👕'})],
        gameAssets: [
            createAsset({ name: 'Blue T-Shirt', description: 'A simple blue t-shirt.', category: 'Avatar', avatarSlot: 'shirt', isForSale: true, cost: [{ rewardTypeId: 'core-crystal', amount: 10 }], marketIds: ['market-starter-clothes'] }),
            createAsset({ name: 'Brown Pants', description: 'Sturdy brown pants.', category: 'Avatar', avatarSlot: 'pants', isForSale: true, cost: [{ rewardTypeId: 'core-crystal', amount: 10 }], marketIds: ['market-starter-clothes'] }),
        ]
    }},
    // ... 9 more market packs
    { id: 'pack-m-2', type: 'Markets & Items', title: 'Screen Time Vouchers', description: 'A market to trade crystals for screen time.', assets: { markets: [createMarket({ id: 'market-screentime', title: "The Timekeeper's Shop", description: 'Exchange crystals for screen time.', icon: '⏳'})], gameAssets: [ createAsset({ name: '30 Mins Game Time', description: 'A voucher for 30 minutes of video game time.', category: 'Screen Time', isForSale: true, cost: [{rewardTypeId: 'core-crystal', amount: 30}], marketIds: ['market-screentime']}) ]}},
    { id: 'pack-m-3', type: 'Markets & Items', title: 'Movie Night', description: 'A market for family movie night rewards.', assets: { markets: [createMarket({ id: 'market-movienight', title: "The Grand Cinema", description: 'Rewards for a family movie night!', icon: '🎬'})], gameAssets: [ createAsset({ name: 'Choose the Movie', description: 'You get to pick the movie for family movie night.', category: 'Experience', isForSale: true, cost: [{rewardTypeId: 'core-gems', amount: 20}], marketIds: ['market-movienight']}) ]}},
    { id: 'pack-m-4', type: 'Markets & Items', title: 'Real-World Treats', description: 'Trade gold for real snacks.', assets: { markets: [createMarket({ id: 'market-treats', title: "The Sweet Shoppe", description: 'Cash in your gold for tasty treats.', icon: '🍬'})], gameAssets: [ createAsset({ name: 'Ice Cream Outing', description: 'A trip to the ice cream shop.', category: 'Outing', isForSale: true, cost: [{rewardTypeId: 'core-gold', amount: 5}], marketIds: ['market-treats']}) ]}},
    { id: 'pack-m-5', type: 'Markets & Items', title: 'Cool Headgear', description: 'A collection of hats and helmets.', assets: { markets: [createMarket({ id: 'market-headgear', title: "The Mad Hatter", description: 'Hats, helmets, and more!', icon: '🎩'})], gameAssets: [ createAsset({ name: 'Wizard Hat', description: 'A pointy wizard hat.', category: 'Avatar', avatarSlot: 'hat', isForSale: true, cost: [{rewardTypeId: 'core-crystal', amount: 25}], marketIds: ['market-headgear']}) ]}},
    { id: 'pack-m-6', type: 'Markets & Items', title: 'Fun Footwear', description: 'Shoes and boots for your avatar.', assets: { markets: [createMarket({ id: 'market-footwear', title: "The Cobbler's Bench", description: 'Stylish shoes for every occasion.', icon: '👟'})], gameAssets: [ createAsset({ name: 'Rocket Boots', description: 'Boots that look like they can fly!', category: 'Avatar', avatarSlot: 'feet', isForSale: true, cost: [{rewardTypeId: 'core-crystal', amount: 30}], marketIds: ['market-footwear']}) ]}},
    { id: 'pack-m-7', type: 'Markets & Items', title: 'Special Privileges', description: 'A market for earning special permissions.', assets: { markets: [createMarket({ id: 'market-privileges', title: "The King's Court", description: 'Earn royal decrees and privileges.', icon: '👑'})], gameAssets: [ createAsset({ name: 'Stay Up 30 Mins Late', description: 'Get to stay up 30 minutes past your bedtime one night.', category: 'Privilege', isForSale: true, cost: [{rewardTypeId: 'core-gems', amount: 50}], marketIds: ['market-privileges']}) ]}},
    { id: 'pack-m-8', type: 'Markets & Items', title: 'Bookworm\'s Library', description: 'A place to buy real books.', assets: { markets: [createMarket({ id: 'market-books', title: "The Scrollkeeper", description: 'Purchase a new book of your choice.', icon: '📚'})], gameAssets: [ createAsset({ name: '$10 Book Credit', description: 'A $10 credit towards a new book.', category: 'Book', isForSale: true, cost: [{rewardTypeId: 'core-gold', amount: 10}], marketIds: ['market-books']}) ]}},
    { id: 'pack-m-9', type: 'Markets & Items', title: 'Accessory Shop', description: 'Glasses, capes, and other accessories.', assets: { markets: [createMarket({ id: 'market-accessories', title: "The Trinket Box", description: 'Accessorize your avatar!', icon: '💍'})], gameAssets: [ createAsset({ name: 'Cool Sunglasses', description: 'Stylish shades for your avatar.', category: 'Avatar', avatarSlot: 'accessory', isForSale: true, cost: [{rewardTypeId: 'core-crystal', amount: 15}], marketIds: ['market-accessories']}) ]}},
    { id: 'pack-m-10', type: 'Markets & Items', title: 'Guild Hall Exclusives', description: 'Special items for guild members.', assets: { markets: [createMarket({ id: 'market-guild-exclusive', title: "Guild Treasury", description: 'Exclusive items for dedicated guild members.', icon: '🏛️', guildId: 'guild-default-1'})], gameAssets: [ createAsset({ name: 'Pizza Night', description: 'The guild votes on pizza toppings for a pizza night!', category: 'Guild Reward', isForSale: true, cost: [{rewardTypeId: 'core-gold', amount: 25}], marketIds: ['market-guild-exclusive']}) ]}},

    // --- REWARDS ---
    { id: 'pack-r-1', type: 'Rewards', title: 'Karma Points', description: 'A reward type for social and helpful actions.', assets: { rewardTypes: [{ id: 'lib-rt-karma', name: 'Karma', category: RewardCategory.Currency, description: 'Points earned for being kind and helpful.', icon: '💖' }]}},
    { id: 'pack-r-2', type: 'Rewards', title: 'Focus Points', description: 'An XP type for concentration and academic tasks.', assets: { rewardTypes: [{ id: 'lib-rt-focus', name: 'Focus', category: RewardCategory.XP, description: 'Points earned for studying and focus.', icon: '🧘' }]}},
];