import { lazy, ComponentType } from 'react';
import { Page } from '../../types';

/**
 * Resilient wrapper around React.lazy for dynamic chunk imports.
 * In SPAs, when a new production build is deployed with new chunk hashes,
 * existing client sessions will fail to fetch old chunks (returning 404).
 * This wrapper catches that error and automatically reloads the page once
 * so the client transparently picks up the latest build manifest.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
    factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
    return lazy(async () => {
        const hasRetried = window.sessionStorage.getItem('chunk_retry_refresh');
        try {
            const module = await factory();
            window.sessionStorage.removeItem('chunk_retry_refresh');
            return module;
        } catch (error: any) {
            const errorMsg = error?.message || error?.toString?.() || '';
            const isChunkError =
                errorMsg.includes('Failed to fetch dynamically imported module') ||
                errorMsg.includes('Importing a module script failed') ||
                errorMsg.includes('error loading dynamically imported module') ||
                error?.name === 'ChunkLoadError';

            if (isChunkError && !hasRetried) {
                console.warn('[Chunk Load Retry] Chunk hash mismatch detected, force reloading to fetch latest app bundle...', error);
                window.sessionStorage.setItem('chunk_retry_refresh', 'true');
                window.location.reload();
                return new Promise(() => {}); // Suspend while reload executes
            }
            throw error;
        }
    });
}

// Mapping of page names to resilient lazy-loaded components
export const routeConfig: Partial<Record<Page, React.LazyExoticComponent<React.FC<{}>>>> = {
    'Dashboard': lazyWithRetry(() => import('../pages/Dashboard')),
    'Avatar': lazyWithRetry(() => import('../pages/AvatarPage')),
    'Collection': lazyWithRetry(() => import('../pages/CollectionPage')),
    'Themes': lazyWithRetry(() => import('../pages/ThemesPage')),
    'Quests': lazyWithRetry(() => import('../pages/QuestsPage')),
    'Marketplace': lazyWithRetry(() => import('../pages/MarketplacePage')),
    'Calendar': lazyWithRetry(() => import('../pages/CalendarPage')),
    'Progress': lazyWithRetry(() => import('../pages/ProgressPage')),
    'Trophies': lazyWithRetry(() => import('../pages/TrophiesPage')),
    'Ranks': lazyWithRetry(() => import('../pages/RanksPage')),
    'Chronicles': lazyWithRetry(() => import('../pages/ChroniclesPage')),
    'Guild': lazyWithRetry(() => import('../pages/GuildPage')),
    'Manage Users': lazyWithRetry(() => import('../pages/management/UserManagementPage')),
    'Manage Rewards': lazyWithRetry(() => import('../pages/RewardsPage')),
    'Manage Quests': lazyWithRetry(() => import('../pages/management/ManageQuestsPage')),
    'Manage Quest Groups': lazyWithRetry(() => import('../pages/management/ManageQuestGroupsPage')),
    'Manage Rotations': lazyWithRetry(() => import('../pages/management/ManageRotationsPage')),
    'Manage Goods': lazyWithRetry(() => import('../pages/management/ManageItemsPage')),
    'Manage Markets': lazyWithRetry(() => import('../pages/management/ManageMarketsPage').then(module => ({ default: module.ManageMarketsPage }))),
    'Manage Guilds': lazyWithRetry(() => import('../pages/management/ManageGuildsPage')),
    'Manage Ranks': lazyWithRetry(() => import('../pages/management/ManageRanksPage')),
    'Manage Trophies': lazyWithRetry(() => import('../pages/management/ManageTrophiesPage')),
    'Manage Events': lazyWithRetry(() => import('../pages/management/ManageEventsPage')),
    'Manage AI Tutors': lazyWithRetry(() => import('../pages/management/ManageAITutorsPage')),
    'Triumphs & Trials': lazyWithRetry(() => import('../pages/management/ManageSetbacksPage')),
    'Suggestion Engine': lazyWithRetry(() => import('../pages/SuggestionEnginePage')),
    'Approvals': lazyWithRetry(() => import('../pages/ApprovalsPage')),
    'Settings': lazyWithRetry(() => import('../pages/SettingsPage').then(module => ({ default: module.SettingsPage }))),
    'Appearance': lazyWithRetry(() => import('../pages/AppearancePage')),
    'Object Exporter': lazyWithRetry(() => import('../pages/management/ObjectExporterPage')),
    'Asset Manager': lazyWithRetry(() => import('../pages/management/AssetManagerPage')),
    'Backup & Import': lazyWithRetry(() => import('../pages/management/BackupAndImportPage').then(module => ({ default: module.BackupAndImportPage }))),
    'Asset Library': lazyWithRetry(() => import('../pages/management/AssetLibraryPage')),
    'Profile': lazyWithRetry(() => import('../pages/ProfilePage')),
    'About': lazyWithRetry(() => import('../pages/HelpPage')),
    'Help Guide': lazyWithRetry(() => import('../pages/HelpPage')),
    'Bug Tracker': lazyWithRetry(() => import('../dev/BugTrackingPage')),
    'Test Cases': lazyWithRetry(() => import('../dev/TestCasesPage')),
    'Manage Condition Sets': lazyWithRetry(() => import('../pages/management/ManageConditionSetsPage')),
    'Manage Minigames': lazyWithRetry(() => import('../pages/management/ManageMinigamesPage')),
    'Statistics': lazyWithRetry(() => import('../pages/management/StatsPage')),
    'Enchanted Vault': lazyWithRetry(() => import('../pages/EnchantedVaultPage')),
    'Manage Privileges': lazyWithRetry(() => import('../privileges/ManagePrivilegesPage').then(module => ({ default: module.ManagePrivilegesPage }))),
};
