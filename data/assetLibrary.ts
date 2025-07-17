import { Quest, QuestType, QuestAvailability, GameAsset, Market, RewardTypeDefinition, Trophy, TrophyRequirementType, RewardCategory, BlueprintAssets } from '../types';

export type LibraryPackType = 'Quests' | 'Items' | 'Markets' | 'Trophies' | 'Rewards';

export interface LibraryPack {
  id: string;
  type: LibraryPackType;
  title: string;
  description: string;
  emoji: string;
  color: string;
  assets: Partial<BlueprintAssets>;
}


const DUTY_COLOR = 'border-sky-500';
const VENTURE_COLOR = 'border-amber-500';
const ITEM_COLOR = 'border-green-500';
const MARKET_COLOR = 'border-violet-500';
const TROPHY_COLOR = 'border-amber-400';
const REWARD_COLOR = 'border-rose-500';


const createQuest = (data: Partial<Quest>): Quest => ({
    id: `lib-q-${data.title?.toLowerCase().replace(/ /g, '-')}-${Math.random().toString(36).substring(7)}`,
    title: 'Untitled', description: '', type: QuestType.Duty, icon: '📝', rewards: [],
    lateSetbacks: [], incompleteSetbacks: [], isActive: true, isOptional: false,
    requiresApproval: false, availabilityType: QuestAvailability.Daily, availabilityCount: null,
    weeklyRecurrenceDays: [], monthlyRecurrenceDays: [], assignedUserIds: [], tags: [],
    claimedByUserIds: [], dismissals: [],
    ...data
});

const createAsset = (data: Partial<GameAsset>): GameAsset => ({
    id: `lib-ga-${data.name?.toLowerCase().replace(/ /g, '-')}-${Math.random().toString(36).substring(7)}`,
    name: 'Untitled Asset', description: '', url: 'https://placehold.co/150x150/84cc16/FFFFFF?text=Item',
    icon: '📦', category: 'Misc', isForSale: false, cost: [], marketIds: [], purchaseLimit: null, purchaseCount: 0,
    creatorId: 'library', createdAt: new Date().toISOString(),
    ...data
});

const createMarket = (data: Partial<Market>): Market => ({
    id: `lib-m-${data.title?.toLowerCase().replace(/ /g, '-')}-${Math.random().toString(36).substring(7)}`,
    title: 'Untitled Market', description: '', icon: '🛒', status: 'open', ...data
});

const createTrophy = (data: Partial<Trophy>): Trophy => ({
    id: `lib-t-${data.name?.toLowerCase().replace(/ /g, '-')}-${Math.random().toString(36).substring(7)}`,
    name: 'Untitled Trophy', description: '', icon: '🏆', isManual: true, requirements: [], ...data
});

const createReward = (data: Partial<RewardTypeDefinition>): RewardTypeDefinition => ({
     id: `lib-rt-${data.name?.toLowerCase().replace(/ /g, '-')}-${Math.random().toString(36).substring(7)}`,
    name: 'Untitled Reward', description: '', category: RewardCategory.Currency, icon: '💎', isCore: false, ...data
});

const morningQuests = [
    createQuest({ icon: '🛏️', title: 'Sunrise Readiness', description: 'Make your bed and ensure your sleeping area is tidy.', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['home', 'morning'] }),
    createQuest({ icon: '🥣', title: 'Fuel for the Day', description: 'Eat a healthy breakfast without any distractions like phones or TV.', rewards: [{ rewardTypeId: 'core-strength', amount: 5 }], tags: ['health', 'morning'] }),
    createQuest({ icon: '👕', title: 'Armor & Appearance', description: 'Get fully dressed for the day, including brushing your hair.', rewards: [{ rewardTypeId: 'core-diligence', amount: 3 }], tags: ['home', 'morning'] }),
    createQuest({ icon: '🦷', title: 'Dental Defense', description: 'Brush your teeth for a full two minutes.', rewards: [{ rewardTypeId: 'core-diligence', amount: 3 }], tags: ['health', 'morning'] }),
    createQuest({ icon: '🎒', title: 'Ready for Adventure', description: 'Pack your school/work bag with everything you need for the day.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 5 }], tags: ['school', 'morning'] }),
    createQuest({ icon: '💧', title: 'First Hydration', description: 'Drink a full glass of water upon waking.', rewards: [{ rewardTypeId: 'core-strength', amount: 2 }], tags: ['health', 'morning'] }),
    createQuest({ icon: '🤸', title: 'Morning Stretch', description: 'Do 5 minutes of stretching to wake up your body.', rewards: [{ rewardTypeId: 'core-strength', amount: 3 }], tags: ['fitness', 'morning'] }),
    createQuest({ icon: '☀️', title: 'Greet the Sun', description: 'Open your curtains and let some sunlight in.', rewards: [{ rewardTypeId: 'core-creative', amount: 1 }], tags: ['health', 'morning'] }),
    createQuest({ icon: '🤔', title: "Day's Intention", description: 'Think of one goal you want to accomplish today.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 2 }], tags: ['planning', 'morning'] }),
    createQuest({ icon: '🐕', title: 'Morning Pet Patrol', description: 'Take the pet out for their morning potty break.', rewards: [{ rewardTypeId: 'core-diligence', amount: 4 }], tags: ['pet care', 'morning'] }),
];

const kitchenQuests = [
    createQuest({ icon: '🍴', title: 'Set the Table', description: 'Set the table properly for a meal.', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['kitchen', 'chore'] }),
    createQuest({ icon: '🍽️', title: 'Clear Your Plate', description: 'After eating, bring your plate and utensils to the kitchen and rinse them.', rewards: [{ rewardTypeId: 'core-diligence', amount: 3 }], tags: ['kitchen', 'chore'] }),
    createQuest({ icon: '🧼', title: 'Dishwasher Duty', description: 'Help load or unload the dishwasher.', rewards: [{ rewardTypeId: 'core-strength', amount: 10 }], tags: ['kitchen', 'chore'] }),
    createQuest({ icon: '🧽', title: 'Counter Strike', description: 'Wipe down the kitchen counters after a meal.', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['kitchen', 'chore'] }),
    createQuest({ icon: '🧑‍🍳', title: 'Sous Chef', description: 'Help prepare a meal by chopping vegetables, mixing ingredients, or following a recipe.', rewards: [{ rewardTypeId: 'core-skill', amount: 15 }], requiresApproval: true, tags: ['kitchen', 'learning'] }),
    createQuest({ icon: '🗑️', title: 'Kitchen Trash', description: 'Empty the kitchen trash can when it is full.', rewards: [{ rewardTypeId: 'core-strength', amount: 4 }], tags: ['kitchen', 'chore'] }),
    createQuest({ icon: '🥦', title: 'Vegetable Prep', description: 'Wash and prep vegetables for dinner.', rewards: [{ rewardTypeId: 'core-diligence', amount: 7 }], tags: ['kitchen', 'chore'] }),
    createQuest({ icon: '🍞', title: 'Lunch Packer', description: 'Make your own lunch for school tomorrow.', rewards: [{ rewardTypeId: 'core-skill', amount: 10 }], tags: ['kitchen', 'school'] }),
    createQuest({ icon: '🧹', title: 'Floor Sweep', description: 'Sweep the kitchen floor.', rewards: [{ rewardTypeId: 'core-strength', amount: 6 }], tags: ['kitchen', 'chore'] }),
    createQuest({ icon: '🍎', title: 'Snack Station Restock', description: 'Help restock the family snack station.', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['kitchen', 'chore'] }),
];

const learningQuests = [
    createQuest({ icon: '✍️', title: 'Homework Homeroom', description: 'Finish all of today\'s assigned homework.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 15 }], tags: ['learning', 'school'] }),
    createQuest({ icon: '📖', title: 'Literary Journey', description: 'Read a chapter of a book for at least 20 minutes.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['learning', 'reading'] }),
    createQuest({ icon: '🎹', title: 'Musical Mastery', description: 'Practice your musical instrument for 20 minutes.', rewards: [{ rewardTypeId: 'core-skill', amount: 15 }], tags: ['learning', 'music'] }),
    createQuest({ icon: '📽️', title: 'Documentary Discovery', description: 'Watch an educational documentary and write down three things you learned.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 20 }], requiresApproval: true, tags: ['learning'] }),
    createQuest({ icon: '💻', title: 'Code Conjurer', description: 'Spend 30 minutes learning to code on a platform like Codecademy or Khan Academy.', rewards: [{ rewardTypeId: 'core-skill', amount: 25 }], tags: ['learning', 'tech'] }),
    createQuest({ icon: '🧮', title: 'Math Magician', description: 'Complete one extra sheet of math problems.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['learning', 'school'] }),
    createQuest({ icon: '🗺️', title: 'Atlas Explorer', description: 'Find a country on a map and learn its capital.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 5 }], tags: ['learning', 'geography'] }),
    createQuest({ icon: '🗣️', title: 'Language Practice', description: 'Spend 15 minutes practicing a new language on an app like Duolingo.', rewards: [{ rewardTypeId: 'core-skill', amount: 15 }], tags: ['learning', 'language'] }),
    createQuest({ icon: '🔬', title: 'Science Experiment', description: 'Do a simple science experiment at home (with permission).', rewards: [{ rewardTypeId: 'core-wisdom', amount: 20 }], requiresApproval: true, tags: ['learning', 'science'] }),
    createQuest({ icon: '🤔', title: 'Word of the Day', description: 'Learn a new word and use it in a sentence.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 5 }], tags: ['learning', 'language'] }),
];

const fitnessQuests = [
    createQuest({ icon: '🚲', title: 'Neighborhood Explorer', description: 'Go for a 30-minute walk or bike ride.', rewards: [{ rewardTypeId: 'core-strength', amount: 15 }], tags: ['fitness', 'outdoors'] }),
    createQuest({ icon: '🧘', title: 'The Stretching Saga', description: 'Complete a 15-minute stretching or yoga routine.', rewards: [{ rewardTypeId: 'core-strength', amount: 10 }], tags: ['fitness', 'health'] }),
    createQuest({ icon: '⚽', title: 'Play Outside', description: 'Spend 45 minutes playing a sport or game outdoors.', rewards: [{ rewardTypeId: 'core-strength', amount: 20 }], tags: ['fitness', 'outdoors'] }),
    createQuest({ icon: '💪', title: 'Push-Up Power', description: 'Complete 3 sets of push-ups to your best ability.', rewards: [{ rewardTypeId: 'core-strength', amount: 10 }], tags: ['fitness'] }),
    createQuest({ icon: '💧', title: 'Hydration Hero', description: 'Drink 8 glasses of water throughout the day.', rewards: [{ rewardTypeId: 'core-strength', amount: 5 }], tags: ['fitness', 'health'] }),
    createQuest({ icon: '🕺', title: 'Dance Party', description: 'Put on some music and dance for 15 minutes.', rewards: [{ rewardTypeId: 'core-creative', amount: 10 }], tags: ['fitness', 'creative'] }),
    createQuest({ icon: '🧗', title: 'Playground Circuit', description: 'Do a circuit at the playground: swings, slides, and monkey bars.', rewards: [{ rewardTypeId: 'core-strength', amount: 15 }], tags: ['fitness', 'outdoors'] }),
    createQuest({ icon: '🏃', title: 'Backyard Sprints', description: 'Do 10 sprints across the backyard.', rewards: [{ rewardTypeId: 'core-strength', amount: 10 }], tags: ['fitness', 'outdoors'] }),
    createQuest({ icon: '🏀', title: 'Hoops Practice', description: 'Shoot baskets for 20 minutes.', rewards: [{ rewardTypeId: 'core-skill', amount: 10 }], tags: ['fitness', 'sports'] }),
    createQuest({ icon: '🏋️', title: 'Family Fitness', description: 'Invite a family member to do a workout with you.', rewards: [{ rewardTypeId: 'core-strength', amount: 15 }], tags: ['fitness', 'social'] }),
];

const petQuests = [
    createQuest({ icon: '🍖', title: 'Feast for the Beast', description: 'Feed the pet(s) their morning meal.', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['pet care'] }),
    createQuest({ icon: '💩', title: 'Poop Patrol', description: 'Clean up pet waste from the yard or litterbox.', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['pet care', 'chore'] }),
    createQuest({ icon: '💧', title: 'Hydration Station', description: 'Check and refill the pet(s)\' water bowl.', rewards: [{ rewardTypeId: 'core-diligence', amount: 3 }], tags: ['pet care'] }),
    createQuest({ icon: '🐈', title: 'Creature Comfort', description: 'Brush the pet or clean their cage/tank.', rewards: [{ rewardTypeId: 'core-diligence', amount: 15 }], tags: ['pet care'] }),
    createQuest({ icon: '🐕', title: 'The Grand Walk', description: 'Take the dog for a 20-minute walk.', rewards: [{ rewardTypeId: 'core-strength', amount: 10 }], tags: ['pet care', 'fitness'] }),
    createQuest({ icon: '🎾', title: 'Play Time', description: 'Play with the pet for 15 minutes.', rewards: [{ rewardTypeId: 'core-creative', amount: 8 }], tags: ['pet care'] }),
    createQuest({ icon: '🦴', title: 'Treat Time', description: 'Give the pet a treat for good behavior.', rewards: [{ rewardTypeId: 'core-diligence', amount: 2 }], tags: ['pet care'] }),
    createQuest({ icon: '🧼', title: 'Paw Cleaning', description: 'Wipe the pet\'s paws after they come inside.', rewards: [{ rewardTypeId: 'core-diligence', amount: 4 }], tags: ['pet care', 'chore'] }),
    createQuest({ icon: '😴', title: 'Bedtime for Beastie', description: 'Make sure the pet is in their bed/crate for the night.', rewards: [{ rewardTypeId: 'core-diligence', amount: 3 }], tags: ['pet care', 'evening'] }),
    createQuest({ icon: '🗣️', title: 'Trick Training', description: 'Spend 10 minutes teaching the pet a new trick.', rewards: [{ rewardTypeId: 'core-skill', amount: 10 }], tags: ['pet care', 'learning'] }),
];

const homeMaintenanceQuests = [
    createQuest({ icon: '✨', title: 'Dust Bunnies\' Bane', description: 'Dust the surfaces in one room.', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['chore', 'cleaning'] }),
    createQuest({ icon: '🌪️', title: 'The Void Summoner', description: 'Vacuum one room.', rewards: [{ rewardTypeId: 'core-strength', amount: 10 }], tags: ['chore', 'cleaning'] }),
    createQuest({ icon: '🗑️', title: 'Garbage Day', description: 'Take out all the trash and recycling.', rewards: [{ rewardTypeId: 'core-strength', amount: 5 }], availabilityType: QuestAvailability.Weekly, weeklyRecurrenceDays: [2], tags: ['chore'] }),
    createQuest({ icon: '🛒', title: 'The Great Unloading', description: 'Help unload the groceries from the car.', rewards: [{ rewardTypeId: 'core-strength', amount: 5 }], tags: ['chore', 'kitchen'] }),
    createQuest({ icon: '🪴', title: 'The Green Guardian', description: 'Water the indoor plants.', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['chore', 'home'] }),
    createQuest({ icon: '👕', title: 'Laundry Loader', description: 'Gather a load of laundry and start the washing machine.', rewards: [{ rewardTypeId: 'core-diligence', amount: 7 }], tags: ['chore', 'laundry'] }),
    createQuest({ icon: '🧦', title: 'Sock Matcher', description: 'Match all the clean socks.', rewards: [{ rewardTypeId: 'core-skill', amount: 8 }], tags: ['chore', 'laundry'] }),
    createQuest({ icon: '🪟', title: 'Window Wipe', description: 'Clean the inside of one window.', rewards: [{ rewardTypeId: 'core-diligence', amount: 6 }], tags: ['chore', 'cleaning'] }),
    createQuest({ icon: '🛋️', title: 'Pillow Plumper', description: 'Fluff and arrange the cushions on the sofa.', rewards: [{ rewardTypeId: 'core-diligence', amount: 3 }], tags: ['chore', 'cleaning'] }),
    createQuest({ icon: '📫', title: 'Mail Retrieval', description: 'Get the mail from the mailbox.', rewards: [{ rewardTypeId: 'core-diligence', amount: 2 }], tags: ['chore', 'home'] }),
];

const eveningQuests = [
    createQuest({ icon: '🛋️', title: 'Tidy Up Territory', description: 'Spend 10 minutes tidying one common area.', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['evening', 'chore'] }),
    createQuest({ icon: '📅', title: 'Plan for Tomorrow', description: 'Look at your calendar and plan your top 3 tasks for tomorrow.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 5 }], tags: ['evening', 'planning'] }),
    createQuest({ icon: '📵', title: 'Screen-Free Serenity', description: 'No screens for the last 30 minutes before bed.', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['evening', 'health'] }),
    createQuest({ icon: '😌', title: 'Reflect and Relax', description: 'Write one thing you are grateful for from today.', rewards: [{ rewardTypeId: 'core-creative', amount: 5 }], tags: ['evening', 'creative'] }),
    createQuest({ icon: '👔', title: 'Lay Out Clothes', description: 'Choose and lay out your clothes for tomorrow.', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['evening', 'planning'] }),
    createQuest({ icon: '📖', title: 'Bedtime Story', description: 'Read a book for 15 minutes before sleep.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 8 }], tags: ['evening', 'reading'] }),
    createQuest({ icon: '🧸', title: 'Toy Takedown', description: 'Put away all toys in your room.', rewards: [{ rewardTypeId: 'core-diligence', amount: 7 }], tags: ['evening', 'chore'] }),
    createQuest({ icon: '🥛', title: 'Final Hydration', description: 'Drink a glass of water before bed.', rewards: [{ rewardTypeId: 'core-strength', amount: 2 }], tags: ['evening', 'health'] }),
    createQuest({ icon: '🤫', title: 'Quiet Time', description: 'Engage in a quiet activity like drawing or listening to calm music.', rewards: [{ rewardTypeId: 'core-creative', amount: 5 }], tags: ['evening', 'health'] }),
    createQuest({ icon: '💡', title: 'Lights Out', description: 'Turn off all unnecessary lights in the house.', rewards: [{ rewardTypeId: 'core-diligence', amount: 3 }], tags: ['evening', 'chore'] }),
];

const kindnessQuests = [
    createQuest({icon: '🥨', title: 'Share a Snack', description: 'Share a snack with a family member without being asked.', rewards: [{rewardTypeId: 'core-gems', amount: 5}]}),
    createQuest({icon: '🥰', title: 'Give a Compliment', description: 'Give a sincere compliment to someone.', rewards: [{rewardTypeId: 'core-gems', amount: 5}]}),
    createQuest({icon: '🤝', title: 'Help Without Asking', description: 'See someone struggling with a task and help them.', rewards: [{rewardTypeId: 'core-gems', amount: 10}]}),
    createQuest({icon: '💌', title: 'Make a Card', description: 'Make a "just because" card for someone.', rewards: [{rewardTypeId: 'core-creative', amount: 10}]}),
    createQuest({icon: '🧸', title: 'Donate a Toy', description: 'Choose one of your own toys to donate to charity.', rewards: [{rewardTypeId: 'core-gems', amount: 15}]}),
    createQuest({icon: '🤗', title: 'Offer a Hug', description: 'Offer a hug to a family member.', rewards: [{rewardTypeId: 'core-gems', amount: 3}]}),
    createQuest({icon: '🗑️', title: 'Take Out Their Trash', description: 'Take out someone else\'s room trash for them.', rewards: [{rewardTypeId: 'core-gems', amount: 8}]}),
    createQuest({icon: '😃', title: 'Make Someone Smile', description: 'Tell a joke or do something silly to make someone smile.', rewards: [{rewardTypeId: 'core-creative', amount: 5}]}),
    createQuest({icon: '🗣️', title: 'Use Kind Words', description: 'Go a whole day without saying anything negative about anyone.', rewards: [{rewardTypeId: 'core-gems', amount: 20}]}),
    createQuest({icon: '🙏', title: 'Say Thank You', description: 'Specifically thank someone for something they did for you today.', rewards: [{rewardTypeId: 'core-gems', amount: 5}]}),
];

const secretAgentQuests = [
    createQuest({icon: '🤫', title: 'Mission: Invisible', description: 'Tidy your room so well it looks like no one was ever there.', rewards: [{rewardTypeId: 'core-diligence', amount: 15}]}),
    createQuest({icon: '📡', title: 'Gather Intelligence', description: 'Ask a family member three questions about their day.', rewards: [{rewardTypeId: 'core-wisdom', amount: 5}]}),
    createQuest({icon: '🥷', title: 'Silent Sweep', description: 'Sweep a floor without anyone noticing you did it.', rewards: [{rewardTypeId: 'core-skill', amount: 10}]}),
    createQuest({icon: '🔐', title: 'Safe House Security', description: 'Check that all doors and windows are locked before bed.', rewards: [{rewardTypeId: 'core-diligence', amount: 5}]}),
    createQuest({icon: '✉️', title: 'Dead Drop', description: 'Leave a kind, anonymous note for someone in the house.', rewards: [{rewardTypeId: 'core-creative', amount: 10}]}),
    createQuest({icon: '🐾', title: 'Follow the Target', description: 'Quietly follow a pet around for 5 minutes without being noticed.', rewards: [{rewardTypeId: 'core-skill', amount: 8}]}),
    createQuest({icon: '📝', title: 'Document Findings', description: 'Write a secret "report" about something interesting you observed today.', rewards: [{rewardTypeId: 'core-wisdom', amount: 7}]}),
    createQuest({icon: '📦', title: 'Infiltrate and Organize', description: 'Secretly organize a messy drawer or shelf.', rewards: [{rewardTypeId: 'core-diligence', amount: 12}]}),
    createQuest({icon: '🎭', title: 'Maintain Cover', description: 'Help a sibling with a chore without revealing it was a mission.', rewards: [{rewardTypeId: 'core-gems', amount: 10}]}),
    createQuest({icon: '🏃', title: 'Escape and Evade', description: 'Complete a trip from one end of the house to the other without making a sound.', rewards: [{rewardTypeId: 'core-skill', amount: 5}]}),
];

const toVenture = (q: Quest): Quest => ({ ...q, type: QuestType.Venture, availabilityType: QuestAvailability.Unlimited });

const homeImprovementVentures = [
    createQuest({ icon: '🧹', title: 'Garage Gauntlet', description: 'Completely sweep and organize the garage.', rewards: [{ rewardTypeId: 'core-strength', amount: 50 }, { rewardTypeId: 'core-diligence', amount: 50 }], requiresApproval: true, tags: ['home', 'chore', 'big project'] }),
    createQuest({ icon: '📦', title: 'Pantry Perfection', description: 'Take everything out of the pantry, clean the shelves, and organize all items.', rewards: [{ rewardTypeId: 'core-diligence', amount: 40 }], requiresApproval: true, tags: ['home', 'kitchen', 'organizing'] }),
    createQuest({ icon: '🖼️', title: 'Wall of Fame', description: 'Hang up a new picture frame or piece of art.', rewards: [{ rewardTypeId: 'core-creative', amount: 15 }], tags: ['home', 'decorating'] }),
    createQuest({ icon: '💡', title: 'Lightbringer', description: 'Replace a burnt-out lightbulb in the house.', rewards: [{ rewardTypeId: 'core-skill', amount: 5 }], tags: ['home', 'chore'] }),
    createQuest({ icon: '🛋️', title: 'Furniture Formation', description: 'Help move a piece of furniture to a new spot.', rewards: [{ rewardTypeId: 'core-strength', amount: 20 }], tags: ['home', 'chore'] }),
    createQuest({ icon: '🎨', title: 'The Grand Redecoration', description: 'Help paint a wall in one room.', rewards: [{ rewardTypeId: 'core-creative', amount: 100 }, { rewardTypeId: 'core-diligence', amount: 50 }], requiresApproval: true, tags: ['home', 'decorating', 'big project'] }),
    createQuest({ icon: '🔧', title: 'Tool Titan', description: 'Organize the toolbox completely.', rewards: [{ rewardTypeId: 'core-diligence', amount: 25 }], tags: ['home', 'organizing'] }),
    createQuest({ icon: '📚', title: 'Bookshelf Balance', description: 'Organize all the books on one bookshelf by color or author.', rewards: [{ rewardTypeId: 'core-diligence', amount: 30 }], tags: ['home', 'organizing'] }),
    createQuest({ icon: '💻', title: 'Cable Conundrum', description: 'Organize the cables behind the TV or a computer desk.', rewards: [{ rewardTypeId: 'core-skill', amount: 20 }], tags: ['home', 'organizing', 'tech'] }),
    createQuest({ icon: '🚪', title: 'The Squeaky Assassin', description: 'Fix a squeaky door hinge with some WD-40 or oil.', rewards: [{ rewardTypeId: 'core-skill', amount: 10 }], tags: ['home', 'chore'] }),
].map(toVenture);

const seasonalVentures = [
    createQuest({ icon: '🍂', title: 'Autumn Assailant', description: 'Rake all the leaves in the front yard.', rewards: [{ rewardTypeId: 'core-strength', amount: 30 }], tags: ['seasonal', 'yardwork', 'autumn'] }),
    createQuest({ icon: '🎃', title: 'Pumpkin Carver', description: 'Carve a pumpkin for Halloween.', rewards: [{ rewardTypeId: 'core-creative', amount: 20 }], tags: ['seasonal', 'holiday', 'autumn'] }),
    createQuest({ icon: '🎄', title: 'Holiday Decorator', description: 'Help decorate the house for the holidays.', rewards: [{ rewardTypeId: 'core-creative', amount: 25 }], requiresApproval: true, tags: ['seasonal', 'holiday', 'winter'] }),
    createQuest({ icon: '❄️', title: 'Snow Shoveler', description: 'Shovel the snow from the driveway and sidewalk.', rewards: [{ rewardTypeId: 'core-strength', amount: 40 }], tags: ['seasonal', 'yardwork', 'winter'] }),
    createQuest({ icon: '🌱', title: 'Spring Sprinter', description: 'Help with spring cleaning in one room.', rewards: [{ rewardTypeId: 'core-diligence', amount: 35 }], tags: ['seasonal', 'chore', 'spring'] }),
    createQuest({ icon: '🌷', title: 'Garden Preparer', description: 'Help prepare the garden for spring planting.', rewards: [{ rewardTypeId: 'core-strength', amount: 25 }], tags: ['seasonal', 'yardwork', 'spring'] }),
    createQuest({ icon: '☀️', title: 'Summer Setup', description: 'Help set up the patio furniture for summer.', rewards: [{ rewardTypeId: 'core-strength', amount: 15 }], tags: ['seasonal', 'home', 'summer'] }),
    createQuest({ icon: '🪟', title: 'Window Gleam', description: 'Wash the outside of the ground-floor windows.', rewards: [{ rewardTypeId: 'core-diligence', amount: 30 }], tags: ['seasonal', 'chore'] }),
    createQuest({ icon: '🚗', title: 'Vehicle Voyage-Ready', description: 'Help wash the family car.', rewards: [{ rewardTypeId: 'core-strength', amount: 25 }], tags: ['seasonal', 'chore'] }),
    createQuest({ icon: '🔥', title: 'Grill Master\'s Assistant', description: 'Help clean the barbecue grill for the season.', rewards: [{ rewardTypeId: 'core-diligence', amount: 20 }], tags: ['seasonal', 'chore'] }),
].map(toVenture);

const selfCareVentures = [
    createQuest({ icon: '🛀', title: 'The Ultimate Soak', description: 'Take a long, relaxing bath or shower with music or a book.', rewards: [{ rewardTypeId: 'core-creative', amount: 15 }], tags: ['self-care', 'relaxation'] }),
    createQuest({ icon: '🧘‍♀️', title: 'Meditation Marathon', description: 'Complete a 15-minute guided meditation session.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['self-care', 'health'] }),
    createQuest({ icon: '📖', title: 'Pleasure Reading', description: 'Read a book for fun (not for school) for 30 minutes straight.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 15 }], tags: ['self-care', 'reading'] }),
    createQuest({ icon: '✍️', title: 'Journal Journey', description: 'Spend 15 minutes writing in a journal about your thoughts or feelings.', rewards: [{ rewardTypeId: 'core-creative', amount: 10 }], tags: ['self-care', 'creative'] }),
    createQuest({ icon: '💆', title: 'Spa Treatment', description: 'Do a face mask or other special skincare routine.', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['self-care', 'health'] }),
    createQuest({ icon: '🎧', title: 'Album Absorption', description: 'Listen to a full music album from start to finish, without distractions.', rewards: [{ rewardTypeId: 'core-creative', amount: 10 }], tags: ['self-care', 'music'] }),
    createQuest({ icon: '🔌', title: 'Digital Detox', description: 'Unplug from all screens and devices for one full hour.', rewards: [{ rewardTypeId: 'core-diligence', amount: 25 }], tags: ['self-care', 'health'] }),
    createQuest({ icon: '🍵', title: 'Tea Ceremony', description: 'Make a cup of herbal tea and enjoy it slowly and mindfully.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 5 }], tags: ['self-care', 'relaxation'] }),
    createQuest({ icon: '😴', title: 'Power Nap', description: 'Take a refreshing 20-minute nap.', rewards: [{ rewardTypeId: 'core-strength', amount: 10 }], tags: ['self-care', 'health'] }),
    createQuest({ icon: '🌳', title: 'Nature\'s Embrace', description: 'Spend 20 minutes sitting quietly in a natural setting, like a park or backyard.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['self-care', 'outdoors'] }),
].map(toVenture);

const digitalDeclutterVentures = [
    createQuest({ icon: '🖥️', title: 'Desktop Domination', description: 'Organize all files and shortcuts on your computer desktop into folders.', rewards: [{ rewardTypeId: 'core-diligence', amount: 20 }], tags: ['digital', 'organizing'] }),
    createQuest({ icon: '📧', title: 'Inbox Zero Initiative', description: 'Clean up your email inbox by archiving or deleting at least 50 emails.', rewards: [{ rewardTypeId: 'core-diligence', amount: 15 }], tags: ['digital', 'organizing'] }),
    createQuest({ icon: '📱', title: 'App Annihilation', description: 'Delete at least 5 old or unused apps from your phone or tablet.', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['digital', 'organizing'] }),
    createQuest({ icon: '🖼️', title: 'Photo Organizer', description: 'Organize all the digital photos from one month into a labeled album.', rewards: [{ rewardTypeId: 'core-diligence', amount: 25 }], requiresApproval: true, tags: ['digital', 'organizing'] }),
    createQuest({ icon: '📰', title: 'Newsletter Neutralizer', description: 'Unsubscribe from 5 email newsletters you no longer read.', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['digital', 'organizing'] }),
    createQuest({ icon: '⌨️', title: 'Keyboard Kleanse', description: 'Clean your computer screen and keyboard.', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['digital', 'cleaning'] }),
    createQuest({ icon: '💾', title: 'The Great Backup', description: 'Back up your important files to a cloud service or external drive.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 20 }], tags: ['digital', 'tech'] }),
    createQuest({ icon: '🔒', title: 'Privacy Protocol', description: 'Review and update your privacy settings on one social media account.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 15 }], tags: ['digital', 'security'] }),
    createQuest({ icon: '🔖', title: 'Bookmark Beautification', description: 'Organize your web browser bookmarks into folders.', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['digital', 'organizing'] }),
    createQuest({ icon: '📸', title: 'Photo Purge', description: 'Delete 20 blurry, duplicate, or bad photos from your phone.', rewards: [{ rewardTypeId: 'core-diligence', amount: 15 }], tags: ['digital', 'organizing'] }),
].map(toVenture);

const creativeCornerVentures = [
    createQuest({ icon: '✍️', title: 'The Storyteller', description: 'Write a short story or poem (at least 100 words).', rewards: [{ rewardTypeId: 'core-creative', amount: 25 }], requiresApproval: true, tags: ['creative', 'writing'] }),
    createQuest({ icon: '🎨', title: 'The Visionary', description: 'Draw or paint a picture of something from your imagination.', rewards: [{ rewardTypeId: 'core-creative', amount: 20 }], tags: ['creative', 'art'] }),
    createQuest({ icon: '🎶', title: 'The Minstrel', description: 'Learn to play a new short song on an instrument.', rewards: [{ rewardTypeId: 'core-skill', amount: 20 }], tags: ['creative', 'music'] }),
    createQuest({ icon: '✂️', title: 'The Collagist', description: 'Create a collage from old magazines, newspapers, or printed pictures.', rewards: [{ rewardTypeId: 'core-creative', amount: 15 }], tags: ['creative', 'art'] }),
    createQuest({ icon: '🎬', title: 'The Director', description: 'Film and edit a short video (at least 30 seconds long).', rewards: [{ rewardTypeId: 'core-skill', amount: 30 }], requiresApproval: true, tags: ['creative', 'tech'] }),
    createQuest({ icon: '🧱', title: 'The Master Builder', description: 'Build something cool and original with LEGOs or other building blocks.', rewards: [{ rewardTypeId: 'core-creative', amount: 15 }], tags: ['creative', 'building'] }),
    createQuest({ icon: '🧑‍🎤', title: 'The Character Creator', description: 'Design a new character, complete with a name, backstory, and drawing.', rewards: [{ rewardTypeId: 'core-creative', amount: 20 }], tags: ['creative', 'art'] }),
    createQuest({ icon: '✒️', title: 'The Calligrapher', description: 'Practice a new style of handwriting or calligraphy for 15 minutes.', rewards: [{ rewardTypeId: 'core-skill', amount: 10 }], tags: ['creative', 'art'] }),
    createQuest({ icon: '💡', title: 'The Inventor', description: 'Come up with an invention and draw a diagram of how it works.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 15 }], tags: ['creative', 'learning'] }),
    createQuest({ icon: '🗺️', title: 'The World-Builder', description: 'Draw a map of a fantasy land with at least 5 named locations.', rewards: [{ rewardTypeId: 'core-creative', amount: 20 }], tags: ['creative', 'art'] }),
].map(toVenture);

const outdoorExplorerVentures = [
    createQuest({ icon: '🧭', title: 'Trailblazer', description: 'Go for a hike on a new trail you haven\'t explored before.', rewards: [{ rewardTypeId: 'core-strength', amount: 30 }], tags: ['outdoors', 'fitness', 'exploration'] }),
    createQuest({ icon: '🧺', title: 'Picnic Perfection', description: 'Plan and have a picnic in a local park.', rewards: [{ rewardTypeId: 'core-creative', amount: 15 }], tags: ['outdoors', 'food'] }),
    createQuest({ icon: '🐦', title: 'Avian Analyst', description: 'Identify and log 5 different types of birds in your area.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 15 }], requiresApproval: true, tags: ['outdoors', 'nature', 'learning'] }),
    createQuest({ icon: '🌇', title: 'Sky Watcher', description: 'Watch the entire sunset or sunrise from a good vantage point.', rewards: [{ rewardTypeId: 'core-creative', amount: 10 }], tags: ['outdoors', 'nature'] }),
    createQuest({ icon: '🗿', title: 'Rock Collector', description: 'Find and collect 3 interesting and unique rocks.', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['outdoors', 'nature'] }),
    createQuest({ icon: '⛺', title: 'Fortress of Foliage', description: 'Build a small fort in the backyard using natural materials.', rewards: [{ rewardTypeId: 'core-creative', amount: 20 }], tags: ['outdoors', 'building'] }),
    createQuest({ icon: '⭐', title: 'Constellation Hunter', description: 'Go stargazing and identify at least one constellation.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 15 }], tags: ['outdoors', 'nature', 'learning'] }),
    createQuest({ icon: '📸', title: 'Nature Photographer', description: 'Take 10 interesting photos of plants, animals, or landscapes.', rewards: [{ rewardTypeId: 'core-creative', amount: 15 }], tags: ['outdoors', 'art'] }),
    createQuest({ icon: '🦋', title: 'Bug Safari', description: 'Find and identify 3 different types of insects.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['outdoors', 'nature'] }),
    createQuest({ icon: '🌊', title: 'Stone Skipper', description: 'Find a body of water and successfully skip a stone at least 3 times.', rewards: [{ rewardTypeId: 'core-skill', amount: 5 }], tags: ['outdoors', 'fun'] }),
].map(toVenture);

const skillUpVentures = [
    createQuest({ icon: '🗣️', title: 'The Polyglot', description: 'Learn to say "hello" and "thank you" in a new language using an online tool.', rewards: [{ rewardTypeId: 'core-skill', amount: 10 }], tags: ['skill', 'learning'] }),
    createQuest({ icon: '🪄', title: 'The Magician', description: 'Watch a tutorial and successfully perform a basic magic trick.', rewards: [{ rewardTypeId: 'core-skill', amount: 15 }], requiresApproval: true, tags: ['skill', 'fun'] }),
    createQuest({ icon: '🪢', title: 'The Knot Master', description: 'Learn how to tie three different useful knots (e.g., bowline, square knot).', rewards: [{ rewardTypeId: 'core-skill', amount: 15 }], tags: ['skill', 'outdoors'] }),
    createQuest({ icon: '🤸‍♂️', title: 'The Juggler', description: 'Practice juggling for 15 minutes.', rewards: [{ rewardTypeId: 'core-skill', amount: 10 }], tags: ['skill', 'fitness'] }),
    createQuest({ icon: '💻', title: 'The Coder', description: 'Complete a one-hour introductory course to a programming language on a free platform.', rewards: [{ rewardTypeId: 'core-skill', amount: 30 }], tags: ['skill', 'tech'] }),
    createQuest({ icon: '🍳', title: 'The Chef', description: 'Learn how to cook a new type of egg (e.g., poached, over easy).', rewards: [{ rewardTypeId: 'core-skill', amount: 10 }], tags: ['skill', 'food'] }),
    createQuest({ icon: '🚲', title: 'The Mechanic', description: 'Learn how to properly clean and oil a bike chain.', rewards: [{ rewardTypeId: 'core-skill', amount: 20 }], tags: ['skill', 'tech'] }),
    createQuest({ icon: '🗺️', title: 'The Cartographer', description: 'Learn to read a compass and a physical map.', rewards: [{ rewardTypeId: 'core-skill', amount: 15 }], tags: ['skill', 'outdoors'] }),
    createQuest({ icon: '📢', title: 'The Public Speaker', description: 'Memorize and recite a short poem or speech (at least 30 seconds).', rewards: [{ rewardTypeId: 'core-skill', amount: 20 }], requiresApproval: true, tags: ['skill', 'social'] }),
    createQuest({ icon: '⌨️', title: 'The Typist', description: 'Take an online typing test and try to improve your WPM.', rewards: [{ rewardTypeId: 'core-skill', amount: 10 }], tags: ['skill', 'tech'] }),
].map(toVenture);

const financialFitnessVentures = [
    createQuest({ icon: '🏦', title: 'Savings Goal', description: 'Create and label a savings jar for a specific goal (e.g., a new toy, a book).', rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['finance', 'planning'] }),
    createQuest({ icon: '🔎', title: 'Price Investigator', description: 'Research the price of a big item you want online and find the best deal from three stores.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 15 }], tags: ['finance', 'planning'] }),
    createQuest({ icon: '📝', title: 'Budget Boss', description: 'With help, create a simple budget for your allowance or gift money.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 20 }], requiresApproval: true, tags: ['finance', 'planning'] }),
    createQuest({ icon: '♻️', title: 'The Upcycler', description: 'Find three items in your home that are no longer used and list them for sale or prepare them for donation.', rewards: [{ rewardTypeId: 'core-diligence', amount: 20 }], tags: ['finance', 'chore'] }),
    createQuest({ icon: '🤔', title: 'Needs vs. Wants', description: 'Make a list of 5 things you "need" and 5 things you "want".', rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['finance', 'planning'] }),
    createQuest({ icon: '🚫', title: 'No-Spend Challenge', description: 'Go a full day without asking to buy anything.', rewards: [{ rewardTypeId: 'core-diligence', amount: 15 }], tags: ['finance'] }),
    createQuest({ icon: '🪙', title: 'Coin Collector', description: 'Gather all the loose change in the house (with permission) and count it.', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['finance'] }),
    createQuest({ icon: '🛒', title: 'Grocery Game', description: 'Help find 5 items on the grocery list at the store.', rewards: [{ rewardTypeId: 'core-skill', amount: 10 }], tags: ['finance', 'chore'] }),
    createQuest({ icon: '📈', title: 'Interest Inquiry', description: 'Watch a short, simple video explaining what "compound interest" is.', rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['finance', 'learning'] }),
    createQuest({ icon: '💸', title: 'The Entrepreneur', description: 'Come up with an idea for a way to earn extra money (e.g., lemonade stand, extra chores).', rewards: [{ rewardTypeId: 'core-creative', amount: 15 }], tags: ['finance', 'planning'] }),
].map(toVenture);

const communityContributorVentures = [
    createQuest({ icon: '🚮', title: 'Park Patrol', description: 'Spend 20 minutes picking up litter in your local park or neighborhood.', rewards: [{ rewardTypeId: 'core-gems', amount: 30 }], requiresApproval: true, tags: ['community', 'volunteer'] }),
    createQuest({ icon: '🤝', title: 'Neighborly Needs', description: 'Offer to help a neighbor with a simple chore (e.g., bring in their trash cans, water a plant).', rewards: [{ rewardTypeId: 'core-gems', amount: 20 }], tags: ['community', 'social'] }),
    createQuest({ icon: '📚', title: 'Library Love', description: 'Donate at least 3 of your old books to a local library or charity.', rewards: [{ rewardTypeId: 'core-gems', amount: 15 }], tags: ['community', 'volunteer'] }),
    createQuest({ icon: '🍪', title: 'First Responder Fuel', description: 'Make baked goods or a thank-you card for your local fire or police station.', rewards: [{ rewardTypeId: 'core-gems', amount: 25 }], requiresApproval: true, tags: ['community', 'creative'] }),
    createQuest({ icon: '👍', title: 'Local Shout-Out', description: 'With a parent, leave a positive online review for a local business you like.', rewards: [{ rewardTypeId: 'core-gems', amount: 10 }], tags: ['community', 'social'] }),
    createQuest({ icon: '💌', title: 'A Note of Thanks', description: 'Write a letter of appreciation to a community helper (e.g., mail carrier, sanitation worker).', rewards: [{ rewardTypeId: 'core-creative', amount: 15 }], tags: ['community', 'creative'] }),
    createQuest({ icon: '🥫', title: 'Food Drive Contribution', description: 'Pick out an item to donate to a local food drive.', rewards: [{ rewardTypeId: 'core-gems', amount: 10 }], tags: ['community', 'volunteer'] }),
    createQuest({ icon: '🐶', title: 'Animal Shelter Aid', description: 'Gather old towels or blankets to donate to an animal shelter.', rewards: [{ rewardTypeId: 'core-diligence', amount: 15 }], tags: ['community', 'volunteer'] }),
    createQuest({ icon: '😊', title: 'Sidewalk Chalk Cheer', description: 'Write positive messages or draw cheerful pictures with chalk on your sidewalk.', rewards: [{ rewardTypeId: 'core-creative', amount: 10 }], tags: ['community', 'creative'] }),
    createQuest({ icon: '🌳', title: 'Tree Tender', description: 'Water a public tree that looks thirsty.', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['community', 'nature'] }),
].map(toVenture);


export const libraryPacks: LibraryPack[] = [
    // --- QUESTS ---
    { id: 'pack-q-morning', type: 'Quests', title: 'Morning Routine', emoji: '☀️', description: 'A set of daily quests to start the day right.', color: DUTY_COLOR, assets: { quests: morningQuests }},
    { id: 'pack-q-kitchen', type: 'Quests', title: 'Kitchen Helper', emoji: '🧑‍🍳', description: 'A collection of kitchen-related chores.', color: DUTY_COLOR, assets: { quests: kitchenQuests }},
    { id: 'pack-q-learning', type: 'Quests', title: 'Learning & Knowledge', emoji: '🧠', description: 'Quests focused on expanding your mind.', color: DUTY_COLOR, assets: { quests: learningQuests }},
    { id: 'pack-q-fitness', type: 'Quests', title: 'Fitness Fun', emoji: '💪', description: 'Get moving with these physical activities.', color: DUTY_COLOR, assets: { quests: fitnessQuests }},
    { id: 'pack-q-petcare', type: 'Quests', title: 'Pet Care Patrol', emoji: '🐾', description: 'Quests for looking after your furry friends.', color: DUTY_COLOR, assets: { quests: petQuests }},
    { id: 'pack-q-homemaintenance', type: 'Quests', title: 'Home Maintenance', emoji: '🏠', description: 'Basic chores for keeping the house in order.', color: DUTY_COLOR, assets: { quests: homeMaintenanceQuests }},
    { id: 'pack-q-evening', type: 'Quests', title: 'Evening Wind-Down', emoji: '🌙', description: 'Quests to end the day peacefully and prepared.', color: DUTY_COLOR, assets: { quests: eveningQuests }},
    { id: 'pack-q-kindness', type: 'Quests', title: 'Kindness Crusade', emoji: '💖', description: 'Quests focused on performing acts of kindness.', color: DUTY_COLOR, assets: { quests: kindnessQuests }},
    { id: 'pack-q-secret', type: 'Quests', title: 'Secret Agent Missions', emoji: '🤫', description: 'Fun, imaginative quests with a spy theme.', color: DUTY_COLOR, assets: { quests: secretAgentQuests }},
    
    // --- VENTURE QUESTS ---
    { id: 'pack-q-home-ventures', type: 'Quests', title: 'Home Improvement Ventures', emoji: '🛠️', description: 'Larger, one-off projects around the house.', color: VENTURE_COLOR, assets: { quests: homeImprovementVentures }},
    { id: 'pack-q-seasonal-ventures', type: 'Quests', title: 'Seasonal Ventures', emoji: '📅', description: 'One-time quests for specific times of the year.', color: VENTURE_COLOR, assets: { quests: seasonalVentures }},
    { id: 'pack-q-selfcare-ventures', type: 'Quests', title: 'Self-Care Spa Day', emoji: '🛀', description: 'One-time quests focused on relaxation and well-being.', color: VENTURE_COLOR, assets: { quests: selfCareVentures }},
    { id: 'pack-q-digital-ventures', type: 'Quests', title: 'Digital Declutter', emoji: '💻', description: 'Ventures for organizing your digital life.', color: VENTURE_COLOR, assets: { quests: digitalDeclutterVentures }},
    { id: 'pack-q-creative-ventures', type: 'Quests', title: 'Creative Corner', emoji: '🎨', description: 'Projects to spark creativity and artistic expression.', color: VENTURE_COLOR, assets: { quests: creativeCornerVentures }},
    { id: 'pack-q-outdoor-ventures', type: 'Quests', title: 'Outdoor Explorer', emoji: '🌲', description: 'Adventures that get you out into nature.', color: VENTURE_COLOR, assets: { quests: outdoorExplorerVentures }},
    { id: 'pack-q-skillup-ventures', type: 'Quests', title: 'Skill-Up Challenge', emoji: '🌟', description: 'Quests focused on learning a new, tangible skill.', color: VENTURE_COLOR, assets: { quests: skillUpVentures }},
    { id: 'pack-q-finance-ventures', type: 'Quests', title: 'Financial Fitness', emoji: '💰', description: 'Ventures about budgeting, saving, and financial literacy.', color: VENTURE_COLOR, assets: { quests: financialFitnessVentures }},
    { id: 'pack-q-community-ventures', type: 'Quests', title: 'Community Contributor', emoji: '🤝', description: 'Quests about volunteering and helping in your community.', color: VENTURE_COLOR, assets: { quests: communityContributorVentures }},
    
    // --- ITEMS ---
    { id: 'pack-i-fantasy', type: 'Items', title: 'Fantasy Starter Items', emoji: '🗡️', description: 'Basic avatar clothing and gear.', color: ITEM_COLOR, assets: { gameAssets: [
        createAsset({ icon: '👕', name: 'Adventurer\'s Tunic', description: 'A simple but sturdy green tunic.', url: 'https://placehold.co/150/166534/FFFFFF?text=Tunic', category: 'Avatar', avatarSlot: 'shirt' }),
        createAsset({ icon: '🎩', name: 'Pointy Wizard Hat', description: 'A classic hat for any aspiring mage.', url: 'https://placehold.co/150/7c3aed/FFFFFF?text=Hat', category: 'Avatar', avatarSlot: 'hat' }),
        createAsset({ icon: '👢', name: 'Worn Leather Boots', description: 'Boots that have seen many roads.', url: 'https://placehold.co/150/a16207/FFFFFF?text=Boots', category: 'Avatar', avatarSlot: 'feet' }),
        createAsset({ icon: '🗡️', name: 'Wooden Training Sword', description: 'A safe sword for practicing your swings.', url: 'https://placehold.co/150/854d0e/FFFFFF?text=Sword', category: 'Avatar', avatarSlot: 'hand-right' }),
        createAsset({ icon: '🛡️', name: 'Round Shield', description: 'A basic shield for fending off pillows.', url: 'https://placehold.co/150/9ca3af/FFFFFF?text=Shield', category: 'Avatar', avatarSlot: 'hand-left' }),
        createAsset({ icon: '🧤', name: 'Leather Gloves', description: 'Protects the hands from splinters.', url: 'https://placehold.co/150/78350f/FFFFFF?text=Gloves', category: 'Avatar', avatarSlot: 'hands' }),
        createAsset({ icon: '🧥', name: 'Traveler\'s Cloak', description: 'A cloak for long journeys.', url: 'https://placehold.co/150/44403c/FFFFFF?text=Cloak', category: 'Avatar', avatarSlot: 'cloak' }),
        createAsset({ icon: '👖', name: 'Simple Trousers', description: 'Comfortable brown trousers.', url: 'https://placehold.co/150/57534e/FFFFFF?text=Pants', category: 'Avatar', avatarSlot: 'pants' }),
        createAsset({ icon: '🎗️', name: 'Adventurer\'s Belt', description: 'A belt with many pouches.', url: 'https://placehold.co/150/4e4a47/FFFFFF?text=Belt', category: 'Avatar', avatarSlot: 'belt' }),
        createAsset({ icon: '🔥', name: 'Torch', description: 'Lights up dark places.', url: 'https://placehold.co/150/f59e0b/000000?text=Torch', category: 'Avatar', avatarSlot: 'hand-left' }),
    ]}},
    { id: 'pack-i-experiences', type: 'Items', title: 'Real-World Reward Items', emoji: '🎉', description: 'Items that can be redeemed for experiences.', color: ITEM_COLOR, assets: { gameAssets: [
        createAsset({ icon: '🎬', name: 'Movie Night Choice', description: 'You get to pick the movie for the next family movie night.', url: 'https://placehold.co/150/f97316/FFFFFF?text=Movie', category: 'Real-World Reward' }),
        createAsset({ icon: '🍕', name: 'Pizza Night Feast', description: 'The family will order pizza for dinner tonight!', url: 'https://placehold.co/150/ef4444/FFFFFF?text=Pizza', category: 'Real-World Reward' }),
        createAsset({ icon: '🍨', name: 'Ice Cream Sundae Trip', description: 'A special trip to get ice cream sundaes.', url: 'https://placehold.co/150/f472b6/FFFFFF?text=Ice+Cream', category: 'Real-World Reward' }),
        createAsset({ icon: '🎮', name: 'One Hour of Gaming', description: 'A voucher for one hour of video games.', url: 'https://placehold.co/150/3b82f6/FFFFFF?text=1+Hour', category: 'Real-World Reward' }),
        createAsset({ icon: '🌙', name: 'Stay Up 30 Mins Late', description: 'Redeem this to stay up 30 minutes past your bedtime.', url: 'https://placehold.co/150/fde047/000000?text=30m', category: 'Real-World Reward' }),
        createAsset({ icon: '🎨', name: 'Art Supply Run', description: 'A trip to the store for new art supplies.', url: 'https://placehold.co/150/8b5cf6/FFFFFF?text=Art', category: 'Real-World Reward' }),
        createAsset({ icon: '📚', name: 'New Book', description: 'Pick out a new book from the bookstore.', url: 'https://placehold.co/150/34d399/FFFFFF?text=Book', category: 'Real-World Reward' }),
        createAsset({ icon: '🎳', name: 'Bowling Night', description: 'A family outing to go bowling.', url: 'https://placehold.co/150/60a5fa/FFFFFF?text=Bowl', category: 'Real-World Reward' }),
        createAsset({ icon: '🏞️', name: 'Choose the Park', description: 'You get to choose which park to visit this weekend.', url: 'https://placehold.co/150/a3e635/FFFFFF?text=Park', category: 'Real-World Reward' }),
        createAsset({ icon: '🧑‍🍳', name: 'Choose Dinner', description: 'You get to choose what\'s for dinner tonight (within reason!).', url: 'https://placehold.co/150/fbbf24/FFFFFF?text=Dinner', category: 'Real-World Reward' }),
    ]}},
    { id: 'pack-i-scifi', type: 'Items', title: 'Sci-Fi Armory Items', emoji: '🤖', description: 'Futuristic avatar gear and companions.', color: ITEM_COLOR, assets: { gameAssets: [
        createAsset({ icon: '🕶️', name: 'Holographic Visor', description: 'A sleek visor for a futuristic look.', url: 'https://placehold.co/150/0ea5e9/FFFFFF?text=Visor', category: 'Avatar', avatarSlot: 'hat' }),
        createAsset({ icon: '🚀', name: 'Jumpsuit', description: 'A standard-issue jumpsuit for any star explorer.', url: 'https://placehold.co/150/64748b/FFFFFF?text=Suit', category: 'Avatar', avatarSlot: 'shirt' }),
        createAsset({ icon: '🔫', name: 'Laser Blaster', description: 'A toy laser blaster. Pew pew! (Cosmetic)', url: 'https://placehold.co/150/ec4899/FFFFFF?text=Laser', category: 'Avatar', avatarSlot: 'hand-right' }),
        createAsset({ icon: '🤖', name: 'Gravity Boots', description: 'Magnetic boots for walking on starship hulls.', url: 'https://placehold.co/150/4f46e5/FFFFFF?text=Boots', category: 'Avatar', avatarSlot: 'feet' }),
        createAsset({ icon: '🛸', name: 'Robot Companion', description: 'A small, floating robot that follows you.', url: 'https://placehold.co/150/eab308/FFFFFF?text=Bot', category: 'Pet' }),
        createAsset({ icon: '✨', name: 'Energy Shield', description: 'A shimmering personal energy shield. (Cosmetic)', url: 'https://placehold.co/150/93c5fd/000000?text=Shield', category: 'Avatar', avatarSlot: 'hand-left' }),
        createAsset({ icon: '🔌', name: 'Cybernetic Arm', description: 'A cool robotic arm replacement. (Cosmetic)', url: 'https://placehold.co/150/a3a3a3/FFFFFF?text=Arm', category: 'Avatar', avatarSlot: 'hand-right' }),
        createAsset({ icon: '🪖', name: 'Explorer Helmet', description: 'A helmet for exploring alien worlds.', url: 'https://placehold.co/150/d1d5db/000000?text=Helmet', category: 'Avatar', avatarSlot: 'hat' }),
        createAsset({ icon: '🔋', name: 'Power Pack', description: 'A backpack that powers your gear.', url: 'https://placehold.co/150/e11d48/FFFFFF?text=Pack', category: 'Avatar', avatarSlot: 'back' }),
        createAsset({ icon: '🛰️', name: 'Jetpack', description: 'For short bursts of flight. (Cosmetic)', url: 'https://placehold.co/150/f43f5e/FFFFFF?text=Jetpack', category: 'Avatar', avatarSlot: 'back' }),
    ]}},
    // ... 6 more item packs
    { id: 'pack-i-potions', type: 'Items', title: 'Alchemist\'s Potions', emoji: '⚗️', description: 'Cosmetic potions for your avatar.', color: ITEM_COLOR, assets: { gameAssets: [
        createAsset({ icon: '❤️‍🩹', name: 'Health Potion', description: 'A classic red potion. (Cosmetic)', url: 'https://placehold.co/150/ef4444/FFFFFF?text=HP', category: 'Consumable' }),
        createAsset({ icon: '💙', name: 'Mana Potion', description: 'A swirling blue elixir. (Cosmetic)', url: 'https://placehold.co/150/3b82f6/FFFFFF?text=MP', category: 'Consumable' }),
        createAsset({ icon: '💨', name: 'Invisibility Potion', description: 'A clear, bubbling liquid. (Cosmetic)', url: 'https://placehold.co/150/a8a29e/FFFFFF?text=INVIS', category: 'Consumable' }),
        createAsset({ icon: '🍀', name: 'Luck Potion', description: 'A shimmering golden brew. (Cosmetic)', url: 'https://placehold.co/150/eab308/FFFFFF?text=LCK', category: 'Consumable' }),
        createAsset({ icon: '🔋', name: 'Stamina Potion', description: 'A vibrant green concoction. (Cosmetic)', url: 'https://placehold.co/150/22c55e/FFFFFF?text=STM', category: 'Consumable' }),
        createAsset({ icon: '🧠', name: 'Wisdom Elixir', description: 'A purple potion that makes you feel smarter.', url: 'https://placehold.co/150/8b5cf6/FFFFFF?text=WIS', category: 'Consumable' }),
        createAsset({ icon: '💪', name: 'Strength Draught', description: 'An orange potion that makes you feel stronger.', url: 'https://placehold.co/150/f97316/FFFFFF?text=STR', category: 'Consumable' }),
        createAsset({ icon: '🏃', name: 'Haste Tincture', description: 'A yellow potion that makes you feel faster.', url: 'https://placehold.co/150/facc15/FFFFFF?text=HASTE', category: 'Consumable' }),
        createAsset({ icon: '🐢', name: 'Stoneskin Brew', description: 'A grey potion that makes you feel tougher.', url: 'https://placehold.co/150/6b7280/FFFFFF?text=DEF', category: 'Consumable' }),
        createAsset({ icon: '🤢', name: 'Noxious Vial', description: 'A questionable green potion. What does it do?', url: 'https://placehold.co/150/84cc16/FFFFFF?text=%3F%3F%3F', category: 'Consumable' }),
    ]}},
    { id: 'pack-i-seasonal', type: 'Items', title: 'Seasonal Items', emoji: '🎃', description: 'Cosmetic items for various holidays and seasons.', color: ITEM_COLOR, assets: { gameAssets: [
        createAsset({ icon: '🎅', name: 'Santa Hat', description: 'A festive red and white hat.', url: 'https://placehold.co/150/dc2626/FFFFFF?text=Santa', category: 'Avatar', avatarSlot: 'hat' }),
        createAsset({ icon: '🐰', name: 'Bunny Ears', description: 'A pair of floppy bunny ears.', url: 'https://placehold.co/150/fbcfe8/FFFFFF?text=Ears', category: 'Avatar', avatarSlot: 'hat' }),
        createAsset({ icon: '👻', name: 'Spooky Ghost Sheet', description: 'A classic ghost costume.', url: 'https://placehold.co/150/f1f5f9/000000?text=Ghost', category: 'Avatar', avatarSlot: 'cloak' }),
        createAsset({ icon: '💖', name: 'Heart-Shaped Glasses', description: 'Rose-tinted glasses for a lovely look.', url: 'https://placehold.co/150/f472b6/FFFFFF?text=Heart', category: 'Avatar', avatarSlot: 'face' }),
        createAsset({ icon: '🦃', name: 'Turkey Hat', description: 'A silly hat that looks like a turkey.', url: 'https://placehold.co/150/854d0e/FFFFFF?text=Turkey', category: 'Avatar', avatarSlot: 'hat' }),
        createAsset({ icon: '🎃', name: 'Jack-o\'-Lantern Head', description: 'A spooky pumpkin helmet.', url: 'https://placehold.co/150/f97316/000000?text=Pumpkin', category: 'Avatar', avatarSlot: 'hat' }),
        createAsset({ icon: '☘️', name: 'Shamrock Clover', description: 'A lucky four-leaf clover to hold.', url: 'https://placehold.co/150/4ade80/FFFFFF?text=Clover', category: 'Avatar', avatarSlot: 'hand-left' }),
        createAsset({ icon: '🎇', name: 'Sparkler', description: 'A festive sparkler for celebrations.', url: 'https://placehold.co/150/fef08a/000000?text=Sparkle', category: 'Avatar', avatarSlot: 'hand-right' }),
        createAsset({ icon: '🍂', name: 'Autumn Leaf Crown', description: 'A crown made of colorful autumn leaves.', url: 'https://placehold.co/150/d97706/FFFFFF?text=Leaves', category: 'Avatar', avatarSlot: 'hat' }),
        createAsset({ icon: '❄️', name: 'Snowflake Wand', description: 'A magical wand that summons flurries.', url: 'https://placehold.co/150/7dd3fc/FFFFFF?text=Snow', category: 'Avatar', avatarSlot: 'hand-right' }),
    ]}},
    { id: 'pack-i-pets', type: 'Items', title: 'Creature Companion Items', emoji: '🐲', description: 'A variety of cute cosmetic pets.', color: ITEM_COLOR, assets: { gameAssets: [
        createAsset({ icon: '🐲', name: 'Tiny Dragon', description: 'A small, friendly dragon.', url: 'https://placehold.co/150/4ade80/FFFFFF?text=Dragon', category: 'Pet' }),
        createAsset({ icon: '🎐', name: 'Floating Jellyfish', description: 'A glowing, ethereal jellyfish.', url: 'https://placehold.co/150/818cf8/FFFFFF?text=Jelly', category: 'Pet' }),
        createAsset({ icon: '😾', name: 'Grumpy Cat', description: 'A perpetually unimpressed feline friend.', url: 'https://placehold.co/150/a8a29e/FFFFFF?text=Cat', category: 'Pet' }),
        createAsset({ icon: '🦜', name: 'Shoulder Parrot', description: 'A colorful parrot to sit on your shoulder.', url: 'https://placehold.co/150/ef4444/FFFFFF?text=Parrot', category: 'Pet' }),
        createAsset({ icon: '🗿', name: 'Rock Golem', description: 'A small, sturdy rock golem.', url: 'https://placehold.co/150/78716c/FFFFFF?text=Golem', category: 'Pet' }),
        createAsset({ icon: '🦊', name: 'Fox Kit', description: 'A clever and quick little fox.', url: 'https://placehold.co/150/f97316/FFFFFF?text=Fox', category: 'Pet' }),
        createAsset({ icon: '🦉', name: 'Wise Owl', description: 'A wise old owl that hoots knowledgeably.', url: 'https://placehold.co/150/a16207/FFFFFF?text=Owl', category: 'Pet' }),
        createAsset({ icon: '🐢', name: 'Ancient Turtle', description: 'A very, very old and slow turtle.', url: 'https://placehold.co/150/166534/FFFFFF?text=Turtle', category: 'Pet' }),
        createAsset({ icon: '🦋', name: 'Monarch Butterfly', description: 'A beautiful butterfly that flutters around you.', url: 'https://placehold.co/150/f59e0b/FFFFFF?text=Butterfly', category: 'Pet' }),
        createAsset({ icon: '🦄', name: 'Miniature Unicorn', description: 'A tiny, magical unicorn.', url: 'https://placehold.co/150/ec4899/FFFFFF?text=Unicorn', category: 'Pet' }),
    ]}},
    { id: 'pack-i-music', type: 'Items', title: 'Musical Instruments', emoji: '🎸', description: 'A collection of cosmetic musical instruments.', color: ITEM_COLOR, assets: { gameAssets: [
        createAsset({ icon: '🎸', name: 'Acoustic Guitar', url: 'https://placehold.co/150/a16207/FFFFFF?text=Guitar', category: 'Avatar', avatarSlot: 'back' }),
        createAsset({ icon: '🎻', name: 'Violin', url: 'https://placehold.co/150/854d0e/FFFFFF?text=Violin', category: 'Avatar', avatarSlot: 'hand-left' }),
        createAsset({ icon: '🥁', name: 'Bongo Drums', url: 'https://placehold.co/150/78350f/FFFFFF?text=Bongos', category: 'Avatar', avatarSlot: 'belt' }),
        createAsset({ icon: '🎺', name: 'Trumpet', url: 'https://placehold.co/150/facc15/FFFFFF?text=Trumpet', category: 'Avatar', avatarSlot: 'hand-right' }),
        createAsset({ icon: '🎹', name: 'Keytar', url: 'https://placehold.co/150/f87171/FFFFFF?text=Keytar', category: 'Avatar', avatarSlot: 'back' }),
        createAsset({ icon: '🎷', name: 'Saxophone', url: 'https://placehold.co/150/fbbf24/FFFFFF?text=Sax', category: 'Avatar', avatarSlot: 'hand-right' }),
        createAsset({ icon: '🎤', name: 'Microphone', url: 'https://placehold.co/150/d1d5db/000000?text=Mic', category: 'Avatar', avatarSlot: 'hand-left' }),
        createAsset({ icon: '🪕', name: 'Banjo', url: 'https://placehold.co/150/ca8a04/FFFFFF?text=Banjo', category: 'Avatar', avatarSlot: 'back' }),
        createAsset({ icon: '🎵', name: 'Floating Music Notes', url: 'https://placehold.co/150/a78bfa/000000?text=Notes', category: 'Pet' }),
        createAsset({ icon: '🎧', name: 'Musician\'s Headphones', url: 'https://placehold.co/150/4b5563/FFFFFF?text=Phones', category: 'Avatar', avatarSlot: 'hat' }),
    ]}},
    { id: 'pack-i-gardening', type: 'Items', title: 'Gardening Supplies', emoji: '🌻', description: 'Tools and accessories for the green-thumbed adventurer.', color: ITEM_COLOR, assets: { gameAssets: [
        createAsset({ icon: '🌱', name: 'Potted Sapling', url: 'https://placehold.co/150/84cc16/000000?text=Sapling', category: 'Avatar', avatarSlot: 'hand-left' }),
        createAsset({ icon: '🧤', name: 'Gardening Gloves', url: 'https://placehold.co/150/22c55e/FFFFFF?text=Gloves', category: 'Avatar', avatarSlot: 'hands' }),
        createAsset({ icon: '👒', name: 'Straw Hat', url: 'https://placehold.co/150/fde047/000000?text=Hat', category: 'Avatar', avatarSlot: 'hat' }),
        createAsset({ icon: '🥕', name: 'Freshly Picked Carrot', url: 'https://placehold.co/150/f97316/FFFFFF?text=Carrot', category: 'Avatar', avatarSlot: 'hand-right' }),
        createAsset({ icon: '💧', name: 'Watering Can', url: 'https://placehold.co/150/60a5fa/FFFFFF?text=Water', category: 'Avatar', avatarSlot: 'hand-left' }),
        createAsset({ icon: '🌻', name: 'Sunflower Pin', url: 'https://placehold.co/150/facc15/000000?text=Pin', category: 'Avatar', avatarSlot: 'shirt-pin' }),
        createAsset({ icon: '🍓', name: 'Basket of Berries', url: 'https://placehold.co/150/ef4444/FFFFFF?text=Berries', category: 'Avatar', avatarSlot: 'hand-left' }),
        createAsset({ icon: '🌷', name: 'Bouquet of Tulips', url: 'https://placehold.co/150/f472b6/FFFFFF?text=Tulips', category: 'Avatar', avatarSlot: 'hand-right' }),
        createAsset({ icon: '🌿', name: 'Herb Pouch', url: 'https://placehold.co/150/166534/FFFFFF?text=Herbs', category: 'Avatar', avatarSlot: 'belt' }),
        createAsset({ icon: '🌳', name: 'Nature Spirit', url: 'https://placehold.co/150/4ade80/000000?text=Spirit', category: 'Pet' }),
    ]}},
    { id: 'pack-i-magic', type: 'Items', title: 'Magical Artifacts', emoji: '✨', description: 'Powerful-looking (but cosmetic) magical items.', color: ITEM_COLOR, assets: { gameAssets: [
        createAsset({ icon: '🔮', name: 'Crystal Ball', url: 'https://placehold.co/150/a78bfa/FFFFFF?text=Orb', category: 'Avatar', avatarSlot: 'hand-left' }),
        createAsset({ icon: '📜', name: 'Ancient Scroll', url: 'https://placehold.co/150/f5e9c9/000000?text=Scroll', category: 'Avatar', avatarSlot: 'hand-right' }),
        createAsset({ icon: '📖', name: 'Spellbook', url: 'https://placehold.co/150/4f46e5/FFFFFF?text=Book', category: 'Avatar', avatarSlot: 'hand-left' }),
        createAsset({ icon: '✨', name: 'Magic Wand', url: 'https://placehold.co/150/fde047/000000?text=Wand', category: 'Avatar', avatarSlot: 'hand-right' }),
        createAsset({ icon: '💍', name: 'Ring of Power', url: 'https://placehold.co/150/facc15/000000?text=Ring', category: 'Avatar', avatarSlot: 'ring' }),
        createAsset({ icon: '💎', name: 'Floating Gemstone', url: 'https://placehold.co/150/3b82f6/FFFFFF?text=Gem', category: 'Pet' }),
        createAsset({ icon: '☀️', name: 'Amulet of the Sun', url: 'https://placehold.co/150/f59e0b/FFFFFF?text=Amulet', category: 'Avatar', avatarSlot: 'necklace' }),
        createAsset({ icon: '🌙', name: 'Staff of the Moon', url: 'https://placehold.co/150/d1d5db/000000?text=Staff', category: 'Avatar', avatarSlot: 'hand-right' }),
        createAsset({ icon: '⚡', name: 'Lightning Bolt', description: 'A captured bolt of lightning.', url: 'https://placehold.co/150/fef08a/000000?text=Bolt', category: 'Avatar', avatarSlot: 'hand-right' }),
        createAsset({ icon: '🌪️', name: 'Tome of Storms', description: 'A book filled with stormy magic.', url: 'https://placehold.co/150/64748b/FFFFFF?text=Tome', category: 'Avatar', avatarSlot: 'hand-left' }),
    ]}},
    
    // --- MARKETS ---
    // (9 total)
    { id: 'pack-m-fantasy-starter', type: 'Markets', title: 'Fantasy Starter Market', emoji: '👕', description: 'An outfitter market for new heroes.', color: MARKET_COLOR, assets: { markets: [createMarket({ id: 'market-fantasy-starter', title: 'The Adventurer\'s Outfitter', description: 'Gear for new heroes.', icon: '👕'})] }},
    { id: 'pack-m-experiences', type: 'Markets', title: 'Real-World Rewards Market', emoji: '🎟️', description: 'A market for cashing in points for fun family experiences.', color: MARKET_COLOR, assets: { markets: [createMarket({ id: 'market-experiences', title: 'The Treasury of Fun', description: 'Spend your gems on memorable experiences.', icon: '🎬'})] }},
    { id: 'pack-m-scifi-armory', type: 'Markets', title: 'Sci-Fi Armory Market', emoji: '🔫', description: 'A market for futuristic avatar gear and companions.', color: MARKET_COLOR, assets: { markets: [createMarket({ id: 'market-scifi-armory', title: 'Starship Outfitters', description: 'Gear for the final frontier.', icon: '🚀'})] }},
    { id: 'pack-m-potion-shop', type: 'Markets', title: 'Alchemist\'s Potion Market', emoji: '🧪', description: 'A market selling cosmetic potions.', color: MARKET_COLOR, assets: { markets: [createMarket({ id: 'market-potions', title: 'The Bubbling Cauldron', description: 'Potions that add flair to your avatar.', icon: '⚗️'})] }},
    { id: 'pack-m-seasonal', type: 'Markets', title: 'Seasonal Market', emoji: '🍂', description: 'A market for holidays and seasons.', color: MARKET_COLOR, assets: { markets: [createMarket({ id: 'market-seasonal', title: 'The Holiday Stall', description: 'Festive gear for every occasion!', icon: '🎃'})] }},
    { id: 'pack-m-pet-shop', type: 'Markets', title: 'Creature Companion Market', emoji: '🐶', description: 'A place to adopt cosmetic pets.', color: MARKET_COLOR, assets: { markets: [createMarket({ id: 'market-pets', title: 'The Cuddly Companion', description: 'Adopt a friend for your adventures!', icon: '🐾'})] }},
    { id: 'pack-m-music', type: 'Markets', title: 'Musician\'s Corner', emoji: '🎶', description: 'For all your musical needs.', color: MARKET_COLOR, assets: { markets: [createMarket({ id: 'market-music', title: 'The Bard\'s Stage', description: 'Instruments and musical flair.', icon: '🎵'})] }},
    { id: 'pack-m-gardening', type: 'Markets', title: 'Gardening Guild Market', emoji: '🌱', description: 'Supplies for the aspiring gardener.', color: MARKET_COLOR, assets: { markets: [createMarket({ id: 'market-gardening', title: 'The Green Thumb', description: 'Tools and plants for your garden.', icon: '🌻'})] }},
    { id: 'pack-m-magic', type: 'Markets', title: 'Magic & Artifacts Shop', emoji: '🔮', description: 'A shop for powerful and mysterious items.', color: MARKET_COLOR, assets: { markets: [createMarket({ id: 'market-magic', title: 'The Enchanter\'s Study', description: 'Wands, tomes, and artifacts of power.', icon: '✨'})] }},

    // --- TROPHIES ---
    // (9 total)
    { id: 'pack-t-milestones', type: 'Trophies', title: 'Milestone Trophies', emoji: '🏆', description: 'A set of trophies for reaching key milestones.', color: TROPHY_COLOR, assets: { trophies: [
        createTrophy({ name: 'First Quest Complete', description: 'Awarded for completing your very first quest.', icon: '🎉' }),
        createTrophy({ name: 'The Librarian', description: 'Awarded for reading 10 books.', icon: '📚' }),
        createTrophy({ name: 'Master of Chores', description: 'Awarded for completing 100 chores.', icon: '🧹' }),
        createTrophy({ name: 'Wealthy Adventurer', description: 'Awarded for earning a total of 1000 Gold.', icon: '👑' }),
        createTrophy({ name: 'The Mentor', description: 'Awarded for helping another user complete a quest.', icon: '🤝' }),
        createTrophy({ name: 'Apprentice', description: 'Reach the rank of Apprentice.', icon: '🛠️' }),
        createTrophy({ name: 'Journeyman', description: 'Reach the rank of Journeyman.', icon: '🧭' }),
        createTrophy({ name: 'Adept', description: 'Reach the rank of Adept.', icon: '🔥' }),
        createTrophy({ name: 'First Purchase', description: 'Make your first purchase from a market.', icon: '💰' }),
        createTrophy({ name: 'Guild Member', description: 'Join your first guild.', icon: '🏰' }),
    ]}},
    { id: 'pack-t-creative', type: 'Trophies', title: 'Creative Achievements', emoji: '🎨', description: 'Awards for creative and artistic endeavors.', color: TROPHY_COLOR, assets: { trophies: [
        createTrophy({ name: 'The Artist', description: 'For creating a masterpiece of art.', icon: '🎨' }),
        createTrophy({ name: 'The Bard', description: 'For a wonderful musical performance.', icon: '🎵' }),
        createTrophy({ name: 'The Architect', description: 'For building an impressive creation (LEGOs, Minecraft, etc).', icon: '🏰' }),
        createTrophy({ name: 'The Scribe', description: 'For writing a creative story or poem.', icon: '✍️' }),
        createTrophy({ name: 'The Inventor', description: 'For coming up with a clever solution to a problem.', icon: '💡' }),
        createTrophy({ name: 'The Director', description: 'For creating and editing a video.', icon: '🎬' }),
        createTrophy({ name: 'The Designer', description: 'For designing a unique avatar outfit.', icon: '🧑‍🎤' }),
        createTrophy({ name: 'The Photographer', description: 'For taking a beautiful photograph.', icon: '📷' }),
        createTrophy({ name: 'The Coder', description: 'For writing your first computer program.', icon: '💻' }),
        createTrophy({ name: 'The Dancer', description: 'For performing a dance routine.', icon: '🕺' }),
    ]}},
    { id: 'pack-t-sports', type: 'Trophies', title: 'Sports Champion', emoji: '🏅', description: 'Awards for athletic achievements and sportsmanship.', color: TROPHY_COLOR, assets: { trophies: [
        createTrophy({ name: 'Team Player', description: 'For excellent teamwork in a game.', icon: '🏅' }),
        createTrophy({ name: 'Personal Best', description: 'For beating your own record.', icon: '📈' }),
        createTrophy({ name: 'Tournament Victor', description: 'For winning a tournament.', icon: '🥇' }),
        createTrophy({ name: 'Good Sport', description: 'For showing great sportsmanship, win or lose.', icon: '🤝' }),
        createTrophy({ name: 'Practice Pays Off', description: 'For mastering a new skill through practice.', icon: '🎯' }),
        createTrophy({ name: 'The Cyclist', description: 'For completing a 10-mile bike ride.', icon: '🚲' }),
        createTrophy({ name: 'The Swimmer', description: 'For swimming 10 laps.', icon: '🏊' }),
        createTrophy({ name: 'The Runner', description: 'For running a full mile without stopping.', icon: '🏃' }),
        createTrophy({ name: 'The Hiker', description: 'For completing a 5-mile hike.', icon: '🏔️' }),
        createTrophy({ name: 'Most Valuable Player', description: 'Awarded for being the MVP of a game.', icon: '⭐' }),
    ]}},
    { id: 'pack-t-household', type: 'Trophies', title: 'Household Hero', emoji: '🦸', description: 'Awards for being a great help around the house.', color: TROPHY_COLOR, assets: { trophies: [
        createTrophy({ name: 'Master of the Mop', description: 'For mopping the floors to a sparkling shine.', icon: '✨' }),
        createTrophy({ name: 'Laundry Lord', description: 'For washing, drying, and folding 5 loads of laundry.', icon: '🧺' }),
        createTrophy({ name: 'The Green Thumb', description: 'For keeping a plant alive for a month.', icon: '🪴' }),
        createTrophy({ name: 'The Organizer', description: 'For decluttering a messy drawer or closet.', icon: '🗂️' }),
        createTrophy({ name: 'The Recycler', description: 'For consistently sorting the recycling correctly.', icon: '♻️' }),
        createTrophy({ name: 'The Chef', description: 'For cooking a meal for the family.', icon: '🧑‍🍳' }),
        createTrophy({ name: 'The Cleaner', description: 'For deep cleaning a room.', icon: '🧹' }),
        createTrophy({ name: 'The Repairman', description: 'For fixing something that was broken.', icon: '🛠️' }),
        createTrophy({ name: 'The Pet Pal', description: 'For taking excellent care of a pet.', icon: '🐾' }),
        createTrophy({ name: 'The Dust Slayer', description: 'For dusting the entire house.', icon: '🌬️' }),
    ]}},
    { id: 'pack-t-explorer', type: 'Trophies', title: 'Explorer Guild Awards', emoji: '🧭', description: 'For those who venture into the unknown.', color: TROPHY_COLOR, assets: { trophies: [
        createTrophy({ name: 'Pathfinder', description: 'For exploring a new park or trail.', icon: '🗺️' }),
        createTrophy({ name: 'Gourmand', description: 'For trying a new type of food.', icon: '🍜' }),
        createTrophy({ name: 'The Linguist', description: 'For learning to say "hello" in five new languages.', icon: '🗣️' }),
        createTrophy({ name: 'Fearless', description: 'For trying an activity that scared you.', icon: '🧗' }),
        createTrophy({ name: 'The Naturalist', description: 'For identifying 5 native plants or animals.', icon: '🌲' }),
        createTrophy({ name: 'The Stargazer', description: 'For identifying a constellation.', icon: '🔭' }),
        createTrophy({ name: 'The Historian', description: 'For visiting a museum or historical site.', icon: '🏛️' }),
        createTrophy({ name: 'The Geologist', description: 'For finding and identifying an interesting rock.', icon: '🗿' }),
        createTrophy({ name: 'The Entomologist', description: 'For catching and identifying an insect.', icon: '🦋' }),
        createTrophy({ name: 'The Urban Explorer', description: 'For visiting a new part of your city.', icon: '🏙️' }),
    ]}},
    { id: 'pack-t-social', type: 'Trophies', title: 'Social Butterfly', emoji: '🦋', description: 'Awards for positive social interactions.', color: TROPHY_COLOR, assets: { trophies: [
        createTrophy({ name: 'The Diplomat', description: 'For resolving a conflict peacefully.', icon: '🤝' }),
        createTrophy({ name: 'The Comedian', description: 'For making the whole group laugh.', icon: '😂' }),
        createTrophy({ name: 'The Encourager', description: 'For cheering someone up when they were sad.', icon: '🤗' }),
        createTrophy({ name: 'The Listener', description: 'For being a good listener.', icon: '👂' }),
        createTrophy({ name: 'The Host', description: 'For hosting a fun get-together.', icon: '🎉' }),
        createTrophy({ name: 'The Pen Pal', description: 'For writing a letter to a friend or family member.', icon: '💌' }),
        createTrophy({ name: 'The Giver', description: 'For giving a thoughtful gift.', icon: '🎁' }),
        createTrophy({ name: 'The Helper', description: 'For helping someone without being asked.', icon: '🙌' }),
        createTrophy({ name: 'The Collaborator', description: 'For working well with others on a project.', icon: '🧑‍🤝‍🧑' }),
        createTrophy({ name: 'The Welcomer', description: 'For making a new person feel welcome.', icon: '👋' }),
    ]}},
    { id: 'pack-t-gaming', type: 'Trophies', title: 'Gaming Achievements', emoji: '🎮', description: 'Trophies for video game accomplishments.', color: TROPHY_COLOR, assets: { trophies: [
        createTrophy({ name: 'Speed Runner', description: 'For beating a game level in record time.', icon: '⏱️' }),
        createTrophy({ name: 'Completionist', description: 'For finding all secrets in a game.', icon: '💯' }),
        createTrophy({ name: 'Boss Slayer', description: 'For defeating a difficult boss.', icon: '💀' }),
        createTrophy({ name: 'High Score', description: 'For getting the high score in an arcade-style game.', icon: '👾' }),
        createTrophy({ name: 'The Strategist', description: 'For winning a strategy game.', icon: '♟️' }),
        createTrophy({ name: 'The Racer', description: 'For getting first place in a racing game.', icon: '🏎️' }),
        createTrophy({ name: 'The Survivor', description: 'For winning a battle royale game.', icon: '🛡️' }),
        createTrophy({ name: 'The Builder', description: 'For building an epic structure in a sandbox game.', icon: '🧱' }),
        createTrophy({ name: 'The Farmer', description: 'For having a successful farm in a farming sim.', icon: '🧑‍🌾' }),
        createTrophy({ name: 'The Co-op King', description: 'For completing a co-op campaign with a friend.', icon: '🎮' }),
    ]}},
    { id: 'pack-t-school', type: 'Trophies', title: 'Academic Awards', emoji: '🎓', description: 'For achievements related to school.', color: TROPHY_COLOR, assets: { trophies: [
        createTrophy({ name: 'Honor Roll', description: 'For getting straight A\'s on a report card.', icon: '🅰️' }),
        createTrophy({ name: 'Perfect Attendance', description: 'For not missing a single day of school.', icon: '🗓️' }),
        createTrophy({ name: 'Science Fair Winner', description: 'For winning a prize at the science fair.', icon: '🥇' }),
        createTrophy({ name: 'Spelling Bee Champ', description: 'For winning the spelling bee.', icon: '🐝' }),
        createTrophy({ name: 'Book Worm', description: 'For reading 25 books in a school year.', icon: '🐛' }),
        createTrophy({ name: 'Mathlete', description: 'For excellence in a math competition.', icon: '🧮' }),
        createTrophy({ name: 'History Buff', description: 'For acing a history project.', icon: '📜' }),
        createTrophy({ name: 'Class President', description: 'For being elected class president.', icon: '🏛️' }),
        createTrophy({ name: 'The Orator', description: 'For giving a great class presentation.', icon: '🎤' }),
        createTrophy({ name: 'The Poet', description: 'For having a poem published in the school literary magazine.', icon: '✒️' }),
    ]}},
    { id: 'pack-t-funny', type: 'Trophies', title: 'Funny & Silly Awards', emoji: '🤪', description: 'Just for fun awards.', color: TROPHY_COLOR, assets: { trophies: [
        createTrophy({ name: 'The Punisher', description: 'For telling an exceptionally great (or terrible) pun.', icon: '😂' }),
        createTrophy({ name: 'Klutz of the Week', description: 'For a spectacular, harmless trip or fall.', icon: '🤕' }),
        createTrophy({ name: 'Bed Head', description: 'For having the most epic bed head one morning.', icon: '🛌' }),
        createTrophy({ name: 'The Snorter', description: 'For laughing so hard you snorted.', icon: '🐽' }),
        createTrophy({ name: 'Brain Fart', description: 'For a truly memorable moment of forgetfulness.', icon: '💨' }),
        createTrophy({ name: 'The Snackinator', description: 'For impressively finishing a bag of snacks.', icon: '🍿' }),
        createTrophy({ name: 'Socks with Sandals', description: 'For committing this brave fashion crime.', icon: '🧦' }),
        createTrophy({ name: 'The Drama Llama', description: 'For an award-worthy dramatic performance over something small.', icon: '🎭' }),
        createTrophy({ name: 'The Human Megaphone', description: 'For being heard from several rooms away.', icon: '📢' }),
        createTrophy({ name: 'The Slowpoke', description: 'For being the last one ready to leave.', icon: '🐢' }),
    ]}},

    // --- REWARDS ---
    // (9 total)
    { id: 'pack-r-crafting', type: 'Rewards', title: 'Crafting Materials', emoji: '🛠️', description: 'A set of currencies themed around crafting materials.', color: REWARD_COLOR, assets: { rewardTypes: [
        createReward({ name: 'Iron Ore', description: 'Used for crafting metal items.', category: RewardCategory.Currency, icon: '🌑' }),
        createReward({ name: 'Ancient Wood', description: 'Sturdy wood from elder trees.', category: RewardCategory.Currency, icon: '🪵' }),
        createReward({ name: 'Mystic Silk', description: 'Shimmering silk spun by magical creatures.', category: RewardCategory.Currency, icon: '🕸️' }),
        createReward({ name: 'Stardust', description: 'Sparkling dust with latent magic.', category: RewardCategory.Currency, icon: '✨' }),
        createReward({ name: 'Dragon Scale', description: 'A rare and durable crafting material.', category: RewardCategory.Currency, icon: '🐉' }),
        createReward({ name: 'Monster Claw', description: 'A sharp claw from a defeated beast.', category: RewardCategory.Currency, icon: '爪' }),
        createReward({ name: 'Glimmering Gem', description: 'An uncut gem with potential.', category: RewardCategory.Currency, icon: '💎' }),
        createReward({ name: 'Enchanted Leather', description: 'Leather imbued with minor magic.', category: RewardCategory.Currency, icon: '📜' }),
        createReward({ name: 'Phoenix Feather', description: 'A feather that glows with warmth.', category: RewardCategory.Currency, icon: '🪶' }),
        createReward({ name: 'Shadow Essence', description: 'A mysterious, dark essence.', category: RewardCategory.Currency, icon: '⚫' }),
    ]}},
    { id: 'pack-r-social', type: 'Rewards', title: 'Social XP Types', emoji: '💬', description: 'A set of XP types for rewarding positive social behaviors.', color: REWARD_COLOR, assets: { rewardTypes: [
        createReward({ name: 'Reputation', description: 'XP gained from honorable deeds.', category: RewardCategory.XP, icon: '🌟' }),
        createReward({ name: 'Kindness', description: 'XP from helping others.', category: RewardCategory.XP, icon: '💖' }),
        createReward({ name: 'Teamwork', description: 'XP earned by working with your guild.', category: RewardCategory.XP, icon: '🤝' }),
        createReward({ name: 'Leadership', description: 'XP gained from leading a successful venture.', category: RewardCategory.XP, icon: '👑' }),
        createReward({ name: 'Humor', description: 'XP for making someone laugh.', category: RewardCategory.XP, icon: '😂' }),
        createReward({ name: 'Diplomacy', description: 'XP for resolving arguments.', category: RewardCategory.XP, icon: '🕊️' }),
        createReward({ name: 'Generosity', description: 'XP for sharing with others.', category: RewardCategory.XP, icon: '🎁' }),
        createReward({ name: 'Empathy', description: 'XP for understanding someone\'s feelings.', category: RewardCategory.XP, icon: '🫂' }),
        createReward({ name: 'Respect', description: 'XP for showing respect to others.', category: RewardCategory.XP, icon: '🙇' }),
        createReward({ name: 'Communication', description: 'XP for clear and effective communication.', category: RewardCategory.XP, icon: '💬' }),
    ]}},
    { id: 'pack-r-virtues', type: 'Rewards', title: 'Virtue XP', emoji: '🕊️', description: 'Reward character traits and virtues.', color: REWARD_COLOR, assets: { rewardTypes: [
        createReward({ name: 'Courage', description: 'XP for facing a fear or trying something new.', category: RewardCategory.XP, icon: '🦁' }),
        createReward({ name: 'Patience', description: 'XP for waiting calmly or persisting through a challenge.', category: RewardCategory.XP, icon: '⏳' }),
        createReward({ name: 'Honesty', description: 'XP for telling the truth, especially when it is difficult.', category: RewardCategory.XP, icon: '🕊️' }),
        createReward({ name: 'Generosity', description: 'XP for sharing or giving to others.', category: RewardCategory.XP, icon: '🎁' }),
        createReward({ name: 'Discipline', description: 'XP for showing self-control.', category: RewardCategory.XP, icon: '🧘' }),
        createReward({ name: 'Gratitude', description: 'XP for showing appreciation.', category: RewardCategory.XP, icon: '🙏' }),
        createReward({ name: 'Humility', description: 'XP for being humble and not bragging.', category: RewardCategory.XP, icon: '🙇‍♂️' }),
        createReward({ name: 'Perseverance', description: 'XP for not giving up on a difficult task.', category: RewardCategory.XP, icon: '💪' }),
        createReward({ name: 'Responsibility', description: 'XP for taking ownership of your actions.', category: RewardCategory.XP, icon: '✔️' }),
        createReward({ name: 'Compassion', description: 'XP for showing care for others.', category: RewardCategory.XP, icon: '❤️' }),
    ]}},
    { id: 'pack-r-hobby', type: 'Rewards', title: 'Hobby XP', emoji: '🪁', description: 'XP types for various hobbies.', color: REWARD_COLOR, assets: { rewardTypes: [
        createReward({ name: 'Art XP', description: 'Experience from drawing, painting, and sculpting.', category: RewardCategory.XP, icon: '🎨' }),
        createReward({ name: 'Gaming XP', description: 'Experience from skilled video gaming.', category: RewardCategory.XP, icon: '🎮' }),
        createReward({ name: 'Collector XP', description: 'Experience from organizing and maintaining a collection.', category: RewardCategory.XP, icon: '📦' }),
        createReward({ name: 'Cooking XP', description: 'Experience from trying new recipes.', category: RewardCategory.XP, icon: '🧑‍🍳' }),
        createReward({ name: 'Builder XP', description: 'Experience from building and construction hobbies.', category: RewardCategory.XP, icon: '🧱' }),
        createReward({ name: 'Music XP', description: 'Experience from practicing a musical instrument.', category: RewardCategory.XP, icon: '🎵' }),
        createReward({ name: 'Reading XP', description: 'Experience from reading books.', category: RewardCategory.XP, icon: '📚' }),
        createReward({ name: 'Sports XP', description: 'Experience from playing sports.', category: RewardCategory.XP, icon: '⚽' }),
        createReward({ name: 'Gardening XP', description: 'Experience from gardening.', category: RewardCategory.XP, icon: '🌱' }),
        createReward({ name: 'Coding XP', description: 'Experience from programming.', category: RewardCategory.XP, icon: '💻' }),
    ]}},
    { id: 'pack-r-school', type: 'Rewards', title: 'School Subjects', emoji: '🏫', description: 'XP types based on school subjects.', color: REWARD_COLOR, assets: { rewardTypes: [
        createReward({ name: 'Math XP', description: 'Experience from math homework and practice.', category: RewardCategory.XP, icon: '🧮' }),
        createReward({ name: 'Science XP', description: 'Experience from science projects and learning.', category: RewardCategory.XP, icon: '🔬' }),
        createReward({ name: 'History XP', description: 'Experience from history lessons.', category: RewardCategory.XP, icon: '📜' }),
        createReward({ name: 'Language Arts XP', description: 'Experience from reading and writing assignments.', category: RewardCategory.XP, icon: '✍️' }),
        createReward({ name: 'Art Class XP', description: 'Experience from school art projects.', category: RewardCategory.XP, icon: '🖼️' }),
        createReward({ name: 'Music Class XP', description: 'Experience from music class.', category: RewardCategory.XP, icon: '🎼' }),
        createReward({ name: 'P.E. XP', description: 'Experience from physical education class.', category: RewardCategory.XP, icon: '🤸' }),
        createReward({ name: 'Computer Class XP', description: 'Experience from computer class.', category: RewardCategory.XP, icon: '🖱️' }),
        createReward({ name: 'Social Studies XP', description: 'Experience from social studies.', category: RewardCategory.XP, icon: '🌍' }),
        createReward({ name: 'Foreign Language XP', description: 'Experience from foreign language class.', category: RewardCategory.XP, icon: '🇪🇸' }),
    ]}},
    { id: 'pack-r-silly', type: 'Rewards', title: 'Silly Currencies', emoji: '🤪', description: 'Just for fun currencies.', color: REWARD_COLOR, assets: { rewardTypes: [
        createReward({ name: 'Goofballs', description: 'For being silly.', category: RewardCategory.Currency, icon: '🤪' }),
        createReward({ name: 'Mischief Tokens', description: 'For harmless pranks.', category: RewardCategory.Currency, icon: '😈' }),
        createReward({ name: 'Dad Jokes', description: 'Earned by telling a truly awful dad joke.', category: RewardCategory.Currency, icon: '👨‍👧‍👦' }),
        createReward({ name: 'Unicorn Tears', description: 'Magical, glittery tears.', category: RewardCategory.Currency, icon: '🦄' }),
        createReward({ name: 'Shiny Rocks', description: 'They\'re just shiny rocks, but you love them.', category: RewardCategory.Currency, icon: '🗿' }),
        createReward({ name: 'Bottle Caps', description: 'A post-apocalyptic currency.', category: RewardCategory.Currency, icon: '🍾' }),
        createReward({ name: 'Fuzzballs', description: 'Found in the dryer.', category: RewardCategory.Currency, icon: '☁️' }),
        createReward({ name: 'Squeaky Toys', description: 'Annoyingly fun.', category: RewardCategory.Currency, icon: '🦆' }),
        createReward({ name: 'Goldfish Crackers', description: 'The snack that smiles back.', category: RewardCategory.Currency, icon: '🐠' }),
        createReward({ name: 'Coupons for Hugs', description: 'Redeemable for one hug.', category: RewardCategory.Currency, icon: '🤗' }),
    ]}},
    { id: 'pack-r-elemental', type: 'Rewards', title: 'Elemental Essences', emoji: '🔥', description: 'XP based on elements.', color: REWARD_COLOR, assets: { rewardTypes: [
        createReward({ name: 'Fire Essence', description: 'XP from passionate and energetic activities.', category: RewardCategory.XP, icon: '🔥' }),
        createReward({ name: 'Water Essence', description: 'XP from calm and fluid activities.', category: RewardCategory.XP, icon: '💧' }),
        createReward({ name: 'Earth Essence', description: 'XP from grounding and nature-based activities.', category: RewardCategory.XP, icon: '🌍' }),
        createReward({ name: 'Air Essence', description: 'XP from intellectual and communicative activities.', category: RewardCategory.XP, icon: '💨' }),
        createReward({ name: 'Light Essence', description: 'XP from good and helpful deeds.', category: RewardCategory.XP, icon: '☀️' }),
        createReward({ name: 'Shadow Essence', description: 'XP from stealthy and clever activities.', category: RewardCategory.XP, icon: '🌑' }),
        createReward({ name: 'Lightning Essence', description: 'XP from fast and energetic activities.', category: RewardCategory.XP, icon: '⚡' }),
        createReward({ name: 'Ice Essence', description: 'XP from precise and patient activities.', category: RewardCategory.XP, icon: '❄️' }),
        createReward({ name: 'Nature Essence', description: 'XP from caring for plants and animals.', category: RewardCategory.XP, icon: '🌿' }),
        createReward({ name: 'Metal Essence', description: 'XP from building and crafting.', category: RewardCategory.XP, icon: '🔩' }),
    ]}},
    { id: 'pack-r-guild', type: 'Rewards', title: 'Guild Currencies', emoji: '🛡️', description: 'Currencies for guild activities.', color: REWARD_COLOR, assets: { rewardTypes: [
        createReward({ name: 'Guild Seals', description: 'Official currency of the guild.', category: RewardCategory.Currency, icon: '🛡️' }),
        createReward({ name: 'Contribution Points', description: 'Earned by helping the guild.', category: RewardCategory.Currency, icon: '🤝' }),
        createReward({ name: 'Raid Tokens', description: 'For completing guild-wide quests.', category: RewardCategory.Currency, icon: '⚔️' }),
        createReward({ name: 'Bounty Slips', description: 'For completing specific guild tasks.', category: RewardCategory.Currency, icon: '📜' }),
        createReward({ name: 'Favor Tokens', description: 'Can be traded with other guild members.', category: RewardCategory.Currency, icon: '👋' }),
        createReward({ name: 'Decor Tokens', description: 'Used to decorate the guild hall.', category: RewardCategory.Currency, icon: '🎈' }),
        createReward({ name: 'Feast Vouchers', description: 'Contributes to a guild feast.', category: RewardCategory.Currency, icon: '🍗' }),
        createReward({ name: 'War Bonds', description: 'For guild vs. guild activities.', category: RewardCategory.Currency, icon: '💥' }),
        createReward({ name: 'Research Notes', description: 'Contributes to guild-wide buffs.', category: RewardCategory.Currency, icon: '🔬' }),
        createReward({ name: 'Ancient Coins', description: 'A rare currency for special guild items.', category: RewardCategory.Currency, icon: '🪙' }),
    ]}},
    { id: 'pack-r-dnd', type: 'Rewards', title: 'D&D Stats XP', emoji: '🎲', description: 'XP based on the classic D&D stats.', color: REWARD_COLOR, assets: { rewardTypes: [
        createReward({ name: 'Strength XP', description: 'For feats of physical power.', category: RewardCategory.XP, icon: '💪' }),
        createReward({ name: 'Dexterity XP', description: 'For tasks requiring agility and finesse.', category: RewardCategory.XP, icon: '🤸' }),
        createReward({ name: 'Constitution XP', description: 'For endurance and healthy habits.', category: RewardCategory.XP, icon: '❤️‍🩹' }),
        createReward({ name: 'Intelligence XP', description: 'For learning and problem-solving.', category: RewardCategory.XP, icon: '🧠' }),
        createReward({ name: 'Wisdom XP', description: 'For showing insight and making good judgements.', category: RewardCategory.XP, icon: '🦉' }),
        createReward({ name: 'Charisma XP', description: 'For social grace and leadership.', category: RewardCategory.XP, icon: '🎭' }),
        createReward({ name: 'Luck XP', description: 'For when things just go your way.', category: RewardCategory.XP, icon: '🍀' }),
        createReward({ name: 'Perception XP', description: 'For noticing things others miss.', category: RewardCategory.XP, icon: '👁️' }),
        createReward({ name: 'Stealth XP', description: 'For being sneaky and quiet.', category: RewardCategory.XP, icon: '🥷' }),
        createReward({ name: 'Survival XP', description: 'For thriving in the great outdoors.', category: RewardCategory.XP, icon: '🏕️' }),
    ]}},
];