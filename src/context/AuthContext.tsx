
import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import { User, Role } from '../types';
import { useNotificationsDispatch } from './NotificationsContext';
import { bugLogger } from '../utils/bugLogger';
import { addUserAPI, updateUserAPI, deleteUsersAPI, completeFirstRunAPI } from '../api';

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

  const setCurrentUser = useCallback((user: User | null) => {
      _setCurrentUser(prevUser => {
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

    setUsers(prevUsers => {
        const userIndex = prevUsers.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            console.error(`[updateUser] User with ID ${userId} not found.`);
            addNotification({ type: 'error', message: 'Could not find user to update.'});
            return prevUsers;
        }
        
        const userToUpdate = prevUsers[userIndex];
        const updatePayload = typeof update === 'function' ? update(userToUpdate) : update;
        const updatedUser = { ...userToUpdate, ...updatePayload };

        const isFullObject = 'id' in updatePayload;
        if (Object.keys(updatePayload).length > 0 && !isFullObject) {
            updateUserAPI(userId, updatePayload).catch(error => {
                addNotification({ type: 'error', message: `Failed to save user update: ${error.message}` });
                console.error("Failed to update user on server; optimistic update may be stale.", error);
            });
        }
        
        _setCurrentUser(prevCurrentUser => (prevCurrentUser?.id === userId ? updatedUser : prevCurrentUser));
        
        const newUsers = [...prevUsers];
        newUsers[userIndex] = updatedUser;
        return newUsers;
    });
  }, [addNotification]);
  
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
          return await addUserAPI(userData);
      } catch (error) {
          addNotification({ type: 'error', message: error instanceof Error ? error.message : 'Failed to add user.' });
          return null;
      }
  }, [addNotification]);

  const deleteUsers = useCallback(async (userIds: string[]) => {
      if (userIds.length === 0 || !currentUser) return;
      if (bugLogger.isRecording()) {
          bugLogger.add({ type: 'ACTION', message: `Deleting user IDs: ${userIds.join(', ')}` });
      }
      try {
        await deleteUsersAPI(userIds, currentUser.id);
        setUsers(prev => prev.filter(u => !userIds.includes(u.id)));
      } catch (error) {
        addNotification({ type: 'error', message: error instanceof Error ? error.message : 'Failed to delete users.' });
      }
  }, [addNotification, currentUser]);
  
  const completeFirstRun = useCallback(async (adminUserData: any) => {
      try {
          await completeFirstRunAPI(adminUserData);
          addNotification({ type: 'success', message: 'Setup complete! The app will now reload.' });
          setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        addNotification({ type: 'error', message: error instanceof Error ? error.message : 'First run setup failed.' });
      }
  }, [addNotification]);
  
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
