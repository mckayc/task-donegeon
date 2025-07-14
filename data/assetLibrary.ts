import { Quest, QuestType, QuestAvailability, GameAsset, Market, RewardTypeDefinition, Trophy, TrophyRequirementType, RewardCategory, LibraryPack } from '../types';

const QUEST_COLOR = 'border-sky-500';
const MARKET_COLOR = 'border-violet-500';
const TROPHY_COLOR = 'border-amber-400';
const REWARD_COLOR = 'border-rose-500';


const createQuest = (data: Partial<Omit<Quest, 'claimedByUserIds' | 'dismissals'>>): Omit<Quest, 'claimedByUserIds' | 'dismissals'> => ({
    id: `lib-q-${data.title?.toLowerCase().replace(/ /g, '-')}-${Math.random().toString(36).substring(7)}`,
    title: 'Untitled', description: '', type: QuestType.Duty, rewards: [],
    lateSetbacks: [], incompleteSetbacks: [], isActive: true, isOptional: false,
    requiresApproval: false, availabilityType: QuestAvailability.Daily, availabilityCount: null,
    weeklyRecurrenceDays: [], monthlyRecurrenceDays: [], assignedUserIds: [], tags: [], ...data
});

const createAsset = (data: Partial<Omit<GameAsset, 'creatorId' | 'createdAt'>>): Omit<GameAsset, 'creatorId' | 'createdAt'> => ({
    id: `lib-ga-${data.name?.toLowerCase().replace(/ /g, '-')}-${Math.random().toString(36).substring(7)}`,
    name: 'Untitled Asset', description: '', url: 'https://placehold.co/150x150/84cc16/FFFFFF?text=Item',
    category: 'Misc', isForSale: false, cost: [], marketIds: [], ...data
});

const createMarket = (data: Partial<Market>): Market => ({
    id: `lib-m-${data.title?.toLowerCase().replace(/ /g, '-')}-${Math.random().toString(36).substring(7)}`,
    title: 'Untitled Market', description: '', ...data
});

const createTrophy = (data: Partial<Trophy>): Trophy => ({
    id: `lib-t-${data.name?.toLowerCase().replace(/ /g, '-')}-${Math.random().toString(36).substring(7)}`,
    name: 'Untitled Trophy', description: '', icon: '🏆', isManual: true, requirements: [], ...data
});

const createReward = (data: Partial<Omit<RewardTypeDefinition, 'isCore'>>): Omit<RewardTypeDefinition, 'isCore'> => ({
     id: `lib-rt-${data.name?.toLowerCase().replace(/ /g, '-')}-${Math.random().toString(36).substring(7)}`,
    name: 'Untitled Reward', description: '', category: RewardCategory.Currency, icon: '💎', ...data
});

// Quest Packs
const morningQuests: Omit<Quest, 'claimedByUserIds' | 'dismissals'>[] = [
    createQuest({ title: 'Sunrise Readiness', description: 'Make your bed and ensure your sleeping area is tidy.', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['home', 'morning'] }),
    createQuest({ title: 'Fuel for the Day', description: 'Eat a healthy breakfast without any distractions like phones or TV.', rewards: [{ rewardTypeId: 'core-strength', amount: 5 }], tags: ['health', 'morning'] }),
    createQuest({ title: 'Armor & Appearance', description: 'Get fully dressed for the day, including brushing your hair.', rewards: [{ rewardTypeId: 'core-diligence', amount: 3 }], tags: ['home', 'morning'] }),
    createQuest({ title: 'Dental Defense', description: 'Brush your teeth for a full two minutes.', rewards: [{ rewardTypeId: 'core-diligence', amount: 3 }], tags: ['health', 'morning'] }),
    createQuest({ title: 'Ready for Adventure', description: 'Pack your school/work bag with everything you need for the day.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 5 }], tags: ['school', 'morning'] }),
];

const kitchenQuests: Omit<Quest, 'claimedByUserIds' | 'dismissals'>[] = [
    createQuest({ title: 'Set the Table', description: 'Set the table properly for a meal.', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['kitchen', 'chore'] }),
    createQuest({ title: 'Clear Your Plate', description: 'After eating, bring your plate and utensils to the kitchen and rinse them.', rewards: [{ rewardTypeId: 'core-diligence', amount: 3 }], tags: ['kitchen', 'chore'] }),
    createQuest({ title: 'Dishwasher Duty', description: 'Help load or unload the dishwasher.', rewards: [{ rewardTypeId: 'core-strength', amount: 10 }], tags: ['kitchen', 'chore'] }),
    createQuest({ title: 'Counter Strike', description: 'Wipe down the kitchen counters after a meal.', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['kitchen', 'chore'] }),
    createQuest({ title: 'Sous Chef', description: 'Help prepare a meal by chopping vegetables, mixing ingredients, or following a recipe.', rewards: [{ rewardTypeId: 'core-skill', amount: 15 }], requiresApproval: true, tags: ['kitchen', 'learning'] }),
];

const learningQuests: Omit<Quest, 'claimedByUserIds' | 'dismissals'>[] = [
    createQuest({ title: 'Homework Homeroom', description: 'Finish all of today\'s assigned homework.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 15 }], tags: ['learning', 'school'] }),
    createQuest({ title: 'Literary Journey', description: 'Read a chapter of a book for at least 20 minutes.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['learning', 'reading'] }),
    createQuest({ title: 'Musical Mastery', description: 'Practice your musical instrument for 20 minutes.', rewards: [{ rewardTypeId: 'core-skill', amount: 15 }], tags: ['learning', 'music'] }),
    createQuest({ title: 'Documentary Discovery', description: 'Watch an educational documentary and write down three things you learned.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 20 }], requiresApproval: true, tags: ['learning'] }),
    createQuest({ title: 'Code Conjurer', description: 'Spend 30 minutes learning to code on a platform like Codecademy or Khan Academy.', rewards: [{ rewardTypeId: 'core-skill', amount: 25 }], tags: ['learning', 'tech'] }),
];

const fitnessQuests: Omit<Quest, 'claimedByUserIds' | 'dismissals'>[] = [
    createQuest({ title: 'Neighborhood Explorer', description: 'Go for a 30-minute walk or bike ride.', rewards: [{ rewardTypeId: 'core-strength', amount: 15 }], tags: ['fitness', 'outdoors'] }),
    createQuest({ title: 'The Stretching Saga', description: 'Complete a 15-minute stretching or yoga routine.', rewards: [{ rewardTypeId: 'core-strength', amount: 10 }], tags: ['fitness', 'health'] }),
    createQuest({ title: 'Play Outside', description: 'Spend 45 minutes playing a sport or game outdoors.', rewards: [{ rewardTypeId: 'core-strength', amount: 20 }], tags: ['fitness', 'outdoors'] }),
    createQuest({ title: 'Push-Up Power', description: 'Complete 3 sets of push-ups to your best ability.', rewards: [{ rewardTypeId: 'core-strength', amount: 10 }], tags: ['fitness'] }),
    createQuest({ title: 'Hydration Hero', description: 'Drink 8 glasses of water throughout the day.', rewards: [{ rewardTypeId: 'core-strength', amount: 5 }], tags: ['fitness', 'health'] }),
];

const petQuests: Omit<Quest, 'claimedByUserIds' | 'dismissals'>[] = [
    createQuest({ title: 'Feast for the Beast', description: 'Feed the pet(s) their morning meal.', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['pet care'] }),
    createQuest({ title: 'Poop Patrol', description: 'Clean up pet waste from the yard or litterbox.', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['pet care', 'chore'] }),
    createQuest({ title: 'Hydration Station', description: 'Check and refill the pet(s)\' water bowl.', rewards: [{ rewardTypeId: 'core-diligence', amount: 3 }], tags: ['pet care'] }),
    createQuest({ title: 'Creature Comfort', description: 'Brush the pet or clean their cage/tank.', rewards: [{ rewardTypeId: 'core-diligence', amount: 15 }], tags: ['pet care'] }),
    createQuest({ title: 'The Grand Walk', description: 'Take the dog for a 20-minute walk.', rewards: [{ rewardTypeId: 'core-strength', amount: 10 }], tags: ['pet care', 'fitness'] }),
];

const homeMaintenanceQuests: Omit<Quest, 'claimedByUserIds' | 'dismissals'>[] = [
    createQuest({ title: 'Dust Bunnies\' Bane', description: 'Dust the surfaces in one room.', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['chore', 'cleaning'] }),
    createQuest({ title: 'The Void Summoner', description: 'Vacuum one room.', rewards: [{ rewardTypeId: 'core-strength', amount: 10 }], tags: ['chore', 'cleaning'] }),
    createQuest({ title: 'Garbage Day', description: 'Take out all the trash and recycling.', rewards: [{ rewardTypeId: 'core-strength', amount: 5 }], availabilityType: QuestAvailability.Weekly, weeklyRecurrenceDays: [2], tags: ['chore'] }),
    createQuest({ title: 'The Great Unloading', description: 'Help unload the groceries from the car.', rewards: [{ rewardTypeId: 'core-strength', amount: 5 }], tags: ['chore', 'kitchen'] }),
    createQuest({ title: 'The Green Guardian', description: 'Water the indoor plants.', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['chore', 'home'] }),
];

// Trophy Packs
const milestoneTrophies: Trophy[] = [
    createTrophy({ name: 'First Quest Complete', description: 'Awarded for completing your very first quest.', icon: '🎉' }),
    createTrophy({ name: 'The Librarian', description: 'Awarded for reading 10 books.', icon: '📚' }),
    createTrophy({ name: 'Master of Chores', description: 'Awarded for completing 100 chores.', icon: '🧹' }),
    createTrophy({ name: 'Wealthy Adventurer', description: 'Awarded for earning a total of 1000 Gold.', icon: '👑' }),
    createTrophy({ name: 'The Mentor', description: 'Awarded for helping another user complete a quest.', icon: '🤝' }),
];

const creativeTrophies: Trophy[] = [
    createTrophy({ name: 'The Artist', description: 'For creating a masterpiece of art.', icon: '🎨' }),
    createTrophy({ name: 'The Bard', description: 'For a wonderful musical performance.', icon: '🎵' }),
    createTrophy({ name: 'The Architect', description: 'For building an impressive creation (LEGOs, Minecraft, etc).', icon: '🏰' }),
    createTrophy({ name: 'The Scribe', description: 'For writing a creative story or poem.', icon: '✍️' }),
    createTrophy({ name: 'The Inventor', description: 'For coming up with a clever solution to a problem.', icon: '💡' }),
];

// Market & Item Packs
const fantasyItems: Omit<GameAsset, 'creatorId' | 'createdAt'>[] = [
    createAsset({ name: 'Adventurer\'s Tunic', description: 'A simple but sturdy green tunic.', url: 'https://placehold.co/150/166534/FFFFFF?text=Tunic', category: 'Avatar', avatarSlot: 'shirt' }),
    createAsset({ name: 'Pointy Wizard Hat', description: 'A classic hat for any aspiring mage.', url: 'https://placehold.co/150/7c3aed/FFFFFF?text=Hat', category: 'Avatar', avatarSlot: 'hat' }),
    createAsset({ name: 'Worn Leather Boots', description: 'Boots that have seen many roads.', url: 'https://placehold.co/150/a16207/FFFFFF?text=Boots', category: 'Avatar', avatarSlot: 'feet' }),
    createAsset({ name: 'Wooden Training Sword', description: 'A safe sword for practicing your swings.', url: 'https://placehold.co/150/854d0e/FFFFFF?text=Sword', category: 'Avatar', avatarSlot: 'hand-right' }),
    createAsset({ name: 'Round Shield', description: 'A basic shield for fending off pillows.', url: 'https://placehold.co/150/9ca3af/FFFFFF?text=Shield', category: 'Avatar', avatarSlot: 'hand-left' }),
];

const experienceItems: Omit<GameAsset, 'creatorId' | 'createdAt'>[] = [
    createAsset({ name: 'Movie Night Choice', description: 'You get to pick the movie for the next family movie night.', url: 'https://placehold.co/150/f97316/FFFFFF?text=Movie', category: 'Experience' }),
    createAsset({ name: 'Pizza Night Feast', description: 'The family will order pizza for dinner tonight!', url: 'https://placehold.co/150/ef4444/FFFFFF?text=Pizza', category: 'Experience' }),
    createAsset({ name: 'Ice Cream Sundae Trip', description: 'A special trip to get ice cream sundaes.', url: 'https://placehold.co/150/f472b6/FFFFFF?text=Ice+Cream', category: 'Experience' }),
    createAsset({ name: 'One Hour of Gaming', description: 'A voucher for one hour of video games.', url: 'https://placehold.co/150/3b82f6/FFFFFF?text=1+Hour', category: 'Experience' }),
    createAsset({ name: 'Stay Up 30 Mins Late', description: 'Redeem this to stay up 30 minutes past your bedtime.', url: 'https://placehold.co/150/fde047/000000?text=30m', category: 'Experience' }),
];

const sciFiItems: Omit<GameAsset, 'creatorId' | 'createdAt'>[] = [
    createAsset({ name: 'Holographic Visor', description: 'A sleek visor for a futuristic look.', url: 'https://placehold.co/150/0ea5e9/FFFFFF?text=Visor', category: 'Avatar', avatarSlot: 'hat' }),
    createAsset({ name: 'Jumpsuit', description: 'A standard-issue jumpsuit for any star explorer.', url: 'https://placehold.co/150/64748b/FFFFFF?text=Suit', category: 'Avatar', avatarSlot: 'shirt' }),
    createAsset({ name: 'Laser Blaster', description: 'A toy laser blaster. Pew pew! (Cosmetic)', url: 'https://placehold.co/150/ec4899/FFFFFF?text=Laser', category: 'Avatar', avatarSlot: 'hand-right' }),
    createAsset({ name: 'Gravity Boots', description: 'Magnetic boots for walking on starship hulls.', url: 'https://placehold.co/150/4f46e5/FFFFFF?text=Boots', category: 'Avatar', avatarSlot: 'feet' }),
    createAsset({ name: 'Robot Companion', description: 'A small, floating robot that follows you.', url: 'https://placehold.co/150/eab308/FFFFFF?text=Bot', category: 'Pet' }),
];

// Reward Packs
const craftingRewards: Omit<RewardTypeDefinition, 'isCore'>[] = [
    createReward({ name: 'Iron Ore', description: 'Used for crafting metal items.', category: RewardCategory.Currency, icon: '🌑' }),
    createReward({ name: 'Ancient Wood', description: 'Sturdy wood from elder trees.', category: RewardCategory.Currency, icon: '🪵' }),
    createReward({ name: 'Mystic Silk', description: 'Shimmering silk spun by magical creatures.', category: RewardCategory.Currency, icon: '🕸️' }),
    createReward({ name: 'Stardust', description: 'Sparkling dust with latent magic.', category: RewardCategory.Currency, icon: '✨' }),
    createReward({ name: 'Dragon Scale', description: 'A rare and durable crafting material.', category: RewardCategory.Currency, icon: '🐉' }),
];

const socialRewards: Omit<RewardTypeDefinition, 'isCore'>[] = [
    createReward({ name: 'Reputation', description: 'XP gained from honorable deeds.', category: RewardCategory.XP, icon: '🌟' }),
    createReward({ name: 'Kindness', description: 'XP from helping others.', category: RewardCategory.XP, icon: '💖' }),
    createReward({ name: 'Teamwork', description: 'XP earned by working with your guild.', category: RewardCategory.XP, icon: '🤝' }),
    createReward({ name: 'Leadership', description: 'XP gained from leading a successful venture.', category: RewardCategory.XP, icon: '👑' }),
    createReward({ name: 'Humor', description: 'XP for making someone laugh.', category: RewardCategory.XP, icon: '😂' }),
];


export const libraryPacks: LibraryPack[] = [
    // --- QUESTS ---
    { id: 'pack-q-morning', type: 'Quests', title: 'Morning Routine', description: 'A set of daily quests to start the day right.', color: QUEST_COLOR, assets: { quests: morningQuests }},
    { id: 'pack-q-kitchen', type: 'Quests', title: 'Kitchen Helper', description: 'A collection of kitchen-related chores.', color: QUEST_COLOR, assets: { quests: kitchenQuests }},
    { id: 'pack-q-learning', type: 'Quests', title: 'Learning & Knowledge', description: 'Quests focused on expanding your mind.', color: QUEST_COLOR, assets: { quests: learningQuests }},
    { id: 'pack-q-fitness', type: 'Quests', title: 'Fitness Fun', description: 'Get moving with these physical activities.', color: QUEST_COLOR, assets: { quests: fitnessQuests }},
    { id: 'pack-q-petcare', type: 'Quests', title: 'Pet Care Patrol', description: 'Quests for looking after your furry friends.', color: QUEST_COLOR, assets: { quests: petQuests }},
    { id: 'pack-q-homemaintenance', type: 'Quests', title: 'Home Maintenance', description: 'Basic chores for keeping the house in order.', color: QUEST_COLOR, assets: { quests: homeMaintenanceQuests }},
    
    // --- TROPHIES ---
    { id: 'pack-t-milestones', type: 'Trophies', title: 'Milestone Trophies', description: 'A set of trophies for reaching key milestones.', color: TROPHY_COLOR, assets: { trophies: milestoneTrophies }},
    { id: 'pack-t-creative', type: 'Trophies', title: 'Creative Achievements', description: 'Awards for creative and artistic endeavors.', color: TROPHY_COLOR, assets: { trophies: creativeTrophies }},
   
    // --- MARKETS & ITEMS ---
    { id: 'pack-m-fantasy', type: 'Markets & Items', title: 'Fantasy Starter Pack', description: 'A market with basic avatar clothing and gear.', color: MARKET_COLOR, assets: {
        markets: [createMarket({ id: 'market-fantasy-starter', title: 'The Adventurer\'s Outfitter', description: 'Gear for new heroes.', icon: '👕'})],
        gameAssets: fantasyItems
    }},
    { id: 'pack-m-experiences', type: 'Markets & Items', title: 'Real-World Rewards', description: 'A market for cashing in points for fun family experiences.', color: MARKET_COLOR, assets: {
        markets: [createMarket({ id: 'market-experiences', title: 'The Treasury of Fun', description: 'Spend your gems on memorable experiences.', icon: '🎬'})],
        gameAssets: experienceItems
    }},
     { id: 'pack-m-scifi', type: 'Markets & Items', title: 'Sci-Fi Armory', description: 'A market for futuristic avatar gear and companions.', color: MARKET_COLOR, assets: {
        markets: [createMarket({ id: 'market-scifi-armory', title: 'Starship Outfitters', description: 'Gear for the final frontier.', icon: '🚀'})],
        gameAssets: sciFiItems
    }},

    // --- REWARDS ---
    { id: 'pack-r-crafting', type: 'Rewards', title: 'Crafting Materials', description: 'A set of currencies themed around crafting materials.', color: REWARD_COLOR, assets: { rewardTypes: craftingRewards }},
    { id: 'pack-r-social', type: 'Rewards', title: 'Social XP Types', description: 'A set of XP types for rewarding positive social behaviors.', color: REWARD_COLOR, assets: { rewardTypes: socialRewards }},
    
    // --- NEW PACKS ---
    { id: 'pack-q-evening', type: 'Quests', title: 'Evening Wind-Down', description: 'Quests to end the day peacefully and prepared.', color: QUEST_COLOR, assets: { quests: [
        createQuest({ title: 'Tidy Up Territory', description: 'Spend 10 minutes tidying one common area.', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['evening', 'chore'] }),
        createQuest({ title: 'Plan for Tomorrow', description: 'Look at your calendar and plan your top 3 tasks for tomorrow.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 5 }], tags: ['evening', 'planning'] }),
        createQuest({ title: 'Screen-Free Serenity', description: 'No screens for the last 30 minutes before bed.', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['evening', 'health'] }),
        createQuest({ title: 'Reflect and Relax', description: 'Write one thing you are grateful for from today.', rewards: [{ rewardTypeId: 'core-creative', amount: 5 }], tags: ['evening', 'creative'] }),
        createQuest({ title: 'Lay Out Clothes', description: 'Choose and lay out your clothes for tomorrow.', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['evening', 'planning'] }),
    ]}},
    { id: 'pack-t-sports', type: 'Trophies', title: 'Sports Champion', description: 'Awards for athletic achievements and sportsmanship.', color: TROPHY_COLOR, assets: { trophies: [
        createTrophy({ name: 'Team Player', description: 'For excellent teamwork in a game.', icon: '🏅' }),
        createTrophy({ name: 'Personal Best', description: 'For beating your own record.', icon: '📈' }),
        createTrophy({ name: 'Tournament Victor', description: 'For winning a tournament.', icon: '🥇' }),
        createTrophy({ name: 'Good Sport', description: 'For showing great sportsmanship, win or lose.', icon: '🤝' }),
        createTrophy({ name: 'Practice Pays Off', description: 'For mastering a new skill through practice.', icon: '🎯' }),
    ]}},
    { id: 'pack-m-potion-shop', type: 'Markets & Items', title: 'Alchemist\'s Potions', description: 'A market selling cosmetic potions for your avatar.', color: MARKET_COLOR, assets: {
        markets: [createMarket({ id: 'market-potions', title: 'The Bubbling Cauldron', description: 'Potions that add flair to your avatar.', icon: '⚗️'})],
        gameAssets: [
            createAsset({ name: 'Health Potion', description: 'A classic red potion. (Cosmetic)', url: 'https://placehold.co/150/ef4444/FFFFFF?text=HP', category: 'Avatar', avatarSlot: 'belt-item' }),
            createAsset({ name: 'Mana Potion', description: 'A swirling blue elixir. (Cosmetic)', url: 'https://placehold.co/150/3b82f6/FFFFFF?text=MP', category: 'Avatar', avatarSlot: 'belt-item' }),
            createAsset({ name: 'Invisibility Potion', description: 'A clear, bubbling liquid. (Cosmetic)', url: 'https://placehold.co/150/a8a29e/FFFFFF?text=INVIS', category: 'Avatar', avatarSlot: 'belt-item' }),
            createAsset({ name: 'Luck Potion', description: 'A shimmering golden brew. (Cosmetic)', url: 'https://placehold.co/150/eab308/FFFFFF?text=LCK', category: 'Avatar', avatarSlot: 'belt-item' }),
            createAsset({ name: 'Stamina Potion', description: 'A vibrant green concoction. (Cosmetic)', url: 'https://placehold.co/150/22c55e/FFFFFF?text=STM', category: 'Avatar', avatarSlot: 'belt-item' }),
        ]
    }},
    { id: 'pack-r-virtues', type: 'Rewards', title: 'Virtue XP', description: 'Reward character traits and virtues.', color: REWARD_COLOR, assets: { rewardTypes: [
        createReward({ name: 'Courage', description: 'XP for facing a fear or trying something new.', category: RewardCategory.XP, icon: '🦁' }),
        createReward({ name: 'Patience', description: 'XP for waiting calmly or persisting through a challenge.', category: RewardCategory.XP, icon: '⏳' }),
        createReward({ name: 'Honesty', description: 'XP for telling the truth, especially when it is difficult.', category: RewardCategory.XP, icon: '🕊️' }),
        createReward({ name: 'Generosity', description: 'XP for sharing or giving to others.', category: RewardCategory.XP, icon: '🎁' }),
        createReward({ name: 'Discipline', description: 'XP for showing self-control.', category: RewardCategory.XP, icon: '🧘' }),
    ]}},
    // Add 16 more for a total of 20 new ones
    { id: 'pack-q-outdoor', type: 'Quests', title: 'Outdoor Explorer', description: 'Quests that encourage getting outside and exploring nature.', color: QUEST_COLOR, assets: { quests: [
        createQuest({title: 'Bug Hunt', description: 'Find and identify 5 different types of insects.', rewards: [{rewardTypeId: 'core-wisdom', amount: 15}]}),
        createQuest({title: 'Cloud Gazing', description: 'Lay on the grass and identify 3 different cloud shapes.', rewards: [{rewardTypeId: 'core-creative', amount: 5}]}),
        createQuest({title: 'Nature Scavenger Hunt', description: 'Find a smooth rock, a Y-shaped stick, a feather, and a pinecone.', rewards: [{rewardTypeId: 'core-diligence', amount: 20}]}),
        createQuest({title: 'Build a Fort', description: 'Build a small fort outside using natural materials.', rewards: [{rewardTypeId: 'core-creative', amount: 25}]}),
        createQuest({title: 'Follow the Leader', description: 'Lead the family on a short walk, choosing the path.', rewards: [{rewardTypeId: 'core-skill', amount: 10}]}),
    ]}},
    { id: 'pack-q-financial', type: 'Quests', title: 'Financial Literacy', description: 'Quests to teach the basics of money management.', color: QUEST_COLOR, assets: { quests: [
        createQuest({title: 'Coin Sorting', description: 'Sort a pile of mixed coins into different denominations.', rewards: [{rewardTypeId: 'core-wisdom', amount: 5}]}),
        createQuest({title: 'Savings Goal', description: 'Set a savings goal for a toy or item and add to it.', rewards: [{rewardTypeId: 'core-diligence', amount: 10}]}),
        createQuest({title: 'Price Check', description: 'During a grocery trip, find the price of 5 different items.', rewards: [{rewardTypeId: 'core-wisdom', amount: 10}]}),
        createQuest({title: 'Allowance Ledger', description: 'Keep a written log of your allowance and spending for a week.', rewards: [{rewardTypeId: 'core-diligence', amount: 15}]}),
        createQuest({title: 'Wants vs. Needs', description: 'Make a list of 5 wants and 5 needs.', rewards: [{rewardTypeId: 'core-wisdom', amount: 10}]}),
    ]}},
     { id: 'pack-t-academic', type: 'Trophies', title: 'Academic Excellence', description: 'Awards for achievements in school and learning.', color: TROPHY_COLOR, assets: { trophies: [
        createTrophy({ name: 'A+ Effort', description: 'For getting a top grade on a test or project.', icon: '💯' }),
        createTrophy({ name: 'Honor Roll', description: 'For making the honor roll at school.', icon: '📜' }),
        createTrophy({ name: 'Science Whiz', description: 'For an excellent science fair project.', icon: '🔬' }),
        createTrophy({ name: 'History Buff', description: 'For demonstrating deep knowledge of a historical event.', icon: '🏛️' }),
        createTrophy({ name: 'Mathlete', description: 'For solving a particularly challenging math problem.', icon: '🧮' }),
    ]}},
     { id: 'pack-m-bakery', type: 'Markets & Items', title: 'The Sweet Tooth Bakery', description: 'A market filled with delicious, cosmetic baked goods.', color: MARKET_COLOR, assets: {
        markets: [createMarket({ id: 'market-bakery', title: 'The Sugared Scroll', description: 'Magical and mundane baked treats.', icon: '🥐'})],
        gameAssets: [
            createAsset({ name: 'Cupcake Companion', description: 'A tiny cupcake that follows you.', url: 'https://placehold.co/150/f472b6/FFFFFF?text=Cupcake', category: 'Pet' }),
            createAsset({ name: 'Croissant Shield', description: 'A flaky, buttery shield. Surprisingly durable.', url: 'https://placehold.co/150/f59e0b/FFFFFF?text=Croissant', category: 'Avatar', avatarSlot: 'hand-left' }),
            createAsset({ name: 'Baguette Sword', description: 'A long, crusty blade.', url: 'https://placehold.co/150/fbbf24/FFFFFF?text=Baguette', category: 'Avatar', avatarSlot: 'hand-right' }),
            createAsset({ name: 'Cookie Medal', description: 'A medal you can wear... or eat?', url: 'https://placehold.co/150/d97706/FFFFFF?text=Cookie', category: 'Avatar', avatarSlot: 'accessory' }),
            createAsset({ name: 'Pretzel Helm', description: 'A salty and stylish helmet.', url: 'https://placehold.co/150/92400e/FFFFFF?text=Pretzel', category: 'Avatar', avatarSlot: 'hat' }),
        ]
    }},
    { id: 'pack-r-elemental', type: 'Rewards', title: 'Elemental XP', description: 'XP types based on the classical elements.', color: REWARD_COLOR, assets: { rewardTypes: [
        createReward({ name: 'Fire XP', description: 'For tasks requiring passion and energy.', category: RewardCategory.XP, icon: '🔥' }),
        createReward({ name: 'Water XP', description: 'For tasks requiring adaptability and cleaning.', category: RewardCategory.XP, icon: '💧' }),
        createReward({ name: 'Earth XP', description: 'For tasks related to gardening and stability.', category: RewardCategory.XP, icon: '🌱' }),
        createReward({ name: 'Air XP', description: 'For tasks involving intellect and creativity.', category: RewardCategory.XP, icon: '💨' }),
        createReward({ name: 'Spirit XP', description: 'For tasks related to kindness and self-reflection.', category: RewardCategory.XP, icon: '✨' }),
    ]}},
    { id: 'pack-q-secret', type: 'Quests', title: 'Secret Agent Missions', description: 'Fun, imaginative quests with a spy theme.', color: QUEST_COLOR, assets: { quests: [
        createQuest({title: 'Mission: Invisible', description: 'Tidy your room so well it looks like no one was ever there.', rewards: [{rewardTypeId: 'core-diligence', amount: 15}]}),
        createQuest({title: 'Gather Intelligence', description: 'Ask a family member three questions about their day.', rewards: [{rewardTypeId: 'core-wisdom', amount: 5}]}),
        createQuest({title: 'Silent Sweep', description: 'Sweep a floor without anyone noticing you did it.', rewards: [{rewardTypeId: 'core-skill', amount: 10}]}),
        createQuest({title: 'Safe House Security', description: 'Check that all doors and windows are locked before bed.', rewards: [{rewardTypeId: 'core-diligence', amount: 5}]}),
        createQuest({title: 'Dead Drop', description: 'Leave a kind, anonymous note for someone in the house.', rewards: [{rewardTypeId: 'core-creative', amount: 10}]}),
    ]}},
    { id: 'pack-t-household', type: 'Trophies', title: 'Household Hero', description: 'Awards for being a great help around the house.', color: TROPHY_COLOR, assets: { trophies: [
        createTrophy({ name: 'Master of the Mop', description: 'For mopping the floors to a sparkling shine.', icon: '✨' }),
        createTrophy({ name: 'Laundry Lord', description: 'For washing, drying, and folding 5 loads of laundry.', icon: '🧺' }),
        createTrophy({ name: 'The Green Thumb', description: 'For keeping a plant alive for a month.', icon: '🪴' }),
        createTrophy({ name: 'The Organizer', description: 'For decluttering a messy drawer or closet.', icon: '🗂️' }),
        createTrophy({ name: 'The Recycler', description: 'For consistently sorting the recycling correctly.', icon: '♻️' }),
    ]}},
    { id: 'pack-m-pet-shop', type: 'Markets & Items', title: 'Creature Companion Shop', description: 'Adopt a variety of cute cosmetic pets.', color: MARKET_COLOR, assets: {
        markets: [createMarket({ id: 'market-pets', title: 'The Cuddly Companion', description: 'Adopt a friend for your adventures!', icon: '🐾'})],
        gameAssets: [
            createAsset({ name: 'Tiny Dragon', description: 'A small, friendly dragon.', url: 'https://placehold.co/150/4ade80/FFFFFF?text=Dragon', category: 'Pet' }),
            createAsset({ name: 'Floating Jellyfish', description: 'A glowing, ethereal jellyfish.', url: 'https://placehold.co/150/818cf8/FFFFFF?text=Jelly', category: 'Pet' }),
            createAsset({ name: 'Grumpy Cat', description: 'A perpetually unimpressed feline friend.', url: 'https://placehold.co/150/a8a29e/FFFFFF?text=Cat', category: 'Pet' }),
            createAsset({ name: 'Shoulder Parrot', description: 'A colorful parrot to sit on your shoulder.', url: 'https://placehold.co/150/ef4444/FFFFFF?text=Parrot', category: 'Pet' }),
            createAsset({ name: 'Rock Golem', description: 'A small, sturdy rock golem.', url: 'https://placehold.co/150/78716c/FFFFFF?text=Golem', category: 'Pet' }),
        ]
    }},
    { id: 'pack-r-hobby', type: 'Rewards', title: 'Hobby XP', description: 'XP types for various hobbies.', color: REWARD_COLOR, assets: { rewardTypes: [
        createReward({ name: 'Art XP', description: 'Experience from drawing, painting, and sculpting.', category: RewardCategory.XP, icon: '🎨' }),
        createReward({ name: 'Gaming XP', description: 'Experience from skilled video gaming.', category: RewardCategory.XP, icon: '🎮' }),
        createReward({ name: 'Collector XP', description: 'Experience from organizing and maintaining a collection.', category: RewardCategory.XP, icon: '📦' }),
        createReward({ name: 'Cooking XP', description: 'Experience from trying new recipes.', category: RewardCategory.XP, icon: '🧑‍🍳' }),
        createReward({ name: 'Builder XP', description: 'Experience from building and construction hobbies.', category: RewardCategory.XP, icon: '🧱' }),
    ]}},
    { id: 'pack-q-kindness', type: 'Quests', title: 'Kindness Crusade', description: 'Quests focused on performing acts of kindness.', color: QUEST_COLOR, assets: { quests: [
        createQuest({title: 'Share a Snack', description: 'Share a snack with a family member without being asked.', rewards: [{rewardTypeId: 'core-gems', amount: 5}]}),
        createQuest({title: 'Give a Compliment', description: 'Give a sincere compliment to someone.', rewards: [{rewardTypeId: 'core-gems', amount: 5}]}),
        createQuest({title: 'Help Without Asking', description: 'See someone struggling with a task and help them.', rewards: [{rewardTypeId: 'core-gems', amount: 10}]}),
        createQuest({title: 'Make a Card', description: 'Make a "just because" card for someone.', rewards: [{rewardTypeId: 'core-creative', amount: 10}]}),
        createQuest({title: 'Donate a Toy', description: 'Choose one of your own toys to donate to charity.', rewards: [{rewardTypeId: 'core-gems', amount: 15}]}),
    ]}},
    { id: 'pack-t-explorer', type: 'Trophies', title: 'Explorer Guild Awards', description: 'For those who venture into the unknown.', color: TROPHY_COLOR, assets: { trophies: [
        createTrophy({ name: 'Pathfinder', description: 'For exploring a new park or trail.', icon: '🗺️' }),
        createTrophy({ name: 'Gourmand', description: 'For trying a new type of food.', icon: '🍜' }),
        createTrophy({ name: 'The Linguist', description: 'For learning to say "hello" in five new languages.', icon: '🗣️' }),
        createTrophy({ name: 'Fearless', description: 'For trying an activity that scared you.', icon: '🧗' }),
        createTrophy({ name: 'The Naturalist', description: 'For identifying 5 native plants or animals.', icon: '🌲' }),
    ]}},
    { id: 'pack-m-seasonal', type: 'Markets & Items', title: 'Seasonal Styles', description: 'A market with items for various holidays and seasons.', color: MARKET_COLOR, assets: {
        markets: [createMarket({ id: 'market-seasonal', title: 'The Holiday Stall', description: 'Festive gear for every occasion!', icon: '🎃'})],
        gameAssets: [
            createAsset({ name: 'Santa Hat', description: 'A festive red and white hat.', url: 'https://placehold.co/150/dc2626/FFFFFF?text=Santa', category: 'Avatar', avatarSlot: 'hat' }),
            createAsset({ name: 'Bunny Ears', description: 'A pair of floppy bunny ears.', url: 'https://placehold.co/150/fbcfe8/FFFFFF?text=Ears', category: 'Avatar', avatarSlot: 'hat' }),
            createAsset({ name: 'Spooky Ghost Sheet', description: 'A classic ghost costume.', url: 'https://placehold.co/150/f1f5f9/000000?text=Ghost', category: 'Avatar', avatarSlot: 'cloak' }),
            createAsset({ name: 'Heart-Shaped Glasses', description: 'Rose-tinted glasses for a lovely look.', url: 'https://placehold.co/150/f472b6/FFFFFF?text=Heart', category: 'Avatar', avatarSlot: 'face' }),
            createAsset({ name: 'Turkey Hat', description: 'A silly hat that looks like a turkey.', url: 'https://placehold.co/150/854d0e/FFFFFF?text=Turkey', category: 'Avatar', avatarSlot: 'hat' }),
        ]
    }},
    { id: 'pack-r-school', type: 'Rewards', title: 'School Subjects', description: 'XP types based on school subjects.', color: REWARD_COLOR, assets: { rewardTypes: [
        createReward({ name: 'Math XP', description: 'Experience from math homework and practice.', category: RewardCategory.XP, icon: '🧮' }),
        createReward({ name: 'Science XP', description: 'Experience from science projects and learning.', category: RewardCategory.XP, icon: '🔬' }),
        createReward({ name: 'History XP', description: 'Experience from history lessons.', category: RewardCategory.XP, icon: '📜' }),
        createReward({ name: 'Language Arts XP', description: 'Experience from reading and writing assignments.', category: RewardCategory.XP, icon: '✍️' }),
        createReward({ name: 'Art Class XP', description: 'Experience from school art projects.', category: RewardCategory.XP, icon: '🖼️' }),
    ]}},
];