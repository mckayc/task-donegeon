import React, { useMemo, useEffect, useState, useRef } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from '../Pages/Dashboard';
import QuestsPage from '../Pages/QuestsPage';
import MarketplacePage from '../Pages/MarketplacePage';
import ChroniclesPage from '../Pages/ChroniclesPage';
import GuildPage from '../Pages/GuildPage';
import UserManagementPage from '../Pages/UserManagementPage';
import { Page, Role, SystemNotification } from '../../types';
import RewardsPage from '../Pages/RewardsPage';
import ManageQuestsPage from '../Pages/management/ManageQuestsPage';
import ApprovalsPage from '../Pages/ApprovalsPage';
import ManageMarketsPage from '../Pages/management/ManageMarketsPage';
import ManageGuildsPage from '../Pages/ManageGuildsPage';
import { SettingsPage } from '../Pages/SettingsPage';
import ProfilePage from '../Pages/ProfilePage';
import CalendarPage from '../Pages/CalendarPage';
import ProgressPage from '../Pages/ProgressPage';
import TrophiesPage from '../Pages/TrophiesPage';
import RanksPage from '../Pages/RanksPage';
import HelpPage from '../Pages/HelpPage';
import AvatarPage from '../Pages/AvatarPage';
import VacationModeBanner from '../settings/VacationModeBanner';
import ManageRanksPage from '../Pages/management/ManageRanksPage';
import ManageTrophiesPage from '../Pages/management/ManageTrophiesPage';
import ThemesPage from '../Pages/ThemesPage';
import { AboutPage } from '../Pages/AboutPage';
import CollectionPage from '../Pages/CollectionPage';
import ManageItemsPage from '../Pages/management/ManageItemsPage';
import SuggestionEnginePage from '../Pages/SuggestionEnginePage';
import AppearancePage from '../Pages/AppearancePage';
import ObjectExporterPage from '../Pages/management/ObjectExporterPage';
import AssetManagerPage from '../Pages/management/MediaManagerPage';
import BackupAndImportPage from '../Pages/management/BackupAndImportPage';
import AssetLibraryPage from '../Pages/management/AssetLibraryPage';
import ManageQuestGroupsPage from '../Pages/ManageQuestGroupsPage';
import { useAppState } from '../../context/AppContext';
import { useAuthState } from '../../context/AuthContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useUIState, useUIDispatch } from '../../context/UIStateContext';
import ChatPanel from '../chat/ChatPanel';
import LoginNotificationPopup from '../user-interface/LoginNotificationPopup';
import ManageEventsPage from '../Pages/management/ManageEventsPage';
import BugTrackingPage from '../dev/BugTrackingPage';

const MainLayout: React.FC = () => {
  const { settings, systemNotifications } = useAppState();
  const { currentUser } = useAuthState();
  const { addNotification } = useNotificationsDispatch();
  const { activePage } = useUIState();
  const { setActivePage } = useUIDispatch();
  
  const [showLoginNotifications, setShowLoginNotifications] = useState(false);
  const [notificationsShownForSession, setNotificationsShownForSession] = useState(false);
  const prevUserIdRef = useRef<string | undefined>(undefined);
  
  const ADMIN_ONLY_PAGES: Page[] = [
    'Manage Users', 'Manage Rewards', 'Manage Quests', 'Manage Quest Groups', 'Manage Goods', 'Manage Markets',
    'Manage Guilds', 'Manage Ranks', 'Manage Trophies', 'Settings', 'Suggestion Engine',
    'Appearance', 'Object Exporter', 'Asset Manager', 'Backup & Import', 'Asset Library',
    'Manage Events', 'Bug Tracker'
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
    // This effect resets the "shown" flag whenever the user ID changes,
    // effectively starting a new "notification session" for the new user.
    if (currentUser?.id !== prevUserIdRef.current) {
        setNotificationsShownForSession(false);
        prevUserIdRef.current = currentUser?.id;
    }
  }, [currentUser]);

  useEffect(() => {
    // This effect handles the logic for showing the popup.
    if (currentUser && !notificationsShownForSession && settings.loginNotifications.enabled && unreadNotifications.length > 0) {
        setShowLoginNotifications(true);
        setNotificationsShownForSession(true); // Mark as shown for this session.
    } else if (!currentUser) {
        // Explicitly hide popup on logout, just in case.
        setShowLoginNotifications(false);
    }
  }, [currentUser, notificationsShownForSession, settings.loginNotifications.enabled, unreadNotifications]);

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
      case 'Manage Goods': return <ManageItemsPage />;
      case 'Manage Markets': return <ManageMarketsPage />;
      case 'Manage Guilds': return <ManageGuildsPage />;
      case 'Manage Ranks': return <ManageRanksPage />;
      case 'Manage Trophies': return <ManageTrophiesPage />;
      case 'Manage Events': return <ManageEventsPage />;
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
        <ChatPanel />
      </div>
    </>
  );
};

export default MainLayout;