import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppSettings, User, Quest, RewardItem, Guild, Rank, Trophy, UserTrophy, AppMode, Page, IAppData, ShareableAssetType, GameAsset, Role, RewardCategory, AdminAdjustment, AdminAdjustmentType, SystemLog, QuestType, QuestAvailability, AssetPack, ImportResolution, TrophyRequirementType, ThemeDefinition, ChatMessage, SystemNotification, SystemNotificationType, MarketStatus, QuestGroup, BulkQuestUpdates, ScheduledEvent, BugReport, QuestCompletion, BugReportType } from '../types';
import { INITIAL_SETTINGS, INITIAL_RANKS, INITIAL_TROPHIES, INITIAL_THEMES } from '../data/initialData';
import { useNotificationsDispatch } from './NotificationsContext';
import { useAuthState, useAuthDispatch } from './AuthContext';
import { useEconomyDispatch } from './EconomyContext';
import { useQuestDispatch } from './QuestContext';
import { bugLogger } from '../utils/bugLogger';

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

  // Settings & UI
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  sendMessage: (message: Omit<ChatMessage, 'id' | 'timestamp' | 'readBy' | 'senderId'> & { isAnnouncement?: boolean }) => void;
  markMessagesAsRead: (params: { partnerId?: string; guildId?: string; }) => void;
  addSystemNotification: (notification: Omit<SystemNotification, 'id' | 'timestamp' | 'readByUserIds'>) => void;
  markSystemNotificationsAsRead: (notificationIds: string[]) => void;
  triggerSync: () => void;
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
  const { currentUser } = useAuthState();
  const authDispatch = useAuthDispatch();
  const economyDispatch = useEconomyDispatch();
  const questDispatch = useQuestDispatch();

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
  
  // Ref to hold the last sync timestamp without causing re-renders
  const lastSyncTimestamp = useRef<string | null>(null);
  
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
        // Error notifications will be handled by the calling function using the new pattern
        // addNotification({ type: 'error', message: error instanceof Error ? error.message : 'An unknown network error occurred.' });
        throw error;
    }
  }, []);
  
  // === DATA SYNC & LOADING ===
  
  const processAndSetData = useCallback((dataToSet: IAppData, isDelta = false) => {
      const savedSettings: Partial<AppSettings> = dataToSet.settings || {};
      let settingsUpdated = false;
      let loadedSettingsResult: AppSettings | undefined = undefined;

      if (!isDelta) {
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
          // If it's a delta update and settings are present, just merge them
          setSettings(prev => ({ ...prev, ...dataToSet.settings }));
      }

      // Update states, either by full replacement or by merging
      if (dataToSet.users) authDispatch.setUsers(prev => isDelta ? mergeData(prev, dataToSet.users!) : dataToSet.users!);
      if (dataToSet.loginHistory) authDispatch.setLoginHistory(dataToSet.loginHistory);

      if (dataToSet.quests) questDispatch.setQuests(prev => isDelta ? mergeData(prev, dataToSet.quests!) : dataToSet.quests!);
      if (dataToSet.questGroups) questDispatch.setQuestGroups(prev => isDelta ? mergeData(prev, dataToSet.questGroups!) : dataToSet.questGroups!);
      if (dataToSet.questCompletions) questDispatch.setQuestCompletions(prev => isDelta ? mergeData(prev, dataToSet.questCompletions!) : dataToSet.questCompletions!);
      
      if (dataToSet.markets) economyDispatch.setMarkets(prev => isDelta ? mergeData(prev, dataToSet.markets!) : dataToSet.markets!);
      if (dataToSet.rewardTypes) economyDispatch.setRewardTypes(prev => isDelta ? mergeData(prev, dataToSet.rewardTypes!) : dataToSet.rewardTypes!);
      if (dataToSet.purchaseRequests) economyDispatch.setPurchaseRequests(prev => isDelta ? mergeData(prev, dataToSet.purchaseRequests!) : dataToSet.purchaseRequests!);
      if (dataToSet.gameAssets) economyDispatch.setGameAssets(prev => isDelta ? mergeData(prev, dataToSet.gameAssets!) : dataToSet.gameAssets!);

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
  }, [authDispatch, questDispatch, economyDispatch]);
  
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
        if (lastUser) authDispatch.setCurrentUser(lastUser);
      }
      
      if (loadedSettings) {
        authDispatch.setIsSharedViewActive(loadedSettings.sharedMode.enabled && !localStorage.getItem('lastUserId'));
      }

      lastSyncTimestamp.current = newSyncTimestamp;

    } catch (error) {
      console.error("Could not load data from server.", error);
    }
  }, [apiRequest, processAndSetData, addNotification, authDispatch]);

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
          
          // If the current user's data was in the update, refresh the currentUser state
          if (updates.users && currentUser) {
            const updatedCurrentUser = updates.users.find((u: User) => u.id === currentUser.id);
            if (updatedCurrentUser) {
                authDispatch.setCurrentUser(updatedCurrentUser);
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
  }, [apiRequest, processAndSetData, currentUser, authDispatch]);

  useEffect(() => {
    const initializeApp = async () => {
      await initialSync();
      setIsDataLoaded(true);

      // Fetch system status after initial data load to check AI configuration
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

    const intervalId = setInterval(performDeltaSync, 30000); // Poll for updates every 30 seconds
    document.addEventListener('visibilitychange', performDeltaSync);

    // Global event listener for manual sync triggers
    window.addEventListener('trigger-sync', performDeltaSync);


    return () => {
        clearInterval(intervalId);
        document.removeEventListener('visibilitychange', performDeltaSync);
        window.removeEventListener('trigger-sync', performDeltaSync);
    };
  }, [isDataLoaded, performDeltaSync]);
  
  const triggerSync = useCallback(() => {
    console.log('Manual sync triggered.');
    performDeltaSync();
  }, [performDeltaSync]);

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
        const originalReports = [...bugReports];
        
        // Optimistic update
        setBugReports(prev =>
            prev.map(report =>
                report.id === reportId ? { ...report, ...updates, updatedAt: new Date().toISOString() } : report
            )
        );

        try {
            await apiRequest('PUT', `/api/bug-reports/${reportId}`, updates);
        } catch (error) {
            // Revert on failure
            addNotification({ type: 'error', message: 'Update failed. Reverting changes.' });
            setBugReports(originalReports);
        }
    }, [apiRequest, bugReports, addNotification]);
    
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
        questDispatch.setQuestCompletions([]);
        economyDispatch.setPurchaseRequests([]);
        setAdminAdjustments([]);
        setUserTrophies([]);
        setSystemLogs([]);
        addNotification({ type: 'info', message: 'All history logs cleared.' });
    }, [economyDispatch, questDispatch, addNotification]);

    const resetAllPlayerData = useCallback(() => {
        authDispatch.resetAllUsersData();
        addNotification({ type: 'info', message: 'All player data has been reset.' });
    }, [authDispatch, addNotification]);

    const deleteAllCustomContent = useCallback(() => {
        questDispatch.setQuests([]);
        questDispatch.setQuestGroups([]);
        setTrophies(INITIAL_TROPHIES);
        setRanks(INITIAL_RANKS);
        economyDispatch.deleteAllCustomContent();
        addNotification({ type: 'info', message: 'All custom content has been deleted.' });
    }, [economyDispatch, questDispatch, addNotification]);

    const deleteSelectedAssets = useCallback(async (selection: Partial<Record<ShareableAssetType, string[]>>, onComplete: () => void) => {
        try {
            if (selection.quests) await apiRequest('DELETE', '/api/quests', { ids: selection.quests });
            if (selection.ranks) {
                await apiRequest('DELETE', '/api/ranks', { ids: selection.ranks });
                setRanks(prev => prev.filter(r => !selection.ranks!.includes(r.id)));
            }
            if (selection.trophies) {
                await apiRequest('DELETE', '/api/trophies', { ids: selection.trophies });
                setTrophies(prev => prev.filter(t => !selection.trophies!.includes(t.id)));
            }
            
            economyDispatch.deleteSelectedAssets(selection);
            
            onComplete();
            addNotification({ type: 'success', message: 'Selected assets deleted.' });
        } catch(e) {
            // Error is already handled by the apiRequest helper
        }
    }, [apiRequest, economyDispatch, addNotification]);

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
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await apiRequest('PUT', '/api/settings', updatedSettings);
    }, [apiRequest, settings]);

    const resetSettings = useCallback(() => {
        setSettings(INITIAL_SETTINGS);
        updateSettings(INITIAL_SETTINGS);
        addNotification({ type: 'info', message: 'Settings have been reset to default.' });
    }, [updateSettings, addNotification]);

    const sendMessage = useCallback(async (message: Omit<ChatMessage, 'id' | 'timestamp' | 'readBy' | 'senderId'> & { isAnnouncement?: boolean }) => {
        if (!currentUser) return;

        const notificationId = addNotification({
            message: 'Sending message...',
            type: 'info',
            duration: 0, // Persistent
        });

        try {
            const payload = { ...message, senderId: currentUser.id };
            await apiRequest('POST', '/api/chat/send', payload);
            updateNotification(notificationId, {
                message: 'Message sent!',
                type: 'success',
                duration: 3000,
            });
        } catch (error) {
            updateNotification(notificationId, {
                message: 'Failed to send message.',
                type: 'error',
                duration: 5000,
            });
        }
    }, [currentUser, apiRequest, addNotification, updateNotification]);

    const markMessagesAsRead = useCallback(async (params: { partnerId?: string; guildId?: string; }) => {
        if (!currentUser) return;

        // Optimistic update to prevent infinite loops in the chat panel
        setChatMessages(prevMessages => 
            prevMessages.map(msg => {
                const isDmMatch = params.partnerId && msg.recipientId === currentUser.id && msg.senderId === params.partnerId;
                const isGuildMatch = params.guildId && msg.guildId === params.guildId;

                if ((isDmMatch || isGuildMatch) && !msg.readBy.includes(currentUser.id)) {
                    return { ...msg, readBy: [...msg.readBy, currentUser.id] };
                }
                return msg;
            })
        );
        
        // Fire and forget API call
        const payload = { ...params, userId: currentUser.id };
        apiRequest('POST', '/api/chat/read', payload).catch(err => {
            console.error("Failed to mark messages as read on server:", err);
            // The UI will eventually be corrected by the next full sync if this fails.
        });
    }, [currentUser, apiRequest]);

    const state = {
        isDataLoaded, isAiConfigured, syncStatus, syncError,
        guilds, ranks, trophies, userTrophies,
        adminAdjustments, systemLogs, settings, themes, chatMessages,
        systemNotifications, scheduledEvents, bugReports,
    };

    const dispatch = {
        addGuild, updateGuild, deleteGuild, setRanks, addTrophy, updateTrophy,
        awardTrophy, applyManualAdjustment, addTheme, updateTheme, deleteTheme,
        addScheduledEvent, updateScheduledEvent, deleteScheduledEvent, addBugReport,
        updateBugReport, deleteBugReports, importBugReports, restoreFromBackup, clearAllHistory,
        resetAllPlayerData, deleteAllCustomContent, deleteSelectedAssets, uploadFile,
        factoryReset, updateSettings, resetSettings, sendMessage, markMessagesAsRead,
        addSystemNotification, markSystemNotificationsAsRead,
        triggerSync,
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