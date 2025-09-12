
import React, { createContext, useContext, ReactNode, useReducer, useMemo, useCallback } from 'react';
import { Market, GameAsset, PurchaseRequest, RewardTypeDefinition, TradeOffer, Gift, ShareableAssetType, RewardItem, User, Trophy } from '../types';
import { useNotificationsDispatch } from './NotificationsContext';
import { useAuthDispatch, useAuthState } from './AuthContext';
import { bugLogger } from '../utils/bugLogger';
import { SystemAction, useSystemReducerDispatch } from './SystemContext';
import { 
    addMarketAPI, updateMarketAPI, cloneMarketAPI, updateMarketsStatusAPI, 
    addRewardTypeAPI, updateRewardTypeAPI, cloneRewardTypeAPI, 
    addGameAssetAPI, updateGameAssetAPI, cloneGameAssetAPI, 
    purchaseMarketItemAPI, approvePurchaseRequestAPI, rejectPurchaseRequestAPI, cancelPurchaseRequestAPI, 
    executeExchangeAPI, proposeTradeAPI, updateTradeOfferAPI, acceptTradeAPI, cancelOrRejectTradeAPI, 
    sendGiftAPI, useItemAPI, craftItemAPI 
} from '../api';

// --- STATE & CONTEXT DEFINITIONS ---

export interface EconomyState {
    markets: Market[];
    gameAssets: GameAsset[];
    purchaseRequests: PurchaseRequest[];
    rewardTypes: RewardTypeDefinition[];
    tradeOffers: TradeOffer[];
    gifts: Gift[];
}

export type EconomyAction = 
  | { type: 'SET_ECONOMY_DATA', payload: Partial<EconomyState> }
  | { type: 'UPDATE_ECONOMY_DATA', payload: Partial<EconomyState> }
  | { type: 'REMOVE_ECONOMY_DATA', payload: { [key in keyof EconomyState]?: string[] } };

export interface EconomyDispatch {
  addMarket: (marketData: Omit<Market, 'id'>) => Promise<Market | null>;
  updateMarket: (marketData: Market) => Promise<Market | null>;
  updateMarketsStatus: (marketIds: string[], statusType: 'open' | 'closed') => Promise<void | null>;
  cloneMarket: (marketId: string) => Promise<Market | null>;
  addRewardType: (rewardTypeData: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => Promise<RewardTypeDefinition | null>;
  updateRewardType: (rewardTypeData: RewardTypeDefinition) => Promise<RewardTypeDefinition | null>;
  cloneRewardType: (rewardTypeId: string) => Promise<RewardTypeDefinition | null>;
  addGameAsset: (assetData: Omit<GameAsset, 'id' | 'creatorId' | 'purchaseCount'>) => Promise<GameAsset | null>;
  updateGameAsset: (assetData: GameAsset) => Promise<GameAsset | null>;
  cloneGameAsset: (assetId: string) => Promise<GameAsset | null>;
  purchaseMarketItem: (assetId: string, marketId: string, user: User, costGroupIndex: number) => Promise<void | null>;
  approvePurchaseRequest: (requestId: string, approverId: string) => Promise<void | null>;
  rejectPurchaseRequest: (requestId: string, rejecterId: string) => Promise<void | null>;
  cancelPurchaseRequest: (requestId: string) => Promise<void | null>;
  executeExchange: (userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => Promise<void | null>;
  proposeTrade: (recipientId: string, guildId: string) => Promise<TradeOffer | null>;
  updateTradeOffer: (tradeId: string, updates: Partial<TradeOffer>) => Promise<TradeOffer | null>;
  acceptTrade: (tradeId: string) => Promise<void | null>;
  cancelOrRejectTrade: (tradeId: string, action: 'cancelled' | 'rejected') => Promise<TradeOffer | null>;
  sendGift: (recipientId: string, assetId: string, guildId: string) => Promise<void | null>;
  useItem: (assetId: string) => Promise<void | null>;
  craftItem: (assetId: string) => Promise<void | null>;
}

const EconomyStateContext = createContext<EconomyState | undefined>(undefined);
export const EconomyDispatchContext = createContext<{ dispatch: React.Dispatch<EconomyAction>, actions: EconomyDispatch } | undefined>(undefined);

const initialState: EconomyState = {
    markets: [],
    gameAssets: [],
    purchaseRequests: [],
    rewardTypes: [],
    tradeOffers: [],
    gifts: [],
};

const economyReducer = (state: EconomyState, action: EconomyAction): EconomyState => {
    switch (action.type) {
        case 'SET_ECONOMY_DATA':
            return { ...state, ...action.payload };
        case 'UPDATE_ECONOMY_DATA': {
            const updatedState = { ...state };
            for (const key in action.payload) {
                const typedKey = key as keyof EconomyState;
                if (Array.isArray(updatedState[typedKey])) {
                    const existingItems = new Map((updatedState[typedKey] as any[]).map(item => [item.id, item]));
                    const itemsToUpdate = action.payload[typedKey];
                    if (Array.isArray(itemsToUpdate)) {
                        itemsToUpdate.forEach(newItem => existingItems.set(newItem.id, newItem));
                    }
                    (updatedState as any)[typedKey] = Array.from(existingItems.values());
                }
            }
            return updatedState;
        }
        case 'REMOVE_ECONOMY_DATA': {
            const stateWithRemoved = { ...state };
            for (const key in action.payload) {
                const typedKey = key as keyof EconomyState;
                if (Array.isArray(stateWithRemoved[typedKey])) {
                    const idsToRemove = new Set(action.payload[typedKey] as string[]);
                    (stateWithRemoved as any)[typedKey] = ((stateWithRemoved as any)[typedKey] as any[]).filter(item => !idsToRemove.has(item.id));
                }
            }
            return stateWithRemoved;
        }
        default:
            return state;
    }
};

export const EconomyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(economyReducer, initialState);
    const { addNotification } = useNotificationsDispatch();
    const systemDispatch = useSystemReducerDispatch();
    const { updateUser } = useAuthDispatch();
    const { currentUser } = useAuthState();

    const apiAction = useCallback(async <T,>(apiFn: () => Promise<T | null>, successMessage?: string): Promise<T | null> => {
        try {
            const result = await apiFn();
            if (successMessage) addNotification({ type: 'success', message: successMessage });
            return result;
        } catch (error) {
            addNotification({ type: 'error', message: error instanceof Error ? error.message : String(error) });
            return null;
        }
    }, [addNotification]);
    
    const actions = useMemo<EconomyDispatch>(() => ({
        addMarket: async (data) => {
            const result = await apiAction(() => addMarketAPI(data), 'Market created!');
            if (result) dispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { markets: [result] } });
            return result;
        },
        updateMarket: async (data) => {
            const result = await apiAction(() => updateMarketAPI(data), 'Market updated!');
            if (result) dispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { markets: [result] } });
            return result;
        },
        cloneMarket: async (id) => {
            const result = await apiAction(() => cloneMarketAPI(id), 'Market cloned!');
            if (result) dispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { markets: [result] } });
            return result;
        },
        updateMarketsStatus: (ids, statusType) => apiAction(() => updateMarketsStatusAPI(ids, statusType)),
        
        addRewardType: async (data) => {
            const result = await apiAction(() => addRewardTypeAPI(data), 'Reward type created!');
            if (result) dispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { rewardTypes: [result] } });
            return result;
        },
        updateRewardType: async (data) => {
            const result = await apiAction(() => updateRewardTypeAPI(data), 'Reward type updated!');
            if (result) dispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { rewardTypes: [result] } });
            return result;
        },
        cloneRewardType: async (id) => {
            const result = await apiAction(() => cloneRewardTypeAPI(id), 'Reward type cloned!');
            if (result) dispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { rewardTypes: [result] } });
            return result;
        },
        
        addGameAsset: async (data) => {
            const result = await apiAction(() => addGameAssetAPI(data), 'Asset created!');
            if (result) dispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { gameAssets: [result] } });
            return result;
        },
        updateGameAsset: async (data) => {
            const result = await apiAction(() => updateGameAssetAPI(data), 'Asset updated!');
            if (result) dispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { gameAssets: [result] } });
            return result;
        },
        cloneGameAsset: async (id) => {
            const result = await apiAction(() => cloneGameAssetAPI(id), 'Asset cloned!');
            if (result) dispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { gameAssets: [result] } });
            return result;
        },

        purchaseMarketItem: (assetId, marketId, user, costGroupIndex) => apiAction(() => purchaseMarketItemAPI(assetId, marketId, user, costGroupIndex)),
        approvePurchaseRequest: (requestId, approverId) => apiAction(() => approvePurchaseRequestAPI(requestId, approverId)),
        rejectPurchaseRequest: (requestId, rejecterId) => apiAction(() => rejectPurchaseRequestAPI(requestId, rejecterId)),
        cancelPurchaseRequest: (requestId) => apiAction(() => cancelPurchaseRequestAPI(requestId)),
        executeExchange: async (userId, payItem, receiveItem, guildId) => {
            const result = await apiAction(() => executeExchangeAPI(userId, payItem, receiveItem, guildId));
            if (result && systemDispatch) {
                 if ((result as any).updatedUser) updateUser((result as any).updatedUser.id, (result as any).updatedUser);
                 if ((result as any).newAdjustment) {
                    systemDispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { adminAdjustments: [(result as any).newAdjustment] } });
                 }
                addNotification({ type: 'success', message: 'Exchange successful!' });
            }
        },
        proposeTrade: (recipientId, guildId) => {
            if (!currentUser) return Promise.resolve(null);
            return apiAction(() => proposeTradeAPI(recipientId, guildId, currentUser.id), 'Trade proposed!');
        },
        updateTradeOffer: async (id, updates) => {
            const updatedTrade = await apiAction(() => updateTradeOfferAPI(id, updates));
            if (updatedTrade) {
                dispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { tradeOffers: [updatedTrade] } });
            }
            return updatedTrade;
        },
        acceptTrade: async (id) => {
            const result = await apiAction(() => acceptTradeAPI(id));
            if (result) {
                if ((result as any).updatedUser) updateUser((result as any).updatedUser.id, (result as any).updatedUser);
                if ((result as any).otherUser) updateUser((result as any).otherUser.id, (result as any).otherUser);
                if ((result as any).updatedTradeOffer) dispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { tradeOffers: [(result as any).updatedTradeOffer] } });
            }
        },
        cancelOrRejectTrade: async (id, action) => {
            const updatedTrade = await apiAction(() => cancelOrRejectTradeAPI(id, action));
            if (updatedTrade) {
                dispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { tradeOffers: [updatedTrade] } });
            }
            return updatedTrade;
        },
        sendGift: (recipientId, assetId, guildId) => {
            if (!currentUser) return Promise.resolve(null);
            return apiAction(() => sendGiftAPI(recipientId, assetId, guildId, currentUser.id), 'Gift sent!');
        },
        useItem: async (assetId) => {
            if (!currentUser) return;
            const result = await apiAction(() => useItemAPI(assetId, currentUser.id));
            if (result) {
                 if ((result as any).updatedUser) updateUser((result as any).updatedUser.id, (result as any).updatedUser);
                 addNotification({ type: 'success', message: 'Item used!' });
            }
        },
        craftItem: async (assetId) => {
            if (!currentUser) return;
            const result = await apiAction(() => craftItemAPI(assetId, currentUser.id));
            if (result) {
                if ((result as any).updatedUser) updateUser((result as any).updatedUser.id, (result as any).updatedUser);
                addNotification({ type: 'success', message: 'Item crafted!' });
            }
        },

    }), [apiAction, currentUser, systemDispatch, updateUser, addNotification]);
    
    const contextValue = useMemo(() => ({ dispatch, actions }), [dispatch, actions]);

    return (
        <EconomyStateContext.Provider value={state}>
            <EconomyDispatchContext.Provider value={contextValue}>
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
    return context.actions;
};

// Hook to get the dispatch for the economy reducer directly
export const useEconomyReducerDispatch = (): React.Dispatch<EconomyAction> => {
  const context = useContext(EconomyDispatchContext);
  if (!context) {
    throw new Error('useEconomyReducerDispatch must be used within an EconomyProvider');
  }
  return context.dispatch;
};
