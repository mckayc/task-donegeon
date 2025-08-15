

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppSettings, User, Quest, RewardItem, Guild, Rank, Trophy, UserTrophy, AppMode, Page, IAppData, ShareableAssetType, GameAsset, Role, RewardCategory, AdminAdjustment, AdminAdjustmentType, SystemLog, QuestType, QuestAvailability, AssetPack, ImportResolution, TrophyRequirementType, ThemeDefinition, ChatMessage, SystemNotification, SystemNotificationType, MarketStatus, QuestGroup, BulkQuestUpdates, ScheduledEvent, BugReport, QuestCompletion, BugReportType, PurchaseRequest, PurchaseRequestStatus, Market, RewardTypeDefinition, Rotation, SidebarConfigItem } from '../types';
import { INITIAL_SETTINGS, INITIAL_RANKS, INITIAL_TROPHIES, INITIAL_THEMES } from '../data/initialData';
import { useNotificationsDispatch } from './NotificationsContext';
import { useAuthState, useAuthDispatch } from './AuthContext';
import { bugLogger } from '../utils/bugLogger';
import { toYMD } from '../utils/quests';
import { getFinalCostGroups } from '../utils/markets';

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
  setRotations: React.Dispatch<React.SetStateAction<Rotation[]>>;

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
  setRanks: React.Dispatch<React.SetStateAction<Rank[]>>;
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
  importBugReports: (reports: BugReport[], mode: 'merge' | 'replace') => Promise<void>;
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
  applySettingsUpdates: () => void;
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
  bulkUpdateQuests: (questIds: string[], updates: BulkQuestUpdates) => Promise<void>;
  addRotation: (rotation: Omit<Rotation, 'id'>) => Promise<void>;
  updateRotation: (rotation: Rotation) => Promise<void>;
  deleteRotation: (rotationId: string) => Promise<void>;

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
  purchaseMarketItem: (assetId: string, marketId: string, user: User, costGroupIndex: number) => void;
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
  const [rotations, setRotations] = useState<Rotation[]>([]);
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
          processDelta('rotation', dataToSet.rotations, setRotations);

          if (dataToSet.loginHistory) authDispatch.setLoginHistory(dataToSet.loginHistory);
      } else { // Full data load
          const savedSettings: Partial<AppSettings> = dataToSet.settings || {};
          const loadedSettings: AppSettings = { ...INITIAL_SETTINGS, ...savedSettings,
              questDefaults: { ...INITIAL_SETTINGS.questDefaults, ...(savedSettings.questDefaults || {}) },
              security: { ...INITIAL_SETTINGS.security, ...(savedSettings.security || {}) },
              sharedMode: { ...INITIAL_SETTINGS.sharedMode, ...(savedSettings.sharedMode || {}) },
              automatedBackups: { ...INITIAL_SETTINGS.automatedBackups, ...(savedSettings.automatedBackups || {}) },
              loginNotifications: { ...INITIAL_SETTINGS.loginNotifications, ...(savedSettings.loginNotifications || {}) },
              googleCalendar: { ...INITIAL_SETTINGS.googleCalendar, ...(savedSettings.googleCalendar || {}) },
              developerMode: { ...INITIAL_SETTINGS.developerMode, ...(savedSettings.developerMode || {}) },
              chat: { ...INITIAL_SETTINGS.chat, ...(savedSettings.chat || {}) },
              terminology: { ...INITIAL_SETTINGS.terminology, ...(savedSettings.terminology || {}) },
              rewardValuation: { ...INITIAL_SETTINGS.rewardValuation, ...(savedSettings.rewardValuation || {}) },
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
          setRotations(dataToSet.rotations || []);
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
      rotations,
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
      themes, chatMessages, systemNotifications, scheduledEvents, bugReports, rotations, isDataLoaded,
      isAiConfigured, syncStatus, syncError, activePage, isSidebarCollapsed, isChatOpen,
      appMode, activeMarketId, allTags
  ]);


  const state = useMemo(() => ({
      users, quests, questGroups, markets, rewardTypes, questCompletions, purchaseRequests,
      guilds, ranks, trophies, userTrophies, adminAdjustments, gameAssets, systemLogs, settings,
      themes, chatMessages, systemNotifications, scheduledEvents, bugReports, rotations, isDataLoaded,
      isAiConfigured, syncStatus, syncError, activePage, isSidebarCollapsed, isChatOpen,
      appMode, activeMarketId, allTags, loginHistory
  }), [
      users, quests, questGroups, markets, rewardTypes, questCompletions, purchaseRequests,
      guilds, ranks, trophies, userTrophies, adminAdjustments, gameAssets, systemLogs, settings,
      themes, chatMessages, systemNotifications, scheduledEvents, bugReports, rotations, isDataLoaded,
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

     const applyRewards = (userId: string, rewardsToApply: RewardItem[], guildId?: string) => {
        authDispatch.updateUser(userId, (u: User) => {
            const newUser = { ...u, 
                personalPurse: {...(u.personalPurse || {})},
                personalExperience: {...(u.personalExperience || {})},
                guildBalances: JSON.parse(JSON.stringify(u.guildBalances || {}))
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
            return {
                personalPurse: newUser.personalPurse,
                personalExperience: newUser.personalExperience,
                guildBalances: newUser.guildBalances
            };
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
            const balance = rewardDef.category === 'Currency' ? (balances.purse?.[item.rewardTypeId] || 0) : (balances.experience?.[item.rewardTypeId] || 0);
            return balance >= item.amount;
        });

        if (!canAfford) {
            addNotification({ type: 'error', message: "Insufficient funds." });
            return false;
        }

        authDispatch.updateUser(userId, u => {
            const newPurse = { ...(u.personalPurse || {}) };
            const newExperience = { ...(u.personalExperience || {}) };
            const newGuildBalances = JSON.parse(JSON.stringify(u.guildBalances || {}));
            cost.forEach(item => {
                const rewardDef = rewardTypes.find(rt => rt.id === item.rewardTypeId);
                if (!rewardDef) return;
                if (guildId) {
                    const balanceSheet = newGuildBalances[guildId];
                    if (rewardDef.category === 'Currency') balanceSheet.purse[item.rewardTypeId] -= item.amount;
                    else balanceSheet.experience[item.rewardTypeId] -= item.amount;
                } else {
                    if (rewardDef.category === 'Currency') newPurse[item.rewardTypeId] -= item.amount;
                    else newExperience[item.rewardTypeId] -= item.amount;
                }
            });
            return {
                personalPurse: newPurse,
                personalExperience: newExperience,
                guildBalances: newGuildBalances
            };
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
        try {
            const savedReport = await apiRequest('POST', '/api/bug-reports', { ...rest, status: 'Open', tags: [reportType] });
            if (savedReport) {
                setBugReports(prev => [savedReport, ...prev].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            }
        } catch(e) {
            // apiRequest will show a notification
        }
    };
    const updateBugReport = async (reportId: string, updates: Partial<BugReport>) => {
        registerOptimisticUpdate(`bugReport-${reportId}`);
        setBugReports(prev => prev.map(r => r.id === reportId ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r));
        try {
            const updatedReportFromServer = await apiRequest('PUT', `/api/bug-reports/${reportId}`, updates);
            setBugReports(prev => prev.map(r => r.id === reportId ? updatedReportFromServer : r));
        } catch (e) {
            performDeltaSync(); // Revert optimistic update on failure by re-syncing with the server
        }
    };
    const deleteBugReports = async (reportIds: string[]) => {
        const originalReports = bugReports;
        setBugReports(prev => prev.filter(r => !reportIds.includes(r.id)));
        try {
            await apiRequest('DELETE', '/api/bug-reports', { ids: reportIds });
        } catch (e) {
            setBugReports(originalReports);
        }
    };
    const importBugReports = async (reports: BugReport[], mode: 'merge' | 'replace') => {
        try {
            const updatedReports = await apiRequest('POST', '/api/bug-reports/import', { reports, mode });
            if (updatedReports) {
                setBugReports(updatedReports);
            }
            addNotification({ type: 'success', message: 'Import successful!' });
        } catch(e) {
            // apiRequest handles notification
        }
    };
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
    const applySettingsUpdates = () => {
        const newSettings = JSON.parse(JSON.stringify(settings)); // Deep copy

        // Merge top-level objects, prioritizing user's existing values
        const objectsToMerge: (keyof AppSettings)[] = [
            'questDefaults', 'security', 'sharedMode', 'automatedBackups',
            'loginNotifications', 'googleCalendar', 'developerMode',
            'chat', 'terminology', 'rewardValuation'
        ];

        objectsToMerge.forEach(key => {
            if (typeof newSettings[key] === 'object' && !Array.isArray(newSettings[key]) && newSettings[key] !== null) {
                (newSettings[key] as any) = { ...(INITIAL_SETTINGS[key] || {}), ...(newSettings[key] || {}) };
            }
        });

        // Special handling for sidebar to preserve user customizations but add new links
        const userItemsById = new Map(
            (newSettings.sidebars.main || []).map((item: SidebarConfigItem) => [item.id, item])
        );
        
        const finalSidebar = INITIAL_SETTINGS.sidebars.main.map((defaultItem: SidebarConfigItem) => {
            if (userItemsById.has(defaultItem.id)) {
                const userItem = userItemsById.get(defaultItem.id);
                // Combine, giving user's customization precedence
                return { ...defaultItem, ...(userItem || {}) };
            }
            // It's a new item, add it as is
            return defaultItem;
        });

        newSettings.sidebars.main = finalSidebar;

        // Now call the existing update function
        updateSettings(newSettings);
        addNotification({type: 'success', message: 'Feature updates applied successfully!'});
    };
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
      if (adj.type === AdminAdjustmentType.Setback) {
        if (!deductRewards(adj.userId, adj.setbacks, adj.guildId)) {
            return false; // Deduction failed, so don't log the adjustment.
        }
      }
      
      const fullAdj = {...adj, id: `adj-${Date.now()}`, adjustedAt: new Date().toISOString() };
      setAdminAdjustments(p => [...p, fullAdj]);
      
      if (adj.type === AdminAdjustmentType.Trophy && adj.trophyId) {
        awardTrophy(adj.userId, adj.trophyId, adj.guildId);
      } else if (adj.type === AdminAdjustmentType.Reward) {
        applyRewards(adj.userId, adj.rewards, adj.guildId);
      }
      return true;
    };
    const deleteSelectedAssets = async (selection: Partial<Record<ShareableAssetType, string[]>>, onComplete?: () => void) => {
      for (const [assetType, ids] of Object.entries(selection)) {
        if (ids && ids.length > 0) {
          try {
            await apiRequest('DELETE', `/api/${assetType}`, { ids });
          } catch (error) { console.error(`Failed to delete ${assetType}:`, error); }
        }
      }
      addNotification({ type: 'success', message: 'Selected assets have been deleted.' });
      if (onComplete) onComplete();
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
    const assignQuestGroupToUsers = (groupId: string, userIds: string[]) => {
      const questsToUpdate = quests.filter(q => q.groupId === groupId);
      questsToUpdate.forEach(q => {
        const newAssigned = Array.from(new Set([...q.assignedUserIds, ...userIds]));
        updateQuest({ ...q, assignedUserIds: newAssigned });
      });
    };
    const deleteQuests = (questIds: string[]) => { apiRequest('DELETE', '/api/quests', { ids: questIds }).catch(() => {}); };
    const updateQuestsStatus = (questIds: string[], isActive: boolean) => { apiRequest('PUT', '/api/quests/bulk-status', { ids: questIds, isActive }).catch(() => {}); };
    const bulkUpdateQuests = async (questIds: string[], updates: BulkQuestUpdates) => { await apiRequest('PUT', '/api/quests/bulk-update', { ids: questIds, updates }); };
    const addRotation = async (rotation: Omit<Rotation, 'id'>) => { apiRequest('POST', '/api/rotations', rotation).catch(() => {}); };
    const updateRotation = async (rotation: Rotation) => { registerOptimisticUpdate(`rotation-${rotation.id}`); apiRequest('PUT', `/api/rotations/${rotation.id}`, rotation).catch(() => {}); };
    const deleteRotation = async (rotationId: string) => { apiRequest('DELETE', `/api/rotations/${rotationId}`).catch(() => {}); };
    
    // Economy Functions
    const addRewardType = async (rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => { apiRequest('POST', '/api/reward-types', rewardType).catch(() => {}); };
    const updateRewardType = async (rewardType: RewardTypeDefinition) => { registerOptimisticUpdate(`rewardType-${rewardType.id}`); apiRequest('PUT', `/api/reward-types/${rewardType.id}`, rewardType).catch(() => {}); };
    const deleteRewardType = async (rewardTypeId: string) => { apiRequest('DELETE', '/api/reward-types', { ids: [rewardTypeId] }).catch(() => {}); };
    const cloneRewardType = async (rewardTypeId: string) => { apiRequest('POST', `/api/reward-types/clone/${rewardTypeId}`).catch(() => {}); };
    const addMarket = async (market: Omit<Market, 'id'>) => { apiRequest('POST', '/api/markets', market).catch(() => {}); };
    const updateMarket = async (market: Market) => { registerOptimisticUpdate(`market-${market.id}`); apiRequest('PUT', `/api/markets/${market.id}`, market).catch(() => {}); };
    const deleteMarket = async (marketId: string) => { apiRequest('DELETE', '/api/markets', { ids: [marketId] }).catch(() => {}); };
    const cloneMarket = async (marketId: string) => { apiRequest('POST', `/api/markets/clone/${marketId}`).catch(() => {}); };
    const deleteMarkets = async (marketIds: string[]) => { apiRequest('DELETE', '/api/markets', { ids: marketIds }).catch(() => {}); };
    const updateMarketsStatus = async (marketIds: string[], statusType: 'open' | 'closed') => { apiRequest('PUT', '/api/markets/bulk-status', { ids: marketIds, statusType }).catch(() => {}); };
    const addGameAsset = async (asset: Omit<GameAsset, 'id' | 'creatorId' | 'createdAt' | 'purchaseCount'>) => { apiRequest('POST', '/api/assets', asset).catch(() => {}); };
    const updateGameAsset = async (asset: GameAsset) => { registerOptimisticUpdate(`gameAsset-${asset.id}`); apiRequest('PUT', `/api/assets/${asset.id}`, asset).catch(() => {}); };
    const cloneGameAsset = async (assetId: string) => { apiRequest('POST', `/api/assets/clone/${assetId}`).catch(() => {}); };
    const deleteGameAssets = async (assetIds: string[]) => { apiRequest('DELETE', '/api/assets', { ids: assetIds }).catch(() => {}); };
    const purchaseMarketItem = (assetId: string, marketId: string, user: User, costGroupIndex: number) => {
      const asset = gameAssets.find(a => a.id === assetId);
      if (!asset) { addNotification({ type: 'error', message: 'Item not found.' }); return; }

      const finalCostGroups = getFinalCostGroups(asset.costGroups, marketId, assetId, scheduledEvents);
      const cost = finalCostGroups[costGroupIndex];
      if (!cost) { addNotification({ type: 'error', message: 'Invalid cost selection.' }); return; }

      const guildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
      const canAfford = cost.every(item => {
        const balances = guildId ? user.guildBalances[guildId] : { purse: user.personalPurse, experience: user.personalExperience };
        if (!balances) return false;
        const rewardDef = rewardTypes.find(rt => rt.id === item.rewardTypeId);
        const balance = rewardDef?.category === RewardCategory.Currency ? (balances.purse[item.rewardTypeId] || 0) : (balances.experience[item.rewardTypeId] || 0);
        return balance >= item.amount;
      });

      if (!canAfford) { addNotification({ type: 'error', message: "You can't afford this item." }); return; }

      if (asset.requiresApproval) {
        const newRequest: PurchaseRequest = {
          id: `pr-${Date.now()}`,
          userId: user.id,
          assetId: asset.id,
          requestedAt: new Date().toISOString(),
          status: PurchaseRequestStatus.Pending,
          assetDetails: { name: asset.name, description: asset.description, cost },
          guildId,
        };
        setPurchaseRequests(prev => [...prev, newRequest]);
        addNotification({ type: 'info', message: 'Purchase requested. Awaiting approval.' });
      } else {
        if (deductRewards(user.id, cost, guildId)) {
            authDispatch.updateUser(user.id, u => ({ ownedAssetIds: [...(u.ownedAssetIds || []), asset.id] }));
            updateGameAsset({ ...asset, purchaseCount: asset.purchaseCount + 1 });
            addNotification({ type: 'success', message: `Purchased ${asset.name}!` });
        }
      }
    };
    const cancelPurchaseRequest = (purchaseId: string) => { setPurchaseRequests(p => p.map(req => req.id === purchaseId ? { ...req, status: PurchaseRequestStatus.Cancelled, actedAt: new Date().toISOString() } : req)); };
    const approvePurchaseRequest = (purchaseId: string) => {
      const request = purchaseRequests.find(r => r.id === purchaseId);
      if (!request) return;
      if (deductRewards(request.userId, request.assetDetails.cost, request.guildId)) {
        authDispatch.updateUser(request.userId, u => ({ ownedAssetIds: [...(u.ownedAssetIds || []), request.assetId] }));
        setGameAssets(p => p.map(a => a.id === request.assetId ? { ...a, purchaseCount: a.purchaseCount + 1 } : a));
        setPurchaseRequests(p => p.map(req => req.id === purchaseId ? { ...req, status: PurchaseRequestStatus.Completed, actedAt: new Date().toISOString() } : req));
      } else {
        addNotification({type:'error', message: 'User could not afford this item at time of approval.'});
      }
    };
    const rejectPurchaseRequest = (purchaseId: string) => { setPurchaseRequests(p => p.map(req => req.id === purchaseId ? { ...req, status: PurchaseRequestStatus.Rejected, actedAt: new Date().toISOString() } : req)); };
    const executeExchange = async (userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => { apiRequest('POST', '/api/actions/execute-exchange', { userId, payItem, receiveItem, guildId }).catch(() => {}); };
    const importAssetPack = async (assetPack: AssetPack, resolutions: ImportResolution[], allData: IAppData) => { apiRequest('POST', '/api/data/import-assets', { assetPack, resolutions }).catch(() => {}); };
    
    return {
      setUsers: authDispatch.setUsers, setLoginHistory: authDispatch.setLoginHistory,
      setQuests, setQuestGroups, setQuestCompletions, setMarkets, setRewardTypes,
      setPurchaseRequests, setGameAssets, setActivePage: setActivePageStable, toggleSidebar,
      toggleChat, setAppMode, setActiveMarketId, addGuild, updateGuild, deleteGuild,
      setRanks, addTrophy, updateTrophy, awardTrophy, applyManualAdjustment,
      addTheme, updateTheme, deleteTheme, addScheduledEvent, updateScheduledEvent, deleteScheduledEvent,
      addBugReport, updateBugReport, deleteBugReports, importBugReports, restoreFromBackup,
      clearAllHistory, resetAllPlayerData, deleteAllCustomContent, deleteSelectedAssets, uploadFile, factoryReset,
      updateSettings, resetSettings, applySettingsUpdates, sendMessage, markMessagesAsRead, addSystemNotification,
      markSystemNotificationsAsRead, triggerSync: performDeltaSync, registerOptimisticUpdate,
      addQuest, updateQuest, deleteQuest, cloneQuest, dismissQuest, claimQuest, releaseQuest,
      markQuestAsTodo, unmarkQuestAsTodo, completeQuest, approveQuestCompletion, rejectQuestCompletion,
      addQuestGroup, updateQuestGroup, deleteQuestGroup, deleteQuestGroups, assignQuestGroupToUsers,
      deleteQuests, updateQuestsStatus, bulkUpdateQuests, addRotation, updateRotation, deleteRotation,
      addRewardType, updateRewardType, deleteRewardType, cloneRewardType,
      addMarket, updateMarket, deleteMarket, cloneMarket, deleteMarkets, updateMarketsStatus,
      addGameAsset, updateGameAsset, cloneGameAsset, deleteGameAssets, purchaseMarketItem, cancelPurchaseRequest,
      approvePurchaseRequest, rejectPurchaseRequest, applyRewards, deductRewards,
      executeExchange, importAssetPack, setRotations,
    };
  }, [
    authDispatch, addNotification, updateNotification, quests, users, rewardTypes,
    guilds, ranks, trophies, userTrophies, adminAdjustments, gameAssets, systemLogs, settings,
    themes, chatMessages, systemNotifications, scheduledEvents, bugReports, questGroups, questCompletions,
    markets, purchaseRequests, loginHistory, performDeltaSync, registerOptimisticUpdate, appMode, rotations
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
