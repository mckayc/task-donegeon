

import { GenerateContentResponse } from "@google/genai";
import { User, UserTemplate, AdminAdjustment } from './components/users/types';
import { GameAsset, Market, PurchaseRequest, RewardTypeDefinition } from './components/items/types';
import { Quest, QuestGroup, QuestCompletion } from './components/quests/types';
import { Trophy, UserTrophy } from './components/trophies/types';
import { Rank } from './components/ranks/types';
import { Rotation } from './components/rotations/types';
import { Guild } from './components/guilds/types';
import { ModifierDefinition, AppliedModifier } from './components/modifiers/types';
import { ScheduledEvent } from './components/events/types';
import { SystemLog, SystemNotification } from './components/system/types';
import { ChatMessage } from './components/chat/types';
import { BugReport } from './components/dev/types';
import { TradeOffer, Gift } from './components/trading/types';
import { ThemeDefinition } from './components/themes/types';
import { AppSettings } from './types/app';

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
export * from './types/app';


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