import React, { createContext, useContext, ReactNode } from 'react';
import { AuthProvider, useAuth, useAuthDispatch } from './AuthContext';
import { GameDataProvider, useGameData, useGameDataDispatch } from './GameDataContext';
import { SettingsProvider, useSettings, useSettingsDispatch } from './SettingsContext';

// Combine state and dispatch interfaces from all contexts
type AppState = ReturnType<typeof useAuth> & ReturnType<typeof useGameData> & ReturnType<typeof useSettings>;
type AppDispatch = ReturnType<typeof useAuthDispatch> & ReturnType<typeof useGameDataDispatch> & ReturnType<typeof useSettingsDispatch>;

// Create two top-level contexts for the combined state and dispatch
const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<AppDispatch | undefined>(undefined);

// An internal component that sits inside all providers to combine their hooks
const AppStateComposer: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Gather state from all individual contexts
    const authState = useAuth();
    const gameState = useGameData();
    const settingsState = useSettings();
    
    // Gather dispatch functions from all individual contexts
    const authDispatch = useAuthDispatch();
    const gameDispatch = useGameDataDispatch();
    const settingsDispatch = useSettingsDispatch();
    
    // Combine into single objects
    const combinedState: AppState = { ...authState, ...gameState, ...settingsState };
    const combinedDispatch: AppDispatch = { ...authDispatch, ...gameDispatch, ...settingsDispatch };

    // Provide the combined state and dispatch to the rest of the app
    return (
        <AppStateContext.Provider value={combinedState}>
            <AppDispatchContext.Provider value={combinedDispatch}>
                {children}
            </AppDispatchContext.Provider>
        </AppStateContext.Provider>
    );
};

// The main AppProvider that wraps the entire application
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    // The order of providers matters if they depend on each other.
    // AuthProvider needs GameData for user info, so GameData is higher.
    <GameDataProvider>
      <SettingsProvider>
        <AuthProvider>
          {/* AppStateComposer must be inside all other providers */}
          <AppStateComposer>
            {children}
          </AppStateComposer>
        </AuthProvider>
      </SettingsProvider>
    </GameDataProvider>
  );
};

// Global hook for accessing the combined state
export const useAppState = (): AppState => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
};

// Global hook for accessing the combined dispatch functions
export const useAppDispatch = (): AppDispatch => {
  const context = useContext(AppDispatchContext);
  if (context === undefined) {
    throw new Error('useAppDispatch must be used within an AppProvider');
  }
  return context;
};
