import React, { createContext, useContext, ReactNode, useReducer, useMemo, useCallback } from 'react';
import { AppSettings, ThemeDefinition, SystemLog, AdminAdjustment, SystemNotification, ScheduledEvent, ChatMessage, BugReport, ModifierDefinition, AppliedModifier, IAppData, ShareableAssetType, User } from '../types';
import { INITIAL_SETTINGS } from '../data/initialData';
import { useNotificationsDispatch } from './NotificationsContext';
import { useAuthDispatch, useAuthState } from './AuthContext';
import { bugLogger } from '../utils/bugLogger';

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
}

export type SystemAction = 
  | { type: 'SET_SYSTEM_DATA', payload: Partial<SystemState> }
  | { type: 'UPDATE_SYSTEM_DATA', payload: Partial<SystemState> }
  | { type: 'REMOVE_SYSTEM_DATA', payload: { [key in keyof SystemState]?: string[] } }
  | { type: 'SET_AI_CONFIGURED', payload: boolean };

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
  resetAllPlayerData: () => Promise<void>;
  deleteAllCustomContent: () => Promise<void>;
  factoryReset: () => Promise<void>;
  addSystemNotification: (notificationData: Omit<SystemNotification, 'id' | 'timestamp' | 'readByUserIds' | 'createdAt' | 'updatedAt'>) => Promise<SystemNotification | null>;
  markSystemNotificationsAsRead: (notificationIds: string[], userId: string) => Promise<void>;
  addScheduledEvent: (eventData: Omit<ScheduledEvent, 'id'>) => Promise<ScheduledEvent | null>;
  updateScheduledEvent: (eventData: ScheduledEvent) => Promise<ScheduledEvent | null>;
  deleteScheduledEvent: (eventId: string) => Promise<void>;
  importAssetPack: (pack: any, resolutions: any) => Promise<void>;
  addBugReport: (reportData: Partial<BugReport>) => Promise<void>;
  updateBugReport: (reportId: string, updates: Partial<BugReport>) => Promise<BugReport | null>;
  deleteBugReports: (reportIds: string[]) => Promise<void>;
  importBugReports: (reports: BugReport[], mode: 'merge' | 'replace') => Promise<void>;
  addModifierDefinition: (modifierData: Omit<ModifierDefinition, 'id'>) => Promise<ModifierDefinition | null>;
  updateModifierDefinition: (modifierData: ModifierDefinition) => Promise<ModifierDefinition | null>;
  applyModifier: (userId: string, modifierId: string, reason: string, overrides?: Partial<ModifierDefinition>) => Promise<boolean>;
  cloneUser: (userId: string) => Promise<User | null>;
  sendMessage: (messageData: { recipientId?: string; guildId?: string; message: string; isAnnouncement?: boolean; }) => Promise<ChatMessage | null>;
  markMessagesAsRead: (payload: { partnerId?: string; guildId?: string }) => Promise<void>;
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
};

const systemReducer = (state: SystemState, action: SystemAction): SystemState => {
    switch (action.type) {
        case 'SET_AI_CONFIGURED':
            return { ...state, isAiConfigured: action.payload };
        case 'SET_SYSTEM_DATA':
            return { ...state, ...action.payload };
        case 'UPDATE_SYSTEM_DATA': {
            const updatedState = { ...state };
            for (const key in action.payload) {
                const typedKey = key as keyof SystemState;
                if (Array.isArray(updatedState[typedKey])) {
                    const existingItems = new Map((updatedState[typedKey] as any[]).map(item => [item.id, item]));
                    (action.payload[typedKey] as any[]).forEach(newItem => existingItems.set(newItem.id, newItem));
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

    const apiRequest = useCallback(async (method: string, path: string, body?: any) => {
        try {
            const options: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
            if (body) options.body = JSON.stringify(body);
            const response = await window.fetch(path, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Server error' }));
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }
            return response.status === 204 ? null : await response.json();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown network error occurred.';
            addNotification({ type: 'error', message });
            bugLogger.add({ type: 'STATE_CHANGE', message: `API Error: ${method} ${path} - ${message}` });
            return null;
        }
    }, [addNotification]);

    const createAddAction = <T_ADD, T_RETURN extends { id: any }, D extends keyof SystemState>(path: string, dataType: D) => 
        async (data: T_ADD): Promise<T_RETURN | null> => {
            const result = await apiRequest('POST', path, data);
            if (result) dispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { [dataType]: [result] } as any });
            return result;
        };
        
    const createUpdateAction = <T extends { id: any }, D extends keyof SystemState>(pathTemplate: (id: any) => string, dataType: D) => 
        async (data: T): Promise<T | null> => {
            const result = await apiRequest('PUT', pathTemplate(data.id), data);
            if (result) dispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { [dataType]: [result] } as any });
            return result;
        };

    const actions = useMemo<SystemDispatch>(() => ({
        deleteSelectedAssets: async (assets, callback) => {
            const assetsToRemove: { [key in keyof SystemState]?: string[] } = {};
            for (const key in assets) {
                const assetType = key as ShareableAssetType;
                const ids = assets[assetType];
                if (!ids || ids.length === 0) continue;
                if (assetType === 'users') {
                    deleteUsers(ids);
                } else {
                    const apiPath = assetType === 'modifierDefinitions' ? 'setbacks' : assetType;
                    await apiRequest('DELETE', `/api/${apiPath}`, { ids });
                    (assetsToRemove as any)[assetType] = ids;
                }
            }
            if (Object.keys(assetsToRemove).length > 0) {
                dispatch({ type: 'REMOVE_SYSTEM_DATA', payload: assetsToRemove });
            }
            if (callback) callback();
        },
        applyManualAdjustment: async (adjustment) => {
            const result = await apiRequest('POST', '/api/users/adjust', adjustment);
            if (result && result.newAdjustment) {
                const updates: Partial<SystemState> = { adminAdjustments: [result.newAdjustment] };
                if (result.newUserTrophy) {
                    // This needs to be dispatched to progression context.
                    // For now, we assume the full sync will catch it, or a more complex system is needed.
                }
                dispatch({ type: 'UPDATE_SYSTEM_DATA', payload: updates });
                if (result.updatedUser) updateUser(result.updatedUser.id, result.updatedUser);
                addNotification({ type: 'success', message: 'Adjustment applied.' });
                return true;
            }
            return false;
        },
        uploadFile: (file, category) => {
            const formData = new FormData();
            formData.append('file', file);
            if (category) formData.append('category', category);
            // This needs a non-JSON apiRequest, so it's handled separately.
            return fetch('/api/media/upload', { method: 'POST', body: formData })
                .then(res => res.ok ? res.json() : Promise.reject('Upload failed'))
                .catch(() => {
                    addNotification({ type: 'error', message: 'File upload failed.' });
                    return null;
                });
        },
        addTheme: createAddAction('/api/themes', 'themes'),
        updateTheme: createUpdateAction(id => `/api/themes/${id}`, 'themes'),
        deleteTheme: (id) => apiRequest('DELETE', `/api/themes`, { ids: [id] }),
        updateSettings: async (settings) => {
            const result = await apiRequest('PUT', '/api/settings', settings);
            if (result) dispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { settings: result } });
        },
        resetSettings: () => apiRequest('POST', '/api/data/reset-settings'),
        applySettingsUpdates: () => apiRequest('POST', '/api/data/apply-updates'),
        clearAllHistory: () => apiRequest('POST', '/api/data/clear-history'),
        resetAllPlayerData: () => apiRequest('POST', '/api/data/reset-players'),
        deleteAllCustomContent: () => apiRequest('POST', '/api/data/delete-content'),
        factoryReset: () => apiRequest('POST', '/api/data/factory-reset'),
        addSystemNotification: createAddAction('/api/notifications', 'systemNotifications'),
        markSystemNotificationsAsRead: (ids, userId) => apiRequest('POST', '/api/notifications/read', { ids, userId }),
        addScheduledEvent: createAddAction('/api/events', 'scheduledEvents'),
        updateScheduledEvent: createUpdateAction(id => `/api/events/${id}`, 'scheduledEvents'),
        deleteScheduledEvent: (id) => apiRequest('DELETE', `/api/events/${id}`),
        importAssetPack: (pack, resolutions) => apiRequest('POST', '/api/data/import-assets', { assetPack: pack, resolutions }),
        addBugReport: async (report) => {
            const result = await apiRequest('POST', '/api/bug-reports', report);
            if (result) dispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { bugReports: [result] } });
        },
        updateBugReport: async (id, updates) => {
            const result = await apiRequest('PUT', `/api/bug-reports/${id}`, updates);
            if (result) dispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { bugReports: [result] } });
            return result;
        },
        deleteBugReports: (ids) => apiRequest('DELETE', '/api/bug-reports', { ids }),
        importBugReports: async (reports, mode) => {
            const result = await apiRequest('POST', '/api/bug-reports/import', { reports, mode });
            if (result) dispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { bugReports: result } });
        },
        addModifierDefinition: createAddAction('/api/setbacks', 'modifierDefinitions'),
        updateModifierDefinition: createUpdateAction(id => `/api/setbacks/${id}`, 'modifierDefinitions'),
        applyModifier: async (userId, modifierId, reason, overrides) => {
            if (!currentUser) return false;
            const result = await apiRequest('POST', '/api/applied-modifiers/apply', { userId, modifierDefinitionId: modifierId, reason, appliedById: currentUser.id, overrides });
            if (result) {
                if (result.updatedUser) updateUser(result.updatedUser.id, result.updatedUser);
                if (result.newAppliedModifier) dispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { appliedModifiers: [result.newAppliedModifier] } });
                return true;
            }
            return false;
        },
        cloneUser: async (userId) => {
            const result = await apiRequest('POST', `/api/users/clone/${userId}`);
            if (result) addNotification({ type: 'success', message: `User "${result.gameName}" cloned.` });
            return result;
        },
        sendMessage: async (messageData) => {
            if (!currentUser) return null;
            const result = await apiRequest('POST', '/api/chat/send', { ...messageData, senderId: currentUser.id });
            if (result) dispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { chatMessages: [result] } });
            return result;
        },
        markMessagesAsRead: async (payload) => {
            if (!currentUser) return;
            const result = await apiRequest('POST', '/api/chat/read', { ...payload, userId: currentUser.id });
            if (result && result.updatedMessages) dispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { chatMessages: result.updatedMessages } });
        },
    }), [apiRequest, createAddAction, createUpdateAction, currentUser, deleteUsers, updateUser, addNotification]);

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
