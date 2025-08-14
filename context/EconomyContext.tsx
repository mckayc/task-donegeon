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
  addRewardType: (rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => void;
  updateRewardType: (rewardType: RewardTypeDefinition) => void;
  deleteRewardType: (rewardTypeId: string) => void;
  cloneRewardType: (rewardTypeId: string) => void;

  // Markets
  addMarket: (market: Omit<Market, 'id'>) => void;
  updateMarket: (market: Market) => void;
  deleteMarket: (marketId: string) => void;
  cloneMarket: (marketId: string) => void;
  deleteMarkets: (marketIds: string[]) => void;
  updateMarketsStatus: (marketIds: string[], statusType: 'open' | 'closed') => void;

  // Game Assets
  addGameAsset: (asset: Omit<GameAsset, 'id' | 'creatorId' | 'createdAt' | 'purchaseCount'>) => void;
  updateGameAsset: (asset: GameAsset) => void;
  deleteGameAsset: (assetId: string) => void;
  cloneGameAsset: (assetId: string) => void;
  deleteGameAssets: (assetIds: string[]) => void;

  // Purchases
  purchaseMarketItem: (assetId: string, marketId: string, user: User, costGroupIndex: number, scheduledEvents: ScheduledEvent[]) => void;
  cancelPurchaseRequest: (purchaseId: string) => void;
  approvePurchaseRequest: (purchaseId: string) => void;
  rejectPurchaseRequest: (purchaseId: string) => void;

  // Core Economy Actions
  applyRewards: (userId: string, rewardsToApply: RewardItem[], guildId?: string) => void;
  deductRewards: (userId: string, cost: RewardItem[], guildId?: string) => Promise<boolean>;
  executeExchange: (userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => void;
  
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
    authDispatch.updateUser(userId, userToUpdate => {
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
        return newUser;
    });
  }, [rewardTypes, authDispatch]);

  const deductRewards = useCallback(async (userId: string, cost: RewardItem[], guildId?: string): Promise<boolean> => {
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
  
  const purchaseMarketItem = useCallback(async (assetId: string, marketId: string, user: User, costGroupIndex: number, scheduledEvents: ScheduledEvent[]) => {
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
    
    const canAfford = await deductRewards(user.id, finalCost, market.guildId);

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
  
  const executeExchange = useCallback((userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => {
      deductRewards(userId, [payItem], guildId).then(canAfford => {
        if (canAfford) {
            applyRewards(userId, [receiveItem], guildId);
        } else {
            addNotification({ type: 'error', message: 'Exchange failed due to insufficient funds.' });
        }
      });
  }, [deductRewards, applyRewards, addNotification]);
  
  // === DISPATCH FUNCTIONS ===

  const addRewardType = useCallback((rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => setRewardTypes(prev => [...prev, { ...rewardType, id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, isCore: false }]), []);
  const updateRewardType = useCallback((rewardType: RewardTypeDefinition) => setRewardTypes(prev => prev.map(rt => rt.id === rewardType.id ? rewardType : rt)), []);
  const deleteRewardType = useCallback((rewardTypeId: string) => setRewardTypes(prev => prev.filter(rt => rt.id !== rewardTypeId)), []);
  const cloneRewardType = useCallback((rewardTypeId: string) => {
    const rewardToClone = rewardTypes.find(rt => rt.id === rewardTypeId);
    if (!rewardToClone || rewardToClone.isCore) {
        addNotification({ type: 'error', message: 'Core rewards cannot be cloned.' });
        return;
    }
    const newReward: RewardTypeDefinition = {
        ...JSON.parse(JSON.stringify(rewardToClone)),
        id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: `${rewardToClone.name} (Copy)`,
        isCore: false,
    };
    setRewardTypes(prev => [...prev, newReward]);
    addNotification({ type: 'success', message: `Cloned reward: ${newReward.name}` });
  }, [rewardTypes, addNotification]);
  const addMarket = useCallback((market: Omit<Market, 'id'>) => setMarkets(prev => [...prev, { ...market, id: `market-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` }]), []);
  const updateMarket = useCallback((market: Market) => setMarkets(prev => prev.map(m => m.id === market.id ? market : m)), []);
  const deleteMarket = useCallback((marketId: string) => setMarkets(prev => prev.filter(m => m.id !== marketId)), []);
  const cloneMarket = useCallback((marketId: string) => {
    if (marketId === 'market-bank') {
        addNotification({ type: 'error', message: 'The Exchange Post cannot be cloned.' });
        return;
    }
    const marketToClone = markets.find(m => m.id === marketId);
    if (!marketToClone) return;
    const newMarket: Market = {
        ...JSON.parse(JSON.stringify(marketToClone)),
        id: `market-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: `${marketToClone.title} (Copy)`,
    };
    setMarkets(prev => [...prev, newMarket]);
    addNotification({ type: 'success', message: `Cloned market: ${newMarket.title}` });
  }, [markets, addNotification]);
  const deleteMarkets = useCallback((marketIds: string[]) => {
      const idsToDelete = new Set(marketIds.filter(id => id !== 'market-bank'));
      if (marketIds.includes('market-bank')) {
          addNotification({ type: 'error', message: 'The Exchange Post cannot be deleted.' });
      }
      setMarkets(prev => prev.filter(m => !idsToDelete.has(m.id)));
      if (idsToDelete.size > 0) {
        addNotification({ type: 'info', message: `${idsToDelete.size} market(s) deleted.` });
      }
  }, [addNotification]);
  const updateMarketsStatus = useCallback((marketIds: string[], statusType: 'open' | 'closed') => {
      const idsToUpdate = new Set(marketIds);
      const newStatus: MarketStatus = { type: statusType };
      setMarkets(prev => prev.map(m => {
          if (idsToUpdate.has(m.id) && m.status.type !== 'conditional') {
              return { ...m, status: newStatus };
          }
          return m;
      }));
      addNotification({ type: 'success', message: `${marketIds.length} market(s) updated.` });
  }, [addNotification]);
  const addGameAsset = useCallback(async (asset: Omit<GameAsset, 'id'|'creatorId'|'createdAt'|'purchaseCount'>) => {
    try {
        await apiRequest('POST', '/api/assets', asset);
        addNotification({ type: 'success', message: `Asset "${asset.name}" created.` });
    } catch(e){}
  }, [apiRequest, addNotification]);
  const updateGameAsset = useCallback(async (asset: GameAsset) => {
    try {
        await apiRequest('PUT', `/api/assets/${asset.id}`, asset);
    } catch (e) {}
  }, [apiRequest]);
  const deleteGameAsset = useCallback((assetId: string) => { setGameAssets(prev => prev.filter(ga => ga.id !== assetId)); addNotification({ type: 'info', message: 'Asset deleted.' }); }, [addNotification]);
  const cloneGameAsset = useCallback(async (assetId: string) => {
    try {
        await apiRequest('POST', `/api/assets/clone/${assetId}`);
        addNotification({ type: 'success', message: 'Asset cloned successfully!' });
    } catch (e) {}
  }, [apiRequest, addNotification]);
  const deleteGameAssets = useCallback(async (assetIds: string[]) => {
    try {
        await apiRequest('DELETE', '/api/assets', { ids: assetIds });
        addNotification({ type: 'info', message: `${assetIds.length} asset(s) deleted.` });
    } catch (e) {}
  }, [apiRequest, addNotification]);
  
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
    if (selection.markets) setMarkets(p => p.filter(i => !selection.markets!.includes(i.id)));
    if (selection.rewardTypes) setRewardTypes(p => p.filter(i => !selection.rewardTypes!.includes(i.id)));
    if (selection.gameAssets) setGameAssets(p => p.filter(i => !selection.gameAssets!.includes(i.id)));
    addNotification({ type: 'success', message: 'Selected assets have been deleted.' });
  }, [addNotification]);


  // === CONTEXT PROVIDER VALUE ===
  const state = {
    markets, rewardTypes, purchaseRequests, gameAssets,
  };

  const dispatch = {
    setMarkets, setRewardTypes, setPurchaseRequests, setGameAssets,
    addRewardType, updateRewardType, deleteRewardType, cloneRewardType,
    addMarket, updateMarket, deleteMarket, cloneMarket, deleteMarkets, updateMarketsStatus,
    addGameAsset, updateGameAsset, deleteGameAsset, cloneGameAsset, deleteGameAssets,
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