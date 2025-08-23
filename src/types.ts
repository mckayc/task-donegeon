
// Re-export all the modularized types
export * from './components/users/types';
export * from './components/items/types';
export * from './components/quests/types';
export * from './components/trophies/types';
export * from './components/ranks/types';
export * from './components/rotations/types';
export * from './components/guilds/types';
export * from './components/modifiers/types';
export * from './components/events/types';
export * from './components/system/types';
export * from './components/sharing/types';
export * from './components/themes/types';
export * from './components/chat/types';
export * from './components/dev/types';
export * from './components/trading/types';
export * from './components/chronicles/types';

// Export global types from the new file for any legacy imports that might remain
export * from './types/app';


// MASTER DATA INTERFACE (Aggregator)

export interface IAppData {
  users: import('./components/users/types').User[];
  quests: import('./components/quests/types').Quest[];
  questGroups: import('./components/quests/types').QuestGroup[];
  markets: import('./components/items/types').Market[];
  rewardTypes: import('./components/items/types').RewardTypeDefinition[];
  questCompletions: import('./components/quests/types').QuestCompletion[];
  purchaseRequests: import('./components/items/types').PurchaseRequest[];
  guilds: import('./components/guilds/types').Guild[];
  ranks: import('./components/ranks/types').Rank[];
  trophies: import('./components/trophies/types').Trophy[];
  userTrophies: import('./components/trophies/types').UserTrophy[];
  adminAdjustments: import('./components/users/types').AdminAdjustment[];
  gameAssets: import('./components/items/types').GameAsset[];
  systemLogs: import('./components/system/types').SystemLog[];
  settings: import('./types/app').AppSettings;
  themes: import('./components/themes/types').ThemeDefinition[];
  loginHistory: string[];
  chatMessages: import('./components/chat/types').ChatMessage[];
  systemNotifications: import('./components/system/types').SystemNotification[];
  scheduledEvents: import('./components/events/types').ScheduledEvent[];
  rotations: import('./components/rotations/types').Rotation[];
  bugReports: import('./components/dev/types').BugReport[];
  modifierDefinitions: import('./components/modifiers/types').ModifierDefinition[];
  appliedModifiers: import('./components/modifiers/types').AppliedModifier[];
  tradeOffers: import('./components/trading/types').TradeOffer[];
  gifts: import('./components/trading/types').Gift[];
}
