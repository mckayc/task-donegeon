
import React, { useMemo, useEffect, useState, useRef, Suspense } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Role, Page, SystemNotification } from '../../types';
import VacationModeBanner from '../settings/VacationModeBanner';
import { useUIState, useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { ChatPanel } from '../chat/ChatPanel';
import LoginNotificationPopup from '../user-interface/LoginNotificationPopup';
import ChatController from '../chat/ChatController';
import { routeConfig } from './routeConfig';
import { useSystemState } from '../../context/SystemContext';

const MainLayout: React.FC = () => {
  const { settings, systemNotifications } = useSystemState();
  const { activePage, isChatOpen } = useUIState();
  const { currentUser } = useAuthState();
  const { addNotification } = useNotificationsDispatch();
  const { setActivePage } = useUIDispatch();
  
  const [showLoginNotifications, setShowLoginNotifications] = useState(false);
  const prevUserIdRef = useRef<string | undefined>(undefined);
  
  const ADMIN_ONLY_PAGES: Page[] = [
    'Manage Users', 'Manage Rewards', 'Manage Quests', 'Manage Quest Groups', 'Manage Rotations', 'Manage Goods', 'Manage Markets',
    'Manage Guilds', 'Manage Ranks', 'Manage Trophies', 'Settings', 'Suggestion Engine',
    'Appearance', 'Object Exporter', 'Asset Manager', 'Backup & Import', 'Asset Library',
    'Manage Events', 'Bug Tracker', 'Triumphs & Trials', 'Test Cases'
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
      <div className="flex h-screen" style={{ backgroundColor: 'hsl(var(--color-bg-secondary))', color: 'hsl(var(--color-text-primary))' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8" style={{ backgroundColor: 'hsl(var(--color-bg-tertiary))' }}>
            <VacationModeBanner />
            <Suspense fallback={<LoadingSpinner />}>
                {renderPage()}
            </Suspense>
          </main>
        </div>
      </div>
      <ChatController />
      {isChatOpen && <ChatPanel />}
    </>
  );
};

export default MainLayout;
