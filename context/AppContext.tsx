import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppSettings, User, Quest, RewardItem, Guild, Rank, Trophy, UserTrophy, AppMode, Page, IAppData, ShareableAssetType, GameAsset, Role, RewardCategory, AdminAdjustment, AdminAdjustmentType, SystemLog, QuestType, QuestAvailability, AssetPack, ImportResolution, TrophyRequirementType, ThemeDefinition, ChatMessage, SystemNotification, SystemNotificationType, MarketStatus, QuestGroup, BulkQuestUpdates, ScheduledEvent, BugReport, QuestCompletion, BugReportType } from '../types';
import { INITIAL_SETTINGS, INITIAL_RANKS, INITIAL_TROPHIES, INITIAL_THEMES } from '../data/initialData';
import { useNotificationsDispatch } from './NotificationsContext';
import { useAuthState, useAuthDispatch } from './AuthContext';
import { useEconomyDispatch, useEconomyState } from './EconomyContext';
import { bugLogger } from '../utils/bugLogger';

// The single, unified state for the non-auth/quest parts of the application
interface AppState extends Omit<IAppData, 'users' | 'loginHistory' | 'questCompletions' | 'markets' | 'rewardTypes' | 'purchaseRequests' | 'gameAssets'> {
  isDataLoaded: boolean;
  isAiConfigured: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncError: string | null;
  questCompletions: QuestCompletion[];
  allTags: string[];
}

// The single, unified dispatch for the non-auth/quest parts of the application
interface AppDispatch {
  // Game Data
  addGuild: (guild: Omit<Guild, 'id'>) => void;
  updateGuild: (guild: Guild) => void;
  deleteGuild: (guildId: string) => void;
  setRanks: (ranks: Rank[]) => void;
  addTrophy: (trophy: Omit<Trophy, 'id'>) => void;
  updateTrophy: (trophy: Trophy) => void;
  deleteTrophy: (trophyId: string) => void;
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
  deleteSelectedAssets: (selection: Partial<Record<ShareableAssetType, string[]>>) => void;
  uploadFile: (file: File, category?: string) => Promise<{ url: string } | null>;
  factoryReset: () => void;

  // Settings & UI
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  sendMessage: (message: Omit<ChatMessage, 'id' | 'timestamp' | 'readBy' | 'senderId'> & { isAnnouncement?: boolean }) => void;
  markMessagesAsRead: (params: { partnerId?: string; guildId?: string; }) => void;
  addSystemNotification: (notification: Omit<SystemNotification, 'id' | 'timestamp' | 'readByUserIds'>) => void;
  markSystemNotificationsAsRead: (notificationIds: string[]) => void;

  // Quests Dispatch
  setQuests: (quests: Quest[]) => void;
  setQuestGroups: (groups: QuestGroup[]) => void;
  setQuestCompletions: (completions: QuestCompletion[]) => void;
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
  assignQuestGroupToUsers: (groupId: string, userIds: string[]) => void;
  deleteQuests: (questIds: string[]) => void;
  updateQuestsStatus: (questIds: string[], isActive: boolean) => void;
  bulkUpdateQuests: (questIds: string[], updates: BulkQuestUpdates) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<AppDispatch | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addNotification } = useNotificationsDispatch();
  const { currentUser, users } = useAuthState();
  const authDispatch = useAuthDispatch();
  const economyDispatch = useEconomyDispatch();
  const economyState = useEconomyState();

  // === STATE MANAGEMENT ===
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questGroups, setQuestGroups] = useState<QuestGroup[]>([]);
  const [questCompletions, setQuestCompletions] = useState<QuestCompletion[]>([]);
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

  // UI State that remains global due to cross-cutting concerns
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isAiConfigured, setIsAiConfigured] = useState(false);
  
  const inactivityTimer = useRef<number | null>(null);

  const allTags = useMemo(() => 
    Array.from(new Set(['Cleaning', 'Learning', 'Health', 'Yardwork', ...quests.flatMap(q => q.tags || [])])).sort(), 
  [quests]);
  
  // === API HELPERS ===
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
  
  // === DATA SYNC & LOADING ===
  const loadAllData = useCallback(async () => {
    try {
      const dataToSet: IAppData = await apiRequest('GET', '/api/data/load');
      if (!dataToSet) return;

      const savedSettings: Partial<AppSettings> = dataToSet.settings || {};
      let settingsUpdated = false;

      // --- Sidebar Migration Logic ---
      const savedSidebarConfig = savedSettings.sidebars?.main || [];
      const defaultSidebarConfig = INITIAL_SETTINGS.sidebars.main;
      
      const savedIds = new Set(savedSidebarConfig.map(item => item.id));
      const missingItems = defaultSidebarConfig.filter(item => !savedIds.has(item.id));
      
      let finalSidebarConfig = savedSidebarConfig;
      if (missingItems.length > 0) {
          finalSidebarConfig = [...savedSidebarConfig, ...missingItems];
          settingsUpdated = true;
          console.log(`Migrating sidebar: Added ${missingItems.length} new items.`);
      }
      // --- End Sidebar Migration Logic ---

      const loadedSettings: AppSettings = {
        ...INITIAL_SETTINGS, ...savedSettings,
        questDefaults: { ...INITIAL_SETTINGS.questDefaults, ...(savedSettings.questDefaults || {}) },
        security: { ...INITIAL_SETTINGS.security, ...(savedSettings.security || {}) },
        sharedMode: { ...INITIAL_SETTINGS.sharedMode, ...(savedSettings.sharedMode || {}) },
        automatedBackups: { ...INITIAL_SETTINGS.automatedBackups, ...(savedSettings.automatedBackups || {}) },
        loginNotifications: { ...INITIAL_SETTINGS.loginNotifications, ...(savedSettings.loginNotifications || {}) },
        developerMode: { ...INITIAL_SETTINGS.developerMode, ...(savedSettings.developerMode || {}) },
        chat: { ...INITIAL_SETTINGS.chat, ...(savedSettings.chat || {}) },
        sidebars: { main: finalSidebarConfig },
        terminology: { ...INITIAL_SETTINGS.terminology, ...(savedSettings.terminology || {}) },
        rewardValuation: { ...INITIAL_SETTINGS.rewardValuation, ...(savedSettings.rewardValuation || {}) },
      };

      authDispatch.setUsers(dataToSet.users || []);
      authDispatch.setLoginHistory(dataToSet.loginHistory || []);
      
      setQuests(dataToSet.quests || []);
      setQuestGroups(dataToSet.questGroups || []);
      setQuestCompletions(dataToSet.questCompletions || []);
      
      economyDispatch.setMarkets(dataToSet.markets || []);
      economyDispatch.setRewardTypes(dataToSet.rewardTypes || []);
      economyDispatch.setPurchaseRequests(dataToSet.purchaseRequests || []);
      economyDispatch.setGameAssets(dataToSet.gameAssets || []);

      setGuilds(dataToSet.guilds || []);
      setRanks(dataToSet.ranks || []);
      setTrophies(dataToSet.trophies || []);
      setUserTrophies(dataToSet.userTrophies || []);
      setAdminAdjustments(dataToSet.adminAdjustments || []);
      setSystemLogs(dataToSet.systemLogs || []);
      setSettings(loadedSettings);
      setThemes(dataToSet.themes || INITIAL_THEMES);
      setChatMessages(dataToSet.chatMessages || []);
      setSystemNotifications(dataToSet.systemNotifications || []);
      setScheduledEvents(dataToSet.scheduledEvents || []);
      
      // --- Bug Report Migration to expanded statuses and tags ---
      const bugReportsToSet = dataToSet.bugReports || [];
      const reportsToUpdateOnServer: Partial<BugReport>[] = [];

      const migratedBugReports = bugReportsToSet.map(report => {
          let hasChanged = false;
          const newReport = { ...report };

          // Check for old statuses and convert them to tags, setting a new status
          if (report.status && !['Open', 'In Progress', 'Resolved', 'Closed'].includes(report.status)) {
              hasChanged = true;
              const oldStatus = report.status as any;
              newReport.tags = newReport.tags || [];

              switch (oldStatus) {
                  case 'New': newReport.status = 'Open'; break;
                  case 'Acknowledged': newReport.status = 'In Progress'; newReport.tags.push('Acknowledged'); break;
                  case 'Converted to Quest': newReport.status = 'Resolved'; newReport.tags.push('Converted to Quest'); break;
                  default: newReport.status = 'Open';
              }
          }
          // Ensure tags array exists
          if (!newReport.tags) {
              hasChanged = true;
              newReport.tags = [];
          }

          if (hasChanged) {
              reportsToUpdateOnServer.push({ id: newReport.id, status: newReport.status, tags: newReport.tags });
          }
          return newReport as BugReport;
      });
      
      setBugReports(migratedBugReports);

      if (reportsToUpdateOnServer.length > 0) {
          Promise.all(reportsToUpdateOnServer.map(report =>
              apiRequest('PUT', `/api/bug-reports/${report.id}`, { status: report.status, tags: report.tags })
          )).then(() => {
              addNotification({ type: 'info', message: 'Bug reports migrated to new format.' });
          }).catch(err => {
              console.error("Failed to save migrated bug reports", err);
              addNotification({ type: 'error', message: 'Failed to save bug report migration.' });
          });
      }


      // If migration happened, save it back to the server
      if (settingsUpdated) {
          await apiRequest('PUT', '/api/settings', loadedSettings);
          addNotification({ type: 'info', message: 'Application settings updated with new features.' });
      }

      const lastUserId = localStorage.getItem('lastUserId');
      if (lastUserId && dataToSet.users) {
        const lastUser = dataToSet.users.find((u:User) => u.id === lastUserId);
        if (lastUser) authDispatch.setCurrentUser(lastUser);
      }
      authDispatch.setIsSharedViewActive(loadedSettings.sharedMode.enabled && !localStorage.getItem('lastUserId'));

    } catch (error) {
      console.error("Could not load data from server.", error);
    }
  }, [apiRequest, authDispatch, economyDispatch, addNotification]);

  useEffect(() => {
    const initializeApp = async () => {
      await loadAllData();
      setIsDataLoaded(true);

      // Fetch AI status after initial data load
      try {
          const aiResponse = await window.fetch('/api/ai/status');
          if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              setIsAiConfigured(aiData.isConfigured);
          }
      } catch (aiError) {
          console.error("Failed to fetch AI status:", aiError);
          setIsAiConfigured(false);
      }
    };
    initializeApp();
  }, [loadAllData]);

  const syncData = useCallback(async () => {
    if (document.hidden) return;
    setSyncStatus('syncing');
    setSyncError(null);
    try {
      await loadAllData();
      setSyncStatus('success');
    } catch (error) {
      console.error("Data sync failed:", error);
      setSyncStatus('error');
      setSyncError(error instanceof Error ? error.message : 'An unknown error occurred during sync.');
    }
  }, [loadAllData]);

  useEffect(() => {
    if (!isDataLoaded) return;
    
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${proto}//${window.location.host}`);
        ws.onopen = () => console.log('WebSocket connected');
        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'DATA_UPDATED') {
                    console.log('Syncing data due to server update.');
                    syncData();
                }
            } catch (e) { console.error('Error parsing WebSocket message', e); }
        };
        ws.onclose = () => {
            console.log('WebSocket disconnected. Reconnecting in 5s...');
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            reconnectTimeout = setTimeout(connect, 5000);
        };
        ws.onerror = (err) => {
            console.error('WebSocket error:', err);
            ws?.close(); // Triggers reconnect
        };
    };

    connect();
    document.addEventListener('visibilitychange', syncData);

    return () => {
        if (ws) { ws.onclose = null; ws.close(); }
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        document.removeEventListener('visibilitychange', syncData);
    };
  }, [isDataLoaded, syncData]);

  // === BUSINESS LOGIC / DISPATCH FUNCTIONS ===

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

  const markSystemNotificationsAsRead = useCallback((notificationIds: string[]) => {
    if (!currentUser) return;
    const idsToMark = new Set(notificationIds);
    setSystemNotifications(prev => prev.map(n => {
        if (idsToMark.has(n.id) && !n.readByUserIds.includes(currentUser.id)) {
            return { ...n, readByUserIds: [...n.readByUserIds, currentUser.id] };
        }
        return n;
    }));
  }, [currentUser]);

  const awardTrophy = useCallback((userId: string, trophyId: string, guildId?: string) => {
    const t = trophies.find(t => t.id === trophyId);
    if (t) {
      setUserTrophies(p => [...p, { id: `award-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, userId, trophyId, awardedAt: new Date().toISOString(), guildId }]);
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
  
  const addGuild = useCallback(async (guild: Omit<Guild, 'id'>) => {
    try {
        await apiRequest('POST', '/api/guilds', guild);
    } catch (error) {}
  }, [apiRequest]);

  const updateGuild = useCallback(async (guild: Guild) => {
      try {
          await apiRequest('PUT', `/api/guilds/${guild.id}`, guild);
      } catch (error) {}
  }, [apiRequest]);

  const deleteGuild = useCallback(async (guildId: string) => {
      try {
          await apiRequest('DELETE', `/api/guilds/${guildId}`);
      } catch (error) {}
  }, [apiRequest]);

  const addTrophy = useCallback((trophy: Omit<Trophy, 'id'>) => setTrophies(prev => [...prev, { ...trophy, id: `trophy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`}]), []);
  const updateTrophy = useCallback((trophy: Trophy) => setTrophies(prev => prev.map(t => t.id === trophy.id ? trophy : t)), []);
  const deleteTrophy = useCallback((trophyId: string) => setTrophies(prev => prev.filter(t => t.id !== trophyId)), []);

  const applyManualAdjustment = useCallback((adj: Omit<AdminAdjustment, 'id' | 'adjustedAt'>): boolean => { 
    const newAdj: AdminAdjustment = { ...adj, id: `adj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, adjustedAt: new Date().toISOString() }; 
    setAdminAdjustments(p => [...p, newAdj]); 
    if (newAdj.type === AdminAdjustmentType.Reward) economyDispatch.applyRewards(newAdj.userId, newAdj.rewards, newAdj.guildId); 
    else if (newAdj.type === AdminAdjustmentType.Setback) economyDispatch.deductRewards(newAdj.userId, newAdj.setbacks, newAdj.guildId); 
    else if (newAdj.type === AdminAdjustmentType.Trophy && newAdj.trophyId) awardTrophy(newAdj.userId, newAdj.trophyId, newAdj.guildId);
    return true;
  }, [awardTrophy, economyDispatch]);

    const addTheme = useCallback((theme: Omit<ThemeDefinition, 'id'>) => {
        const newTheme = { ...theme, id: `theme-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
        setThemes(p => [...p, newTheme]);
        return newTheme;
    }, []);
    const updateTheme = useCallback((theme: ThemeDefinition) => setThemes(p => p.map(t => t.id === theme.id ? theme : t)), []);
    const deleteTheme = useCallback((themeId: string) => setThemes(p => p.filter(t => t.id !== themeId)), []);

    const addScheduledEvent = useCallback(async (event: Omit<ScheduledEvent, 'id'>) => {
        await apiRequest('POST', '/api/events', event);
    }, [apiRequest]);

    const updateScheduledEvent = useCallback(async (event: ScheduledEvent) => {
        await apiRequest('PUT', `/api/events/${event.id}`, event);
    }, [apiRequest]);

    const deleteScheduledEvent = useCallback(async (eventId: string) => {
        await apiRequest('DELETE', `/api/events/${eventId}`);
    }, [apiRequest]);

    const addBugReport = useCallback(async (report: Omit<BugReport, 'id' | 'status' | 'tags'> & { reportType: BugReportType }) => {
        const { reportType, ...rest } = report;
        const newReport = {
            ...rest,
            id: `bug-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            status: 'Open' as const,
            tags: [reportType]
        };
        await apiRequest('POST', '/api/bug-reports', newReport);
    }, [apiRequest]);

    const updateBugReport = useCallback(async (reportId: string, updates: Partial<BugReport>) => {
        await apiRequest('PUT', `/api/bug-reports/${reportId}`, updates);
    }, [apiRequest]);
    
    const deleteBugReports = useCallback(async (reportIds: string[]) => {
        await apiRequest('DELETE', '/api/bug-reports', { ids: reportIds });
    }, [apiRequest]);

    const importBugReports = useCallback(async (reports: BugReport[]) => {
        await apiRequest('POST', '/api/bug-reports/import', reports);
        addNotification({ type: 'success', message: 'Bug reports imported successfully.' });
    }, [apiRequest, addNotification]);

    const restoreFromBackup = useCallback(async (backupData: IAppData) => {
        await apiRequest('POST', '/api/data/restore', backupData);
        addNotification({ type: 'success', message: 'Restore from backup successful! App will reload.' });
        setTimeout(() => window.location.reload(), 1500);
    }, [apiRequest, addNotification]);

    const clearAllHistory = useCallback(() => {
        setQuestCompletions([]);
        economyDispatch.setPurchaseRequests([]);
        setAdminAdjustments([]);
        setUserTrophies([]);
        setSystemLogs([]);
        addNotification({ type: 'info', message: 'All history logs cleared.' });
    }, [economyDispatch, addNotification]);

    const resetAllPlayerData = useCallback(() => {
        authDispatch.resetAllUsersData();
        addNotification({ type: 'info', message: 'All player data has been reset.' });
    }, [authDispatch, addNotification]);

    const deleteAllCustomContent = useCallback(() => {
        setQuests([]);
        setQuestGroups([]);
        setTrophies(INITIAL_TROPHIES);
        setRanks(INITIAL_RANKS);
        economyDispatch.deleteAllCustomContent();
        addNotification({ type: 'info', message: 'All custom content has been deleted.' });
    }, [economyDispatch, addNotification]);

    const deleteSelectedAssets = useCallback((selection: Partial<Record<ShareableAssetType, string[]>>) => {
        if (selection.quests) setQuests(p => p.filter(i => !selection.quests!.includes(i.id)));
        if (selection.questGroups) setQuestGroups(p => p.filter(i => !selection.questGroups!.includes(i.id)));
        if (selection.ranks) setRanks(p => p.filter(i => !selection.ranks!.includes(i.id)));
        if (selection.trophies) setTrophies(p => p.filter(i => !selection.trophies!.includes(i.id)));
        economyDispatch.deleteSelectedAssets(selection); // delegates to economy context
    }, [economyDispatch]);

    const uploadFile = useCallback(async (file: File, category?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        if (category) {
            formData.append('category', category);
        }
        try {
            const response = await fetch('/api/media/upload', { method: 'POST', body: formData });
            if (!response.ok) throw new Error('Upload failed');
            return await response.json();
        } catch (error) {
            addNotification({ type: 'error', message: 'File upload failed.' });
            return null;
        }
    }, [addNotification]);
    
    const factoryReset = useCallback(async () => {
        await apiRequest('POST', '/api/data/factory-reset');
        addNotification({ type: 'success', message: 'Factory reset initiated. The app will restart.' });
        setTimeout(() => window.location.reload(), 2000);
    }, [apiRequest, addNotification]);

    const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
        setSettings(prev => ({...prev, ...newSettings}));
        await apiRequest('PUT', '/api/settings', {...settings, ...newSettings});
    }, [apiRequest, settings]);

    const resetSettings = useCallback(() => {
        setSettings(INITIAL_SETTINGS);
        updateSettings(INITIAL_SETTINGS);
        addNotification({ type: 'info', message: 'Settings have been reset to default.' });
    }, [updateSettings, addNotification]);

    const sendMessage = useCallback(async (message: Omit<ChatMessage, 'id' | 'timestamp' | 'readBy' | 'senderId'> & { isAnnouncement?: boolean }) => {
        if (!currentUser) return;
        const payload = { ...message, senderId: currentUser.id };
        await apiRequest('POST', '/api/chat/send', payload);
    }, [currentUser, apiRequest]);

    const markMessagesAsRead = useCallback(async (params: { partnerId?: string; guildId?: string; }) => {
        await apiRequest('POST', '/api/chat/read', params);
    }, [apiRequest]);

    const addQuest = useCallback(async (quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => {
        await apiRequest('POST', '/api/quests', quest);
    }, [apiRequest]);

    const updateQuest = useCallback(async (updatedQuest: Quest) => {
        await apiRequest('PUT', `/api/quests/${updatedQuest.id}`, updatedQuest);
    }, [apiRequest]);
    
    const deleteQuest = useCallback(async (questId: string) => {
        await apiRequest('DELETE', `/api/quests`, { ids: [questId] });
    }, [apiRequest]);

    const cloneQuest = useCallback(async (questId: string) => {
        await apiRequest('POST', `/api/quests/clone/${questId}`);
    }, [apiRequest]);
    
    const dismissQuest = useCallback((questId: string, userId: string) => {
        setQuests(prev => prev.map(q => q.id === questId ? { ...q, dismissals: [...q.dismissals, { userId, dismissedAt: new Date().toISOString() }] } : q));
    }, []);

    const claimQuest = useCallback((questId: string, userId: string) => {
        setQuests(prev => prev.map(q => q.id === questId ? { ...q, claimedByUserIds: [...(q.claimedByUserIds || []), userId] } : q));
    }, []);

    const releaseQuest = useCallback((questId: string, userId: string) => {
        setQuests(prev => prev.map(q => q.id === questId ? { ...q, claimedByUserIds: (q.claimedByUserIds || []).filter(id => id !== userId) } : q));
    }, []);

    const markQuestAsTodo = useCallback((questId: string, userId: string) => {
        setQuests(prev => prev.map(q => q.id === questId ? { ...q, todoUserIds: [...(q.todoUserIds || []), userId] } : q));
    }, []);

    const unmarkQuestAsTodo = useCallback((questId: string, userId: string) => {
        setQuests(prev => prev.map(q => q.id === questId ? { ...q, todoUserIds: (q.todoUserIds || []).filter(id => id !== userId) } : q));
    }, []);

    const completeQuest = useCallback(async (completionData: any) => {
        await apiRequest('POST', '/api/actions/complete-quest', { completionData });
    }, [apiRequest]);

    const approveQuestCompletion = useCallback(async (completionId: string, note?: string) => {
        await apiRequest('POST', `/api/actions/approve-quest/${completionId}`, { note });
    }, [apiRequest]);

    const rejectQuestCompletion = useCallback(async (completionId: string, note?: string) => {
        await apiRequest('POST', `/api/actions/reject-quest/${completionId}`, { note });
    }, [apiRequest]);

    const addQuestGroup = useCallback((group: Omit<QuestGroup, 'id'>): QuestGroup => {
        const newGroup = { ...group, id: `qg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
        setQuestGroups(prev => [...prev, newGroup]);
        return newGroup;
    }, []);
    
    const updateQuestGroup = useCallback((group: QuestGroup) => setQuestGroups(prev => prev.map(g => g.id === group.id ? group : g)), []);
    const deleteQuestGroup = useCallback((groupId: string) => setQuestGroups(prev => prev.filter(g => g.id !== groupId)), []);

    const assignQuestGroupToUsers = useCallback((groupId: string, userIds: string[]) => {
        setQuests(prev => prev.map(q => q.groupId === groupId ? { ...q, assignedUserIds: userIds } : q));
    }, []);

    const deleteQuests = useCallback(async (questIds: string[]) => {
        await apiRequest('DELETE', '/api/quests', { ids: questIds });
    }, [apiRequest]);

    const updateQuestsStatus = useCallback(async (questIds: string[], isActive: boolean) => {
        await apiRequest('PUT', '/api/quests/bulk-status', { ids: questIds, isActive });
    }, [apiRequest]);

    const bulkUpdateQuests = useCallback(async (questIds: string[], updates: BulkQuestUpdates) => {
        await apiRequest('PUT', '/api/quests/bulk-update', { ids: questIds, updates });
    }, [apiRequest]);

    const state: AppState = {
        isDataLoaded, isAiConfigured, syncStatus, syncError,
        quests, questGroups, guilds, ranks, trophies, userTrophies,
        adminAdjustments, systemLogs, settings, themes, chatMessages,
        systemNotifications, scheduledEvents, bugReports, questCompletions, allTags
    };

    const dispatch: AppDispatch = {
        addGuild, updateGuild, deleteGuild, setRanks, addTrophy, updateTrophy, deleteTrophy,
        awardTrophy, applyManualAdjustment, addTheme, updateTheme, deleteTheme,
        addScheduledEvent, updateScheduledEvent, deleteScheduledEvent, addBugReport,
        updateBugReport, deleteBugReports, importBugReports, restoreFromBackup, clearAllHistory,
        resetAllPlayerData, deleteAllCustomContent, deleteSelectedAssets, uploadFile,
        factoryReset, updateSettings, resetSettings, sendMessage, markMessagesAsRead,
        addSystemNotification, markSystemNotificationsAsRead, setQuests, setQuestGroups,
        setQuestCompletions, addQuest, updateQuest, deleteQuest, cloneQuest, dismissQuest,
        claimQuest, releaseQuest, markQuestAsTodo, unmarkQuestAsTodo, completeQuest,
        approveQuestCompletion, rejectQuestCompletion, addQuestGroup, updateQuestGroup,
        deleteQuestGroup, assignQuestGroupToUsers, deleteQuests, updateQuestsStatus,
        bulkUpdateQuests
    };

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
