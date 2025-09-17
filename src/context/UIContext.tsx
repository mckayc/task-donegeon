import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import { AppMode, Page, Quest } from '../types';
import { bugLogger } from '../utils/bugLogger';

// FIX: Added ActiveTimer interface for the new quest timer feature.
export interface ActiveTimer {
    questId: string;
    userId: string;
    startTime: number; // timestamp
    isPaused: boolean;
    pausedTime: number; // total time spent paused in ms
    pauseStartTime?: number; // timestamp when pause began
}

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
  readingQuest: Quest | null;
  readingPdfQuest: Quest | null;
  isScreenDimmed: boolean;
  // FIX: Added activeTimer to UIState for live quest timing.
  activeTimer: ActiveTimer | null;
  // FIX: Added timedQuestDetail to UIState to manage the timer detail dialog.
  timedQuestDetail: Quest | null;
}

export interface UIDispatch {
  setActivePage: (page: Page, meta?: any) => void;
  toggleSidebar: () => void;
  toggleChat: () => void;
  setIsMobileView: (isMobile: boolean) => void;
  setAppMode: (mode: AppMode) => void;
  setActiveMarketId: (marketId: string | null) => void;
  setActiveGame: (gameId: string | null) => void;
  setReadingQuest: (quest: Quest | null) => void;
  setReadingPdfQuest: (quest: Quest | null) => void;
  setScreenDimmed: (dimmed: boolean) => void;
  // FIX: Added setTimedQuestDetail to UIDispatch to show/hide the timer dialog.
  setTimedQuestDetail: (quest: Quest | null) => void;
  // FIX: Added timer controls to UIDispatch.
  startTimer: (questId: string, userId: string) => void;
  stopTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
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
  const [readingQuest, _setReadingQuest] = useState<Quest | null>(null);
  const [readingPdfQuest, _setReadingPdfQuest] = useState<Quest | null>(null);
  const [isScreenDimmed, setIsScreenDimmed] = useState<boolean>(false);
  // FIX: Added state for timed quests.
  const [timedQuestDetail, _setTimedQuestDetail] = useState<Quest | null>(null);
  const [activeTimer, _setActiveTimer] = useState<ActiveTimer | null>(null);

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

  const setScreenDimmed = useCallback((dimmed: boolean) => {
    setIsScreenDimmed(dimmed);
  }, []);

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
  
  const setReadingQuest = (quest: Quest | null) => {
      _setReadingQuest(quest);
  };

  const setReadingPdfQuest = (quest: Quest | null) => {
      _setReadingPdfQuest(quest);
  };

  // FIX: Added implementation for timed quest detail dialog.
  const setTimedQuestDetail = (quest: Quest | null) => {
    _setTimedQuestDetail(quest);
  };

  const startTimer = useCallback((questId: string, userId: string) => {
    _setActiveTimer({
        questId,
        userId,
        startTime: Date.now(),
        isPaused: false,
        pausedTime: 0,
    });
  }, []);
  
  const stopTimer = useCallback(() => {
    _setActiveTimer(null);
  }, []);

  // FIX: Added implementation for pausing the timer.
  const pauseTimer = useCallback(() => {
    _setActiveTimer(prev => {
        if (!prev || prev.isPaused) return prev;
        return {
            ...prev,
            isPaused: true,
            pauseStartTime: Date.now()
        };
    });
  }, []);
  
  // FIX: Added implementation for resuming the timer.
  const resumeTimer = useCallback(() => {
    _setActiveTimer(prev => {
        if (!prev || !prev.isPaused || !prev.pauseStartTime) return prev;
        const newPausedTime = prev.pausedTime + (Date.now() - prev.pauseStartTime);
        return {
            ...prev,
            isPaused: false,
            pausedTime: newPausedTime,
            pauseStartTime: undefined
        };
    });
  }, []);


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
    readingQuest,
    readingPdfQuest,
    isScreenDimmed,
    // FIX: Added timer state to context value.
    activeTimer,
    timedQuestDetail,
  }), [activePage, activePageMeta, isSidebarCollapsed, isChatOpen, isMobileView, appMode, activeMarketId, isKioskDevice, activeGame, readingQuest, readingPdfQuest, isScreenDimmed, activeTimer, timedQuestDetail]);

  const dispatch: UIDispatch = {
    setActivePage,
    toggleSidebar,
    toggleChat,
    setIsMobileView,
    setAppMode,
    setActiveMarketId,
    setActiveGame,
    setReadingQuest,
    setReadingPdfQuest,
    setScreenDimmed,
    // FIX: Added timer dispatch functions to context value.
    setTimedQuestDetail,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
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