import React, { createContext, useContext, ReactNode, useReducer, useMemo, useCallback } from 'react';
import { Market, GameAsset, PurchaseRequest, RewardTypeDefinition, TradeOffer, Gift, ShareableAssetType, RewardItem, User, Trophy } from '../types';
import { useNotificationsDispatch } from './NotificationsContext';
import { useAuthDispatch, useAuthState } from './AuthContext';
import { bugLogger } from '../utils/bugLogger';
import { SystemAction, SystemDispatchContext } from './SystemContext';

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
    const systemDispatchContext = useContext(SystemDispatchContext);
    const { updateUser } = useAuthDispatch();
    const { currentUser } = useAuthState();

    const apiRequest = useCallback(async (method: string, path: string, body?: any) => {
        try {
            const options: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
            if (body) options.body = JSON.stringify(body);
            const response = await window.fetch(path, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Server error' }));
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }
            return response.status === 204 ? null : await response.json();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown network error occurred.';
            addNotification({ type: 'error', message });
            bugLogger.add({ type: 'STATE_CHANGE', message: `API Error: ${method} ${path} - ${message}` });
            return null;
        }
    }, [addNotification]);
    
    const createAddAction = <T_ADD, T_RETURN extends { id: any }, D extends keyof EconomyState>(path: string, dataType: D) => 
        async (data: T_ADD): Promise<T_RETURN | null> => {
            const result = await apiRequest('POST', path, data);
            if (result) dispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { [dataType]: [result] } as any });
            return result;
        };

    const createUpdateAction = <T extends { id: any }, D extends keyof EconomyState>(pathTemplate: (id: any) => string, dataType: D) => 
        async (data: T): Promise<T | null> => {
            const result = await apiRequest('PUT', pathTemplate(data.id), data);
            if (result) dispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { [dataType]: [result] } as any });
            return result;
        };

    const createCloneAction = <T_RETURN extends { id: any }, D extends keyof EconomyState>(pathTemplate: (id: string) => string, dataType: D) => 
        async (id: string): Promise<T_RETURN | null> => {
            const result = await apiRequest('POST', pathTemplate(id));
            if (result) dispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { [dataType]: [result] } as any });
            return result;
        };

    const actions = useMemo<EconomyDispatch>(() => ({
        addMarket: createAddAction('/api/markets', 'markets'),
        updateMarket: createUpdateAction(id => `/api/markets/${id}`, 'markets'),
        cloneMarket: createCloneAction(id => `/api/markets/clone/${id}`, 'markets'),
        updateMarketsStatus: (ids, statusType) => apiRequest('PUT', '/api/markets/bulk-status', { ids, statusType }),
        
        addRewardType: createAddAction('/api/reward-types', 'rewardTypes'),
        updateRewardType: createUpdateAction(id => `/api/reward-types/${id}`, 'rewardTypes'),
        cloneRewardType: createCloneAction(id => `/api/reward-types/clone/${id}`, 'rewardTypes'),
        
        addGameAsset: createAddAction('/api/assets', 'gameAssets'),
        updateGameAsset: createUpdateAction(id => `/api/assets/${id}`, 'gameAssets'),
        cloneGameAsset: createCloneAction(id => `/api/assets/clone/${id}`, 'gameAssets'),

        purchaseMarketItem: async (assetId, marketId, user, costGroupIndex) => {
            const market = state.markets.find(m => m.id === marketId);
            const guildId = market?.guildId;
            const result = await apiRequest('POST', '/api/markets/purchase', { assetId, userId: user.id, costGroupIndex, guildId });
            if (result) {
                if (result.updatedUser) updateUser(result.updatedUser.id, result.updatedUser);
                if (result.newPurchaseRequest) dispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { purchaseRequests: [result.newPurchaseRequest] } });
                addNotification({ type: 'success', message: `Purchase successful!` });
            }
        },
        approvePurchaseRequest: async (requestId, approverId) => {
            const result = await apiRequest('POST', `/api/markets/approve-purchase/${requestId}`, { approverId });
            if (result) {
                if (result.updatedUser) updateUser(result.updatedUser.id, result.updatedUser);
                if (result.updatedPurchaseRequest) dispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { purchaseRequests: [result.updatedPurchaseRequest] } });
            }
        },
        rejectPurchaseRequest: async (requestId, rejecterId) => {
            const result = await apiRequest('POST', `/api/markets/reject-purchase/${requestId}`, { rejecterId });
            if (result) {
                if (result.updatedUser) updateUser(result.updatedUser.id, result.updatedUser);
                if (result.updatedPurchaseRequest) dispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { purchaseRequests: [result.updatedPurchaseRequest] } });
            }
        },
        cancelPurchaseRequest: async (requestId) => {
             const result = await apiRequest('POST', `/api/markets/cancel-purchase/${requestId}`);
             if (result) {
                if (result.updatedUser) updateUser(result.updatedUser.id, result.updatedUser);
                if (result.updatedPurchaseRequest) dispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { purchaseRequests: [result.updatedPurchaseRequest] } });
             }
        },
        executeExchange: async (userId, payItem, receiveItem, guildId) => {
            const result = await apiRequest('POST', '/api/markets/exchange', { userId, payItem, receiveItem, guildId });
            if (result) {
                if (result.updatedUser) updateUser(result.updatedUser.id, result.updatedUser);
                if (result.newAdjustment && systemDispatchContext) {
                    systemDispatchContext.dispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { adminAdjustments: [result.newAdjustment] } });
                }
                addNotification({ type: 'success', message: 'Exchange successful!' });
            }
        },
        proposeTrade: (recipientId, guildId) => apiRequest('POST', '/api/trades/propose', { recipientId, guildId, initiatorId: currentUser?.id }),
        updateTradeOffer: (id, updates) => apiRequest('PUT', `/api/trades/${id}`, updates),
        acceptTrade: (id) => apiRequest('POST', `/api/trades/accept/${id}`),
        cancelOrRejectTrade: (id, action) => apiRequest('POST', `/api/trades/resolve/${id}`, { action }),
        sendGift: (recipientId, assetId, guildId) => apiRequest('POST', '/api/gifts/send', { recipientId, assetId, guildId, senderId: currentUser?.id }),
        useItem: (id) => apiRequest('POST', `/api/assets/use/${id}`, { userId: currentUser?.id }),
        craftItem: (id) => apiRequest('POST', `/api/assets/craft/${id}`, { userId: currentUser?.id }),

    }), [apiRequest, createAddAction, createUpdateAction, createCloneAction, currentUser, systemDispatchContext, state.markets, updateUser, addNotification]);
    
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