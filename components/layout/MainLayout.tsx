import React, { useMemo, useEffect, useState, useRef } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from '../pages/Dashboard';
import QuestsPage from '../pages/QuestsPage';
import MarketplacePage from '../pages/MarketplacePage';
import ChroniclesPage from '../pages/ChroniclesPage';
import GuildPage from '../pages/GuildPage';
import UserManagementPage from '../pages/management/UserManagementPage';
import { Page, Role, SystemNotification } from '../../types';
import RewardsPage from '../pages/RewardsPage';
import ManageQuestsPage from '../pages/management/ManageQuestsPage';
import ApprovalsPage from '../pages/ApprovalsPage';
import ManageMarketsPage from '../pages/management/ManageMarketsPage';
import ManageGuildsPage from '../pages/management/ManageGuildsPage';
import { SettingsPage } from '../pages/SettingsPage';
import ProfilePage from '../pages/ProfilePage';
import CalendarPage from '../pages/CalendarPage';
import ProgressPage from '../pages/ProgressPage';
import TrophiesPage from '../pages/TrophiesPage';
import RanksPage from '../pages/RanksPage';
import HelpPage from '../pages/HelpPage';
import AvatarPage from '../pages/AvatarPage';
import VacationModeBanner from '../settings/VacationModeBanner';
import ManageRanksPage from '../pages/management/ManageRanksPage';
import ManageTrophiesPage from '../pages/management/ManageTrophiesPage';
import { AboutPage } from '../pages/AboutPage';
import CollectionPage from '../pages/CollectionPage';
import ManageItemsPage from '../pages/management/ManageItemsPage';
import SuggestionEnginePage from '../pages/SuggestionEnginePage';
import AppearancePage from '../pages/AppearancePage';
import ObjectExporterPage from '../pages/management/ObjectExporterPage';
import AssetManagerPage from '../pages/management/AssetManagerPage';
import { BackupAndImportPage } from '../pages/management/BackupAndImportPage';
import AssetLibraryPage from '../pages/management/AssetLibraryPage';
import ManageQuestGroupsPage from '../pages/management/ManageQuestGroupsPage';
import { useData } from '../../context/DataProvider';
import { useUIState, useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import ChatPanel from '../chat/ChatPanel';
import LoginNotificationPopup from '../user-interface/LoginNotificationPopup';
import ManageEventsPage from '../pages/management/ManageEventsPage';
import BugTrackingPage from '../dev/BugTrackingPage';
import ManageRotationsPage from '../pages/management/ManageRotationsPage';
import ManageSetbacksPage from '../pages/management/ManageSetbacksPage';
import ThemesPage from '../pages/ThemesPage';

const MainLayout: React.FC = () => {
  const { settings, systemNotifications } = useData();
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
    'Manage Events', 'Bug Tracker', 'Manage Setbacks'
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
    switch (activePage) {
      case 'Dashboard': return <Dashboard />;
      case 'Avatar': return <AvatarPage />;
      case 'Collection': return <CollectionPage />;
      case 'Themes': return <ThemesPage />;
      case 'Quests': return <QuestsPage />;
      case 'Marketplace': return <MarketplacePage />;
      case 'Calendar': return <CalendarPage />;
      case 'Progress': return <ProgressPage />;
      case 'Trophies': return <TrophiesPage />;
      case 'Ranks': return <RanksPage />;
      case 'Chronicles': return <ChroniclesPage />;
      case 'Guild': return <GuildPage />;
      case 'Manage Users': return <UserManagementPage />;
      case 'Manage Rewards': return <RewardsPage />;
      case 'Manage Quests': return <ManageQuestsPage />;
      case 'Manage Quest Groups': return <ManageQuestGroupsPage />;
      case 'Manage Rotations': return <ManageRotationsPage />;
      case 'Manage Goods': return <ManageItemsPage />;
      case 'Manage Markets': return <ManageMarketsPage />;
      case 'Manage Guilds': return <ManageGuildsPage />;
      case 'Manage Ranks': return <ManageRanksPage />;
      case 'Manage Trophies': return <ManageTrophiesPage />;
      case 'Manage Events': return <ManageEventsPage />;
      case 'Manage Setbacks': return <ManageSetbacksPage />;
      case 'Suggestion Engine': return <SuggestionEnginePage />;
      case 'Approvals': return <ApprovalsPage />;
      case 'Settings': return <SettingsPage />;
      case 'Appearance': return <AppearancePage />;
      case 'Object Exporter': return <ObjectExporterPage />;
      case 'Asset Manager': return <AssetManagerPage />;
      case 'Backup & Import': return <BackupAndImportPage />;
      case 'Asset Library': return <AssetLibraryPage />;
      case 'Profile': return <ProfilePage />;
      case 'About': return <AboutPage />;
      case 'Help Guide': return <HelpPage />;
      case 'Bug Tracker': return <BugTrackingPage />;
      default: return <Dashboard />;
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
      <div className="flex h-screen" style={{ backgroundColor: 'hsl(var(--color-bg-secondary))', color: 'hsl(var(--color-text-primary))' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8" style={{ backgroundColor: 'hsl(var(--color-bg-tertiary))' }}>
            <VacationModeBanner />
            {renderPage()}
          </main>
        </div>
      </div>
      {isChatOpen && <ChatPanel />}
    </>
  );
};

export default MainLayout;