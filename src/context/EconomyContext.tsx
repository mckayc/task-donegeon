
import React, { createContext, useContext, ReactNode, useReducer, useMemo, useCallback } from 'react';
import { Market, GameAsset, PurchaseRequest, RewardTypeDefinition, TradeOffer, Gift, RewardItem, User } from '../types';
import { useNotificationsDispatch } from './NotificationsContext';
import { useAuthDispatch, useAuthState } from './AuthContext';
import { 
    addMarketAPI, updateMarketAPI, cloneMarketAPI, updateMarketsStatusAPI, 
    addRewardTypeAPI, updateRewardTypeAPI, cloneRewardTypeAPI, 
    addGameAssetAPI, updateGameAssetAPI, cloneGameAssetAPI, 
    purchaseMarketItemAPI, approvePurchaseRequestAPI, rejectPurchaseRequestAPI, cancelPurchaseRequestAPI, 
    executeExchangeAPI, proposeTradeAPI, updateTradeOfferAPI, acceptTradeAPI, cancelOrRejectTradeAPI, 
    sendGiftAPI, useItemAPI, craftItemAPI, revertPurchaseAPI
} from '../api';
import { bugLogger } from '../utils/bugLogger';

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
  updateMarketsStatus: (marketIds: string[], statusType: 'open' | 'closed') => Promise<void>;
  cloneMarket: (marketId: string) => Promise<Market | null>;
  addRewardType: (rewardTypeData: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => Promise<RewardTypeDefinition | null>;
  updateRewardType: (rewardTypeData: RewardTypeDefinition) => Promise<RewardTypeDefinition | null>;
  cloneRewardType: (rewardTypeId: string) => Promise<RewardTypeDefinition | null>;
  addGameAsset: (assetData: Omit<GameAsset, 'id' | 'creatorId' | 'purchaseCount'>) => Promise<GameAsset | null>;
  updateGameAsset: (assetData: GameAsset) => Promise<GameAsset | null>;
  cloneGameAsset: (assetId: string) => Promise<GameAsset | null>;
  purchaseMarketItem: (assetId: string, marketId: string, user: User, costGroupIndex: number) => Promise<void>;
  approvePurchaseRequest: (requestId: string, approverId: string) => Promise<void>;
  rejectPurchaseRequest: (requestId: string, rejecterId: string) => Promise<void>;
  cancelPurchaseRequest: (requestId: string) => Promise<void>;
  revertPurchase: (purchaseId: string, adminId: string) => Promise<void>;
  // FIX: Updated payItem type to include pooledRewardTypeIds for exchange functionality.
  executeExchange: (userId: string, payItem: RewardItem & { pooledRewardTypeIds: string[] }, receiveItem: RewardItem, guildId?: string) => Promise<void>;
  proposeTrade: (recipientId: string, guildId: string) => Promise<TradeOffer | null>;
  updateTradeOffer: (tradeId: string, updates: Partial<TradeOffer>) => Promise<void>;
  acceptTrade: (tradeId: string) => Promise<void>;
  cancelOrRejectTrade: (tradeId: string, action: 'cancelled' | 'rejected') => Promise<void>;
  sendGift: (recipientId: string, assetId: string, guildId: string) => Promise<void>;
  useItem: (assetId: string) => Promise<void>;
  craftItem: (assetId: string) => Promise<void>;
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
            return { ...initialState, ...action.payload };
        case 'UPDATE_ECONOMY_DATA': {
            const updatedState = { ...state };
            for (const key in action.payload) {
                const typedKey = key as keyof EconomyState;
                if (Array.isArray(updatedState[typedKey]) && Array.isArray(action.payload[typedKey])) {
                    const existingItemsMap = new Map((updatedState[typedKey] as any[]).map(item => [item.id, item]));
                    (action.payload[typedKey] as any[]).forEach(item => {
                        existingItemsMap.set(item.id, item);
                    });
                    (updatedState as any)[typedKey] = Array.from(existingItemsMap.values());
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

        purchaseMarketItem: async (assetId, marketId, user, costGroupIndex) => {
            const result = await apiAction(() => purchaseMarketItemAPI(assetId, marketId, user, costGroupIndex));
            if (result) {
                const { updatedUser, newPurchaseRequest } = result as any;
                updateUser(updatedUser.id, updatedUser);
                dispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { purchaseRequests: [newPurchaseRequest] } });
            }
        },
        approvePurchaseRequest: async (requestId, approverId) => {
            bugLogger.add({ type: 'ACTION', message: `[EconomyContext] Approving purchase request ID: ${requestId}` });
            await apiAction(() => approvePurchaseRequestAPI(requestId, approverId), 'Purchase approved!');
        },
        rejectPurchaseRequest: async (requestId, rejecterId) => {
            bugLogger.add({ type: 'ACTION', message: `[EconomyContext] Rejecting purchase request ID: ${requestId}` });
            await apiAction(() => rejectPurchaseRequestAPI(requestId, rejecterId), 'Purchase rejected.');
        },
        cancelPurchaseRequest: async (requestId) => {
            bugLogger.add({ type: 'ACTION', message: `[EconomyContext] Cancelling purchase request ID: ${requestId}` });
            await apiAction(() => cancelPurchaseRequestAPI(requestId), 'Purchase cancelled.');
        },
        revertPurchase: async (purchaseId, adminId) => {
            bugLogger.add({ type: 'ACTION', message: `[EconomyContext] Reverting purchase ID: ${purchaseId}` });
            await apiAction(() => revertPurchaseAPI(purchaseId, adminId), 'Purchase reverted.');
        },
        executeExchange: async (userId, payItem, receiveItem, guildId) => {
            const result = await apiAction(() => executeExchangeAPI(userId, payItem, receiveItem, guildId), 'Exchange successful!');
            if (result) {
                const { updatedUser } = result as any;
                updateUser(updatedUser.id, updatedUser);
            }
        },
        proposeTrade: (recipientId, guildId) => {
            if (!currentUser) return Promise.resolve(null);
            return apiAction(() => proposeTradeAPI(recipientId, guildId, currentUser.id), 'Trade offer sent!');
        },
        updateTradeOffer: (id, updates) => apiAction(() => updateTradeOfferAPI(id, updates)),
        acceptTrade: (id) => apiAction(() => acceptTradeAPI(id), 'Trade accepted!'),
        cancelOrRejectTrade: (id, action) => apiAction(() => cancelOrRejectTradeAPI(id, action)),
        sendGift: (recipientId, assetId, guildId) => {
            if (!currentUser) return Promise.resolve();
            return apiAction(() => sendGiftAPI(recipientId, assetId, guildId, currentUser.id), 'Gift sent!');
        },
        useItem: async (id) => {
            if (!currentUser) return;
            const result = await apiAction(() => useItemAPI(id, currentUser.id), 'Item used!');
            if (result) {
                const { updatedUser, updatedAsset } = result as any;
                updateUser(updatedUser.id, updatedUser);
                dispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { gameAssets: [updatedAsset] } });
            }
        },
        craftItem: async (id) => {
            if (!currentUser) return;
            const result = await apiAction(() => craftItemAPI(id, currentUser.id), 'Item crafted!');
            if (result) {
                const { updatedUser } = result as any;
                updateUser(updatedUser.id, updatedUser);
            }
        },
    }), [addNotification, apiAction, currentUser, updateUser]);

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

export const useEconomyReducerDispatch = (): React.Dispatch<EconomyAction> => {
    const context = useContext(EconomyDispatchContext);
    if (context === undefined) {
        throw new Error('useEconomyReducerDispatch must be used within a EconomyProvider');
    }
    return context.dispatch;
};
