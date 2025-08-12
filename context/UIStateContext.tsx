import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Page, AppMode } from '../types';
import { bugLogger } from '../utils/bugLogger';

// State managed by this context
interface UIState {
  activePage: Page;
  isSidebarCollapsed: boolean;
  isChatOpen: boolean;
  appMode: AppMode;
  activeMarketId: string | null;
}

// Dispatch functions provided by this context
interface UIDispatch {
  setActivePage: (page: Page) => void;
  toggleSidebar: () => void;
  toggleChat: () => void;
  setAppMode: (mode: AppMode) => void;
  setActiveMarketId: (marketId: string | null) => void;
}

const UIStateContext = createContext<UIState | undefined>(undefined);
const UIDispatchContext = createContext<UIDispatch | undefined>(undefined);

export const UIStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activePage, _setActivePage] = useState<Page>('Dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => localStorage.getItem('isSidebarCollapsed') === 'true');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>({ mode: 'personal' });
  const [activeMarketId, setActiveMarketId] = useState<string | null>(null);

  const setActivePage = useCallback((page: Page) => {
      if (bugLogger.isRecording()) {
        bugLogger.add({ type: 'NAVIGATION', message: `Navigated to ${page} page.`});
      }
      _setActivePage(page);
  }, []);


  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => {
        const newState = !prev;
        localStorage.setItem('isSidebarCollapsed', String(newState));
        return newState;
    });
  }, []);

  const toggleChat = useCallback(() => setIsChatOpen(prev => !prev), []);

  const stateValue: UIState = {
    activePage,
    isSidebarCollapsed,
    isChatOpen,
    appMode,
    activeMarketId,
  };

  const dispatchValue: UIDispatch = {
    setActivePage,
    toggleSidebar,
    toggleChat,
    setAppMode,
    setActiveMarketId,
  };

  return (
    <UIStateContext.Provider value={stateValue}>
      <UIDispatchContext.Provider value={dispatchValue}>
        {children}
      </UIDispatchContext.Provider>
    </UIStateContext.Provider>
  );
};

export const useUIState = (): UIState => {
  const context = useContext(UIStateContext);
  if (context === undefined) throw new Error('useUIState must be used within a UIStateProvider');
  return context;
};

export const useUIDispatch = (): UIDispatch => {
  const context = useContext(UIDispatchContext);
  if (context === undefined) throw new Error('useUIDispatch must be used within a UIStateProvider');
  return context;
};
