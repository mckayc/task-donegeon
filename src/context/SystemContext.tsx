
// Fix: Import `useEffect` from `react` to resolve the "Cannot find name 'useEffect'" error.
import React, { createContext, useContext, ReactNode, useReducer, useMemo, useCallback, useEffect } from 'react';
// FIX: Fix import path for types to resolve module not found error.
import { AppSettings, ThemeDefinition, SystemLog, AdminAdjustment, SystemNotification, ScheduledEvent, ChatMessage, BugReport, ModifierDefinition, AppliedModifier, IAppData, ShareableAssetType, User, ChronicleEvent, Minigame, GameScore, AITutor, AITutorSessionLog } from '../types';
import { INITIAL_SETTINGS } from '../data/initialData';
import { useNotificationsDispatch } from './NotificationsContext';
import { useAuthDispatch, useAuthState } from './AuthContext';
import { bugLogger } from '../utils/bugLogger';
import { addBugReportAPI, addModifierDefinitionAPI, addScheduledEventAPI, addSystemNotificationAPI, addThemeAPI, applyManualAdjustmentAPI, applyModifierAPI, applySettingsUpdatesAPI, clearAllHistoryAPI, cloneUserAPI, deleteAllCustomContentAPI, deleteBugReportsAPI, deleteScheduledEventAPI, deleteSelectedAssetsAPI, deleteThemeAPI, factoryResetAPI, importAssetPackAPI, importBugReportsAPI, markMessagesAsReadAPI, markSystemNotificationsAsReadAPI, resetAllPlayerDataAPI, resetSettingsAPI, sendMessageAPI, updateBugReportAPI, updateModifierDefinitionAPI, updateScheduledEventAPI, updateSettingsAPI, updateThemeAPI, uploadFileAPI, deleteAppliedModifiersAPI, playMinigameAPI, submitScoreAPI, updateMinigameAPI, resetAllScoresForGameAPI, resetScoresForUsersAPI, addAITutorAPI, updateAITutorAPI } from '../api';
import { swLogger } from '../utils/swLogger';

// --- STATE & CONTEXT DEFINITIONS ---

export interface SystemState {
    settings: AppSettings;
    themes: ThemeDefinition[];
    isAiConfigured: boolean;
    systemLogs: SystemLog[];
    adminAdjustments: AdminAdjustment[];
    systemNotifications: SystemNotification[];
    scheduledEvents: ScheduledEvent[];
    chatMessages: ChatMessage[];
    bugReports: BugReport[];
    modifierDefinitions: ModifierDefinition[];
    appliedModifiers: AppliedModifier[];
    chronicleEvents: ChronicleEvent[];
    minigames: Minigame[];
    gameScores: GameScore[];
    aiTutors: AITutor[];
    aiTutorSessionLogs: AITutorSessionLog[];
    isUpdateAvailable: ServiceWorker | null;
}

export type SystemAction = 
  | { type: 'SET_SYSTEM_DATA', payload: Partial<SystemState> }
  | { type: 'UPDATE_SYSTEM_DATA', payload: Partial<SystemState> }
  | { type: 'REMOVE_SYSTEM_DATA', payload: { [key in keyof SystemState]?: string[] } }
  | { type: 'SET_AI_CONFIGURED', payload: boolean }
  | { type: 'SET_UPDATE_AVAILABLE', payload: ServiceWorker | null };

export interface SystemDispatch {
  deleteSelectedAssets: (assets: { [key in ShareableAssetType]?: string[] }, callback?: () => void) => Promise<void>;
  applyManualAdjustment: (adjustment: Omit<AdminAdjustment, 'id' | 'adjustedAt'>) => Promise<boolean>;
  uploadFile: (file: File, category?: string) => Promise<{url: string} | null>;
  addTheme: (themeData: Omit<ThemeDefinition, 'id'>) => Promise<ThemeDefinition | null>;
  updateTheme: (themeData: ThemeDefinition) => Promise<ThemeDefinition | null>;
  deleteTheme: (themeId: string) => Promise<void>;
  updateSettings: (newSettings: IAppData['settings']) => Promise<void>;
  resetSettings: () => Promise<void>;
  applySettingsUpdates: () => Promise<void>;
  clearAllHistory: () => Promise<void>;
  resetAllPlayerData: (includeAdmins: boolean) => Promise<void>;
  deleteAllCustomContent: () => Promise<void>;
  factoryReset: () => Promise<void>;
  addSystemNotification: (notificationData: Omit<SystemNotification, 'id' | 'timestamp' | 'readByUserIds' | 'createdAt' | 'updatedAt'>) => Promise<SystemNotification | null>;
  markSystemNotificationsAsRead: (notificationIds: string[], userId: string) => Promise<void>;
  addScheduledEvent: (eventData: Omit<ScheduledEvent, 'id'>) => Promise<ScheduledEvent | null>;
  updateScheduledEvent: (eventData: ScheduledEvent) => Promise<ScheduledEvent | null>;
  deleteScheduledEvent: (eventId: string) => Promise<void>;
  importAssetPack: (pack: any, resolutions: any, userIdsToAssign?: string[]) => Promise<void>;
  addBugReport: (reportData: Partial<BugReport>) => Promise<void>;
  updateBugReport: (reportId: string, updates: Partial<BugReport>) => Promise<BugReport | null>;
  deleteBugReports: (reportIds: string[]) => Promise<void>;
  importBugReports: (reports: BugReport[], mode: 'merge' | 'replace') => Promise<void>;
  addModifierDefinition: (modifierData: Omit<ModifierDefinition, 'id'>) => Promise<ModifierDefinition | null>;
  updateModifierDefinition: (modifierData: ModifierDefinition) => Promise<ModifierDefinition | null>;
  applyModifier: (userId: string, modifierId: string, reason: string, overrides?: Partial<ModifierDefinition>) => Promise<boolean>;
  deleteAppliedModifier: (modifierId: string) => Promise<void>;
  cloneUser: (userId: string) => Promise<User | null>;
  sendMessage: (messageData: { recipientId?: string; guildId?: string; message: string; isAnnouncement?: boolean; }) => Promise<ChatMessage | null>;
  markMessagesAsRead: (payload: { partnerId?: string; guildId?: string }) => Promise<void>;
  playMinigame: (gameId: string) => Promise<boolean>;
  submitScore: (gameId: string, score: number) => Promise<GameScore | null>;
  updateMinigame: (gameId: string, data: Partial<Minigame>) => Promise<Minigame | null>;
  resetAllScoresForGame: (gameId: string) => Promise<void>;
  resetScoresForUsers: (gameId: string, userIds: string[]) => Promise<void>;
  addAITutor: (tutorData: Omit<AITutor, 'id'>) => Promise<AITutor | null>;
  updateAITutor: (tutorData: AITutor) => Promise<AITutor | null>;
  deleteAITutors: (tutorIds: string[]) => Promise<void>;
  setUpdateAvailable: (worker: ServiceWorker | null) => void;
  installUpdate: () => void;
  checkForUpdate: () => Promise<void>;
}

const SystemStateContext = createContext<SystemState | undefined>(undefined);
export const SystemDispatchContext = createContext<{ dispatch: React.Dispatch<SystemAction>, actions: SystemDispatch } | undefined>(undefined);

const initialState: SystemState = {
    settings: INITIAL_SETTINGS,
    themes: [],
    isAiConfigured: false,
    systemLogs: [],
    adminAdjustments: [],
    systemNotifications: [],
    scheduledEvents: [],
    chatMessages: [],
    bugReports: [],
    modifierDefinitions: [],
    appliedModifiers: [],
    chronicleEvents: [],
    minigames: [],
    gameScores: [],
    aiTutors: [],
    aiTutorSessionLogs: [],
    isUpdateAvailable: null,
};

const systemReducer = (state: SystemState, action: SystemAction): SystemState => {
    switch (action.type) {
        case 'SET_AI_CONFIGURED':
            return { ...state, isAiConfigured: action.payload };
        case 'SET_UPDATE_AVAILABLE':
            return { ...state, isUpdateAvailable: action.payload };
        case 'SET_SYSTEM_DATA':
            return { ...state, ...action.payload };
        case 'UPDATE_SYSTEM_DATA': {
            const updatedState = { ...state };
            for (const key in action.payload) {
                const typedKey = key as keyof SystemState;
                if (Array.isArray(updatedState[typedKey])) {
                    const existingItems = new Map((updatedState[typedKey] as any[]).map(item => [item.id, item]));
                    const itemsToUpdate = action.payload[typedKey];
                    if (Array.isArray(itemsToUpdate)) {
                        itemsToUpdate.forEach(newItem => existingItems.set(newItem.id, newItem));
                    }
                    (updatedState as any)[typedKey] = Array.from(existingItems.values());
                } else if (typeof updatedState[typedKey] === 'object' && updatedState[typedKey] !== null) {
                    (updatedState as any)[typedKey] = { ...(updatedState[typedKey] as object), ...(action.payload[typedKey] as object) };
                } else {
                    (updatedState as any)[typedKey] = action.payload[typedKey];
                }
            }
            return updatedState;
        }
        case 'REMOVE_SYSTEM_DATA': {
            const stateWithRemoved = { ...state };
            for (const key in action.payload) {
                const typedKey = key as keyof SystemState;
                if (Array.isArray(stateWithRemoved[typedKey])) {
                    const idsToRemove = new Set(action.payload[typedKey] as string[]);
                    (stateWithRemoved as any)[typedKey] = ((stateWithRemoved as any)[typedKey] as any[]).filter(item => !idsToRemove.has(item.id));
                }
            }
            return stateWithRemoved;
        }
        default:
            return state;
    }
};

export const SystemProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(systemReducer, initialState);
    const { addNotification } = useNotificationsDispatch();
    const { updateUser, deleteUsers, setUsers } = useAuthDispatch();
    const { currentUser } = useAuthState();

    const setUpdateAvailable = useCallback((worker: ServiceWorker | null) => {
        dispatch({ type: 'SET_UPDATE_AVAILABLE', payload: worker });
    }, []);

    // --- Service Worker Update Listener ---
    useEffect(() => {
        const handleUpdateAvailable = (event: Event) => {
            const customEvent = event as CustomEvent<ServiceWorker>;
            swLogger.log('SW_UPDATE_AVAILABLE_EVENT_RECEIVED', { state: customEvent.detail?.state });
            setUpdateAvailable(customEvent.detail);
        };

        window.addEventListener('swUpdateAvailable', handleUpdateAvailable);

        return () => {
            window.removeEventListener('swUpdateAvailable', handleUpdateAvailable);
        };
    }, [setUpdateAvailable]);

    const apiAction = useCallback(async <T,>(apiFn: () => Promise<T | null>, successMessage?: string): Promise<T | null> => {
        try {
            const result = await apiFn();
            if (successMessage) addNotification({ type: 'success', message: successMessage });
            return result;
        } catch (error) {
            addNotification({ type: 'error', message: error instanceof Error ? error.message : String(error) });
            bugLogger.add({ type: 'STATE_CHANGE', message: `API Error: ${error instanceof Error ? error.message : String(error)}` });
            return null;
        }
    }, [addNotification]);
    
    const createAddAction = useCallback(<T_ADD, T_RETURN extends { id: any }, D extends keyof SystemState>(dataType: D) => 
        async (data: T_ADD): Promise<T_RETURN | null> => {
            const result = await apiAction(() => addThemeAPI(data as any)); // This needs to be more generic
            if (result) dispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { [dataType]: [result] } as any });
            return result as T_RETURN | null;
        }, [apiAction]);
        
    const createUpdateAction = useCallback(<T extends { id: any }, D extends keyof SystemState>(dataType: D) => 
        async (data: T): Promise<T | null> => {
            const result = await apiAction(() => updateThemeAPI(data as any)); // This needs to be more generic
            if (result) dispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { [dataType]: [result] } as any });
            return result as T | null;
        }, [apiAction]);

    const checkForUpdate = useCallback(async () => {
        addNotification({ type: 'info', message: 'Checking for updates...' });
        if (window.checkForUpdate) {
            await window.checkForUpdate();
            // The listener in index.tsx will fire an event if an update is found.
            // Check for a waiting update after a short delay to provide feedback if no new update was found.
            setTimeout(async () => {
                 const registration = await navigator.serviceWorker.getRegistration();
                 if (!registration?.waiting) {
                    addNotification({ type: 'success', message: 'You are on the latest version.' });
                 }
            }, 1500);
        } else {
            addNotification({ type: 'error', message: 'Update checker is not available.' });
            swLogger.log('MANUAL_CHECK_FAILED', { reason: 'window.checkForUpdate is not defined.' });
        }
    }, [addNotification]);

    const installUpdate = useCallback(() => {
        if (state.isUpdateAvailable) {
            swLogger.log('INSTALL_UPDATE_TRIGGERED');
            addNotification({ type: 'info', message: 'Installing update... The app will reload shortly.' });
            state.isUpdateAvailable.postMessage({ type: 'SKIP_WAITING' });
        } else {
            swLogger.log('INSTALL_UPDATE_FAILED', { reason: 'No update available to install.' });
        }
    }, [state.isUpdateAvailable, addNotification]);

    const actions = useMemo<SystemDispatch>(() => ({
        deleteSelectedAssets: async (assets, callback) => {
            if (!currentUser) return;
            await apiAction(() => deleteSelectedAssetsAPI(assets, currentUser.id));
            const assetsToRemove: { [key in keyof SystemState]?: string[] } = {};
            if (assets.users) { deleteUsers(assets.users); }
            Object.keys(assets).forEach(key => {
                if (key !== 'users') (assetsToRemove as any)[key] = assets[key as ShareableAssetType];
            });
            if (Object.keys(assetsToRemove).length > 0) dispatch({ type: 'REMOVE_SYSTEM_DATA', payload: assetsToRemove });
            if (callback) callback();
        },
        applyManualAdjustment: async (adjustment) => {
            const result = await apiAction(() => applyManualAdjustmentAPI(adjustment));
            if (result && (result as any).newAdjustment) {
                const { updatedUser, newAdjustment, newUserTrophy } = result as any;
                dispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { adminAdjustments: [newAdjustment] } });
                if (updatedUser) updateUser(updatedUser.id, updatedUser);
                addNotification({ type: 'success', message: 'Adjustment applied.' });
                return true;
            }
            return false;
        },
        uploadFile: (file, category) => apiAction(() => uploadFileAPI(file, category)),
        addTheme: (data) => apiAction(() => addThemeAPI(data)),
        updateTheme: (data) => apiAction(() => updateThemeAPI(data)),
        deleteTheme: (id) => apiAction(() => deleteThemeAPI(id)),
        updateSettings: (settings) => apiAction(() => updateSettingsAPI(settings), 'Settings saved!'),
        resetSettings: () => apiAction(() => resetSettingsAPI(), 'All application settings have been reset to their defaults.'),
        applySettingsUpdates: () => apiAction(() => applySettingsUpdatesAPI(), 'Feature updates applied successfully. New default settings have been merged.'),
        clearAllHistory: () => apiAction(() => clearAllHistoryAPI(), 'All historical records have been permanently deleted.'),
        resetAllPlayerData: (includeAdmins) => apiAction(() => resetAllPlayerDataAPI(includeAdmins), 'Player data has been reset for selected users.'),
        deleteAllCustomContent: () => apiAction(() => deleteAllCustomContentAPI(), 'All custom content has been deleted.'),
        factoryReset: async () => {
            const result = await apiAction(() => factoryResetAPI(), "Factory reset complete. The application will now reload to the setup wizard.");
            if (result === null) {
                setTimeout(() => {
                    localStorage.clear();
                    window.location.reload();
                }, 2000);
            }
        },
        addSystemNotification: (data) => apiAction(() => addSystemNotificationAPI(data)),
        markSystemNotificationsAsRead: (ids, userId) => apiAction(() => markSystemNotificationsAsReadAPI(ids, userId)),
        addScheduledEvent: (data) => apiAction(() => addScheduledEventAPI(data)),
        updateScheduledEvent: (data) => apiAction(() => updateScheduledEventAPI(data)),
        deleteScheduledEvent: (id) => apiAction(() => deleteScheduledEventAPI(id)),
        importAssetPack: (pack, resolutions, userIdsToAssign) => {
            if (!currentUser) return Promise.resolve();
            return apiAction(() => importAssetPackAPI(pack, resolutions, currentUser.id, userIdsToAssign), 'Asset pack imported successfully!')
        },
        addBugReport: async (report) => {
            await apiAction(() => addBugReportAPI(report));
        },
        updateBugReport: async (id, updates) => {
            const result = await apiAction(() => updateBugReportAPI(id, updates));
            if (result) {
                dispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { bugReports: [result] } });
            }
            return result;
        },
        deleteBugReports: async (ids) => {
            const result = await apiAction(() => deleteBugReportsAPI(ids));
            if (result === null) { // Expect 204 No Content on success
                dispatch({ type: 'REMOVE_SYSTEM_DATA', payload: { bugReports: ids } });
            }
        },
        importBugReports: async (reports, mode) => {
            await apiAction(() => importBugReportsAPI(reports, mode));
        },
        addModifierDefinition: (data) => apiAction(() => addModifierDefinitionAPI(data)),
        updateModifierDefinition: (data) => apiAction(() => updateModifierDefinitionAPI(data)),
        applyModifier: async (userId, modifierId, reason, overrides) => {
            if (!currentUser) return false;
            const result = await apiAction(() => applyModifierAPI(userId, modifierId, reason, currentUser.id, overrides));
            if (result) {
                if ((result as any).updatedUser) updateUser((result as any).updatedUser.id, (result as any).updatedUser);
                if ((result as any).newAppliedModifier) dispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { appliedModifiers: [(result as any).newAppliedModifier] } });
                return true;
            }
            return false;
        },
        deleteAppliedModifier: async (modifierId: string) => {
            const result = await apiAction(() => deleteAppliedModifiersAPI([modifierId]));
            if (result === null) { // Expect 204 No Content on success
                dispatch({ type: 'REMOVE_SYSTEM_DATA', payload: { appliedModifiers: [modifierId] } });
                addNotification({ type: 'info', message: 'Active modifier removed.' });
            }
        },
        cloneUser: async (userId) => {
            const result = await apiAction(() => cloneUserAPI(userId));
            if (result) {
                setUsers(prev => [...prev, result]);
                addNotification({ type: 'success', message: `User "${result.gameName}" cloned.` });
            }
            return result;
        },
        sendMessage: async (messageData) => {
            if (!currentUser) return null;
            const result = await apiAction(() => sendMessageAPI({ ...messageData, senderId: currentUser.id }));
            if (result) dispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { chatMessages: [result] } });
            return result;
        },
        markMessagesAsRead: async (payload) => {
            if (!currentUser) return;
            await apiAction(() => markMessagesAsReadAPI({ ...payload, userId: currentUser.id }));
        },
        playMinigame: async (gameId) => {
            if (!currentUser) return false;
            const result = await apiAction(() => playMinigameAPI(gameId, currentUser.id));
            if (result) {
                if ((result as any).updatedUser) updateUser((result as any).updatedUser.id, (result as any).updatedUser);
                return true;
            }
            return false;
        },
        submitScore: async (gameId, score) => {
            if (!currentUser) return null;
            const result = await apiAction(() => submitScoreAPI({ gameId, userId: currentUser.id, score }));
            if (result) {
                dispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { gameScores: [result] } });
            }
            return result;
        },
        updateMinigame: async (gameId, data) => {
            const result = await apiAction(() => updateMinigameAPI(gameId, data), 'Game updated!');
            if (result) {
                dispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { minigames: [result] } });
            }
            return result;
        },
        resetAllScoresForGame: async (gameId) => {
            await apiAction(() => resetAllScoresForGameAPI(gameId), `All scores for game reset.`);
            dispatch({
                type: 'SET_SYSTEM_DATA',
                payload: { gameScores: state.gameScores.filter(s => s.gameId !== gameId) }
            });
        },
        resetScoresForUsers: async (gameId, userIds) => {
            await apiAction(() => resetScoresForUsersAPI(gameId, userIds), `Scores reset for selected users.`);
            const userIdsSet = new Set(userIds);
            dispatch({
                type: 'SET_SYSTEM_DATA',
                payload: {
                    gameScores: state.gameScores.filter(s => !(s.gameId === gameId && userIdsSet.has(s.userId)))
                }
            });
        },
        addAITutor: async (data) => {
            const result = await apiAction(() => addAITutorAPI(data), 'AI Tutor created!');
            if (result) dispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { aiTutors: [result] } });
            return result;
        },
        updateAITutor: async (data) => {
            const result = await apiAction(() => updateAITutorAPI(data), 'AI Tutor updated!');
            if (result) dispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { aiTutors: [result] } });
            return result;
        },
        deleteAITutors: async (ids) => {
            await apiAction(() => deleteSelectedAssetsAPI({ aiTutors: ids }, currentUser?.id || 'system'), `${ids.length} AI Tutor(s) deleted.`);
            dispatch({ type: 'REMOVE_SYSTEM_DATA', payload: { aiTutors: ids } });
        },
        setUpdateAvailable: (worker: ServiceWorker | null) => {
            dispatch({ type: 'SET_UPDATE_AVAILABLE', payload: worker });
        },
        installUpdate,
        checkForUpdate,
    }), [apiAction, addNotification, currentUser, updateUser, deleteUsers, setUsers, state.isUpdateAvailable, checkForUpdate, installUpdate, setUpdateAvailable, state.gameScores]);

    const contextValue = useMemo(() => ({ dispatch, actions }), [dispatch, actions]);

    return (
        <SystemStateContext.Provider value={state}>
            <SystemDispatchContext.Provider value={contextValue}>
                {children}
            </SystemDispatchContext.Provider>
        </SystemStateContext.Provider>
    );
};

export const useSystemState = (): SystemState => {
    const context = useContext(SystemStateContext);
    if (context === undefined) throw new Error('useSystemState must be used within a SystemProvider');
    return context;
};

export const useSystemDispatch = (): SystemDispatch => {
    const context = useContext(SystemDispatchContext);
    if (context === undefined) throw new Error('useSystemDispatch must be used within a SystemProvider');
    return context.actions;
};

export const useSystemReducerDispatch = (): React.Dispatch<SystemAction> => {
    const context = useContext(SystemDispatchContext);
    if (!context) {
        throw new Error('useSystemReducerDispatch must be used within a SystemProvider');
    }
    return context.dispatch;
};