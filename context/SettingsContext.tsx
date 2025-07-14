import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { AppSettings, Terminology, Theme, Page, AppMode } from '../types';
import { INITIAL_SETTINGS } from '../data/initialData';

interface SettingsState {
  settings: AppSettings;
  activePage: Page;
  appMode: AppMode;
}

interface SettingsDispatch {
  updateSettings: (settings: Partial<AppSettings>) => void;
  setActivePage: (page: Page) => void;
  setAppMode: (mode: AppMode) => void;
}

const SettingsStateContext = createContext<SettingsState | undefined>(undefined);
const SettingsDispatchContext = createContext<SettingsDispatch | undefined>(undefined);

const deepMergeSettings = (initial: AppSettings, saved: Partial<AppSettings>): AppSettings => {
    return {
        ...initial,
        ...saved,
        questDefaults: { ...initial.questDefaults, ...saved?.questDefaults },
        vacationMode: { ...initial.vacationMode, ...saved?.vacationMode },
        terminology: { ...initial.terminology, ...saved?.terminology },
    };
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettingsState] = useState<AppSettings>(INITIAL_SETTINGS);
  const [activePage, setActivePage] = useState<Page>('Dashboard');
  const [appMode, setAppMode] = useState<AppMode>({ mode: 'personal' });
  
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettingsState(prev => deepMergeSettings(prev, newSettings));
  }, []);

  useEffect(() => {
    // This could be enhanced to load settings from the main data provider later
  }, []);

  const stateValue: SettingsState = { settings, activePage, appMode };
  const dispatchValue: SettingsDispatch = { updateSettings, setActivePage, setAppMode };

  return (
    <SettingsStateContext.Provider value={stateValue}>
      <SettingsDispatchContext.Provider value={dispatchValue}>
        {children}
      </SettingsDispatchContext.Provider>
    </SettingsStateContext.Provider>
  );
};

export const useSettings = (): SettingsState => {
  const context = useContext(SettingsStateContext);
  if (context === undefined) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};

export const useSettingsDispatch = (): SettingsDispatch => {
  const context = useContext(SettingsDispatchContext);
  if (context === undefined) throw new Error('useSettingsDispatch must be used within a SettingsProvider');
  return context;
};
