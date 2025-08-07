import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppSettings, User, Quest, RewardItem, Guild, Rank, Trophy, UserTrophy, AppMode, Page, IAppData, ShareableAssetType, GameAsset, Role, RewardCategory, AdminAdjustment, AdminAdjustmentType, SystemLog, QuestType, QuestAvailability, AssetPack, ImportResolution, TrophyRequirementType, ThemeDefinition, ChatMessage, SystemNotification, SystemNotificationType, MarketStatus, QuestGroup, BulkQuestUpdates, ScheduledEvent, BugReport } from '../types';
import { INITIAL_SETTINGS, INITIAL_RANKS, INITIAL_TROPHIES, INITIAL_THEMES } from '../data/initialData';
import { useNotificationsDispatch } from './NotificationsContext';
import { useAuthState, useAuthDispatch } from './AuthContext';
import { useQuestsDispatch } from './QuestsContext';
import { useEconomyDispatch } from './EconomyContext';

// The single, unified state for the non-auth/quest parts of the application
interface AppState extends Omit<IAppData, 'users' | 'loginHistory' | 'quests' | 'questGroups' | 'questCompletions' | 'markets' | 'rewardTypes' | 'purchaseRequests' | 'gameAssets'> {
  isDataLoaded: boolean;
  isAiConfigured: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncError: string | null;
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
  addBugReport: (report: Omit<BugReport, 'id'>) => void;
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
}

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<AppDispatch | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addNotification } = useNotificationsDispatch();
  const { currentUser, users } = useAuthState();
  const authDispatch = useAuthDispatch();
  const questsDispatch = useQuestsDispatch();
  const economyDispatch = useEconomyDispatch();

  // === STATE MANAGEMENT ===
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
      const loadedSettings: AppSettings = {
        ...INITIAL_SETTINGS, ...savedSettings,
        questDefaults: { ...INITIAL_SETTINGS.questDefaults, ...(savedSettings.questDefaults || {}) },
        security: { ...INITIAL_SETTINGS.security, ...(savedSettings.security || {}) },
        sharedMode: { ...INITIAL_SETTINGS.sharedMode, ...(savedSettings.sharedMode || {}) },
        automatedBackups: { ...INITIAL_SETTINGS.automatedBackups, ...(savedSettings.automatedBackups || {}) },
        loginNotifications: { ...INITIAL_SETTINGS.loginNotifications, ...(savedSettings.loginNotifications || {}) },
        developerMode: { ...INITIAL_SETTINGS.developerMode, ...(savedSettings.developerMode || {}) },
        chat: { ...INITIAL_SETTINGS.chat, ...(savedSettings.chat || {}) },
        sidebars: { ...INITIAL_SETTINGS.sidebars, ...(savedSettings.sidebars || {}) },
        terminology: { ...INITIAL_SETTINGS.terminology, ...(savedSettings.terminology || {}) },
        rewardValuation: { ...INITIAL_SETTINGS.rewardValuation, ...(savedSettings.rewardValuation || {}) },
      };

      authDispatch.setUsers(dataToSet.users || []);
      authDispatch.setLoginHistory(dataToSet.loginHistory || []);
      
      questsDispatch.setQuests(dataToSet.quests || []);
      questsDispatch.setQuestGroups(dataToSet.questGroups || []);
      questsDispatch.setQuestCompletions(dataToSet.questCompletions || []);
      
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
      setBugReports(dataToSet.bugReports || []);

      const lastUserId = localStorage.getItem('lastUserId');
      if (lastUserId && dataToSet.users) {
        const lastUser = dataToSet.users.find((u:User) => u.id === lastUserId);
        if (lastUser) authDispatch.setCurrentUser(lastUser);
      }
      authDispatch.setIsSharedViewActive(loadedSettings.sharedMode.enabled && !localStorage.getItem('lastUserId'));

    } catch (error) {
      console.error("Could not load data from server.", error);
    }
  }, [apiRequest, authDispatch, questsDispatch, economyDispatch]);

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
    addNotification({type: 'success', message: 'Manual adjustment applied.'}); 
    return true; 
  }, [economyDispatch, awardTrophy, addNotification]);
  
  const uploadFile = useCallback(async (file: File, category: string = 'Miscellaneous'): Promise<{ url: string } | null> => { const fd = new FormData(); fd.append('file', file); fd.append('category', category); try { const r = await window.fetch('/api/media/upload', { method: 'POST', body: fd }); if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Upload failed'); } return await r.json(); } catch (e) { const m = e instanceof Error ? e.message : 'Unknown error'; addNotification({ type: 'error', message: `Upload failed: ${m}` }); return null; } }, [addNotification]);
  
  const restoreFromBackup = useCallback(async (backupData: IAppData) => {
    try {
        await apiRequest('POST', '/api/data/save', backupData);
        addNotification({ type: 'success', message: 'Restore successful! The app will now reload.' });
        setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
        addNotification({ type: 'error', message: 'Failed to restore from backup.' });
    }
  }, [apiRequest, addNotification]);

  const factoryReset = useCallback(async () => {
    try {
        await apiRequest('POST', '/api/data/factory-reset');
        addNotification({ type: 'success', message: 'Factory reset successful! The application is reloading...' });
        localStorage.clear();
        setTimeout(() => window.location.reload(), 2000);
    } catch (e) {
        addNotification({ type: 'error', message: 'Failed to perform factory reset.' });
    }
  }, [apiRequest, addNotification]);

  const clearAllHistory = useCallback(() => { 
      questsDispatch.setQuestCompletions([]); 
      economyDispatch.setPurchaseRequests([]); 
      setAdminAdjustments([]); 
      setSystemLogs([]); 
      addNotification({ type: 'success', message: 'All historical data has been cleared.' }); 
  }, [questsDispatch, economyDispatch, addNotification]);
  
  const resetAllPlayerData = useCallback(() => { 
      authDispatch.resetAllUsersData(); 
      setUserTrophies(prev => prev.filter(ut => users.find(u => u.id === ut.userId)?.role === Role.DonegeonMaster)); 
      addNotification({ type: 'success', message: "All player data has been reset." }); 
  }, [authDispatch, users, addNotification]);
  
  const deleteAllCustomContent = useCallback(() => { 
      questsDispatch.setQuests([]); 
      questsDispatch.setQuestGroups([]); 
      economyDispatch.deleteAllCustomContent();
      setRanks(p => p.filter(r => r.xpThreshold === 0)); 
      setTrophies([]); 
      setGuilds(p => p.filter(g => g.isDefault)); 
      addNotification({ type: 'success', message: 'All custom content has been deleted.' }); 
  }, [questsDispatch, economyDispatch, addNotification]);
  
  const deleteSelectedAssets = useCallback((selection: Partial<Record<ShareableAssetType, string[]>>) => { 
      (Object.keys(selection) as ShareableAssetType[]).forEach(assetType => { 
          const ids = new Set(selection[assetType]); 
          if (ids.size > 0) { 
              switch (assetType) { 
                  case 'quests': questsDispatch.deleteQuests(Array.from(ids)); break; 
                  case 'ranks': setRanks(p => p.filter(i => !ids.has(i.id))); break; 
                  case 'trophies': setTrophies(p => p.filter(i => !ids.has(i.id))); break; 
                  // Let EconomyContext handle its own types
                  case 'markets': case 'rewardTypes': case 'gameAssets':
                      economyDispatch.deleteSelectedAssets({ [assetType]: Array.from(ids) } as any);
                      break;
              } 
          } 
      }); 
      addNotification({ type: 'success', message: 'Selected assets have been deleted.' }); 
  }, [questsDispatch, economyDispatch, addNotification]);
  
  // Theme Management
  const addTheme = useCallback((theme: Omit<ThemeDefinition, 'id'>) => {
    const newTheme: ThemeDefinition = { ...theme, id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, isCustom: true };
    setThemes(prev => [...prev, newTheme]);
    addNotification({ type: 'success', message: 'Theme created!' });
  }, [addNotification]);
  const updateTheme = useCallback(async (theme: ThemeDefinition) => {
    if (!theme.isCustom) {
      addNotification({ type: 'error', message: 'Default themes cannot be modified.' });
      return;
    }
    setThemes(prev => prev.map(t => t.id === theme.id ? theme : t));
    try {
      await apiRequest('PUT', `/api/themes/${theme.id}`, theme);
      addNotification({ type: 'success', message: 'Theme updated!' });
    } catch (error) {}
  }, [addNotification, apiRequest]);
  const deleteTheme = useCallback((themeId: string) => {
    setThemes(prev => prev.filter(t => t.id !== themeId));
    addNotification({ type: 'info', message: 'Theme deleted.' });
  }, [addNotification]);
  
  // Scheduled Events
  const addScheduledEvent = useCallback((event: Omit<ScheduledEvent, 'id'>) => {
    const newEvent = { ...event, id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
    setScheduledEvents(prev => [...prev, newEvent]);
    addNotification({ type: 'success', message: 'Event scheduled!' });
  }, [addNotification]);
  const updateScheduledEvent = useCallback((event: ScheduledEvent) => {
    setScheduledEvents(prev => prev.map(e => e.id === event.id ? event : e));
    addNotification({ type: 'success', message: 'Event updated!' });
  }, [addNotification]);
  const deleteScheduledEvent = useCallback((eventId: string) => {
    setScheduledEvents(prev => prev.filter(e => e.id !== eventId));
    addNotification({ type: 'info', message: 'Event deleted.' });
  }, [addNotification]);
  
    const addBugReport = useCallback((report: Omit<BugReport, 'id'>) => {
        const newReport: BugReport = {
            ...report,
            id: `bug-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };
        setBugReports(prev => [...prev, newReport]);
        addNotification({ type: 'success', message: `Bug report "${report.title}" submitted!` });
    }, [addNotification]);

  const updateSettings = useCallback(async (settingsToUpdate: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...settingsToUpdate };
    try {
        const returnedSettings = await apiRequest('PUT', '/api/settings', newSettings);
        setSettings(returnedSettings);
    } catch (e) {}
  }, [settings, apiRequest]);

  const resetSettings = useCallback(() => {
    setSettings(INITIAL_SETTINGS);
    addNotification({ type: 'success', message: 'All application settings have been reset to their defaults.' });
  }, [addNotification]);

  // Inactivity Timer for Shared Mode
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (settings.sharedMode.enabled && settings.sharedMode.autoExit && currentUser) {
        inactivityTimer.current = window.setTimeout(
            authDispatch.exitToSharedView,
            settings.sharedMode.autoExitMinutes * 60 * 1000
        );
    }
  }, [settings.sharedMode, currentUser, authDispatch.exitToSharedView]);

  useEffect(() => {
      window.addEventListener('mousemove', resetInactivityTimer);
      window.addEventListener('keydown', resetInactivityTimer);
      window.addEventListener('click', resetInactivityTimer);
      resetInactivityTimer(); // Initial setup
      return () => {
          window.removeEventListener('mousemove', resetInactivityTimer);
          window.removeEventListener('keydown', resetInactivityTimer);
          window.removeEventListener('click', resetInactivityTimer);
          if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      };
  }, [resetInactivityTimer]);

  // Chat functions
  const sendMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp' | 'readBy' | 'senderId'> & { isAnnouncement?: boolean }) => {
    if (!currentUser) return;

    const { isAnnouncement, ...chatMessageData } = message;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      senderId: currentUser.id,
      timestamp: new Date().toISOString(),
      readBy: [currentUser.id],
      ...chatMessageData,
      isAnnouncement: isAnnouncement || undefined,
    };

    if (isAnnouncement && message.guildId) {
        const guild = guilds.find(g => g.id === message.guildId);
        if (guild) {
            addSystemNotification({
                type: SystemNotificationType.Announcement,
                message: message.message,
                senderId: currentUser.id,
                recipientUserIds: guild.memberIds,
                guildId: message.guildId,
            });
        }
    }

    setChatMessages(prevMessages => [...prevMessages, newMessage]);
    apiRequest('POST', '/api/chat/messages', newMessage).catch(error => {
        console.error("Failed to send message to server. State will be corrected on next sync.", error);
    });
  }, [currentUser, guilds, addSystemNotification, apiRequest]);

  const markMessagesAsRead = useCallback((params: { partnerId?: string; guildId?: string; }) => {
    if (!currentUser) return;
    const { partnerId, guildId } = params;

    setChatMessages(prev => prev.map(msg => {
        const isUnreadDm = partnerId && msg.recipientId === currentUser.id && msg.senderId === partnerId;
        const isUnreadGuildMsg = guildId && msg.guildId === guildId;

        if ((isUnreadDm || isUnreadGuildMsg) && !msg.readBy.includes(currentUser.id)) {
            return { ...msg, readBy: [...msg.readBy, currentUser.id] };
        }
        return msg;
    }));
  }, [currentUser]);

  // === CONTEXT PROVIDER VALUE ===
  const stateValue: AppState = {
    guilds, ranks, trophies, userTrophies, adminAdjustments, systemLogs, settings, themes, chatMessages, systemNotifications, scheduledEvents, bugReports,
    isDataLoaded, 
    isAiConfigured,
    syncStatus, syncError,
  };

  const dispatchValue: AppDispatch = {
    addGuild, updateGuild, deleteGuild, setRanks, addTrophy, updateTrophy, deleteTrophy, awardTrophy, applyManualAdjustment,
    addTheme, updateTheme, deleteTheme,
    addScheduledEvent, updateScheduledEvent, deleteScheduledEvent,
    addBugReport,
    restoreFromBackup, clearAllHistory, resetAllPlayerData, deleteAllCustomContent, deleteSelectedAssets, 
    uploadFile,
    factoryReset,
    updateSettings, resetSettings,
    sendMessage, markMessagesAsRead,
    addSystemNotification, markSystemNotificationsAsRead
  };

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