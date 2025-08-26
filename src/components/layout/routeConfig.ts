import React, { lazy } from 'react';
import { Page } from '../../types/app';

// This is a mapping of page names to their lazy-loaded components.
export const routeConfig: Partial<Record<Page | 'Menu', React.LazyExoticComponent<React.FC<{}>>>> = {
    'Menu': lazy(() => Promise.resolve({ default: () => null })), // Placeholder for mobile navigation
    'Dashboard': lazy(() => import('../pages/Dashboard')),
    'Avatar': lazy(() => import('../pages/AvatarPage')),
    'Collection': lazy(() => import('../pages/CollectionPage')),
    'Themes': lazy(() => import('../pages/ThemesPage')),
    'Quests': lazy(() => import('../pages/QuestsPage')),
    'Marketplace': lazy(() => import('../pages/MarketplacePage')),
    'Calendar': lazy(() => import('../pages/CalendarPage')),
    'Progress': lazy(() => import('../pages/ProgressPage').then(module => ({ default: module.default }))),
    'Trophies': lazy(() => import('../pages/TrophiesPage')),
    'Ranks': lazy(() => import('../pages/RanksPage')),
    'Chronicles': lazy(() => import('../pages/ChroniclesPage')),
    'Guild': lazy(() => import('../pages/GuildPage')),
    'Manage Users': lazy(() => import('../pages/management/UserManagementPage')),
    'Manage Rewards': lazy(() => import('../pages/RewardsPage')),
    'Manage Quests': lazy(() => import('../pages/management/ManageQuestsPage')),
    'Manage Quest Groups': lazy(() => import('../pages/management/ManageQuestGroupsPage')),
    'Manage Rotations': lazy(() => import('../pages/management/ManageRotationsPage')),
    'Manage Goods': lazy(() => import('../pages/management/ManageItemsPage')),
    'Manage Markets': lazy(() => import('../pages/management/ManageMarketsPage')),
    'Manage Guilds': lazy(() => import('../pages/management/ManageGuildsPage')),
    'Manage Ranks': lazy(() => import('../pages/management/ManageRanksPage')),
    'Manage Trophies': lazy(() => import('../pages/management/ManageTrophiesPage')),
    'Manage Events': lazy(() => import('../pages/management/ManageEventsPage')),
    'Triumphs & Trials': lazy(() => import('../pages/management/ManageSetbacksPage')),
    'Approvals': lazy(() => import('../pages/ApprovalsPage')),
    // FIX: Correctly handle named export for React.lazy
    'Settings': lazy(() => import('../pages/SettingsPage').then(module => ({ default: module.SettingsPage }))),
    'Profile': lazy(() => import('../pages/ProfilePage')),
    'Suggestion Engine': lazy(() => import('../pages/SuggestionEnginePage')),
    'Appearance': lazy(() => import('../pages/AppearancePage')),
    'Object Exporter': lazy(() => import('../pages/management/ObjectExporterPage')),
    'Asset Manager': lazy(() => import('../pages/management/AssetManagerPage')),
    // FIX: Correctly handle named export for React.lazy
    'Backup & Import': lazy(() => import('../pages/management/BackupAndImportPage').then(module => ({ default: module.BackupAndImportPage }))),
    'Asset Library': lazy(() => import('../pages/management/AssetLibraryPage')),
    'Help Guide': lazy(() => import('../pages/HelpPage')),
    // FIX: Correctly handle named export for React.lazy
    'About': lazy(() => import('../pages/AboutPage').then(module => ({ default: module.AboutPage }))),
    'Bug Tracker': lazy(() => import('../pages/management/BugTrackingPage')),
    'Test Cases': lazy(() => import('../dev/TestCasesPage')),
};
