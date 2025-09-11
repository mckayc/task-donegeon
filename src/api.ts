
import {
    AppSettings, ThemeDefinition, SystemNotification, ScheduledEvent, BugReport, ModifierDefinition, AdminAdjustment, User, ChatMessage, AssetPack, ImportResolution, ShareableAssetType, Quest, QuestGroup, Rotation, QuestCompletion, Market, GameAsset, PurchaseRequest, RewardTypeDefinition, TradeOffer, Gift, Rank, Trophy, UserTrophy, Guild, BulkQuestUpdates, RewardItem, Minigame, GameScore, Bookmark
} from './types';

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
    if (category) {
        formData.append('category', category);
    }
    
    const response = await fetch(path, { method: 'POST', body: formData });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || 'File upload failed.');
    }
    return response.json();
};

// --- Quests API ---
export const addQuestAPI = (questData: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>, actorId: string): Promise<Quest> => apiRequest('POST', '/api/quests', { ...questData, actorId });
export const updateQuestAPI = (questData: Quest, actorId: string): Promise<Quest> => apiRequest('PUT', `/api/quests/${questData.id}`, { ...questData, actorId });
export const cloneQuestAPI = (questId: string): Promise<Quest> => apiRequest('POST', `/api/quests/clone/${questId}`);
export const updateQuestsStatusAPI = (ids: string[], isActive: boolean): Promise<void> => apiRequest('PUT', '/api/quests/bulk-status', { ids, isActive });
export const bulkUpdateQuestsAPI = (ids: string[], updates: BulkQuestUpdates): Promise<void> => apiRequest('PUT', '/api/quests/bulk-update', { ids, updates });
export const deleteQuestsAPI = (ids: string[], actorId: string): Promise<void> => apiRequest('DELETE', '/api/quests', { ids, actorId });

// --- Quest Actions ---
export const completeQuestAPI = (completionData: Omit<QuestCompletion, 'id'>): Promise<{ updatedUser: User, newCompletion: QuestCompletion }> => apiRequest('POST', '/api/quests/complete', { completionData });
export const approveQuestCompletionAPI = (completionId: string, approverId: string, note?: string): Promise<any> => apiRequest('POST', `/api/quests/approve/${completionId}`, { approverId, note });
export const rejectQuestCompletionAPI = (completionId: string, rejecterId: string, note?: string): Promise<any> => apiRequest('POST', `/api/quests/reject/${completionId}`, { rejecterId, note });
export const markQuestAsTodoAPI = (questId: string, userId: string): Promise<Quest> => apiRequest('POST', '/api/quests/mark-todo', { questId, userId });
export const unmarkQuestAsTodoAPI = (questId: string, userId: string): Promise<Quest> => apiRequest('POST', '/api/quests/unmark-todo', { questId, userId });
export const completeCheckpointAPI = (questId: string, userId: string): Promise<any> => apiRequest('POST', '/api/quests/complete-checkpoint', { questId, userId });
export const claimQuestAPI = (questId: string, userId: string): Promise<Quest> => apiRequest('POST', '/api/quests/claim', { questId, userId });
export const unclaimQuestAPI = (questId: string, userId: string): Promise<Quest> => apiRequest('POST', '/api/quests/unclaim', { questId, userId });
export const approveClaimAPI = (questId: string, userId: string, adminId: string): Promise<Quest> => apiRequest('POST', '/api/quests/approve-claim', { questId, userId, adminId });
export const rejectClaimAPI = (questId: string, userId: string, adminId: string): Promise<Quest> => apiRequest('POST', '/api/quests/reject-claim', { questId, userId, adminId });
export const updateReadingProgressAPI = (questId: string, userId: string, data: { secondsToAdd?: number; sessionSeconds?: number; pageNumber?: number; bookmarks?: Bookmark[]; locationCfi?: string; }): Promise<void> => apiRequest('POST', `/api/quests/${questId}/reading-progress`, { userId, data });

// --- Quest Groups API ---
export const addQuestGroupAPI = (data: Omit<QuestGroup, 'id'> & { questIds?: string[] }): Promise<QuestGroup> => apiRequest('POST', '/api/quest-groups', data);
export const updateQuestGroupAPI = (data: QuestGroup & { questIds?: string[] }): Promise<QuestGroup> => apiRequest('PUT', `/api/quest-groups/${data.id}`, data);
export const assignQuestGroupToUsersAPI = (groupId: string, userIds: string[], actorId: string): Promise<void> => apiRequest('POST', '/api/quest-groups/assign', { groupId, userIds, actorId });

// --- Rotations API ---
export const addRotationAPI = (data: Omit<Rotation, 'id'>): Promise<Rotation> => apiRequest('POST', '/api/rotations', data);
export const updateRotationAPI = (data: Rotation): Promise<Rotation> => apiRequest('PUT', `/api/rotations/${data.id}`, data);
export const cloneRotationAPI = (id: string): Promise<Rotation> => apiRequest('POST', `/api/rotations/clone/${id}`);
export const runRotationAPI = (id: string): Promise<{ message: string }> => apiRequest('POST', `/api/rotations/run/${id}`);

// --- System & Data API ---
export const deleteSelectedAssetsAPI = (assets: { [key in ShareableAssetType]?: string[] }, actorId: string): Promise<void> => apiRequest('POST', '/api/system/delete-assets', { assets, actorId });
export const applyManualAdjustmentAPI = (adjustment: Omit<AdminAdjustment, 'id' | 'adjustedAt'>): Promise<any> => apiRequest('POST', '/api/users/adjust', adjustment);
export const uploadFileAPI = (file: File, category?: string): Promise<{url: string}> => apiUpload('/api/media/upload/asset-gallery', file, category);
export const updateSettingsAPI = (settings: AppSettings): Promise<AppSettings> => apiRequest('PUT', '/api/settings', settings);
export const resetSettingsAPI = (): Promise<void> => apiRequest('POST', '/api/data/reset-settings');
export const applySettingsUpdatesAPI = (): Promise<void> => apiRequest('POST', '/api/data/apply-updates');
export const clearAllHistoryAPI = (): Promise<void> => apiRequest('POST', '/api/data/clear-history');
export const resetAllPlayerDataAPI = (includeAdmins: boolean): Promise<void> => apiRequest('POST', '/api/data/reset-players', { includeAdmins });
export const deleteAllCustomContentAPI = (): Promise<void> => apiRequest('POST', '/api/data/delete-content');
export const factoryResetAPI = (): Promise<void> => apiRequest('POST', '/api/data/factory-reset');
export const addSystemNotificationAPI = (data: Omit<SystemNotification, 'id' | 'timestamp' | 'readByUserIds'>): Promise<SystemNotification> => apiRequest('POST', '/api/notifications', data);
export const markSystemNotificationsAsReadAPI = (ids: string[], userId: string): Promise<void> => apiRequest('POST', '/api/notifications/read', { ids, userId });
export const importAssetPackAPI = (pack: AssetPack, resolutions: ImportResolution[], actorId: string, userIdsToAssign?: string[]): Promise<void> => apiRequest('POST', '/api/data/import-assets', { assetPack: pack, resolutions, userIdsToAssign, actorId });

// --- Themes API ---
export const addThemeAPI = (data: Omit<ThemeDefinition, 'id'>): Promise<ThemeDefinition> => apiRequest('POST', '/api/themes', data);
export const updateThemeAPI = (data: ThemeDefinition): Promise<ThemeDefinition> => apiRequest('PUT', `/api/themes/${data.id}`, data);
export const deleteThemeAPI = (id: string): Promise<void> => apiRequest('DELETE', '/api/themes', { ids: [id] });

// --- Users API ---
export const addUserAPI = (userData: Partial<User>, actorId?: string): Promise<User> => apiRequest('POST', '/api/users', { ...userData, actorId });
export const updateUserAPI = (userId: string, updates: Partial<User>): Promise<User> => apiRequest('PUT', `/api/users/${userId}`, updates);
export const deleteUsersAPI = (ids: string[], actorId: string): Promise<void> => apiRequest('DELETE', '/api/users', { ids, actorId });
export const cloneUserAPI = (userId: string): Promise<User> => apiRequest('POST', `/api/users/clone/${userId}`);
export const completeFirstRunAPI = (adminUserData: any): Promise<void> => apiRequest('POST', '/api/data/first-run', { adminUserData });

// --- Progression API ---
export const addTrophyAPI = (data: Omit<Trophy, 'id'>): Promise<Trophy> => apiRequest('POST', '/api/trophies', data);
export const updateTrophyAPI = (data: Trophy): Promise<Trophy> => apiRequest('PUT', `/api/trophies/${data.id}`, data);
export const setRanksAPI = (ranks: Rank[]): Promise<void> => apiRequest('POST', '/api/ranks/bulk-update', { ranks });

// --- Community API ---
export const addGuildAPI = (data: Omit<Guild, 'id'>): Promise<Guild> => apiRequest('POST', '/api/guilds', data);
export const updateGuildAPI = (data: Guild): Promise<Guild> => apiRequest('PUT', `/api/guilds/${data.id}`, data);
export const deleteGuildAPI = (id: string): Promise<void> => apiRequest('DELETE', `/api/guilds/${id}`);

// --- Economy API ---
export const addMarketAPI = (data: Omit<Market, 'id'>): Promise<Market> => apiRequest('POST', '/api/markets', data);
export const updateMarketAPI = (data: Market): Promise<Market> => apiRequest('PUT', `/api/markets/${data.id}`, data);
export const cloneMarketAPI = (id: string): Promise<Market> => apiRequest('POST', `/api/markets/clone/${id}`);
export const updateMarketsStatusAPI = (ids: string[], statusType: 'open' | 'closed'): Promise<void> => apiRequest('PUT', '/api/markets/bulk-status', { ids, statusType });
export const addRewardTypeAPI = (data: Omit<RewardTypeDefinition, 'id' | 'isCore'>): Promise<RewardTypeDefinition> => apiRequest('POST', '/api/reward-types', data);
export const updateRewardTypeAPI = (data: RewardTypeDefinition): Promise<RewardTypeDefinition> => apiRequest('PUT', `/api/reward-types/${data.id}`, data);
export const cloneRewardTypeAPI = (id: string): Promise<RewardTypeDefinition> => apiRequest('POST', `/api/reward-types/clone/${id}`);
export const addGameAssetAPI = (data: Omit<GameAsset, 'id' | 'creatorId' | 'purchaseCount'>): Promise<GameAsset> => apiRequest('POST', '/api/assets', data);
export const updateGameAssetAPI = (data: GameAsset): Promise<GameAsset> => apiRequest('PUT', `/api/assets/${data.id}`, data);
export const cloneGameAssetAPI = (id: string): Promise<GameAsset> => apiRequest('POST', `/api/assets/clone/${id}`);
export const purchaseMarketItemAPI = (assetId: string, marketId: string, user: User, costGroupIndex: number, guildId?: string) => apiRequest('POST', '/api/markets/purchase', { assetId, marketId, userId: user.id, costGroupIndex, guildId });
export const approvePurchaseRequestAPI = (requestId: string, approverId: string) => apiRequest('POST', `/api/markets/approve-purchase/${requestId}`, { approverId });
export const rejectPurchaseRequestAPI = (requestId: string, rejecterId: string) => apiRequest('POST', `/api/markets/reject-purchase/${requestId}`, { rejecterId });
export const cancelPurchaseRequestAPI = (requestId: string) => apiRequest('POST', `/api/markets/cancel-purchase/${requestId}`);
export const executeExchangeAPI = (userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => apiRequest('POST', '/api/markets/exchange', { userId, payItem, receiveItem, guildId });
export const proposeTradeAPI = (recipientId: string, guildId: string, initiatorId: string): Promise<TradeOffer> => apiRequest('POST', '/api/trades/propose', { recipientId, guildId, initiatorId });
export const updateTradeOfferAPI = (id: string, updates: Partial<TradeOffer>): Promise<TradeOffer> => apiRequest('PUT', `/api/trades/${id}`, updates);
export const acceptTradeAPI = (id: string): Promise<any> => apiRequest('POST', `/api/trades/accept/${id}`);
export const cancelOrRejectTradeAPI = (id: string, action: 'cancelled' | 'rejected'): Promise<TradeOffer> => apiRequest('POST', `/api/trades/resolve/${id}`, { action });
export const sendGiftAPI = (recipientId: string, assetId: string, guildId: string, senderId: string): Promise<void> => apiRequest('POST', '/api/gifts/send', { recipientId, assetId, guildId, senderId });
export const useItemAPI = (assetId: string, userId: string): Promise<any> => apiRequest('POST', `/api/assets/use/${assetId}`, { userId });
export const craftItemAPI = (assetId: string, userId: string): Promise<any> => apiRequest('POST', `/api/assets/craft/${assetId}`, { userId });

// --- System API ---
export const addBugReportAPI = (data: Partial<BugReport>): Promise<BugReport> => apiRequest('POST', '/api/bug-reports', data);
export const updateBugReportAPI = (id: string, updates: Partial<BugReport>): Promise<BugReport> => apiRequest('PUT', `/api/bug-reports/${id}`, updates);
export const deleteBugReportsAPI = (ids: string[]): Promise<void> => apiRequest('DELETE', '/api/bug-reports', { ids });
export const importBugReportsAPI = (reports: BugReport[], mode: 'merge' | 'replace'): Promise<BugReport[]> => apiRequest('POST', '/api/bug-reports/import', { reports, mode });
export const addModifierDefinitionAPI = (data: Omit<ModifierDefinition, 'id'>): Promise<ModifierDefinition> => apiRequest('POST', '/api/setbacks', data);
export const updateModifierDefinitionAPI = (data: ModifierDefinition): Promise<ModifierDefinition> => apiRequest('PUT', `/api/setbacks/${data.id}`, data);
export const applyModifierAPI = (userId: string, modifierId: string, reason: string, appliedById: string, overrides?: Partial<ModifierDefinition>): Promise<any> => apiRequest('POST', '/api/applied-modifiers/apply', { userId, modifierDefinitionId: modifierId, reason, appliedById, overrides });
export const deleteAppliedModifiersAPI = (ids: string[]): Promise<void> => apiRequest('DELETE', '/api/applied-modifiers', { ids });
export const addScheduledEventAPI = (data: Omit<ScheduledEvent, 'id'>): Promise<ScheduledEvent> => apiRequest('POST', '/api/events', data);
export const updateScheduledEventAPI = (data: ScheduledEvent): Promise<ScheduledEvent> => apiRequest('PUT', `/api/events/${data.id}`, data);
export const deleteScheduledEventAPI = (id: string): Promise<void> => apiRequest('DELETE', `/api/events/${id}`);
export const sendMessageAPI = (data: { recipientId?: string; guildId?: string; message: string; isAnnouncement?: boolean; senderId: string }): Promise<ChatMessage> => apiRequest('POST', '/api/chat/send', data);
export const markMessagesAsReadAPI = (payload: { userId: string, partnerId?: string; guildId?: string }): Promise<any> => apiRequest('POST', '/api/chat/read', payload);
export const playMinigameAPI = (gameId: string, userId: string): Promise<{updatedUser: User}> => apiRequest('POST', `/api/minigames/${gameId}/play`, { userId });
export const submitScoreAPI = (data: { gameId: string; userId: string; score: number }): Promise<GameScore> => apiRequest('POST', '/api/minigames/score', data);
export const updateMinigameAPI = (gameId: string, data: Partial<Minigame>): Promise<Minigame> => apiRequest('PUT', `/api/minigames/${gameId}`, data);
export const resetAllScoresForGameAPI = (gameId: string): Promise<void> => apiRequest('POST', `/api/minigames/${gameId}/reset-all-scores`);
export const resetScoresForUsersAPI = (gameId: string, userIds: string[]): Promise<void> => apiRequest('POST', `/api/minigames/${gameId}/reset-user-scores`, { userIds });
