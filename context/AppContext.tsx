import React, { createContext, useContext, ReactNode } from 'react';
import { AuthProvider, useAuth, useAuthDispatch } from './AuthContext';
import { GameDataProvider, useGameData, useGameDataDispatch } from './GameDataContext';
import { SettingsProvider, useSettings, useSettingsDispatch } from './SettingsContext';

// Combine state and dispatch interfaces
type AppState = ReturnType<typeof useAuth> & ReturnType<typeof useGameData> & ReturnType<typeof useSettings>;
type AppDispatch = ReturnType<typeof useAuthDispatch> & ReturnType<typeof useGameDataDispatch> & ReturnType<typeof useSettingsDispatch>;

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<AppDispatch | undefined>(undefined);

// Helper component to combine hooks after all providers are mounted
const AppProviderInternals: React.FC<{ children: ReactNode }> = ({ children }) => {
    const authState = useAuth();
    const gameState = useGameData();
    const settingsState = useSettings();
    
    const authDispatch = useAuthDispatch();
    const gameDispatch = useGameDataDispatch();
    const settingsDispatch = useSettingsDispatch();
    
    const combinedState: AppState = { ...authState, ...gameState, ...settingsState };
    const combinedDispatch: AppDispatch = { ...authDispatch, ...gameDispatch, ...settingsDispatch };

    return (
        <AppStateContext.Provider value={combinedState}>
            <AppDispatchContext.Provider value={combinedDispatch}>
                {children}
            </AppDispatchContext.Provider>
        </AppStateContext.Provider>
    );
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <GameDataProvider>
      <SettingsProvider>
        <AuthProvider>
          <AppProviderInternals>
            {children}
          </AppProviderInternals>
        </AuthProvider>
      </SettingsProvider>
    </GameDataProvider>
  );
};

export const useAppState = (): AppState => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
};

export const useAppDispatch = (): AppDispatch => {
  const context = useContext(AppDispatchContext);
  if (context === undefined) {
    throw new Error('useAppDispatch must be used within an AppProvider');
  }
  return context;
};
