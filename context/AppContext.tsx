

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
  addQuest: (quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => Promise<void>;
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
  addRewardType: (rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => Promise<void>;
  updateRewardType: (rewardType: RewardTypeDefinition) => Promise<void>;
  deleteRewardType: (rewardTypeId: string) => Promise<void>;
  cloneRewardType: (rewardTypeId: string) => Promise<void>;
  addMarket: (market: Omit<Market, 'id'>) => Promise<void>;
  updateMarket: (market: Market) => Promise<void>;
  deleteMarket: (marketId: string) => Promise<void>;
  cloneMarket: (marketId: string) => Promise<void>;
  deleteMarkets: (marketIds: string[]) => Promise<void>;
  updateMarketsStatus: (marketIds: string[], statusType: 'open' | 'closed') => Promise<void>;
  purchaseMarketItem: (assetId: string, marketId: string, user: User, costGroupIndex: number) => Promise<void>;
  cancelPurchaseRequest: (purchaseId: string) => Promise<void>;
  approvePurchaseRequest: (purchaseId: string) => Promise<void>;
  rejectPurchaseRequest: (purchaseId: string) => Promise<void>;
  addGuild: (guild: Omit<Guild, 'id'>) => Promise<void>;
  updateGuild: (guild: Guild) => Promise<void>;
  deleteGuild: (guildId: string) => Promise<void>;
  setRanks: (ranks: Rank[]) => Promise<void>;
  addTrophy: (trophy: Omit<Trophy, 'id'>) => Promise<void>;
  updateTrophy: (trophy: Trophy) => Promise<void>;
  deleteTrophy: (trophyId: string) => Promise<void>;
  awardTrophy: (userId: string, trophyId: string, guildId?: string) => Promise<void>;
  applyManualAdjustment: (adjustment: Omit<AdminAdjustment, 'id' | 'adjustedAt'>) => Promise<boolean>;
  addGameAsset: (asset: Omit<GameAsset, 'id' | 'creatorId' | 'createdAt'>) => Promise<void>;
  updateGameAsset: (asset: GameAsset) => Promise<void>;
  deleteGameAsset: (assetId: string) => Promise<void>;
  cloneGameAsset: (assetId: string) => Promise<void>;
  addTheme: (theme: Omit<ThemeDefinition, 'id'>) => Promise<void>;
  updateTheme: (theme: ThemeDefinition) => Promise<void>;
  deleteTheme: (themeId: string) => Promise<void>;
  addScheduledEvent: (event: Omit<ScheduledEvent, 'id'>) => Promise<void>;
  updateScheduledEvent: (event: ScheduledEvent) => Promise<void>;
  deleteScheduledEvent: (eventId: string) => Promise<void>;
  completeFirstRun: (adminUserData: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>, setupChoice: 'guided' | 'scratch' | 'import', blueprint?: Blueprint | null) => Promise<void>;
  importBlueprint: (blueprint: Blueprint, resolutions: ImportResolution[]) => Promise<void>;
  restoreFromBackup: (backupData: IAppData) => Promise<void>;
  restoreDefaultObjects: (type: 'trophies') => Promise<void>;
  clearAllHistory: () => Promise<void>;
  resetAllPlayerData: () => Promise<void>;
  deleteAllCustomContent: () => Promise<void>;
  deleteSelectedAssets: (selection: Record<ShareableAssetType, string[]>) => Promise<void>;
  deleteQuests: (questIds: string[]) => Promise<void>;
  deleteTrophies: (trophyIds: string[]) => Promise<void>;
  deleteGameAssets: (assetIds: string[]) => Promise<void>;
  updateQuestsStatus: (questIds: string[], isActive: boolean) => Promise<void>;
  bulkUpdateQuests: (questIds: string[], updates: BulkQuestUpdates) => Promise<void>;
  uploadFile: (file: File, category?: string) => Promise<{ url: string } | null>;
  executeExchange: (userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => Promise<void>;

  // Settings & UI
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  setActivePage: (page: Page) => void;
  setAppMode: (mode: AppMode) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (notificationId: string) => void;
  setActiveMarketId: (marketId: string | null) => void;
  toggleSidebar: () => void;
  toggleChat: () => void;
  sendMessage: (message: Omit<ChatMessage, 'id' | 'timestamp' | 'readBy' | 'senderId'> & { isAnnouncement?: boolean }) => Promise<void>;
  markMessagesAsRead: (params: { partnerId?: string; guildId?: string; }) => Promise<void>;
  addSystemNotification: (notification: Omit<SystemNotification, 'id' | 'timestamp' | 'readByUserIds'>) => Promise<void>;
  markSystemNotificationsAsRead: (notificationIds: string[]) => Promise<void>;
}

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<AppDispatch | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // === STATE MANAGEMENT ===
  const [users, setUsers] = useState<User[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questGroups, setQuestGroups] = useState<QuestGroup[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [rewardTypes, setRewardTypes] = useState<RewardTypeDefinition[]>([]);
  const [questCompletions, setQuestCompletions] = useState<QuestCompletion[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [ranks, _setRanks] = useState<Rank[]>([]);
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [userTrophies, setUserTrophies] = useState<UserTrophy[]>([]);
  const [adminAdjustments, setAdminAdjustments] = useState<AdminAdjustment[]>([]);
  const [gameAssets, setGameAssets] = useState<GameAsset[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [themes, setThemes] = useState<ThemeDefinition[]>(INITIAL_THEMES);
  const [loginHistory, setLoginHistory] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);
  const [scheduledEvents, setScheduledEvents] = useState<ScheduledEvent[]>([]);

  // UI State
  const [currentUser, _setCurrentUser] = useState<User | null>(null);
  const [isAppUnlocked, _setAppUnlocked] = useState<boolean>(() => localStorage.getItem('isAppUnlocked') === 'true');
  const [activePage, setActivePage] = useState<Page>('Dashboard');
  const [appMode, setAppMode] = useState<AppMode>({ mode: 'personal' });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [activeMarketId, setActiveMarketId] = useState<string | null>(null);
  const [isSwitchingUser, setIsSwitchingUser] = useState<boolean>(false);
  const [isSharedViewActive, _setIsSharedViewActive] = useState(false);
  const [targetedUserForLogin, setTargetedUserForLogin] = useState<User | null>(null);
  const [isAiConfigured, setIsAiConfigured] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => localStorage.getItem('isSidebarCollapsed') === 'true');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [acknowledgedOldData, setAcknowledgedOldData] = useState(false);
  const inactivityTimer = useRef<number | null>(null);
  
  const isFirstRun = isDataLoaded && settings.contentVersion < 1 && !acknowledgedOldData;
  
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const uniqueId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setNotifications(prev => [...prev, { ...notification, id: uniqueId }]);
  }, []);
  
  const loadStateFromServerData = useCallback((dataToSet: IAppData) => {
    const savedSettings: Partial<AppSettings> = dataToSet.settings || {};
    const loadedSettings: AppSettings = {
        ...INITIAL_SETTINGS, ...savedSettings,
        questDefaults: { ...INITIAL_SETTINGS.questDefaults, ...(savedSettings.questDefaults || {}) },
        security: { ...INITIAL_SETTINGS.security, ...(savedSettings.security || {}) },
        sharedMode: { ...INITIAL_SETTINGS.sharedMode, ...(savedSettings.sharedMode || {}) },
        automatedBackups: { ...INITIAL_SETTINGS.automatedBackups, ...(savedSettings.automatedBackups || {}) },
        loginNotifications: { ...INITIAL_SETTINGS.loginNotifications, ...(savedSettings.loginNotifications || {}) },
        chat: { ...INITIAL_SETTINGS.chat, ...(savedSettings.chat || {}) },
        sidebars: { ...INITIAL_SETTINGS.sidebars, ...(savedSettings.sidebars || {}) },
        terminology: { ...INITIAL_SETTINGS.terminology, ...(savedSettings.terminology || {}) },
        rewardValuation: { ...INITIAL_SETTINGS.rewardValuation, ...(savedSettings.rewardValuation || {}) },
    };

    setUsers(dataToSet.users || []);
    setQuests(dataToSet.quests || []);
    setQuestGroups(dataToSet.questGroups || []);
    setMarkets(dataToSet.markets || []);
    setRewardTypes(dataToSet.rewardTypes || []);
    setQuestCompletions(dataToSet.questCompletions || []);
    setPurchaseRequests(dataToSet.purchaseRequests || []);
    setGuilds(dataToSet.guilds || []);
    _setRanks(dataToSet.ranks || []);
    setTrophies(dataToSet.trophies || []);
    setUserTrophies(dataToSet.userTrophies || []);
    setAdminAdjustments(dataToSet.adminAdjustments || []);
    setGameAssets(dataToSet.gameAssets || []);
    setSystemLogs(dataToSet.systemLogs || []);
    setSettings(loadedSettings);
    setThemes(dataToSet.themes || INITIAL_THEMES);
    setLoginHistory(dataToSet.loginHistory || []);
    setChatMessages(dataToSet.chatMessages || []);
    setSystemNotifications(dataToSet.systemNotifications || []);
    setScheduledEvents(dataToSet.scheduledEvents || []);

    _setCurrentUser(prevUser => {
        if (!prevUser) {
            const lastUserId = localStorage.getItem('lastUserId');
            if (lastUserId && dataToSet.users) {
                return dataToSet.users.find((u: User) => u.id === lastUserId) || null;
            }
            return null;
        } else {
            const updatedCurrentUser = (dataToSet.users || []).find((u: User) => u.id === prevUser.id);
            return updatedCurrentUser || null;
        }
    });

    _setIsSharedViewActive(loadedSettings.sharedMode.enabled && !localStorage.getItem('lastUserId'));
  }, []);

  const refetchData = useCallback(async () => {
    setSyncStatus('syncing');
    try {
        const response = await window.fetch('/api/data');
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        loadStateFromServerData(data);
        setSyncStatus('success');
    } catch (e) {
        setSyncStatus('error');
        setSyncError(e instanceof Error ? e.message : 'Unknown sync error.');
    }
  }, [loadStateFromServerData]);


  useEffect(() => {
    const initialFetch = async () => {
        setIsDataLoaded(false);
        await refetchData();
        try {
            const aiResponse = await window.fetch('/api/ai/status');
            if (aiResponse.ok) {
                const aiData = await aiResponse.json();
                setIsAiConfigured(aiData.isConfigured);
            }
        } catch (aiError) {
            setIsAiConfigured(false);
        }
        setIsDataLoaded(true);
    };
    initialFetch();
  }, [refetchData]);
  
  // WebSocket for real-time updates with reconnection logic
  useEffect(() => {
      if (!isDataLoaded || isFirstRun) return;

      let ws: WebSocket | null = null;
      let reconnectInterval: number | null = null;
      let reconnectAttempts = 0;

      const connect = () => {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const wsUrl = `${protocol}//${window.location.host}`;
          ws = new WebSocket(wsUrl);

          ws.onopen = () => {
              console.log('WebSocket connected');
              addNotification({ type: 'success', message: 'Real-time connection established.' });
              reconnectAttempts = 0;
              if (reconnectInterval) {
                  window.clearInterval(reconnectInterval);
                  reconnectInterval = null;
              }
          };

          ws.onclose = () => {
              console.log('WebSocket disconnected');
              ws = null;
              if (!reconnectInterval) {
                  reconnectInterval = window.setInterval(() => {
                      reconnectAttempts++;
                      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff up to 30s
                      console.log(`Attempting to reconnect WebSocket (attempt ${reconnectAttempts})...`);
                      addNotification({ type: 'info', message: 'Connection lost. Attempting to reconnect...' });
                      connect();
                  }, 5000); // Initial retry delay
              }
          };

          ws.onmessage = (event) => {
              const message = JSON.parse(event.data);
              const { payload } = message;

              switch (message.type) {
                  case 'USERS_UPDATED':
                      setUsers(payload);
                      _setCurrentUser(prevUser => {
                          if (!prevUser) return null;
                          return payload.find((u: User) => u.id === prevUser.id) || null;
                      });
                      break;
                  case 'QUESTS_UPDATED': setQuests(payload); break;
                  case 'QUESTGROUPS_UPDATED': setQuestGroups(payload); break;
                  case 'MARKETS_UPDATED': setMarkets(payload); break;
                  case 'REWARDTYPES_UPDATED': setRewardTypes(payload); break;
                  case 'QUESTCOMPLETIONS_UPDATED': setQuestCompletions(payload); break;
                  case 'PURCHASEREQUESTS_UPDATED': setPurchaseRequests(payload); break;
                  case 'GUILDS_UPDATED': setGuilds(payload); break;
                  case 'RANKS_UPDATED': _setRanks(payload); break;
                  case 'TROPHIES_UPDATED': setTrophies(payload); break;
                  case 'USERTROPHIES_UPDATED': setUserTrophies(payload); break;
                  case 'ADMINADJUSTMENTS_UPDATED': setAdminAdjustments(payload); break;
                  case 'GAMEASSETS_UPDATED': setGameAssets(payload); break;
                  case 'SYSTEMLOGS_UPDATED': setSystemLogs(payload); break;
                  case 'SETTINGS_UPDATED': setSettings(prev => ({...prev, ...payload})); break;
                  case 'THEMES_UPDATED': setThemes(payload); break;
                  case 'LOGINHISTORY_UPDATED': setLoginHistory(payload); break;
                  case 'SYSTEMNOTIFICATIONS_UPDATED': setSystemNotifications(payload); break;
                  case 'SCHEDULEDEVENTS_UPDATED': setScheduledEvents(payload); break;
                  case 'NEW_CHAT_MESSAGE':
                      setChatMessages(prev => {
                          if (prev.some(msg => msg.id === payload.id)) return prev;
                          return [...prev, payload];
                      });
                      break;
                  case 'FULL_REFRESH_REQUESTED':
                      refetchData();
                      break;
                  default:
                      console.warn('Received unknown WebSocket message type:', message.type);
              }
          };
      };

      connect();

      return () => {
          if (reconnectInterval) {
              window.clearInterval(reconnectInterval);
          }
          if (ws) {
              ws.close();
          }
      };
  }, [isDataLoaded, isFirstRun, refetchData, addNotification]);


  // === API CALL WRAPPER ===
  const apiCall = useCallback(async (endpoint: string, method: string, body?: any) => {
      try {
          const response = await fetch(endpoint, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: body ? JSON.stringify(body) : undefined
          });
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `Request failed with status ${response.status}`);
          }
          return await response.json();
      } catch (err) {
          const message = err instanceof Error ? err.message : 'An unknown error occurred';
          addNotification({ type: 'error', message });
          throw err; // Re-throw to be caught by the calling function if needed
      }
  }, [addNotification]);


  // === DISPATCH FUNCTIONS ===
  const completeFirstRun = useCallback(async (adminUserData: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>, setupChoice: 'guided' | 'scratch' | 'import', blueprint?: Blueprint | null) => {
      try {
          const { user: newUser } = await apiCall('/api/first-run', 'POST', { adminUserData, setupChoice, blueprint });
          addNotification({ type: 'success', message: `Welcome, ${newUser.gameName}! Setup complete.` });
          
          // Manually set state to avoid a full refresh/flicker
          await refetchData(); // We need to fetch the newly seeded data
          _setCurrentUser(newUser);
          _setAppUnlocked(true);
          localStorage.setItem('lastUserId', newUser.id);
          localStorage.setItem('isAppUnlocked', 'true');

      } catch (e) {
          // apiCall will show the notification
          console.error("Failed to complete first run:", e);
      }
  }, [apiCall, addNotification, refetchData]);

  const completeQuest = useCallback(async (questId: string, userId: string, rewards: RewardItem[], requiresApproval: boolean, guildId?: string, options?: { note?: string; completionDate?: Date }) => {
      await apiCall(`/api/quests/${questId}/complete`, 'POST', { userId, note: options?.note, completionDate: options?.completionDate });
      addNotification({
          type: requiresApproval ? 'info' : 'success',
          message: requiresApproval ? 'Quest submitted for approval.' : `Quest Completed!`
      });
  }, [apiCall, addNotification]);
  
  const purchaseMarketItem = useCallback(async (assetId: string, marketId: string, user: User, costGroupIndex: number) => {
      const guildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
      const requiresApproval = gameAssets.find(a => a.id === assetId)?.requiresApproval;
      await apiCall(`/api/assets/${assetId}/purchase`, 'POST', { userId: user.id, marketId, costGroupIndex, guildId });
      addNotification({ 
          type: requiresApproval ? 'info' : 'success', 
          message: requiresApproval ? `Purchase requested.` : `Purchase successful!` 
      });
  }, [apiCall, addNotification, appMode, gameAssets]);
  
  const sendMessage = useCallback(async (message: Omit<ChatMessage, 'id' | 'timestamp' | 'readBy' | 'senderId'> & { isAnnouncement?: boolean }) => {
    if (!currentUser) return;
    // This doesn't use apiCall because it uses a more efficient direct DB write and broadcasts its own specific event.
    try {
        await fetch('/api/chat/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...message, senderId: currentUser.id })
        });
    } catch (err) {
        addNotification({ type: 'error', message: 'Failed to send message.' });
    }
  }, [currentUser, addNotification]);
  
  const markMessagesAsRead = useCallback(async (params: { partnerId?: string; guildId?: string; }) => {
    if (!currentUser) return;
    try {
        await apiCall('/api/chat/read', 'POST', { userId: currentUser.id, ...params });
    } catch (err) {
        // apiCall will show the notification
        console.error("Failed to mark messages as read:", err);
    }
  }, [apiCall, currentUser]);

  const addUser = useCallback(async (userData: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>) => {
      const { user } = await apiCall('/api/users', 'POST', userData);
      return user as User;
  }, [apiCall]);
  const updateUser = useCallback(async (userId: string, updatedData: Partial<User>) => { await apiCall(`/api/users/${userId}`, 'PUT', updatedData); }, [apiCall]);
  const deleteUser = useCallback(async (userId: string) => { await apiCall(`/api/users/${userId}`, 'DELETE'); }, [apiCall]);
  const markUserAsOnboarded = useCallback(async (userId: string) => { await updateUser(userId, { hasBeenOnboarded: true }); }, [updateUser]);

  const addQuest = useCallback(async (quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => { await apiCall('/api/quests', 'POST', quest); }, [apiCall]);
  const updateQuest = useCallback(async (quest: Quest) => { await apiCall(`/api/quests/${quest.id}`, 'PUT', quest); }, [apiCall]);
  const deleteQuest = useCallback(async (questId: string) => { await apiCall(`/api/quests/${questId}`, 'DELETE'); }, [apiCall]);
  const cloneQuest = useCallback(async (questId: string) => { await apiCall(`/api/quests/${questId}/clone`, 'POST'); }, [apiCall]);
  const questAction = useCallback(async (questId: string, action: string, userId: string) => { await apiCall(`/api/quests/${questId}/actions`, 'POST', { action, userId }); }, [apiCall]);
  const dismissQuest = useCallback((questId: string, userId: string) => questAction(questId, 'dismiss', userId), [questAction]);
  const claimQuest = useCallback((questId: string, userId: string) => questAction(questId, 'claim', userId), [questAction]);
  const releaseQuest = useCallback((questId: string, userId: string) => questAction(questId, 'release', userId), [questAction]);
  const markQuestAsTodo = useCallback((questId: string, userId: string) => questAction(questId, 'mark_todo', userId), [questAction]);
  const unmarkQuestAsTodo = useCallback((questId: string, userId: string) => questAction(questId, 'unmark_todo', userId), [questAction]);
  
  const approveQuestCompletion = useCallback(async (id: string, note?: string) => { await apiCall(`/api/quest-completions/${id}`, 'PUT', { status: 'Approved', note }); }, [apiCall]);
  const rejectQuestCompletion = useCallback(async (id: string, note?: string) => { await apiCall(`/api/quest-completions/${id}`, 'PUT', { status: 'Rejected', note }); }, [apiCall]);

  const addQuestGroup = useCallback(async (group: Omit<QuestGroup, 'id'>) => { const { newGroup } = await apiCall('/api/questGroups', 'POST', group); return newGroup as QuestGroup; }, [apiCall]);
  const updateQuestGroup = useCallback(async (group: QuestGroup) => { await apiCall(`/api/questGroups/${group.id}`, 'PUT', group); }, [apiCall]);
  const deleteQuestGroup = useCallback(async (id: string) => { await apiCall(`/api/questGroups/${id}`, 'DELETE'); }, [apiCall]);
  const assignQuestGroupToUsers = useCallback(async (id: string, userIds: string[]) => { await apiCall(`/api/quest-groups/${id}/assign`, 'POST', { userIds }); }, [apiCall]);
  
  const addRewardType = useCallback(async (rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => { await apiCall('/api/rewardTypes', 'POST', rewardType); }, [apiCall]);
  const updateRewardType = useCallback(async (rewardType: RewardTypeDefinition) => { await apiCall(`/api/rewardTypes/${rewardType.id}`, 'PUT', rewardType); }, [apiCall]);
  const deleteRewardType = useCallback(async (id: string) => { await apiCall(`/api/rewardTypes/${id}`, 'DELETE'); }, [apiCall]);
  const cloneRewardType = useCallback(async (id: string) => { await apiCall(`/api/rewardTypes/${id}/clone`, 'POST'); }, [apiCall]);

  const addMarket = useCallback(async (market: Omit<Market, 'id'>) => { await apiCall('/api/markets', 'POST', market); }, [apiCall]);
  const updateMarket = useCallback(async (market: Market) => { await apiCall(`/api/markets/${market.id}`, 'PUT', market); }, [apiCall]);
  const deleteMarket = useCallback(async (id: string) => { await apiCall(`/api/markets/${id}`, 'DELETE'); }, [apiCall]);
  const cloneMarket = useCallback(async (id: string) => { await apiCall(`/api/markets/${id}/clone`, 'POST'); }, [apiCall]);
  const deleteMarkets = useCallback(async (ids: string[]) => { await apiCall('/api/markets/delete-many', 'POST', { marketIds: ids }); }, [apiCall]);
  const updateMarketsStatus = useCallback(async (ids: string[], statusType: 'open' | 'closed') => { await apiCall('/api/markets/bulk-status', 'POST', { marketIds: ids, status: statusType }); }, [apiCall]);

  const cancelPurchaseRequest = useCallback(async (id: string) => { await apiCall(`/api/purchase-requests/${id}`, 'PUT', { status: 'Cancelled' }); }, [apiCall]);
  const approvePurchaseRequest = useCallback(async (id: string) => { await apiCall(`/api/purchase-requests/${id}`, 'PUT', { status: 'Completed' }); }, [apiCall]);
  const rejectPurchaseRequest = useCallback(async (id: string) => { await apiCall(`/api/purchase-requests/${id}`, 'PUT', { status: 'Rejected' }); }, [apiCall]);

  const addGuild = useCallback(async (guild: Omit<Guild, 'id'>) => { await apiCall('/api/guilds', 'POST', guild); }, [apiCall]);
  const updateGuild = useCallback(async (guild: Guild) => { await apiCall(`/api/guilds/${guild.id}`, 'PUT', guild); }, [apiCall]);
  const deleteGuild = useCallback(async (id: string) => { await apiCall(`/api/guilds/${id}`, 'DELETE'); }, [apiCall]);

  const setRanks = useCallback(async (newRanks: Rank[]) => { await apiCall('/api/ranks', 'PUT', { ranks: newRanks }); }, [apiCall]);

  const addTrophy = useCallback(async (trophy: Omit<Trophy, 'id'>) => { await apiCall('/api/trophies', 'POST', trophy); }, [apiCall]);
  const updateTrophy = useCallback(async (trophy: Trophy) => { await apiCall(`/api/trophies/${trophy.id}`, 'PUT', trophy); }, [apiCall]);
  const deleteTrophy = useCallback(async (id: string) => { await apiCall(`/api/trophies/${id}`, 'DELETE'); }, [apiCall]);
  const awardTrophy = useCallback(async (userId: string, trophyId: string, guildId?: string) => { await apiCall('/api/trophies/award', 'POST', { userId, trophyId, guildId }); }, [apiCall]);

  const addGameAsset = useCallback(async (asset: Omit<GameAsset, 'id' | 'creatorId' | 'createdAt'>) => { await apiCall('/api/gameAssets', 'POST', asset); }, [apiCall]);
  const updateGameAsset = useCallback(async (asset: GameAsset) => { await apiCall(`/api/gameAssets/${asset.id}`, 'PUT', asset); }, [apiCall]);
  const deleteGameAsset = useCallback(async (id: string) => { await apiCall(`/api/gameAssets/${id}`, 'DELETE'); }, [apiCall]);
  const cloneGameAsset = useCallback(async (id: string) => { await apiCall(`/api/gameAssets/${id}/clone`, 'POST'); }, [apiCall]);

  const addTheme = useCallback(async (theme: Omit<ThemeDefinition, 'id'>) => { await apiCall('/api/themes', 'POST', theme); }, [apiCall]);
  const updateTheme = useCallback(async (theme: ThemeDefinition) => { await apiCall(`/api/themes/${theme.id}`, 'PUT', theme); }, [apiCall]);
  const deleteTheme = useCallback(async (id: string) => { await apiCall(`/api/themes/${id}`, 'DELETE'); }, [apiCall]);
  
  const addScheduledEvent = useCallback(async (event: Omit<ScheduledEvent, 'id'>) => { await apiCall('/api/scheduledEvents', 'POST', event); }, [apiCall]);
  const updateScheduledEvent = useCallback(async (event: ScheduledEvent) => { await apiCall(`/api/scheduledEvents/${event.id}`, 'PUT', event); }, [apiCall]);
  const deleteScheduledEvent = useCallback(async (id: string) => { await apiCall(`/api/scheduledEvents/${id}`, 'DELETE'); }, [apiCall]);
  
  const importBlueprint = useCallback(async (blueprint: Blueprint, resolutions: ImportResolution[]) => { await apiCall('/api/import-blueprint', 'POST', { blueprint, resolutions }); }, [apiCall]);
  const restoreDefaultObjects = useCallback(async (type: 'trophies') => { await apiCall('/api/data/restore-defaults', 'POST', { type }); addNotification({type: 'success', message: 'Missing default objects have been restored!'})}, [apiCall, addNotification]);
  const clearAllHistory = useCallback(async () => { await apiCall('/api/data/clear-history', 'POST'); }, [apiCall]);
  const resetAllPlayerData = useCallback(async () => { await apiCall('/api/data/reset-player-data', 'POST'); }, [apiCall]);
  const deleteAllCustomContent = useCallback(async () => { await apiCall('/api/data/delete-custom-content', 'POST'); }, [apiCall]);
  const deleteSelectedAssets = useCallback(async (selection: Record<ShareableAssetType, string[]>) => { await apiCall('/api/data/delete-selected', 'POST', { selection }); }, [apiCall]);
  const deleteTrophies = useCallback(async (trophyIds: string[]) => { await apiCall('/api/trophies/delete-many', 'POST', { trophyIds }); }, [apiCall]);
  const deleteGameAssets = useCallback(async (assetIds: string[]) => { await apiCall('/api/gameAssets/delete-many', 'POST', { assetIds }); }, [apiCall]);
  
  const executeExchange = useCallback(async (userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => { await apiCall('/api/economy/exchange', 'POST', { userId, payItem, receiveItem, guildId }); }, [apiCall]);
  const addSystemNotification = useCallback(async (notification: Omit<SystemNotification, 'id' | 'timestamp' | 'readByUserIds'>) => { await apiCall('/api/system-notifications', 'POST', notification); }, [apiCall]);
  const markSystemNotificationsAsRead = useCallback(async (notificationIds: string[]) => { await apiCall('/api/system-notifications/read', 'POST', { notificationIds }); }, [apiCall]);
  const resetSettings = useCallback(async () => { await apiCall('/api/settings/reset', 'POST'); }, [apiCall]);


  const applyManualAdjustment = useCallback(async (adjustment: Omit<AdminAdjustment, 'id' | 'adjustedAt'>): Promise<boolean> => {
      try {
          await apiCall('/api/adjustments', 'POST', adjustment);
          addNotification({ type: 'success', message: 'Adjustment applied successfully.' });
          return true;
      } catch (e) {
          // apiCall will show error notification
          return false;
      }
  }, [apiCall, addNotification]);
  
  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => { await apiCall('/api/settings', 'PUT', newSettings); }, [apiCall]);
  const bulkUpdateQuests = useCallback(async (questIds: string[], updates: BulkQuestUpdates) => { await apiCall('/api/quests/bulk-update', 'POST', { questIds, updates }); }, [apiCall]);
  const deleteQuests = useCallback(async (questIds: string[]) => { await apiCall('/api/quests/delete-many', 'POST', { questIds }); }, [apiCall]);
  
  const bypassFirstRunCheck = useCallback(() => setAcknowledgedOldData(true), []);
  const removeNotification = useCallback((notificationId: string) => { setNotifications(prev => prev.filter(n => n.id !== notificationId)); }, []);
  const setCurrentUser = (user: User | null) => { _setCurrentUser(user); _setIsSharedViewActive(false); if (user) { setActivePage('Dashboard'); localStorage.setItem('lastUserId', user.id); setLoginHistory(prev => [user.id, ...prev.filter(id => id !== user.id).slice(0, 9)]); } else { localStorage.removeItem('lastUserId'); } };
  const exitToSharedView = useCallback(() => { _setCurrentUser(null); _setIsSharedViewActive(true); localStorage.removeItem('lastUserId'); }, []);
  const setAppUnlocked = useCallback((isUnlocked: boolean) => { localStorage.setItem('isAppUnlocked', String(isUnlocked)); _setAppUnlocked(isUnlocked); }, []);
  const toggleSidebar = useCallback(() => { setIsSidebarCollapsed(prev => { const newState = !prev; localStorage.setItem('isSidebarCollapsed', String(newState)); return newState; }); }, []);
  const resetInactivityTimer = useCallback(() => { if (inactivityTimer.current) window.clearTimeout(inactivityTimer.current); if (settings.sharedMode.enabled && settings.sharedMode.autoExit && currentUser) { inactivityTimer.current = window.setTimeout( exitToSharedView, settings.sharedMode.autoExitMinutes * 60 * 1000 ); } }, [settings.sharedMode, currentUser, exitToSharedView]);
  useEffect(() => { window.addEventListener('mousemove', resetInactivityTimer); window.addEventListener('keydown', resetInactivityTimer); window.addEventListener('click', resetInactivityTimer); resetInactivityTimer(); return () => { window.removeEventListener('mousemove', resetInactivityTimer); window.removeEventListener('keydown', resetInactivityTimer); window.removeEventListener('click', resetInactivityTimer); if (inactivityTimer.current) window.clearTimeout(inactivityTimer.current); }; }, [resetInactivityTimer]);
  const toggleChat = useCallback(() => setIsChatOpen(prev => !prev), []);
  const uploadFile = useCallback(async (file: File, category: string = 'Miscellaneous'): Promise<{ url: string } | null> => { const fd = new FormData(); fd.append('file', file); fd.append('category', category); try { const r = await window.fetch('/api/media/upload', { method: 'POST', body: fd }); if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Upload failed'); } return await r.json(); } catch (e) { const m = e instanceof Error ? e.message : 'Unknown error'; addNotification({ type: 'error', message: `Upload failed: ${m}` }); return null; } }, [addNotification]);
  const restoreFromBackup = useCallback(async (backupData: IAppData) => { try { await apiCall('/api/data', 'POST', backupData); addNotification({ type: 'success', message: 'Restore successful! The app will now reload.' }); setTimeout(() => window.location.reload(), 1500); } catch (e) { /* apiCall handles notification */ } }, [apiCall, addNotification]);

  // === CONTEXT PROVIDER VALUE ===
  const stateValue: AppState = { users, quests, questGroups, markets, rewardTypes, questCompletions, purchaseRequests, guilds, ranks, trophies, userTrophies, adminAdjustments, gameAssets, systemLogs, settings, themes, loginHistory, chatMessages, systemNotifications, scheduledEvents, currentUser, isAppUnlocked, isFirstRun, activePage, appMode, notifications, isDataLoaded, activeMarketId, allTags: useMemo(() => Array.from(new Set([...INITIAL_TAGS, ...quests.flatMap(q => q.tags || [])])).sort(), [quests]), isSwitchingUser, isSharedViewActive, targetedUserForLogin, isAiConfigured, isSidebarCollapsed, syncStatus, syncError, isChatOpen, };
  const dispatchValue: AppDispatch = { addUser: addUser as any, updateUser, deleteUser, setCurrentUser, markUserAsOnboarded, setAppUnlocked, setIsSwitchingUser, setTargetedUserForLogin, exitToSharedView, setIsSharedViewActive: _setIsSharedViewActive, bypassFirstRunCheck, addQuest, updateQuest, deleteQuest, cloneQuest, dismissQuest, claimQuest, releaseQuest, markQuestAsTodo, unmarkQuestAsTodo, completeQuest, approveQuestCompletion, rejectQuestCompletion, addQuestGroup: addQuestGroup as any, updateQuestGroup, deleteQuestGroup, assignQuestGroupToUsers, addRewardType, updateRewardType, deleteRewardType, cloneRewardType, addMarket, updateMarket, deleteMarket, cloneMarket, deleteMarkets, updateMarketsStatus, purchaseMarketItem, cancelPurchaseRequest, approvePurchaseRequest, rejectPurchaseRequest, addGuild, updateGuild, deleteGuild, setRanks, addTrophy, updateTrophy, deleteTrophy, awardTrophy, applyManualAdjustment, addGameAsset, updateGameAsset, deleteGameAsset, cloneGameAsset, addTheme, updateTheme, deleteTheme, addScheduledEvent, updateScheduledEvent, deleteScheduledEvent, completeFirstRun, importBlueprint, restoreFromBackup, restoreDefaultObjects, clearAllHistory, resetAllPlayerData, deleteAllCustomContent, deleteSelectedAssets, deleteQuests, deleteTrophies, deleteGameAssets, updateQuestsStatus: (questIds, isActive) => bulkUpdateQuests(questIds, { isActive }), bulkUpdateQuests, uploadFile, executeExchange, updateSettings, resetSettings, setActivePage, setAppMode, addNotification, removeNotification, setActiveMarketId, toggleSidebar, toggleChat, sendMessage, markMessagesAsRead, addSystemNotification, markSystemNotificationsAsRead };

  return (
    <AppStateContext.Provider value={stateValue}>
      <AppDispatchContext.Provider value={dispatchValue}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
};

// Global hook for accessing the combined state
export const useAppState = (): AppState => {
  const context = useContext(AppStateContext);
  if (context === undefined) throw new Error('useAppState must be used within an AppProvider');
  return context;
};

// Global hook for accessing the combined dispatch functions
export const useAppDispatch = (): AppDispatch => {
  const context = useContext(AppDispatchContext);
  if (context === undefined) throw new Error('useAppDispatch must be used within an AppProvider');
  return context;
};