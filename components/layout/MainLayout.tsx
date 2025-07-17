import React, { useMemo, useEffect } from 'react';
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
import HelpPage from '../pages/HelpPage';
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
import ObjectManagerPage from '../pages/management/ObjectManagerPage';
import AssetManagerPage from '../pages/management/MediaManagerPage';
import BackupAndImportPage from '../pages/management/BackupAndImportPage';
import AssetLibraryPage from '../pages/management/AssetLibraryPage';
import ThemeEditorPage from '../pages/ThemeEditorPage';
import RewardDisplay from '../ui/RewardDisplay';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import ChatController from '../chat/ChatController';

const MainLayout: React.FC = () => {
  const { activePage, settings, currentUser, markets, guilds, appMode, activeMarketId } = useAppState();
  const { setActivePage, addNotification } = useAppDispatch();
  
  const ADMIN_ONLY_PAGES: Page[] = [
    'Manage Users', 'Manage Rewards', 'Manage Quests', 'Manage Items', 'Manage Markets',
    'Manage Guilds', 'Manage Ranks', 'Manage Trophies', 'Settings', 'AI Studio',
    'Appearance', 'Theme Editor', 'Object Manager', 'Asset Manager', 'Backup & Import', 'Asset Library',
  ];
  const GATEKEEPER_PAGES: Page[] = ['Approvals'];

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


  const getPageTitle = (page: Page): string => {
    switch (page) {
      case 'Dashboard':
        if (appMode.mode === 'guild') {
            const guild = guilds.find(g => g.id === appMode.guildId);
            return `${guild?.name || 'Guild'} Dashboard - ${currentUser?.gameName || 'User'}`;
        }
        return `${currentUser?.gameName || 'User'}'s Dashboard`;
      case 'Quests': return `The ${settings.terminology.task} Board`;
      case 'Marketplace':
        if (activeMarketId) {
          const market = markets.find(m => m.id === activeMarketId);
          return market?.title || 'Marketplace';
        }
        return settings.terminology.shoppingCenter;
      case 'Chronicles': return settings.terminology.history;
      case 'Guild': return `Your ${settings.terminology.groups}`;
      case 'Manage Users': return `Manage ${settings.terminology.group} Members`;
      case 'Manage Rewards': return `Manage ${settings.terminology.points}`;
      case 'Manage Quests': return `Manage ${settings.terminology.tasks}`;
      case 'Manage Items': return `Manage Items & Assets`;
      case 'Manage Markets': return `Manage ${settings.terminology.stores}`;
      case 'Manage Guilds': return `Manage ${settings.terminology.groups}`;
      case 'Manage Ranks': return `Manage ${settings.terminology.levels}`;
      case 'Manage Trophies': return `Manage ${settings.terminology.awards}`;
      case 'Trophies': return `${settings.terminology.award} Hall`;
      case 'Ranks': return `Ranks of the Donegeon`;
      case 'Help Guide': return `${settings.terminology.appName} Guide`;
      case 'About': return `About ${settings.terminology.appName}`;
      case 'Collection': return `My Collection`;
      case 'Avatar': return `Customize Your Avatar`;
      case 'Calendar': return 'Quest Calendar';
      case 'Progress': return `Adventurer's Progress`;
      case 'Profile': return 'Your Profile';
      default: return page;
    }
  };

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
      case 'Manage Items': return <ManageItemsPage />;
      case 'Manage Markets': return <ManageMarketsPage />;
      case 'Manage Guilds': return <ManageGuildsPage />;
      case 'Manage Ranks': return <ManageRanksPage />;
      case 'Manage Trophies': return <ManageTrophiesPage />;
      case 'AI Studio': return <AiStudioPage />;
      case 'Approvals': return <ApprovalsPage />;
      case 'Settings': return <SettingsPage />;
      case 'Appearance': return <AppearancePage />;
      case 'Theme Editor': return <ThemeEditorPage />;
      case 'Object Manager': return <ObjectManagerPage />;
      case 'Asset Manager': return <AssetManagerPage />;
      case 'Backup & Import': return <BackupAndImportPage />;
      case 'Asset Library': return <AssetLibraryPage />;
      case 'Profile': return <ProfilePage />;
      case 'About': return <AboutPage />;
      case 'Help Guide': return <HelpPage />;
      default: return <Dashboard />;
    }
  };

  const pageTitle = getPageTitle(activePage);

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'hsl(var(--color-bg-secondary))', color: 'hsl(var(--color-text-primary))' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8" style={{ backgroundColor: 'hsl(var(--color-bg-tertiary))' }}>
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <h1 className="text-stone-100">{pageTitle}</h1>
            <RewardDisplay />
          </div>
          <VacationModeBanner />
          {renderPage()}
        </main>
      </div>
      {settings.chat.enabled && <ChatController />}
    </div>
  );
};

export default MainLayout;