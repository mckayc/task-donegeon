import React, { useMemo } from 'react';
import { AppSettings, SidebarConfigItem, SidebarLink, Terminology, Role } from '../../types';
import ToggleSwitch from '../user-interface/ToggleSwitch';
import Button from '../user-interface/Button';
import { INITIAL_MAIN_SIDEBAR_CONFIG } from '../../data/initialData';

interface FocusModeSettingsProps {
    sidebars: AppSettings['sidebars'];
    chat: AppSettings['chat'];
    terminology: Terminology;
    onChange: (updatedSidebars: AppSettings['sidebars'], chatEnabled?: boolean) => void;
}

interface ModuleItemMeta {
    id: string;
    description: string;
    category: 'core' | 'rpg' | 'social' | 'admin_user' | 'admin_content' | 'admin_system';
}

const MODULE_META: Record<string, ModuleItemMeta> = {
    // Core
    'Dashboard': { id: 'Dashboard', description: 'Home view with daily chore priorities, goals, and status cards.', category: 'core' },
    'Quests': { id: 'Quests', description: 'Complete chore checklist for Duties, Ventures, and Journeys.', category: 'core' },
    'Calendar': { id: 'Calendar', description: 'Interactive chore calendar and deadline schedule.', category: 'core' },
    'Marketplace': { id: 'Marketplace', description: 'Store where kids spend earned points/currency on rewards.', category: 'core' },

    // RPG & Gamification
    'Trophies': { id: 'Trophies', description: 'Badges and achievement trophies for completing milestones.', category: 'rpg' },
    'Ranks': { id: 'Ranks', description: 'XP levels, prestige tiers, and rank progression badges.', category: 'rpg' },
    'Progress': { id: 'Progress', description: 'Long-term completion trends, stats charts, and metrics.', category: 'rpg' },
    'Avatar': { id: 'Avatar', description: 'Character portrait and explorer avatar customization.', category: 'rpg' },
    'Collection': { id: 'Collection', description: 'Personal backpack and inventory of unlocked items/gear.', category: 'rpg' },
    'Themes': { id: 'Themes', description: 'Visual UI themes and color palette customization.', category: 'rpg' },
    'Chronicles': { id: 'Chronicles', description: 'Historical completion logs and past quest accomplishments.', category: 'rpg' },

    // Social
    'Chat': { id: 'Chat', description: 'Real-time family messaging, announcements, and direct messages.', category: 'social' },

    // Admin - User Management
    'Approvals': { id: 'Approvals', description: 'Parent review queue for completed chores and purchase requests.', category: 'admin_user' },
    'Manage Users': { id: 'Manage Users', description: 'Create, edit, and configure kids accounts and roles.', category: 'admin_user' },
    'Manage Privileges': { id: 'Manage Privileges', description: 'Daily privilege timers, screen time, and allowance conditions.', category: 'admin_user' },
    'Triumphs & Trials': { id: 'Triumphs & Trials', description: 'Behavior setbacks, manual bonus points, and disciplinary adjustments.', category: 'admin_user' },

    // Admin - Content Management
    'Manage Quests': { id: 'Manage Quests', description: 'Create, edit, duplicate, and schedule chores and quests.', category: 'admin_content' },
    'Manage Quest Groups': { id: 'Manage Quest Groups', description: 'Organize quests into categorized bundles and routines.', category: 'admin_content' },
    'Manage Rotations': { id: 'Manage Rotations', description: 'Auto-rotating chore assignments between family members.', category: 'admin_content' },
    'Manage Markets': { id: 'Manage Markets', description: 'Configure custom shops and reward categories.', category: 'admin_content' },
    'Manage Goods': { id: 'Manage Goods', description: 'Define items, coupons, privileges, and buyable rewards.', category: 'admin_content' },
    'Manage Trophies': { id: 'Manage Trophies', description: 'Design custom achievement trophies and milestone conditions.', category: 'admin_content' },
    'Manage Ranks': { id: 'Manage Ranks', description: 'Customize level XP curves and titles.', category: 'admin_content' },
    'Manage Rewards': { id: 'Manage Rewards', description: 'Configure custom currencies, XP, and point types.', category: 'admin_content' },
    'Manage Events': { id: 'Manage Events', description: 'Manage calendar events, holidays, and milestones.', category: 'admin_content' },
    'Manage Condition Sets': { id: 'Manage Condition Sets', description: 'Set prerequisite requirements for quests and shop items.', category: 'admin_content' },
    'Manage Minigames': { id: 'Manage Minigames', description: 'Reward minigames and interactive arcade bonuses.', category: 'admin_content' },
    'Manage AI Tutors': { id: 'Manage AI Tutors', description: 'Guided AI study sessions and quiz-backed quests.', category: 'admin_content' },

    // Admin - System Tools
    'Statistics': { id: 'Statistics', description: 'Global household chore completion rates and health reports.', category: 'admin_system' },
    'Asset Manager': { id: 'Asset Manager', description: 'Manage uploaded image assets, icons, and illustrations.', category: 'admin_system' },
    'Backup & Import': { id: 'Backup & Import', description: 'Export and restore application database backups.', category: 'admin_system' },
    'Object Exporter': { id: 'Object Exporter', description: 'Export quest templates and game assets to JSON.', category: 'admin_system' },
    'Appearance': { id: 'Appearance', description: 'Default global styling, background tints, and fonts.', category: 'admin_system' },
    'Asset Library': { id: 'Asset Library', description: 'Curated built-in icon packs and item graphics.', category: 'admin_system' },
    'Suggestion Engine': { id: 'Suggestion Engine', description: 'Generate AI-assisted chore ideas and rewards.', category: 'admin_system' },
    'Bug Tracker': { id: 'Bug Tracker', description: 'Developer error logger and feedback tickets.', category: 'admin_system' },
};

export const FocusModeSettings: React.FC<FocusModeSettingsProps> = ({
    sidebars,
    chat,
    terminology,
    onChange,
}) => {
    // Merge user sidebars config with default config to ensure all items exist
    const mergedItems = useMemo(() => {
        const userConfig = sidebars?.main || [];
        const defaultConfig = INITIAL_MAIN_SIDEBAR_CONFIG;
        const userMap = new Map<string, boolean>();

        userConfig.forEach(item => {
            if (item.id) {
                userMap.set(item.id, item.isVisible);
            }
        });

        return defaultConfig.map(item => {
            if (userMap.has(item.id)) {
                return { ...item, isVisible: userMap.get(item.id)! };
            }
            return { ...item };
        });
    }, [sidebars?.main]);

    // Lookup table for link visibility
    const visibilityMap = useMemo(() => {
        const map: Record<string, boolean> = {};
        mergedItems.forEach(item => {
            if (item.type === 'link') {
                map[item.id] = item.isVisible;
            }
        });
        return map;
    }, [mergedItems]);

    // Determine current preset state
    const currentMode = useMemo<'focus' | 'balanced' | 'full' | 'custom'>(() => {
        const isCoreOnly = 
            visibilityMap['Dashboard'] !== false &&
            visibilityMap['Quests'] !== false &&
            visibilityMap['Calendar'] !== false &&
            visibilityMap['Marketplace'] === false &&
            visibilityMap['Trophies'] === false &&
            visibilityMap['Ranks'] === false &&
            visibilityMap['Progress'] === false &&
            visibilityMap['Avatar'] === false &&
            visibilityMap['Collection'] === false &&
            visibilityMap['Themes'] === false &&
            visibilityMap['Chronicles'] === false &&
            (visibilityMap['Chat'] === false || !chat.enabled);

        if (isCoreOnly) return 'focus';

        const isBalanced = 
            visibilityMap['Dashboard'] !== false &&
            visibilityMap['Quests'] !== false &&
            visibilityMap['Calendar'] !== false &&
            visibilityMap['Marketplace'] !== false &&
            visibilityMap['Trophies'] !== false &&
            visibilityMap['Avatar'] === false &&
            visibilityMap['Collection'] === false &&
            visibilityMap['Themes'] === false &&
            visibilityMap['Chronicles'] === false;

        if (isBalanced) return 'balanced';

        const isFull = 
            visibilityMap['Marketplace'] !== false &&
            visibilityMap['Trophies'] !== false &&
            visibilityMap['Ranks'] !== false &&
            visibilityMap['Progress'] !== false &&
            visibilityMap['Avatar'] !== false &&
            visibilityMap['Collection'] !== false &&
            visibilityMap['Themes'] !== false &&
            visibilityMap['Chronicles'] !== false &&
            visibilityMap['Chat'] !== false;

        if (isFull) return 'full';

        return 'custom';
    }, [visibilityMap, chat.enabled]);

    // Apply updates to the sidebar config and optional chat setting
    const updateVisibility = (updates: Record<string, boolean>) => {
        let chatToggled: boolean | undefined = undefined;

        const updated = mergedItems.map(item => {
            if (item.type === 'link' && updates.hasOwnProperty(item.id)) {
                if (item.id === 'Chat') {
                    chatToggled = updates[item.id];
                }
                return { ...item, isVisible: updates[item.id] };
            }
            return item;
        });

        onChange({ ...sidebars, main: updated }, chatToggled);
    };

    const toggleSingle = (id: string, isVisible: boolean) => {
        updateVisibility({ [id]: isVisible });
    };

    // Preset Handlers
    const applyFocusMode = () => {
        updateVisibility({
            'Dashboard': true,
            'Quests': true,
            'Calendar': true,
            'Marketplace': false,
            'Trophies': false,
            'Ranks': false,
            'Progress': false,
            'Avatar': false,
            'Collection': false,
            'Themes': false,
            'Chronicles': false,
            'Chat': false,
        });
    };

    const applyBalancedMode = () => {
        updateVisibility({
            'Dashboard': true,
            'Quests': true,
            'Calendar': true,
            'Marketplace': true,
            'Trophies': true,
            'Ranks': true,
            'Avatar': false,
            'Collection': false,
            'Themes': false,
            'Progress': false,
            'Chronicles': false,
            'Chat': false,
        });
    };

    const applyFullRpgMode = () => {
        updateVisibility({
            'Dashboard': true,
            'Quests': true,
            'Calendar': true,
            'Marketplace': true,
            'Trophies': true,
            'Ranks': true,
            'Progress': true,
            'Avatar': true,
            'Collection': true,
            'Themes': true,
            'Chronicles': true,
            'Chat': true,
        });
    };

    // Helper to extract links for a category
    const getCategoryLinks = (category: ModuleItemMeta['category']): SidebarLink[] => {
        return mergedItems.filter((item): item is SidebarLink => {
            if (item.type !== 'link') return false;
            const meta = MODULE_META[item.id];
            return meta?.category === category;
        });
    };

    const coreLinks = getCategoryLinks('core');
    const rpgLinks = getCategoryLinks('rpg');
    const socialLinks = getCategoryLinks('social');
    const adminUserLinks = getCategoryLinks('admin_user');
    const adminContentLinks = getCategoryLinks('admin_content');
    const adminSystemLinks = getCategoryLinks('admin_system');

    const toggleGroup = (links: SidebarLink[], visible: boolean) => {
        const updates: Record<string, boolean> = {};
        links.forEach(l => { updates[l.id] = visible; });
        updateVisibility(updates);
    };

    const getItemTitle = (item: SidebarLink) => {
        if (item.termKey && terminology[item.termKey]) {
            return terminology[item.termKey];
        }
        return item.id;
    };

    const renderModuleRow = (item: SidebarLink) => {
        const meta = MODULE_META[item.id];
        const isVisible = item.isVisible;
        const title = getItemTitle(item);

        return (
            <div 
                key={item.id}
                className={`flex items-center justify-between p-3.5 rounded-lg border transition-all duration-150 ${
                    isVisible 
                        ? 'bg-stone-800/80 border-stone-700/80 shadow-sm' 
                        : 'bg-stone-900/40 border-stone-800/60 opacity-60 hover:opacity-80'
                }`}
            >
                <div className="flex items-center gap-3.5 flex-1 pr-4 min-w-0">
                    <span className="text-2xl flex-shrink-0 select-none">{item.emoji}</span>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className={`font-semibold text-sm ${isVisible ? 'text-stone-100' : 'text-stone-400 line-through'}`}>
                                {title}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                item.role === Role.DonegeonMaster
                                    ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50'
                                    : item.role === Role.Gatekeeper
                                    ? 'bg-blue-900/40 text-blue-300 border border-blue-700/50'
                                    : 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                            }`}>
                                {item.role === Role.DonegeonMaster ? 'Parent Only' : item.role === Role.Gatekeeper ? 'Gatekeeper' : 'Explorers'}
                            </span>
                        </div>
                        {meta?.description && (
                            <p className="text-xs text-stone-400 truncate mt-0.5">{meta.description}</p>
                        )}
                    </div>
                </div>
                <ToggleSwitch
                    enabled={isVisible}
                    setEnabled={(val) => toggleSingle(item.id, val)}
                    label=""
                    data-log-id={`toggle-module-${item.id.toLowerCase().replace(/\s+/g, '-')}`}
                />
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header / Intro banner */}
            <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 p-5 rounded-xl border border-stone-700/70 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <span className="text-2xl">🎯</span>
                            <h3 className="text-xl font-medieval text-emerald-400">Focus Mode & App Section Toggles</h3>
                        </div>
                        <p className="text-xs text-stone-300 mt-1 max-w-2xl leading-relaxed">
                            Control which features and sections are accessible to kids in your household. Turn on <strong>Focus Mode</strong> during school hours or busy mornings to hide distractions (Marketplace, Themes, Avatar, Chat) and keep them 100% focused on completing their essential chores.
                        </p>
                    </div>
                    {/* Active preset status pill */}
                    <div className="flex items-center">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border shadow-inner flex items-center gap-1.5 whitespace-nowrap ${
                            currentMode === 'focus' 
                                ? 'bg-amber-950/70 text-amber-300 border-amber-600/70 animate-pulse'
                                : currentMode === 'balanced'
                                ? 'bg-sky-950/70 text-sky-300 border-sky-600/70'
                                : currentMode === 'full'
                                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-600/70'
                                : 'bg-stone-800 text-stone-300 border-stone-600'
                        }`}>
                            <span>{currentMode === 'focus' ? '🎯' : currentMode === 'balanced' ? '⚖️' : currentMode === 'full' ? '🛡️' : '⚙️'}</span>
                            <span>
                                {currentMode === 'focus' && 'Focus Mode Active'}
                                {currentMode === 'balanced' && 'Balanced Mode'}
                                {currentMode === 'full' && 'Full RPG Realm'}
                                {currentMode === 'custom' && 'Custom Modules'}
                            </span>
                        </span>
                    </div>
                </div>

                {/* 1-Click Presets */}
                <div className="mt-4 pt-4 border-t border-stone-700/60">
                    <p className="text-xs uppercase tracking-wider font-bold text-stone-400 mb-2">Quick Presets</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                            type="button"
                            onClick={applyFocusMode}
                            className={`p-3 rounded-lg border text-left transition-all ${
                                currentMode === 'focus'
                                    ? 'bg-amber-900/30 border-amber-500 shadow-md ring-1 ring-amber-500'
                                    : 'bg-stone-800/80 border-stone-700 hover:bg-stone-700/70 hover:border-stone-600'
                            }`}
                        >
                            <div className="flex items-center gap-2 font-semibold text-sm text-amber-300">
                                <span>🎯</span>
                                <span>Focus Mode</span>
                            </div>
                            <p className="text-xs text-stone-400 mt-1">
                                Essential chores only. Hides shop, avatar, themes, and badges.
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={applyBalancedMode}
                            className={`p-3 rounded-lg border text-left transition-all ${
                                currentMode === 'balanced'
                                    ? 'bg-sky-900/30 border-sky-500 shadow-md ring-1 ring-sky-500'
                                    : 'bg-stone-800/80 border-stone-700 hover:bg-stone-700/70 hover:border-stone-600'
                            }`}
                        >
                            <div className="flex items-center gap-2 font-semibold text-sm text-sky-300">
                                <span>⚖️</span>
                                <span>Balanced Mode</span>
                            </div>
                            <p className="text-xs text-stone-400 mt-1">
                                Chores + Marketplace & Trophies. Keeps cosmetic extras off.
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={applyFullRpgMode}
                            className={`p-3 rounded-lg border text-left transition-all ${
                                currentMode === 'full'
                                    ? 'bg-emerald-900/30 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                                    : 'bg-stone-800/80 border-stone-700 hover:bg-stone-700/70 hover:border-stone-600'
                            }`}
                        >
                            <div className="flex items-center gap-2 font-semibold text-sm text-emerald-300">
                                <span>🛡️</span>
                                <span>Full RPG Realm</span>
                            </div>
                            <p className="text-xs text-stone-400 mt-1">
                                All features, shop, avatar dressing, themes, and chat enabled.
                            </p>
                        </button>
                    </div>
                </div>
            </div>

            {/* Core Sections */}
            <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-stone-700/60">
                    <div>
                        <h4 className="font-semibold text-stone-200 text-sm">Core Chore Experience</h4>
                        <p className="text-xs text-stone-400">Essential navigation and task completion workflows</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => toggleGroup(coreLinks, true)} className="text-xs h-7">
                            Enable All
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {coreLinks.map(renderModuleRow)}
                </div>
            </div>

            {/* RPG & Gamification */}
            <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-stone-700/60">
                    <div>
                        <h4 className="font-semibold text-stone-200 text-sm">Explorer RPG & Gamification Extras</h4>
                        <p className="text-xs text-stone-400">Badges, avatar customization, visual themes, and stats</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => toggleGroup(rpgLinks, true)} className="text-xs h-7">
                            Enable All
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleGroup(rpgLinks, false)} className="text-xs h-7 text-stone-400 hover:text-stone-200">
                            Disable All
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {rpgLinks.map(renderModuleRow)}
                </div>
            </div>

            {/* Communication */}
            <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-stone-700/60">
                    <div>
                        <h4 className="font-semibold text-stone-200 text-sm">Family Communication</h4>
                        <p className="text-xs text-stone-400">Direct messages and household announcements</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {socialLinks.map(renderModuleRow)}
                </div>
            </div>

            {/* Admin / Parent Management Tools */}
            <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between pb-1 border-b border-stone-700/60">
                    <div>
                        <h4 className="font-semibold text-stone-200 text-sm">Parent & Content Management Tools</h4>
                        <p className="text-xs text-stone-400">Sidebar navigation items visible to Donegeon Masters & Gatekeepers</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => toggleGroup([...adminUserLinks, ...adminContentLinks, ...adminSystemLinks], true)} className="text-xs h-7">
                            Enable All
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {[...adminUserLinks, ...adminContentLinks, ...adminSystemLinks].map(renderModuleRow)}
                </div>
            </div>
        </div>
    );
};

export default FocusModeSettings;
