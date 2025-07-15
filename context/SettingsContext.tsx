

import React from 'react';
import { AppSettings, Page, AppMode } from '../types';
import { useAppState, useAppDispatch } from './AppContext';

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
  const { settings, activePage, appMode, isAiConfigured } = useAppState();
  return { 
    settings, 
    activePage, 
    appMode,
    isAiAvailable: settings.enableAiFeatures && isAiConfigured,
  };
};

// Hook to consume the settings dispatch functions
export const useSettingsDispatch = (): SettingsDispatch => {
  const { updateSettings, setActivePage, setAppMode } = useAppDispatch();
  return { updateSettings, setActivePage, setAppMode };
};

// Note: The SettingsProvider is no longer needed here as AppProvider in AppContext.tsx handles everything.
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
