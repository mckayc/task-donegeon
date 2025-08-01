import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { AppSettings, User, Quest, RewardTypeDefinition, QuestCompletion, RewardItem, Market, PurchaseRequest, Guild, Rank, Trophy, UserTrophy, Notification, AppMode, Page, IAppData, ShareableAssetType, GameAsset, Role, QuestCompletionStatus, RewardCategory, PurchaseRequestStatus, AdminAdjustment, AdminAdjustmentType, SystemLog, QuestType, QuestAvailability, Blueprint, ImportResolution, TrophyRequirementType, ThemeDefinition, ChatMessage, SystemNotification, SystemNotificationType, MarketStatus, QuestGroup, BulkQuestUpdates, ScheduledEvent } from '../types';
import { INITIAL_SETTINGS } from '../data/initialData';

// The single, unified state for the entire application
interface AppState extends IAppData {
  isAppUnlocked: boolean;
  isFirstRun: boolean;
  currentUser: User | null;
  activePage: Page;
  appMode: AppMode;
  notifications: Notification[];
  isDataLoaded: boolean;
  activeMarketId: string | null;
  allTags: string[];
  isSwitchingUser: boolean;
  isSharedViewActive: boolean;
  targetedUserForLogin: User | null;
  isAiConfigured: boolean;
  isSidebarCollapsed: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncError: string | null;
  isChatOpen: boolean;
  isRestarting: boolean;
}

// The single, unified dispatch for the entire application
interface AppDispatch {
  // Auth
  addUser: (user: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>) => Promise<User | undefined>;
  updateUser: (userId: string, updatedData: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  markUserAsOnboarded: (userId: string) => Promise<void>;
  setAppUnlocked: (isUnlocked: boolean) => void;
  setIsSwitchingUser: (isSwitching: boolean) => void;
  setTargetedUserForLogin: (user: User | null) => void;
  exitToSharedView: () => void;
  setIsSharedViewActive: (isActive: boolean) => void;
  bypassFirstRunCheck: () => void;
  reinitializeApp: () => Promise<void>;

  // Game Data
  addQuest: (quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => Promise<Quest | undefined>;
  updateQuest: (updatedQuest: Quest) => Promise<void>;
  deleteQuest: (questId: string) => Promise<void>;
  cloneQuest: (questId: string) => Promise<void>;
  dismissQuest: (questId: string, userId: string) => Promise<void>;
  claimQuest: (questId: string, userId: string) => Promise<void>;
  releaseQuest: (questId: string, userId: string) => Promise<void>;
  markQuestAsTodo: (questId: string, userId: string) => Promise<void>;
  unmarkQuestAsTodo: (questId: string, userId: string) => Promise<void>;
  completeQuest: (questId: string, userId: string, requiresApproval: boolean, guildId?: string, options?: { note?: string; completionDate?: Date }) => Promise<void>;
  approveQuestCompletion: (completionId: string, note?: string) => Promise<void>;
  rejectQuestCompletion: (completionId: string, note?: string) => Promise<void>;
  addQuestGroup: (group: Omit<QuestGroup, 'id'>) => Promise<QuestGroup | undefined>;
  updateQuestGroup: (group: QuestGroup) => Promise<void>;
  deleteQuestGroup: (groupId: string) => Promise<void>;
  assignQuestGroupToUsers: (groupId: string, userIds: string[]) => Promise<void>;
  addRewardType: (rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => Promise<RewardTypeDefinition | undefined>;
  updateRewardType: (rewardType: RewardTypeDefinition) => Promise<void>;
  deleteRewardType: (rewardTypeId: string) => Promise<void>;
  cloneRewardType: (rewardTypeId: string) => Promise<void>;
  addMarket: (market: Omit<Market, 'id'>) => Promise<Market | undefined>;
  updateMarket: (market: Market) => Promise<void>;
  deleteMarket: (marketId: string) => Promise<void>;
  cloneMarket: (marketId: string) => Promise<void>;
  deleteMarkets: (marketIds: string[]) => Promise<void>;
  updateMarketsStatus: (marketIds: string[], status: 'open' | 'closed') => Promise<void>;
  purchaseMarketItem: (assetId: string, marketId: string, userId: string, costGroupIndex: number, guildId?: string) => Promise<void>;
  approvePurchaseRequest: (purchaseId: string) => Promise<void>;
  rejectPurchaseRequest: (purchaseId: string) => Promise<void>;
  cancelPurchaseRequest: (purchaseId: string) => Promise<void>;
  addGuild: (guild: Omit<Guild, 'id'>) => Promise<Guild | undefined>;
  updateGuild: (guild: Guild) => Promise<void>;
  deleteGuild: (guildId: string) => Promise<void>;
  addTrophy: (trophy: Omit<Trophy, 'id'>) => Promise<Trophy | undefined>;
  updateTrophy: (trophy: Trophy) => Promise<void>;
  deleteTrophy: (trophyId: string) => Promise<void>;
  cloneTrophy: (trophyId: string) => Promise<void>;
  deleteTrophies: (trophyIds: string[]) => Promise<void>;
  awardTrophy: (userId: string, trophyId: string, guildId?: string) => Promise<void>;
  applyManualAdjustment: (adjustment: Omit<AdminAdjustment, 'id' | 'adjustedAt'>) => Promise<boolean>;
  addGameAsset: (asset: Omit<GameAsset, 'id' | 'creatorId' | 'createdAt' | 'purchaseCount'>) => Promise<GameAsset | undefined>;
  updateGameAsset: (asset: GameAsset) => Promise<void>;
  deleteGameAsset: (assetId: string) => Promise<void>;
  deleteGameAssets: (assetIds: string[]) => Promise<void>;
  cloneGameAsset: (assetId: string) => Promise<void>;
  
  // Themes
  addTheme: (theme: Omit<ThemeDefinition, 'id'>) => Promise<ThemeDefinition | undefined>;
  updateTheme: (theme: ThemeDefinition) => Promise<void>;
  deleteTheme: (themeId: string) => Promise<void>;

  // Settings
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  
  // UI
  setActivePage: (page: Page) => void;
  setAppMode: (mode: AppMode) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (notificationId: string) => void;
  setActiveMarketId: (marketId: string | null) => void;
  toggleSidebar: () => void;
  toggleChat: () => void;

  // Data Management
  importBlueprint: (blueprint: Blueprint, resolutions: ImportResolution[]) => Promise<void>;
  restoreFromBackup: (backupData: any) => Promise<void>;
  restoreDefaultObjects: (objectType: 'trophies') => Promise<void>;
  clearAllHistory: () => Promise<void>;
  resetAllPlayerData: () => Promise<void>;
  deleteAllCustomContent: () => Promise<void>;
  
  // First Run
  completeFirstRun: (adminUserData: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>, setupChoice: 'guided' | 'scratch' | 'import', blueprint: Blueprint | null) => Promise<{ message: string; adminUser: User; } | undefined>;
  
  // Ranks
  setRanks: (ranks: Rank[]) => Promise<void>;

  // Chat
  sendMessage: (message: Pick<ChatMessage, "message"> & Partial<Omit<ChatMessage, "message">>) => Promise<ChatMessage | undefined>;
  markMessagesAsRead: (options: { partnerId?: string; guildId?: string }) => Promise<void>;

  // System Notifications
  addSystemNotification: (notification: Omit<SystemNotification, 'id' | 'timestamp' | 'readByUserIds'>) => Promise<SystemNotification | undefined>;
  markSystemNotificationsAsRead: (notificationIds: string[]) => Promise<void>;

  // Scheduled Events
  addScheduledEvent: (event: Omit<ScheduledEvent, 'id'>) => Promise<ScheduledEvent | undefined>;
  updateScheduledEvent: (event: ScheduledEvent) => Promise<void>;
  deleteScheduledEvent: (eventId: string) => Promise<void>;
  
  // Bulk Actions
  deleteQuests: (questIds: string[]) => Promise<void>;
  updateQuestsStatus: (questIds: string[], isActive: boolean) => Promise<void>;
  bulkUpdateQuests: (questIds: string[], updates: BulkQuestUpdates) => Promise<void>;

  // Assets
  uploadFile: (file: File, category?: string) => Promise<{ url: string } | null>;
  executeExchange: (userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => Promise<void>;

}

// This is where the magic happens. We'll implement the provider and hooks here.
const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<AppDispatch | undefined>(undefined);

export const useAppState = (): AppState => {
    const context = useContext(AppStateContext);
    if (context === undefined) {
        throw new Error('useAppState must be used within an AppProvider');
    }
    return context;
};

export const useAppDispatch = (): AppDispatch => {
    const context = useContext(AppDispatchContext);
    if (context === undefined) {
        throw new Error('useAppDispatch must be used within an AppProvider');
    }
    return context;
};

// Placeholder for now. Actual implementation would involve API calls.
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>({
        // Default empty state
        users: [], quests: [], questGroups: [], markets: [], rewardTypes: [], questCompletions: [],
        purchaseRequests: [], guilds: [], ranks: [], trophies: [], userTrophies: [],
        adminAdjustments: [], gameAssets: [], systemLogs: [], settings: INITIAL_SETTINGS,
        themes: [], loginHistory: [], chatMessages: [], systemNotifications: [], scheduledEvents: [],
        isAppUnlocked: false, isFirstRun: true, currentUser: null,
        activePage: 'Dashboard', appMode: { mode: 'personal' }, notifications: [],
        isDataLoaded: false, activeMarketId: null, allTags: [],
        isSwitchingUser: false, isSharedViewActive: false, targetedUserForLogin: null,
        isAiConfigured: false, isSidebarCollapsed: false, syncStatus: 'idle', syncError: null, isChatOpen: false,
        isRestarting: false,
    });

    const isMounted = useRef(true);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
      isMounted.current = true;
      return () => { isMounted.current = false; }
    }, []);

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const id = `notif-${Date.now()}`;
        setState(s => ({ ...s, notifications: [...s.notifications, { ...notification, id }] }));
        setTimeout(() => removeNotification(id), 5000);
    }, []);

    const removeNotification = useCallback((notificationId: string) => {
        setState(s => ({ ...s, notifications: s.notifications.filter(n => n.id !== notificationId) }));
    }, []);

    // Generic API handler
    const apiRequest = useCallback(async (endpoint: string, options: RequestInit = {}) => {
        setState(s => ({...s, syncStatus: 'syncing'}));
        try {
            const response = await fetch(endpoint, {
                headers: { 'Content-Type': 'application/json' },
                ...options,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'API request failed');
            }
            if (isMounted.current) {
                setState(s => ({...s, syncStatus: 'success', syncError: null}));
            }
             if (response.status === 204) return null; // Handle No Content response
            return response.json();
        } catch (error) {
            console.error(`API Error on ${endpoint}:`, error);
            if (isMounted.current) {
                if (error instanceof Error) {
                    addNotification({ type: 'error', message: error.message });
                    setState(s => ({...s, syncStatus: 'error', syncError: error.message}));
                }
            }
            throw error;
        }
    }, [addNotification]);
    
    const fullUpdate = useCallback((newData: IAppData) => {
        if (!isMounted.current) return;
        setState(prev => {
            if (!newData || !newData.users || !newData.settings) {
                console.error("Received incomplete or malformed data. Update skipped.", newData);
                return prev;
            }
            
            const currentUserId = prev.currentUser?.id;
            const updatedCurrentUser = currentUserId ? (newData.users || prev.users).find(u => u.id === currentUserId) || null : null;
            const isFirstRunNow = !newData.users || newData.users.length === 0;

            const dataState: IAppData = {
                users: newData.users, quests: newData.quests, questGroups: newData.questGroups,
                markets: newData.markets, rewardTypes: newData.rewardTypes,
                questCompletions: newData.questCompletions, purchaseRequests: newData.purchaseRequests,
                guilds: newData.guilds, ranks: newData.ranks, trophies: newData.trophies,
                userTrophies: newData.userTrophies, adminAdjustments: newData.adminAdjustments,
                gameAssets: newData.gameAssets, systemLogs: newData.systemLogs,
                settings: newData.settings, themes: newData.themes, loginHistory: newData.loginHistory,
                chatMessages: newData.chatMessages, systemNotifications: newData.systemNotifications,
                scheduledEvents: newData.scheduledEvents,
            };

            return {
                ...prev, ...dataState, currentUser: updatedCurrentUser, isDataLoaded: true,
                isFirstRun: isFirstRunNow, syncStatus: 'success', syncError: null,
            };
        });
    }, []);

    const connectSocketIO = useCallback(() => {
        if (socketRef.current) return;
        
        const socket = io();
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Socket.IO connected.');
            if (isMounted.current) setState(prev => ({ ...prev, syncStatus: 'success', syncError: null }));
        });

        socket.on('full-state-update', (data) => fullUpdate(data));
        
        socket.on('new-chat-message', (newMessage: ChatMessage) => {
            if (isMounted.current) {
                setState(prev => ({ ...prev, chatMessages: [...prev.chatMessages, newMessage] }));
            }
        });

        socket.on('disconnect', () => {
            console.log('Socket.IO disconnected.');
            if (isMounted.current) setState(prev => ({ ...prev, syncStatus: 'syncing' }));
        });

        socket.on('connect_error', (err) => {
            console.error('Socket.IO connection error:', err);
             if (isMounted.current) setState(prev => ({ ...prev, syncStatus: 'error', syncError: 'Socket connection failed.' }));
        });

    }, [fullUpdate]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await apiRequest('/api/data');
                if (!data || !data.settings) {
                    throw new Error("Received malformed data from server. The database might be corrupted.");
                }

                const isFirstRun = !data.users || data.users.length === 0;
                const sharedViewActive = localStorage.getItem('sharedViewActive') === 'true' && data.settings.sharedMode.enabled;
                const lastUserId = localStorage.getItem('lastUserId');
                const lastUser = isFirstRun ? null : data.users.find((u: User) => u.id === lastUserId);
                
                if (isMounted.current) {
                  setState(prev => ({
                      ...prev, ...data, isFirstRun, isDataLoaded: true,
                      currentUser: lastUser || null, 
                      isAppUnlocked: !!lastUser || sharedViewActive,
                      isSharedViewActive: sharedViewActive,
                  }));
                }

                try {
                    const aiStatus = await apiRequest('/api/ai/status');
                    if (isMounted.current) setState(prev => ({ ...prev, isAiConfigured: aiStatus.isConfigured }));
                } catch (aiError) {
                    console.error("Failed to fetch AI status.", aiError);
                    if (isMounted.current) setState(prev => ({ ...prev, isAiConfigured: false }));
                }
            } catch (error) {
                console.error("Failed to load initial data:", error);
                 if (isMounted.current) {
                  setState(prev => ({ ...prev, isDataLoaded: true, syncStatus: 'error', syncError: error instanceof Error ? error.message : 'Failed to connect to server.' }));
                 }
            }
        };

        loadData();
        connectSocketIO();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [connectSocketIO, apiRequest]);


    const dispatch: AppDispatch = useMemo(() => ({
        // Auth
        addUser: (userData) => apiRequest('/api/users', { method: 'POST', body: JSON.stringify(userData) }),
        updateUser: (userId, updatedData) => apiRequest(`/api/users/${userId}`, { method: 'PUT', body: JSON.stringify(updatedData) }),
        deleteUser: (userId) => apiRequest(`/api/users/${userId}`, { method: 'DELETE' }),
        setCurrentUser: (user: User | null) => { 
            setState(s => ({...s, currentUser: user, isSharedViewActive: false}));
            if (user) {
                localStorage.setItem('lastUserId', user.id);
                localStorage.removeItem('sharedViewActive');
            } else {
                localStorage.removeItem('lastUserId');
            }
        },
        markUserAsOnboarded: (userId: string) => dispatch.updateUser(userId, { hasBeenOnboarded: true }),
        setAppUnlocked: (isUnlocked: boolean) => setState(s => ({ ...s, isAppUnlocked: isUnlocked })),
        setIsSwitchingUser: (isSwitching: boolean) => setState(s => ({ ...s, isSwitchingUser: isSwitching })),
        setTargetedUserForLogin: (user: User | null) => setState(s => ({ ...s, targetedUserForLogin: user })),
        exitToSharedView: () => {
             setState(s => ({...s, currentUser: null, isAppUnlocked: true, isSharedViewActive: true }));
             localStorage.removeItem('lastUserId');
             localStorage.setItem('sharedViewActive', 'true');
        },
        setIsSharedViewActive: (isActive: boolean) => setState(s => ({ ...s, isSharedViewActive: isActive })),
        bypassFirstRunCheck: () => setState(s => ({...s, isFirstRun: false})),
        reinitializeApp: async () => {
            try {
                await apiRequest('/api/actions/reinitialize', { method: 'POST' });
                setState(s => ({ ...s, isRestarting: true }));
                setTimeout(() => window.location.reload(), 7000);
            } catch (error) {
                if (error instanceof Error) addNotification({ type: 'error', message: `Failed to re-initialize: ${error.message}` });
            }
        },

        // Game Data
        addQuest: (quest) => apiRequest('/api/quests', { method: 'POST', body: JSON.stringify(quest) }),
        updateQuest: (updatedQuest) => apiRequest(`/api/quests/${updatedQuest.id}`, { method: 'PUT', body: JSON.stringify(updatedQuest) }),
        deleteQuest: (questId) => apiRequest(`/api/quests/${questId}`, { method: 'DELETE' }),
        cloneQuest: (questId) => apiRequest(`/api/quests/${questId}/clone`, { method: 'POST' }),
        dismissQuest: (questId, userId) => apiRequest(`/api/quests/${questId}/dismiss`, { method: 'POST', body: JSON.stringify({ userId }) }),
        claimQuest: (questId, userId) => apiRequest(`/api/quests/${questId}/claim`, { method: 'POST', body: JSON.stringify({ userId }) }),
        releaseQuest: (questId, userId) => apiRequest(`/api/quests/${questId}/release`, { method: 'POST', body: JSON.stringify({ userId }) }),
        markQuestAsTodo: (questId, userId) => apiRequest(`/api/quests/${questId}/todo`, { method: 'POST', body: JSON.stringify({ userId }) }),
        unmarkQuestAsTodo: (questId, userId) => apiRequest(`/api/quests/${questId}/todo`, { method: 'DELETE', body: JSON.stringify({ userId }) }),
        completeQuest: (questId, userId, requiresApproval, guildId, options) => apiRequest(`/api/quests/${questId}/complete`, { method: 'POST', body: JSON.stringify({ userId, requiresApproval, guildId, options }) }),
        approveQuestCompletion: (completionId, note) => apiRequest(`/api/completions/${completionId}/approve`, { method: 'POST', body: JSON.stringify({ note }) }),
        rejectQuestCompletion: (completionId, note) => apiRequest(`/api/completions/${completionId}/reject`, { method: 'POST', body: JSON.stringify({ note }) }),
        addQuestGroup: (group) => apiRequest('/api/quest-groups', { method: 'POST', body: JSON.stringify(group) }),
        updateQuestGroup: (group) => apiRequest(`/api/quest-groups/${group.id}`, { method: 'PUT', body: JSON.stringify(group) }),
        deleteQuestGroup: (groupId) => apiRequest(`/api/quest-groups/${groupId}`, { method: 'DELETE' }),
        assignQuestGroupToUsers: (groupId, userIds) => apiRequest(`/api/quest-groups/${groupId}/assign`, { method: 'POST', body: JSON.stringify({ userIds }) }),
        addRewardType: (rewardType) => apiRequest('/api/reward-types', { method: 'POST', body: JSON.stringify(rewardType) }),
        updateRewardType: (rewardType) => apiRequest(`/api/reward-types/${rewardType.id}`, { method: 'PUT', body: JSON.stringify(rewardType) }),
        deleteRewardType: (rewardTypeId) => apiRequest(`/api/reward-types/${rewardTypeId}`, { method: 'DELETE' }),
        cloneRewardType: (rewardTypeId) => apiRequest(`/api/reward-types/${rewardTypeId}/clone`, { method: 'POST' }),
        addMarket: (market) => apiRequest('/api/markets', { method: 'POST', body: JSON.stringify(market) }),
        updateMarket: (market) => apiRequest(`/api/markets/${market.id}`, { method: 'PUT', body: JSON.stringify(market) }),
        deleteMarket: (marketId) => apiRequest(`/api/markets/${marketId}`, { method: 'DELETE' }),
        cloneMarket: (marketId) => apiRequest(`/api/markets/${marketId}/clone`, { method: 'POST' }),
        deleteMarkets: (marketIds) => apiRequest('/api/markets/bulk-delete', { method: 'POST', body: JSON.stringify({ marketIds }) }),
        updateMarketsStatus: (marketIds, status) => apiRequest('/api/markets/bulk-status', { method: 'POST', body: JSON.stringify({ marketIds, status }) }),
        purchaseMarketItem: (assetId, marketId, userId, costGroupIndex, guildId) => apiRequest('/api/actions/purchase', { method: 'POST', body: JSON.stringify({ assetId, marketId, userId, costGroupIndex, guildId }) }),
        approvePurchaseRequest: (purchaseId) => apiRequest(`/api/purchases/${purchaseId}/approve`, { method: 'POST' }),
        rejectPurchaseRequest: (purchaseId) => apiRequest(`/api/purchases/${purchaseId}/reject`, { method: 'POST' }),
        cancelPurchaseRequest: (purchaseId) => apiRequest(`/api/purchases/${purchaseId}/cancel`, { method: 'POST' }),
        addGuild: (guild) => apiRequest('/api/guilds', { method: 'POST', body: JSON.stringify(guild) }),
        updateGuild: (guild) => apiRequest(`/api/guilds/${guild.id}`, { method: 'PUT', body: JSON.stringify(guild) }),
        deleteGuild: (guildId) => apiRequest(`/api/guilds/${guildId}`, { method: 'DELETE' }),
        addTrophy: (trophy) => apiRequest('/api/trophies', { method: 'POST', body: JSON.stringify(trophy) }),
        updateTrophy: (trophy) => apiRequest(`/api/trophies/${trophy.id}`, { method: 'PUT', body: JSON.stringify(trophy) }),
        deleteTrophy: (trophyId) => apiRequest(`/api/trophies/${trophyId}`, { method: 'DELETE' }),
        cloneTrophy: (trophyId) => apiRequest(`/api/trophies/${trophyId}/clone`, { method: 'POST' }),
        deleteTrophies: (trophyIds) => apiRequest('/api/trophies/bulk-delete', { method: 'POST', body: JSON.stringify({ trophyIds }) }),
        awardTrophy: (userId, trophyId, guildId) => apiRequest('/api/actions/award-trophy', { method: 'POST', body: JSON.stringify({ userId, trophyId, guildId }) }),
        applyManualAdjustment: (adjustment) => apiRequest('/api/actions/adjust', { method: 'POST', body: JSON.stringify(adjustment) }),
        addGameAsset: (asset) => apiRequest('/api/game-assets', { method: 'POST', body: JSON.stringify(asset) }),
        updateGameAsset: (asset) => apiRequest(`/api/game-assets/${asset.id}`, { method: 'PUT', body: JSON.stringify(asset) }),
        deleteGameAsset: (assetId) => apiRequest(`/api/game-assets/${assetId}`, { method: 'DELETE' }),
        deleteGameAssets: (assetIds) => apiRequest('/api/game-assets/bulk-delete', { method: 'POST', body: JSON.stringify({ assetIds }) }),
        cloneGameAsset: (assetId) => apiRequest(`/api/game-assets/${assetId}/clone`, { method: 'POST' }),
        
        // Themes
        addTheme: (theme) => apiRequest('/api/themes', { method: 'POST', body: JSON.stringify(theme) }),
        updateTheme: (theme) => apiRequest(`/api/themes/${theme.id}`, { method: 'PUT', body: JSON.stringify(theme) }),
        deleteTheme: (themeId) => apiRequest(`/api/themes/${themeId}`, { method: 'DELETE' }),

        // Settings
        updateSettings: (newSettings) => apiRequest('/api/settings', { method: 'PUT', body: JSON.stringify(newSettings) }),
        resetSettings: () => apiRequest('/api/settings/reset', { method: 'POST' }),
        
        // UI
        setActivePage: (page: Page) => setState(s => ({ ...s, activePage: page })),
        setAppMode: (mode: AppMode) => setState(s => ({ ...s, appMode: mode })),
        addNotification,
        removeNotification,
        setActiveMarketId: (marketId: string | null) => setState(s => ({ ...s, activeMarketId: marketId })),
        toggleSidebar: () => setState(s => ({...s, isSidebarCollapsed: !s.isSidebarCollapsed})),
        toggleChat: () => setState(s => ({...s, isChatOpen: !s.isChatOpen})),

        // Data Management
        importBlueprint: (blueprint, resolutions) => apiRequest('/api/data/import-blueprint', { method: 'POST', body: JSON.stringify({ blueprint, resolutions }) }),
        restoreFromBackup: (backupData) => apiRequest('/api/data/restore-backup', { method: 'POST', body: JSON.stringify(backupData) }),
        restoreDefaultObjects: (objectType) => apiRequest('/api/actions/restore-defaults', { method: 'POST', body: JSON.stringify({ objectType }) }),
        clearAllHistory: () => apiRequest('/api/actions/clear-history', { method: 'POST' }),
        resetAllPlayerData: () => apiRequest('/api/actions/reset-player-data', { method: 'POST' }),
        deleteAllCustomContent: () => apiRequest('/api/actions/factory-reset', { method: 'POST' }),
        
        // First Run
        completeFirstRun: (adminUserData, setupChoice, blueprint) => apiRequest('/api/first-run', { method: 'POST', body: JSON.stringify({ adminUserData, setupChoice, blueprint }) }),
        
        // Ranks
        setRanks: (ranks) => apiRequest('/api/ranks', { method: 'PUT', body: JSON.stringify({ ranks }) }),

        // Chat
        sendMessage: async (message) => {
            if (!socketRef.current || !state.currentUser) return;
            const newMessage: ChatMessage = {
                id: `msg-temp-${Date.now()}`,
                senderId: state.currentUser!.id,
                timestamp: new Date().toISOString(),
                readBy: [state.currentUser!.id],
                ...message,
            };
            socketRef.current.emit('chat:message:send', newMessage);
            return newMessage;
        },
        markMessagesAsRead: (options) => apiRequest('/api/chat/read', { method: 'POST', body: JSON.stringify(options) }),

        // System Notifications
        addSystemNotification: (notification) => apiRequest('/api/system-notifications', { method: 'POST', body: JSON.stringify(notification) }),
        markSystemNotificationsAsRead: (notificationIds) => apiRequest('/api/system-notifications/read', { method: 'POST', body: JSON.stringify({ notificationIds }) }),

        // Scheduled Events
        addScheduledEvent: (event) => apiRequest('/api/events', { method: 'POST', body: JSON.stringify(event) }),
        updateScheduledEvent: (event) => apiRequest(`/api/events/${event.id}`, { method: 'PUT', body: JSON.stringify(event) }),
        deleteScheduledEvent: (eventId) => apiRequest(`/api/events/${eventId}`, { method: 'DELETE' }),
        
        // Bulk Actions
        deleteQuests: (questIds) => apiRequest('/api/quests/bulk-delete', { method: 'POST', body: JSON.stringify({ questIds }) }),
        updateQuestsStatus: (questIds, isActive) => apiRequest('/api/quests/bulk-status', { method: 'POST', body: JSON.stringify({ questIds, isActive }) }),
        bulkUpdateQuests: (questIds, updates) => apiRequest('/api/quests/bulk-update', { method: 'POST', body: JSON.stringify({ questIds, updates }) }),

        // Assets
        uploadFile: async (file: File, category?: string) => {
            const formData = new FormData();
            formData.append('file', file);
            if (category) formData.append('category', category);
            try {
                const response = await fetch('/api/media/upload', { method: 'POST', body: formData });
                if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'File upload failed'); }
                if (response.status === 204) return null;
                return response.json();
            } catch (error) {
                console.error('File Upload Error:', error);
                if (error instanceof Error) addNotification({ type: 'error', message: error.message });
                return null;
            }
        },
        executeExchange: (userId, payItem, receiveItem, guildId) => apiRequest('/api/actions/exchange', { method: 'POST', body: JSON.stringify({ userId, payItem, receiveItem, guildId }) }),
    }), [state.currentUser, state.appMode, apiRequest, addNotification, removeNotification]);

    return (
        <AppStateContext.Provider value={state}>
            <AppDispatchContext.Provider value={dispatch}>
                {children}
            </AppDispatchContext.Provider>
        </AppStateContext.Provider>
    );
};