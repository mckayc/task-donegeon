
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
    const response = await window.fetch(path, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Server error' }));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }
    return response.json();
};

// --- AUTH ---
// FIX: Updated the type of `userData` to match the more specific `Omit` type used in AuthContext, resolving the type mismatch.
export const addUserAPI = (userData: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'profilePictureUrl' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>, actorId?: string) => apiRequest('POST', '/api/users', { ...userData, actorId });
export const updateUserAPI = (userId: string, update: Partial<User>) => apiRequest('PUT', `/api/users/${userId}`, update);
export const deleteUsersAPI = (userIds: string[], actorId?: string) => apiRequest('DELETE', '/api/users', { ids: userIds, actorId });
export const completeFirstRunAPI = (adminUserData: any) => apiRequest('POST', '/api/data/first-run', { adminUserData });

// --- QUESTS ---
// FIX: Updated `questData` type to match the `Omit` type from QuestsContext, which correctly reflects that 'claimedByUserIds' and 'dismissals' are not sent for new quests.
export const addQuestAPI = (questData: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>, actorId: string) => apiRequest('POST', '/api/quests', { ...questData, actorId });
export const updateQuestAPI = (questData: Quest, actorId: string) => apiRequest('PUT', `/api/quests/${questData.id}`, { ...questData, actorId });
export const cloneQuestAPI = (questId: string) => apiRequest('POST', `/api/quests/clone/${questId}`);
export const updateQuestsStatusAPI = (questIds: string[], isActive: boolean) => apiRequest('PUT', '/api/quests/bulk-status', { ids: questIds, isActive });
export const bulkUpdateQuestsAPI = (questIds: string[], updates: BulkQuestUpdates) => apiRequest('PUT', '/api/quests/bulk-update', { ids: questIds, updates });
export const completeQuestAPI = (completionData: Omit<QuestCompletion, 'id'>) => apiRequest('POST', '/api/quests/complete', { completionData });
export const approveQuestCompletionAPI = (completionId: string, approverId: string, note?: string) => apiRequest('POST', `/api/quests/approve/${completionId}`, { approverId, note });
export const rejectQuestCompletionAPI = (completionId: string, rejecterId: string, note?: string) => apiRequest('POST', `/api/quests/reject/${completionId}`, { rejecterId, note });
export const markQuestAsTodoAPI = (questId: string, userId: string) => apiRequest('POST', '/api/quests/mark-todo', { questId, userId });
export const unmarkQuestAsTodoAPI = (questId: string, userId: string) => apiRequest('POST', '/api/quests/unmark-todo', { questId, userId });
export const completeCheckpointAPI = (questId: string, userId: string) => apiRequest('POST', '/api/quests/complete-checkpoint', { questId, userId });
export const claimQuestAPI = (questId: string, userId: string) => apiRequest('POST', '/api/quests/claim', { questId, userId });
export const unclaimQuestAPI = (questId: string, userId: string) => apiRequest('POST', '/api/quests/unclaim', { questId, userId });
export const approveClaimAPI = (questId: string, userId: string, adminId: string) => apiRequest('POST', '/api/quests/approve-claim', { questId, userId, adminId });
export const rejectClaimAPI = (questId: string, userId: string, adminId: string) => apiRequest('POST', '/api/quests/reject-claim', { questId, userId, adminId });

export const updateReadingProgressAPI = (questId: string, userId: string, data: { secondsToAdd?: number; sessionSeconds?: number; pageNumber?: number; bookmarks?: Bookmark[]; locationCfi?: string; }) =>
    apiRequest('POST', `/api/quests/${questId}/reading-progress`, { userId, data });

// --- QUEST GROUPS ---
export const addQuestGroupAPI = (groupData: Omit<QuestGroup, 'id'> & { questIds?: string[], actorId?: string }) => apiRequest('POST', '/api/quest-groups', groupData);
export const updateQuestGroupAPI = (groupData: QuestGroup & { questIds?: string[] }) => apiRequest('PUT', `/api/quest-groups/${groupData.id}`, groupData);
export const assignQuestGroupToUsersAPI = (groupId: string, userIds: string[], actorId: string) => apiRequest('POST', '/api/quest-groups/assign', { groupId, userIds, actorId });

// --- ROTATIONS ---
export const addRotationAPI = (rotationData: Omit<Rotation, 'id'>) => apiRequest('POST', '/api/rotations', rotationData);
export const updateRotationAPI = (rotationData: Rotation) => apiRequest('PUT', `/api/rotations/${rotationData.id}`, rotationData);
export const cloneRotationAPI = (rotationId: string) => apiRequest('POST', `/api/rotations/clone/${rotationId}`);
export const runRotationAPI = (rotationId: string) => apiRequest('POST', `/api/rotations/run/${rotationId}`);

// --- ECONOMY ---
export const addMarketAPI = (marketData: Omit<Market, 'id'>) => apiRequest('POST', '/api/markets', marketData);
export const updateMarketAPI = (marketData: Market) => apiRequest('PUT', `/api/markets/${marketData.id}`, marketData);
export const cloneMarketAPI = (marketId: string) => apiRequest('POST', `/api/markets/clone/${marketId}`);
export const updateMarketsStatusAPI = (marketIds: string[], statusType: 'open' | 'closed') => apiRequest('PUT', '/api/markets/bulk-status', { ids: marketIds, statusType });
export const addRewardTypeAPI = (data: Omit<RewardTypeDefinition, 'id'|'isCore'>) => apiRequest('POST', '/api/reward-types', data);
export const updateRewardTypeAPI = (data: RewardTypeDefinition) => apiRequest('PUT', `/api/reward-types/${data.id}`, data);
export const cloneRewardTypeAPI = (id: string) => apiRequest('POST', `/api/reward-types/clone/${id}`);
export const addGameAssetAPI = (data: Omit<GameAsset, 'id'|'creatorId'|'purchaseCount'>) => apiRequest('POST', '/api/assets', data);
export const updateGameAssetAPI = (data: GameAsset) => apiRequest('PUT', `/api/assets/${data.id}`, data);
export const cloneGameAssetAPI = (id: string) => apiRequest('POST', `/api/assets/clone/${id}`);
export const purchaseMarketItemAPI = (assetId: string, marketId: string, user: User, costGroupIndex: number, guildId?: string) => apiRequest('POST', '/api/markets/purchase', { assetId, userId: user.id, costGroupIndex, marketId, guildId });
export const approvePurchaseRequestAPI = (requestId: string, approverId: string) => apiRequest('POST', `/api/markets/approve-purchase/${requestId}`, { approverId });
export const rejectPurchaseRequestAPI = (requestId: string, rejecterId: string) => apiRequest('POST', `/api/markets/reject-purchase/${requestId}`, { rejecterId });
export const cancelPurchaseRequestAPI = (requestId: string) => apiRequest('POST', `/api/markets/cancel-purchase/${requestId}`);
export const executeExchangeAPI = (userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => apiRequest('POST', '/api/markets/exchange', { userId, payItem, receiveItem, guildId });
export const proposeTradeAPI = (recipientId: string, guildId: string, initiatorId: string) => apiRequest('POST', '/api/trades/propose', { recipientId, guildId, initiatorId });
export const updateTradeOfferAPI = (id: string, updates: Partial<TradeOffer>) => apiRequest('PUT', `/api/trades/${id}`, updates);
export const acceptTradeAPI = (id: string) => apiRequest('POST', `/api/trades/accept/${id}`);
export const cancelOrRejectTradeAPI = (id: string, action: 'cancelled' | 'rejected') => apiRequest('POST', `/api/trades/resolve/${id}`, { action });
export const sendGiftAPI = (recipientId: string, assetId: string, guildId: string, senderId: string) => apiRequest('POST', '/api/gifts/send', { recipientId, assetId, guildId, senderId });
export const useItemAPI = (assetId: string, userId: string) => apiRequest('POST', `/api/assets/use/${assetId}`, { userId });
export const craftItemAPI = (assetId: string, userId: string) => apiRequest('POST', `/api/assets/craft/${assetId}`, { userId });

// --- PROGRESSION ---
export const setRanksAPI = (ranks: Rank[]) => apiRequest('POST', '/api/ranks/bulk-update', { ranks });
export const addTrophyAPI = (data: Omit<Trophy, 'id'>) => apiRequest('POST', '/api/trophies', data);
export const updateTrophyAPI = (data: Trophy) => apiRequest('PUT', `/api/trophies/${data.id}`, data);

// --- SYSTEM ---
export const deleteSelectedAssetsAPI = (assets: { [key in ShareableAssetType]?: string[] }, actorId: string) => apiRequest('POST', '/api/system/delete-assets', { assets, actorId });
export const applyManualAdjustmentAPI = (adjustment: Omit<AdminAdjustment, 'id' | 'adjustedAt'>) => apiRequest('POST', '/api/users/adjust', adjustment);
export const uploadFileAPI = (file: File, category?: string) => apiUpload('/api/media/upload/asset-gallery', file, category);
export const addThemeAPI = (data: Omit<ThemeDefinition, 'id'>) => apiRequest('POST', '/api/themes', data);
export const updateThemeAPI = (data: ThemeDefinition) => apiRequest('PUT', `/api/themes/${data.id}`, data);
export const deleteThemeAPI = (id: string) => apiRequest('DELETE', '/api/themes', { ids: [id] });
export const updateSettingsAPI = (settings: AppSettings) => apiRequest('PUT', '/api/settings', settings);
export const resetSettingsAPI = () => apiRequest('POST', '/api/data/reset-settings');
export const applySettingsUpdatesAPI = () => apiRequest('POST', '/api/data/apply-updates');
export const clearAllHistoryAPI = () => apiRequest('POST', '/api/data/clear-history');
export const resetAllPlayerDataAPI = (includeAdmins: boolean) => apiRequest('POST', '/api/data/reset-players', { includeAdmins });
export const deleteAllCustomContentAPI = () => apiRequest('POST', '/api/data/delete-content');
export const factoryResetAPI = () => apiRequest('POST', '/api/data/factory-reset');
// FIX: Updated the type of `data` to match the specific `Omit` type used in SystemContext, which correctly omits backend-generated fields like `timestamp` and `readByUserIds`.
export const addSystemNotificationAPI = (data: Omit<SystemNotification, 'id' | 'timestamp' | 'readByUserIds' | 'createdAt' | 'updatedAt'>) => apiRequest('POST', '/api/notifications', data);
export const markSystemNotificationsAsReadAPI = (ids: string[], userId: string) => apiRequest('POST', '/api/notifications/read', { ids, userId });
export const addScheduledEventAPI = (data: Omit<ScheduledEvent, 'id'>) => apiRequest('POST', '/api/events', data);
export const updateScheduledEventAPI = (data: ScheduledEvent) => apiRequest('PUT', `/api/events/${data.id}`, data);
export const deleteScheduledEventAPI = (id: string) => apiRequest('DELETE', `/api/events/${id}`);
export const importAssetPackAPI = (pack: any, resolutions: any, actorId: string, userIdsToAssign?: string[]) => apiRequest('POST', '/api/data/import-assets', { assetPack: pack, resolutions, userIdsToAssign, actorId });
export const addBugReportAPI = (data: Partial<BugReport>) => apiRequest('POST', '/api/bug-reports', data);
export const updateBugReportAPI = (id: string, updates: Partial<BugReport>) => apiRequest('PUT', `/api/bug-reports/${id}`, updates);
export const deleteBugReportsAPI = (ids: string[]) => apiRequest('DELETE', '/api/bug-reports', { ids });
export const importBugReportsAPI = (reports: BugReport[], mode: 'merge' | 'replace') => apiRequest('POST', '/api/bug-reports/import', { reports, mode });
export const addModifierDefinitionAPI = (data: Omit<ModifierDefinition, 'id'>) => apiRequest('POST', '/api/setbacks', data);
export const updateModifierDefinitionAPI = (data: ModifierDefinition) => apiRequest('PUT', `/api/setbacks/${data.id}`, data);
export const applyModifierAPI = (userId: string, modifierId: string, reason: string, appliedById: string, overrides?: Partial<ModifierDefinition>) => apiRequest('POST', '/api/applied-modifiers/apply', { userId, modifierDefinitionId: modifierId, reason, appliedById, overrides });
export const deleteAppliedModifiersAPI = (ids: string[]) => apiRequest('DELETE', '/api/applied-modifiers', { ids });
export const cloneUserAPI = (id: string) => apiRequest('POST', `/api/users/clone/${id}`);
export const sendMessageAPI = (data: any) => apiRequest('POST', '/api/chat/send', data);
export const markMessagesAsReadAPI = (data: any) => apiRequest('POST', '/api/chat/read', data);

// --- MINIGAMES ---
export const updateMinigameAPI = (id: string, data: Partial<Minigame>) => apiRequest('PUT', `/api/minigames/${id}`, data);
export const playMinigameAPI = (id: string, userId: string) => apiRequest('POST', `/api/minigames/${id}/play`, { userId });
export const submitScoreAPI = (data: { gameId: string, userId: string, score: number }) => apiRequest('POST', `/api/minigames/score`, data);
export const resetAllScoresForGameAPI = (id: string) => apiRequest('POST', `/api/minigames/${id}/reset-all-scores`);
export const resetScoresForUsersAPI = (id: string, userIds: string[]) => apiRequest('POST', `/api/minigames/${id}/reset-user-scores`, { userIds });

// --- GUILDS ---
export const addGuildAPI = (data: Omit<Guild, 'id'>) => apiRequest('POST', '/api/guilds', data);
export const updateGuildAPI = (data: Guild) => apiRequest('PUT', `/api/guilds/${data.id}`, data);
export const deleteGuildAPI = (id: string) => apiRequest('DELETE', `/api/guilds/${id}`);
