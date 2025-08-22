import {
    AppSettings, ThemeDefinition, SystemNotification, ScheduledEvent, BugReport, ModifierDefinition, AdminAdjustment, User, ChatMessage, AssetPack, ImportResolution, ShareableAssetType, Quest, QuestGroup, Rotation, QuestCompletion, Market, GameAsset, PurchaseRequest, RewardTypeDefinition, TradeOffer, Gift, Rank, Trophy, UserTrophy, Guild, BulkQuestUpdates, RewardItem,
} from '../types';
import { logger } from '../utils/logger';

// Generic API Request Function
const apiRequest = async (method: string, path: string, body?: any) => {
    const options: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const response = await window.fetch(path, options);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Server error' }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    return response.status === 204 ? null : await response.json();
};

const apiUpload = async (path: string, file: File, category?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (category) formData.append('category', category);
    
    const response = await fetch(path, { method: 'POST', body: formData });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || 'File upload failed.');
    }
    return response.json();
};

const createApiLogger = <T extends (...args: any[]) => Promise<any>>(fn: T, name: string): T => {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
        logger.log(`[API] Calling ${name}`, ...args);
        try {
            const result = await fn(...args);
            logger.log(`[API] Success ${name}`, result);
            return result;
        } catch (error) {
            logger.error(`[API] Error in ${name}`, error);
            throw error;
        }
    }) as T;
};


// --- Auth API ---
export const addUserAPI = createApiLogger((data: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>) => apiRequest('POST', '/api/users', data), 'addUserAPI');
export const updateUserAPI = createApiLogger((id: string, data: Partial<User>) => apiRequest('PUT', `/api/users/${id}`, data), 'updateUserAPI');
export const deleteUsersAPI = createApiLogger((ids: string[]) => apiRequest('DELETE', '/api/users', { ids }), 'deleteUsersAPI');
export const completeFirstRunAPI = createApiLogger((adminUserData: any) => apiRequest('POST', '/api/data/first-run', { adminUserData }), 'completeFirstRunAPI');


// --- Community API ---
export const addGuildAPI = createApiLogger((data: Omit<Guild, 'id'>) => apiRequest('POST', '/api/guilds', data), 'addGuildAPI');
export const updateGuildAPI = createApiLogger((data: Guild) => apiRequest('PUT', `/api/guilds/${data.id}`, data), 'updateGuildAPI');
export const deleteGuildAPI = createApiLogger((id: string) => apiRequest('DELETE', `/api/guilds/${id}`), 'deleteGuildAPI');

// --- Economy API ---
export const addMarketAPI = createApiLogger((data: Omit<Market, 'id'>) => apiRequest('POST', '/api/markets', data), 'addMarketAPI');
export const updateMarketAPI = createApiLogger((data: Market) => apiRequest('PUT', `/api/markets/${data.id}`, data), 'updateMarketAPI');
export const cloneMarketAPI = createApiLogger((id: string) => apiRequest('POST', `/api/markets/clone/${id}`), 'cloneMarketAPI');
export const updateMarketsStatusAPI = createApiLogger((ids: string[], statusType: 'open' | 'closed') => apiRequest('PUT', '/api/markets/bulk-status', { ids, statusType }), 'updateMarketsStatusAPI');
export const addRewardTypeAPI = createApiLogger((data: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => apiRequest('POST', '/api/reward-types', data), 'addRewardTypeAPI');
export const updateRewardTypeAPI = createApiLogger((data: RewardTypeDefinition) => apiRequest('PUT', `/api/reward-types/${data.id}`, data), 'updateRewardTypeAPI');
export const cloneRewardTypeAPI = createApiLogger((id: string) => apiRequest('POST', `/api/reward-types/clone/${id}`), 'cloneRewardTypeAPI');
export const addGameAssetAPI = createApiLogger((data: Omit<GameAsset, 'id' | 'creatorId' | 'purchaseCount'>) => apiRequest('POST', '/api/assets', data), 'addGameAssetAPI');
export const updateGameAssetAPI = createApiLogger((data: GameAsset) => apiRequest('PUT', `/api/assets/${data.id}`, data), 'updateGameAssetAPI');
export const cloneGameAssetAPI = createApiLogger((id: string) => apiRequest('POST', `/api/assets/clone/${id}`), 'cloneGameAssetAPI');
export const purchaseMarketItemAPI = createApiLogger((assetId: string, marketId: string, user: User, costGroupIndex: number) => apiRequest('POST', '/api/markets/purchase', { assetId, userId: user.id, marketId, costGroupIndex }), 'purchaseMarketItemAPI');
export const approvePurchaseRequestAPI = createApiLogger((id: string, approverId: string) => apiRequest('POST', `/api/markets/approve-purchase/${id}`, { approverId }), 'approvePurchaseRequestAPI');
export const rejectPurchaseRequestAPI = createApiLogger((id: string, rejecterId: string) => apiRequest('POST', `/api/markets/reject-purchase/${id}`, { rejecterId }), 'rejectPurchaseRequestAPI');
export const cancelPurchaseRequestAPI = createApiLogger((id: string) => apiRequest('POST', `/api/markets/cancel-purchase/${id}`), 'cancelPurchaseRequestAPI');
export const executeExchangeAPI = createApiLogger((userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => apiRequest('POST', '/api/markets/exchange', { userId, payItem, receiveItem, guildId }), 'executeExchangeAPI');
export const proposeTradeAPI = createApiLogger((recipientId: string, guildId: string, initiatorId: string) => apiRequest('POST', '/api/trades/propose', { recipientId, guildId, initiatorId }), 'proposeTradeAPI');
export const updateTradeOfferAPI = createApiLogger((id: string, updates: Partial<TradeOffer>) => apiRequest('PUT', `/api/trades/${id}`, updates), 'updateTradeOfferAPI');
export const acceptTradeAPI = createApiLogger((id: string) => apiRequest('POST', `/api/trades/accept/${id}`), 'acceptTradeAPI');
export const cancelOrRejectTradeAPI = createApiLogger((id: string, action: 'cancelled' | 'rejected') => apiRequest('POST', `/api/trades/resolve/${id}`, { action }), 'cancelOrRejectTradeAPI');
export const sendGiftAPI = createApiLogger((recipientId: string, assetId: string, guildId: string, senderId: string) => apiRequest('POST', '/api/gifts/send', { recipientId, assetId, guildId, senderId }), 'sendGiftAPI');
export const useItemAPI = createApiLogger((id: string, userId: string) => apiRequest('POST', `/api/assets/use/${id}`, { userId }), 'useItemAPI');
export const craftItemAPI = createApiLogger((id: string, userId: string) => apiRequest('POST', `/api/assets/craft/${id}`, { userId }), 'craftItemAPI');

// --- Progression API ---
export const addTrophyAPI = createApiLogger((data: Omit<Trophy, 'id'>) => apiRequest('POST', '/api/trophies', data), 'addTrophyAPI');
export const updateTrophyAPI = createApiLogger((data: Trophy) => apiRequest('PUT', `/api/trophies/${data.id}`, data), 'updateTrophyAPI');
export const setRanksAPI = createApiLogger((ranks: Rank[]) => apiRequest('POST', '/api/ranks/bulk-update', { ranks }), 'setRanksAPI');


// --- Quests API ---
export const addQuestAPI = createApiLogger((data: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => apiRequest('POST', '/api/quests', data), 'addQuestAPI');
export const updateQuestAPI = createApiLogger((data: Quest) => apiRequest('PUT', `/api/quests/${data.id}`, data), 'updateQuestAPI');
export const cloneQuestAPI = createApiLogger((id: string) => apiRequest('POST', `/api/quests/clone/${id}`), 'cloneQuestAPI');
export const updateQuestsStatusAPI = createApiLogger((ids: string[], isActive: boolean) => apiRequest('PUT', '/api/quests/bulk-status', { ids, isActive }), 'updateQuestsStatusAPI');
export const bulkUpdateQuestsAPI = createApiLogger((ids: string[], updates: BulkQuestUpdates) => apiRequest('PUT', '/api/quests/bulk-update', { ids, updates }), 'bulkUpdateQuestsAPI');
export const completeQuestAPI = createApiLogger((completionData: Omit<QuestCompletion, 'id'>) => apiRequest('POST', '/api/quests/complete', { completionData }), 'completeQuestAPI');
export const approveQuestCompletionAPI = createApiLogger((id: string, approverId: string, note?: string) => apiRequest('POST', `/api/quests/approve/${id}`, { approverId, note }), 'approveQuestCompletionAPI');
export const rejectQuestCompletionAPI = createApiLogger((id: string, rejecterId: string, note?: string) => apiRequest('POST', `/api/quests/reject/${id}`, { rejecterId, note }), 'rejectQuestCompletionAPI');
export const markQuestAsTodoAPI = createApiLogger((questId: string, userId: string) => apiRequest('POST', '/api/quests/mark-todo', { questId, userId }), 'markQuestAsTodoAPI');
export const unmarkQuestAsTodoAPI = createApiLogger((questId: string, userId: string) => apiRequest('POST', '/api/quests/unmark-todo', { questId, userId }), 'unmarkQuestAsTodoAPI');
export const addQuestGroupAPI = createApiLogger((data: Omit<QuestGroup, 'id'>) => apiRequest('POST', '/api/quest-groups', data), 'addQuestGroupAPI');
export const updateQuestGroupAPI = createApiLogger((data: QuestGroup) => apiRequest('PUT', `/api/quest-groups/${data.id}`, data), 'updateQuestGroupAPI');
export const assignQuestGroupToUsersAPI = createApiLogger((groupId: string, userIds: string[]) => apiRequest('POST', '/api/quest-groups/assign', { groupId, userIds }), 'assignQuestGroupToUsersAPI');
export const addRotationAPI = createApiLogger((data: Omit<Rotation, 'id'>) => apiRequest('POST', '/api/rotations', data), 'addRotationAPI');
export const updateRotationAPI = createApiLogger((data: Rotation) => apiRequest('PUT', `/api/rotations/${data.id}`, data), 'updateRotationAPI');
export const runRotationAPI = createApiLogger((id: string): Promise<{ message: string }> => apiRequest('POST', `/api/rotations/run/${id}`), 'runRotationAPI');
export const completeCheckpointAPI = createApiLogger((questId: string, userId: string) => apiRequest('POST', '/api/quests/complete-checkpoint', { questId, userId }), 'completeCheckpointAPI');


// --- System & Dev API ---
export const deleteSelectedAssetsAPI = createApiLogger((assets: { [key in ShareableAssetType]?: string[] }) => {
    const promises = Object.entries(assets).map(([type, ids]) => {
        if (ids && ids.length > 0) {
            const apiPath = type === 'modifierDefinitions' ? 'setbacks' : type;
            return apiRequest('DELETE', `/api/${apiPath}`, { ids });
        }
        return Promise.resolve();
    });
    return Promise.all(promises);
}, 'deleteSelectedAssetsAPI');
export const applyManualAdjustmentAPI = createApiLogger((adjustment: Omit<AdminAdjustment, 'id' | 'adjustedAt'>) => apiRequest('POST', '/api/users/adjust', adjustment), 'applyManualAdjustmentAPI');
export const uploadFileAPI = createApiLogger((file: File, category?: string) => apiUpload('/api/media/upload', file, category), 'uploadFileAPI');
export const addThemeAPI = createApiLogger((data: Omit<ThemeDefinition, 'id'>) => apiRequest('POST', '/api/themes', data), 'addThemeAPI');
export const updateThemeAPI = createApiLogger((data: ThemeDefinition) => apiRequest('PUT', `/api/themes/${data.id}`, data), 'updateThemeAPI');
export const deleteThemeAPI = createApiLogger((id: string) => apiRequest('DELETE', `/api/themes`, { ids: [id] }), 'deleteThemeAPI');
export const updateSettingsAPI = createApiLogger((settings: AppSettings) => apiRequest('PUT', '/api/settings', settings), 'updateSettingsAPI');
export const resetSettingsAPI = createApiLogger(() => apiRequest('POST', '/api/data/reset-settings'), 'resetSettingsAPI');
export const applySettingsUpdatesAPI = createApiLogger(() => apiRequest('POST', '/api/data/apply-updates'), 'applySettingsUpdatesAPI');
export const clearAllHistoryAPI = createApiLogger(() => apiRequest('POST', '/api/data/clear-history'), 'clearAllHistoryAPI');
export const resetAllPlayerDataAPI = createApiLogger(() => apiRequest('POST', '/api/data/reset-players'), 'resetAllPlayerDataAPI');
export const deleteAllCustomContentAPI = createApiLogger(() => apiRequest('POST', '/api/data/delete-content'), 'deleteAllCustomContentAPI');
export const factoryResetAPI = createApiLogger(() => apiRequest('POST', '/api/data/factory-reset'), 'factoryResetAPI');
export const addSystemNotificationAPI = createApiLogger((data: Omit<SystemNotification, 'id' | 'timestamp' | 'readByUserIds' | 'createdAt' | 'updatedAt'>) => apiRequest('POST', '/api/notifications', data), 'addSystemNotificationAPI');
export const markSystemNotificationsAsReadAPI = createApiLogger((ids: string[], userId: string) => apiRequest('POST', '/api/notifications/read', { ids, userId }), 'markSystemNotificationsAsReadAPI');
export const addScheduledEventAPI = createApiLogger((data: Omit<ScheduledEvent, 'id'>) => apiRequest('POST', '/api/events', data), 'addScheduledEventAPI');
export const updateScheduledEventAPI = createApiLogger((data: ScheduledEvent) => apiRequest('PUT', `/api/events/${data.id}`, data), 'updateScheduledEventAPI');
export const deleteScheduledEventAPI = createApiLogger((id: string) => apiRequest('DELETE', `/api/events/${id}`), 'deleteScheduledEventAPI');
export const importAssetPackAPI = createApiLogger((pack: AssetPack, resolutions: ImportResolution[]) => apiRequest('POST', '/api/data/import-assets', { assetPack: pack, resolutions }), 'importAssetPackAPI');
export const addBugReportAPI = createApiLogger((data: Partial<BugReport>) => apiRequest('POST', '/api/bug-reports', data), 'addBugReportAPI');
export const updateBugReportAPI = createApiLogger((id: string, updates: Partial<BugReport>) => apiRequest('PUT', `/api/bug-reports/${id}`, updates), 'updateBugReportAPI');
export const deleteBugReportsAPI = createApiLogger((ids: string[]) => apiRequest('DELETE', '/api/bug-reports', { ids }), 'deleteBugReportsAPI');
export const importBugReportsAPI = createApiLogger((reports: BugReport[], mode: 'merge' | 'replace') => apiRequest('POST', '/api/bug-reports/import', { reports, mode }), 'importBugReportsAPI');
export const addModifierDefinitionAPI = createApiLogger((data: Omit<ModifierDefinition, 'id'>) => apiRequest('POST', '/api/setbacks', data), 'addModifierDefinitionAPI');
export const updateModifierDefinitionAPI = createApiLogger((data: ModifierDefinition) => apiRequest('PUT', `/api/setbacks/${data.id}`, data), 'updateModifierDefinitionAPI');
export const applyModifierAPI = createApiLogger((userId: string, modifierId: string, reason: string, appliedById: string, overrides?: Partial<ModifierDefinition>) => apiRequest('POST', '/api/applied-modifiers/apply', { userId, modifierDefinitionId: modifierId, reason, appliedById, overrides }), 'applyModifierAPI');
export const cloneUserAPI = createApiLogger((id: string) => apiRequest('POST', `/api/users/clone/${id}`), 'cloneUserAPI');
export const sendMessageAPI = createApiLogger((data: { senderId: string; recipientId?: string; guildId?: string; message: string; isAnnouncement?: boolean; }) => apiRequest('POST', '/api/chat/send', data), 'sendMessageAPI');
export const markMessagesAsReadAPI = createApiLogger((payload: { userId: string; partnerId?: string; guildId?: string }) => apiRequest('POST', '/api/chat/read', payload), 'markMessagesAsReadAPI');