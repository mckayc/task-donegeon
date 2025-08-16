
import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { IAppData, Quest, User, QuestCompletion, AdminAdjustment, PurchaseRequest, Market, Guild, Rank, Trophy, RewardTypeDefinition, ThemeDefinition, ShareableAssetType, BulkQuestUpdates, ChatMessage, SystemNotification, ScheduledEvent, BugReport, Rotation, SetbackDefinition, AppliedSetback, TradeOffer, Gift, QuestGroup, GameAsset, RewardItem } from '../types';
import { useNotificationsDispatch } from './NotificationsContext';
import { bugLogger } from '../utils/bugLogger';

// This interface defines all the functions our application can dispatch.
// Components will use this to trigger state changes.
export interface ActionsDispatch {
  addQuest: (questData: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals' | 'todoUserIds'>) => Promise<Quest | null>;
  updateQuest: (questData: Quest) => Promise<Quest | null>;
  cloneQuest: (questId: string) => Promise<Quest | null>;
  updateQuestsStatus: (questIds: string[], isActive: boolean) => Promise<void>;
  bulkUpdateQuests: (questIds: string[], updates: BulkQuestUpdates) => Promise<void>;
  
  addQuestGroup: (groupData: Omit<QuestGroup, 'id'>) => QuestGroup;
  updateQuestGroup: (groupData: QuestGroup) => void;
  assignQuestGroupToUsers: (groupId: string, userIds: string[]) => void;
  
  addMarket: (marketData: Omit<Market, 'id'>) => void;
  updateMarket: (marketData: Market) => void;
  updateMarketsStatus: (marketIds: string[], statusType: 'open' | 'closed') => void;
  cloneMarket: (marketId: string) => void;
  
  addTrophy: (trophyData: Omit<Trophy, 'id'>) => void;
  updateTrophy: (trophyData: Trophy) => void;
  
  addRewardType: (rewardTypeData: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => void;
  updateRewardType: (rewardTypeData: RewardTypeDefinition) => void;
  cloneRewardType: (rewardTypeId: string) => void;
  
  addGameAsset: (assetData: Omit<GameAsset, 'id' | 'creatorId' | 'purchaseCount'>) => void;
  updateGameAsset: (assetData: GameAsset) => void;
  cloneGameAsset: (assetId: string) => void;
  
  setRanks: (ranks: Rank[]) => void;
  
  deleteSelectedAssets: (assets: { [key in ShareableAssetType]?: string[] }, callback?: () => void) => Promise<void>;
  
  completeQuest: (completionData: Omit<QuestCompletion, 'id'>) => void;
  approveQuestCompletion: (completionId: string, note?: string) => void;
  rejectQuestCompletion: (completionId: string, note?: string) => void;

  purchaseMarketItem: (assetId: string, marketId: string, user: User, costGroupIndex: number) => void;
  approvePurchaseRequest: (requestId: string) => void;
  rejectPurchaseRequest: (requestId: string) => void;
  cancelPurchaseRequest: (requestId: string) => void;
  
  executeExchange: (userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => void;

  addGuild: (guildData: Omit<Guild, 'id'>) => void;
  updateGuild: (guildData: Guild) => void;
  deleteGuild: (guildId: string) => void;

  applyManualAdjustment: (adjustment: Omit<AdminAdjustment, 'id' | 'adjustedAt'>) => boolean;

  uploadFile: (file: File, category?: string) => Promise<{url: string} | null>;

  addTheme: (themeData: Omit<ThemeDefinition, 'id'>) => void;
  updateTheme: (themeData: ThemeDefinition) => void;
  deleteTheme: (themeId: string) => void;

  markQuestAsTodo: (questId: string, userId: string) => void;
  unmarkQuestAsTodo: (questId: string, userId: string) => void;

  useItem: (assetId: string) => void;
  craftItem: (assetId: string) => void;

  updateSettings: (newSettings: IAppData['settings']) => void;
  resetSettings: () => void;
  applySettingsUpdates: () => void;
  clearAllHistory: () => void;
  resetAllPlayerData: () => void;
  deleteAllCustomContent: () => void;
  factoryReset: () => void;
  
  sendMessage: (messageData: Omit<ChatMessage, 'id' | 'timestamp' | 'readBy'>) => void;
  markMessagesAsRead: (criteria: { partnerId?: string, guildId?: string }) => void;
  
  addSystemNotification: (notificationData: Omit<SystemNotification, 'id' | 'timestamp' | 'readByUserIds'>) => void;
  markSystemNotificationsAsRead: (notificationIds: string[]) => void;
  
  addScheduledEvent: (eventData: Omit<ScheduledEvent, 'id'>) => void;
  updateScheduledEvent: (eventData: ScheduledEvent) => void;
  deleteScheduledEvent: (eventId: string) => void;

  importAssetPack: (pack: any, resolutions: any) => Promise<void>;

  addBugReport: (reportData: Partial<BugReport>) => Promise<void>;
  updateBugReport: (reportId: string, updates: Partial<BugReport>) => Promise<void>;
  deleteBugReports: (reportIds: string[]) => Promise<void>;
  importBugReports: (reports: BugReport[], mode: 'merge' | 'replace') => Promise<void>;

  addRotation: (rotationData: Omit<Rotation, 'id'>) => void;
  updateRotation: (rotationData: Rotation) => void;

  addSetbackDefinition: (setbackData: Omit<SetbackDefinition, 'id'>) => void;
  updateSetbackDefinition: (setbackData: SetbackDefinition) => void;
  applySetback: (userId: string, setbackId: string, reason: string) => boolean;

  proposeTrade: (recipientId: string, guildId: string) => Promise<TradeOffer | null>;
  updateTradeOffer: (tradeId: string, updates: Partial<TradeOffer>) => void;
  acceptTrade: (tradeId: string) => void;
  cancelOrRejectTrade: (tradeId: string, action: 'cancelled' | 'rejected') => void;
  sendGift: (recipientId: string, assetId: string, guildId: string) => void;
}

const ActionsDispatchContext = createContext<ActionsDispatch | undefined>(undefined);

export const ActionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { addNotification } = useNotificationsDispatch();

    const apiRequest = useCallback(async (method: string, path: string, body?: any) => {
        try {
            const options: RequestInit = {
                method,
                headers: { 'Content-Type': 'application/json' },
            };
            if (body) {
                options.body = JSON.stringify(body);
            }
            const response = await fetch(path, options);
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
            throw error;
        }
    }, [addNotification]);
    
    const dispatch: ActionsDispatch = {
        addQuest: (data) => apiRequest('POST', '/api/quests', data),
        updateQuest: (data) => apiRequest('PUT', `/api/quests/${data.id}`, data),
        cloneQuest: (id) => apiRequest('POST', `/api/quests/clone/${id}`),
        updateQuestsStatus: (ids, isActive) => apiRequest('PUT', '/api/quests/bulk-status', { ids, isActive }),
        bulkUpdateQuests: (ids, updates) => apiRequest('PUT', '/api/quests/bulk-update', { ids, updates }),
        
        addQuestGroup: (data) => { console.log('STUB: addQuestGroup', data); return { ...data, id: 'temp-id' }; },
        updateQuestGroup: (data) => { console.log('STUB: updateQuestGroup', data); },
        assignQuestGroupToUsers: (groupId, userIds) => { console.log('STUB: assignQuestGroupToUsers', groupId, userIds); },
        
        addMarket: (data) => apiRequest('POST', '/api/markets', data),
        updateMarket: (data) => apiRequest('PUT', `/api/markets/${data.id}`, data),
        updateMarketsStatus: (ids, statusType) => apiRequest('PUT', '/api/markets/bulk-status', { ids, statusType }),
        cloneMarket: (id) => apiRequest('POST', `/api/markets/clone/${id}`),
        
        addTrophy: (data) => apiRequest('POST', '/api/trophies', data),
        updateTrophy: (data) => apiRequest('PUT', `/api/trophies/${data.id}`, data),
        
        addRewardType: (data) => apiRequest('POST', '/api/reward-types', data),
        updateRewardType: (data) => apiRequest('PUT', `/api/reward-types/${data.id}`, data),
        cloneRewardType: (id) => apiRequest('POST', `/api/reward-types/clone/${id}`),
        
        addGameAsset: (data) => apiRequest('POST', '/api/assets', data),
        updateGameAsset: (data) => apiRequest('PUT', `/api/assets/${data.id}`, data),
        cloneGameAsset: (id) => apiRequest('POST', `/api/assets/clone/${id}`),
        
        setRanks: (ranks) => apiRequest('POST', '/api/ranks/bulk-update', { ranks }),
        
        deleteSelectedAssets: async (assets, callback) => {
            for (const key in assets) {
                const assetType = key as ShareableAssetType;
                const ids = assets[assetType];
                if (ids && ids.length > 0) {
                    await apiRequest('DELETE', `/api/${assetType}`, { ids });
                }
            }
            if (callback) callback();
        },
        
        completeQuest: (data) => apiRequest('POST', '/api/actions/complete-quest', { completionData: data }),
        approveQuestCompletion: (id, note) => apiRequest('POST', `/api/actions/approve-quest/${id}`, { note }),
        rejectQuestCompletion: (id, note) => apiRequest('POST', `/api/actions/reject-quest/${id}`, { note }),

        purchaseMarketItem: (assetId, marketId, user, costGroupIndex) => apiRequest('POST', '/api/actions/purchase-item', { assetId, marketId, userId: user.id, costGroupIndex }),
        approvePurchaseRequest: (id) => apiRequest('POST', `/api/actions/approve-purchase/${id}`),
        rejectPurchaseRequest: (id) => apiRequest('POST', `/api/actions/reject-purchase/${id}`),
        cancelPurchaseRequest: (id) => apiRequest('POST', `/api/actions/cancel-purchase/${id}`),
        
        executeExchange: (userId, payItem, receiveItem, guildId) => apiRequest('POST', '/api/actions/execute-exchange', { userId, payItem, receiveItem, guildId }),

        addGuild: (data) => apiRequest('POST', '/api/guilds', data),
        updateGuild: (data) => apiRequest('PUT', `/api/guilds/${data.id}`, data),
        deleteGuild: (id) => apiRequest('DELETE', `/api/guilds/${id}`),

        applyManualAdjustment: (adj) => { apiRequest('POST', '/api/actions/manual-adjustment', adj); return true; },

        uploadFile: async (file, category) => {
            const formData = new FormData();
            formData.append('file', file);
            if (category) {
                formData.append('category', category);
            }
            try {
                const response = await fetch('/api/media/upload', { method: 'POST', body: formData });
                if (!response.ok) throw new Error('Upload failed');
                return await response.json();
            } catch (error) {
                addNotification({ type: 'error', message: 'File upload failed.' });
                return null;
            }
        },

        addTheme: (data) => apiRequest('POST', '/api/themes', data),
        updateTheme: (data) => apiRequest('PUT', `/api/themes/${data.id}`, data),
        deleteTheme: (id) => apiRequest('DELETE', `/api/themes/${id}`),

        markQuestAsTodo: (questId, userId) => apiRequest('POST', `/api/actions/mark-todo`, { questId, userId }),
        unmarkQuestAsTodo: (questId, userId) => apiRequest('POST', `/api/actions/unmark-todo`, { questId, userId }),

        useItem: (id) => apiRequest('POST', `/api/actions/use-item/${id}`),
        craftItem: (id) => apiRequest('POST', `/api/actions/craft-item/${id}`),

        updateSettings: (settings) => apiRequest('PUT', '/api/settings', settings),
        resetSettings: () => apiRequest('POST', '/api/data/reset-settings'),
        applySettingsUpdates: () => apiRequest('POST', '/api/data/apply-updates'),
        clearAllHistory: () => apiRequest('POST', '/api/data/clear-history'),
        resetAllPlayerData: () => apiRequest('POST', '/api/data/reset-players'),
        deleteAllCustomContent: () => apiRequest('POST', '/api/data/delete-content'),
        factoryReset: () => apiRequest('POST', '/api/data/factory-reset'),
        
        sendMessage: (data) => apiRequest('POST', '/api/chat/send', data),
        markMessagesAsRead: (criteria) => apiRequest('POST', '/api/chat/read', criteria),
        
        addSystemNotification: (data) => apiRequest('POST', '/api/notifications', data),
        markSystemNotificationsAsRead: (ids) => apiRequest('POST', '/api/notifications/read', { ids }),
        
        addScheduledEvent: (data) => apiRequest('POST', '/api/events', data),
        updateScheduledEvent: (data) => apiRequest('PUT', `/api/events/${data.id}`, data),
        deleteScheduledEvent: (id) => apiRequest('DELETE', `/api/events/${id}`),

        importAssetPack: (pack, resolutions) => apiRequest('POST', '/api/data/import-assets', { assetPack: pack, resolutions }),

        addBugReport: (report) => apiRequest('POST', '/api/bug-reports', report),
        updateBugReport: (id, updates) => apiRequest('PUT', `/api/bug-reports/${id}`, updates),
        deleteBugReports: (ids) => apiRequest('DELETE', '/api/bug-reports', { ids }),
        importBugReports: (reports, mode) => apiRequest('POST', '/api/bug-reports/import', { reports, mode }),

        addRotation: (data) => apiRequest('POST', '/api/rotations', data),
        updateRotation: (data) => apiRequest('PUT', `/api/rotations/${data.id}`, data),

        addSetbackDefinition: (data) => apiRequest('POST', '/api/setbacks', data),
        updateSetbackDefinition: (data) => apiRequest('PUT', `/api/setbacks/${data.id}`, data),
        applySetback: (userId, setbackId, reason) => { apiRequest('POST', '/api/actions/apply-setback', { userId, setbackDefinitionId: setbackId, reason }); return true; },

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
