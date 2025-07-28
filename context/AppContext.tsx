

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppSettings, User, Quest, RewardTypeDefinition, QuestCompletion, RewardItem, Market, PurchaseRequest, Guild, Rank, Trophy, UserTrophy, Notification, AppMode, Page, IAppData, ShareableAssetType, GameAsset, Role, QuestCompletionStatus, RewardCategory, PurchaseRequestStatus, AdminAdjustment, AdminAdjustmentType, SystemLog, QuestType, QuestAvailability, Blueprint, ImportResolution, TrophyRequirementType, ThemeDefinition, ChatMessage, SystemNotification, SystemNotificationType, MarketStatus, QuestGroup, BulkQuestUpdates, ScheduledEvent } from '../types';
import { INITIAL_SETTINGS, createMockUsers, INITIAL_REWARD_TYPES, INITIAL_RANKS, INITIAL_TROPHIES, createSampleMarkets, createSampleQuests, createInitialGuilds, createSampleGameAssets, INITIAL_THEMES, createInitialQuestCompletions, INITIAL_TAGS, INITIAL_QUEST_GROUPS } from '../data/initialData';

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
  completeQuest: (questId: string, userId: string, rewards: RewardItem[], requiresApproval: boolean, guildId?: string, options?: { note?: string; completionDate?: Date }) => Promise<void>;
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
  purchaseMarketItem: (assetId: string, marketId: string, user: User, costGroupIndex: number) => Promise<void>;
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
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  
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
  retryDataLoad: () => void;
  
  // First Run
  completeFirstRun: (adminUserData: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>, setupChoice: 'guided' | 'scratch' | 'import', blueprint: Blueprint | null) => Promise<void>;
  
  // Ranks
  setRanks: (ranks: Rank[]) => void;

  // Chat
  sendMessage: (message: Partial<ChatMessage>) => Promise<ChatMessage | undefined>;
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

const mergeSettings = (newSettings: Partial<AppSettings> | undefined | null, baseSettings: AppSettings): AppSettings => {
    if (!newSettings) return baseSettings;
    // This creates a new object with the base settings, then overwrites with new settings,
    // then deeply merges nested objects to prevent losing properties on partial updates.
    return {
        ...baseSettings,
        ...newSettings,
        questDefaults: { ...baseSettings.questDefaults, ...(newSettings.questDefaults || {}) },
        security: { ...baseSettings.security, ...(newSettings.security || {}) },
        sharedMode: { ...baseSettings.sharedMode, ...(newSettings.sharedMode || {}) },
        automatedBackups: { ...baseSettings.automatedBackups, ...(newSettings.automatedBackups || {}) },
        loginNotifications: { ...baseSettings.loginNotifications, ...(newSettings.loginNotifications || {}) },
        rewardValuation: { ...baseSettings.rewardValuation, ...(newSettings.rewardValuation || {}) },
        chat: { ...baseSettings.chat, ...(newSettings.chat || {}) },
        sidebars: { ...baseSettings.sidebars, ...(newSettings.sidebars || {}) },
    };
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>({
        users: [], quests: [], questGroups: [], markets: [], rewardTypes: [], questCompletions: [],
        purchaseRequests: [], guilds: [], ranks: [], trophies: [], userTrophies: [],
        adminAdjustments: [], gameAssets: [], systemLogs: [], settings: INITIAL_SETTINGS,
        themes: [], loginHistory: [], chatMessages: [], systemNotifications: [], scheduledEvents: [],
        isAppUnlocked: false, isFirstRun: true, currentUser: null,
        activePage: 'Dashboard', appMode: { mode: 'personal' }, notifications: [],
        isDataLoaded: false, activeMarketId: null, allTags: [],
        isSwitchingUser: false, isSharedViewActive: false, targetedUserForLogin: null,
        isAiConfigured: false, isSidebarCollapsed: false, syncStatus: 'idle', syncError: null, isChatOpen: false
    });

    const isMounted = useRef(true);
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeoutId = useRef<number | null>(null);
    const [retryCount, setRetryCount] = useState(0);

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

    const apiRequest = useCallback(async (endpoint: string, options: RequestInit = {}) => {
        try {
            const response = await fetch(endpoint, {
                headers: { 'Content-Type': 'application/json' },
                ...options,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'API request failed');
            }
             if (response.status === 204) return null;
            return response.json();
        } catch (error) {
            console.error(`API Error on ${endpoint}:`, error);
            if (error instanceof Error) {
                addNotification({ type: 'error', message: error.message });
            }
            throw error;
        }
    }, [addNotification]);
    
    const fullUpdate = useCallback((newData: Partial<IAppData>) => {
        if (!isMounted.current) return;
        setState(prev => {
            const currentUserId = prev.currentUser?.id;
            const updatedCurrentUser = currentUserId
                ? (newData.users || prev.users).find(u => u.id === currentUserId) || null
                : null;
            
            const dataState = {
                users: newData.users ?? prev.users,
                quests: newData.quests ?? prev.quests,
                questGroups: newData.questGroups ?? prev.questGroups,
                markets: newData.markets ?? prev.markets,
                rewardTypes: newData.rewardTypes ?? prev.rewardTypes,
                questCompletions: newData.questCompletions ?? prev.questCompletions,
                purchaseRequests: newData.purchaseRequests ?? prev.purchaseRequests,
                guilds: newData.guilds ?? prev.guilds,
                ranks: newData.ranks ?? prev.ranks,
                trophies: newData.trophies ?? prev.trophies,
                userTrophies: newData.userTrophies ?? prev.userTrophies,
                adminAdjustments: newData.adminAdjustments ?? prev.adminAdjustments,
                gameAssets: newData.gameAssets ?? prev.gameAssets,
                systemLogs: newData.systemLogs ?? prev.systemLogs,
                settings: mergeSettings(newData.settings, prev.settings),
                themes: newData.themes ?? prev.themes,
                loginHistory: newData.loginHistory ?? prev.loginHistory,
                chatMessages: newData.chatMessages ?? prev.chatMessages,
                systemNotifications: newData.systemNotifications ?? prev.systemNotifications,
                scheduledEvents: newData.scheduledEvents ?? prev.scheduledEvents,
            };

            return {
                ...prev,
                ...dataState,
                currentUser: updatedCurrentUser,
                isDataLoaded: true,
                syncStatus: 'success',
                syncError: null,
            };
        });
    }, []);

    const connectWebSocket = useCallback(() => {
        if (typeof window === 'undefined' || !window.location.host) {
            console.warn('WebSocket connection skipped: Not a browser environment or host is missing.');
            if (reconnectTimeoutId.current) clearTimeout(reconnectTimeoutId.current);
            reconnectTimeoutId.current = window.setTimeout(connectWebSocket, 1000);
            return;
        }

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}`;
        const socket = new WebSocket(wsUrl);
        ws.current = socket;

        let reconnectAttempts = 0;

        const reconnect = () => {
            if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) return;
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`WebSocket disconnected. Retrying in ${delay / 1000}s...`);
            setState(prev => ({ ...prev, syncStatus: 'syncing' }));
            if (reconnectTimeoutId.current) clearTimeout(reconnectTimeoutId.current);
            reconnectTimeoutId.current = window.setTimeout(connectWebSocket, delay);
        };

        socket.onopen = () => {
            console.log('WebSocket connected.');
            reconnectAttempts = 0;
            setState(prev => ({ ...prev, syncStatus: 'success', syncError: null }));
        };

        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'FULL_STATE_UPDATE') {
                    fullUpdate(message.payload);
                } else if (message.type === 'NEW_CHAT_MESSAGE') {
                    setState(prev => ({ ...prev, chatMessages: [...prev.chatMessages, message.payload] }));
                }
            } catch (e) { console.error('Error parsing WebSocket message:', e); }
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            setState(prev => ({ ...prev, syncStatus: 'error', syncError: 'WebSocket connection failed.' }));
            socket.close();
        };

        socket.onclose = () => {
            if (isMounted.current) reconnect();
        };
    }, [fullUpdate]);

    const loadInitialData = useCallback(async () => {
        if (!isMounted.current) return;
        setState(prev => ({ ...prev, isDataLoaded: false, syncStatus: 'syncing', syncError: null }));
        try {
            const data = await apiRequest('/api/data');
            
            // A null settings object is the definitive flag for a first run.
            const isFirstRun = !data.settings;
            
            const lastUserId = localStorage.getItem('lastUserId');
            const lastUser = isFirstRun ? null : (data.users || []).find((u: User) => u.id === lastUserId);
            
            const aiStatus = await apiRequest('/api/ai/status');

            if (isMounted.current) {
                setState(prev => {
                    const dataState = {
                        users: data.users || [],
                        quests: data.quests || [],
                        questGroups: data.questGroups || [],
                        markets: data.markets || [],
                        rewardTypes: data.rewardTypes || [],
                        questCompletions: data.questCompletions || [],
                        purchaseRequests: data.purchaseRequests || [],
                        guilds: data.guilds || [],
                        ranks: data.ranks || [],
                        trophies: data.trophies || [],
                        userTrophies: data.userTrophies || [],
                        adminAdjustments: data.adminAdjustments || [],
                        gameAssets: data.gameAssets || [],
                        systemLogs: data.systemLogs || [],
                        settings: mergeSettings(data.settings, INITIAL_SETTINGS),
                        themes: data.themes || [],
                        loginHistory: data.loginHistory || [],
                        chatMessages: data.chatMessages || [],
                        systemNotifications: data.systemNotifications || [],
                        scheduledEvents: data.scheduledEvents || [],
                    };
                    
                    return {
                        ...prev,
                        ...dataState,
                        isFirstRun,
                        isDataLoaded: true,
                        syncStatus: 'success',
                        syncError: null,
                        currentUser: lastUser || null,
                        isAppUnlocked: !!lastUser,
                        isAiConfigured: aiStatus.isConfigured,
                    };
                });
            }
        } catch (error) {
            console.error("Failed to load initial data:", error);
            if (isMounted.current) {
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
                setState(prev => ({ ...prev, isDataLoaded: false, syncStatus: 'error', syncError: `Failed to connect to server: ${errorMessage}` }));
            }
        }
    }, [apiRequest]);

    useEffect(() => {
        loadInitialData();
        connectWebSocket();

        return () => {
            if (ws.current) {
                ws.current.onclose = null;
                ws.current.close();
            }
            if (reconnectTimeoutId.current) {
                clearTimeout(reconnectTimeoutId.current);
            }
        };
    }, [connectWebSocket, loadInitialData, retryCount]);


    const dispatch: AppDispatch = useMemo(() => ({
        addUser: (userData: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>) => apiRequest('/api/users', { method: 'POST', body: JSON.stringify(userData) }),
        updateUser: (userId: string, updatedData: Partial<User>) => apiRequest(`/api/users/${userId}`, { method: 'PUT', body: JSON.stringify(updatedData) }),
        deleteUser: (userId: string) => apiRequest(`/api/users/${userId}`, { method: 'DELETE' }),
        setCurrentUser: (user: User | null) => { 
            setState(s => ({...s, currentUser: user}));
            if (user) localStorage.setItem('lastUserId', user.id);
            else localStorage.removeItem('lastUserId');
        },
        markUserAsOnboarded: (userId: string) => apiRequest(`/api/users/${userId}`, { method: 'PUT', body: JSON.stringify({ hasBeenOnboarded: true }) }),
        setAppUnlocked: (isUnlocked: boolean) => setState(s => ({ ...s, isAppUnlocked: isUnlocked })),
        setIsSwitchingUser: (isSwitching: boolean) => setState(s => ({ ...s, isSwitchingUser: isSwitching })),
        setTargetedUserForLogin: (user: User | null) => setState(s => ({ ...s, targetedUserForLogin: user })),
        exitToSharedView: () => {
             setState(s => ({...s, currentUser: null, isAppUnlocked: true, isSharedViewActive: true }));
             localStorage.removeItem('lastUserId');
        },
        setIsSharedViewActive: (isActive: boolean) => setState(s => ({ ...s, isSharedViewActive: isActive })),
        bypassFirstRunCheck: () => setState(s => ({...s, isFirstRun: false})),

        addQuest: (quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => apiRequest('/api/quests', { method: 'POST', body: JSON.stringify(quest) }),
        updateQuest: (updatedQuest: Quest) => apiRequest(`/api/quests/${updatedQuest.id}`, { method: 'PUT', body: JSON.stringify(updatedQuest) }),
        deleteQuest: (questId: string) => apiRequest(`/api/quests/${questId}`, { method: 'DELETE' }),
        cloneQuest: (questId: string) => apiRequest(`/api/quests/${questId}/clone`, { method: 'POST' }),
        dismissQuest: (questId: string, userId: string) => apiRequest(`/api/quests/${questId}/dismiss`, { method: 'POST', body: JSON.stringify({ userId }) }),
        claimQuest: (questId: string, userId: string) => apiRequest(`/api/quests/${questId}/claim`, { method: 'POST', body: JSON.stringify({ userId }) }),
        releaseQuest: (questId: string, userId: string) => apiRequest(`/api/quests/${questId}/release`, { method: 'POST', body: JSON.stringify({ userId }) }),
        markQuestAsTodo: (questId: string, userId: string) => apiRequest(`/api/quests/${questId}/actions`, { method: 'POST', body: JSON.stringify({ action: 'mark_todo', userId }) }),
        unmarkQuestAsTodo: (questId: string, userId: string) => apiRequest(`/api/quests/${questId}/actions`, { method: 'POST', body: JSON.stringify({ action: 'unmark_todo', userId }) }),
        completeQuest: (questId: string, userId: string, rewards: RewardItem[], requiresApproval: boolean, guildId?: string, options?: { note?: string; completionDate?: Date }) => apiRequest(`/api/quests/${questId}/complete`, { method: 'POST', body: JSON.stringify({ userId, note: options?.note, completionDate: options?.completionDate }) }),
        approveQuestCompletion: (completionId: string, note?: string) => apiRequest(`/api/approvals/quest/${completionId}/approve`, { method: 'POST', body: JSON.stringify({ note }) }),
        rejectQuestCompletion: (completionId: string, note?: string) => apiRequest(`/api/approvals/quest/${completionId}/reject`, { method: 'POST', body: JSON.stringify({ note }) }),
        
        addQuestGroup: (group: Omit<QuestGroup, 'id'>) => apiRequest('/api/questGroups', { method: 'POST', body: JSON.stringify(group) }),
        updateQuestGroup: (group: QuestGroup) => apiRequest(`/api/questGroups/${group.id}`, { method: 'PUT', body: JSON.stringify(group) }),
        deleteQuestGroup: (groupId: string) => apiRequest(`/api/questGroups/${groupId}`, { method: 'DELETE' }),
        assignQuestGroupToUsers: (groupId: string, userIds: string[]) => apiRequest(`/api/questGroups/${groupId}/assign`, { method: 'POST', body: JSON.stringify({ userIds }) }),
        
        addRewardType: (rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => apiRequest('/api/rewardTypes', { method: 'POST', body: JSON.stringify(rewardType) }),
        updateRewardType: (rewardType: RewardTypeDefinition) => apiRequest(`/api/rewardTypes/${rewardType.id}`, { method: 'PUT', body: JSON.stringify(rewardType) }),
        deleteRewardType: (rewardTypeId: string) => apiRequest(`/api/rewardTypes/${rewardTypeId}`, { method: 'DELETE' }),
        cloneRewardType: (rewardTypeId: string) => apiRequest(`/api/rewardTypes/${rewardTypeId}/clone`, { method: 'POST' }),

        addMarket: (market: Omit<Market, 'id'>) => apiRequest('/api/markets', { method: 'POST', body: JSON.stringify(market) }),
        updateMarket: (market: Market) => apiRequest(`/api/markets/${market.id}`, { method: 'PUT', body: JSON.stringify(market) }),
        deleteMarket: (marketId: string) => apiRequest(`/api/markets/${marketId}`, { method: 'DELETE' }),
        cloneMarket: (marketId: string) => apiRequest(`/api/markets/${marketId}/clone`, { method: 'POST' }),
        deleteMarkets: (marketIds: string[]) => apiRequest('/api/markets/bulk-delete', { method: 'POST', body: JSON.stringify({ marketIds }) }),
        updateMarketsStatus: (marketIds: string[], status: 'open' | 'closed') => apiRequest('/api/markets/bulk-status', { method: 'POST', body: JSON.stringify({ marketIds, status }) }),
        
        purchaseMarketItem: (assetId: string, marketId: string, user: User, costGroupIndex: number) => apiRequest('/api/market/purchase', { method: 'POST', body: JSON.stringify({ assetId, marketId, userId: user.id, costGroupIndex }) }),
        approvePurchaseRequest: (purchaseId: string) => apiRequest(`/api/approvals/purchase/${purchaseId}/approve`, { method: 'POST' }),
        rejectPurchaseRequest: (purchaseId: string) => apiRequest(`/api/approvals/purchase/${purchaseId}/reject`, { method: 'POST' }),
        cancelPurchaseRequest: (purchaseId: string) => apiRequest(`/api/approvals/purchase/${purchaseId}/cancel`, { method: 'POST' }),
        
        addGuild: (guild: Omit<Guild, 'id'>) => apiRequest('/api/guilds', { method: 'POST', body: JSON.stringify(guild) }),
        updateGuild: (guild: Guild) => apiRequest(`/api/guilds/${guild.id}`, { method: 'PUT', body: JSON.stringify(guild) }),
        deleteGuild: (guildId: string) => apiRequest(`/api/guilds/${guildId}`, { method: 'DELETE' }),

        addTrophy: (trophy: Omit<Trophy, 'id'>) => apiRequest('/api/trophies', { method: 'POST', body: JSON.stringify(trophy) }),
        updateTrophy: (trophy: Trophy) => apiRequest(`/api/trophies/${trophy.id}`, { method: 'PUT', body: JSON.stringify(trophy) }),
        deleteTrophy: (trophyId: string) => apiRequest(`/api/trophies/${trophyId}`, { method: 'DELETE' }),
        cloneTrophy: (trophyId: string) => apiRequest(`/api/trophies/${trophyId}/clone`, { method: 'POST' }),
        deleteTrophies: (trophyIds: string[]) => apiRequest('/api/trophies/bulk-delete', { method: 'POST', body: JSON.stringify({ trophyIds }) }),
        awardTrophy: (userId: string, trophyId: string, guildId?: string) => apiRequest('/api/trophies/award', { method: 'POST', body: JSON.stringify({ userId, trophyId, guildId }) }),
        
        applyManualAdjustment: async (adjustment: Omit<AdminAdjustment, 'id' | 'adjustedAt'>) => {
            await apiRequest('/api/admin/adjustment', { method: 'POST', body: JSON.stringify(adjustment) });
            return true;
        },
        
        addGameAsset: (asset: Omit<GameAsset, 'id' | 'creatorId' | 'createdAt' | 'purchaseCount'>) => apiRequest('/api/gameAssets', { method: 'POST', body: JSON.stringify(asset) }),
        updateGameAsset: (asset: GameAsset) => apiRequest(`/api/gameAssets/${asset.id}`, { method: 'PUT', body: JSON.stringify(asset) }),
        deleteGameAsset: (assetId: string) => apiRequest(`/api/gameAssets/${assetId}`, { method: 'DELETE' }),
        deleteGameAssets: (assetIds: string[]) => apiRequest('/api/gameAssets/bulk-delete', { method: 'POST', body: JSON.stringify({ assetIds }) }),
        cloneGameAsset: (assetId: string) => apiRequest(`/api/gameAssets/${assetId}/clone`, { method: 'POST' }),
        
        addTheme: (theme: Omit<ThemeDefinition, 'id'>) => apiRequest('/api/themes', { method: 'POST', body: JSON.stringify(theme) }),
        updateTheme: (theme: ThemeDefinition) => apiRequest(`/api/themes/${theme.id}`, { method: 'PUT', body: JSON.stringify(theme) }),
        deleteTheme: (themeId: string) => apiRequest(`/api/themes/${themeId}`, { method: 'DELETE' }),

        updateSettings: (newSettings: Partial<AppSettings>) => apiRequest('/api/settings', { method: 'PUT', body: JSON.stringify(newSettings) }),
        resetSettings: () => apiRequest('/api/settings/reset', { method: 'POST' }),
        
        setActivePage: (page: Page) => setState(s => ({ ...s, activePage: page })),
        setAppMode: (mode: AppMode) => setState(s => ({ ...s, appMode: mode })),
        addNotification,
        removeNotification,
        setActiveMarketId: (marketId: string | null) => setState(s => ({ ...s, activeMarketId: marketId })),
        toggleSidebar: () => setState(s => ({...s, isSidebarCollapsed: !s.isSidebarCollapsed})),
        toggleChat: () => setState(s => ({...s, isChatOpen: !s.isChatOpen})),

        importBlueprint: (blueprint: Blueprint, resolutions: ImportResolution[]) => apiRequest('/api/import/blueprint', { method: 'POST', body: JSON.stringify({ blueprint, resolutions }) }),
        restoreFromBackup: (backupData: any) => apiRequest('/api/import/backup', { method: 'POST', body: JSON.stringify(backupData) }),
        restoreDefaultObjects: (objectType: 'trophies') => apiRequest('/api/data/restore-defaults', { method: 'POST', body: JSON.stringify({ objectType }) }),
        clearAllHistory: () => apiRequest('/api/data/clear-history', { method: 'POST' }),
        resetAllPlayerData: () => apiRequest('/api/data/reset-players', { method: 'POST' }),
        deleteAllCustomContent: () => apiRequest('/api/data/delete-custom', { method: 'POST' }),
        retryDataLoad: () => setRetryCount(c => c + 1),

        completeFirstRun: async (adminUserData: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>, setupChoice: 'guided' | 'scratch' | 'import', blueprint: Blueprint | null) => {
            const result = await apiRequest('/api/first-run', { method: 'POST', body: JSON.stringify({ adminUserData, setupChoice, blueprint }) });
            if (result && result.user) {
                localStorage.setItem('lastUserId', result.user.id);
                window.location.reload();
            } else {
                addNotification({ type: 'error', message: 'First run setup failed on the server.' });
            }
        },
        
        setRanks: (ranks: Rank[]) => apiRequest('/api/ranks', { method: 'PUT', body: JSON.stringify({ ranks }) }),

        sendMessage: (message: Partial<ChatMessage>) => apiRequest('/api/chat/messages', { method: 'POST', body: JSON.stringify({ ...message, senderId: state.currentUser?.id }) }),
        markMessagesAsRead: (options: { partnerId?: string; guildId?: string }) => apiRequest('/api/chat/read', { method: 'POST', body: JSON.stringify({ ...options, userId: state.currentUser?.id }) }),

        addSystemNotification: (notification: Omit<SystemNotification, 'id' | 'timestamp' | 'readByUserIds'>) => apiRequest('/api/systemNotifications', { method: 'POST', body: JSON.stringify(notification) }),
        markSystemNotificationsAsRead: (notificationIds: string[]) => apiRequest('/api/systemNotifications/read', { method: 'POST', body: JSON.stringify({ notificationIds, userId: state.currentUser?.id }) }),

        addScheduledEvent: (event: Omit<ScheduledEvent, 'id'>) => apiRequest('/api/scheduledEvents', { method: 'POST', body: JSON.stringify(event) }),
        updateScheduledEvent: (event: ScheduledEvent) => apiRequest(`/api/scheduledEvents/${event.id}`, { method: 'PUT', body: JSON.stringify(event) }),
        deleteScheduledEvent: (eventId: string) => apiRequest(`/api/scheduledEvents/${eventId}`, { method: 'DELETE' }),
        
        deleteQuests: (questIds: string[]) => apiRequest('/api/quests/bulk-delete', { method: 'POST', body: JSON.stringify({ questIds }) }),
        updateQuestsStatus: (questIds: string[], isActive: boolean) => apiRequest('/api/quests/bulk-status', { method: 'POST', body: JSON.stringify({ questIds, isActive }) }),
        bulkUpdateQuests: (questIds: string[], updates: BulkQuestUpdates) => apiRequest('/api/quests/bulk-update', { method: 'POST', body: JSON.stringify({ questIds, updates }) }),

        uploadFile: async (file: File, category?: string) => {
            const formData = new FormData();
            formData.append('file', file);
            if(category) formData.append('category', category);
            // apiRequest is not used here because of FormData content type
            const response = await fetch('/api/media/upload', { method: 'POST', body: formData });
            if (!response.ok) {
                 const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }
            return response.json();
        },
        executeExchange: (userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => apiRequest('/api/economy/exchange', { method: 'POST', body: JSON.stringify({ userId, payItem, receiveItem, guildId }) }),
    } as AppDispatch), [state, addNotification, removeNotification, apiRequest, loadInitialData]);

    return (
        <AppStateContext.Provider value={state}>
            <AppDispatchContext.Provider value={dispatch}>
                {children}
            </AppDispatchContext.Provider>
        </AppStateContext.Provider>
    );
};