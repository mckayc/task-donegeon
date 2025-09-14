
import React, { useMemo, useEffect, useState, useRef, Suspense, useCallback } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Role } from '../users/types';
import { Page } from '../../types/app';
import { SystemNotification } from '../system/types';
import VacationModeBanner from '../settings/VacationModeBanner';
import { useUIState, useUIDispatch } from '../../context/UIContext';
import { useAuthState, useAuthDispatch } from '../../context/AuthContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { ChatPanel } from '../chat/ChatPanel';
import LoginNotificationPopup from '../user-interface/LoginNotificationPopup';
import ChatController from '../chat/ChatController';
import { routeConfig } from './routeConfig';
import { useSystemState } from '../../context/SystemContext';
import EpubReaderPanel from '../reader/EpubReaderPanel';
// FIX: Import PdfReaderPanel. It was missing.
import PdfReaderPanel from '../reader/PdfReaderPanel';

const MainLayout: React.FC = () => {
  const { settings, systemNotifications } = useSystemState();
  // FIX: Destructure readingQuest instead of readingEpubQuest from useUIState, as 'readingEpubQuest' does not exist on the type.
  const { activePage, isChatOpen, isMobileView, isSidebarCollapsed, isKioskDevice, readingQuest, readingPdfQuest } = useUIState();
  const { currentUser } = useAuthState();
  const { addNotification } = useNotificationsDispatch();
  const { setActivePage, toggleSidebar } = useUIDispatch();
  const { logout } = useAuthDispatch();
  
  const [showLoginNotifications, setShowLoginNotifications] = useState(false);
  const prevUserIdRef = useRef<string | undefined>(undefined);
  const timerRef = useRef<number | null>(null);
  
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
    // When the user changes, reset the session flag so the popup can show for the new user.
    if (currentUser?.id !== prevUserIdRef.current) {
        sessionStorage.removeItem('notificationsShownForSession');
        prevUserIdRef.current = currentUser?.id;
    }
  }, [currentUser]);

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem('notificationsShownForSession') === 'true';

    if (currentUser && !alreadyShown && settings.loginNotifications.enabled && unreadNotifications.length > 0) {
        setShowLoginNotifications(true);
        sessionStorage.setItem('notificationsShownForSession', 'true');
    } else if (!currentUser) {
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
  const resetTimer = useCallback(() => {
    if (timerRef.current) {
        clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
        addNotification({ type: 'info', message: 'Session timed out due to inactivity.' });
        logout();
    }, settings.sharedMode.autoExitMinutes * 60 * 1000);
  }, [settings.sharedMode.autoExitMinutes, logout, addNotification]);

  useEffect(() => {
      if (settings.sharedMode.enabled && settings.sharedMode.autoExit && isKioskDevice) {
          const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
          
          events.forEach(event => {
              window.addEventListener(event, resetTimer);
          });

          resetTimer(); // Start the timer initially

          return () => {
              if (timerRef.current) {
                  clearTimeout(timerRef.current);
              }
              events.forEach(event => {
                  window.removeEventListener(event, resetTimer);
              });
          };
      } else {
        // If not in kiosk mode or settings are off, make sure any existing timer is cleared.
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
      }
  }, [settings.sharedMode.enabled, settings.sharedMode.autoExit, resetTimer, isKioskDevice]);


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
            <VacationModeBanner />
            <Suspense fallback={<LoadingSpinner />}>
                {renderPage()}
            </Suspense>
          </main>
        </div>
      </div>
      <ChatController />
      {isChatOpen && <ChatPanel />}
      {readingQuest && <EpubReaderPanel quest={readingQuest} />}
      {readingPdfQuest && <PdfReaderPanel quest={readingPdfQuest} />}
    </>
  );
};

export default MainLayout;
