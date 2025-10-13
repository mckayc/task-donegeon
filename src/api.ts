import {
    AppSettings, ThemeDefinition, SystemNotification, ScheduledEvent, BugReport, ModifierDefinition, AdminAdjustment, User, ChatMessage, AssetPack, ImportResolution, ShareableAssetType, Quest, QuestGroup, Rotation, QuestCompletion, Market, GameAsset, PurchaseRequest, RewardTypeDefinition, TradeOffer, Gift, Rank, Trophy, UserTrophy, Guild, BulkQuestUpdates, RewardItem, Minigame, GameScore, AITutor, AITutorSessionLog
} from '../types';

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


// --- Auth API ---
export const addUserAPI = (data: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'profilePictureUrl' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>, actorId?: string) => apiRequest('POST', '/api/users', { ...data, actorId });
export const updateUserAPI = (id: string, data: Partial<User>) => apiRequest('PUT', `/api/users/${id}`, data);
export const deleteUsersAPI = (ids: string[], actorId?: string) => apiRequest('DELETE', '/api/users', { ids, actorId });
export const completeFirstRunAPI = (adminUserData: any) => apiRequest('POST', '/api/data/first-run', { adminUserData });
export const depositToVaultAPI = (userId: string, amounts: { purse: { [key: string]: number }, experience: { [key: string]: number } }) => apiRequest('POST', `/api/users/vault/deposit`, { userId, amounts });
export const withdrawFromVaultAPI = (userId: string, amounts: { purse: { [key: string]: number }, experience: { [key: string]: number } }) => apiRequest('POST', `/api/users/vault/withdraw`, { userId, amounts });


// --- Community API ---
export const addGuildAPI = (data: Omit<Guild, 'id'>) => apiRequest('POST', '/api/guilds', data);
export const updateGuildAPI = (data: Guild) => apiRequest('PUT', `/api/guilds/${data.id}`, data);
export const deleteGuildAPI = (id: string) => apiRequest('DELETE', `/api/guilds/${id}`);

// --- Economy API ---
export const addMarketAPI = (data: Omit<Market, 'id'>) => apiRequest('POST', '/api/markets', data);
export const updateMarketAPI = (data: Market) => apiRequest('PUT', `/api/markets/${data.id}`, data);
export const cloneMarketAPI = (id: string) => apiRequest('POST', `/api/markets/clone/${id}`);
export const updateMarketsStatusAPI = (ids: string[], statusType: 'open' | 'closed') => apiRequest('PUT', '/api/markets/bulk-status', { ids, statusType });
export const addRewardTypeAPI = (data: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => apiRequest('POST', '/api/reward-types', data);
export const updateRewardTypeAPI = (data: RewardTypeDefinition) => apiRequest('PUT', `/api/reward-types/${data.id}`, data);
export const cloneRewardTypeAPI = (id: string) => apiRequest('POST', `/api/reward-types/clone/${id}`);
export const addGameAssetAPI = (data: Omit<GameAsset, 'id' | 'creatorId' | 'purchaseCount'>) => apiRequest('POST', '/api/assets', data);
export const updateGameAssetAPI = (data: GameAsset) => apiRequest('PUT', `/api/assets/${data.id}`, data);
export const cloneGameAssetAPI = (id: string) => apiRequest('POST', `/api/assets/clone/${id}`);
export const purchaseMarketItemAPI = (assetId: string, marketId: string, user: User, costGroupIndex: number) => apiRequest('POST', '/api/markets/purchase', { assetId, userId: user.id, marketId, costGroupIndex });
export const approvePurchaseRequestAPI = (id: string, approverId: string) => apiRequest('POST', `/api/markets/approve-purchase/${id}`, { approverId });
export const rejectPurchaseRequestAPI = (id: string, rejecterId: string) => apiRequest('POST', `/api/markets/reject-purchase/${id}`, { rejecterId });
export const cancelPurchaseRequestAPI = (id: string) => apiRequest('POST', `/api/markets/cancel-purchase/${id}`);
export const revertPurchaseAPI = (id: string, adminId: string) => apiRequest('POST', `/api/markets/revert-purchase/${id}`, { adminId });
export const executeExchangeAPI = (userId: string, payItem: RewardItem & { pooledRewardTypeIds: string[] }, receiveItem: RewardItem, guildId?: string) => apiRequest('POST', '/api/markets/exchange', { userId, payItem, receiveItem, guildId });
export const proposeTradeAPI = (recipientId: string, guildId: string, initiatorId: string) => apiRequest('POST', '/api/trades/propose', { recipientId, guildId, initiatorId });
export const updateTradeOfferAPI = (id: string, updates: Partial<TradeOffer>) => apiRequest('PUT', `/api/trades/${id}`, updates);
export const acceptTradeAPI = (id: string) => apiRequest('POST', `/api/trades/accept/${id}`);
export const cancelOrRejectTradeAPI = (id: string, action: 'cancelled' | 'rejected') => apiRequest('POST', `/api/trades/resolve/${id}`, { action });
export const sendGiftAPI = (recipientId: string, assetId: string, guildId: string, senderId: string) => apiRequest('POST', '/api/gifts/send', { recipientId, assetId, guildId, senderId });
export const useItemAPI = (id: string, userId: string) => apiRequest('POST', `/api/assets/use/${id}`, { userId });
export const craftItemAPI = (id: string, userId: string) => apiRequest('POST', `/api/assets/craft/${id}`, { userId });

// --- Progression API ---
export const addTrophyAPI = (data: Omit<Trophy, 'id'>) => apiRequest('POST', '/api/trophies', data);
export const updateTrophyAPI = (data: Trophy) => apiRequest('PUT', `/api/trophies/${data.id}`, data);
export const setRanksAPI = (ranks: Rank[]) => apiRequest('POST', '/api/ranks/bulk-update', { ranks });


// --- Quests API ---
export const addQuestAPI = (data: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>, actorId: string) => apiRequest('POST', '/api/quests', { ...data, actorId });
export const updateQuestAPI = (data: Quest, actorId: string) => apiRequest('PUT', `/api/quests/${data.id}`, { ...data, actorId });
export const cloneQuestAPI = (id: string) => apiRequest('POST', `/api/quests/clone/${id}`);
export const updateQuestsStatusAPI = (ids: string[], isActive: boolean) => apiRequest('PUT', '/api/quests/bulk-status', { ids, isActive });
export const bulkUpdateQuestsAPI = (ids: string[], updates: BulkQuestUpdates) => apiRequest('PUT', '/api/quests/bulk-update', { ids, updates });
export const completeQuestAPI = (completionData: Omit<QuestCompletion, 'id'> & { aiTutorSessionLog?: any }) => apiRequest('POST', '/api/quests/complete', { completionData });
export const approveQuestCompletionAPI = (id: string, approverId: string, note?: string) => apiRequest('POST', `/api/quests/approve/${id}`, { approverId, note });
export const rejectQuestCompletionAPI = (id: string, rejecterId: string, note?: string) => apiRequest('POST', `/api/quests/reject/${id}`, { rejecterId, note });
export const revertQuestCompletionAPI = (id: string, adminId: string) => apiRequest('POST', `/api/quests/revert-approval/${id}`, { adminId });
export const markQuestAsTodoAPI = (questId: string, userId: string) => apiRequest('POST', '/api/quests/mark-todo', { questId, userId });
export const unmarkQuestAsTodoAPI = (questId: string, userId: string) => apiRequest('POST', '/api/quests/unmark-todo', { questId, userId });
export const addQuestGroupAPI = (data: Omit<QuestGroup, 'id'> & { questIds?: string[] }) => apiRequest('POST', '/api/quest-groups', data);
export const updateQuestGroupAPI = (data: QuestGroup & { questIds?: string[] }) => apiRequest('PUT', `/api/quest-groups/${data.id}`, data);
export const assignQuestGroupToUsersAPI = (groupId: string, userIds: string[], actorId: string) => apiRequest('POST', '/api/quest-groups/assign', { groupId, userIds, actorId });
export const addRotationAPI = (data: Omit<Rotation, 'id'>) => apiRequest('POST', '/api/rotations', data);
export const updateRotationAPI = (data: Rotation) => apiRequest('PUT', `/api/rotations/${data.id}`, data);
export const cloneRotationAPI = (id: string) => apiRequest('POST', `/api/rotations/clone/${id}`);
export const runRotationAPI = (id: string) => apiRequest('POST', `/api/rotations/run/${id}`);
export const completeCheckpointAPI = (questId: string, userId: string) => apiRequest('POST', '/api/quests/complete-checkpoint', { questId, userId });
export const claimQuestAPI = (questId: string, userId: string) => apiRequest('POST', '/api/quests/claim', { questId, userId });
export const unclaimQuestAPI = (questId: string, userId: string) => apiRequest('POST', '/api/quests/unclaim', { questId, userId });
export const approveClaimAPI = (questId: string, userId: string, adminId: string) => apiRequest('POST', '/api/quests/approve-claim', { questId, userId, adminId });
export const rejectClaimAPI = (questId: string, userId: string, adminId: string) => apiRequest('POST', '/api/quests/reject-claim', { questId, userId, adminId });
export const updateReadingProgressAPI = (questId: string, userId: string, data: { secondsToAdd?: number; sessionSeconds?: number; pageNumber?: number; bookmarks?: any[]; locationCfi?: string; }) => apiRequest('POST', `/api/quests/${questId}/reading-progress`, { userId, data });

// --- Minigames API ---
export const getMinigamesAPI = () => apiRequest('GET', '/api/minigames');
export const updateMinigameAPI = (gameId: string, data: Partial<Minigame>) => apiRequest('PUT', `/api/minigames/${gameId}`, data);
export const getGameScoresAPI = () => apiRequest('GET', '/api/minigames/scores');
export const playMinigameAPI = (gameId: string, userId: string) => apiRequest('POST', `/api/minigames/${gameId}/play`, { userId });
export const submitScoreAPI = (scoreData: { gameId: string; userId: string; score: number }) => apiRequest('POST', '/api/minigames/score', scoreData);
export const deleteMinigameAPI = (gameId: string) => apiRequest('DELETE', `/api/minigames/${gameId}`);
export const resetAllScoresForGameAPI = (gameId: string) => apiRequest('POST', `/api/minigames/${gameId}/reset-all-scores`);
export const resetScoresForUsersAPI = (gameId: string, userIds: string[]) => apiRequest('POST', `/api/minigames/${gameId}/reset-user-scores`, { userIds });

// --- AI Tutor API ---
export const addAITutorAPI = (data: Omit<AITutor, 'id'>) => apiRequest('POST', '/api/ai-tutors', data);
export const updateAITutorAPI = (data: AITutor) => apiRequest('PUT', `/api/ai-tutors/${data.id}`, data);
export const getTutorSessionLogAPI = (completionId: string) => apiRequest('GET', `/api/chronicles/tutor-session/${completionId}`);
export const startTutorSessionAPI = (questId: string, userId: string) => apiRequest('POST', '/api/ai/tutor/start', { questId, userId });
export const sendMessageToTutorAPI = (sessionId: string, message: string) => apiRequest('POST', '/api/ai/tutor/message', { sessionId, message });
export const generateFinalQuizAPI = (sessionId: string) => apiRequest('POST', '/api/ai/tutor/generate-final-quiz', { sessionId });


// --- System & Dev API ---
export const deleteSelectedAssetsAPI = (assets: { [key in ShareableAssetType]?: string[] }, actorId: string) => {
    return apiRequest('POST', '/api/system/delete-assets', { assets, actorId });
};
export const applyManualAdjustmentAPI = (adjustment: Omit<AdminAdjustment, 'id' | 'adjustedAt'>) => apiRequest('POST', '/api/users/adjust', adjustment);
export const uploadFileAPI = (file: File, category?: string) => {
    const uploadPath = category ? `/api/media/upload/asset-gallery/${encodeURIComponent(category)}` : '/api/media/upload/asset-gallery';
    return apiUpload(uploadPath, file);
};
export const addThemeAPI = (data: Omit<ThemeDefinition, 'id'>) => apiRequest('POST', '/api/themes', data);
export const updateThemeAPI = (data: ThemeDefinition) => apiRequest('PUT', `/api/themes/${data.id}`, data);
export const deleteThemeAPI = (id: string) => apiRequest('DELETE', `/api/themes`, { ids: [id] });
export const updateSettingsAPI = (settings: AppSettings) => apiRequest('PUT', '/api/settings', settings);
export const resetSettingsAPI = () => apiRequest('POST', '/api/data/reset-settings');
export const applySettingsUpdatesAPI = () => apiRequest('POST', '/api/data/apply-updates');
export const clearAllHistoryAPI = () => apiRequest('POST', '/api/data/clear-history');
export const resetAllPlayerDataAPI = (includeAdmins: boolean) => apiRequest('POST', '/api/data/reset-players', { includeAdmins });
export const deleteAllCustomContentAPI = () => apiRequest('POST', '/api/data/delete-content');
export const factoryResetAPI = () => apiRequest('POST', '/api/data/factory-reset');
export const addSystemNotificationAPI = (data: Omit<SystemNotification, 'id' | 'timestamp' | 'readByUserIds' | 'createdAt' | 'updatedAt'>) => apiRequest('POST', '/api/notifications', data);
export const markSystemNotificationsAsReadAPI = (ids: string[], userId: string) => apiRequest('POST', '/api/notifications/read', { ids, userId });
export const addScheduledEventAPI = (data: Omit<ScheduledEvent, 'id'>) => apiRequest('POST', '/api/events', data);
export const updateScheduledEventAPI = (data: ScheduledEvent) => apiRequest('PUT', `/api/events/${data.id}`, data);
export const deleteScheduledEventAPI = (id: string) => apiRequest('DELETE', `/api/events/${id}`);
export const importAssetPackAPI = (pack: AssetPack, resolutions: any, actorId: string, userIdsToAssign?: string[]) => apiRequest('POST', '/api/data/import-assets', { assetPack: pack, resolutions, userIdsToAssign, actorId });
export const addBugReportAPI = (data: Partial<BugReport>) => apiRequest('POST', '/api/bug-reports', data);
export const updateBugReportAPI = (id: string, updates: Partial<BugReport>) => apiRequest('PUT', `/api/bug-reports/${id}`, updates);
export const deleteBugReportsAPI = (ids: string[]) => apiRequest('DELETE', '/api/bug-reports', { ids });
export const importBugReportsAPI = (reports: BugReport[], mode: 'merge' | 'replace') => apiRequest('POST', '/api/bug-reports/import', { reports, mode });
export const addModifierDefinitionAPI = (data: Omit<ModifierDefinition, 'id'>) => apiRequest('POST', '/api/setbacks', data);
export const updateModifierDefinitionAPI = (data: ModifierDefinition) => apiRequest('PUT', `/api/setbacks/${data.id}`, data);
export const applyModifierAPI = (userIds: string[], modifierId: string, reason: string, appliedById: string, overrides?: Partial<ModifierDefinition> & { allowSubstitution?: boolean }) => apiRequest('POST', '/api/applied-modifiers/apply', { userIds, modifierDefinitionId: modifierId, reason, appliedById, overrides });
export const deleteAppliedModifiersAPI = (ids: string[]) => apiRequest('DELETE', '/api/applied-modifiers', { ids });
export const cloneUserAPI = (userId: string) => apiRequest('POST', `/api/users/clone/${userId}`);
export const sendMessageAPI = (data: { senderId: string; recipientId?: string; guildId?: string; message: string; isAnnouncement?: boolean; }) => apiRequest('POST', '/api/chat/send', data);
export const markMessagesAsReadAPI = (payload: { userId: string; partnerId?: string; guildId?: string }) => apiRequest('POST', '/api/chat/read', payload);
export const suggestHolidaysAPI = () => apiRequest('POST', '/api/ai/suggest-holidays');