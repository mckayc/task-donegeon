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
  updateUser: (userId: string, update: Partial<User> | ((user: User) => Partial<User>)) => void;
  deleteUsers: (userIds: string[]) => void;
  setCurrentUser: (user: User | null) => void;
  markUserAsOnboarded: (userId: string) => void;
  setAppUnlocked: (isUnlocked: boolean) => void;
  setIsSwitchingUser: (isSwitching: boolean) => void;
  setTargetedUserForLogin: (user: User | null) => void;
  exitToSharedView: () => void;
  setIsSharedViewActive: (isActive: boolean) => void;
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
          const options: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
          if (body) options.body = JSON.stringify(body);
          const response = await window.fetch(path, options);
          if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: 'Server error' }));
              throw new Error(errorData.error || `Request failed with status ${response.status}`);
          }
          return response.status === 204 ? null : await response.json();
      } catch (error) {
          addNotification({ type: 'error', message: error instanceof Error ? error.message : 'An unknown network error occurred.' });
          throw error;
      }
  }, [addNotification]);

  const setCurrentUser = useCallback((user: User | null) => {
      _setCurrentUser(prevUser => {
          // Idempotency check: only update if the user is actually different.
          // This prevents re-renders when sync provides an identical user object.
          if (JSON.stringify(prevUser) === JSON.stringify(user)) {
              return prevUser;
          }

          if (bugLogger.isRecording()) {
              bugLogger.add({ type: 'STATE_CHANGE', message: `Setting current user to: ${user?.gameName || 'null'}` });
          }
          setIsSharedViewActive(false);
          if (user) {
              localStorage.setItem('lastUserId', user.id);
              setLoginHistory(prev => [user.id, ...prev.filter(id => id !== user.id).slice(0, 9)]);
          } else {
              localStorage.removeItem('lastUserId');
          }
          return user;
      });
  }, []);

  const updateUser = useCallback((userId: string, update: Partial<User> | ((user: User) => Partial<User>)) => {
    if (bugLogger.isRecording()) {
        bugLogger.add({ type: 'ACTION', message: `Updating user ID: ${userId}` });
    }

    // This implementation optimistically updates state. A functional update is tricky because
    // we need access to the current user state, which can be stale in this closure.
    // However, all current call sites pass an object, so we can proceed with a safer assumption.
    if (typeof update === 'function') {
        // This is the safest way to handle functional updates without creating a dependency on the `users` array,
        // which would cause performance issues. All state updates happen within the `setUsers` callback.
        setUsers(prevUsers => {
            const userToUpdate = prevUsers.find(u => u.id === userId);
            if (!userToUpdate) return prevUsers;

            const updateData = update(userToUpdate);
            const isFullObject = 'id' in updateData;

            // Update current user state if they're the one being changed
            _setCurrentUser(prevCurrentUser => 
                prevCurrentUser?.id === userId ? { ...prevCurrentUser, ...updateData } : prevCurrentUser
            );
            
            // Trigger API call if it's not a full sync object
            if (Object.keys(updateData).length > 0 && !isFullObject) {
                apiRequest('PUT', `/api/users/${userId}`, updateData).catch(error => {
                    console.error("Failed to update user on server; optimistic update may be stale.", error);
                });
            }

            // Return the updated list
            return prevUsers.map(u => u.id === userId ? { ...u, ...updateData } : u);
        });
    } else {
        // For simple object updates, we can determine the payload upfront.
        const updateData = update;
        const isFullObject = 'id' in updateData;
        
        // Optimistically update both `users` and `currentUser` states
        setUsers(prevUsers => prevUsers.map(u => (u.id === userId ? { ...u, ...updateData } : u)));
        _setCurrentUser(prevCurrentUser => (prevCurrentUser?.id === userId ? { ...prevCurrentUser, ...updateData } : prevCurrentUser));

        // Trigger the API call only for partial updates originating from the UI
        if (Object.keys(updateData).length > 0 && !isFullObject) {
            apiRequest('PUT', `/api/users/${userId}`, updateData).catch(error => {
                console.error("Failed to update user on server; optimistic update may be stale.", error);
            });
        }
    }
  }, [apiRequest]);
  
  const markUserAsOnboarded = useCallback((userId: string) => updateUser(userId, { hasBeenOnboarded: true }), [updateUser]);

  const setAppUnlocked = useCallback((isUnlocked: boolean) => {
      localStorage.setItem('isAppUnlocked', String(isUnlocked));
      _setAppUnlocked(isUnlocked);
  }, []);

  const exitToSharedView = useCallback(() => {
      _setCurrentUser(null);
      setIsSharedViewActive(true);
      localStorage.removeItem('lastUserId');
  }, []);

  const addUser = useCallback(async (userData: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>) => {
      if (bugLogger.isRecording()) {
          bugLogger.add({ type: 'ACTION', message: `Attempting to add user: ${userData.gameName}` });
      }
      try {
          return await apiRequest('POST', '/api/users', userData);
      } catch (error) {
          console.error("Failed to add user on server.", error);
          return null;
      }
  }, [apiRequest]);

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
  
  const completeFirstRun = useCallback(async (adminUserData: any) => {
      try {
          await apiRequest('POST', '/api/first-run', { adminUserData });
          addNotification({ type: 'success', message: 'Setup complete! The app will now reload.' });
          setTimeout(() => window.location.reload(), 2000);
      } catch (error) {}
  }, [apiRequest, addNotification]);
  
  const dispatch = useMemo(() => ({
      setUsers,
      setLoginHistory,
      addUser,
      updateUser,
      deleteUsers,
      setCurrentUser,
      markUserAsOnboarded,
      setAppUnlocked,
      setIsSwitchingUser,
      setTargetedUserForLogin,
      exitToSharedView,
      setIsSharedViewActive,
      completeFirstRun,
  }), [
      setUsers, setLoginHistory, addUser, updateUser, deleteUsers, setCurrentUser, 
      markUserAsOnboarded, setAppUnlocked, setIsSwitchingUser, setTargetedUserForLogin, 
      exitToSharedView, setIsSharedViewActive, completeFirstRun
  ]);

  const stateValue: AuthState = {
    users, currentUser, isAppUnlocked, isFirstRun, isSwitchingUser,
    isSharedViewActive, targetedUserForLogin, loginHistory
  };

  return (
    <AuthStateContext.Provider value={stateValue}>
      <AuthDispatchContext.Provider value={dispatch}>
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