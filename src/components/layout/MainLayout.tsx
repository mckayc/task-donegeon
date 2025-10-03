import React, { useMemo, useEffect, useState, useRef, Suspense, useCallback } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
// FIX: Corrected type imports to use the main types barrel file by adjusting the relative path.
import { Role, Page, Quest, AITutorSessionLog, SystemNotification } from '../../types';
import GraceModeBanner from '../settings/GraceModeBanner';
import { useUIState, useUIDispatch } from '../../context/UIContext';
import { useAuthState, useAuthDispatch } from '../../context/AuthContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { ChatPanel } from '../chat/ChatPanel';
import LoginNotificationPopup from '../user-interface/LoginNotificationPopup';
import ChatController from '../chat/ChatController';
import { routeConfig } from './routeConfig';
import { useSystemState } from '../../context/SystemContext';
import PdfReaderPanel from '../reader/PdfReaderPanel';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import { useQuestsState, useQuestsDispatch } from '../../context/QuestsContext';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';

const MainLayout: React.FC = () => {
  const { settings, systemNotifications } = useSystemState();
  const { activePage, isChatOpen, isMobileView, isSidebarCollapsed, isKioskDevice, readingPdfQuest, activeTimer, timedQuestDetail } = useUIState();
  const { currentUser } = useAuthState();
  const { quests, questCompletions } = useQuestsState();
  const { markQuestAsTodo, unmarkQuestAsTodo } = useQuestsDispatch();
  const { addNotification } = useNotificationsDispatch();
  const { setActivePage, toggleSidebar, setTimedQuestDetail, pauseTimer, resumeTimer, setScreenDimmed } = useUIDispatch();
  const { logout } = useAuthDispatch();
  
  const [showLoginNotifications, setShowLoginNotifications] = useState(false);
  const [completingQuest, setCompletingQuest] = useState<{quest: Quest, duration?: number, aiTutorSessionLog?: Omit<AITutorSessionLog, 'id' | 'completionId'>} | null>(null);
  const prevUserIdRef = useRef<string | undefined>(undefined);
  const autoExitTimerRef = useRef<number | null>(null);
  const dimTimerRef = useRef<number | null>(null);
  const activeTimerUserId = useRef<string | undefined>(undefined);
  
  const ADMIN_ONLY_PAGES: Page[] = [
    'Manage Users', 'Manage Rewards', 'Manage Quests', 'Manage Quest Groups', 'Manage Rotations', 'Manage Goods', 'Manage Markets',
    'Manage Guilds', 'Manage Ranks', 'Manage Trophies', 'Settings', 'Suggestion Engine',
    'Appearance', 'Object Exporter', 'Asset Manager', 'Backup & Import', 'Asset Library',
    'Manage Events', 'Bug Tracker', 'Triumphs & Trials'
  ];
  const GATEKEEPER_PAGES: Page[] = ['Approvals'];

  const unreadNotifications = useMemo(() => {
    if (!currentUser) return [];
    return systemNotifications.filter((n: SystemNotification) => 
        n.recipientUserIds.includes(currentUser.id) && 
        !n.readByUserIds.includes(currentUser.id) &&
        n.senderId !== currentUser.id // Don't show popups for your own announcements
    );
  }, [systemNotifications, currentUser]);
  
  useEffect(() => {
    if (activeTimer && !activeTimer.isPaused) {
        activeTimerUserId.current = activeTimer.userId;
    }
    
    // When the user logs out or switches away
    if (prevUserIdRef.current && prevUserIdRef.current !== currentUser?.id) {
        // If there was a timer running for the user who is now gone
        if (activeTimer && !activeTimer.isPaused && activeTimer.userId === prevUserIdRef.current) {
            pauseTimer();
        }
    }
    
    // When a user logs in or switches back
    if (currentUser && prevUserIdRef.current !== currentUser.id) {
        // If there is a paused timer that belongs to this user
        if (activeTimer && activeTimer.isPaused && activeTimer.userId === currentUser.id) {
            resumeTimer();
        }
    }

    prevUserIdRef.current = currentUser?.id;
  }, [currentUser, activeTimer, pauseTimer, resumeTimer]);


  useEffect(() => {
    if (currentUser && settings.loginNotifications.enabled && unreadNotifications.length > 0) {
        setShowLoginNotifications(true);
    } else {
        setShowLoginNotifications(false);
    }
  }, [currentUser, settings.loginNotifications.enabled, unreadNotifications]);

  useEffect(() => {
    if (!currentUser) return;

    const isPageAdminOnly = ADMIN_ONLY_PAGES.includes(activePage);
    const isPageForGatekeepers = GATEKEEPER_PAGES.includes(activePage);

    if (isPageAdminOnly && currentUser.role !== Role.DonegeonMaster) {
      addNotification({ type: 'error', message: 'You do not have permission to view this page.' });
      setActivePage('Dashboard');
    } else if (isPageForGatekeepers && currentUser.role === Role.Explorer) {
      addNotification({ type: 'error', message: 'You do not have permission to view this page.' });
      setActivePage('Dashboard');
    }
  }, [activePage, currentUser, setActivePage, addNotification]);

  // --- Kiosk Mode Auto-Exit Timer ---
  const resetAutoExitTimer = useCallback(() => {
    if (autoExitTimerRef.current) {
        clearTimeout(autoExitTimerRef.current);
    }
    autoExitTimerRef.current = window.setTimeout(() => {
        addNotification({ type: 'info', message: 'Session timed out due to inactivity.' });
        logout();
    }, settings.sharedMode.autoExitMinutes * 60 * 1000);
  }, [settings.sharedMode.autoExitMinutes, logout, addNotification]);

  useEffect(() => {
      if (settings.sharedMode.enabled && settings.sharedMode.autoExit && isKioskDevice) {
          const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
          
          events.forEach(event => {
              window.addEventListener(event, resetAutoExitTimer);
          });

          resetAutoExitTimer(); // Start the timer initially

          return () => {
              if (autoExitTimerRef.current) {
                  clearTimeout(autoExitTimerRef.current);
              }
              events.forEach(event => {
                  window.removeEventListener(event, resetAutoExitTimer);
              });
          };
      } else {
        // If not in kiosk mode or settings are off, make sure any existing timer is cleared.
        if (autoExitTimerRef.current) {
            clearTimeout(autoExitTimerRef.current);
        }
      }
  }, [settings.sharedMode.enabled, settings.sharedMode.autoExit, resetAutoExitTimer, isKioskDevice]);

  // --- Kiosk Mode Auto-Dimming Logic ---
  const isWithinDimmingTime = useCallback(() => {
      const { autoDimStartTime, autoDimStopTime } = settings.sharedMode;
      if (!autoDimStartTime || !autoDimStopTime) return false;
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = autoDimStartTime.split(':').map(Number);
      const startTime = startH * 60 + startM;
      const [stopH, stopM] = autoDimStopTime.split(':').map(Number);
      const stopTime = stopH * 60 + stopM;
      if (startTime > stopTime) { // Overnight case
          return currentTime >= startTime || currentTime < stopTime;
      } else {
          return currentTime >= startTime && currentTime < stopTime;
      }
  }, [settings.sharedMode.autoDimStartTime, settings.sharedMode.autoDimStopTime]);

  const resetDimTimer = useCallback(() => {
      setScreenDimmed(false);
      if (dimTimerRef.current) {
          clearTimeout(dimTimerRef.current);
      }
      if (isWithinDimmingTime()) {
          dimTimerRef.current = window.setTimeout(() => {
              setScreenDimmed(true);
          }, (settings.sharedMode.autoDimInactivitySeconds || 30) * 1000);
      }
  }, [isWithinDimmingTime, settings.sharedMode.autoDimInactivitySeconds, setScreenDimmed]);

  useEffect(() => {
      if (settings.sharedMode.enabled && settings.sharedMode.autoDim && isKioskDevice) {
          const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
          events.forEach(event => window.addEventListener(event, resetDimTimer));
          
          resetDimTimer();
          
          const timeCheckInterval = setInterval(resetDimTimer, 60000);
          
          return () => {
              if (dimTimerRef.current) clearTimeout(dimTimerRef.current);
              clearInterval(timeCheckInterval);
              events.forEach(event => window.removeEventListener(event, resetDimTimer));
              setScreenDimmed(false);
          };
      }
  }, [settings.sharedMode.enabled, settings.sharedMode.autoDim, isKioskDevice, resetDimTimer, setScreenDimmed]);


  const renderPage = () => {
    const PageComponent = routeConfig[activePage] || routeConfig['Dashboard'];
    if (!PageComponent) {
      // Fallback in case Dashboard is somehow missing from the config
      const Fallback = routeConfig['Dashboard'];
      return Fallback ? <Fallback /> : <div>Page not found</div>;
    }
    return <PageComponent />;
  };
  
  const LoadingSpinner = () => (
      <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-400"></div>
      </div>
  );

  const handleStartCompletion = (duration?: number, aiTutorSessionLog?: Omit<AITutorSessionLog, 'id' | 'completionId'>) => {
    if (timedQuestDetail) {
      setCompletingQuest({ quest: timedQuestDetail, duration, aiTutorSessionLog });
      setTimedQuestDetail(null);
    }
  };

  const handleToggleTodo = () => {
      if (!timedQuestDetail || !currentUser) return;
      const quest = quests.find(q => q.id === timedQuestDetail.id);
      if (!quest) return;
      const isCurrentlyTodo = quest.todoUserIds?.includes(currentUser.id);
      if (isCurrentlyTodo) {
          unmarkQuestAsTodo(quest.id, currentUser.id);
      } else {
          markQuestAsTodo(quest.id, currentUser.id);
      }
  };

  return (
    <>
      {showLoginNotifications && currentUser && (
        <LoginNotificationPopup 
            notifications={unreadNotifications} 
            user={currentUser} 
            onClose={() => setShowLoginNotifications(false)} 
        />
      )}
      <div className="flex h-screen bg-stone-800 text-stone-100">
        
        {!isMobileView && <Sidebar />}

        {isMobileView && (
            <>
                {!isSidebarCollapsed && (
                    <div 
                        onClick={toggleSidebar} 
                        className="fixed inset-0 bg-black/80 z-30"
                    />
                )}
                <div 
                    className={`fixed top-0 left-0 h-full z-40 transition-transform duration-300 ease-in-out ${isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0'}`}
                >
                    <Sidebar />
                </div>
            </>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="main-content flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8" style={{ backgroundColor: 'hsl(var(--color-bg-tertiary))' }}>
            <GraceModeBanner />
            <Suspense fallback={<LoadingSpinner />}>
                {renderPage()}
            </Suspense>
          </main>
        </div>
      </div>
      <ChatController />
      {isChatOpen && <ChatPanel />}
      {readingPdfQuest && <PdfReaderPanel quest={readingPdfQuest} />}
      {timedQuestDetail && currentUser && (
        <QuestDetailDialog
          quest={timedQuestDetail}
          onClose={() => setTimedQuestDetail(null)}
          onComplete={handleStartCompletion}
          onToggleTodo={handleToggleTodo}
          isTodo={timedQuestDetail.todoUserIds?.includes(currentUser.id)}
        />
      )}
      {completingQuest && <CompleteQuestDialog quest={completingQuest.quest} duration={completingQuest.duration} aiTutorSessionLog={completingQuest.aiTutorSessionLog} onClose={() => setCompletingQuest(null)} />}
    </>
  );
};

export default MainLayout;