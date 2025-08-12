

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppSettings, User, Quest, RewardItem, Guild, Rank, Trophy, UserTrophy, AppMode, Page, IAppData, ShareableAssetType, GameAsset, Role, RewardCategory, AdminAdjustment, AdminAdjustmentType, SystemLog, QuestType, QuestAvailability, AssetPack, ImportResolution, TrophyRequirementType, ThemeDefinition, ChatMessage, SystemNotification, SystemNotificationType, MarketStatus, QuestGroup, BulkQuestUpdates, ScheduledEvent, BugReport, QuestCompletion, BugReportType, PurchaseRequest, PurchaseRequestStatus, Market, RewardTypeDefinition, QuestCompletionStatus } from '../types';
import { INITIAL_SETTINGS, INITIAL_RANKS, INITIAL_TROPHIES, INITIAL_THEMES } from '../data/initialData';
import { useNotificationsDispatch } from './NotificationsContext';
import { bugLogger } from '../utils/bugLogger';
import { toYMD } from '../utils/quests';

// Combine all state interfaces
interface AppState extends IAppData {
  isDataLoaded: boolean;
  isAiConfigured: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncError: string | null;
  currentUser: User | null;
  isAppUnlocked: boolean;
  isFirstRun: boolean;
  isSwitchingUser: boolean;
  isSharedViewActive: boolean;
  targetedUserForLogin: User | null;
  allTags: string[];
}

// Combine all dispatch interfaces
interface AppDispatch {
  // Game Data & Admin
  addGuild: (guild: Omit<Guild, 'id'>) => void;
  updateGuild: (guild: Guild) => void;
  deleteGuild: (guildId: string) => void;
  setRanks: (ranks: Rank[]) => void;
  addTrophy: (trophy: Omit<Trophy, 'id'>) => void;
  updateTrophy: (trophy: Trophy) => void;
  awardTrophy: (userId: string, trophyId: string, guildId?: string) => void;
  applyManualAdjustment: (adjustment: Omit<AdminAdjustment, 'id' | 'adjustedAt'>) => boolean;
  addTheme: (theme: Omit<ThemeDefinition, 'id'>) => void;
  updateTheme: (theme: ThemeDefinition) => void;
  deleteTheme: (themeId: string) => void;
  addScheduledEvent: (event: Omit<ScheduledEvent, 'id'>) => void;
  updateScheduledEvent: (event: ScheduledEvent) => void;
  deleteScheduledEvent: (eventId: string) => void;
  addBugReport: (report: Omit<BugReport, 'id' | 'status' | 'tags'> & { reportType: BugReportType }) => void;
  updateBugReport: (reportId: string, updates: Partial<BugReport>) => void;
  deleteBugReports: (reportIds: string[]) => void;
  importBugReports: (reports: BugReport[]) => void;
  restoreFromBackup: (backupData: IAppData) => void;
  clearAllHistory: () => void;
  resetAllPlayerData: () => void;
  deleteAllCustomContent: () => void;
  deleteSelectedAssets: (selection: Partial<Record<ShareableAssetType, string[]>>, onComplete: () => void) => void;
  uploadFile: (file: File, category?: string) => Promise<{ url: string } | null>;
  factoryReset: () => void;

  // Settings & System
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  sendMessage: (message: Omit<ChatMessage, 'id' | 'timestamp' | 'readBy' | 'senderId'> & { isAnnouncement?: boolean }) => void;
  markMessagesAsRead: (params: { partnerId?: string; guildId?: string; }) => void;
  addSystemNotification: (notification: Omit<SystemNotification, 'id' | 'timestamp' | 'readByUserIds'>) => void;
  markSystemNotificationsAsRead: (notificationIds: string[]) => void;
  triggerSync: () => void;
  
  // Auth
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setLoginHistory: React.Dispatch<React.SetStateAction<string[]>>;
  addUser: (userData: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>) => Promise<User | null>;
  updateUser: (userId: string, update: Partial<User> | ((user: User) => User), persist?: boolean) => void;
  deleteUsers: (userIds: string[]) => void;
  setCurrentUser: (user: User | null) => void;
  markUserAsOnboarded: (userId: string) => void;
  setAppUnlocked: (isUnlocked: boolean) => void;
  setIsSwitchingUser: (isSwitching: boolean) => void;
  setTargetedUserForLogin: (user: User | null) => void;
  exitToSharedView: () => void;
  setIsSharedViewActive: (isActive: boolean) => void;
  resetAllUsersData: () => void;
  completeFirstRun: (adminUserData: any) => void;

  // Economy
  setMarkets: React.Dispatch<React.SetStateAction<Market[]>>;
  setRewardTypes: React.Dispatch<React.SetStateAction<RewardTypeDefinition[]>>;
  setPurchaseRequests: React.Dispatch<React.SetStateAction<PurchaseRequest[]>>;
  setGameAssets: React.Dispatch<React.SetStateAction<GameAsset[]>>;
  addRewardType: (rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => void;
  updateRewardType: (rewardType: RewardTypeDefinition) => void;
  deleteRewardType: (rewardTypeId: string) => void;
  cloneRewardType: (rewardTypeId: string) => void;
  addMarket: (market: Omit<Market, 'id'>) => void;
  updateMarket: (market: Market) => void;
  deleteMarket: (marketId: string) => void;
  cloneMarket: (marketId: string) => void;
  deleteMarkets: (marketIds: string[]) => void;
  updateMarketsStatus: (marketIds: string[], statusType: 'open' | 'closed') => void;
  addGameAsset: (asset: Omit<GameAsset, 'id' | 'creatorId' | 'createdAt' | 'purchaseCount'>) => void;
  updateGameAsset: (asset: GameAsset) => void;
  deleteGameAsset: (assetId: string) => void;
  cloneGameAsset: (assetId: string) => void;
  deleteGameAssets: (assetIds: string[]) => void;
  purchaseMarketItem: (assetId: string, marketId: string, user: User, costGroupIndex: number, scheduledEvents: ScheduledEvent[]) => void;
  cancelPurchaseRequest: (purchaseId: string) => void;
  approvePurchaseRequest: (purchaseId: string) => void;
  rejectPurchaseRequest: (purchaseId: string) => void;
  applyRewards: (userId: string, rewardsToApply: RewardItem[], guildId?: string, persist?: boolean) => void;
  deductRewards: (userId: string, cost: RewardItem[], guildId?: string, persist?: boolean) => Promise<boolean>;
  executeExchange: (userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => void;
  importAssetPack: (assetPack: AssetPack, resolutions: ImportResolution[], allData: IAppData) => Promise<void>;

  // Quests
  setQuests: React.Dispatch<React.SetStateAction<Quest[]>>;
  setQuestGroups: React.Dispatch<React.SetStateAction<QuestGroup[]>>;
  setQuestCompletions: React.Dispatch<React.SetStateAction<QuestCompletion[]>>;
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

  // === ALL APP STATE ===
  // Auth
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, _setCurrentUser] = useState<User | null>(null);
  const [isAppUnlocked, _setAppUnlocked] = useState<boolean>(() => localStorage.getItem('isAppUnlocked') === 'true');
  const [isSwitchingUser, setIsSwitchingUser] = useState<boolean>(false);
  const [isSharedViewActive, setIsSharedViewActive] = useState(false);
  const [targetedUserForLogin, setTargetedUserForLogin] = useState<User | null>(null);
  const [loginHistory, setLoginHistory] = useState<string[]>([]);
  
  // Economy
  const [markets, setMarkets] = useState<Market[]>([]);
  const [rewardTypes, setRewardTypes] = useState<RewardTypeDefinition[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [gameAssets, setGameAssets] = useState<GameAsset[]>([]);
  
  // Quests
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questGroups, setQuestGroups] = useState<QuestGroup[]>([]);
  const [questCompletions, setQuestCompletions] = useState<QuestCompletion[]>([]);

  // App/System
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

  // UI State
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isAiConfigured, setIsAiConfigured] = useState(false);
  
  // Derived State
  const isFirstRun = users.length === 0 && isDataLoaded;
  const allTags = useMemo(() => 
    Array.from(new Set(['Cleaning', 'Learning', 'Health', 'Yardwork', ...quests.flatMap(q => q.tags || [])])).sort(), 
  [quests]);

  const lastSyncTimestamp = useRef<string | null>(null);
  
  const apiRequest = useCallback(async (method: string, path: string, body?: any) => {
    try {
        const options: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const response = await window.fetch(path, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Server error' }));
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }
        if (response.status === 204) {
             return null;
        }
        return await response.json();
    } catch (error) {
        addNotification({ type: 'error', message: error instanceof Error ? error.message : 'An unknown network error occurred.' });
        throw error;
    }
  }, [addNotification]);

  const setCurrentUser = useCallback((user: User | null) => {
    if (currentUser?.id === user?.id) return;
    if (bugLogger.isRecording()) {
        bugLogger.add({ type: 'STATE_CHANGE', message: `Setting current user to: ${user?.gameName || 'null'}` });
    }
    _setCurrentUser(user);
    setIsSharedViewActive(false);
    if (user) {
        localStorage.setItem('lastUserId', user.id);
        setLoginHistory(prev => [user.id, ...prev.filter(id => id !== user.id).slice(0, 9)]);
    } else {
        localStorage.removeItem('lastUserId');
    }
  }, [currentUser]);

  const processAndSetData = useCallback((dataToSet: IAppData, isDelta = false) => {
      const savedSettings: Partial<AppSettings> = dataToSet.settings || {};
      let settingsUpdated = false;
      let loadedSettingsResult: AppSettings | undefined = undefined;

      if (!isDelta) {
          const savedSidebarConfig = savedSettings.sidebars?.main || [];
          const defaultSidebarConfig = INITIAL_SETTINGS.sidebars.main;
          const savedIds = new Set(savedSidebarConfig.map(item => item.id));
          const missingItems = defaultSidebarConfig.filter(item => !savedIds.has(item.id));
          
          let finalSidebarConfig = savedSidebarConfig;
          if (missingItems.length > 0) {
              finalSidebarConfig = [...savedSidebarConfig, ...missingItems];
              settingsUpdated = true;
          }

          const loadedSettings: AppSettings = {
            ...INITIAL_SETTINGS, ...savedSettings,
            questDefaults: { ...INITIAL_SETTINGS.questDefaults, ...(savedSettings.questDefaults || {}) },
            security: { ...INITIAL_SETTINGS.security, ...(savedSettings.security || {}) },
            sharedMode: { ...INITIAL_SETTINGS.sharedMode, ...(savedSettings.sharedMode || {}) },
            automatedBackups: { ...INITIAL_SETTINGS.automatedBackups, ...(savedSettings.automatedBackups || {}) },
            loginNotifications: { ...INITIAL_SETTINGS.loginNotifications, ...(savedSettings.loginNotifications || {}) },
            googleCalendar: { ...INITIAL_SETTINGS.googleCalendar, ...(savedSettings.googleCalendar || {}) },
            developerMode: { ...INITIAL_SETTINGS.developerMode, ...(savedSettings.developerMode || {}) },
            chat: { ...INITIAL_SETTINGS.chat, ...(savedSettings.chat || {}) },
            sidebars: { main: finalSidebarConfig },
            terminology: { ...INITIAL_SETTINGS.terminology, ...(savedSettings.terminology || {}) },
            rewardValuation: { ...INITIAL_SETTINGS.rewardValuation, ...(savedSettings.rewardValuation || {}) },
          };
          setSettings(loadedSettings);
          loadedSettingsResult = loadedSettings;
      } else if (dataToSet.settings) {
          setSettings(prev => ({ ...prev, ...dataToSet.settings }));
      }

      if (dataToSet.users) setUsers(prev => isDelta ? mergeData(prev, dataToSet.users!) : dataToSet.users!);
      if (dataToSet.loginHistory) setLoginHistory(dataToSet.loginHistory);
      if (dataToSet.quests) setQuests(prev => isDelta ? mergeData(prev, dataToSet.quests!) : dataToSet.quests!);
      if (dataToSet.questGroups) setQuestGroups(prev => isDelta ? mergeData(prev, dataToSet.questGroups!) : dataToSet.questGroups!);
      if (dataToSet.questCompletions) setQuestCompletions(prev => isDelta ? mergeData(prev, dataToSet.questCompletions!) : dataToSet.questCompletions!);
      if (dataToSet.markets) setMarkets(prev => isDelta ? mergeData(prev, dataToSet.markets!) : dataToSet.markets!);
      if (dataToSet.rewardTypes) setRewardTypes(prev => isDelta ? mergeData(prev, dataToSet.rewardTypes!) : dataToSet.rewardTypes!);
      if (dataToSet.purchaseRequests) setPurchaseRequests(prev => isDelta ? mergeData(prev, dataToSet.purchaseRequests!) : dataToSet.purchaseRequests!);
      if (dataToSet.gameAssets) setGameAssets(prev => isDelta ? mergeData(prev, dataToSet.gameAssets!) : dataToSet.gameAssets!);
      if (dataToSet.guilds) setGuilds(prev => isDelta ? mergeData(prev, dataToSet.guilds!) : dataToSet.guilds!);
      if (dataToSet.ranks) setRanks(prev => isDelta ? mergeData(prev, dataToSet.ranks!) : dataToSet.ranks!);
      if (dataToSet.trophies) setTrophies(prev => isDelta ? mergeData(prev, dataToSet.trophies!) : dataToSet.trophies!);
      if (dataToSet.userTrophies) setUserTrophies(prev => isDelta ? mergeData(prev, dataToSet.userTrophies!) : dataToSet.userTrophies!);
      if (dataToSet.adminAdjustments) setAdminAdjustments(prev => isDelta ? mergeData(prev, dataToSet.adminAdjustments!) : dataToSet.adminAdjustments!);
      if (dataToSet.systemLogs) setSystemLogs(prev => isDelta ? mergeData(prev, dataToSet.systemLogs!) : dataToSet.systemLogs!);
      if (dataToSet.themes) setThemes(prev => isDelta ? mergeData(prev, dataToSet.themes!) : dataToSet.themes!);
      if (dataToSet.chatMessages) setChatMessages(prev => isDelta ? mergeData(prev, dataToSet.chatMessages!) : dataToSet.chatMessages!);
      if (dataToSet.systemNotifications) setSystemNotifications(prev => isDelta ? mergeData(prev, dataToSet.systemNotifications!) : dataToSet.systemNotifications!);
      if (dataToSet.scheduledEvents) setScheduledEvents(prev => isDelta ? mergeData(prev, dataToSet.scheduledEvents!) : dataToSet.scheduledEvents!);
      if (dataToSet.bugReports) setBugReports(prev => isDelta ? mergeData(prev, dataToSet.bugReports!) : dataToSet.bugReports!);

      return { settingsUpdated, loadedSettings: loadedSettingsResult };
  }, [addNotification, setCurrentUser]);
  
  const initialSync = useCallback(async () => {
    try {
      const response = await apiRequest('GET', '/api/data/sync');
      if (!response) return;

      const { updates, newSyncTimestamp } = response;
      const { settingsUpdated, loadedSettings } = processAndSetData(updates, false);

      if (settingsUpdated && loadedSettings) {
          await apiRequest('PUT', '/api/settings', loadedSettings);
          addNotification({ type: 'info', message: 'Application settings updated with new features.' });
      }

      const lastUserId = localStorage.getItem('lastUserId');
      if (lastUserId && updates.users) {
        const lastUser = updates.users.find((u:User) => u.id === lastUserId);
        if (lastUser) _setCurrentUser(lastUser);
      }
      
      if (loadedSettings) {
        setIsSharedViewActive(loadedSettings.sharedMode.enabled && !localStorage.getItem('lastUserId'));
      }

      lastSyncTimestamp.current = newSyncTimestamp;

    } catch (error) {
      console.error("Could not load data from server.", error);
    }
  }, [apiRequest, processAndSetData, addNotification]);

  const performDeltaSync = useCallback(async () => {
    if (document.hidden || !lastSyncTimestamp.current) return;
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
          
          if (updates.users && currentUser) {
            const updatedCurrentUser = updates.users.find((u: User) => u.id === currentUser.id);
            if (updatedCurrentUser) {
                _setCurrentUser(updatedCurrentUser);
            }
          }
      }
      
      lastSyncTimestamp.current = newSyncTimestamp;
      setSyncStatus('success');
    } catch (error) {
      console.error("Data sync failed:", error);
      setSyncStatus('error');
      setSyncError(error instanceof Error ? error.message : 'An unknown error occurred during sync.');
    }
  }, [apiRequest, processAndSetData, currentUser]);

  useEffect(() => {
    const initializeApp = async () => {
      await initialSync();
      setIsDataLoaded(true);
      try {
          const systemStatusResponse = await window.fetch('/api/system/status');
          if (systemStatusResponse.ok) {
              const statusData = await systemStatusResponse.json();
              setIsAiConfigured(statusData.geminiConnected);
          }
      } catch (statusError) {
          console.error("Failed to fetch system status:", statusError);
          setIsAiConfigured(false);
      }
    };
    initializeApp();
  }, [initialSync]);

  useEffect(() => {
    if (!isDataLoaded) return;
    const intervalId = setInterval(performDeltaSync, 30000);
    document.addEventListener('visibilitychange', performDeltaSync);
    window.addEventListener('trigger-sync', performDeltaSync);
    return () => {
        clearInterval(intervalId);
        document.removeEventListener('visibilitychange', performDeltaSync);
        window.removeEventListener('trigger-sync', performDeltaSync);
    };
  }, [isDataLoaded, performDeltaSync]);
  
  const triggerSync = useCallback(() => {
    performDeltaSync();
  }, [performDeltaSync]);

  // ALL DISPATCH LOGIC MERGED HERE
  const updateUser = useCallback((userId: string, update: Partial<User> | ((user: User) => User), persist = true) => {
    if (bugLogger.isRecording()) {
        bugLogger.add({ type: 'ACTION', message: `Updating user ID: ${userId}` });
    }
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;
    const finalUpdatePayload = typeof update === 'function' ? update({ ...userToUpdate }) : { ...userToUpdate, ...update };
    
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? finalUpdatePayload : u));
    
    if (currentUser?.id === userId) {
        _setCurrentUser(finalUpdatePayload);
    }
    
    if (persist) {
      const payloadForApi = typeof update === 'function' ? finalUpdatePayload : update;
      apiRequest('PUT', `/api/users/${userId}`, payloadForApi).catch(error => {
          console.error("Failed to update user on server, optimistic update may be stale.", error);
      });
    }
  }, [users, currentUser, apiRequest]);

  const addSystemNotification = useCallback((notification: Omit<SystemNotification, 'id' | 'timestamp' | 'readByUserIds'>) => {
    if (!notification.recipientUserIds || notification.recipientUserIds.length === 0) return;
    const newNotification: SystemNotification = {
        id: `sysnotif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
        readByUserIds: [],
        ...notification
    };
    setSystemNotifications(prev => [...prev, newNotification]);
  }, []);

  const awardTrophy = useCallback((userId: string, trophyId: string, guildId?: string) => {
    const t = trophies.find(t => t.id === trophyId);
    if (t) {
      setUserTrophies(p => [...p, { id: `award-${Date.now()}`, userId, trophyId, awardedAt: new Date().toISOString(), guildId }]);
      addNotification({ type: 'trophy', message: `Trophy Unlocked: ${t.name}!`, icon: t.icon });
      addSystemNotification({
        type: SystemNotificationType.TrophyAwarded,
        message: `You unlocked a new trophy: "${t.name}"!`,
        recipientUserIds: [userId],
        guildId,
        icon: t.icon,
        link: 'Trophies',
      });
    }
  }, [trophies, addNotification, addSystemNotification]);

  const applyRewards = useCallback((userId: string, rewardsToApply: RewardItem[], guildId?: string, persist = true) => {
    updateUser(userId, userToUpdate => {
        const newUser = JSON.parse(JSON.stringify(userToUpdate));
        rewardsToApply.forEach(reward => {
            const rewardDef = rewardTypes.find(rd => rd.id === reward.rewardTypeId);
            if (!rewardDef) return;
            if (guildId) {
                if (!newUser.guildBalances[guildId]) newUser.guildBalances[guildId] = { purse: {}, experience: {} };
                const balanceSheet = newUser.guildBalances[guildId];
                if (rewardDef.category === RewardCategory.Currency) {
                    balanceSheet.purse[reward.rewardTypeId] = (balanceSheet.purse[reward.rewardTypeId] || 0) + reward.amount;
                } else {
                    balanceSheet.experience[reward.rewardTypeId] = (balanceSheet.experience[reward.rewardTypeId] || 0) + reward.amount;
                }
            } else {
                if (rewardDef.category === RewardCategory.Currency) {
                    newUser.personalPurse[reward.rewardTypeId] = (newUser.personalPurse[reward.rewardTypeId] || 0) + reward.amount;
                } else {
                    newUser.personalExperience[reward.rewardTypeId] = (newUser.personalExperience[reward.rewardTypeId] || 0) + reward.amount;
                }
            }
        });
        return newUser;
    }, persist);
  }, [rewardTypes, updateUser]);

  const completeQuest = useCallback(async (completionData: any) => {
      const { questId, userId, status, guildId } = completionData;
      if (status === QuestCompletionStatus.Approved) {
          const quest = quests.find(q => q.id === questId);
          if (quest) applyRewards(userId, quest.rewards, guildId, false);
      }
      setQuestCompletions(prev => [...prev, { ...completionData, id: `temp-comp-${Date.now()}` }]);
      await apiRequest('POST', '/api/actions/complete-quest', { completionData });
  }, [apiRequest, quests, applyRewards]);
  
    const dismissQuest = useCallback((questId: string, userId: string) => {
        setQuests(prev => prev.map(q => q.id === questId ? { ...q, dismissals: [...q.dismissals, { userId, dismissedAt: new Date().toISOString() }] } : q));
    }, []);

    const claimQuest = useCallback((questId: string, userId: string) => {
        const quest = quests.find(q => q.id === questId);
        if(!quest) return;
        const updatedQuest = { ...quest, claimedByUserIds: [...(quest.claimedByUserIds || []), userId] };
        setQuests(prev => prev.map(q => q.id === questId ? updatedQuest : q));
    }, [quests]);

    const releaseQuest = useCallback((questId: string, userId: string) => {
        setQuests(prev => prev.map(q => q.id === questId ? { ...q, claimedByUserIds: (q.claimedByUserIds || []).filter(id => id !== userId) } : q));
    }, []);

    const markQuestAsTodo = useCallback((questId: string, userId: string) => {
        const quest = quests.find(q => q.id === questId);
        if (quest) {
            const updatedQuest = { ...quest, todoUserIds: [...(quest.todoUserIds || []), userId] };
            apiRequest('PUT', `/api/quests/${questId}`, updatedQuest);
        }
    }, [quests, apiRequest]);

    const unmarkQuestAsTodo = useCallback((questId: string, userId: string) => {
        const quest = quests.find(q => q.id === questId);
        if (quest) {
            const updatedQuest = { ...quest, todoUserIds: (quest.todoUserIds || []).filter(id => id !== userId) };
            apiRequest('PUT', `/api/quests/${questId}`, updatedQuest);
        }
    }, [quests, apiRequest]);

    const deductRewards = useCallback((userId: string, cost: RewardItem[], guildId?: string, persist = true): Promise<boolean> => {
        return new Promise((resolve) => {
            let success = false;
            updateUser(userId, user => {
                const userCopy = JSON.parse(JSON.stringify(user));
                const canAfford = cost.every(item => {
                    const rd = rewardTypes.find(rt => rt.id === item.rewardTypeId);
                    if (!rd) return false;
                    const bal = guildId 
                        ? (rd.category === 'Currency' ? userCopy.guildBalances[guildId]?.purse[item.rewardTypeId] : userCopy.guildBalances[guildId]?.experience[item.rewardTypeId])
                        : (rd.category === 'Currency' ? userCopy.personalPurse[item.rewardTypeId] : userCopy.personalExperience[item.rewardTypeId]);
                    return (bal || 0) >= item.amount;
                });

                if (!canAfford) {
                    success = false;
                    return user;
                }

                cost.forEach(c => {
                    const rd = rewardTypes.find(rt => rt.id === c.rewardTypeId);
                    if (!rd) return;
                    if (guildId) {
                        if (rd.category === 'Currency') userCopy.guildBalances[guildId].purse[c.rewardTypeId] -= c.amount;
                        else userCopy.guildBalances[guildId].experience[c.rewardTypeId] -= c.amount;
                    } else {
                        if (rd.category === 'Currency') userCopy.personalPurse[c.rewardTypeId] -= c.amount;
                        else userCopy.personalExperience[c.rewardTypeId] -= c.amount;
                    }
                });
                success = true;
                return userCopy;
            }, persist);
            resolve(success);
        });
    }, [rewardTypes, updateUser]);

    const purchaseMarketItem = useCallback(async (assetId: string, marketId: string, user: User, costGroupIndex: number, scheduledEvents: ScheduledEvent[]) => {
        if (bugLogger.isRecording()) {
          bugLogger.add({ type: 'ACTION', message: `User ${user.gameName} attempting to purchase asset ${assetId}` });
        }
        const market = markets.find(m => m.id === marketId);
        const asset = gameAssets.find(ga => ga.id === assetId);
        if (!market || !asset) return;
        
        const cost = asset.costGroups[costGroupIndex];
        if (!cost) {
            addNotification({ type: 'error', message: 'Invalid cost option selected.' });
            return;
        }
    
        const todayYMD = toYMD(new Date());
        const activeSaleEvent = scheduledEvents.find(event => 
            event.eventType === 'MarketSale' && event.modifiers.marketId === marketId &&
            todayYMD >= event.startDate && todayYMD <= event.endDate && event.guildId === market.guildId &&
            (!event.modifiers.assetIds || event.modifiers.assetIds.length === 0 || event.modifiers.assetIds.includes(assetId))
        );
    
        let finalCost = cost;
        if (activeSaleEvent && activeSaleEvent.modifiers.discountPercent) {
            const discount = activeSaleEvent.modifiers.discountPercent / 100;
            finalCost = cost.map(c => ({ ...c, amount: Math.max(0, Math.ceil(c.amount * (1 - discount))) }));
            addNotification({type: 'info', message: `${activeSaleEvent.title}: ${activeSaleEvent.modifiers.discountPercent}% discount applied!`})
        }
        
        const canAfford = await deductRewards(user.id, finalCost, market.guildId);
    
        if (canAfford) {
            if (asset.requiresApproval) {
                const newRequest: PurchaseRequest = {
                    id: `purchase-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    userId: user.id, assetId, requestedAt: new Date().toISOString(), status: PurchaseRequestStatus.Pending,
                    assetDetails: { name: asset.name, description: asset.description, cost: finalCost }, guildId: market.guildId,
                };
                setPurchaseRequests(p => [...p, newRequest]);
                addNotification({ type: 'info', message: 'Purchase requested. Funds have been held.' });
            } else {
                updateUser(user.id, updatedUser => {
                    const userCopy = JSON.parse(JSON.stringify(updatedUser));
                    if (asset.payouts && asset.payouts.length > 0) applyRewards(user.id, asset.payouts, market.guildId);
                    if (asset.linkedThemeId && !userCopy.ownedThemes.includes(asset.linkedThemeId)) userCopy.ownedThemes.push(asset.linkedThemeId);
                    if (!asset.payouts || asset.payouts.length === 0) userCopy.ownedAssetIds.push(asset.id);
                    return userCopy;
                });
                addNotification({ type: 'success', message: `Purchased "${asset.name}"!` });
                setPurchaseRequests(p => [...p, { id: `purchase-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, userId: user.id, assetId, requestedAt: new Date().toISOString(), status: PurchaseRequestStatus.Completed, assetDetails: { name: asset.name, description: asset.description, cost: finalCost }, guildId: market.guildId }]);
            }
        } else {
            addNotification({ type: 'error', message: 'You cannot afford this item.' });
        }
      }, [markets, gameAssets, deductRewards, addNotification, applyRewards, updateUser]);

    const cancelPurchaseRequest = useCallback((purchaseId: string) => {
        const r = purchaseRequests.find(p => p.id === purchaseId);
        if (r && r.status === PurchaseRequestStatus.Pending) {
            applyRewards(r.userId, r.assetDetails.cost, r.guildId);
            addNotification({ type: 'info', message: 'Purchase cancelled. Funds returned.' });
        }
        setPurchaseRequests(prev => prev.map(p => p.id === purchaseId ? { ...p, status: PurchaseRequestStatus.Cancelled, actedAt: new Date().toISOString() } : p));
    }, [purchaseRequests, applyRewards, addNotification]);

    const approvePurchaseRequest = useCallback((purchaseId: string) => {
        const r = purchaseRequests.find(p => p.id === purchaseId);
        if (!r) return;
        const asset = gameAssets.find(a => a.id === r.assetId);
        if (!asset) return;
        
        updateUser(r.userId, updatedUser => {
            const userCopy = JSON.parse(JSON.stringify(updatedUser));
            if (asset.linkedThemeId && !userCopy.ownedThemes.includes(asset.linkedThemeId)) userCopy.ownedThemes.push(asset.linkedThemeId);
            if (!asset.payouts || asset.payouts.length === 0) userCopy.ownedAssetIds.push(r.assetId);
            return userCopy;
        });

        if (asset.payouts && asset.payouts.length > 0) {
          applyRewards(r.userId, asset.payouts, r.guildId);
        }

        setPurchaseRequests(p => p.map(pr => pr.id === purchaseId ? { ...pr, status: PurchaseRequestStatus.Completed, actedAt: new Date().toISOString() } : pr));
        addNotification({type: 'success', message: 'Purchase approved.'});
    }, [purchaseRequests, gameAssets, addNotification, applyRewards, updateUser]);
    
    const rejectPurchaseRequest = useCallback((purchaseId: string) => {
        const r = purchaseRequests.find(p => p.id === purchaseId);
        if (r && r.status === PurchaseRequestStatus.Pending) {
            applyRewards(r.userId, r.assetDetails.cost, r.guildId);
            addNotification({ type: 'info', message: 'Purchase rejected. Funds returned.' });
        }
        setPurchaseRequests(prev => prev.map(p => p.id === purchaseId ? { ...p, status: PurchaseRequestStatus.Rejected, actedAt: new Date().toISOString() } : p));
    }, [purchaseRequests, applyRewards, addNotification]);

    const executeExchange = useCallback((userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => {
        deductRewards(userId, [payItem], guildId).then(canAfford => {
          if (canAfford) {
              applyRewards(userId, [receiveItem], guildId);
          } else {
              addNotification({ type: 'error', message: 'Exchange failed due to insufficient funds.' });
          }
        });
    }, [deductRewards, applyRewards, addNotification]);

    const addTrophy = useCallback(async (trophy: Omit<Trophy, 'id'>) => {
        await apiRequest('POST', '/api/trophies', trophy);
    }, [apiRequest]);

    const updateTrophy = useCallback(async (trophy: Trophy) => {
        await apiRequest('PUT', `/api/trophies/${trophy.id}`, trophy);
    }, [apiRequest]);
    
    const applyManualAdjustment = useCallback((adjustment: Omit<AdminAdjustment, 'id' | 'adjustedAt'>): boolean => {
        if (bugLogger.isRecording()) {
            bugLogger.add({ type: 'ACTION', message: `Applying manual adjustment for user: ${adjustment.userId}` });
        }
        const newAdjustment: AdminAdjustment = {
            ...adjustment,
            id: `adj-${Date.now()}`,
            adjustedAt: new Date().toISOString(),
        };
        setAdminAdjustments(p => [...p, newAdjustment]);

        if (adjustment.type === AdminAdjustmentType.Reward) {
            applyRewards(adjustment.userId, adjustment.rewards, adjustment.guildId);
        }
        if (adjustment.type === AdminAdjustmentType.Setback) {
            deductRewards(adjustment.userId, adjustment.setbacks, adjustment.guildId);
        }
        if (adjustment.type === AdminAdjustmentType.Trophy && adjustment.trophyId) {
            awardTrophy(adjustment.userId, adjustment.trophyId, adjustment.guildId);
        }
        
        addNotification({ type: 'success', message: 'Adjustment applied successfully.' });
        return true;
    }, [applyRewards, deductRewards, awardTrophy, addNotification]);

    const addTheme = useCallback((theme: Omit<ThemeDefinition, 'id'>) => {
        const newTheme: ThemeDefinition = { ...theme, id: `custom-theme-${Date.now()}`};
        setThemes(p => [...p, newTheme]);
        addNotification({ type: 'success', message: `Theme "${theme.name}" created.` });
    }, [addNotification]);
    
    const updateTheme = useCallback((theme: ThemeDefinition) => {
        setThemes(p => p.map(t => t.id === theme.id ? theme : t));
        addNotification({ type: 'success', message: `Theme "${theme.name}" updated.` });
    }, [addNotification]);
  
    const deleteTheme = useCallback((themeId: string) => {
        setThemes(p => p.filter(t => t.id !== themeId));
        addNotification({ type: 'info', message: `Theme deleted.` });
    }, [addNotification]);

    const clearAllHistory = useCallback(() => {
        setQuestCompletions([]);
        setPurchaseRequests([]);
        setUserTrophies([]);
        setAdminAdjustments([]);
        setSystemLogs([]);
    }, []);

    const resetAllPlayerData = useCallback(() => {
        setUsers(p => p.map(u => u.role !== Role.DonegeonMaster ? { ...u, personalPurse: {}, personalExperience: {}, guildBalances: {}, ownedAssetIds: [], ownedThemes: [], avatar: {} } : u));
    }, []);

    const resetAllUsersData = useCallback(() => {
        setUsers(p => p.map(u => ({ ...u, personalPurse: {}, personalExperience: {}, guildBalances: {}, ownedAssetIds: [], ownedThemes: [], avatar: {} })));
        addNotification({type: 'success', message: 'All user data has been reset.'})
    }, [addNotification]);

    const deleteAllCustomContent = useCallback(() => {
        setQuests([]);
        setQuestGroups([]);
        setMarkets(p => p.filter(m => m.id === 'market-bank'));
        setGameAssets([]);
        setRewardTypes(p => p.filter(rt => rt.isCore));
        setRanks(INITIAL_RANKS);
        setTrophies(INITIAL_TROPHIES);
        setThemes(INITIAL_THEMES);
    }, []);
    
    const deleteUsers = useCallback(async (userIds: string[]) => {
        setUsers(prev => prev.filter(u => !userIds.includes(u.id)));
        await apiRequest('DELETE', '/api/users', { ids: userIds }); 
    }, [apiRequest]);

    const deleteSelectedAssets = useCallback((selection: Partial<Record<ShareableAssetType, string[]>>, onComplete: () => void) => {
        let count = 0;
        if (selection.quests) { setQuests(p => p.filter(i => !selection.quests!.includes(i.id))); count += selection.quests.length; }
        if (selection.questGroups) { setQuestGroups(p => p.filter(i => !selection.questGroups!.includes(i.id))); count += selection.questGroups.length; }
        if (selection.rewardTypes) { setRewardTypes(p => p.filter(i => !selection.rewardTypes!.includes(i.id))); count += selection.rewardTypes.length; }
        if (selection.ranks) { setRanks(p => p.filter(i => !selection.ranks!.includes(i.id))); count += selection.ranks.length; }
        if (selection.trophies) { setTrophies(p => p.filter(i => !selection.trophies!.includes(i.id))); count += selection.trophies.length; }
        if (selection.markets) { setMarkets(p => p.filter(i => !selection.markets!.includes(i.id))); count += selection.markets.length; }
        if (selection.gameAssets) { setGameAssets(p => p.filter(i => !selection.gameAssets!.includes(i.id))); count += selection.gameAssets.length; }
        if (selection.users) { deleteUsers(selection.users); count += selection.users.length; }
        addNotification({ type: 'success', message: `${count} item(s) have been deleted.` });
        onComplete();
    }, [deleteUsers, addNotification]);
    
    const uploadFile = useCallback(async (file: File, category?: string): Promise<{ url: string } | null> => {
        const formData = new FormData();
        formData.append('file', file);
        if (category) {
            formData.append('category', category);
        }

        try {
            const response = await window.fetch('/api/media/upload', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Server error' }));
                throw new Error(errorData.error || `Upload failed with status ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            addNotification({ type: 'error', message: error instanceof Error ? error.message : 'File upload failed.' });
            return null;
        }
    }, [addNotification]);

    const factoryReset = useCallback(async () => {
        await apiRequest('POST', '/api/data/factory-reset');
        addNotification({ type: 'info', message: 'Factory reset initiated. The app will restart.' });
        setTimeout(() => window.location.reload(), 2000);
    }, [apiRequest, addNotification]);

    const resetSettings = useCallback(() => {
        setSettings(INITIAL_SETTINGS);
        addNotification({ type: 'success', message: 'Settings have been reset to default.' });
    }, [addNotification]);

    const sendMessage = useCallback(async (message: Omit<ChatMessage, 'id' | 'timestamp' | 'readBy' | 'senderId'> & { isAnnouncement?: boolean }) => {
        if (!currentUser) return;
        const { isAnnouncement, ...messageData } = message;
        const payload = { ...messageData, senderId: currentUser.id, isAnnouncement };
        await apiRequest('POST', '/api/chat/send', payload);
    }, [apiRequest, currentUser]);

    const markMessagesAsRead = useCallback(async (params: { partnerId?: string; guildId?: string; }) => {
        if (!currentUser) return;
        await apiRequest('POST', '/api/chat/read', { userId: currentUser.id, ...params });
    }, [apiRequest, currentUser]);

    const markSystemNotificationsAsRead = useCallback((notificationIds: string[]) => {
        if (!currentUser) return;
        setSystemNotifications(prev => prev.map(n => notificationIds.includes(n.id) && !n.readByUserIds.includes(currentUser.id) ? { ...n, readByUserIds: [...n.readByUserIds, currentUser.id] } : n));
    }, [currentUser]);

    const cloneRewardType = useCallback((rewardTypeId: string) => {
        const rewardToClone = rewardTypes.find(rt => rt.id === rewardTypeId);
        if (rewardToClone && !rewardToClone.isCore) {
            const newReward = {
                ...rewardToClone,
                id: `custom-${Date.now()}`,
                name: `${rewardToClone.name} (Copy)`,
            };
            setRewardTypes(p => [...p, newReward]);
            addNotification({ type: 'success', message: 'Reward type cloned.' });
        } else {
            addNotification({ type: 'error', message: 'Core rewards cannot be cloned.' });
        }
    }, [rewardTypes, addNotification]);

    const cloneMarket = useCallback((marketId: string) => {
        if (marketId === 'market-bank') {
            addNotification({ type: 'error', message: 'The Exchange Post cannot be cloned.' });
            return;
        }
        const marketToClone = markets.find(m => m.id === marketId);
        if (marketToClone) {
            const newMarket = {
                ...marketToClone,
                id: `market-${Date.now()}`,
                title: `${marketToClone.title} (Copy)`,
            };
            setMarkets(p => [...p, newMarket]);
            addNotification({ type: 'success', message: 'Market cloned.' });
        }
    }, [markets, addNotification]);

    const deleteMarkets = useCallback((marketIds: string[]) => {
        const idsToDelete = marketIds.filter(id => id !== 'market-bank');
        if (marketIds.includes('market-bank')) {
            addNotification({ type: 'error', message: 'The Exchange Post cannot be deleted.' });
        }
        if (idsToDelete.length > 0) {
            setMarkets(p => p.filter(m => !idsToDelete.includes(m.id)));
            addNotification({ type: 'info', message: `${idsToDelete.length} market(s) deleted.` });
        }
    }, [addNotification]);

    const updateMarketsStatus = useCallback((marketIds: string[], statusType: 'open' | 'closed') => {
        const newStatus: MarketStatus = { type: statusType };
        setMarkets(p => p.map(m => {
            if (marketIds.includes(m.id) && m.status.type !== 'conditional') {
                return { ...m, status: newStatus };
            }
            return m;
        }));
        addNotification({ type: 'success', message: `${marketIds.length} market(s) updated.` });
    }, [addNotification]);

  const allDispatchFunctions: AppDispatch = {
      // Auth
      setUsers, setLoginHistory,
      addUser: (userData: any) => apiRequest('POST', '/api/users', userData),
      updateUser,
      deleteUsers,
      setCurrentUser,
      markUserAsOnboarded: (userId: string) => updateUser(userId, { hasBeenOnboarded: true }),
      setAppUnlocked: (isUnlocked: boolean) => { localStorage.setItem('isAppUnlocked', String(isUnlocked)); _setAppUnlocked(isUnlocked); },
      setIsSwitchingUser,
      setTargetedUserForLogin,
      exitToSharedView: () => { _setCurrentUser(null); setIsSharedViewActive(true); localStorage.removeItem('lastUserId'); },
      setIsSharedViewActive,
      resetAllUsersData,
      completeFirstRun: (adminUserData: any) => apiRequest('POST', '/api/first-run', { adminUserData }).then(() => setTimeout(() => window.location.reload(), 2000)),
      
      // Quest
      setQuests, setQuestGroups, setQuestCompletions,
      addQuest: (quest: any) => apiRequest('POST', '/api/quests', quest),
      updateQuest: (quest: any) => apiRequest('PUT', `/api/quests/${quest.id}`, quest),
      deleteQuest: (id: any) => apiRequest('DELETE', '/api/quests', { ids: [id] }),
      cloneQuest: (id: any) => apiRequest('POST', `/api/quests/clone/${id}`),
      dismissQuest, claimQuest, releaseQuest, markQuestAsTodo, unmarkQuestAsTodo,
      completeQuest, approveQuestCompletion: (id: any, note: any) => apiRequest('POST', `/api/actions/approve-quest/${id}`, { note }),
      rejectQuestCompletion: (id: any, note: any) => apiRequest('POST', `/api/actions/reject-quest/${id}`, { note }),
      addQuestGroup: (group: any) => { const newGroup = { ...group, id: `qg-${Date.now()}` }; setQuestGroups(p => [...p, newGroup]); return newGroup; },
      updateQuestGroup: (group: any) => setQuestGroups(p => p.map(g => g.id === group.id ? group : g)),
      deleteQuestGroup: (id: any) => setQuestGroups(p => p.filter(g => g.id !== id)),
      deleteQuestGroups: (ids: any) => { const idSet = new Set(ids); setQuestGroups(p => p.filter(g => !idSet.has(g.id))); },
      assignQuestGroupToUsers: (groupId: any, userIds: any) => setQuests(prevQuests => prevQuests.map(quest => quest.groupId === groupId ? { ...quest, assignedUserIds: userIds } : quest)),
      deleteQuests: (ids: any) => apiRequest('DELETE', '/api/quests', { ids }),
      updateQuestsStatus: (ids: any, isActive: any) => apiRequest('PUT', '/api/quests/bulk-status', { ids, isActive }),
      bulkUpdateQuests: (ids: any, updates: any) => apiRequest('PUT', '/api/quests/bulk-update', { ids, updates }),
      
      // Economy
      setMarkets, setRewardTypes, setPurchaseRequests, setGameAssets,
      addRewardType: (rt: any) => setRewardTypes(p => [...p, {...rt, id: `custom-${Date.now()}`, isCore: false}]),
      updateRewardType: (rt: any) => setRewardTypes(p => p.map(r => r.id === rt.id ? rt : r)),
      deleteRewardType: (id: any) => setRewardTypes(p => p.filter(r => r.id !== id)),
      cloneRewardType,
      addMarket: (m: any) => setMarkets(p => [...p, {...m, id: `market-${Date.now()}`}]),
      updateMarket: (m: any) => setMarkets(p => p.map(market => market.id === m.id ? m : market)),
      deleteMarket: (id: any) => setMarkets(p => p.filter(m => m.id !== id)),
      cloneMarket,
      deleteMarkets,
      updateMarketsStatus,
      addGameAsset: (asset: any) => apiRequest('POST', '/api/assets', asset),
      updateGameAsset: (asset: any) => apiRequest('PUT', `/api/assets/${asset.id}`, asset),
      deleteGameAsset: (id: any) => apiRequest('DELETE', '/api/assets', { ids: [id] }),
      cloneGameAsset: (id: any) => apiRequest('POST', `/api/assets/clone/${id}`),
      deleteGameAssets: (ids: any) => apiRequest('DELETE', '/api/assets', { ids }),
      purchaseMarketItem, cancelPurchaseRequest, approvePurchaseRequest, rejectPurchaseRequest,
      applyRewards, deductRewards, executeExchange,
      importAssetPack: (pack: any, resolutions: any, allData: any) => apiRequest('POST', '/api/data/import-assets', { assetPack: pack, resolutions }),
      
      // App
      addGuild: (g: any) => apiRequest('POST', '/api/guilds', g),
      updateGuild: (g: any) => apiRequest('PUT', `/api/guilds/${g.id}`, g),
      deleteGuild: (id: any) => apiRequest('DELETE', `/api/guilds/${id}`),
      setRanks, addTrophy, updateTrophy, awardTrophy, applyManualAdjustment,
      addTheme, updateTheme, deleteTheme, addScheduledEvent: (e: any) => apiRequest('POST', '/api/events', e),
      updateScheduledEvent: (e: any) => apiRequest('PUT', `/api/events/${e.id}`, e),
      deleteScheduledEvent: (id: any) => apiRequest('DELETE', `/api/events/${id}`),
      addBugReport: (r: any) => apiRequest('POST', '/api/bug-reports', r),
      updateBugReport: (id: any, u: any) => apiRequest('PUT', `/api/bug-reports/${id}`, u),
      deleteBugReports: (ids: any) => apiRequest('DELETE', '/api/bug-reports', { ids }),
      importBugReports: (r: any) => apiRequest('POST', '/api/bug-reports/import', r),
      restoreFromBackup: (d: any) => apiRequest('POST', '/api/data/restore', d).then(() => setTimeout(() => window.location.reload(), 1500)),
      clearAllHistory, resetAllPlayerData, deleteAllCustomContent, deleteSelectedAssets, uploadFile, factoryReset,
      updateSettings: (s: any) => { const newSettings = {...settings, ...s}; setSettings(newSettings); apiRequest('PUT', '/api/settings', newSettings); },
      resetSettings, sendMessage, markMessagesAsRead, addSystemNotification, markSystemNotificationsAsRead,
      triggerSync
  };

  const dispatch = useMemo(() => allDispatchFunctions, [allDispatchFunctions]);

  const state = useMemo(() => ({
    users, currentUser, isAppUnlocked, isFirstRun, isSwitchingUser,
    isSharedViewActive, targetedUserForLogin, loginHistory,
    markets, rewardTypes, purchaseRequests, gameAssets,
    quests, questGroups, questCompletions, allTags,
    isDataLoaded, isAiConfigured, syncStatus, syncError,
    guilds, ranks, trophies, userTrophies, adminAdjustments, systemLogs,
    settings, themes, chatMessages, systemNotifications, scheduledEvents, bugReports
  }), [
    users, currentUser, isAppUnlocked, isFirstRun, isSwitchingUser,
    isSharedViewActive, targetedUserForLogin, loginHistory,
    markets, rewardTypes, purchaseRequests, gameAssets,
    quests, questGroups, questCompletions, allTags,
    isDataLoaded, isAiConfigured, syncStatus, syncError,
    guilds, ranks, trophies, userTrophies, adminAdjustments, systemLogs,
    settings, themes, chatMessages, systemNotifications, scheduledEvents, bugReports
  ]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch as any}>
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