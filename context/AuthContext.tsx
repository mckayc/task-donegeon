import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import { User, Role } from '../types';
import { useNotificationsDispatch } from './NotificationsContext';
import { bugLogger } from '../utils/bugLogger';

// State managed by this context
interface AuthState {
  users: User[];
  currentUser: User | null;
  isAppUnlocked: boolean;
  isFirstRun: boolean;
  isSwitchingUser: boolean;
  isSharedViewActive: boolean;
  targetedUserForLogin: User | null;
  loginHistory: string[];
}

// Dispatch functions provided by this context
interface AuthDispatch {
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
}

const AuthStateContext = createContext<AuthState | undefined>(undefined);
const AuthDispatchContext = createContext<AuthDispatch | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addNotification } = useNotificationsDispatch();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, _setCurrentUser] = useState<User | null>(null);
  const [isAppUnlocked, _setAppUnlocked] = useState<boolean>(() => localStorage.getItem('isAppUnlocked') === 'true');
  const [isSwitchingUser, setIsSwitchingUser] = useState<boolean>(false);
  const [isSharedViewActive, setIsSharedViewActive] = useState(false);
  const [targetedUserForLogin, setTargetedUserForLogin] = useState<User | null>(null);
  const [loginHistory, setLoginHistory] = useState<string[]>([]);
  
  const isFirstRun = users.length === 0;

  const apiRequest = useCallback(async (method: string, path: string, body?: any) => {
    try {
        const options: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) options.body = JSON.stringify(body);
        const response = await window.fetch(path, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Server error' }));
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }
        if (response.status === 204) return null;
        return await response.json();
    } catch (error) {
        addNotification({ type: 'error', message: error instanceof Error ? error.message : 'An unknown network error occurred.' });
        throw error;
    }
  }, [addNotification]);
  
  const completeFirstRun = useCallback(async (adminUserData: any) => {
    try {
        await apiRequest('POST', '/api/first-run', { adminUserData });
        addNotification({ type: 'success', message: 'Setup complete! The app will now reload.' });
        setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
        // Error is already handled by apiRequest
    }
  }, [apiRequest, addNotification]);

  const setCurrentUser = useCallback((user: User | null) => {
    // Prevent redundant state sets and log entries
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

  const exitToSharedView = useCallback(() => {
    _setCurrentUser(null);
    setIsSharedViewActive(true);
    localStorage.removeItem('lastUserId');
  }, []);

  const addUser = useCallback(async (userData: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>): Promise<User | null> => {
    if (bugLogger.isRecording()) {
        bugLogger.add({ type: 'ACTION', message: `Attempting to add user: ${userData.gameName}` });
    }
    try {
        const newUser = await apiRequest('POST', '/api/users', userData);
        // The backend will broadcast a data update, so a manual state update here is not needed.
        // The sync will handle it.
        return newUser;
    } catch (error) {
        console.error("Failed to add user on server.", error);
        return null;
    }
  }, [apiRequest]);

  const updateUser = useCallback((userId: string, update: Partial<User> | ((user: User) => User), persist = true) => {
    if (bugLogger.isRecording()) {
        bugLogger.add({ type: 'ACTION', message: `Updating user ID: ${userId}` });
    }
    // Optimistic UI update
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;
    const finalUpdatePayload = typeof update === 'function' ? update({ ...userToUpdate }) : { ...userToUpdate, ...update };
    
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? finalUpdatePayload : u));
    
    if (currentUser?.id === userId) {
        _setCurrentUser(finalUpdatePayload);
    }
    
    // Persist to backend only if requested
    if (persist) {
      const payloadForApi = typeof update === 'function' ? finalUpdatePayload : update;
      apiRequest('PUT', `/api/users/${userId}`, payloadForApi).catch(error => {
          console.error("Failed to update user on server, optimistic update may be stale.", error);
          // Error notification is handled by apiRequest. Sync will correct the state.
      });
    }
  }, [users, currentUser, apiRequest]);
  
  const deleteUsers = useCallback((userIds: string[]) => {
    if (userIds.length === 0) return;
    if (bugLogger.isRecording()) {
        bugLogger.add({ type: 'ACTION', message: `Deleting user IDs: ${userIds.join(', ')}` });
    }
    setUsers(prev => prev.filter(u => !userIds.includes(u.id)));
    apiRequest('DELETE', '/api/users', { ids: userIds }).catch(error => {
       console.error("Failed to delete users on server.", error);
    });
  }, [apiRequest]);

  const markUserAsOnboarded = useCallback((userId: string) => updateUser(userId, { hasBeenOnboarded: true }), [updateUser]);

  const setAppUnlocked = useCallback((isUnlocked: boolean) => {
    localStorage.setItem('isAppUnlocked', String(isUnlocked));
    _setAppUnlocked(isUnlocked);
  }, []);

  const resetAllUsersData = useCallback(() => {
      setUsers(prev => prev.map(u => u.role !== Role.DonegeonMaster ? { ...u, personalPurse: {}, personalExperience: {}, guildBalances: {}, ownedAssetIds: [], avatar: {} } : u));
      // This should also trigger a backend update loop for all users.
      // For simplicity in this refactor, we are keeping it client-side optimistic.
  }, []);

  const stateValue = useMemo(() => ({
    users, currentUser, isAppUnlocked, isFirstRun, isSwitchingUser,
    isSharedViewActive, targetedUserForLogin, loginHistory
  }), [users, currentUser, isAppUnlocked, isFirstRun, isSwitchingUser, isSharedViewActive, targetedUserForLogin, loginHistory]);

  const dispatchValue = useMemo(() => ({
    setUsers, setLoginHistory, addUser, updateUser, deleteUsers, setCurrentUser, markUserAsOnboarded,
    setAppUnlocked, setIsSwitchingUser, setTargetedUserForLogin,
    exitToSharedView, setIsSharedViewActive, resetAllUsersData,
    completeFirstRun,
  }), [addUser, updateUser, deleteUsers, setCurrentUser, markUserAsOnboarded, setAppUnlocked, setIsSwitchingUser, setTargetedUserForLogin, exitToSharedView, setIsSharedViewActive, resetAllUsersData, completeFirstRun]);

  return (
    <AuthStateContext.Provider value={stateValue}>
      <AuthDispatchContext.Provider value={dispatchValue}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthStateContext.Provider>
  );
};

export const useAuthState = (): AuthState => {
  const context = useContext(AuthStateContext);
  if (context === undefined) throw new Error('useAuthState must be used within an AuthProvider');
  return context;
};

export const useAuthDispatch = (): AuthDispatch => {
  const context = useContext(AuthDispatchContext);
  if (context === undefined) throw new Error('useAuthDispatch must be used within an AuthProvider');
  return context;
};