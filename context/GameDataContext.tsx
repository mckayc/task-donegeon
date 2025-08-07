// This file is obsolete. Please use useAppState() and useAppDispatch() from context/AppContext.tsx directly.

import React from 'react';
import { User, Quest, RewardTypeDefinition, QuestCompletion, RewardItem, Market, PurchaseRequest, Guild, Rank, Trophy, UserTrophy, Notification, AdminAdjustment, SystemLog, AssetPack, ImportResolution, GameAsset } from '../types';
import { useAppState, useAppDispatch } from './AppContext';
import { useUIState, useUIDispatch } from './UIStateContext';

// The state slice provided by this context
export interface GameDataState {
  users: User[];
  quests: Quest[];
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
  notifications: Notification[];
  activeMarketId: string | null;
  allTags: string[];
  isDataLoaded: boolean;
}

// The dispatch functions provided by this context
export interface GameDataDispatch {
  setRanks: (ranks: Rank[]) => void;
  addQuest: (quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => void;
  updateQuest: (updatedQuest: Quest) => void;
  deleteQuest: (questId: string) => void;
  dismissQuest: (questId: string, userId: string) => void;
  addRewardType: (rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => void;
  updateRewardType: (rewardType: RewardTypeDefinition) => void;
  deleteRewardType: (rewardTypeId: string) => void;
  completeQuest: (questId: string, userId: string, rewards: RewardItem[], requiresApproval: boolean, guildId?: string, options?: { note?: string; completionDate?: Date }) => void;
  approveQuestCompletion: (completionId: string, note?: string) => void;
  rejectQuestCompletion: (completionId: string, note?: string) => void;
  claimQuest: (questId: string, userId: string) => void;
  releaseQuest: (questId: string, userId: string) => void;
  markQuestAsTodo: (questId: string, userId: string) => void;
  unmarkQuestAsTodo: (questId: string, userId: string) => void;
  addMarket: (market: Omit<Market, 'id'>) => void;
  updateMarket: (market: Market) => void;
  deleteMarket: (marketId: string) => void;
  purchaseMarketItem: (assetId: string, marketId: string, user: User, costGroupIndex: number) => void;
  cancelPurchaseRequest: (purchaseId: string) => void;
  approvePurchaseRequest: (purchaseId: string) => void;
  rejectPurchaseRequest: (purchaseId: string) => void;
  addGuild: (guild: Omit<Guild, 'id'>) => void;
  updateGuild: (guild: Guild) => void;
  deleteGuild: (guildId: string) => void;
  addTrophy: (trophy: Omit<Trophy, 'id'>) => void;
  updateTrophy: (trophy: Trophy) => void;
  deleteTrophy: (trophyId: string) => void;
  awardTrophy: (userId: string, trophyId: string, guildId?: string) => void;
  applyManualAdjustment: (adjustment: Omit<AdminAdjustment, 'id' | 'adjustedAt'>) => boolean;
  addGameAsset: (asset: Omit<GameAsset, 'id' | 'creatorId' | 'createdAt'>) => void;
  updateGameAsset: (asset: GameAsset) => void;
  deleteGameAsset: (assetId: string) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (notificationId: string) => void;
  setActiveMarketId: (marketId: string | null) => void;
  importBlueprint: (assetPack: AssetPack, resolutions: ImportResolution[]) => void;
  restoreFromBackup: (backupData: any) => void;
  populateInitialGameData: (adminUser: User) => void;
  clearAllHistory: () => void;
  resetAllPlayerData: () => void;
  deleteAllCustomContent: () => void;
  deleteSelectedAssets: (selection: any) => void;
  uploadFile: (file: File) => Promise<{ url: string } | null>;
}

// Hook to consume the game data state slice
export const useGameData = (): GameDataState => {
  const {
    users, quests, markets, rewardTypes, questCompletions, purchaseRequests, guilds, ranks, trophies, userTrophies, adminAdjustments, gameAssets, systemLogs,
    notifications, isDataLoaded, allTags
  } = useAppState();
  const { activeMarketId } = useUIState(); // This hook is now split

  return {
    users, quests, markets, rewardTypes, questCompletions, purchaseRequests, guilds, ranks, trophies, userTrophies, adminAdjustments, gameAssets, systemLogs,
    notifications, activeMarketId, allTags, isDataLoaded
  };
};

// Hook to consume the game data dispatch functions
export const useGameDataDispatch = (): GameDataDispatch => {
  const dispatch = useAppDispatch();
  const uiDispatch = useUIDispatch();
  // We can return the entire dispatch object or a slice of it
  return { ...dispatch, ...uiDispatch } as unknown as GameDataDispatch;
};

// Note: The GameDataProvider is no longer needed here as AppProvider in AppContext.tsx handles everything.
export const GameDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
