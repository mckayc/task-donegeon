

import { GenerateContentResponse } from "@google/genai";
import { User, UserTemplate, AdminAdjustment } from './src/components/users/types';
import { GameAsset, Market, PurchaseRequest, RewardTypeDefinition } from './src/components/items/types';
import { Quest, QuestGroup, QuestCompletion } from './src/components/quests/types';
import { Trophy, UserTrophy } from './src/components/trophies/types';
import { Rank } from './src/components/ranks/types';
import { Rotation } from './src/components/rotations/types';
import { Guild } from './src/components/guilds/types';
import { ModifierDefinition, AppliedModifier } from './src/components/modifiers/types';
import { ScheduledEvent } from './src/components/events/types';
import { SystemLog, SystemNotification } from './src/components/system/types';
import { ChatMessage } from './src/components/chat/types';
import { BugReport } from './src/components/dev/types';
import { TradeOffer, Gift } from './src/components/trading/types';
import { ThemeDefinition } from './src/components/themes/types';
import { AppSettings } from './src/types/app';

// Re-export all the modularized types
export * from './src/components/users/types';
export * from './src/components/items/types';
export * from './src/components/quests/types';
export * from './src/components/trophies/types';
export * from './src/components/ranks/types';
export * from './src/components/rotations/types';
export * from './src/components/guilds/types';
export * from './src/components/modifiers/types';
export * from './src/components/events/types';
export * from './src/components/system/types';
export * from './src/components/sharing/types';
export * from './src/components/themes/types';
export * from './src/components/chat/types';
export * from './src/components/dev/types';
export * from './src/components/trading/types';
export * from './src/components/chronicles/types';
export * from './src/types/app';


// MASTER DATA INTERFACE (Aggregator)

export interface IAppData {
  users: User[];
  quests: Quest[];
  questGroups: QuestGroup[];
  markets: Market[];
  rewardTypes: RewardTypeDefinition[];
  questCompletions: QuestCompletion[];
  purchaseRequests: PurchaseRequest[];
  guilds: Guild[];
  ranks: Rank[];
  trophies: Trophy[];
  userTrophies: UserTrophy[];
  adminAdjustments: AdminAdjustment[];
  gameAssets: GameAsset[];
  systemLogs: SystemLog[];
  settings: AppSettings;
  themes: ThemeDefinition[];
  loginHistory: string[];
  chatMessages: ChatMessage[];
  systemNotifications: SystemNotification[];
  scheduledEvents: ScheduledEvent[];
  rotations: Rotation[];
  bugReports: BugReport[];
  modifierDefinitions: ModifierDefinition[];
  appliedModifiers: AppliedModifier[];
  tradeOffers: TradeOffer[];
  gifts: Gift[];
}
