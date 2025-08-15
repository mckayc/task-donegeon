import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppSettings, User, Quest, RewardItem, Guild, Rank, Trophy, UserTrophy, AppMode, Page, IAppData, ShareableAssetType, GameAsset, Role, RewardCategory, AdminAdjustment, AdminAdjustmentType, SystemLog, QuestType, QuestAvailability, AssetPack, ImportResolution, TrophyRequirementType, ThemeDefinition, ChatMessage, SystemNotification, SystemNotificationType, MarketStatus, QuestGroup, BulkQuestUpdates, ScheduledEvent, BugReport, QuestCompletion, BugReportType, PurchaseRequest, PurchaseRequestStatus, Market, RewardTypeDefinition } from '../types';
import { INITIAL_SETTINGS, INITIAL_RANKS, INITIAL_TROPHIES, INITIAL_THEMES } from '../data/initialData';
import { useNotificationsDispatch } from './NotificationsContext';
import { useAuthState, useAuthDispatch } from './AuthContext';
import { bugLogger } from '../utils/bugLogger';
import { toYMD } from '../utils/quests';

// The single, unified state for the application
interface AppState extends IAppData {
  isDataLoaded: boolean;
  isAiConfigured: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncError: string | null;
  // UI State
  activePage: Page;
  isSidebarCollapsed: boolean;
  isChatOpen: boolean;
  appMode: AppMode;
  activeMarketId: string | null;
  // Derived state
  allTags: string[];
}

// The single, unified dispatch for the application
interface AppDispatch {
  // Data Setters (from sync)
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setLoginHistory: React.Dispatch<React.SetStateAction<string[]>>;
  setQuests: React.Dispatch<React.SetStateAction<Quest[]>>;
  setQuestGroups: React.Dispatch<React.SetStateAction<QuestGroup[]>>;
  setQuestCompletions: React.Dispatch<React.SetStateAction<QuestCompletion[]>>;
  setMarkets: React.Dispatch<React.SetStateAction<Market[]>>;
  setRewardTypes: React.Dispatch<React.SetStateAction<RewardTypeDefinition[]>>;
  setPurchaseRequests: React.Dispatch<React.SetStateAction<PurchaseRequest[]>>;
  setGameAssets: React.Dispatch<React.SetStateAction<GameAsset[]>>;

  // UI
  setActivePage: (page: Page) => void;
  toggleSidebar: () => void;
  toggleChat: () => void;
  setAppMode: (mode: AppMode) => void;
  setActiveMarketId: (marketId: string | null) => void;

  // Game Data
  addGuild: (guild: Omit<Guild, 'id'>) => Promise<void>;
  updateGuild: (guild: Guild) => Promise<void>;
  deleteGuild: (guildId: string) => Promise<void>;
  setRanks: (ranks: Rank[]) => void;
  addTrophy: (trophy: Omit<Trophy, 'id'>) => void;
  updateTrophy: (trophy: Trophy) => void;
  awardTrophy: (userId: string, trophyId: string, guildId?: string) => void;
  applyManualAdjustment: (adjustment: Omit<AdminAdjustment, 'id' | 'adjustedAt'>) => boolean;
  addTheme: (theme: Omit<ThemeDefinition, 'id'>) => void;
  updateTheme: (theme: ThemeDefinition) => void;
  deleteTheme: (themeId: string) => void;
  addScheduledEvent: (event: Omit<ScheduledEvent, 'id'>) => Promise<void>;
  updateScheduledEvent: (event: ScheduledEvent) => Promise<void>;
  deleteScheduledEvent: (eventId: string) => Promise<void>;
  addBugReport: (report: Omit<BugReport, 'id' | 'status' | 'tags'> & { reportType: BugReportType }) => Promise<void>;
  updateBugReport: (reportId: string, updates: Partial<BugReport>) => Promise<void>;
  deleteBugReports: (reportIds: string[]) => Promise<void>;
  importBugReports: (reports: BugReport[]) => Promise<void>;
  restoreFromBackup: (backupData: IAppData) => Promise<void>;
  clearAllHistory: () => void;
  resetAllPlayerData: () => void;
  deleteAllCustomContent: () => void;
  deleteSelectedAssets: (selection: Partial<Record<ShareableAssetType, string[]>>, onComplete?: () => void) => Promise<void>;
  uploadFile: (file: File, category?: string) => Promise<{ url: string } | null>;
  factoryReset: () => Promise<void>;

  // Settings & System
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => void;
  sendMessage: (message: Omit<ChatMessage, 'id' | 'timestamp' | 'readBy' | 'senderId'> & { isAnnouncement?: boolean }) => Promise<void>;
  markMessagesAsRead: (params: { partnerId?: string; guildId?: string; }) => void;
  addSystemNotification: (notification: Omit<SystemNotification, 'id' | 'timestamp' | 'readByUserIds'>) => void;
  markSystemNotificationsAsRead: (notificationIds: string[]) => void;
  triggerSync: () => void;
  registerOptimisticUpdate: (key: string) => void;

  // Quests
  addQuest: (quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => void;
  updateQuest: (updatedQuest: Quest) => void;
  deleteQuest: (questId: string) => void;
  cloneQuest: (questId: string) => void;
  dismissQuest: (questId: string, userId: string) => void;
  claimQuest: (questId: string, userId: string) => void;
  releaseQuest: (questId: string, userId: string) => void;
  markQuestAsTodo: (questId: string, userId: string) => void;
  unmarkQuestAsTodo: (questId: string, userId: string) => void;
  completeQuest: (completionData: any) => Promise<void>;
  approveQuestCompletion: (completionId: string, note?: string) => Promise<void>;
  rejectQuestCompletion: (completionId: string, note?: string) => Promise<void>;
  addQuestGroup: (group: Omit<QuestGroup, 'id'>) => QuestGroup;
  updateQuestGroup: (group: QuestGroup) => void;
  deleteQuestGroup: (groupId: string) => void;
  deleteQuestGroups: (groupIds: string[]) => void;
  assignQuestGroupToUsers: (groupId: string, userIds: string[]) => void;
  deleteQuests: (questIds: string[]) => void;
  updateQuestsStatus: (questIds: string[], isActive: boolean) => void;
  bulkUpdateQuests: (questIds: string[], updates: BulkQuestUpdates) => void;

  // Economy
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
  addGameAsset: (asset: Omit<GameAsset, 'id' | 'creatorId' | 'createdAt' | 'purchaseCount'>) => Promise<void>;
  updateGameAsset: (asset: GameAsset) => Promise<void>;
  cloneGameAsset: (assetId: string) => Promise<void>;
  deleteGameAssets: (assetIds: string[]) => Promise<void>;
  purchaseMarketItem: (assetId: string, marketId: string, user: User, costGroupIndex: number, scheduledEvents: ScheduledEvent[]) => void;
  cancelPurchaseRequest: (purchaseId: string) => void;
  approvePurchaseRequest: (purchaseId: string) => void;
  rejectPurchaseRequest: (purchaseId: string) => void;
  applyRewards: (userId: string, rewardsToApply: RewardItem[], guildId?: string) => void;
  deductRewards: (userId: string, cost: RewardItem[], guildId?: string) => boolean;
  executeExchange: (userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => Promise<void>;
  importAssetPack: (assetPack: AssetPack, resolutions: ImportResolution[], allData: IAppData) => Promise<void>;
}

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<AppDispatch | undefined>(undefined);

const mergeData = <T extends { id: string }>(existing: T[], incoming: T[]): T[] => {
    const dataMap = new Map(existing.map(item => [item.id, item]));
    incoming.forEach(item => dataMap.set(item.id, item));
    return Array.from(dataMap.values());
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addNotification, updateNotification } = useNotificationsDispatch();
  const { currentUser, users, loginHistory } = useAuthState();
  const authDispatch = useAuthDispatch();

  // === UNIFIED STATE MANAGEMENT ===
  // App State
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [userTrophies, setUserTrophies] = useState<UserTrophy[]>([]);
  const [adminAdjustments, setAdminAdjustments] = useState<AdminAdjustment[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [themes, setThemes] = useState<ThemeDefinition[]>(INITIAL_THEMES);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);
  const [scheduledEvents, setScheduledEvents] = useState<ScheduledEvent[]>([]);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  // Quest State
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questGroups, setQuestGroups] = useState<QuestGroup[]>([]);
  const [questCompletions, setQuestCompletions] = useState<QuestCompletion[]>([]);
  // Economy State
  const [markets, setMarkets] = useState<Market[]>([]);
  const [rewardTypes, setRewardTypes] = useState<RewardTypeDefinition[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [gameAssets, setGameAssets] = useState<GameAsset[]>([]);
  // UI State
  const [activePage, _setActivePage] = useState<Page>('Dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => localStorage.getItem('isSidebarCollapsed') === 'true');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>({ mode: 'personal' });
  const [activeMarketId, setActiveMarketId] = useState<string | null>(null);

  // System State
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isAiConfigured, setIsAiConfigured] = useState(false);
  
  // Refs and Derived State
  const mutationsInFlight = useRef(0);
  const recentOptimisticUpdates = useRef<Map<string, string>>(new Map());
  const lastSyncTimestamp = useRef<string | null>(null);
  const allTags = useMemo(() => Array.from(new Set(['Cleaning', 'Learning', 'Health', 'Yardwork', ...quests.flatMap(q => q.tags || [])])).sort(), [quests]);

  const currentUserRef = useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  
  // === API HELPERS ===
  const apiRequest = useCallback(async (method: string, path: string, body?: any) => {
    const isMutation = method !== 'GET';
    if (isMutation) mutationsInFlight.current += 1;
    try {
        const options: RequestInit = { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined };
        const response = await window.fetch(path, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Server error' }));
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }
        return response.status === 204 ? null : await response.json();
    } catch (error) {
        addNotification({ type: 'error', message: error instanceof Error ? error.message : 'An unknown network error occurred.' });
        throw error;
    } finally {
        if (isMutation) mutationsInFlight.current -= 1;
    }
  }, [addNotification]);
  
  // === DATA SYNC & LOADING ===
  
  const processAndSetData = useCallback((dataToSet: Partial<IAppData>, isDelta = false) => {
      const processDelta = <T extends { id: string; updatedAt?: string }>(
          keyPrefix: string, serverData: T[] | undefined, localStateSetter: React.Dispatch<React.SetStateAction<T[]>>
      ) => {
          if (!serverData) return;
          const filteredData = serverData.filter(item => {
              const optimisticTimestamp = recentOptimisticUpdates.current.get(`${keyPrefix}-${item.id}`);
              const serverTimestamp = item.updatedAt;
              if (optimisticTimestamp && serverTimestamp && new Date(serverTimestamp) < new Date(optimisticTimestamp)) {
                  console.log(`[SYNC] Ignoring stale server update for ${keyPrefix} ${item.id}`);
                  return false;
              }
              return true;
          });
          if (filteredData.length > 0) localStateSetter(prev => mergeData(prev, filteredData));
      };

      if (isDelta) {
          if (dataToSet.settings) {
              const optimisticTimestamp = recentOptimisticUpdates.current.get('settings');
              const serverTimestamp = dataToSet.settings.updatedAt;
              if (!optimisticTimestamp || !serverTimestamp || new Date(serverTimestamp) >= new Date(optimisticTimestamp)) {
                  setSettings(prev => ({ ...prev, ...dataToSet.settings }));
              } else {
                  console.log('[SYNC] Ignoring stale server update for settings');
              }
          }

          processDelta('user', dataToSet.users, authDispatch.setUsers);
          processDelta('quest', dataToSet.quests, setQuests);
          processDelta('questGroup', dataToSet.questGroups, setQuestGroups);
          processDelta('questCompletion', dataToSet.questCompletions, setQuestCompletions);
          processDelta('market', dataToSet.markets, setMarkets);
          processDelta('rewardType', dataToSet.rewardTypes, setRewardTypes);
          processDelta('purchaseRequest', dataToSet.purchaseRequests, setPurchaseRequests);
          processDelta('gameAsset', dataToSet.gameAssets, setGameAssets);
          processDelta('guild', dataToSet.guilds, setGuilds);
          processDelta('rank', dataToSet.ranks, setRanks);
          processDelta('trophy', dataToSet.trophies, setTrophies);
          processDelta('userTrophy', dataToSet.userTrophies, setUserTrophies);
          processDelta('adminAdjustment', dataToSet.adminAdjustments, setAdminAdjustments);
          processDelta('systemLog', dataToSet.systemLogs, setSystemLogs);
          processDelta('theme', dataToSet.themes, setThemes);
          processDelta('chatMessage', dataToSet.chatMessages, setChatMessages);
          processDelta('systemNotification', dataToSet.systemNotifications, setSystemNotifications);
          processDelta('scheduledEvent', dataToSet.scheduledEvents, setScheduledEvents);
          processDelta('bugReport', dataToSet.bugReports, setBugReports);

          if (dataToSet.loginHistory) authDispatch.setLoginHistory(dataToSet.loginHistory);
      } else { // Full data load
          const savedSettings: Partial<AppSettings> = dataToSet.settings || {};
          const loadedSettings: AppSettings = { ...INITIAL_SETTINGS, ...savedSettings,
              questDefaults: { ...INITIAL_SETTINGS.questDefaults, ...savedSettings.questDefaults },
              security: { ...INITIAL_SETTINGS.security, ...savedSettings.security },
              sharedMode: { ...INITIAL_SETTINGS.sharedMode, ...savedSettings.sharedMode },
              automatedBackups: { ...INITIAL_SETTINGS.automatedBackups, ...savedSettings.automatedBackups },
              loginNotifications: { ...INITIAL_SETTINGS.loginNotifications, ...savedSettings.loginNotifications },
              googleCalendar: { ...INITIAL_SETTINGS.googleCalendar, ...savedSettings.googleCalendar },
              developerMode: { ...INITIAL_SETTINGS.developerMode, ...savedSettings.developerMode },
              chat: { ...INITIAL_SETTINGS.chat, ...savedSettings.chat },
              terminology: { ...INITIAL_SETTINGS.terminology, ...savedSettings.terminology },
              rewardValuation: { ...INITIAL_SETTINGS.rewardValuation, ...savedSettings.rewardValuation },
          };
          setSettings(loadedSettings);
          authDispatch.setUsers(dataToSet.users || []);
          authDispatch.setLoginHistory(dataToSet.loginHistory || []);
          setQuests(dataToSet.quests || []);
          setQuestGroups(dataToSet.questGroups || []);
          setQuestCompletions(dataToSet.questCompletions || []);
          setMarkets(dataToSet.markets || []);
          setRewardTypes(dataToSet.rewardTypes || []);
          setPurchaseRequests(dataToSet.purchaseRequests || []);
          setGameAssets(dataToSet.gameAssets || []);
          setGuilds(dataToSet.guilds || []);
          setRanks(dataToSet.ranks || []);
          setTrophies(dataToSet.trophies || []);
          setUserTrophies(dataToSet.userTrophies || []);
          setAdminAdjustments(dataToSet.adminAdjustments || []);
          setSystemLogs(dataToSet.systemLogs || []);
          setThemes(dataToSet.themes || []);
          setChatMessages(dataToSet.chatMessages || []);
          setSystemNotifications(dataToSet.systemNotifications || []);
          setScheduledEvents(dataToSet.scheduledEvents || []);
          setBugReports(dataToSet.bugReports || []);
          return { loadedSettings };
      }
      return { loadedSettings: undefined };
  }, [authDispatch]);
  
  const performDeltaSync = useCallback(async () => {
    if (mutationsInFlight.current > 0 || !lastSyncTimestamp.current) return;
    setSyncStatus('syncing');
    setSyncError(null);
    try {
      const response = await apiRequest('GET', `/api/data/sync?lastSync=${lastSyncTimestamp.current}`);
      if (!response) {
          setSyncStatus('success'); // No updates
          return;
      }
      const { updates, newSyncTimestamp } = response;
      if (Object.keys(updates).length > 0) {
          processAndSetData(updates, true);
          if (updates.users && currentUserRef.current) {
            const updatedCurrentUser = updates.users.find((u: User) => u.id === currentUserRef.current!.id);
            if (updatedCurrentUser) authDispatch.setCurrentUser(updatedCurrentUser);
          }
      }
      lastSyncTimestamp.current = newSyncTimestamp;
      setSyncStatus('success');
    } catch (error) {
      console.error("Data sync failed:", error);
      setSyncStatus('error');
      setSyncError(error instanceof Error ? error.message : 'An unknown error occurred during sync.');
    }
  }, [apiRequest, processAndSetData, authDispatch]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const response = await apiRequest('GET', '/api/data/sync');
        if (!response) return;
        const { updates, newSyncTimestamp } = response;
        const { loadedSettings } = processAndSetData(updates, false);

        const lastUserId = localStorage.getItem('lastUserId');
        if (lastUserId && updates.users) {
          const lastUser = updates.users.find((u:User) => u.id === lastUserId);
          if (lastUser) authDispatch.setCurrentUser(lastUser);
        }
        
        if (loadedSettings) authDispatch.setIsSharedViewActive(loadedSettings.sharedMode.enabled && !localStorage.getItem('lastUserId'));
        lastSyncTimestamp.current = newSyncTimestamp;

        const systemStatusResponse = await window.fetch('/api/system/status');
        if (systemStatusResponse.ok) {
            const statusData = await systemStatusResponse.json();
            setIsAiConfigured(statusData.geminiConnected);
        }
      } catch (error) {
        console.error("Could not load data from server.", error);
        setIsAiConfigured(false);
      } finally {
        setIsDataLoaded(true);
      }
    };
    initializeApp();
  }, [apiRequest, processAndSetData, addNotification, authDispatch]);

  useEffect(() => {
    if (!isDataLoaded) return;
    const eventSource = new EventSource('/api/data/events');
    eventSource.onmessage = (event) => {
        if (event.data === 'sync') {
            performDeltaSync();
        } else if (event.data === 'connected') {
            setSyncStatus('success');
            setSyncError(null);
        }
    };
    eventSource.onerror = () => {
        setSyncStatus('error');
        setSyncError('Lost connection to server. Reconnecting...');
    };
    const handleVisibilityChange = () => { if (!document.hidden) performDeltaSync(); };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
        eventSource.close();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isDataLoaded, performDeltaSync]);
  
  // === DISPATCH FUNCTIONS ===
  const registerOptimisticUpdate = useCallback((key: string) => {
      const timestamp = new Date().toISOString();
      recentOptimisticUpdates.current.set(key, timestamp);
      setTimeout(() => {
          if (recentOptimisticUpdates.current.get(key) === timestamp) {
              recentOptimisticUpdates.current.delete(key);
          }
      }, 15000);
  }, []);
  
  // A ref to the full app state to avoid dependency issues in callbacks
  const fullStateRef = useRef<AppState>();
  useEffect(() => {
    fullStateRef.current = {
      // IAppData
      users, loginHistory, quests, questGroups, markets, rewardTypes, questCompletions,
      purchaseRequests, guilds, ranks, trophies, userTrophies, adminAdjustments, gameAssets,
      systemLogs, settings, themes, chatMessages, systemNotifications, scheduledEvents, bugReports,
      // AppState
      isDataLoaded, isAiConfigured, syncStatus, syncError,
      // UIState
      activePage, isSidebarCollapsed, isChatOpen, appMode, activeMarketId,
      // Derived
      allTags
    };
  }, [
      users, loginHistory, quests, questGroups, markets, rewardTypes, questCompletions, purchaseRequests,
      guilds, ranks, trophies, userTrophies, adminAdjustments, gameAssets, systemLogs, settings,
      themes, chatMessages, systemNotifications, scheduledEvents, bugReports, isDataLoaded,
      isAiConfigured, syncStatus, syncError, activePage, isSidebarCollapsed, isChatOpen,
      appMode, activeMarketId, allTags
  ]);


  const state = useMemo(() => ({
      users, quests, questGroups, markets, rewardTypes, questCompletions, purchaseRequests,
      guilds, ranks, trophies, userTrophies, adminAdjustments, gameAssets, systemLogs, settings,
      themes, chatMessages, systemNotifications, scheduledEvents, bugReports, isDataLoaded,
      isAiConfigured, syncStatus, syncError, activePage, isSidebarCollapsed, isChatOpen,
      appMode, activeMarketId, allTags, loginHistory
  }), [
      users, quests, questGroups, markets, rewardTypes, questCompletions, purchaseRequests,
      guilds, ranks, trophies, userTrophies, adminAdjustments, gameAssets, systemLogs, settings,
      themes, chatMessages, systemNotifications, scheduledEvents, bugReports, isDataLoaded,
      isAiConfigured, syncStatus, syncError, activePage, isSidebarCollapsed, isChatOpen,
      appMode, activeMarketId, allTags, loginHistory
  ]);

  const dispatch = useMemo(() => {
    const setActivePageStable = (page: Page) => {
        if (bugLogger.isRecording()) bugLogger.add({ type: 'NAVIGATION', message: `Navigated to ${page} page.`});
        _setActivePage(page);
    };
    const toggleSidebar = () => setIsSidebarCollapsed(prev => {
        const newState = !prev;
        localStorage.setItem('isSidebarCollapsed', String(newState));
        return newState;
    });
    const toggleChat = () => setIsChatOpen(prev => !prev);
    const setRanksStable = (newRanks: Rank[]) => setRanks(newRanks);

     const applyRewards = (userId: string, rewardsToApply: RewardItem[], guildId?: string) => {
        authDispatch.updateUser(userId, (u: User) => {
            const newUser = { ...u, 
                personalPurse: {...u.personalPurse},
                personalExperience: {...u.personalExperience},
                guildBalances: JSON.parse(JSON.stringify(u.guildBalances))
            };
            rewardsToApply.forEach(reward => {
                const rewardDef = rewardTypes.find(rt => rt.id === reward.rewardTypeId);
                if (!rewardDef) return;

                if (guildId) {
                    if (!newUser.guildBalances[guildId]) newUser.guildBalances[guildId] = { purse: {}, experience: {} };
                    const balanceSheet = newUser.guildBalances[guildId];
                    if (rewardDef.category === 'Currency') {
                        balanceSheet.purse[reward.rewardTypeId] = (balanceSheet.purse[reward.rewardTypeId] || 0) + reward.amount;
                    } else {
                        balanceSheet.experience[reward.rewardTypeId] = (balanceSheet.experience[reward.rewardTypeId] || 0) + reward.amount;
                    }
                } else {
                    if (rewardDef.category === 'Currency') {
                        newUser.personalPurse[reward.rewardTypeId] = (newUser.personalPurse[reward.rewardTypeId] || 0) + reward.amount;
                    } else {
                        newUser.personalExperience[reward.rewardTypeId] = (newUser.personalExperience[reward.rewardTypeId] || 0) + reward.amount;
                    }
                }
            });
            return newUser;
        });
    };

    const deductRewards = (userId: string, cost: RewardItem[], guildId?: string): boolean => {
        const user = users.find(u => u.id === userId);
        if (!user) return false;
        
        const balances = guildId ? user.guildBalances[guildId] : { purse: user.personalPurse, experience: user.personalExperience };
        if (!balances) return false;

        const canAfford = cost.every(item => {
            const rewardDef = rewardTypes.find(rt => rt.id === item.rewardTypeId);
            if (!rewardDef) return false;
            const balance = rewardDef.category === 'Currency' ? (balances.purse[item.rewardTypeId] || 0) : (balances.experience[item.rewardTypeId] || 0);
            return balance >= item.amount;
        });

        if (!canAfford) {
            addNotification({ type: 'error', message: "Insufficient funds." });
            return false;
        }

        authDispatch.updateUser(userId, u => {
            const newUser = { ...u, 
                personalPurse: {...u.personalPurse},
                personalExperience: {...u.personalExperience},
                guildBalances: JSON.parse(JSON.stringify(u.guildBalances))
            };
            cost.forEach(item => {
                const rewardDef = rewardTypes.find(rt => rt.id === item.rewardTypeId);
                if (!rewardDef) return;
                if (guildId) {
                    const balanceSheet = newUser.guildBalances[guildId];
                    if (rewardDef.category === 'Currency') balanceSheet.purse[item.rewardTypeId] -= item.amount;
                    else balanceSheet.experience[item.rewardTypeId] -= item.amount;
                } else {
                    if (rewardDef.category === 'Currency') newUser.personalPurse[item.rewardTypeId] -= item.amount;
                    else newUser.personalExperience[item.rewardTypeId] -= item.amount;
                }
            });
            return newUser;
        });
        return true;
    };

    // AppDispatch functions
    const addGuild = async (guild: Omit<Guild, 'id'>) => {
        const optimisticGuild = { ...guild, id: `temp-guild-${Date.now()}`, memberIds: guild.memberIds || [] };
        setGuilds(prev => [...prev, optimisticGuild]);
        try { const savedGuild = await apiRequest('POST', '/api/guilds', guild); setGuilds(prev => prev.map(g => g.id === optimisticGuild.id ? savedGuild : g)); } 
        catch { setGuilds(prev => prev.filter(g => g.id !== optimisticGuild.id)); }
    };
    const updateGuild = async (guild: Guild) => { registerOptimisticUpdate(`guild-${guild.id}`); apiRequest('PUT', `/api/guilds/${guild.id}`, guild).catch(() => {}); };
    const deleteGuild = async (guildId: string) => { apiRequest('DELETE', `/api/guilds/${guildId}`).catch(() => {}); };
    const addTrophy = (trophy: Omit<Trophy, 'id'>) => setTrophies(prev => [...prev, { ...trophy, id: `trophy-${Date.now()}` }]);
    const updateTrophy = (trophy: Trophy) => { registerOptimisticUpdate(`trophy-${trophy.id}`); setTrophies(prev => prev.map(t => t.id === trophy.id ? trophy : t)); };
    const addTheme = (theme: Omit<ThemeDefinition, 'id'>) => setThemes(p => [...p, { ...theme, id: `theme-${Date.now()}` }]);
    const updateTheme = (theme: ThemeDefinition) => { registerOptimisticUpdate(`theme-${theme.id}`); setThemes(p => p.map(t => t.id === theme.id ? theme : t)); };
    const deleteTheme = (themeId: string) => setThemes(p => p.filter(t => t.id !== themeId));
    const addScheduledEvent = async (event: Omit<ScheduledEvent, 'id'>) => { apiRequest('POST', '/api/events', event).catch(() => {}); };
    const updateScheduledEvent = async (event: ScheduledEvent) => { registerOptimisticUpdate(`scheduledEvent-${event.id}`); apiRequest('PUT', `/api/events/${event.id}`, event).catch(() => {}); };
    const deleteScheduledEvent = async (eventId: string) => { apiRequest('DELETE', `/api/events/${eventId}`).catch(() => {}); };
    const addBugReport = async (report: Omit<BugReport, 'id' | 'status' | 'tags'> & { reportType: BugReportType }) => {
        const { reportType, ...rest } = report;
        apiRequest('POST', '/api/bug-reports', { ...rest, status: 'Open', tags: [reportType] }).catch(() => {});
    };
    const updateBugReport = async (reportId: string, updates: Partial<BugReport>) => { registerOptimisticUpdate(`bugReport-${reportId}`); apiRequest('PUT', `/api/bug-reports/${reportId}`, updates).catch(() => {}); };
    const deleteBugReports = async (reportIds: string[]) => { apiRequest('DELETE', '/api/bug-reports', { ids: reportIds }).catch(() => {}); };
    const importBugReports = async (reports: BugReport[]) => { apiRequest('POST', '/api/bug-reports/import', reports).catch(() => {}); };
    const restoreFromBackup = async (backupData: IAppData) => { apiRequest('POST', '/api/data/restore', backupData).then(() => { addNotification({ type: 'success', message: 'Restore successful! App will reload.' }); setTimeout(() => window.location.reload(), 1500); }).catch(() => {}); };
    const clearAllHistory = () => { /* Server logic needed */ };
    const resetAllPlayerData = () => authDispatch.resetAllUsersData();
    const deleteAllCustomContent = () => { /* Server logic needed */ };
    const uploadFile = async (file: File, category?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        if (category) formData.append('category', category);
        try {
            const response = await fetch('/api/media/upload', { method: 'POST', body: formData });
            if (!response.ok) throw new Error('Upload failed');
            return await response.json();
        } catch { addNotification({type: 'error', message: 'File upload failed.'}); return null; }
    };
    const factoryReset = async () => { apiRequest('POST', '/api/data/factory-reset').then(() => { addNotification({ type: 'success', message: 'Factory reset initiated. The app will restart.' }); setTimeout(() => window.location.reload(), 2000); }).catch(() => {}); };
    const updateSettings = async (newSettings: Partial<AppSettings>) => { registerOptimisticUpdate('settings'); setSettings(prev => ({...prev, ...newSettings})); apiRequest('PUT', '/api/settings', {...settings, ...newSettings}).catch(() => {}); };
    const resetSettings = () => updateSettings(INITIAL_SETTINGS);
    const sendMessage = async (message: Omit<ChatMessage, 'id' | 'timestamp' | 'readBy' | 'senderId'> & { isAnnouncement?: boolean }) => {
        if (!currentUserRef.current) return;
        const notifId = addNotification({ message: 'Sending...', type: 'info', duration: 0 });
        try { await apiRequest('POST', '/api/chat/send', { ...message, senderId: currentUserRef.current.id }); updateNotification(notifId, { message: 'Message sent!', type: 'success', duration: 3000 }); }
        catch { updateNotification(notifId, { message: 'Failed to send.', type: 'error', duration: 5000 }); }
    };
    const markMessagesAsRead = (params: { partnerId?: string; guildId?: string; }) => { if (!currentUserRef.current) return; apiRequest('POST', '/api/chat/read', { ...params, userId: currentUserRef.current.id }).catch(() => {}); };
    const addSystemNotification = (notification: Omit<SystemNotification, 'id' | 'timestamp' | 'readByUserIds'>) => { if (!notification.recipientUserIds || notification.recipientUserIds.length === 0) return; setSystemNotifications(prev => [...prev, { id: `sysnotif-${Date.now()}`, timestamp: new Date().toISOString(), readByUserIds: [], ...notification }]); };
    const markSystemNotificationsAsRead = (notificationIds: string[]) => { if (!currentUserRef.current) return; const id = currentUserRef.current.id; setSystemNotifications(prev => prev.map(n => notificationIds.includes(n.id) && !n.readByUserIds.includes(id) ? { ...n, readByUserIds: [...n.readByUserIds, id] } : n)); };
    const awardTrophy = (userId: string, trophyId: string, guildId?: string) => {
      const t = trophies.find(trophy => trophy.id === trophyId);
      if (t) {
        setUserTrophies(p => [...p, { id: `award-${Date.now()}`, userId, trophyId, awardedAt: new Date().toISOString(), guildId }]);
        addNotification({ type: 'trophy', message: `Trophy Unlocked: ${t.name}!`, icon: t.icon });
        addSystemNotification({ type: SystemNotificationType.TrophyAwarded, message: `You unlocked a new trophy: "${t.name}"!`, recipientUserIds: [userId], guildId, icon: t.icon, link: 'Trophies' });
      }
    };
    const applyManualAdjustment = (adj: Omit<AdminAdjustment, 'id'|'adjustedAt'>): boolean => {
      const fullAdj = {...adj, id: `adj-${Date.now()}`, adjustedAt: new Date().toISOString() };
      setAdminAdjustments(p => [...p, fullAdj]);
      if (adj.type === AdminAdjustmentType.Trophy && adj.trophyId) awardTrophy(adj.userId, adj.trophyId, adj.guildId);
      else if (adj.type === AdminAdjustmentType.Reward) applyRewards(adj.userId, adj.rewards, adj.guildId);
      else if (adj.type === AdminAdjustmentType.Setback) deductRewards(adj.userId, adj.setbacks, adj.guildId);
      return true;
    };
    
    // QuestDispatch functions
    const updateQuest = (updatedQuest: Quest) => { registerOptimisticUpdate(`quest-${updatedQuest.id}`); apiRequest('PUT', `/api/quests/${updatedQuest.id}`, updatedQuest).catch(() => {}); };
    const addQuest = (quest: Omit<Quest, 'id'|'claimedByUserIds'|'dismissals'>) => { apiRequest('POST', '/api/quests', quest).catch(() => {}); };
    const deleteQuest = (questId: string) => { apiRequest('DELETE', '/api/quests', { ids: [questId] }).catch(() => {}); };
    const cloneQuest = (questId: string) => { apiRequest('POST', `/api/quests/clone/${questId}`).catch(() => {}); };
    const dismissQuest = (questId: string, userId: string) => { const q = quests.find(q=>q.id===questId); if(q) updateQuest({...q, dismissals: [...q.dismissals, { userId, dismissedAt: new Date().toISOString() }]}); };
    const claimQuest = (questId: string, userId: string) => { const q = quests.find(q=>q.id===questId); if(q) updateQuest({...q, claimedByUserIds: [...(q.claimedByUserIds || []), userId]}); };
    const releaseQuest = (questId: string, userId: string) => { const q = quests.find(q=>q.id===questId); if(q) updateQuest({...q, claimedByUserIds: (q.claimedByUserIds || []).filter(id => id !== userId)}); };
    const markQuestAsTodo = (questId: string, userId: string) => { const q = quests.find(q=>q.id===questId); if(q) updateQuest({ ...q, todoUserIds: [...(q.todoUserIds || []), userId] }); };
    const unmarkQuestAsTodo = (questId: string, userId: string) => { const q = quests.find(q=>q.id===questId); if(q) updateQuest({ ...q, todoUserIds: (q.todoUserIds || []).filter(id => id !== userId) }); };
    const completeQuest = async (completionData: any) => { registerOptimisticUpdate(`user-${completionData.userId}`); apiRequest('POST', '/api/actions/complete-quest', { completionData }).catch(() => {}); };
    const approveQuestCompletion = async (completionId: string, note?: string) => { registerOptimisticUpdate(`questCompletion-${completionId}`); apiRequest('POST', `/api/actions/approve-quest/${completionId}`, { note }).catch(() => {}); };
    const rejectQuestCompletion = async (completionId: string, note?: string) => { registerOptimisticUpdate(`questCompletion-${completionId}`); apiRequest('POST', `/api/actions/reject-quest/${completionId}`, { note }).catch(() => {}); };
    const addQuestGroup = (group: Omit<QuestGroup, 'id'>) => { const newGroup = { ...group, id: `qg-${Date.now()}` }; setQuestGroups(prev => [...prev, newGroup]); return newGroup; };
    const updateQuestGroup = (group: QuestGroup) => { registerOptimisticUpdate(`questGroup-${group.id}`); setQuestGroups(prev => prev.map(g => g.id === group.id ? group : g)); };
    const deleteQuestGroup = (groupId: string) => { setQuestGroups(prev => prev.filter(g => g.id !== groupId)); setQuests(prev => prev.map(q => q.groupId === groupId ? { ...q, groupId: undefined } : q)); };
    const deleteQuestGroups = (groupIds: string[]) => {
      setQuestGroups(prev => prev.filter(g => !groupIds.includes(g.id)));
      setQuests(prev => prev.map(q => q.groupId && groupIds.includes(q.groupId) ? { ...q, groupId: undefined } : q));
    };
    
    // Economy Functions
    // ...
    return {
      setUsers: authDispatch.setUsers, setLoginHistory: authDispatch.setLoginHistory,
      setQuests, setQuestGroups, setQuestCompletions, setMarkets, setRewardTypes,
      setPurchaseRequests, setGameAssets, setActivePage: setActivePageStable, toggleSidebar,
      toggleChat, setAppMode, setActiveMarketId, addGuild, updateGuild, deleteGuild,
      setRanks: setRanksStable, addTrophy, updateTrophy, awardTrophy, applyManualAdjustment,
      addTheme, updateTheme, deleteTheme, addScheduledEvent, updateScheduledEvent, deleteScheduledEvent,
      addBugReport, updateBugReport, deleteBugReports, importBugReports, restoreFromBackup,
      clearAllHistory, resetAllPlayerData: resetAllPlayerData, deleteAllCustomContent, deleteSelectedAssets: (selection: Partial<Record<ShareableAssetType, string[]>>, onComplete?: () => void) => Promise.resolve(), uploadFile, factoryReset,
      updateSettings, resetSettings, sendMessage, markMessagesAsRead, addSystemNotification,
      markSystemNotificationsAsRead, triggerSync: performDeltaSync, registerOptimisticUpdate,
      addQuest, updateQuest, deleteQuest, cloneQuest, dismissQuest, claimQuest, releaseQuest,
      markQuestAsTodo, unmarkQuestAsTodo, completeQuest, approveQuestCompletion, rejectQuestCompletion,
      addQuestGroup, updateQuestGroup, deleteQuestGroup, deleteQuestGroups, assignQuestGroupToUsers: (groupId: string, userIds: string[]) => {},
      deleteQuests: (questIds: string[]) => {}, updateQuestsStatus: (questIds: string[], isActive: boolean) => {}, bulkUpdateQuests: (questIds: string[], updates: BulkQuestUpdates) => {},
      addRewardType: (rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => Promise.resolve(), updateRewardType: (rewardType: RewardTypeDefinition) => Promise.resolve(), deleteRewardType: (rewardTypeId: string) => Promise.resolve(), cloneRewardType: (rewardTypeId: string) => Promise.resolve(),
      addMarket: (market: Omit<Market, 'id'>) => Promise.resolve(), updateMarket: (market: Market) => Promise.resolve(), deleteMarket: (marketId: string) => Promise.resolve(), cloneMarket: (marketId: string) => Promise.resolve(),
      deleteMarkets: (marketIds: string[]) => Promise.resolve(), updateMarketsStatus: (marketIds: string[], statusType: 'open' | 'closed') => Promise.resolve(),
      addGameAsset: (asset: Omit<GameAsset, 'id' | 'creatorId' | 'createdAt' | 'purchaseCount'>) => Promise.resolve(), updateGameAsset: (asset: GameAsset) => Promise.resolve(), cloneGameAsset: (assetId: string) => Promise.resolve(),
      deleteGameAssets: (assetIds: string[]) => Promise.resolve(), purchaseMarketItem: (assetId: string, marketId: string, user: User, costGroupIndex: number, scheduledEvents: ScheduledEvent[]) => {}, cancelPurchaseRequest: (purchaseId: string) => {},
      approvePurchaseRequest: (purchaseId: string) => {}, rejectPurchaseRequest: (purchaseId: string) => {}, applyRewards, deductRewards,
      executeExchange: (userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => Promise.resolve(), importAssetPack: (assetPack: AssetPack, resolutions: ImportResolution[], allData: IAppData) => Promise.resolve(),
    };
  }, [
    authDispatch, addNotification, updateNotification, quests, users, rewardTypes,
    guilds, ranks, trophies, userTrophies, adminAdjustments, gameAssets, systemLogs, settings,
    themes, chatMessages, systemNotifications, scheduledEvents, bugReports, questGroups, questCompletions,
    markets, purchaseRequests, loginHistory, performDeltaSync, registerOptimisticUpdate
  ]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
};

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