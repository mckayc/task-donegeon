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
        createGameAsset({ name: 'Steel Helm', icon: '⛑️', description: 'A protective steel helmet.', url: 'https://placehold.co/150/9ca3af/FFFFFF?text=Helm', category: 'Avatar', avatarSlot: 'hat', costGroups: