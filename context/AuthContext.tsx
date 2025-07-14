import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { User, Role } from '../types';
import { useGameData, useGameDataDispatch } from './GameDataContext';

interface AuthState {
  users: User[];
  currentUser: User | null;
  isAppUnlocked: boolean;
  isFirstRun: boolean;
  isSwitchingUser: boolean;
  targetedUserForLogin: User | null;
}

interface AuthDispatch {
  setAppUnlocked: (isUnlocked: boolean) => void;
  addUser: (user: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>) => User;
  updateUser: (userId: string, updatedData: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  setCurrentUser: (user: User | null) => void;
  setTargetedUserForLogin: (user: User | null) => void;
  setIsSwitchingUser: (isSwitching: boolean) => void;
  markUserAsOnboarded: (userId: string) => void;
}

const AuthStateContext = createContext<AuthState | undefined>(undefined);
const AuthDispatchContext = createContext<AuthDispatch | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { users: gameUsers, guilds, quests, isDataLoaded } = useGameData();
  const { setUsers: setGameUsers, setGuilds, setQuests } = useGameDataDispatch();


  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [isSwitchingUser, setIsSwitchingUser] = useState<boolean>(false);
  const [targetedUserForLogin, setTargetedUserForLogin] = useState<User | null>(null);
  const [isAppUnlocked, setAppUnlockedState] = useState<boolean>(() => sessionStorage.getItem('isAppUnlocked') === 'true');

  const setAppUnlocked = useCallback((isUnlocked: boolean) => {
    sessionStorage.setItem('isAppUnlocked', String(isUnlocked));
    setAppUnlockedState(isUnlocked);
  }, []);

  const setCurrentUser = useCallback((user: User | null) => {
    setCurrentUserState(user);
    setIsSwitchingUser(false);
  }, []);

  const isFirstRun = isDataLoaded && !gameUsers.some(u => u.role === Role.DonegeonMaster);

  const addUser = (user: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>): User => {
    const newUser: User = {
      ...user, id: `user-${Date.now()}`, avatar: {}, ownedAssetIds: [], personalPurse: {},
      personalExperience: {}, guildBalances: {}, ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: false,
    };

    setGameUsers(prev => {
      const newUsers = [...prev, newUser];
      const newGuilds = guilds.map(g => {
        if (g.isDefault) {
          newUser.guildBalances[g.id] = { purse: {}, experience: {} };
          return { ...g, memberIds: [...g.memberIds, newUser.id] };
        }
        return g;
      });
      setGuilds(newGuilds);
      return newUsers;
    });
    return newUser;
  };

  const updateUser = (userId: string, updatedData: Partial<User>) => {
    setGameUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedData } : u));
    if (currentUser?.id === userId) {
      setCurrentUserState(prev => prev ? { ...prev, ...updatedData } as User : null);
    }
  };
  
  const markUserAsOnboarded = (userId: string) => {
    updateUser(userId, { hasBeenOnboarded: true });
  };

  const deleteUser = (userId: string) => {
    setGameUsers(prev => prev.filter(u => u.id !== userId));
    setGuilds(prev => prev.map(g => ({ ...g, memberIds: g.memberIds.filter(id => id !== userId) })));
    setQuests(prev => prev.map(q => ({ ...q, assignedUserIds: q.assignedUserIds.filter(id => id !== userId) })));
  };

  const stateValue: AuthState = {
    users: gameUsers,
    currentUser,
    isAppUnlocked,
    isFirstRun,
    isSwitchingUser,
    targetedUserForLogin,
  };

  const dispatchValue: AuthDispatch = {
    setAppUnlocked,
    addUser,
    updateUser,
    deleteUser,
    setCurrentUser,
    setTargetedUserForLogin,
    setIsSwitchingUser,
    markUserAsOnboarded,
  };

  return (
    <AuthStateContext.Provider value={stateValue}>
      <AuthDispatchContext.Provider value={dispatchValue}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthStateContext.Provider>
  );
};

export const useAuth = (): AuthState => {
  const context = useContext(AuthStateContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const useAuthDispatch = (): AuthDispatch => {
  const context = useContext(AuthDispatchContext);
  if (context === undefined) throw new Error('useAuthDispatch must be used within an AuthProvider');
  return context;
};
