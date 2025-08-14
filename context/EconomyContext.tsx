

import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import { 
    RewardTypeDefinition, Market, PurchaseRequest, GameAsset, RewardItem, 
    PurchaseRequestStatus, RewardCategory, IAppData, ShareableAssetType, 
    AssetPack, ImportResolution, MarketStatus, User, ScheduledEvent 
} from '../types';
import { useNotificationsDispatch } from './NotificationsContext';
import { useAuthDispatch, useAuthState } from './AuthContext';
import { toYMD } from '../utils/quests';
import { bugLogger } from '../utils/bugLogger';

// State managed by this context
interface EconomyState {
  markets: Market[];
  rewardTypes: RewardTypeDefinition[];
  purchaseRequests: PurchaseRequest[];
  gameAssets: GameAsset[];
}

// Dispatch functions provided by this context
interface EconomyDispatch {
  // Setup
  setMarkets: React.Dispatch<React.SetStateAction<Market[]>>;
  setRewardTypes: React.Dispatch<React.SetStateAction<RewardTypeDefinition[]>>;
  setPurchaseRequests: React.Dispatch<React.SetStateAction<PurchaseRequest[]>>;
  setGameAssets: React.Dispatch<React.SetStateAction<GameAsset[]>>;
  
  // Reward Types
  addRewardType: (rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => Promise<void>;
  updateRewardType: (rewardType: RewardTypeDefinition) => Promise<void>;
  deleteRewardType: (rewardTypeId: string) => Promise<void>;
  cloneRewardType: (rewardTypeId: string) => Promise<void>;

  // Markets
  addMarket: (market: Omit<Market, 'id'>) => Promise<void>;
  updateMarket: (market: Market) => Promise<void>;
  deleteMarket: (marketId: string) => Promise<void>;
  cloneMarket: (marketId: string) => Promise<void>;
  deleteMarkets: (marketIds: string[]) => Promise<void>;
  updateMarketsStatus: (marketIds: string[], statusType: 'open' | 'closed') => Promise<void>;

  // Game Assets
  addGameAsset: (asset: Omit<GameAsset, 'id' | 'creatorId' | 'createdAt' | 'purchaseCount'>) => Promise<void>;
  updateGameAsset: (asset: GameAsset) => Promise<void>;
  cloneGameAsset: (assetId: string) => Promise<void>;
  deleteGameAssets: (assetIds: string[]) => Promise<void>;

  // Purchases
  purchaseMarketItem: (assetId: string, marketId: string, user: User, costGroupIndex: number, scheduledEvents: ScheduledEvent[]) => void;
  cancelPurchaseRequest: (purchaseId: string) => void;
  approvePurchaseRequest: (purchaseId: string) => void;
  rejectPurchaseRequest: (purchaseId: string) => void;

  // Core Economy Actions
  applyRewards: (userId: string, rewardsToApply: RewardItem[], guildId?: string) => void;
  deductRewards: (userId: string, cost: RewardItem[], guildId?: string) => boolean;
  executeExchange: (userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => Promise<void>;
  
  // Bulk/Admin Actions
  importAssetPack: (assetPack: AssetPack, resolutions: ImportResolution[], allData: IAppData) => Promise<void>;
  deleteAllCustomContent: () => void;
  deleteSelectedAssets: (selection: Partial<Record<ShareableAssetType, string[]>>) => void;
}

const EconomyStateContext = createContext<EconomyState | undefined>(undefined);
const EconomyDispatchContext = createContext<EconomyDispatch | undefined>(undefined);

export const EconomyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addNotification } = useNotificationsDispatch();
  const authDispatch = useAuthDispatch();
  const { users } = useAuthState();

  const [markets, setMarkets] = useState<Market[]>([]);
  const [rewardTypes, setRewardTypes] = useState<RewardTypeDefinition[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [gameAssets, setGameAssets] = useState<GameAsset[]>([]);

  const apiRequest = useCallback(async (method: string, path: string, body?: any) => {
    try {
        const options: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const response = await window.fetch(path, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Server error' }));
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }
        if (response.status === 204) {
             return null;
        }
        return await response.json();
    } catch (error) {
        addNotification({ type: 'error', message: error instanceof Error ? error.message : 'An unknown network error occurred.' });
        throw error;
    }
  }, [addNotification]);

  // === CORE ECONOMY LOGIC ===

  const applyRewards = useCallback((userId: string, rewardsToApply: RewardItem[], guildId?: string) => {
    authDispatch.updateUser(userId, (userToUpdate) => {
      const newUser = JSON.parse(JSON.stringify(userToUpdate));
      rewardsToApply.forEach(reward => {
        const rewardDef = rewardTypes.find(rd => rd.id === reward.rewardTypeId);
        if (!rewardDef) return;
        const amount = parseFloat(String(reward.amount)) || 0;
        if (guildId) {
          if (!newUser.guildBalances[guildId]) newUser.guildBalances[guildId] = { purse: {}, experience: {} };
          const balanceSheet = newUser.guildBalances[guildId];
          if (rewardDef.category === RewardCategory.Currency) {
            balanceSheet.purse[reward.rewardTypeId] = (balanceSheet.purse[reward.rewardTypeId] || 0) + amount;
          } else {
            balanceSheet.experience[reward.rewardTypeId] = (balanceSheet.experience[reward.rewardTypeId] || 0) + amount;
          }
        } else {
          if (rewardDef.category === RewardCategory.Currency) {
            newUser.personalPurse[reward.rewardTypeId] = (newUser.personalPurse[reward.rewardTypeId] || 0) + amount;
          } else {
            newUser.personalExperience[reward.rewardTypeId] = (newUser.personalExperience[reward.rewardTypeId] || 0) + amount;
          }
        }
      });
      return newUser; // Return only the changed part
    });
  }, [rewardTypes, authDispatch]);

  const deductRewards = useCallback((userId: string, cost: RewardItem[], guildId?: string): boolean => {
    const user = users.find(u => u.id === userId);
    if (!user) return false;

    const canAfford = cost.every(item => {
        const rewardDef = rewardTypes.find(rt => rt.id === item.rewardTypeId);
        if (!rewardDef) return false;
        
        const balanceSource = guildId 
            ? user.guildBalances?.[guildId]
            : { purse: user.personalPurse, experience: user.personalExperience };
        
        if (!balanceSource) return false;
        
        const balance = rewardDef.category === RewardCategory.Currency 
            ? balanceSource.purse?.[item.rewardTypeId] || 0
            : balanceSource.experience?.[item.rewardTypeId] || 0;
            
        return balance >= item.amount;
    });

    if (!canAfford) {
        return false;
    }

    authDispatch.updateUser(userId, userToUpdate => {
      const userCopy = JSON.parse(JSON.stringify(userToUpdate));
      cost.forEach(c => {
          const rewardDef = rewardTypes.find(rt => rt.id === c.rewardTypeId);
          if (!rewardDef) return;
          const amount = parseFloat(String(c.amount)) || 0;

          if (guildId) {
              if (!userCopy.guildBalances[guildId]) userCopy.guildBalances[guildId] = { purse: {}, experience: {} };
              const balanceSheet = userCopy.guildBalances[guildId];
              if (rewardDef.category === RewardCategory.Currency) {
                  balanceSheet.purse[c.rewardTypeId] = (balanceSheet.purse[c.rewardTypeId] || 0) - amount;
              } else {
                  balanceSheet.experience[c.rewardTypeId] = (balanceSheet.experience[c.rewardTypeId] || 0) - amount;
              }
          } else {
              if (rewardDef.category === RewardCategory.Currency) {
                  userCopy.personalPurse[c.rewardTypeId] = (userCopy.personalPurse[c.rewardTypeId] || 0) - amount;
              } else {
                  userCopy.personalExperience[c.rewardTypeId] = (userCopy.personalExperience[c.rewardTypeId] || 0) - amount;
              }
          }
      });
      return userCopy;
    });
    
    return true;
  }, [users, rewardTypes, authDispatch]);
  
  const purchaseMarketItem = useCallback((assetId: string, marketId: string, user: User, costGroupIndex: number, scheduledEvents: ScheduledEvent[]) => {
    if (bugLogger.isRecording()) {
      bugLogger.add({ type: 'ACTION', message: `User ${user.gameName} attempting to purchase asset ${assetId}` });
    }
    const market = markets.find(m => m.id === marketId);
    const asset = gameAssets.find(ga => ga.id === assetId);
    if (!market || !asset) return;
    
    const cost = asset.costGroups[costGroupIndex];
    if (!cost) {
        addNotification({ type: 'error', message: 'Invalid cost option selected.' });
        return;
    }

    const todayYMD = toYMD(new Date());
    const activeSaleEvent = scheduledEvents.find(event => 
        event.eventType === 'MarketSale' && event.modifiers.marketId === marketId &&
        todayYMD >= event.startDate && todayYMD <= event.endDate && event.guildId === market.guildId &&
        (!event.modifiers.assetIds || event.modifiers.assetIds.length === 0 || event.modifiers.assetIds.includes(assetId))
    );

    let finalCost = cost;
    if (activeSaleEvent && activeSaleEvent.modifiers.discountPercent) {
        const discount = activeSaleEvent.modifiers.discountPercent / 100;
        finalCost = cost.map(c => ({ ...c, amount: Math.max(0, Math.ceil(c.amount * (1 - discount))) }));
        addNotification({type: 'info', message: `${activeSaleEvent.title}: ${activeSaleEvent.modifiers.discountPercent}% discount applied!`})
    }
    
    const canAfford = deductRewards(user.id, finalCost, market.guildId);

    if (canAfford) {
        if (asset.requiresApproval) {
            const newRequest: PurchaseRequest = {
                id: `purchase-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                userId: user.id, assetId, requestedAt: new Date().toISOString(), status: PurchaseRequestStatus.Pending,
                assetDetails: { name: asset.name, description: asset.description, cost: finalCost }, guildId: market.guildId,
            };
            setPurchaseRequests(p => [...p, newRequest]);
            addNotification({ type: 'info', message: 'Purchase requested. Funds have been held.' });
        } else {
            authDispatch.updateUser(user.id, updatedUser => {
                const userCopy = JSON.parse(JSON.stringify(updatedUser));
                if (asset.payouts && asset.payouts.length > 0) applyRewards(user.id, asset.payouts, market.guildId);
                if (asset.linkedThemeId && !userCopy.ownedThemes.includes(asset.linkedThemeId)) userCopy.ownedThemes.push(asset.linkedThemeId);
                if (!asset.payouts || asset.payouts.length === 0) userCopy.ownedAssetIds.push(asset.id);
                return userCopy;
            });
            addNotification({ type: 'success', message: `Purchased "${asset.name}"!` });
            setPurchaseRequests(p => [...p, { id: `purchase-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, userId: user.id, assetId, requestedAt: new Date().toISOString(), status: PurchaseRequestStatus.Completed, assetDetails: { name: asset.name, description: asset.description, cost: finalCost }, guildId: market.guildId }]);
        }
    } else {
        addNotification({ type: 'error', message: 'You cannot afford this item.' });
    }
  }, [markets, gameAssets, deductRewards, addNotification, applyRewards, authDispatch]);

  const cancelPurchaseRequest = useCallback((purchaseId: string) => {
    const r = purchaseRequests.find(p => p.id === purchaseId);
    if (r && r.status === PurchaseRequestStatus.Pending) {
        applyRewards(r.userId, r.assetDetails.cost, r.guildId);
        addNotification({ type: 'info', message: 'Purchase cancelled. Funds returned.' });
    }
    setPurchaseRequests(prev => prev.map(p => p.id === purchaseId ? { ...p, status: PurchaseRequestStatus.Cancelled, actedAt: new Date().toISOString() } : p));
  }, [purchaseRequests, applyRewards, addNotification]);
  
  const approvePurchaseRequest = useCallback((purchaseId: string) => {
    const r = purchaseRequests.find(p => p.id === purchaseId);
    if (!r) return;
    const asset = gameAssets.find(a => a.id === r.assetId);
    if (!asset) return;
    
    authDispatch.updateUser(r.userId, updatedUser => {
        const userCopy = JSON.parse(JSON.stringify(updatedUser));
        if (asset.linkedThemeId && !userCopy.ownedThemes.includes(asset.linkedThemeId)) userCopy.ownedThemes.push(asset.linkedThemeId);
        if (!asset.payouts || asset.payouts.length === 0) userCopy.ownedAssetIds.push(r.assetId);
        return userCopy;
    });

    if (asset.payouts && asset.payouts.length > 0) {
      applyRewards(r.userId, asset.payouts, r.guildId);
    }

    setPurchaseRequests(p => p.map(pr => pr.id === purchaseId ? { ...pr, status: PurchaseRequestStatus.Completed, actedAt: new Date().toISOString() } : pr));
    addNotification({type: 'success', message: 'Purchase approved.'});
  }, [purchaseRequests, gameAssets, addNotification, applyRewards, authDispatch]);
  
  const rejectPurchaseRequest = useCallback((purchaseId: string) => {
    const r = purchaseRequests.find(p => p.id === purchaseId);
    if (r && r.status === PurchaseRequestStatus.Pending) {
        applyRewards(r.userId, r.assetDetails.cost, r.guildId);
        addNotification({ type: 'info', message: 'Purchase rejected. Funds returned.' });
    }
    setPurchaseRequests(prev => prev.map(p => p.id === purchaseId ? { ...p, status: PurchaseRequestStatus.Rejected, actedAt: new Date().toISOString() } : p));
  }, [purchaseRequests, applyRewards, addNotification]);
  
  const executeExchange = useCallback(async (userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => {
    const notifId = addNotification({ type: 'info', message: 'Processing exchange...', duration: 0 });
    try {
        await apiRequest('POST', '/api/actions/execute-exchange', { userId, payItem, receiveItem, guildId });
        addNotification({ type: 'success', message: `Exchange successful!` });
    } catch (error) {
        // Error is handled by apiRequest
    } finally {
        addNotification({ type: 'info', message: '', duration: 1 }); // self-closing
    }
  }, [apiRequest, addNotification]);
  
  // === DISPATCH FUNCTIONS ===

  const addRewardType = useCallback(async (rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => {
    await apiRequest('POST', '/api/reward-types', rewardType);
  }, [apiRequest]);

  const updateRewardType = useCallback(async (rewardType: RewardTypeDefinition) => {
    await apiRequest('PUT', `/api/reward-types/${rewardType.id}`, rewardType);
  }, [apiRequest]);

  const deleteRewardType = useCallback(async (rewardTypeId: string) => {
    await apiRequest('DELETE', `/api/reward-types`, { ids: [rewardTypeId] });
  }, [apiRequest]);

  const cloneRewardType = useCallback(async (rewardTypeId: string) => {
    await apiRequest('POST', `/api/reward-types/clone/${rewardTypeId}`);
  }, [apiRequest]);
  
  const addMarket = useCallback(async (market: Omit<Market, 'id'>) => {
    await apiRequest('POST', '/api/markets', market);
  }, [apiRequest]);

  const updateMarket = useCallback(async (market: Market) => {
    await apiRequest('PUT', `/api/markets/${market.id}`, market);
  }, [apiRequest]);

  const deleteMarket = useCallback(async (marketId: string) => {
    await apiRequest('DELETE', `/api/markets`, { ids: [marketId] });
  }, [apiRequest]);

  const cloneMarket = useCallback(async (marketId: string) => {
    await apiRequest('POST', `/api/markets/clone/${marketId}`);
  }, [apiRequest]);
  
  const deleteMarkets = useCallback(async (marketIds: string[]) => {
    await apiRequest('DELETE', `/api/markets`, { ids: marketIds });
  }, [apiRequest]);

  const updateMarketsStatus = useCallback(async (marketIds: string[], statusType: 'open' | 'closed') => {
    await apiRequest('PUT', '/api/markets/bulk-status', { ids: marketIds, statusType });
  }, [apiRequest]);

  const addGameAsset = useCallback(async (asset: Omit<GameAsset, 'id'|'creatorId'|'createdAt'|'purchaseCount'>) => {
    await apiRequest('POST', '/api/assets', asset);
  }, [apiRequest]);

  const updateGameAsset = useCallback(async (asset: GameAsset) => {
    await apiRequest('PUT', `/api/assets/${asset.id}`, asset);
  }, [apiRequest]);
  
  const cloneGameAsset = useCallback(async (assetId: string) => {
    await apiRequest('POST', `/api/assets/clone/${assetId}`);
  }, [apiRequest]);
  
  const deleteGameAssets = useCallback(async (assetIds: string[]) => {
    await apiRequest('DELETE', `/api/assets`, { ids: assetIds });
  }, [apiRequest]);
  
  const importAssetPack = useCallback(async (assetPack: AssetPack, resolutions: ImportResolution[], allData: IAppData): Promise<void> => {
      try {
          await apiRequest('POST', '/api/data/import-assets', { assetPack, resolutions });
          addNotification({type: 'success', message: `Imported from ${assetPack.manifest.name}!`});
          // The backend will broadcast a data update, which should trigger a full data reload via websocket.
      } catch(e) {
        // Error is handled and notified by apiRequest helper
      }
  }, [apiRequest, addNotification]);

  const deleteAllCustomContent = useCallback(() => {
    setMarkets([]); 
    setGameAssets([]); 
    setRewardTypes(p => p.filter(rt => rt.isCore)); 
  }, []);

  const deleteSelectedAssets = useCallback((selection: Partial<Record<ShareableAssetType, string[]>>) => {
    if (selection.markets) deleteMarkets(selection.markets);
    if (selection.rewardTypes) apiRequest('DELETE', '/api/reward-types', { ids: selection.rewardTypes });
    if (selection.gameAssets) deleteGameAssets(selection.gameAssets);
  }, [deleteMarkets, deleteGameAssets, apiRequest]);


  // === CONTEXT PROVIDER VALUE ===
  const state = {
    markets, rewardTypes, purchaseRequests, gameAssets,
  };

  const dispatch = {
    setMarkets, setRewardTypes, setPurchaseRequests, setGameAssets,
    addRewardType, updateRewardType, deleteRewardType, cloneRewardType,
    addMarket, updateMarket, deleteMarket, cloneMarket, deleteMarkets, updateMarketsStatus,
    addGameAsset, updateGameAsset, cloneGameAsset, deleteGameAssets,
    purchaseMarketItem, cancelPurchaseRequest, approvePurchaseRequest, rejectPurchaseRequest,
    applyRewards, deductRewards, executeExchange,
    importAssetPack, deleteAllCustomContent, deleteSelectedAssets,
  };

  return (
    <EconomyStateContext.Provider value={state}>
      <EconomyDispatchContext.Provider value={dispatch}>
        {children}
      </EconomyDispatchContext.Provider>
    </EconomyStateContext.Provider>
  );
};

export const useEconomyState = (): EconomyState => {
  const context = useContext(EconomyStateContext);
  if (context === undefined) throw new Error('useEconomyState must be used within an EconomyProvider');
  return context;
};

export const useEconomyDispatch = (): EconomyDispatch => {
  const context = useContext(EconomyDispatchContext);
  if (context === undefined) throw new Error('useEconomyDispatch must be used within an EconomyProvider');
  return context;
};
