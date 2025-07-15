
import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from '../pages/Dashboard';
import QuestsPage from '../pages/QuestsPage';
import MarketplacePage from '../pages/MarketplacePage';
import ChroniclesPage from '../pages/ChroniclesPage';
import GuildPage from '../pages/GuildPage';
import UserManagementPage from '../pages/UserManagementPage';
import { Page } from '../../types';
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
import { useSettings } from '../../context/SettingsContext';
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

const MainLayout: React.FC = () => {
  const { activePage } = useSettings();

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

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'hsl(var(--color-bg-secondary))', color: 'hsl(var(--color-text-primary))' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8" style={{ backgroundColor: 'hsl(var(--color-bg-tertiary))' }}>
          <VacationModeBanner />
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
