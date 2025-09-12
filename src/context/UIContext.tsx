import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import { AppMode, Page, Quest } from '../types';
import { bugLogger } from '../utils/bugLogger';

export interface UIState {
  activePage: Page;
  activePageMeta: any;
  isSidebarCollapsed: boolean;
  isChatOpen: boolean;
  isMobileView: boolean;
  appMode: AppMode;
  activeMarketId: string | null;
  isKioskDevice: boolean;
  activeGame: string | null;
  readingEpubQuest: Quest | null;
  // FIX: Add state for tracking the quest being read in the PDF reader.
  readingPdfQuest: Quest | null;
}

export interface UIDispatch {
  setActivePage: (page: Page, meta?: any) => void;
  toggleSidebar: () => void;
  toggleChat: () => void;
  setIsMobileView: (isMobile: boolean) => void;
  setAppMode: (mode: AppMode) => void;
  setActiveMarketId: (marketId: string | null) => void;
  setActiveGame: (gameId: string | null) => void;
  setReadingEpubQuest: (quest: Quest | null) => void;
  // FIX: Add a dispatch function to set the quest for the PDF reader.
  setReadingPdfQuest: (quest: Quest | null) => void;
}

const UIStateContext = createContext<UIState | undefined>(undefined);
const UIDispatchContext = createContext<UIDispatch | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activePage, _setActivePage] = useState<Page>('Dashboard');
  const [activePageMeta, setActivePageMeta] = useState<any>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    // Default to collapsed on mobile, respect storage on desktop
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return true;
    }
    return localStorage.getItem('isSidebarCollapsed') === 'true'
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [appMode, _setAppMode] = useState<AppMode>({ mode: 'personal' });
  const [activeMarketId, _setActiveMarketId] = useState<string | null>(null);
  const [activeGame, _setActiveGame] = useState<string | null>(null);
  const [isKioskDevice, setIsKioskDevice] = useState<boolean>(() => {
      if (typeof window !== 'undefined') {
          return localStorage.getItem('isKioskDevice') === 'true';
      }
      return false;
  });
  const [readingEpubQuest, _setReadingEpubQuest] = useState<Quest | null>(null);
  // FIX: Implement state for the PDF reader quest.
  const [readingPdfQuest, _setReadingPdfQuest] = useState<Quest | null>(null);

  const setActivePage = (page: Page, meta?: any) => {
    if (bugLogger.isRecording()) bugLogger.add({ type: 'NAVIGATION', message: `Navigated to ${page} page.` });
    _setActivePage(page);
    setActivePageMeta(meta || null);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      if (!isMobileView) {
        localStorage.setItem('isSidebarCollapsed', String(newState));
      }
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

  const setActiveGame = (gameId: string | null) => {
      _setActiveGame(gameId);
  };
  
  const setReadingEpubQuest = (quest: Quest | null) => {
      _setReadingEpubQuest(quest);
  };

  // FIX: Implement the dispatch function for the PDF reader.
  const setReadingPdfQuest = (quest: Quest | null) => {
      _setReadingPdfQuest(quest);
  };

  const state = useMemo(() => ({
    activePage,
    activePageMeta,
    isSidebarCollapsed,
    isChatOpen,
    isMobileView,
    appMode,
    activeMarketId,
    isKioskDevice,
    activeGame,
    readingEpubQuest,
    // FIX: Include the new PDF reader state in the context value.
    readingPdfQuest,
  }), [activePage, activePageMeta, isSidebarCollapsed, isChatOpen, isMobileView, appMode, activeMarketId, isKioskDevice, activeGame, readingEpubQuest, readingPdfQuest]);

  const dispatch: UIDispatch = {
    setActivePage,
    toggleSidebar,
    toggleChat,
    setIsMobileView,
    setAppMode,
    setActiveMarketId,
    setActiveGame,
    setReadingEpubQuest,
    // FIX: Include the new PDF reader dispatch function in the context value.
    setReadingPdfQuest,
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
