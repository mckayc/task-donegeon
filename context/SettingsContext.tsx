// This file is obsolete. Please use useAppState(), useUIState(), and their respective dispatch hooks directly.

import React from 'react';
import { AppSettings, Page, AppMode } from '../types';
import { useAppState, useAppDispatch } from './AppContext';
import { useUIState, useUIDispatch } from './UIStateContext';

// The state slice provided by this context
export interface SettingsState {
  settings: AppSettings;
  activePage: Page;
  appMode: AppMode;
  isAiAvailable: boolean;
}

// The dispatch functions provided by this context
export interface SettingsDispatch {
  updateSettings: (settings: Partial<AppSettings>) => void;
  setActivePage: (page: Page) => void;
  setAppMode: (mode: AppMode) => void;
}


// Hook to consume the settings state slice
export const useSettings = (): SettingsState => {
  const { settings, isAiConfigured } = useAppState();
  const { activePage, appMode } = useUIState();
  return { 
    settings, 
    activePage, 
    appMode,
    isAiAvailable: settings.enableAiFeatures && isAiConfigured,
  };
};

// Hook to consume the settings dispatch functions
export const useSettingsDispatch = (): SettingsDispatch => {
  const { updateSettings } = useAppDispatch();
  const { setActivePage, setAppMode } = useUIDispatch();
  return { updateSettings, setActivePage, setAppMode };
};

// Note: The SettingsProvider is no longer needed here as AppProvider in AppContext.tsx handles everything.
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
