import React, { useMemo, useEffect, useState, useRef, Suspense } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Role, Page, SystemNotification, QuestCompletionStatus, PurchaseRequestStatus, TradeStatus, ChatMessage, SidebarLink } from '../../types';
import VacationModeBanner from '../settings/VacationModeBanner';
import { useUIState, useUIDispatch } from '../../context/UIContext';
import { useAuthState, useAuthDispatch } from '../../context/AuthContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { ChatPanel } from '../chat/ChatPanel';
import LoginNotificationPopup from '../user-interface/LoginNotificationPopup';
import ChatController from '../chat/ChatController';
import { routeConfig } from './routeConfig';
import { useSystemState } from '../../context/SystemContext';
import { ArrowLeftIcon } from '../user-interface/Icons';
import { useQuestsState } from '../../context/QuestsContext';
import { useEconomyState } from '../../context/EconomyContext';
import { useCommunityState } from '../../context/CommunityContext';
import RewardDisplay from '../user-interface/RewardDisplay';
import FullscreenToggle from '../user-interface/FullscreenToggle';
import Avatar from '../user-interface/Avatar';
import Button from '../user-interface/Button';

// SECTION: MOBILE-SPECIFIC COMPONENTS

/**
 * MobileHeader: A streamlined header for the mobile view.
 */
const MobileHeader: React.FC = () => {
  const { activePage } = useUIState();
  const pageTitle = activePage === ('Menu' as Page) ? 'Menu' : activePage;

  return (
    <header className="h-16 bg-stone-900 flex items-center justify-between px-4 border-b border-stone-700 flex-shrink-0" data-bug-reporter-ignore>
      <h1 className="text-xl font-bold font-medieval text-emerald-400">{pageTitle}</h1>
      <div className="flex items-center gap-2">
        <div className="overflow-x-auto scrollbar-hide max-w-[150px] sm:max-w-xs">
           <RewardDisplay />
        </div>
        <FullscreenToggle />
      </div>
    </header>
  );
};

/**
 * BottomNavBar: The primary navigation component for the mobile layout.
 */
const BottomNavBar: React.FC = () => {
    const { activePage } = useUIState();
    const { setActivePage } = useUIDispatch();
    const { currentUser } = useAuthState();
    const { questCompletions } = useQuestsState();
    const { purchaseRequests, tradeOffers } = useEconomyState();
    const { guilds } = useCommunityState();

    const pendingApprovalsCount = useMemo(() => {
        if (!currentUser) return 0;
        const pendingQuests = questCompletions.filter(c => c.status === QuestCompletionStatus.Pending).length;
        const pendingPurchases = currentUser.role === Role.DonegeonMaster 
            ? purchaseRequests.filter(p => p.status === PurchaseRequestStatus.Pending).length 
            : 0;
        return pendingQuests + pendingPurchases;
    }, [questCompletions, purchaseRequests, currentUser]);

    const pendingTradesCount = useMemo(() => {
        if (!currentUser) return 0;
        return tradeOffers.filter(t => t.recipientId === currentUser.id && (t.status === TradeStatus.Pending || t.status === TradeStatus.OfferUpdated)).length;
    }, [tradeOffers, currentUser]);

    const totalMenuNotifications = pendingApprovalsCount + pendingTradesCount;

    const navItems = [
        { page: 'Dashboard', label: 'Home', icon: '🏠' },
        { page: 'Quests', label: 'Quests', icon: '🗺️' },
        { page: 'Marketplace', label: 'Shop', icon: '💰' },
        { page: 'Guild', label: 'Guild', icon: '🏰' },
        { page: 'Menu', label: 'Menu', icon: '☰', notificationCount: totalMenuNotifications },
    ];

    return (
        <nav className="h-16 bg-stone-900 border-t border-stone-700 flex-shrink-0 flex items-center justify-around" data-bug-reporter-ignore>
            {navItems.map(item => (
                <button
                    key={item.page}
                    onClick={() => setActivePage(item.page as Page)}
                    className={`relative flex flex-col items-center justify-center h-full w-full transition-colors text-xs ${activePage === item.page ? 'text-emerald-400' : 'text-stone-400 hover:text-white'}`}
                >
                    <span className="text-2xl">{item.icon}</span>
                    <span>{item.label}</span>
                    {(item.notificationCount ?? 0) > 0 && (
                        <span className="absolute top-1 right-1/2 translate-x-4 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full border-2 border-stone-900">
                            {item.notificationCount > 9 ? '9+' : item.notificationCount}
                        </span>
                    )}
                </button>
            ))}
        </nav>
    );
};

/**
 * MenuPage: A dedicated page for navigation links not on the bottom bar.
 */
const MenuPage: React.FC = () => {
    const { currentUser } = useAuthState();
    const { setCurrentUser, setIsSwitchingUser, setAppUnlocked } = useAuthDispatch();
    const { setActivePage, toggleChat } = useUIDispatch();
    const { settings, isAiConfigured } = useSystemState();
    const isAiAvailable = settings.enableAiFeatures && isAiConfigured;
    if (!currentUser) return null;

    const handleLogout = () => {
        localStorage.removeItem('lastUserId');
        localStorage.removeItem('isAppUnlocked');
        setCurrentUser(null);
        setAppUnlocked(false);
    };

    const links = settings.sidebars.main.filter(link => {
        if (!link.isVisible || link.type !== 'link') return false;
        if (link.id === 'Suggestion Engine' && !isAiAvailable) return false;
        if (link.id === 'Chat' && !settings.chat.enabled) return false;
        if (link.id === 'Bug Tracker' && !settings.developerMode.enabled) return false;
        if (['Dashboard', 'Quests', 'Marketplace', 'Guild'].includes(link.id)) return false;

        if (currentUser.role === Role.DonegeonMaster) return true;
        if (currentUser.role === Role.Gatekeeper) return link.role === Role.Gatekeeper || link.role === Role.Explorer;
        return link.role === Role.Explorer;
    });

    const MenuLink: React.FC<{item: SidebarLink}> = ({ item }) => {
        const linkName = item.termKey ? settings.terminology[item.termKey] : item.id;
        
        const handleClick = () => {
            if (item.id === 'Chat') {
                toggleChat();
            } else {
                setActivePage(item.id);
            }
        };

        return (
            <button onClick={handleClick} className="w-full text-left flex items-center p-4 bg-stone-800/50 rounded-lg hover:bg-stone-700/50 transition-colors">
                <span className="text-2xl mr-4">{item.emoji}</span>
                <span className="font-semibold text-stone-200">{linkName}</span>
            </button>
        );
    };

    return (
        <div className="space-y-6 pb-4">
            <div className="flex items-center gap-4 p-4 bg-stone-800/50 rounded-lg">
                <Avatar user={currentUser} className="w-16 h-16 rounded-full" />
                <div>
                    <h2 className="text-xl font-bold text-stone-100">{currentUser.gameName}</h2>
                    <p className="text-sm text-stone-400">{currentUser.role}</p>
                </div>
            </div>
            
            <div className="space-y-2">
                 {links.map((item, index) => item.type === 'link' ? <MenuLink key={item.id || index} item={item} /> : null)}
            </div>

            <div className="pt-4 border-t border-stone-700/60 space-y-2">
                <Button variant="secondary" onClick={() => setIsSwitchingUser(true)} className="w-full">Switch User</Button>
                <Button variant="destructive" onClick={handleLogout} className="w-full">Log Out</Button>
            </div>
        </div>
    );
};

// !SECTION

const MainLayout: React.FC = () => {
  const { settings, systemNotifications } = useSystemState();
  const { activePage, isChatOpen } = useUIState();
  const { currentUser } = useAuthState();
  const { addNotification } = useNotificationsDispatch();
  const { setActivePage } = useUIDispatch();
  
  const [showLoginNotifications, setShowLoginNotifications] = useState(false);
  const prevUserIdRef = useRef<string | undefined>(undefined);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const LoadingSpinner = () => (
      <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-400"></div>
      </div>
  );

  const renderPage = () => {
    if (isMobile && activePage === ('Menu' as Page)) {
      return <MenuPage />;
    }
    const PageComponent = routeConfig[activePage] || routeConfig['Dashboard'];
    if (!PageComponent) {
      const Fallback = routeConfig['Dashboard'];
      return Fallback ? <Fallback /> : <div>Page not found</div>;
    }
    return <PageComponent />;
  };
  
  // SECTION: RENDER LOGIC
  if (isMobile) {
    // Special full-screen takeovers for mobile
    if (activePage === 'Approvals') {
        const PageComponent = routeConfig['Approvals'];
        if (!PageComponent) return null;
        return (
            <div className="flex flex-col h-screen" style={{ backgroundColor: 'hsl(var(--color-bg-tertiary))', color: 'hsl(var(--color-text-primary))' }}>
                <header className="h-16 bg-stone-900 flex items-center px-4 border-b border-stone-700 flex-shrink-0">
                    <button onClick={() => setActivePage('Menu' as Page)} className="p-2 -ml-2 text-stone-300 hover:text-white">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold ml-4">Approvals</h1>
                </header>
                <main className="flex-1 overflow-y-auto p-4">
                    <Suspense fallback={<LoadingSpinner />}>
                        <PageComponent />
                    </Suspense>
                </main>
            </div>
        );
    }
    // Standard Mobile App Shell Layout
    return (
        <>
            {showLoginNotifications && currentUser && (
                <LoginNotificationPopup notifications={unreadNotifications} user={currentUser} onClose={() => setShowLoginNotifications(false)} />
            )}
            <div className="flex flex-col h-screen" style={{ backgroundColor: 'hsl(var(--color-bg-tertiary))', color: 'hsl(var(--color-text-primary))' }}>
                <MobileHeader />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4">
                    <VacationModeBanner />
                    <Suspense fallback={<LoadingSpinner />}>
                        {renderPage()}
                    </Suspense>
                </main>
                <BottomNavBar />
            </div>
            <ChatController />
            {isChatOpen && <ChatPanel />}
        </>
    );
  }

  // Original Desktop Layout
  return (
    <>
      {showLoginNotifications && currentUser && (
        <LoginNotificationPopup notifications={unreadNotifications} user={currentUser} onClose={() => setShowLoginNotifications(false)} />
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
