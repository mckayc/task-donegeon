import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { IAppData, Quest, User, QuestCompletion, AdminAdjustment, PurchaseRequest, Market, Guild, Rank, Trophy, RewardTypeDefinition, ThemeDefinition, ShareableAssetType, BulkQuestUpdates, ChatMessage, SystemNotification, ScheduledEvent, BugReport, Rotation, SetbackDefinition, AppliedSetback, TradeOffer, Gift, QuestGroup, GameAsset, RewardItem } from '../types';
import { useNotificationsDispatch } from './NotificationsContext';
import { bugLogger } from '../utils/bugLogger';
import { useDataDispatch, useData } from './DataProvider';
import { useAuthDispatch, useAuthState } from './AuthContext';

// This interface defines all the functions our application can dispatch.
// Components will use this to trigger state changes.
export interface ActionsDispatch {
  addQuest: (questData: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals' | 'todoUserIds'>) => Promise<Quest | null>;
  updateQuest: (questData: Quest) => Promise<Quest | null>;
  cloneQuest: (questId: string) => Promise<Quest | null>;
  updateQuestsStatus: (questIds: string[], isActive: boolean) => Promise<void>;
  bulkUpdateQuests: (questIds: string[], updates: BulkQuestUpdates) => Promise<void>;
  
  addQuestGroup: (groupData: Omit<QuestGroup, 'id'>) => Promise<QuestGroup | null>;
  updateQuestGroup: (groupData: QuestGroup) => Promise<QuestGroup | null>;
  assignQuestGroupToUsers: (groupId: string, userIds: string[]) => Promise<void>;
  
  addMarket: (marketData: Omit<Market, 'id'>) => Promise<Market | null>;
  updateMarket: (marketData: Market) => Promise<Market | null>;
  updateMarketsStatus: (marketIds: string[], statusType: 'open' | 'closed') => Promise<void>;
  cloneMarket: (marketId: string) => Promise<Market | null>;
  
  addTrophy: (trophyData: Omit<Trophy, 'id'>) => Promise<Trophy | null>;
  updateTrophy: (trophyData: Trophy) => Promise<Trophy | null>;
  
  addRewardType: (rewardTypeData: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => Promise<RewardTypeDefinition | null>;
  updateRewardType: (rewardTypeData: RewardTypeDefinition) => Promise<RewardTypeDefinition | null>;
  cloneRewardType: (rewardTypeId: string) => Promise<RewardTypeDefinition | null>;
  
  addGameAsset: (assetData: Omit<GameAsset, 'id' | 'creatorId' | 'purchaseCount'>) => Promise<GameAsset | null>;
  updateGameAsset: (assetData: GameAsset) => Promise<GameAsset | null>;
  cloneGameAsset: (assetId: string) => Promise<GameAsset | null>;
  
  setRanks: (ranks: Rank[]) => Promise<void>;
  
  deleteSelectedAssets: (assets: { [key in ShareableAssetType]?: string[] }, callback?: () => void) => Promise<void>;
  
  completeQuest: (completionData: Omit<QuestCompletion, 'id'>) => Promise<void>;
  approveQuestCompletion: (completionId: string, note?: string) => Promise<void>;
  rejectQuestCompletion: (completionId: string, note?: string) => Promise<void>;

  purchaseMarketItem: (assetId: string, marketId: string, user: User, costGroupIndex: number) => Promise<void>;
  approvePurchaseRequest: (requestId: string, approverId: string) => Promise<void>;
  rejectPurchaseRequest: (requestId: string, rejecterId: string) => Promise<void>;
  cancelPurchaseRequest: (requestId: string) => Promise<void>;
  
  executeExchange: (userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => Promise<void>;

  addGuild: (guildData: Omit<Guild, 'id'>) => Promise<Guild | null>;
  updateGuild: (guildData: Guild) => Promise<Guild | null>;
  deleteGuild: (guildId: string) => Promise<void>;

  applyManualAdjustment: (adjustment: Omit<AdminAdjustment, 'id' | 'adjustedAt'>) => Promise<boolean>;

  uploadFile: (file: File, category?: string) => Promise<{url: string} | null>;

  addTheme: (themeData: Omit<ThemeDefinition, 'id'>) => Promise<ThemeDefinition | null>;
  updateTheme: (themeData: ThemeDefinition) => Promise<ThemeDefinition | null>;
  deleteTheme: (themeId: string) => Promise<void>;

  markQuestAsTodo: (questId: string, userId: string) => Promise<void>;
  unmarkQuestAsTodo: (questId: string, userId: string) => Promise<void>;

  useItem: (assetId: string) => Promise<void>;
  craftItem: (assetId: string) => Promise<void>;

  updateSettings: (newSettings: IAppData['settings']) => Promise<void>;
  resetSettings: () => Promise<void>;
  applySettingsUpdates: () => Promise<void>;
  clearAllHistory: () => Promise<void>;
  resetAllPlayerData: () => Promise<void>;
  deleteAllCustomContent: () => Promise<void>;
  factoryReset: () => Promise<void>;
  
  sendMessage: (messageData: Omit<ChatMessage, 'id' | 'timestamp' | 'readBy' | 'senderId'>) => Promise<void>;
  markMessagesAsRead: (criteria: { partnerId?: string, guildId?: string }) => Promise<void>;
  
  addSystemNotification: (notificationData: Omit<SystemNotification, 'id' | 'timestamp' | 'readByUserIds' | 'createdAt' | 'updatedAt'>) => Promise<SystemNotification | null>;
  markSystemNotificationsAsRead: (notificationIds: string[], userId: string) => Promise<void>;

  addScheduledEvent: (eventData: Omit<ScheduledEvent, 'id'>) => Promise<ScheduledEvent | null>;
  updateScheduledEvent: (eventData: ScheduledEvent) => Promise<ScheduledEvent | null>;
  deleteScheduledEvent: (eventId: string) => Promise<void>;

  importAssetPack: (pack: any, resolutions: any) => Promise<void>;

  addBugReport: (reportData: Partial<BugReport>) => Promise<void>;
  updateBugReport: (reportId: string, updates: Partial<BugReport>) => Promise<BugReport | null>;
  deleteBugReports: (reportIds: string[]) => Promise<void>;
  importBugReports: (reports: BugReport[], mode: 'merge' | 'replace') => Promise<void>;

  addRotation: (rotationData: Omit<Rotation, 'id'>) => Promise<Rotation | null>;
  updateRotation: (rotationData: Rotation) => Promise<Rotation | null>;

  addSetbackDefinition: (setbackData: Omit<SetbackDefinition, 'id'>) => Promise<SetbackDefinition | null>;
  updateSetbackDefinition: (setbackData: SetbackDefinition) => Promise<SetbackDefinition | null>;
  applySetback: (userId: string, setbackId: string, reason: string, overrides?: Partial<SetbackDefinition>) => Promise<boolean>;

  proposeTrade: (recipientId: string, guildId: string) => Promise<TradeOffer | null>;
  updateTradeOffer: (tradeId: string, updates: Partial<TradeOffer>) => Promise<void>;
  acceptTrade: (tradeId: string) => Promise<void>;
  cancelOrRejectTrade: (tradeId: string, action: 'cancelled' | 'rejected') => Promise<void>;
  sendGift: (recipientId: string, assetId: string, guildId: string) => Promise<void>;
}

const ActionsDispatchContext = createContext<ActionsDispatch | undefined>(undefined);

export const ActionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { addNotification } = useNotificationsDispatch();
    const dataDispatch = useDataDispatch();
    const { updateUser, deleteUsers, setUsers } = useAuthDispatch();
    const { currentUser } = useAuthState();
    const { markets } = useData();

    const apiRequest = useCallback(async (method: string, path: string, body?: any) => {
        try {
            const options: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
            if (body) {
                options.body = JSON.stringify(body);
            }
            const response = await window.fetch(path, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'An unknown server error occurred.' }));
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }
            if (response.status === 204) {
                return null;
            }
            return await response.json();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown network error occurred.';
            addNotification({ type: 'error', message });
            bugLogger.add({ type: 'STATE_CHANGE', message: `API Error: ${method} ${path} - ${message}` });
            return null;
        }
    }, [addNotification]);
    
    const purchaseMarketItem = useCallback(async (assetId: string, marketId: string, user: User, costGroupIndex: number) => {
        const market = markets.find(m => m.id === marketId);
        const guildId = market?.guildId;
        const result = await apiRequest('POST', '/api/actions/purchase-item', { assetId, userId: user.id, costGroupIndex, guildId });
        if (result && result.updatedUser) {
            updateUser(result.updatedUser.id, result.updatedUser);
            if (result.newPurchaseRequest) {
                dataDispatch({ type: 'UPDATE_DATA', payload: { purchaseRequests: [result.newPurchaseRequest] } });
            }
            addNotification({ type: 'success', message: `Purchase successful!` });
        }
    }, [apiRequest, markets, updateUser, dataDispatch, addNotification]);

    const executeExchange = useCallback(async (userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => {
        const result = await apiRequest('POST', '/api/actions/execute-exchange', { userId, payItem, receiveItem, guildId });
        if (result && result.updatedUser) {
            updateUser(result.updatedUser.id, result.updatedUser);
            if (result.newAdjustment) {
                dataDispatch({ type: 'UPDATE_DATA', payload: { adminAdjustments: [result.newAdjustment] } });
            }
            addNotification({ type: 'success', message: 'Exchange successful!' });
        }
    }, [apiRequest, updateUser, dataDispatch, addNotification]);
    
    // Generic helper for add actions
    const createAddAction = <T_ADD, T_RETURN extends { id: any }, D extends keyof IAppData>(
        path: string,
        dataType: D
    ) => async (data: T_ADD): Promise<T_RETURN | null> => {
        const result = await apiRequest('POST', path, data);
        if (result) {
            dataDispatch({
                type: 'UPDATE_DATA',
                payload: { [dataType]: [result] } as Partial<IAppData>
            });
        }
        return result;
    };
    
    // Generic helper for update actions
    const createUpdateAction = <T extends { id: any }, D extends keyof IAppData>(
        pathTemplate: (id: any) => string,
        dataType: D
    ) => async (data: T): Promise<T | null> => {
        const path = pathTemplate(data.id);
        const result = await apiRequest('PUT', path, data);
        if (result) {
            dataDispatch({
                type: 'UPDATE_DATA',
                payload: { [dataType]: [result] } as Partial<IAppData>
            });
        }
        return result;
    };

    // Generic helper for clone actions
    const createCloneAction = <T_RETURN extends { id: any }, D extends keyof IAppData>(
        pathTemplate: (id: string) => string,
        dataType: D
    ) => async (id: string): Promise<T_RETURN | null> => {
        const path = pathTemplate(id);
        const result = await apiRequest('POST', path);
        if (result) {
            dataDispatch({
                type: 'UPDATE_DATA',
                payload: { [dataType]: [result] } as Partial<IAppData>
            });
        }
        return result;
    };
    
    const dispatch: ActionsDispatch = {
        addQuest: createAddAction('/api/quests', 'quests'),
        updateQuest: createUpdateAction(id => `/api/quests/${id}`, 'quests'),
        cloneQuest: createCloneAction(id => `/api/quests/clone/${id}`, 'quests'),
        updateQuestsStatus: (ids, isActive) => apiRequest('PUT', '/api/quests/bulk-status', { ids, isActive }),
        bulkUpdateQuests: (ids, updates) => apiRequest('PUT', '/api/quests/bulk-update', { ids, updates }),
        
        addQuestGroup: createAddAction('/api/quest-groups', 'questGroups'),
        updateQuestGroup: createUpdateAction(id => `/api/quest-groups/${id}`, 'questGroups'),
        assignQuestGroupToUsers: (groupId, userIds) => apiRequest('POST', `/api/quest-groups/assign`, { groupId, userIds }),
        
        addMarket: createAddAction('/api/markets', 'markets'),
        updateMarket: createUpdateAction(id => `/api/markets/${id}`, 'markets'),
        cloneMarket: createCloneAction(id => `/api/markets/clone/${id}`, 'markets'),
        updateMarketsStatus: (marketIds, statusType) => apiRequest('PUT', '/api/markets/bulk-status', { ids: marketIds, statusType }),
        
        addTrophy: createAddAction('/api/trophies', 'trophies'),
        updateTrophy: createUpdateAction(id => `/api/trophies/${id}`, 'trophies'),
        
        addRewardType: createAddAction('/api/reward-types', 'rewardTypes'),
        updateRewardType: createUpdateAction(id => `/api/reward-types/${id}`, 'rewardTypes'),
        cloneRewardType: createCloneAction(id => `/api/reward-types/clone/${id}`, 'rewardTypes'),
        
        addGameAsset: createAddAction('/api/assets', 'gameAssets'),
        updateGameAsset: createUpdateAction(id => `/api/assets/${id}`, 'gameAssets'),
        cloneGameAsset: createCloneAction(id => `/api/assets/clone/${id}`, 'gameAssets'),
        
        setRanks: (ranks) => apiRequest('POST', '/api/ranks/bulk-update', { ranks }),
        
        deleteSelectedAssets: async (assets, callback) => {
            const assetsToRemoveFromData: { [key in keyof IAppData]?: string[] } = {};

            for (const key in assets) {
                const assetType = key as ShareableAssetType;
                const ids = assets[assetType];
                if (!ids || ids.length === 0) continue;

                if (assetType === 'users') {
                    // AuthContext handles its own state and API call
                    deleteUsers(ids);
                } else {
                    // For other assets, call API first
                    await apiRequest('DELETE', `/api/${assetType}`, { ids });
                    (assetsToRemoveFromData as any)[assetType] = ids;
                }
            }
            
            // Then dispatch a single action to remove from DataContext state
            if (Object.keys(assetsToRemoveFromData).length > 0) {
                dataDispatch({
                    type: 'REMOVE_DATA',
                    payload: assetsToRemoveFromData
                });
            }

            if (callback) callback();
        },
        
        completeQuest: async (data) => {
            const result = await apiRequest('POST', '/api/actions/complete-quest', { completionData: data });
            if (result) {
                const { updatedUser, newCompletion } = result;
                if (updatedUser) updateUser(updatedUser.id, updatedUser);
                if (newCompletion) dataDispatch({ type: 'UPDATE_DATA', payload: { questCompletions: [newCompletion] } });
            }
        },
        approveQuestCompletion: async (id, note) => {
            const result = await apiRequest('POST', `/api/actions/approve-quest/${id}`, { note });
            if (result) {
                const { updatedUser, updatedCompletion, newUserTrophies, newNotifications } = result;
                if (updatedUser) updateUser(updatedUser.id, updatedUser);
                if (updatedCompletion) dataDispatch({ type: 'UPDATE_DATA', payload: { questCompletions: [updatedCompletion] } });
                if (newUserTrophies?.length) dataDispatch({ type: 'UPDATE_DATA', payload: { userTrophies: newUserTrophies } });
                if (newNotifications?.length) dataDispatch({ type: 'UPDATE_DATA', payload: { systemNotifications: newNotifications } });
            }
        },
        rejectQuestCompletion: async (id, note) => {
            const result = await apiRequest('POST', `/api/actions/reject-quest/${id}`, { note });
            if (result?.updatedCompletion) {
                dataDispatch({ type: 'UPDATE_DATA', payload: { questCompletions: [result.updatedCompletion] } });
            }
        },

        purchaseMarketItem,
        approvePurchaseRequest: async (requestId, approverId) => {
            const result = await apiRequest('POST', `/api/actions/approve-purchase/${requestId}`, { approverId });
            if (result) {
                const { updatedUser, updatedPurchaseRequest } = result;
                if (updatedUser) updateUser(updatedUser.id, updatedUser);
                if (updatedPurchaseRequest) dataDispatch({ type: 'UPDATE_DATA', payload: { purchaseRequests: [updatedPurchaseRequest] } });
            }
        },
        rejectPurchaseRequest: async (requestId, rejecterId) => {
            const result = await apiRequest('POST', `/api/actions/reject-purchase/${requestId}`, { rejecterId });
            if (result) {
                const { updatedUser, updatedPurchaseRequest } = result;
                if (updatedUser) updateUser(updatedUser.id, updatedUser);
                if (updatedPurchaseRequest) dataDispatch({ type: 'UPDATE_DATA', payload: { purchaseRequests: [updatedPurchaseRequest] } });
            }
        },
        cancelPurchaseRequest: (id) => apiRequest('POST', `/api/actions/cancel-purchase/${id}`),
        
        executeExchange,

        addGuild: createAddAction('/api/guilds', 'guilds'),
        updateGuild: createUpdateAction(id => `/api/guilds/${id}`, 'guilds'),
        deleteGuild: (id) => apiRequest('DELETE', `/api/guilds/${id}`),

        applyManualAdjustment: async (adjustment) => {
            const result = await apiRequest('POST', '/api/actions/manual-adjustment', adjustment);
            if (result && result.newAdjustment) {
                const updates: Partial<IAppData> = { adminAdjustments: [result.newAdjustment] };
                if (result.newUserTrophy) {
                    updates.userTrophies = [result.newUserTrophy];
                }
                dataDispatch({ type: 'UPDATE_DATA', payload: updates });

                if (result.updatedUser) {
                    updateUser(result.updatedUser.id, result.updatedUser);
                }
                addNotification({ type: 'success', message: 'Adjustment applied successfully.' });
                return true;
            }
            return false;
        },

        uploadFile: async (file, category) => {
            const formData = new FormData();
            formData.append('file', file);
            if (category) formData.append('category', category);
            try {
                const response = await fetch('/api/media/upload', { method: 'POST', body: formData });
                if (!response.ok) throw new Error('Upload failed');
                return await response.json();
            } catch (error) {
                addNotification({ type: 'error', message: 'File upload failed.' });
                return null;
            }
        },

        addTheme: createAddAction('/api/themes', 'themes'),
        updateTheme: createUpdateAction(id => `/api/themes/${id}`, 'themes'),
        deleteTheme: (id) => apiRequest('DELETE', `/api/themes/${id}`),

        markQuestAsTodo: async (questId, userId) => {
            const result = await apiRequest('POST', `/api/actions/mark-todo`, { questId, userId });
            if (result) dataDispatch({ type: 'UPDATE_DATA', payload: { quests: [result] }});
        },
        unmarkQuestAsTodo: async (questId, userId) => {
            const result = await apiRequest('POST', `/api/actions/unmark-todo`, { questId, userId });
            if (result) dataDispatch({ type: 'UPDATE_DATA', payload: { quests: [result] }});
        },

        useItem: (id) => apiRequest('POST', `/api/actions/use-item/${id}`),
        craftItem: (id) => apiRequest('POST', `/api/actions/craft-item/${id}`),

        updateSettings: async (settings) => {
            const result = await apiRequest('PUT', '/api/settings', settings);
            if (result) dataDispatch({ type: 'UPDATE_DATA', payload: { settings: result }});
        },
        resetSettings: () => apiRequest('POST', '/api/data/reset-settings'),
        applySettingsUpdates: () => apiRequest('POST', '/api/data/apply-updates'),
        clearAllHistory: () => apiRequest('POST', '/api/data/clear-history'),
        resetAllPlayerData: () => apiRequest('POST', '/api/data/reset-players'),
        deleteAllCustomContent: () => apiRequest('POST', '/api/data/delete-content'),
        factoryReset: () => apiRequest('POST', '/api/data/factory-reset'),
        
        sendMessage: async (messageData) => {
            if (!currentUser) return;
            const result = await apiRequest('POST', '/api/chat/send', { ...messageData, senderId: currentUser.id });
            if (result && result.newChatMessage) {
                dataDispatch({ type: 'UPDATE_DATA', payload: { chatMessages: [result.newChatMessage] } });
            } else {
                addNotification({ type: 'error', message: 'Failed to send message. Please try again later.' });
            }
        },
        markMessagesAsRead: (criteria) => apiRequest('POST', '/api/chat/read', criteria),
        
        addSystemNotification: (data) => apiRequest('POST', '/api/notifications', data),
        markSystemNotificationsAsRead: (ids, userId) => apiRequest('POST', '/api/notifications/read', { ids, userId }),
        
        addScheduledEvent: createAddAction('/api/events', 'scheduledEvents'),
        updateScheduledEvent: createUpdateAction(id => `/api/events/${id}`, 'scheduledEvents'),
        deleteScheduledEvent: (id) => apiRequest('DELETE', `/api/events/${id}`),

        importAssetPack: async (pack, resolutions) => {
            const result = await apiRequest('POST', '/api/data/import-assets', { assetPack: pack, resolutions });
            if (result.importedData) {
                const { users: importedUsers, ...otherAssets } = result.importedData;

                dataDispatch({ type: 'UPDATE_DATA', payload: otherAssets });

                if (importedUsers && importedUsers.length > 0) {
                    setUsers(currentUsers => [...currentUsers, ...importedUsers]);
                }

                addNotification({ type: 'success', message: 'Asset pack imported successfully!' });
            }
        },

        addBugReport: async (report) => {
            const result = await apiRequest('POST', '/api/bug-reports', report);
            if (result) dataDispatch({ type: 'UPDATE_DATA', payload: { bugReports: [result] }});
        },
        updateBugReport: async (reportId, updates) => {
            const result = await apiRequest('PUT', `/api/bug-reports/${reportId}`, updates);
            if (result) {
                dataDispatch({
                    type: 'UPDATE_DATA',
                    payload: { bugReports: [result] }
                });
            }
            return result;
        },
        deleteBugReports: (ids) => apiRequest('DELETE', '/api/bug-reports', { ids }),
        importBugReports: async (reports, mode) => {
            const result = await apiRequest('POST', '/api/bug-reports/import', { reports, mode });
            if (result) dataDispatch({ type: 'UPDATE_DATA', payload: { bugReports: result }});
        },

        addRotation: createAddAction('/api/rotations', 'rotations'),
        updateRotation: createUpdateAction(id => `/api/rotations/${id}`, 'rotations'),

        addSetbackDefinition: createAddAction('/api/setbacks', 'setbackDefinitions'),
        updateSetbackDefinition: createUpdateAction(id => `/api/setbacks/${id}`, 'setbackDefinitions'),
        applySetback: async (userId, setbackId, reason, overrides) => {
            if (!currentUser) return false;
            const result = await apiRequest('POST', '/api/actions/apply-setback', {
                userId,
                setbackDefinitionId: setbackId,
                reason,
                appliedById: currentUser.id,
                overrides,
            });
             if (result) {
                if (result.updatedUser) {
                    updateUser(result.updatedUser.id, result.updatedUser);
                }
                if (result.newAppliedSetback) {
                    dataDispatch({ type: 'UPDATE_DATA', payload: { appliedSetbacks: [result.newAppliedSetback] } });
                }
                return true;
            }
            return false;
        },

        proposeTrade: (recipientId, guildId) => apiRequest('POST', '/api/trades/propose', { recipientId, guildId }),
        updateTradeOffer: (id, updates) => apiRequest('PUT', `/api/trades/${id}`, updates),
        acceptTrade: (id) => apiRequest('POST', `/api/trades/accept/${id}`),
        cancelOrRejectTrade: (id, action) => apiRequest('POST', `/api/trades/resolve/${id}`, { action }),
        sendGift: (recipientId, assetId, guildId) => apiRequest('POST', '/api/gifts/send', { recipientId, assetId, guildId }),
    };

    return (
        <ActionsDispatchContext.Provider value={dispatch}>
            {children}
        </ActionsDispatchContext.Provider>
    );
};

export const useActionsDispatch = (): ActionsDispatch => {
    const context = useContext(ActionsDispatchContext);
    if (context === undefined) {
        throw new Error('useActionsDispatch must be used within an ActionsProvider');
    }
    return context;
};
