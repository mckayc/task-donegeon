import { User, Role, RewardTypeDefinition, RewardCategory, Rank, Trophy, TrophyRequirementType, QuestType, Market, Quest, QuestAvailability, Guild, AppSettings, SidebarConfigItem, GameAsset, ThemeDefinition, ThemeStyle, QuestCompletion, QuestCompletionStatus, MarketStatus, LibraryPack, BlueprintAssets, RewardItem, TrophyRequirement, QuestGroup } from '../types';

// ====================================================================================
// == ASSET CREATION HELPERS ==========================================================
// ====================================================================================

// Helper to create a quest object with defaults
const createQuest = (data: Partial<Quest> & { title: string; description: string; }): Quest => ({
  id: `pack-quest-${Math.random().toString(36).substring(2, 9)}`,
  type: QuestType.Venture,
  iconType: 'emoji',
  icon: '📝',
  tags: [],
  rewards: [],
  lateSetbacks: [],
  incompleteSetbacks: [],
  isActive: true,
  isOptional: false,
  availabilityType: QuestAvailability.Unlimited,
  availabilityCount: 1,
  weeklyRecurrenceDays: [],
  monthlyRecurrenceDays: [],
  assignedUserIds: [],
  requiresApproval: false,
  claimedByUserIds: [],
  dismissals: [],
  ...data,
});

// Helper to create a trophy object with defaults
const createTrophy = (data: Partial<Trophy> & { name: string; description: string; }): Trophy => ({
  id: `pack-trophy-${Math.random().toString(36).substring(2, 9)}`,
  iconType: 'emoji',
  icon: '🏆',
  isManual: true,
  requirements: [],
  ...data,
});

// Helper to create a game asset (item) object with defaults
const createGameAsset = (data: Partial<GameAsset> & { name: string; description: string; url: string; }): GameAsset => ({
  id: `pack-g-asset-${Math.random().toString(36).substring(2, 9)}`,
  category: 'Miscellaneous',
  isForSale: true,
  costGroups: [],
  marketIds: [],
  creatorId: 'system',
  createdAt: new Date().toISOString(),
  purchaseLimit: null,
  purchaseLimitType: 'Total',
  purchaseCount: 0,
  requiresApproval: false,
  ...data,
});

// Helper to create a market object with defaults
const createMarket = (data: Partial<Market> & { title: string; description: string; }): Market => ({
  id: `pack-market-${Math.random().toString(36).substring(2, 9)}`,
  iconType: 'emoji',
  icon: '🛒',
  status: { type: 'open' },
  ...data,
});

// Helper to create a reward type object with defaults
const createReward = (data: Partial<RewardTypeDefinition> & { name: string; description: string; category: RewardCategory }): RewardTypeDefinition => ({
  id: `pack-reward-${Math.random().toString(36).substring(2, 9)}`,
  isCore: false,
  iconType: 'emoji',
  icon: '💎',
  ...data,
});

// Helper to create a quest group object with defaults
const createQuestGroup = (data: Partial<QuestGroup> & { name: string; }): QuestGroup => ({
    id: `pack-qg-${Math.random().toString(36).substring(2, 9)}`,
    description: '',
    icon: '📂',
    ...data,
});

// ====================================================================================
// == LIBRARY PACK DEFINITIONS ========================================================
// ====================================================================================

export const libraryPacks: LibraryPack[] = [
  // =================================================================================
  // == QUEST PACKS ==================================================================
  // =================================================================================
  {
    id: 'pack-household-chores',
    type: 'Quests',
    title: 'Household Chores Starter',
    description: 'A basic set of daily and weekly chores to keep any household running smoothly.',
    emoji: '🏡',
    color: 'border-sky-500',
    assets: {
      questGroups: [createQuestGroup({id: 'qg-household', name: 'Household Chores', icon: '🏡'})],
      quests: [
        createQuest({ title: 'Make Bed', description: 'Start the day right by making your bed.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🛏️', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['Bedroom', 'Cleaning'], groupId: 'qg-household' }),
        createQuest({ title: 'Tidy Room', description: 'Spend 10 minutes tidying up your personal space.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🧹', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['Bedroom', 'Cleaning', 'Organization'], groupId: 'qg-household' }),
        createQuest({ title: 'Take Out Trash', description: 'Collect trash from all bins and take it to the curb.', type: QuestType.Duty, availabilityType: QuestAvailability.Weekly, weeklyRecurrenceDays: [2], icon: '🗑️', rewards: [{ rewardTypeId: 'core-strength', amount: 15 }], tags: ['Kitchen', 'Cleaning'], groupId: 'qg-household' }),
        createQuest({ title: 'Set the Table', description: 'Set the table for dinner.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🍽️', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['Kitchen', 'Helping'], groupId: 'qg-household' }),
        createQuest({ title: 'Help with Dishes', description: 'Help load or unload the dishwasher, or wash dishes by hand.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🧼', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['Kitchen', 'Helping'], groupId: 'qg-household' }),
      ],
    },
  },
  {
    id: 'pack-academic-adventures',
    type: 'Quests',
    title: 'Academic Adventures',
    description: 'A collection of quests focused on school, learning, and intellectual growth.',
    emoji: '📚',
    color: 'border-sky-500',
    assets: {
      questGroups: [createQuestGroup({id: 'qg-school', name: 'School & Learning', icon: '📚'})],
      quests: [
        createQuest({ title: 'Finish Homework', description: 'Complete all assigned homework for the day.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '✏️', rewards: [{ rewardTypeId: 'core-wisdom', amount: 20 }], tags: ['School', 'Learning'], groupId: 'qg-school' }),
        createQuest({ title: 'Read for 20 Minutes', description: 'Read a book for at least 20 minutes.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '📖', rewards: [{ rewardTypeId: 'core-wisdom', amount: 15 }], tags: ['School', 'Learning'], groupId: 'qg-school' }),
        createQuest({ title: 'Study for a Test', description: 'Spend 30 minutes studying for an upcoming test or quiz.', type: QuestType.Venture, icon: '🧠', rewards: [{ rewardTypeId: 'core-wisdom', amount: 25 }], tags: ['School', 'Learning'], groupId: 'qg-school' }),
        createQuest({ title: 'Organize Backpack', description: 'Clean out and organize your backpack for the week.', type: QuestType.Duty, availabilityType: QuestAvailability.Weekly, weeklyRecurrenceDays: [0], icon: '🎒', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['School', 'Organization'], groupId: 'qg-school' }),
        createQuest({ title: 'Teach Someone Something New', description: 'Share a cool fact or explain a concept you learned to a family member.', type: QuestType.Venture, icon: '🧑‍🏫', rewards: [{ rewardTypeId: 'core-wisdom', amount: 15 }], tags: ['Learning', 'Family Time'], groupId: 'qg-school' }),
      ],
    },
  },
  {
    id: 'pack-outdoor-explorer',
    type: 'Quests',
    title: 'Outdoor Explorer',
    description: 'Get outside, get active, and help with yard work with these outdoor quests.',
    emoji: '🌳',
    color: 'border-sky-500',
    assets: {
      questGroups: [createQuestGroup({id: 'qg-outdoor', name: 'Outdoor & Adventure', icon: '🌳'})],
      quests: [
        createQuest({ title: 'Water the Plants', description: 'Give all the indoor and outdoor plants a drink of water.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '💧', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['Yardwork', 'Helping'], groupId: 'qg-outdoor' }),
        createQuest({ title: 'Rake Leaves', description: 'Rake the leaves in a section of the yard.', type: QuestType.Venture, icon: '🍂', rewards: [{ rewardTypeId: 'core-strength', amount: 30 }], tags: ['Yardwork'], groupId: 'qg-outdoor' }),
        createQuest({ title: 'Pull Weeds', description: 'Spend 15 minutes pulling weeds from the garden or flower beds.', type: QuestType.Venture, icon: '🌿', rewards: [{ rewardTypeId: 'core-diligence', amount: 20 }], tags: ['Yardwork'], groupId: 'qg-outdoor' }),
        createQuest({ title: 'Play Outside for 30 Minutes', description: 'Get some fresh air! Ride a bike, play a sport, or just run around.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '⚽', rewards: [{ rewardTypeId: 'core-strength', amount: 15 }], tags: ['Health'], groupId: 'qg-outdoor' }),
        createQuest({ title: 'Help with the Harvest', description: 'Help pick ripe vegetables or fruits from the garden.', type: QuestType.Venture, icon: '🍎', rewards: [{ rewardTypeId: 'core-diligence', amount: 15 }], tags: ['Yardwork', 'Helping'], groupId: 'qg-outdoor' }),
      ],
    },
  },
  {
    id: 'pack-kindness-crew',
    type: 'Quests',
    title: 'Kindness Crew',
    description: 'Quests designed to promote kindness, helping others, and positive social interactions.',
    emoji: '💖',
    color: 'border-sky-500',
    assets: {
      questGroups: [createQuestGroup({id: 'qg-kindness', name: 'Kindness & Service', icon: '💖'})],
      quests: [
        createQuest({ title: 'Give a Compliment', description: 'Give a sincere compliment to someone.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '😊', rewards: [{ rewardTypeId: 'core-gems', amount: 5 }], tags: ['Helping', 'Family Time'], groupId: 'qg-kindness' }),
        createQuest({ title: 'Help Without Being Asked', description: 'Find a way to help a family member without them having to ask you.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🤝', rewards: [{ rewardTypeId: 'core-gems', amount: 15 }], tags: ['Helping', 'Family Time'], groupId: 'qg-kindness' }),
        createQuest({ title: 'Write a Thank You Note', description: 'Write a short note to someone thanking them for something they did.', type: QuestType.Venture, icon: '💌', rewards: [{ rewardTypeId: 'core-gems', amount: 10 }], tags: ['Helping', 'Creative'], groupId: 'qg-kindness' }),
        createQuest({ title: 'Share Your Toys', description: 'Willingly share your toys or games with a sibling or friend.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🧸', rewards: [{ rewardTypeId: 'core-gems', amount: 5 }], tags: ['Family Time'], groupId: 'qg-kindness' }),
        createQuest({ title: 'Donate to Charity', description: 'Pick out old toys or clothes to donate to those in need.', type: QuestType.Venture, icon: '💝', rewards: [{ rewardTypeId: 'core-gems', amount: 25 }], tags: ['Helping', 'Organization'], groupId: 'qg-kindness' }),
      ],
    },
  },
   {
    id: 'pack-pet-care',
    type: 'Quests',
    title: 'Pet Care Patrol',
    description: 'Essential duties for taking care of your furry, scaled, or feathered friends.',
    emoji: '🐾',
    color: 'border-sky-500',
    assets: {
      questGroups: [createQuestGroup({id: 'qg-pets', name: 'Pet Care', icon: '🐾'})],
      quests: [
        createQuest({ title: 'Feed the Pet(s)', description: 'Provide the correct amount of food for your pet(s) at their mealtime.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '밥', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['Pets', 'Helping'], groupId: 'qg-pets' }),
        createQuest({ title: 'Fresh Water for Pet(s)', description: 'Empty, rinse, and refill your pet\'s water bowl with fresh water.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '💧', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['Pets', 'Helping'], groupId: 'qg-pets' }),
        createQuest({ title: 'Walk the Dog', description: 'Take the dog for a walk of at least 15 minutes.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🐕', rewards: [{ rewardTypeId: 'core-strength', amount: 15 }], tags: ['Pets', 'Health'], groupId: 'qg-pets' }),
        createQuest({ title: 'Clean the Litter Box', description: 'Scoop the litter box and dispose of the waste properly.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🐈', rewards: [{ rewardTypeId: 'core-diligence', amount: 15 }], tags: ['Pets', 'Cleaning'], groupId: 'qg-pets' }),
        createQuest({ title: 'Playtime with Pet', description: 'Spend 10 minutes actively playing with your pet.', type: QuestType.Venture, icon: '🎾', rewards: [{ rewardTypeId: 'core-skill', amount: 10 }], tags: ['Pets', 'Family Time'], groupId: 'qg-pets' }),
      ]
    }
  },
  {
    id: 'pack-personal-hygiene',
    type: 'Quests',
    title: 'Personal Hygiene Heroes',
    description: 'Important daily routines for staying clean and healthy.',
    emoji: '🧼',
    color: 'border-sky-500',
    assets: {
      questGroups: [createQuestGroup({id: 'qg-health', name: 'Health & Wellness', icon: '❤️‍🩹'})],
      quests: [
        createQuest({ title: 'Brush Teeth (Morning)', description: 'Brush your teeth for 2 minutes in the morning.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, lateTime: '09:00', icon: '☀️', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['Health'], groupId: 'qg-health' }),
        createQuest({ title: 'Brush Teeth (Evening)', description: 'Brush your teeth for 2 minutes before bed.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, lateTime: '21:00', icon: '🌙', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['Health'], groupId: 'qg-health' }),
        createQuest({ title: 'Take a Bath/Shower', description: 'Take a bath or shower and get squeaky clean.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🚿', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['Health'], groupId: 'qg-health' }),
        createQuest({ title: 'Get Dressed', description: 'Get dressed for the day, including putting away your pajamas.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '👕', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['Health'], groupId: 'qg-health' }),
        createQuest({ title: 'Wash Hands Before Meals', description: 'Wash your hands with soap and water before eating.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '👏', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['Health'], groupId: 'qg-health' }),
      ]
    }
  },
  {
    id: 'pack-financial-future',
    type: 'Quests',
    title: 'Financial Future',
    description: 'Learn about money management, saving, and smart spending.',
    emoji: '💰',
    color: 'border-sky-500',
    assets: {
      quests: [
        createQuest({ title: 'Save Your Allowance', description: 'Put at least 10% of your allowance into savings.', type: QuestType.Venture, icon: '🐷', rewards: [{ rewardTypeId: 'core-wisdom', amount: 15 }], tags: ['Learning', 'Finance'] }),
        createQuest({ title: 'Track Your Spending', description: 'For one week, write down everything you spend money on.', type: QuestType.Venture, icon: '🧾', rewards: [{ rewardTypeId: 'core-diligence', amount: 25 }], tags: ['Learning', 'Finance'] }),
        createQuest({ title: 'Research a Big Purchase', description: 'Before asking for an expensive item, research different options and prices.', type: QuestType.Venture, icon: '🔍', rewards: [{ rewardTypeId: 'core-wisdom', amount: 20 }], tags: ['Learning', 'Finance'] }),
        createQuest({ title: 'Learn About Compound Interest', description: 'Watch a short video or read an article about how compound interest works.', type: QuestType.Venture, icon: '📈', rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['Learning', 'Finance'] }),
      ]
    }
  },
  {
    id: 'pack-culinary-champion',
    type: 'Quests',
    title: 'Culinary Champion',
    description: 'Quests for aspiring chefs to help in the kitchen and learn cooking skills.',
    emoji: '🧑‍🍳',
    color: 'border-sky-500',
    assets: {
      quests: [
        createQuest({ title: 'Help Plan a Meal', description: 'Help decide what to have for dinner one night this week.', type: QuestType.Venture, icon: '🤔', rewards: [{ rewardTypeId: 'core-creative', amount: 10 }], tags: ['Kitchen', 'Helping'] }),
        createQuest({ title: 'Wash Vegetables', description: 'Help wash and prepare vegetables for a meal.', type: QuestType.Venture, icon: '🥕', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['Kitchen', 'Helping'] }),
        createQuest({ title: 'Measure Ingredients', description: 'Help measure out the ingredients for a recipe.', type: QuestType.Venture, icon: '🥣', rewards: [{ rewardTypeId: 'core-skill', amount: 15 }], tags: ['Kitchen', 'Helping', 'Learning'] }),
        createQuest({ title: 'Stir the Pot', description: 'With supervision, help stir ingredients in a pot or bowl.', type: QuestType.Venture, icon: '🍳', rewards: [{ rewardTypeId: 'core-skill', amount: 5 }], tags: ['Kitchen', 'Helping'] }),
        createQuest({ title: 'Help Clean Up After Baking', description: 'Wipe counters, put away ingredients, and help with baking dishes.', type: QuestType.Venture, icon: '✨', rewards: [{ rewardTypeId: 'core-diligence', amount: 15 }], tags: ['Kitchen', 'Helping', 'Cleaning'] }),
      ]
    }
  },
   {
    id: 'pack-mindful-moments',
    type: 'Quests',
    title: 'Mindful Moments',
    description: 'A set of quests to encourage relaxation, focus, and mental well-being.',
    emoji: '🧘',
    color: 'border-sky-500',
    assets: {
      quests: [
        createQuest({ title: '5 Minutes of Quiet Time', description: 'Sit quietly for 5 minutes without any screens. You can meditate, listen to music, or just be still.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🤫', rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['Health', 'Mindfulness'] }),
        createQuest({ title: 'Gratitude Journal', description: 'Write down three things you are grateful for today.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '✍️', rewards: [{ rewardTypeId: 'core-creative', amount: 10 }], tags: ['Health', 'Mindfulness'] }),
        createQuest({ title: 'Mindful Breathing', description: 'Practice deep breathing for 2 minutes. Inhale for 4 seconds, hold for 4, and exhale for 6.', type: QuestType.Venture, icon: '😮‍💨', rewards: [{ rewardTypeId: 'core-wisdom', amount: 5 }], tags: ['Health', 'Mindfulness'] }),
        createQuest({ title: 'Go for a Nature Walk', description: 'Take a 15-minute walk and pay attention to the sights, sounds, and smells of nature.', type: QuestType.Venture, icon: '🌲', rewards: [{ rewardTypeId: 'core-strength', amount: 15 }], tags: ['Health', 'Mindfulness', 'Outdoors'] }),
      ]
    }
  },
  {
    id: 'pack-artistic-expression',
    type: 'Quests',
    title: 'Artistic Expression',
    description: 'Unleash your creativity with these arts and crafts quests.',
    emoji: '🎨',
    color: 'border-sky-500',
    assets: {
      quests: [
        createQuest({ title: 'Draw a Picture', description: 'Spend 15 minutes drawing or coloring a picture.', type: QuestType.Venture, icon: '🖍️', rewards: [{ rewardTypeId: 'core-creative', amount: 10 }], tags: ['Creative', 'Art'] }),
        createQuest({ title: 'Build with LEGOs', description: 'Create something cool with LEGOs or other building blocks for 20 minutes.', type: QuestType.Venture, icon: '🧱', rewards: [{ rewardTypeId: 'core-creative', amount: 15 }], tags: ['Creative', 'Building'] }),
        createQuest({ title: 'Write a Short Story', description: 'Write a story that is at least one paragraph long.', type: QuestType.Venture, icon: '📜', rewards: [{ rewardTypeId: 'core-creative', amount: 20 }], tags: ['Creative', 'Writing'] }),
        createQuest({ title: 'Learn a New Song', description: 'Practice a song on an instrument or learn the lyrics to a new song.', type: QuestType.Venture, icon: '🎶', rewards: [{ rewardTypeId: 'core-skill', amount: 15 }], tags: ['Creative', 'Music'] }),
      ]
    }
  },
  {
    id: 'pack-holiday-helper',
    type: 'Quests',
    title: 'Holiday Helper',
    description: 'Get into the festive spirit by helping with holiday preparations.',
    emoji: '🎄',
    color: 'border-sky-500',
    assets: {
      quests: [
        createQuest({ title: 'Help Decorate', description: 'Help put up holiday decorations for 30 minutes.', type: QuestType.Venture, icon: '✨', rewards: [{ rewardTypeId: 'core-creative', amount: 20 }], tags: ['Holiday', 'Helping'] }),
        createQuest({ title: 'Wrap a Present', description: 'Help wrap a gift for a family member or friend.', type: QuestType.Venture, icon: '🎁', rewards: [{ rewardTypeId: 'core-skill', amount: 10 }], tags: ['Holiday', 'Helping'] }),
        createQuest({ title: 'Bake Holiday Treats', description: 'Help bake cookies or other treats for the holiday.', type: QuestType.Venture, icon: '🍪', rewards: [{ rewardTypeId: 'core-creative', amount: 15 }], tags: ['Holiday', 'Kitchen'] }),
        createQuest({ title: 'Shovel a Neighbor\'s Walkway', description: 'As an act of kindness, shovel the snow from a neighbor\'s walkway.', type: QuestType.Venture, icon: '❄️', rewards: [{ rewardTypeId: 'core-gems', amount: 30 }], tags: ['Holiday', 'Helping', 'Outdoors'] }),
      ]
    }
  },
  {
    id: 'pack-screen-free-fun',
    type: 'Quests',
    title: 'Screen-Free Fun',
    description: 'A pack of activities to do instead of looking at a screen.',
    emoji: '📵',
    color: 'border-sky-500',
    assets: {
      quests: [
        createQuest({ title: 'Play a Board Game', description: 'Play a full game of a board game or card game with the family.', type: QuestType.Venture, icon: '🎲', rewards: [{ rewardTypeId: 'core-wisdom', amount: 15 }], tags: ['Family Time', 'Screen-Free'] }),
        createQuest({ title: 'Read a Physical Book', description: 'Read a book that is not on a screen for 20 minutes.', type: QuestType.Venture, icon: '📖', rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['Learning', 'Screen-Free'] }),
        createQuest({ title: 'Do a Puzzle', description: 'Spend 20 minutes working on a jigsaw puzzle.', type: QuestType.Venture, icon: '🧩', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['Family Time', 'Screen-Free'] }),
        createQuest({ title: 'Help with a Project', description: 'Help a parent or sibling with a real-world project (like building furniture or cooking).', type: QuestType.Venture, icon: '🛠️', rewards: [{ rewardTypeId: 'core-skill', amount: 20 }], tags: ['Helping', 'Screen-Free'] }),
      ]
    }
  },
  {
    id: 'pack-the-librarian',
    type: 'Quests',
    title: 'The Librarian',
    description: 'Quests that encourage reading and learning through books.',
    emoji: '📚',
    color: 'border-sky-500',
    assets: {
      quests: [
        createQuest({ title: 'Visit the Library', description: 'Go to the local library and check out a book.', type: QuestType.Venture, icon: '🏛️', rewards: [{ rewardTypeId: 'core-wisdom', amount: 20 }], tags: ['Learning', 'Outdoors'] }),
        createQuest({ title: 'Finish a Book', description: 'Read a book from start to finish.', type: QuestType.Venture, icon: '✅', rewards: [{ rewardTypeId: 'core-wisdom', amount: 50 }], tags: ['Learning'] }),
        createQuest({ title: 'Read to Someone', description: 'Read a book out loud to a younger sibling or a parent.', type: QuestType.Venture, icon: '🗣️', rewards: [{ rewardTypeId: 'core-gems', amount: 15 }], tags: ['Family Time', 'Learning'] }),
        createQuest({ title: 'Organize a Bookshelf', description: 'Tidy up and organize one of the bookshelves in the house.', type: QuestType.Venture, icon: ' bookshelf', rewards: [{ rewardTypeId: 'core-diligence', amount: 15 }], tags: ['Organization', 'Cleaning'] }),
      ]
    }
  },
  {
    id: 'pack-sports-superstar',
    type: 'Quests',
    title: 'Sports Superstar',
    description: 'Practice skills and stay active with these sports-related quests.',
    emoji: '🏅',
    color: 'border-sky-500',
    assets: {
      quests: [
        createQuest({ title: 'Practice for 30 Minutes', description: 'Practice your sport (soccer, basketball, etc.) for 30 minutes.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🏀', rewards: [{ rewardTypeId: 'core-skill', amount: 20 }], tags: ['Health', 'Sports'] }),
        createQuest({ title: 'Stretch After Practice', description: 'Do a full stretching routine after your practice or game.', type: QuestType.Duty, availabilityType: QuestAvailability.Daily, icon: '🧘', rewards: [{ rewardTypeId: 'core-strength', amount: 5 }], tags: ['Health', 'Sports'] }),
        createQuest({ title: 'Clean Your Equipment', description: 'Wipe down and properly store your sports equipment after use.', type: QuestType.Venture, icon: '🧼', rewards: [{ rewardTypeId: 'core-diligence', amount: 10 }], tags: ['Cleaning', 'Sports'] }),
        createQuest({ title: 'Watch a Game Film', description: 'Watch a professional game or a recording of your own to learn new strategies.', type: QuestType.Venture, icon: '📺', rewards: [{ rewardTypeId: 'core-wisdom', amount: 10 }], tags: ['Learning', 'Sports'] }),
      ]
    }
  },
  {
    id: 'pack-secret-agent',
    type: 'Quests',
    title: 'Secret Agent Service',
    description: 'A set of stealthy quests about doing good deeds without being noticed.',
    emoji: '🕵️',
    color: 'border-sky-500',
    assets: {
      quests: [
        createQuest({ title: 'Secretly Tidy a Room', description: 'Tidy up a common area (like the living room) without anyone seeing you do it.', type: QuestType.Venture, icon: '🤫', rewards: [{ rewardTypeId: 'core-gems', amount: 20 }], tags: ['Cleaning', 'Helping', 'Stealth'] }),
        createQuest({ title: 'Leave a Kind Note', description: 'Leave an anonymous, kind note for a family member to find.', type: QuestType.Venture, icon: '💌', rewards: [{ rewardTypeId: 'core-gems', amount: 10 }], tags: ['Kindness', 'Stealth'] }),
        createQuest({ title: 'Do a Chore for a Sibling', description: 'Do one of your sibling\'s chores for them, without telling them it was you.', type: QuestType.Venture, icon: '🎁', rewards: [{ rewardTypeId: 'core-gems', amount: 25 }], tags: ['Helping', 'Stealth'] }),
        createQuest({ title: 'Refill the TP', description: 'If you use the last of the toilet paper, replace the roll without being told.', type: QuestType.Venture, icon: '🧻', rewards: [{ rewardTypeId: 'core-diligence', amount: 5 }], tags: ['Helping', 'Stealth'] }),
      ]
    }
  },

  // =================================================================================
  // == ITEM PACKS ===================================================================
  // =================================================================================
  {
    id: 'pack-avatar-starter-kit',
    type: 'Items',
    title: 'Starter Avatar Kit',
    description: 'A few basic cosmetic items to get your avatar customization started.',
    emoji: '🧑‍🎤',
    color: 'border-violet-500',
    assets: {
        markets: [createMarket({ id: 'market-avatar-basics', title: 'The Tailor\'s Shop', description: 'Basic gear for a new adventurer.'})],
        gameAssets: [
            createGameAsset({ name: 'Simple Tunic', icon: '👕', description: 'A basic but sturdy tunic for a starting adventurer.', url: 'https://placehold.co/150/a16207/FFFFFF?text=Tunic', category: 'Avatar-shirt', avatarSlot: 'shirt', costGroups: [[{rewardTypeId: 'core-gold', amount: 20}]], marketIds: ['market-avatar-basics'] }),
            createGameAsset({ name: 'Leather Boots', icon: '👢', description: 'Simple boots, good for walking.', url: 'https://placehold.co/150/3f2f25/FFFFFF?text=Boots', category: 'Avatar-feet', avatarSlot: 'feet', costGroups: [[{rewardTypeId: 'core-gold', amount: 15}]], marketIds: ['market-avatar-basics'] }),
            createGameAsset({ name: 'Pointy Hat', icon: '🎩', description: 'A whimsical, pointy hat.', url: 'https://placehold.co/150/1d4ed8/FFFFFF?text=Hat', category: 'Avatar-hat', avatarSlot: 'hat', costGroups: [[{rewardTypeId: 'core-gold', amount: 25}]], marketIds: ['market-avatar-basics'] }),
            createGameAsset({ name: 'Wooden Staff', icon: '🌲', description: 'A simple wooden staff.', url: 'https://placehold.co/150/5f5244/FFFFFF?text=Staff', category: 'Avatar-hand-right', avatarSlot: 'hand-right', costGroups: [[{rewardTypeId: 'core-gold', amount: 30}]], marketIds: ['market-avatar-basics'] }),
        ]
    }
  },
  {
    id: 'pack-real-world-rewards',
    type: 'Items',
    title: 'Real World Rewards',
    description: 'A set of vouchers for real-world privileges and treats.',
    emoji: '🎟️',
    color: 'border-violet-500',
    assets: {
        markets: [createMarket({ id: 'market-privileges', title: 'The Reward Board', description: 'Cash in your points for real rewards!'})],
        gameAssets: [
            createGameAsset({ name: '30 Minutes of Screen Time', icon: '📱', description: 'A voucher for 30 minutes of video games, TV, or tablet time.', url: 'https://placehold.co/150/4f46e5/FFFFFF?text=30m', category: 'Real-World Reward', costGroups: [[{rewardTypeId: 'core-crystal', amount: 50}]], marketIds: ['market-privileges'], requiresApproval: true }),
            createGameAsset({ name: 'Pick Dinner', icon: '🍕', description: 'You get to choose what the family has for dinner one night.', url: 'https://placehold.co/150/db2777/FFFFFF?text=Dinner', category: 'Real-World Reward', costGroups: [[{rewardTypeId: 'core-gems', amount: 100}]], marketIds: ['market-privileges'], requiresApproval: true }),
            createGameAsset({ name: 'Dessert After Dinner', icon: '🍰', description: 'A voucher for a special dessert after your meal.', url: 'https://placehold.co/150/f59e0b/FFFFFF?text=Dessert', category: 'Real-World Reward', costGroups: [[{rewardTypeId: 'core-crystal', amount: 30}]], marketIds: ['market-privileges'], requiresApproval: false }),
        ]
    }
  },
   {
    id: 'pack-knights-armory',
    type: 'Items',
    title: 'The Knight\'s Armory',
    description: 'A full set of armor and weapons for a valiant knight.',
    emoji: '🛡️',
    color: 'border-violet-500',
    assets: {
      markets: [createMarket({ id: 'market-knights', title: 'The Knight\'s Armory', description: 'Fine steel for the kingdom\'s defenders.' })],
      gameAssets: [
        createGameAsset({ name: 'Steel Helm', icon: '⛑️', description: 'A protective steel helmet.', url: 'https://placehold.co/150/9ca3af/FFFFFF?text=Helm', category: 'Avatar', avatarSlot: 'hat', costGroups: [[{ rewardTypeId: 'core-gold', amount: 50 }]], marketIds: ['market-knights'] }),
        createGameAsset({ name: 'Steel Chestplate', icon: '🛡️', description: 'A sturdy steel chestplate.', url: 'https://placehold.co/150/6b7280/FFFFFF?text=Plate', category: 'Avatar', avatarSlot: 'shirt', costGroups: [[{ rewardTypeId: 'core-gold', amount: 80 }]], marketIds: ['market-knights'] }),
        createGameAsset({ name: 'Steel Gauntlets', icon: '🧤', description: 'Protective steel gloves.', url: 'https://placehold.co/150/4b5563/FFFFFF?text=Gauntlets', category: 'Avatar', avatarSlot: 'hands', costGroups: [[{ rewardTypeId: 'core-gold', amount: 30 }]], marketIds: ['market-knights'] }),
        createGameAsset({ name: 'Steel Greaves', icon: '🦵', description: 'Protective steel leg armor.', url: 'https://placehold.co/150/374151/FFFFFF?text=Greaves', category: 'Avatar', avatarSlot: 'legs', costGroups: [[{ rewardTypeId: 'core-gold', amount: 40 }]], marketIds: ['market-knights'] }),
        createGameAsset({ name: 'Knight\'s Longsword', icon: '⚔️', description: 'A sharp and reliable longsword.', url: 'https://placehold.co/150/d1d5db/FFFFFF?text=Sword', category: 'Avatar', avatarSlot: 'hand-right', costGroups: [[{ rewardTypeId: 'core-gold', amount: 100 }]], marketIds: ['market-knights'] }),
        createGameAsset({ name: 'Kite Shield', icon: '🛡️', description: 'A classic shield for defense.', url: 'https://placehold.co/150/e5e7eb/FFFFFF?text=Shield', category: 'Avatar', avatarSlot: 'hand-left', costGroups: [[{ rewardTypeId: 'core-gold', amount: 70 }]], marketIds: ['market-knights'] }),
      ]
    }
  },
  {
    id: 'pack-wizards-workshop',
    type: 'Items',
    title: 'The Wizard\'s Workshop',
    description: 'Mystical robes and implements for the aspiring spellcaster.',
    emoji: '🧙',
    color: 'border-violet-500',
    assets: {
      markets: [createMarket({ id: 'market-wizards', title: 'The Wizard\'s Workshop', description: 'Arcane artifacts and enchanted apparel.' })],
      gameAssets: [
        createGameAsset({ name: 'Wizard Hat', icon: '🧙', description: 'A tall, pointy hat brimming with magic.', url: 'https://placehold.co/150/5b21b6/FFFFFF?text=Hat', category: 'Avatar', avatarSlot: 'hat', costGroups: [[{ rewardTypeId: 'core-gold', amount: 45 }]], marketIds: ['market-wizards'] }),
        createGameAsset({ name: 'Starry Robes', icon: '✨', description: 'Robes embroidered with celestial patterns.', url: 'https://placehold.co/150/4c1d95/FFFFFF?text=Robes', category: 'Avatar', avatarSlot: 'shirt', costGroups: [[{ rewardTypeId: 'core-gold', amount: 70 }]], marketIds: ['market-wizards'] }),
        createGameAsset({ name: 'Crystal Staff', icon: '🔮', description: 'A staff topped with a glowing crystal.', url: 'https://placehold.co/150/a78bfa/FFFFFF?text=Staff', category: 'Avatar', avatarSlot: 'hand-right', costGroups: [[{ rewardTypeId: 'core-gold', amount: 120 }]], marketIds: ['market-wizards'] }),
        createGameAsset({ name: 'Spellbook', icon: '📖', description: 'A heavy tome filled with ancient spells.', url: 'https://placehold.co/150/7c3aed/FFFFFF?text=Book', category: 'Avatar', avatarSlot: 'hand-left', costGroups: [[{ rewardTypeId: 'core-gold', amount: 60 }]], marketIds: ['market-wizards'] }),
      ]
    }
  },
  {
    id: 'pack-rogues-den',
    type: 'Items',
    title: 'The Rogue\'s Den',
    description: 'Gear for the silent and swift rogue.',
    emoji: '🔪',
    color: 'border-violet-500',
    assets: {
      markets: [createMarket({ id: 'market-rogues', title: 'The Rogue\'s Den', description: 'Tools for those who prefer the shadows.' })],
      gameAssets: [
        createGameAsset({ name: 'Shadow Cowl', icon: '👤', description: 'A dark hood that conceals your identity.', url: 'https://placehold.co/150/171717/FFFFFF?text=Cowl', category: 'Avatar', avatarSlot: 'hat', costGroups: [[{ rewardTypeId: 'core-gold', amount: 40 }]], marketIds: ['market-rogues'] }),
        createGameAsset({ name: 'Leather Jerkin', icon: '🧥', description: 'Light and flexible leather armor.', url: 'https://placehold.co/150/44403c/FFFFFF?text=Jerkin', category: 'Avatar', avatarSlot: 'shirt', costGroups: [[{ rewardTypeId: 'core-gold', amount: 60 }]], marketIds: ['market-rogues'] }),
        createGameAsset({ name: 'Twin Daggers', icon: '🔪', description: 'A pair of perfectly balanced daggers.', url: 'https://placehold.co/150/a8a29e/FFFFFF?text=Daggers', category: 'Avatar', avatarSlot: 'hands', costGroups: [[{ rewardTypeId: 'core-gold', amount: 90 }]], marketIds: ['market-rogues'] }),
        createGameAsset({ name: 'Thieves\' Tools', icon: '🔧', description: 'A set of lockpicks and other useful devices.', url: 'https://placehold.co/150/78716c/FFFFFF?text=Tools', category: 'Tool', costGroups: [[{ rewardTypeId: 'core-gold', amount: 150 }]], marketIds: ['market-rogues'], requiresApproval: true }),
        createGameAsset({ name: 'Grappling Hook', icon: '🪝', description: 'For reaching high places.', url: 'https://placehold.co/150/57534e/FFFFFF?text=Hook', category: 'Tool', costGroups: [[{ rewardTypeId: 'core-gold', amount: 75 }]], marketIds: ['market-rogues'] }),
      ]
    }
  },
  {
    id: 'pack-sci-fi-explorer',
    type: 'Items',
    title: 'The Sci-Fi Explorer',
    description: 'Futuristic gear for exploring the final frontier.',
    emoji: '🚀',
    color: 'border-violet-500',
    assets: {
      markets: [createMarket({ id: 'market-scifi', title: 'Starship Outfitters', description: 'Gear for the modern spacefarer.' })],
      gameAssets: [
        createGameAsset({ name: 'Explorer Helmet', icon: '🪖', description: 'A helmet with a holographic display.', url: 'https://placehold.co/150/e0e7ff/000000?text=Helm', category: 'Avatar', avatarSlot: 'hat', costGroups: [[{ rewardTypeId: 'core-gold', amount: 60 }]], marketIds: ['market-scifi'] }),
        createGameAsset({ name: 'Jumpsuit', icon: '👨‍🚀', description: 'A sleek, form-fitting exploration suit.', url: 'https://placehold.co/150/3730a3/FFFFFF?text=Suit', category: 'Avatar', avatarSlot: 'shirt', costGroups: [[{ rewardTypeId: 'core-gold', amount: 75 }]], marketIds: ['market-scifi'] }),
        createGameAsset({ name: 'Laser Pistol', icon: '🔫', description: 'A reliable sidearm for dangerous planets.', url: 'https://placehold.co/150/ef4444/FFFFFF?text=Laser', category: 'Avatar', avatarSlot: 'hand-right', costGroups: [[{ rewardTypeId: 'core-gold', amount: 110 }]], marketIds: ['market-scifi'] }),
        createGameAsset({ name: 'Scanner', icon: '📡', description: 'A handheld device for analyzing lifeforms.', url: 'https://placehold.co/150/3b82f6/FFFFFF?text=Scan', category: 'Avatar', avatarSlot: 'hand-left', costGroups: [[{ rewardTypeId: 'core-gold', amount: 50 }]], marketIds: ['market-scifi'] }),
      ]
    }
  },
  {
    id: 'pack-pet-companions',
    type: 'Items',
    title: 'Pet Companions',
    description: 'Loyal pets to accompany you on your adventures.',
    emoji: '🐕',
    color: 'border-violet-500',
    assets: {
      markets: [createMarket({ id: 'market-pets', title: 'The Menagerie', description: 'Find a loyal friend to join you.' })],
      gameAssets: [
        createGameAsset({ name: 'Baby Dragon', icon: '🐉', description: 'A tiny dragon that sits on your shoulder.', url: 'https://placehold.co/150/dc2626/FFFFFF?text=Dragon', category: 'Avatar', avatarSlot: 'pet', costGroups: [[{ rewardTypeId: 'core-gems', amount: 200 }]], marketIds: ['market-pets'] }),
        createGameAsset({ name: 'Wise Owl', icon: '🦉', description: 'A knowledgeable owl companion.', url: 'https://placehold.co/150/a16207/FFFFFF?text=Owl', category: 'Avatar', avatarSlot: 'pet', costGroups: [[{ rewardTypeId: 'core-gems', amount: 150 }]], marketIds: ['market-pets'] }),
        createGameAsset({ name: 'Floating Sprite', icon: '🧚', description: 'A small, glowing fairy that flits around you.', url: 'https://placehold.co/150/d946ef/FFFFFF?text=Sprite', category: 'Avatar', avatarSlot: 'pet', costGroups: [[{ rewardTypeId: 'core-gems', amount: 120 }]], marketIds: ['market-pets'] }),
        createGameAsset({ name: 'Loyal Wolf Pup', icon: '🐺', description: 'A brave wolf pup that follows at your heels.', url: 'https://placehold.co/150/a8a29e/FFFFFF?text=Wolf', category: 'Avatar', avatarSlot: 'pet', costGroups: [[{ rewardTypeId: 'core-gems', amount: 180 }]], marketIds: ['market-pets'] }),
        createGameAsset({ name: 'Miniature Griffin', icon: '🦅', description: 'A proud and noble griffin, but smol.', url: 'https://placehold.co/150/f59e0b/000000?text=Griffin', category: 'Avatar', avatarSlot: 'pet', costGroups: [[{ rewardTypeId: 'core-gems', amount: 250 }]], marketIds: ['market-pets'] }),
      ]
    }
  },
  {
    id: 'pack-fun-vouchers',
    type: 'Items',
    title: 'Family Fun Night Picks',
    description: 'Vouchers for choosing the next family activity.',
    emoji: '🎲',
    color: 'border-violet-500',
    assets: {
      markets: [createMarket({ id: 'market-fun', title: 'The Fun Emporium', description: 'Redeem points for family fun!' })],
      gameAssets: [
        createGameAsset({ name: 'Board Game Choice', icon: '🎲', description: 'You pick the next board game for family game night.', url: 'https://placehold.co/150/16a34a/FFFFFF?text=Game', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-gems', amount: 50 }]], marketIds: ['market-fun'], requiresApproval: true }),
        createGameAsset({ name: 'Takeout Dinner Choice', icon: '🥡', description: 'You get to pick which restaurant to order takeout from.', url: 'https://placehold.co/150/ea580c/FFFFFF?text=Takeout', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-gems', amount: 80 }]], marketIds: ['market-fun'], requiresApproval: true }),
        createGameAsset({ name: 'Choose the Weekend Activity', icon: '🏞️', description: 'You decide what the family does this weekend (e.g. park, museum, hiking).', url: 'https://placehold.co/150/0891b2/FFFFFF?text=Weekend', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-gems', amount: 150 }]], marketIds: ['market-fun'], requiresApproval: true }),
        createGameAsset({ name: 'Family Baking Session', icon: '🍪', description: 'Choose a recipe and lead a family baking session.', url: 'https://placehold.co/150/d97706/FFFFFF?text=Baking', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-gems', amount: 60 }]], marketIds: ['market-fun'], requiresApproval: true }),
      ]
    }
  },
   {
    id: 'pack-screen-time-vouchers',
    type: 'Items',
    title: 'Screen Time Vouchers',
    description: 'Trade your hard-earned crystals for screen time.',
    emoji: '📱',
    color: 'border-violet-500',
    assets: {
      markets: [createMarket({ id: 'market-screentime', title: 'The Crystal Arcade', description: 'Your portal to the digital world.' })],
      gameAssets: [
        createGameAsset({ name: '15 Min Screen Time', icon: '⏳', description: 'A voucher for 15 minutes of screen time.', url: 'https://placehold.co/150/8b5cf6/FFFFFF?text=15m', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-crystal', amount: 25 }]], marketIds: ['market-screentime'] }),
        createGameAsset({ name: '30 Min Screen Time', icon: '⌛', description: 'A voucher for 30 minutes of screen time.', url: 'https://placehold.co/150/7c3aed/FFFFFF?text=30m', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-crystal', amount: 45 }]], marketIds: ['market-screentime'] }),
        createGameAsset({ name: '1 Hour Screen Time', icon: '⏰', description: 'A voucher for a full hour of screen time.', url: 'https://placehold.co/150/6d28d9/FFFFFF?text=1hr', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-crystal', amount: 80 }]], marketIds: ['market-screentime'] }),
      ]
    }
  },
  {
    id: 'pack-sweet-treats',
    type: 'Items',
    title: 'Sweet Treats',
    description: 'A collection of delicious candy and dessert rewards.',
    emoji: '🍬',
    color: 'border-violet-500',
    assets: {
      markets: [createMarket({ id: 'market-sweets', title: 'The Candy Shop', description: 'A sweet reward for a job well done.' })],
      gameAssets: [
        createGameAsset({ name: 'Gummy Bears', icon: '🐻', description: 'A small bag of gummy bears.', url: 'https://placehold.co/150/f59e0b/FFFFFF?text=Gummies', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-crystal', amount: 20 }]], marketIds: ['market-sweets'] }),
        createGameAsset({ name: 'Ice Cream Cone', icon: '🍦', description: 'A voucher for a single scoop of ice cream.', url: 'https://placehold.co/150/ec4899/FFFFFF?text=Ice+Cream', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-crystal', amount: 50 }]], marketIds: ['market-sweets'], requiresApproval: true }),
        createGameAsset({ name: 'Chocolate Coin', icon: '🪙', description: 'A single, delicious chocolate coin.', url: 'https://placehold.co/150/ca8a04/FFFFFF?text=Coin', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-crystal', amount: 10 }]], marketIds: ['market-sweets'] }),
        createGameAsset({ name: 'Bag of Sour Candies', icon: '🍬', description: 'A puckeringly-good bag of sour candies.', url: 'https://placehold.co/150/84cc16/FFFFFF?text=Sours', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-crystal', amount: 25 }]], marketIds: ['market-sweets'] }),
        createGameAsset({ name: 'Slice of Cake', icon: '🍰', description: 'A voucher for one slice of your favorite cake.', url: 'https://placehold.co/150/f472b6/FFFFFF?text=Cake', category: 'Real-World Reward', costGroups: [[{ rewardTypeId: 'core-crystal', amount: 60 }]], marketIds: ['market-sweets'], requiresApproval: true }),
      ]
    }
  },
  {
    id: 'pack-elemental-orbs',
    type: 'Items',
    title: 'Elemental Orbs',
    description: 'Magical orbs that can be exchanged for XP.',
    emoji: '✨',
    color: 'border-violet-500',
    assets: {
      markets: [createMarket({ id: 'market-orbs', title: 'The Alchemist\'s Hut', description: 'Transmute powerful orbs into experience.' })],
      gameAssets: [
        createGameAsset({ name: 'Orb of Strength', icon: '🔥', description: 'Crush this orb to gain Strength XP.', url: 'https://placehold.co/150/b91c1c/FFFFFF?text=Strength', category: 'Consumable', costGroups: [[{ rewardTypeId: 'core-gold', amount: 10 }]], payouts: [{ rewardTypeId: 'core-strength', amount: 100 }], marketIds: ['market-orbs'] }),
        createGameAsset({ name: 'Orb of Wisdom', icon: '💧', description: 'Gaze into this orb to gain Wisdom XP.', url: 'https://placehold.co/150/2563eb/FFFFFF?text=Wisdom', category: 'Consumable', costGroups: [[{ rewardTypeId: 'core-gold', amount: 10 }]], payouts: [{ rewardTypeId: 'core-wisdom', amount: 100 }], marketIds: ['market-orbs'] }),
        createGameAsset({ name: 'Orb of Creativity', icon: '✨', description: 'This swirling orb inspires you, granting Creativity XP.', url: 'https://placehold.co/150/db2777/FFFFFF?text=Creativity', category: 'Consumable', costGroups: [[{ rewardTypeId: 'core-gold', amount: 10 }]], payouts: [{ rewardTypeId: 'core-creative', amount: 100 }], marketIds: ['market-orbs'] }),
      ]
    }
  },
   { id: 'pack-pirate-bounty', type: 'Items', title: 'Pirate\'s Bounty', description: 'Swashbuckling gear for a high-seas adventurer.', emoji: '🏴‍☠️', color: 'border-violet-500', assets: {
        markets: [createMarket({id: 'market-pirate-bounty', title: 'The Salty Siren', description: 'Treasures from the seven seas.'})],
        gameAssets: [
            createGameAsset({ name: 'Tricorn Hat', icon: '🎩', description: 'A classic pirate captain\'s hat.', url: 'https://placehold.co/150/1e293b/FFFFFF?text=Hat', category: 'Avatar', avatarSlot: 'hat', costGroups: [[{rewardTypeId: 'core-gold', amount: 40}]], marketIds: ['market-pirate-bounty'] }),
            createGameAsset({ name: 'Eyepatch', icon: '👁️', description: 'A mysterious eyepatch. What\'s underneath?', url: 'https://placehold.co/150/0f172a/FFFFFF?text=Patch', category: 'Avatar', avatarSlot: 'face', costGroups: [[{rewardTypeId: 'core-gold', amount: 15}]], marketIds: ['market-pirate-bounty'] }),
            createGameAsset({ name: 'Cutlass', icon: '⚔️', description: 'A curved sword, perfect for ship-to-ship combat.', url: 'https://placehold.co/150/94a3b8/FFFFFF?text=Cutlass', category: 'Avatar', avatarSlot: 'hand-right', costGroups: [[{rewardTypeId: 'core-gold', amount: 80}]], marketIds: ['market-pirate-bounty'] }),
            createGameAsset({ name: 'Parrot Companion', icon: '🦜', description: 'A colorful parrot to sit on your shoulder.', url: 'https://placehold.co/150/16a34a/FFFFFF?text=Parrot', category: 'Avatar', avatarSlot: 'pet', costGroups: [[{rewardTypeId: 'core-gems', amount: 150}]], marketIds: ['market-pirate-bounty'] }),
        ]
    } },
   { id: 'pack-ninja-scrolls', type: 'Items', title: 'Ninja Scrolls', description: 'Secretive tools and garb for the aspiring shinobi.', emoji: '🥷', color: 'border-violet-500', assets: {
        markets: [createMarket({id: 'market-ninja-scrolls', title: 'The Silent Shadow Bazaar', description: 'Tools for those who walk unseen.'})],
        gameAssets: [
            createGameAsset({ name: 'Ninja Mask', icon: '🥷', description: 'A mask to conceal your identity.', url: 'https://placehold.co/150/171717/FFFFFF?text=Mask', category: 'Avatar', avatarSlot: 'face', costGroups: [[{rewardTypeId: 'core-gold', amount: 35}]], marketIds: ['market-ninja-scrolls'] }),
            createGameAsset({ name: 'Katana', icon: '🗡️', description: 'A swift and silent blade.', url: 'https://placehold.co/150/e5e7eb/FFFFFF?text=Katana', category: 'Avatar', avatarSlot: 'hand-right', costGroups: [[{rewardTypeId: 'core-gold', amount: 120}]], marketIds: ['market-ninja-scrolls'] }),
            createGameAsset({ name: 'Shuriken', icon: '🌟', description: 'A set of throwing stars. For display only!', url: 'https://placehold.co/150/737373/FFFFFF?text=Shuriken', category: 'Avatar', avatarSlot: 'hand-left', costGroups: [[{rewardTypeId: 'core-gold', amount: 50}]], marketIds: ['market-ninja-scrolls'] }),
            createGameAsset({ name: 'Smoke Bomb', icon: '💨', description: 'Allows for a stylish, smoke-filled escape.', url: 'https://placehold.co/150/a1a1aa/FFFFFF?text=Smoke', category: 'Consumable', isForSale: false, costGroups: [[{rewardTypeId: 'core-gold', amount: 20}]], marketIds: ['market-ninja-scrolls'] }),
        ]
    } },
   { id: 'pack-viking-hoard', type: 'Items', title: 'Viking Hoard', description: 'Rugged armor and axes for the northern warrior.', emoji: '🪓', color: 'border-violet-500', assets: {
        markets: [createMarket({id: 'market-viking-hoard', title: 'The Great Mead Hall', description: 'Gear for the raiders of the north.'})],
        gameAssets: [
            createGameAsset({ name: 'Horned Helm', icon: '🪖', description: 'A historically inaccurate but awesome horned helmet.', url: 'https://placehold.co/150/facc15/000000?text=Helm', category: 'Avatar', avatarSlot: 'hat', costGroups: [[{rewardTypeId: 'core-gold', amount: 60}]], marketIds: ['market-viking-hoard'] }),
            createGameAsset({ name: 'Bearded Axe', icon: '🪓', description: 'A mighty axe for mighty warriors.', url: 'https://placehold.co/150/a8a29e/FFFFFF?text=Axe', category: 'Avatar', avatarSlot: 'hand-right', costGroups: [[{rewardTypeId: 'core-gold', amount: 95}]], marketIds: ['market-viking-hoard'] }),
            createGameAsset({ name: 'Viking Shield', icon: '🛡️', description: 'A round shield for fending off blows.', url: 'https://placehold.co/150/b91c1c/FFFFFF?text=Shield', category: 'Avatar', avatarSlot: 'hand-left', costGroups: [[{rewardTypeId: 'core-gold', amount: 70}]], marketIds: ['market-viking-hoard'] }),
            createGameAsset({ name: 'Fur Cloak', icon: '🧥', description: 'A warm cloak made from the finest furs.', url: 'https://placehold.co/150/78350f/FFFFFF?text=Cloak', category: 'Avatar', avatarSlot: 'back', costGroups: [[{rewardTypeId: 'core-gold', amount: 55}]], marketIds: ['market-viking-hoard'] }),
        ]
    } },
   { id: 'pack-royal-regalia', type: 'Items', title: 'Royal Regalia', description: 'Crowns, scepters, and fine clothes for royalty.', emoji: '👑', color: 'border-violet-500', assets: {
        markets: [createMarket({id: 'market-royal-regalia', title: 'The Gilded Palace', description: 'Items fit for a king or queen.'})],
        gameAssets: [
            createGameAsset({ name: 'Royal Crown', icon: '👑', description: 'A crown of pure gold, beset with jewels.', url: 'https://placehold.co/150/fde047/000000?text=Crown', category: 'Avatar', avatarSlot: 'hat', costGroups: [[{rewardTypeId: 'core-gems', amount: 500}]], marketIds: ['market-royal-regalia'] }),
            createGameAsset({ name: 'Scepter of Power', icon: '🔱', description: 'A symbol of your authority over the realm.', url: 'https://placehold.co/150/facc15/000000?text=Scepter', category: 'Avatar', avatarSlot: 'hand-right', costGroups: [[{rewardTypeId: 'core-gems', amount: 350}]], marketIds: ['market-royal-regalia'] }),
            createGameAsset({ name: 'Ermine Mantle', icon: '🧥', description: 'A luxurious cloak of white fur.', url: 'https://placehold.co/150/f1f5f9/000000?text=Mantle', category: 'Avatar', avatarSlot: 'back', costGroups: [[{rewardTypeId: 'core-gold', amount: 200}]], marketIds: ['market-royal-regalia'] }),
            createGameAsset({ name: 'Orb of Command', icon: '🔮', description: 'A crystal ball that shows your dominion.', url: 'https://placehold.co/150/a78bfa/FFFFFF?text=Orb', category: 'Avatar', avatarSlot: 'hand-left', costGroups: [[{rewardTypeId: 'core-gems', amount: 300}]], marketIds: ['market-royal-regalia'] }),
        ]
    } },


  // =================================================================================
  // == TROPHY PACKS =================================================================
  // =================================================================================
  {
    id: 'pack-getting-started-trophies',
    type: 'Trophies',
    title: 'Getting Started Trophies',
    description: 'A set of introductory trophies for new players to achieve.',
    emoji: '🏆',
    color: 'border-amber-500',
    assets: {
      trophies: [
        createTrophy({ name: 'The First Step', description: 'Complete your very first quest.', icon: '🎉', isManual: false, requirements: [{ type: TrophyRequirementType.CompleteQuestType, value: QuestType.Duty, count: 1 }] }),
        createTrophy({ name: 'Venture Forth', description: 'Complete your first Venture.', icon: '🗺️', isManual: false, requirements: [{ type: TrophyRequirementType.CompleteQuestType, value: QuestType.Venture, count: 1 }] }),
        createTrophy({ name: 'Shopkeeper', description: 'Make your first purchase from a market.', icon: '🛍️', isManual: true }),
        createTrophy({ name: 'A New Look', description: 'Equip an avatar item for the first time.', icon: '🧑‍🎤', isManual: true }),
      ]
    }
  },
  {
    id: 'pack-household-hero-trophies',
    type: 'Trophies',
    title: 'Household Hero',
    description: 'Trophies awarded for consistency and excellence in completing chores.',
    emoji: '🦸',
    color: 'border-amber-500',
    assets: {
      trophies: [
        createTrophy({ name: 'Tidy Titan', description: 'Complete 10 "Cleaning" quests.', icon: '✨', isManual: false, requirements: [{ type: TrophyRequirementType.CompleteQuestTag, value: 'Cleaning', count: 10 }] }),
        createTrophy({ name: 'Master of the Mundane', description: 'Complete 50 Duties.', icon: '⚙️', isManual: false, requirements: [{ type: TrophyRequirementType.CompleteQuestType, value: QuestType.Duty, count: 50 }] }),
        createTrophy({ name: 'Kitchen Captain', description: 'Complete 25 quests with the "Kitchen" tag.', icon: '🧑‍🍳', isManual: false, requirements: [{ type: TrophyRequirementType.CompleteQuestTag, value: 'Kitchen', count: 25 }] }),
        createTrophy({ name: 'Yardwork Yarl', description: 'Complete 10 "Yardwork" quests.', icon: '🌳', isManual: false, requirements: [{ type: TrophyRequirementType.CompleteQuestTag, value: 'Yardwork', count: 10 }] }),
      ]
    }
  },
   { id: 'pack-academic-excellence', type: 'Trophies', title: 'Academic Excellence', description: 'Awards for diligence in studies and learning.', emoji: '🎓', color: 'border-amber-500', assets: {
       trophies: [
           createTrophy({name: 'Honor Roll', description: 'For getting straight A\'s on a report card.', icon: '🅰️'}),
           createTrophy({name: 'Perfect Attendance', description: 'For not missing a single day of school.', icon: '🗓️'}),
           createTrophy({name: 'Bookworm', description: 'For reading 25 books in a school year.', icon: '🐛'}),
           createTrophy({name: 'Homework Hero', description: 'Complete homework on time for a full month.', icon: '💯'}),
       ]
   } },
   { id: 'pack-creative-mind', type: 'Trophies', title: 'Creative Mind', description: 'Recognizing achievements in art, music, and writing.', emoji: '🎨', color: 'border-amber-500', assets: {
       trophies: [
            createTrophy({name: 'The Artist', description: 'For creating a masterpiece of art.', icon: '🎨'}),
            createTrophy({name: 'The Bard', description: 'For a wonderful musical performance.', icon: '🎵'}),
            createTrophy({name: 'The Architect', description: 'For building an impressive creation (LEGOs, Minecraft, etc).', icon: '🏰'}),
            createTrophy({name: 'The Director', description: 'For creating and editing a video.', icon: '🎬'}),
       ]
   } },
   { id: 'pack-sportsmanship', type: 'Trophies', title: 'Sportsmanship', description: 'Trophies for teamwork, practice, and athletic achievements.', emoji: '🏅', color: 'border-amber-500', assets: {
       trophies: [
            createTrophy({name: 'Team Player', description: 'For excellent teamwork in a game.', icon: '🏅'}),
            createTrophy({name: 'Personal Best', description: 'For beating your own record.', icon: '📈'}),
            createTrophy({name: 'Tournament Victor', description: 'For winning a tournament.', icon: '🥇'}),
            createTrophy({name: 'Good Sport', description: 'For showing great sportsmanship, win or lose.', icon: '🤝'}),
       ]
   } },
   { id: 'pack-social-butterfly', type: 'Trophies', title: 'Social Butterfly', description: 'Awards for kindness, helping, and family participation.', emoji: '🦋', color: 'border-amber-500', assets: {
       trophies: [
            createTrophy({name: 'The Encourager', description: 'For cheering up a family member who was feeling down.', icon: '🤗'}),
            createTrophy({name: 'The Listener', description: 'For being a great listener when someone needed to talk.', icon: '👂'}),
            createTrophy({name: 'The Giver', description: 'For giving a thoughtful, handmade gift.', icon: '🎁'}),
            createTrophy({name: 'The Collaborator', description: 'For working well on a family project.', icon: '🧑‍🤝‍🧑'}),
       ]
   } },
   { id: 'pack-adventurer-milestones', type: 'Trophies', title: 'Adventurer Milestones', description: 'Major milestones in an adventurer\'s career.', emoji: '🗺️', color: 'border-amber-500', assets: {
       trophies: [
            createTrophy({name: 'Apprentice Adventurer', description: 'Achieve the rank of Apprentice.', icon: '🛠️', isManual: false, requirements: [{ type: TrophyRequirementType.AchieveRank, value: 'rank-3', count: 1 }]}),
            createTrophy({name: 'Quest Completionist (10)', description: 'Complete 10 total quests.', icon: '🔟'}),
            createTrophy({name: 'Gold Hoarder', description: 'Amass 1,000 gold coins.', icon: '💰'}),
            createTrophy({name: 'Level Up!', description: 'Reach Rank 5.', icon: '🌟'}),
       ]
   } },
   { id: 'pack-financial-whiz', type: 'Trophies', title: 'Financial Whiz', description: 'Trophies for saving money and learning financial literacy.', emoji: '💰', color: 'border-amber-500', assets: {
       trophies: [
            createTrophy({name: 'The Penny Pincher', description: 'For saving up your allowance for a big goal.', icon: '🐷'}),
            createTrophy({name: 'Smart Saver', description: 'Save 50% of your earnings for a month.', icon: '💹'}),
            createTrophy({name: 'Budget Boss', description: 'Create and stick to a personal budget for a month.', icon: '📋'}),
       ]
   } },
   { id: 'pack-pet-champion', type: 'Trophies', title: 'Pet Champion', description: 'Awards for excellent care of pets.', emoji: '🐾', color: 'border-amber-500', assets: {
       trophies: [
            createTrophy({name: 'The Pet Pal', description: 'For taking excellent care of a pet.', icon: '🐾'}),
            createTrophy({name: 'Happy & Healthy', description: 'Remember to feed and water the pets every day for a week.', icon: '❤️'}),
            createTrophy({name: 'The Trainer', description: 'Teach a pet a new trick.', icon: '🎓'}),
       ]
   } },
   { id: 'pack-funny-bone', type: 'Trophies', title: 'Funny Bone Awards', description: 'A collection of humorous, light-hearted achievements.', emoji: '😂', color: 'border-amber-500', assets: {
       trophies: [
            createTrophy({name: 'The Punisher', description: 'For telling an exceptionally great (or terrible) pun.', icon: '😂'}),
            createTrophy({name: 'Klutz of the Week', description: 'For a spectacular, harmless trip or fall.', icon: '🤕'}),
            createTrophy({name: 'The Snorter', description: 'For laughing so hard you snorted.', icon: '🐽'}),
            createTrophy({name: 'The Snackinator', description: 'For impressively finishing a bag of snacks.', icon: '🍿'}),
       ]
   } },

  // =================================================================================
  // == MARKET PACKS =================================================================
  // =================================================================================
  {
    id: 'pack-starter-markets',
    type: 'Markets',
    title: 'Starter Markets',
    description: 'A few essential markets to get your economy going, including a bank and reward board.',
    emoji: '🏪',
    color: 'border-lime-500',
    assets: {
        markets: [
            createMarket({ title: 'The Exchange Post', description: 'Exchange your various currencies and experience points.', icon: '⚖️' }),
            createMarket({ title: 'The Reward Board', description: 'Cash in your points for real rewards!', icon: '🎟️' }),
            createMarket({ title: 'The Adventurer\'s Guild', description: 'Purchase gear and supplies for your quests.', icon: '⚔️' }),
        ]
    }
  },
  { id: 'pack-fantasy-shops', type: 'Markets', title: 'Fantasy Shops', description: 'A collection of classic fantasy-themed shops.', emoji: '🧙', color: 'border-lime-500', assets: {
      markets: [
          createMarket({ title: 'The Dragon\'s Hoard', description: 'A shop for rare and magical items.', icon: '🐲' }),
          createMarket({ title: 'The Dwarven Forge', description: 'The finest weapons and armor.', icon: '🔥' }),
          createMarket({ title: 'The Elven Grove', description: 'Potions, herbs, and natural remedies.', icon: '🌿' }),
      ]
  } },
  { id: 'pack-modern-stores', type: 'Markets', title: 'Modern Stores', description: 'Stores with a modern or everyday theme.', emoji: '🏬', color: 'border-lime-500', assets: {
       markets: [
          createMarket({ title: 'The Tech Hub', description: 'Gadgets, games, and electronics.', icon: '💻' }),
          createMarket({ title: 'The Corner Store', description: 'Snacks, drinks, and everyday essentials.', icon: '🏪' }),
          createMarket({ title: 'The Hobby Shop', description: 'Models, games, and creative supplies.', icon: '🎨' }),
      ]
  } },
  { id: 'pack-sci-fi-terminals', type: 'Markets', title: 'Sci-Fi Terminals', description: 'Futuristic vendors and data terminals.', emoji: '🤖', color: 'border-lime-500', assets: {
       markets: [
          createMarket({ title: 'Starship Requisitions', description: 'Parts and upgrades for your starship.', icon: '🚀' }),
          createMarket({ title: 'Cybernetics Clinic', description: 'Augmentations and cybernetic implants.', icon: '🦾' }),
          createMarket({ title: 'Data Broker', description: 'Information is the most valuable currency.', icon: '🌐' }),
      ]
  } },
  { id: 'pack-nature-stalls', type: 'Markets', title: 'Nature\'s Stalls', description: 'Markets themed around nature, farming, and the outdoors.', emoji: '🌿', color: 'border-lime-500', assets: {
       markets: [
            createMarket({ title: 'The Farmer\'s Market', description: 'Fresh produce and farm goods.', icon: '🧑‍🌾' }),
            createMarket({ title: 'The Herbalist\'s Hut', description: 'Natural remedies and potent potions.', icon: '🌿' }),
            createMarket({ title: 'The Beast Tamer', description: 'Find a new loyal companion.', icon: '🐾' }),
        ]
  } },
  { id: 'pack-services-guilds', type: 'Markets', title: 'Services & Guilds', description: 'Places to buy services or access guild-specific items.', emoji: '🤝', color: 'border-lime-500', assets: {
        markets: [
            createMarket({ title: 'Thieves\' Guild', description: 'Need something... acquired? For a price.', icon: '🤫' }),
            createMarket({ title: 'Mages\' College', description: 'Purchase spells and enchanting services.', icon: '✨' }),
            createMarket({ title: 'Warriors\' Guild', description: 'Hire mercenaries or train your skills.', icon: '⚔️' }),
        ]
  } },
  { id: 'pack-food-vendors', type: 'Markets', title: 'Food & Drink Vendors', description: 'Taverns, bakeries, and candy shops.', emoji: '🍔', color: 'border-lime-500', assets: {
        markets: [
            createMarket({ title: 'The Prancing Pony Tavern', description: 'A cozy place for a hearty meal.', icon: '🍺' }),
            createMarket({ title: 'The Sweet Hearth Bakery', description: 'Delicious breads, cakes, and pastries.', icon: '🥐' }),
            createMarket({ title: 'The Fizzing Cauldron', description: 'Potions, elixirs, and bubbly drinks.', icon: '⚗️' }),
        ]
  } },
  { id: 'pack-seasonal-markets', type: 'Markets', title: 'Seasonal Markets', description: 'Markets for holidays like Halloween or Christmas.', emoji: '🎃', color: 'border-lime-500', assets: {
        markets: [
            createMarket({ title: 'The Spooky Shack', description: 'Costumes, candy, and creepy decorations.', icon: '🎃' }),
            createMarket({ title: 'The Winter Solstice Market', description: 'Gifts, warm drinks, and festive cheer.', icon: '🎄' }),
        ]
  } },
  { id: 'pack-underground-bazaar', type: 'Markets', title: 'Underground Bazaar', description: 'Mysterious and shady places to find rare goods.', emoji: '🤫', color: 'border-lime-500', assets: {
        markets: [
            createMarket({ title: 'The Black Market', description: 'Don\'t ask where these items came from.', icon: '💀' }),
            createMarket({ title: 'The Smuggler\'s Cove', description: 'Rare goods from distant lands.', icon: '⚓' }),
        ]
  } },
  { id: 'pack-crafting-stations', type: 'Markets', title: 'Crafting Stations', description: 'Workshops for crafting, enchanting, and alchemy.', emoji: '🛠️', color: 'border-lime-500', assets: {
        markets: [
            createMarket({ title: 'The Alchemist\'s Lab', description: 'Brew powerful potions and elixirs.', icon: '⚗️' }),
            createMarket({ title: 'The Blacksmith\'s Forge', description: 'Craft your own weapons and armor.', icon: '🔥' }),
            createMarket({ title: 'The Scribe\'s Desk', description: 'Create magical scrolls and maps.', icon: '📜' }),
        ]
  } },

  // =================================================================================
  // == REWARD PACKS =================================================================
  // =================================================================================
  {
    id: 'pack-expanded-economy',
    type: 'Rewards',
    title: 'Expanded Economy',
    description: 'Adds new currencies and XP types for more complex economic systems.',
    emoji: '💸',
    color: 'border-cyan-500',
    assets: {
        rewardTypes: [
            createReward({ name: 'Reputation', description: 'Points earned for completing guild-specific tasks.', category: RewardCategory.XP, icon: '🌟' }),
            createReward({ name: 'Arcane Dust', description: 'A magical currency for enchanting items.', category: RewardCategory.Currency, icon: '✨' }),
            createReward({ name: 'Crafting Components', description: 'Resources used for building and crafting.', category: RewardCategory.Currency, icon: '🔩' }),
        ]
    }
  },
   { id: 'pack-elemental-xp', type: 'Rewards', title: 'Elemental XP', description: 'XP types based on Fire, Water, Earth, and Air.', emoji: '🔥', color: 'border-cyan-500', assets: {
       rewardTypes: [
            createReward({ name: 'Fire Essence', description: 'XP earned from destructive or passionate tasks.', category: RewardCategory.XP, icon: '🔥' }),
            createReward({ name: 'Water Droplets', description: 'XP earned from cleaning or healing tasks.', category: RewardCategory.XP, icon: '💧' }),
            createReward({ name: 'Earth Runes', description: 'XP earned from building or gardening tasks.', category: RewardCategory.XP, icon: '🌿' }),
            createReward({ name: 'Air Wisps', description: 'XP earned from tasks requiring speed or intellect.', category: RewardCategory.XP, icon: '💨' }),
        ]
   } },
];