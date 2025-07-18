

import React from 'react';
import { User } from '../types';
import { useAuthState, useAppDispatch } from './AppContext';

// The state slice provided by this context
export interface AuthState {
  users: User[];
  currentUser: User | null;
  isAppUnlocked: boolean;
  isFirstRun: boolean;
  isSwitchingUser: boolean;
  targetedUserForLogin: User | null;
  loginHistory: string[];
}

// The dispatch functions provided by this context
export interface AuthDispatch {
  setAppUnlocked: (isUnlocked: boolean) => void;
  addUser: (user: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>) => User;
  updateUser: (userId: string, updatedData: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  setCurrentUser: (user: User | null) => void;
  setTargetedUserForLogin: (user: User | null) => void;
  setIsSwitchingUser: (isSwitching: boolean) => void;
  markUserAsOnboarded: (userId: string) => void;
}

// Hook to consume the auth-related state slice
export const useAuth = (): AuthState => {
  return useAuthState();
};

// Hook to consume the auth-related dispatch functions
export const useAuthDispatch = (): AuthDispatch => {
  const {
    setAppUnlocked,
    addUser,
    updateUser,
    deleteUser,
    setCurrentUser,
    setTargetedUserForLogin,
    setIsSwitchingUser,
    markUserAsOnboarded,
  } = useAppDispatch();

  return {
    setAppUnlocked,
    addUser,
    updateUser,
    deleteUser,
    setCurrentUser,
    setTargetedUserForLogin,
    setIsSwitchingUser,
    markUserAsOnboarded,
  };
};

// Note: The AuthProvider is no longer needed here as AppProvider in AppContext.tsx handles everything.
// This file now just provides clean, decoupled access hooks for components.
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
