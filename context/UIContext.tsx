import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import { AppMode, Page } from '../types/app';
import { bugLogger } from '../utils/bugLogger';

export interface UIState {
  activePage: Page;
  isSidebarCollapsed: boolean;
  isChatOpen: boolean;
  appMode: AppMode;
  activeMarketId: string | null;
}

export interface UIDispatch {
  setActivePage: (page: Page) => void;
  toggleSidebar: () => void;
  toggleChat: () => void;
  setAppMode: (mode: AppMode) => void;
  setActiveMarketId: (marketId: string | null) => void;
}

const UIStateContext = createContext<UIState | undefined>(undefined);
const UIDispatchContext = createContext<UIDispatch | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activePage, _setActivePage] = useState<Page>('Dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => localStorage.getItem('isSidebarCollapsed') === 'true');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [appMode, _setAppMode] = useState<AppMode>({ mode: 'personal' });
  const [activeMarketId, _setActiveMarketId] = useState<string | null>(null);

  const setActivePage = (page: Page) => {
    if (bugLogger.isRecording()) bugLogger.add({ type: 'NAVIGATION', message: `Navigated to ${page} page.` });
    _setActivePage(page);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('isSidebarCollapsed', String(newState));
      return newState;
    });
  };

  const toggleChat = () => {
      if (bugLogger.isRecording()) {
        bugLogger.add({ type: 'ACTION', message: 'Toggled chat panel visibility.' });
      }
      setIsChatOpen(prev => !prev);
  };

  const setAppMode = (mode: AppMode) => {
    if (bugLogger.isRecording()) {
        bugLogger.add({
            type: 'NAVIGATION',
            message: `Switched to ${mode.mode} mode${mode.mode === 'guild' ? ` (Guild ID: ${mode.guildId})` : ''}`
        });
    }
    _setAppMode(mode);
    _setActiveMarketId(null);
  };

  const setActiveMarketId = (marketId: string | null) => {
     if (bugLogger.isRecording()) {
        bugLogger.add({
            type: 'NAVIGATION',
            message: marketId ? `Viewing market ${marketId}` : 'Returned to marketplace list'
        });
    }
    _setActiveMarketId(marketId);
  };

  // Memoize the state value to prevent consumers that only use dispatch from re-rendering.
  const state = useMemo(() => ({
    activePage,
    isSidebarCollapsed,
    isChatOpen,
    appMode,
    activeMarketId
  }), [activePage, isSidebarCollapsed, isChatOpen, appMode, activeMarketId]);

  // Create a stable dispatch object. These functions don't depend on props or state,
  // so they don't need to be wrapped in useCallback. A new object is created on each render,
  // which is fine and more robust against potential stale closure issues.
  const dispatch: UIDispatch = {
    setActivePage,
    toggleSidebar,
    toggleChat,
    setAppMode,
    setActiveMarketId,
  };

  return (
    <UIStateContext.Provider value={state}>
      <UIDispatchContext.Provider value={dispatch}>
        {children}
      </UIDispatchContext.Provider>
    </UIStateContext.Provider>
  );
};

export const useUIState = (): UIState => {
  const context = useContext(UIStateContext);
  if (context === undefined) throw new Error('useUIState must be used within a UIProvider');
  return context;
};

export const useUIDispatch = (): UIDispatch => {
  const context = useContext(UIDispatchContext);
  if (context === undefined) throw new Error('useUIDispatch must be used within a UIProvider');
  return context;
};