import React, { createContext, useContext, ReactNode, useReducer, useMemo, useCallback } from 'react';
import { Market, GameAsset, PurchaseRequest, RewardTypeDefinition, TradeOffer, Gift, ShareableAssetType, RewardItem, User, Trophy } from '../types';
import { useNotificationsDispatch } from './NotificationsContext';
import { useAuthDispatch, useAuthState } from './AuthContext';
import { bugLogger } from '../utils/bugLogger';
import { SystemAction, SystemDispatchContext } from './SystemContext';
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
  executeExchange: (userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => Promise<void>;
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
            return { ...state, ...action.payload };
        case 'UPDATE_ECONOMY_DATA': {
            const updatedState = { ...state };
            for (const key in action.payload) {
                const typedKey = key as keyof EconomyState;
                if (Array.isArray(updatedState[typedKey])) {
                    const existingItems = new Map((updatedState[typedKey] as any[]).map(item => [item.id, item]));
                    (action.payload[typedKey] as any[]).forEach(newItem => existingItems.set(newItem.id, newItem));
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
    const systemDispatch = useContext(SystemDispatchContext);
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
        addMarket: (data) => apiAction(() => addMarketAPI(data), 'Market created!'),
        updateMarket: (data) => apiAction(() => updateMarketAPI(data), 'Market updated!'),
        cloneMarket: (id) => apiAction(() => cloneMarketAPI(id), 'Market cloned!'),
        updateMarketsStatus: (ids, statusType) => apiAction(() => updateMarketsStatusAPI(ids, statusType)),
        
        addRewardType: (data) => apiAction(() => addRewardTypeAPI(data), 'Reward type created!'),
        updateRewardType: (data) => apiAction(() => updateRewardTypeAPI(data), 'Reward type updated!'),
        cloneRewardType: (id) => apiAction(() => cloneRewardTypeAPI(id), 'Reward type cloned!'),
        
        addGameAsset: (data) => apiAction(() => addGameAssetAPI(data), 'Asset created!'),
        updateGameAsset: (data) => apiAction(() => updateGameAssetAPI(data), 'Asset updated!'),
        cloneGameAsset: (id) => apiAction(() => cloneGameAssetAPI(id), 'Asset cloned!'),

        purchaseMarketItem: async (assetId, marketId, user, costGroupIndex) => {
            const result = await apiAction(() => purchaseMarketItemAPI(assetId, marketId, user, costGroupIndex));
            if (result) {
                if ((result as any).updatedUser) updateUser((result as any).updatedUser.id, (result as any).updatedUser);
                addNotification({ type: 'success', message: `Purchase successful!` });
            }
        },
        approvePurchaseRequest: async (requestId, approverId) => {
            await apiAction(() => approvePurchaseRequestAPI(requestId, approverId));
        },
        rejectPurchaseRequest: async (requestId, rejecterId) => {
            await apiAction(() => rejectPurchaseRequestAPI(requestId, rejecterId));
        },
        cancelPurchaseRequest: async (requestId) => {
             await apiAction(() => cancelPurchaseRequestAPI(requestId));
        },
        executeExchange: async (userId, payItem, receiveItem, guildId) => {
            const result = await apiAction(() => executeExchangeAPI(userId, payItem, receiveItem, guildId));
            if (result && systemDispatch) {
                 if ((result as any).updatedUser) updateUser((result as any).updatedUser.id, (result as any).updatedUser);
                 if ((result as any).newAdjustment) {
                    systemDispatch.dispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { adminAdjustments: [(result as any).newAdjustment] } });
                 }
                addNotification({ type: 'success', message: 'Exchange successful!' });
            }
        },
        proposeTrade: (recipientId, guildId) => {
            if (!currentUser) return Promise.resolve(null);
            return apiAction(() => proposeTradeAPI(recipientId, guildId, currentUser.id), 'Trade proposed!');
        },
        updateTradeOffer: (id, updates) => apiAction(() => updateTradeOfferAPI(id, updates)),
        acceptTrade: (id) => apiAction(() => acceptTradeAPI(id)),
        cancelOrRejectTrade: (id, action) => apiAction(() => cancelOrRejectTradeAPI(id, action)),
        sendGift: (recipientId, assetId, guildId) => {
            if (!currentUser) return Promise.resolve();
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
