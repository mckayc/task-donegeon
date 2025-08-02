import React, { useMemo, useEffect, useState, useRef } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from '../pages/Dashboard';
import QuestsPage from '../pages/QuestsPage';
import MarketplacePage from '../pages/MarketplacePage';
import ChroniclesPage from '../pages/ChroniclesPage';
import GuildPage from '../pages/GuildPage';
import UserManagementPage from '../pages/UserManagementPage';
import { Page, Role } from '../../types';
import RewardsPage from '../pages/RewardsPage';
import ManageQuestsPage from '../pages/ManageQuestsPage';
import ApprovalsPage from '../pages/ApprovalsPage';
import ManageMarketsPage from '../pages/ManageMarketsPage';
import ManageGuildsPage from '../pages/ManageGuildsPage';
import SettingsPage from '../pages/SettingsPage';
import ProfilePage from '../pages/ProfilePage';
import CalendarPage from '../pages/CalendarPage';
import ProgressPage from '../pages/ProgressPage';
import TrophiesPage from '../pages/TrophiesPage';
import RanksPage from '../pages/RanksPage';
// import HelpPage from '../pages/HelpPage';
import AvatarPage from '../pages/AvatarPage';
import VacationModeBanner from '../settings/VacationModeBanner';
import ManageRanksPage from '../pages/ManageRanksPage';
import ManageTrophiesPage from '../pages/ManageTrophiesPage';
import ThemesPage from '../pages/ThemesPage';
import AboutPage from '../pages/AboutPage';
import CollectionPage from '../pages/CollectionPage';
import ManageItemsPage from '../pages/ManageItemsPage';
import AiStudioPage from '../pages/AiStudioPage';
import AppearancePage from '../pages/AppearancePage';
import ObjectExporterPage from '../pages/management/ObjectExporterPage';
import AssetManagerPage from '../pages/management/MediaManagerPage';
import DataManagementPage from '../pages/management/DataManagementPage';
import AssetLibraryPage from '../pages/management/AssetLibraryPage';
import ThemeEditorPage from '../pages/ThemeEditorPage';
import ManageQuestGroupsPage from '../pages/ManageQuestGroupsPage';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import ChatPanel from '../chat/ChatPanel';
import LoginNotificationPopup from '../ui/LoginNotificationPopup';
import ManageEventsPage from '../pages/management/ManageEventsPage';
import BackupAndImportPage from '../pages/management/BackupAndImportPage';

const MainLayout: React.FC = () => {
  const { activePage, currentUser, settings, systemNotifications } = useAppState();
  const { setActivePage, addNotification } = useAppDispatch();
  
  const [showLoginNotifications, setShowLoginNotifications] = useState(false);
  const [notificationsShownForSession, setNotificationsShownForSession] = useState(false);
  const prevUserIdRef = useRef<string | undefined>(undefined);
  
  const unreadNotifications = useMemo(() => {
    if (!currentUser) return [];
    return systemNotifications.filter(n => 
        n.recipientUserIds.includes(currentUser.id) && 
        !n.readByUserIds.includes(currentUser.id) &&
        n.senderId !== currentUser.id // Don't show popups for your own announcements
    );
  }, [systemNotifications, currentUser]);

  useEffect(() => {
    if (currentUser?.id !== prevUserIdRef.current) {
        setNotificationsShownForSession(false);
        prevUserIdRef.current = currentUser?.id;
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && !notificationsShownForSession && settings.loginNotifications.enabled && unreadNotifications.length > 0) {
        setShowLoginNotifications(true);
        setNotificationsShownForSession(true);
    } else if (!currentUser) {
        setShowLoginNotifications(false);
    }
  }, [currentUser, notificationsShownForSession, settings.loginNotifications.enabled, unreadNotifications]);

  useEffect(() => {
    if (!currentUser || !settings.sidebars.main) return;

    const pageConfig = settings.sidebars.main.find(item => item.type === 'link' && item.id === activePage);

    if (!pageConfig) {
      return;
    }

    const requiredRole = pageConfig.role;
    const userRole = currentUser.role;

    let hasPermission = false;
    if (userRole === Role.DonegeonMaster) {
        hasPermission = true;
    } else if (userRole === Role.Gatekeeper) {
        hasPermission = (requiredRole === Role.Gatekeeper || requiredRole === Role.Explorer);
    } else if (userRole === Role.Explorer) {
        hasPermission = (requiredRole === Role.Explorer);
    }

    if (!hasPermission) {
        addNotification({ type: 'error', message: 'You do not have permission to view this page.' });
        setActivePage('Dashboard');
    }
  }, [activePage, currentUser, settings.sidebars.main, setActivePage, addNotification]);


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
      case 'AI Studio': return <AiStudioPage />;
      case 'Approvals': return <ApprovalsPage />;
      case 'Settings': return <SettingsPage />;
      case 'Appearance': return <AppearancePage />;
      case 'Theme Editor': return <ThemeEditorPage />;
      case 'Object Exporter': return <ObjectExporterPage />;
      case 'Asset Manager': return <AssetManagerPage />;
      case 'Data Management': return <DataManagementPage />;
      case 'Backup & Import': return <BackupAndImportPage />;
      case 'Asset Library': return <AssetLibraryPage />;
      case 'Profile': return <ProfilePage />;
      case 'About': return <AboutPage />;
      case 'Help Guide': return <Dashboard />; // return <HelpPage />;
      case 'Chat': return <ChatPanel />;
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
      <div className="flex h-screen bg-background text-foreground">
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