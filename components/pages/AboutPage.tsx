import React, { useState, ReactNode } from 'react';
import Card from '../user-interface/Card';
import { useAppState } from '../../context/AppContext';
import { ChevronDownIcon } from '../user-interface/Icons';

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-stone-800/50 border border-stone-700/60 rounded-xl shadow-lg mt-8" style={{ backgroundColor: 'hsl(var(--color-bg-secondary))', borderColor: 'hsl(var(--color-border))' }}>
            <button
                className="w-full flex justify-between items-center text-left px-6 py-4 hover:bg-stone-700/30 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <h3 className="text-2xl font-medieval text-accent">{title}</h3>
                <ChevronDownIcon className={`w-6 h-6 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-6 border-t" style={{ borderColor: 'hsl(var(--color-border))' }}>
                    {children}
                </div>
            )}
        </div>
    );
};

const V0_0_51_DATE = new Date(2025, 7, 8);
const V0_0_97_DATE = new Date(2025, 6, 23);
const V0_0_96_DATE = new Date(2025, 6, 22);
const V0_0_95_DATE = new Date(2025, 6, 22);
const V0_0_94_DATE = new Date(2025, 6, 26);
const V0_0_93_DATE = new Date(2025, 6, 25);
const V0_0_92_DATE = new Date(2025, 6, 24);
const V0_0_91_DATE = new Date(2025, 6, 23);
const V0_0_90_DATE = new Date(2025, 6, 22);
const V0_0_89_DATE = new Date(2025, 6, 21);
const V0_0_88_DATE = new Date(2025, 6, 20);
const V0_0_87_DATE = new Date(2025, 6, 20);
const V0_0_86_DATE = new Date(2025, 6, 19);
const V0_0_85_DATE = new Date(2025, 6, 19);
const V0_0_84_DATE = new Date(2025, 6, 19);
const V0_0_83_DATE = new Date(2025, 6, 19);
const V0_0_82_DATE = new Date(2025, 6, 19);
const V0_0_81_DATE = new Date(2025, 6, 19);
const V0_0_80_DATE = new Date(2025, 6, 19);

const VersionHistoryContent: React.FC = () => (
    <div className="prose prose-invert max-w-none text-stone-300 space-y-4">
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.51 ({V0_0_51_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Sidebar Notification Badge Fix:</strong> Fixed a UI inconsistency where the notification count for pending approvals was not shown on the 'Approvals' link when its parent 'User Management' group was expanded. The badge now correctly moves to the specific link, improving user experience.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.97 ({V0_0_97_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>New "Vacation" Event Type:</strong> Replaced the old global vacation mode setting with a more flexible "Vacation" event type.</li>
                <li><strong>Calendar-Driven Vacations:</strong> Admins can now schedule vacation periods directly on the calendar for either personal use or for an entire guild.</li>
                <li><strong>Automatic Penalty Pausing:</strong> While a "Vacation" event is active, the system automatically pauses all late/incomplete penalties for scheduled quests, allowing users to take a break without consequences.</li>
                <li><strong>Streamlined Settings:</strong> Removed the old vacation mode toggle from the Settings page to create a single, intuitive workflow through the calendar.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.96 ({V0_0_96_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Default Quest Groups:</strong> The app now ships with a default set of Quest Groups (e.g., "Household Chores," "School & Learning") to provide an immediate organizational structure for new and existing games without any groups.</li>
                <li><strong>AI-Powered Group Suggestions:</strong> The Quest Idea Generator in the AI Studio is now aware of all existing Quest Groups and will suggest the most appropriate group for each generated quest idea.</li>
                <li><strong>Streamlined Quest Creation:</strong> When creating a quest from an AI-generated idea, the "Create Quest" form is now pre-filled with the suggested Quest Group, saving administrative time and improving workflow.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.95 ({V0_0_95_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Smarter AI Studio:</strong> The AI Studio is now more integrated with the game's mechanics. When generating quest ideas, it will now also suggest relevant categories (tags) and appropriate rewards, pre-filling the new quest form to save administrators time.</li>
                <li><strong>Powerful Bulk Editing for Quests:</strong> A new bulk editing system has been introduced on the "Manage Quests" page. Administrators can now select multiple quests and simultaneously update their status, group assignments, tags, and assigned users from a single dialog.</li>
                <li><strong>Enhanced Collapsed Sidebar:</strong> The user experience for the collapsed sidebar has been significantly upgraded with a new fly-out menu system. Hovering over any icon now instantly reveals a panel showing the full name of the link or its contents, making navigation faster and more intuitive.</li>
                <li><strong>Default Quest Categories:</strong> To help administrators get started, the app now includes a default set of common quest categories (e.g., "Cleaning," "Learning," "Yardwork"). These appear automatically in tag selection fields.</li>
                <li><strong>UI Bug Fixes:</strong> Corrected a recurring issue where a "0" badge would incorrectly appear on collapsed sidebar menus that had no notifications.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.94 ({V0_0_94_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Default Quest Categories:</strong> To help new administrators get started faster, the app now includes a default set of common quest categories (e.g., "Cleaning", "Learning", "Yardwork"). These appear automatically in the tag selection inputs alongside any custom tags you create.</li>
                <li><strong>Improved Collapsed Sidebar Navigation:</strong> The collapsed sidebar is now more functional. Collapsible menu groups remain visible as icons with expand/collapse arrows, allowing you to access nested links without needing to expand the entire sidebar.</li>
                <li><strong>UI Bug Fix:</strong> Fixed a minor UI bug where a badge with a "0" would incorrectly appear on collapsed sidebar menu groups that had no notifications.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.93 ({V0_0_93_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Purchase Escrow System:</strong> When an item requiring approval is purchased, the funds are now immediately deducted and held in escrow. This prevents users from spending those funds elsewhere. If the purchase is rejected or cancelled, the funds are automatically refunded.</li>
                <li><strong>Chronicles Integration for Purchases:</strong> All purchase requests (pending, completed, rejected) now appear correctly in the Chronicles activity feed with a clear title and a note showing the cost.</li>
                <li><strong>Improved Login Notifications:</strong> The notification popup that appears on login is now scrollable to accommodate a large number of updates, and it includes an "X" button for quick dismissal.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.92 ({V0_0_92_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>In-Dialog Quest Group Creation:</strong> To streamline workflow, administrators can now create new Quest Groups directly from within the "Create/Edit Quest" dialog without navigating to a separate management page.</li>
                <li><strong>Quick Edit Access:</strong> On the "Manage Quests" and "Manage Goods" pages, an item's title is now clickable, immediately opening the edit dialog for faster content updates.</li>
            </ul>
        </div>
         <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.91 ({V0_0_91_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Redesigned Management Pages:</strong> The "Manage Goods" and "Manage Quests" pages have been completely overhauled with a modern, tabbed interface for better organization.</li>
                <li><strong>Powerful Filtering & Sorting:</strong> Both management pages now include search bars and sorting options, making it easier than ever to find the content you need.</li>
                <li><strong>Quest Groups:</strong> A new "Quest Group" system allows administrators to categorize quests. This includes a new management page to create and edit groups.</li>
                <li><strong>Bulk Quest Assignment:</strong> The most powerful feature of Quest Groups is the ability to assign an entire group of quests to multiple users at once, dramatically speeding up workflow.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.90 ({V0_0_90_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Smarter Asset Pack Importer:</strong> The "Import from Library" feature in the Asset Manager has been completely overhauled. It now performs a smart comparison between your local gallery and the server's image packs, highlighting new files (in green, pre-selected) versus duplicates (in red, disabled). This gives you granular control over which new assets to import, preventing accidental re-downloads and making library management much more efficient.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.89 ({V0_0_89_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Enhanced Chronicles:</strong> The activity feed now displays the currency and amount spent for each item purchase, providing a clearer transaction history.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.88 ({V0_0_88_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Critical Docker Stability Fix:</strong> Resolved a race condition that caused chat messages to not save and the app to become unresponsive in Docker environments. The data saving mechanism is now more robust, preventing server syncs from overwriting unsaved local changes and eliminating the frequent "Failed to fetch" errors.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.87 ({V0_0_87_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Calendar Day View Enhancement:</strong> Added due date/time information for quests on the main 'Day' view of the calendar, improving at-a-glance scheduling clarity.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.86 ({V0_0_86_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Enhanced the reward valuation helper in the quest editor to show both anchor and real-world values.</li>
                <li>Improved the layout of the reward input group for better usability.</li>
                <li>Updated default economic values for currencies and experience points.</li>
                <li>Added an explanatory note to the "Economy & Valuation" settings page.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.85 ({V0_0_85_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li>A new feature has been added to the `Asset Manager` page, allowing administrators to dynamically import curated image packs directly from the project's GitHub repository. This keeps the main application lean while providing easy access to a library of high-quality images.</li>
            </ul>
        </div>
         <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.84 ({V0_0_84_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li>The asset management workflow has been significantly improved. Admins can now specify a category when uploading an image from the `Asset Manager`, and the backend will automatically organize the file into a corresponding sub-folder.</li>
            </ul>
        </div>
         <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.83 ({V0_0_83_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li>The entire backup system has been overhauled for production-grade reliability. Backups are now saved directly on the server's file system, and automated backups run as a reliable server-side process. This provides a durable and persistent way to manage data, especially for self-hosted Docker environments.</li>
            </ul>
        </div>
         <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.82 ({V0_0_82_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li>A comprehensive notification system has been added. Users now see a popup on login detailing new quest assignments, guild announcements from Donegeon Masters, trophies unlocked, and items pending approval. This feature can be toggled in a new "Notifications" section in the settings.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.81 ({V0_0_81_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Revamped the "About" page with a cleaner, collapsible design.</li>
                <li>Added a "Roadmap" section detailing future plans for the application.</li>
                <li>Included a direct link to the project's GitHub repository.</li>
                <li>Created this "Version History" section to track updates.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.80 ({V0_0_80_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Initial public version.</li>
            </ul>
        </div>
    </div>
);

const RoadmapContent: React.FC = () => (
    <div className="prose prose-invert max-w-none text-stone-300 space-y-6">
        <p className="text-sm">Here is the planned development path for Task Donegeon, prioritized for the most impactful features first.</p>
        
        <div>
            <h4 className="text-xl font-bold text-stone-100 font-medieval">Phase 1: Foundational Features &amp; Quality of Life</h4>
            <p className="text-xs text-stone-400">This phase focuses on high-impact improvements for admins and players that enhance the core experience.</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Backend Authentication:</strong> Implement JWT-based authentication to secure all backend API endpoints.</li>
                <li><strong>Enhanced Security:</strong> A comprehensive security audit and implementation of best practices like strict input validation, Content Security Policy (CSP), and secure headers.</li>
                <li><strong>Quest Bundles:</strong> Group quests into "Quest Chains" or "Storylines." This allows admins to create multi-step adventures.</li>
                <li><strong>Showcase Page:</strong> A public profile page for each explorer to showcase their avatar, earned trophies, and key stats.</li>
                <li><strong>Advanced Object Manager:</strong> Implement bulk editing, quick duplication, and powerful filtering/sorting for all game objects.</li>
                <li><strong>Improved Progress Page:</strong> A more detailed summary of user activity, highlighting strengths and areas for improvement with visual charts.</li>
            </ul>
        </div>

        <div>
            <h4 className="text-xl font-bold text-stone-100 font-medieval">Phase 2: Core Gameplay &amp; Personalization</h4>
            <p className="text-xs text-stone-400">This phase introduces major new creative outlets and systems for deeper engagement.</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>User-Created Content:</strong> A system allowing Explorers to design their own quests and items, then submit them to admins for approval. This fosters creativity and allows the game world to be co-created by its members.</li>
                <li><strong>Reward R
  </change>
  <change>
    <file>components/pages/management/ManageItemsPage.tsx</file>
    <description>Replaced the incomplete and incorrect content of ManageItemsPage.tsx with a full, functional component for managing Game Assets. This resolves the syntax error and provides the intended functionality for the 'Manage Goods' page.</description>
    <content><![CDATA[import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import { GameAsset } from '../../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import EditGameAssetDialog from '../../admin/EditGameAssetDialog';
import EmptyState from '../../user-interface/EmptyState';
import { ItemManagerIcon, EllipsisVerticalIcon } from '../../user-interface/Icons';
import ItemIdeaGenerator from '../../quests/ItemIdeaGenerator';
import Input from '../../user-interface/Input';
import ImagePreviewDialog from '../../user-interface/ImagePreviewDialog';
import { useDebounce } from '../../../hooks/useDebounce';
import { useNotificationsDispatch } from '../../../context/NotificationsContext';
import { useEconomyState } from '../../../context/EconomyContext';
import UploadWithCategoryDialog from '../../admin/UploadWithCategoryDialog';
import { useShiftSelect } from '../../../hooks/useShiftSelect';

const ManageItemsPage: React.FC = () => {
    const { settings, isAiConfigured } = useAppState();
    const { uploadFile } = useAppDispatch();
    const { gameAssets: allGameAssets } = useEconomyState();
    const { addNotification } = useNotificationsDispatch();
    
    const [pageAssets, setPageAssets] = useState<GameAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingAsset, setEditingAsset] = useState<GameAsset | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [confirmation, setConfirmation] = useState<{ action: 'delete', ids: string[] } | null>(null);
    const [initialCreateData, setInitialCreateData] = useState<any | null>(null);
    const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'createdAt-desc' | 'createdAt-asc' | 'name-asc' | 'name-desc'>('createdAt-desc');
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const [isDragging, setIsDragging] = useState(false);
    const [fileToCategorize, setFileToCategorize] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const isAiAvailable = settings.enableAiFeatures && isAiConfigured;

    const categories = useMemo(() => ['All', ...Array.from(new Set(allGameAssets.map(a => a.category)))], [allGameAssets]);

    const pageAssetIds = useMemo(() => pageAssets.map(a => a.id), [pageAssets]);
    const handleCheckboxClick = useShiftSelect(pageAssetIds, selectedAssets, setSelectedAssets);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const apiRequest = useCallback(async (method: string, path: string, body?: any) => {
        try {
            const options: RequestInit = {
                method,
                headers: { 'Content-Type': 'application/json' },
            };
            if (body) options.body = JSON.stringify(body);
            const response = await window.fetch(path, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Server error' }));
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }
            return response.status === 204 ? null : await response.json();
        } catch (error) {
            addNotification({ type: 'error', message: error instanceof Error ? error.message : 'An unknown network error occurred.' });
            throw error;
        }
    }, [addNotification]);

    const fetchAssets = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeTab !== 'All') params.append('category', activeTab);
            if (debouncedSearchTerm) params.append('searchTerm', debouncedSearchTerm);
            params.append('sortBy', sortBy);

            const data = await apiRequest('GET', `/api/assets?${params.toString()}`);
            setPageAssets(data as GameAsset[]);
        } catch (error) {
            console.error("Failed to fetch assets:", error);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, debouncedSearchTerm, sortBy, apiRequest]);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    useEffect(() => {
        setSelectedAssets([]);
    }, [activeTab, searchTerm, sortBy]);
    
    const handleFileProcess = useCallback((file: File) => {
        setFileToCategorize(file);
    }, []);

    const handleUploadWithCategory = async (file: File, category: string) => {
        setIsUploading(true);
        try {
            const uploadedAsset = await uploadFile(file, category);
            if (uploadedAsset?.url) {
                addNotification({ type: 'success', message: 'Image uploaded! Now add asset details.' });
                const assetName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
                setInitialCreateData({
                    url: uploadedAsset.url,
                    name: assetName.charAt(0).toUpperCase() + assetName.slice(1),
                    category,
                });
                setIsCreateDialogOpen(true);
            } else {
                throw new Error('Upload failed to return a URL.');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            addNotification({ type: 'error', message: `Upload failed: ${message}` });
        } finally {
            setIsUploading(false);
            setFileToCategorize(null);
        }
    };
    
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) Array.from(event.target.files).forEach(handleFileProcess);
        event.target.value = '';
    };

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        if (event.dataTransfer.files?.length > 0) {
            Array.from(event.dataTransfer.files).forEach(handleFileProcess);
            event.dataTransfer.clearData();
        }
    }, [handleFileProcess]);

    const handleDragEvents = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.type === 'dragenter' || event.type === 'dragover') setIsDragging(true);
        else if (event.type === 'dragleave') setIsDragging(false);
    };


    const handleEdit = (asset: GameAsset) => {
        setEditingAsset(asset);
        setIsCreateDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingAsset(null);
        setInitialCreateData(null);
        setIsCreateDialogOpen(true);
    };

    const handleSaveAsset = async (assetData: any) => {
        const isEditing = !!editingAsset;
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `/api/assets/${editingAsset!.id}` : '/api/assets';
        try {
            await apiRequest(method, url, assetData);
            addNotification({ type: 'success', message: `Asset ${isEditing ? 'updated' : 'created'} successfully!` });
            fetchAssets(); // Refresh data
        } catch (e) { /* error handled by apiRequest */ }
    };

    const handleClone = async (assetId: string) => {
        try {
            await apiRequest('POST', `/api/assets/clone/${assetId}`);
            addNotification({ type: 'success', message: 'Asset cloned successfully!' });
            fetchAssets();
        } catch (e) { /* error handled */ }
    };

    const handleConfirmAction = async () => {
        if (!confirmation || confirmation.action !== 'delete') return;
        try {
            await apiRequest('DELETE', '/api/assets', { ids: confirmation.ids });
            addNotification({ type: 'info', message: `${confirmation.ids.length} asset(s) deleted.` });
            setSelectedAssets([]);
            fetchAssets();
        } catch (e) { /* error handled */ }
        setConfirmation(null);
    };

    const handleUseIdea = (idea: any) => {
        setIsGeneratorOpen(false);
        setInitialCreateData({
            ...idea,
            url: `https://placehold.co/150/FFFFFF/000000?text=${encodeURIComponent(idea.icon)}`
        });
        setEditingAsset(null);
        setIsCreateDialogOpen(true);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedAssets(e.target.checked ? pageAssets.map(a => a.id) : []);
    };

    return (
        <div className="space-y-6">
             <Card title="Quick Add Asset">
                <div
                    onDrop={handleDrop}
                    onDragEnter={handleDragEvents} onDragOver={handleDragEvents} onDragLeave={handleDragEvents}
                    className={`p-8 border-2 border-dashed rounded-lg text-center transition-colors ${
                        isDragging ? 'border-emerald-500 bg-emerald-900/20' : 'border-stone-600'
                    }`}
                >
                    <input id="file-upload" type="file" multiple onChange={handleFileSelect} className="hidden" disabled={isUploading} />
                    <p className="text-stone-400 mb-4">Drag & drop files here, or click to select.</p>
                    <div className="flex justify-center gap-4">
                        <Button onClick={() => document.getElementById('file-upload')?.click()} disabled={isUploading} data-log-id="manage-items-upload-image">
                            {isUploading ? 'Processing...' : 'Upload Image'}
                        </Button>
                         {isAiAvailable && (
                            <Button onClick={() => setIsGeneratorOpen(true)} variant="secondary" data-log-id="manage-items-create-with-ai">Create with AI</Button>
                        )}
                        <Button onClick={handleCreate} variant="secondary" data-log-id="manage-items-create-manually">Create Manually</Button>
                    </div>
                </div>
            </Card>
            <Card title="All Created Items & Assets">
                <div className="border-b border-stone-700 mb-4">
                    <nav className="-mb-px flex space-x-4 overflow-x-auto">
                        {categories.map(category => (
                            <button key={category} onClick={() => setActiveTab(category)}
                                data-log-id={`manage-items-tab-${category.toLowerCase()}`}
                                className={`capitalize whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === category
                                    ? 'border-emerald-500 text-emerald-400'
                                    : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-500'
                                }`}>
                                {category}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex flex-wrap gap-4 mb-4">
                    <Input placeholder="Search assets..." value={searchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} className="max-w-xs" />
                    <Input as="select" value={sortBy} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as typeof sortBy)}>
                        <option value="createdAt-desc">Date (Newest)</option>
                        <option value="createdAt-asc">Date (Oldest)</option>
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                    </Input>
                    {selectedAssets.length > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-stone-900/50 rounded-lg">
                            <span className="text-sm font-semibold text-stone-300 px-2">{selectedAssets.length} selected</span>
                            <Button size="sm" variant="secondary" className="!bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => setConfirmation({ action: 'delete', ids: selectedAssets })} data-log-id="manage-items-bulk-delete">Delete</Button>
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <div className="text-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div></div>
                ) : pageAssets.length > 0 ? (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 w-12"><input type="checkbox" onChange={handleSelectAll} checked={selectedAssets.length === pageAssets.length && pageAssets.length > 0} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" /></th>
                                    <th className="p-4 font-semibold w-20">Image</th>
                                    <th className="p-4 font-semibold">Name</th>
                                    <th className="p-4 font-semibold">Category</th>
                                    <th className="p-4 font-semibold">For Sale</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageAssets.map(asset => {
                                    const isOrphaned = asset.isForSale && (!asset.marketIds || asset.marketIds.length === 0);
                                    return (
                                        <tr key={asset.id} className="border-b border-stone-700/40 last:border-b-0">
                                            <td className="p-4">
                                                <input type="checkbox" checked={selectedAssets.includes(asset.id)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCheckboxClick(e, asset.id)} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" />
                                            </td>
                                            <td className="p-2">
                                                <button onClick={() => setPreviewImageUrl(asset.url)} className="w-12 h-12 bg-stone-700 rounded-md overflow-hidden hover:ring-2 ring-accent">
                                                    <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                                                </button>
                                            </td>
                                            <td className="p-4 font-bold">
                                                <button onClick={() => handleEdit(asset)} data-log-id={`manage-items-edit-title-${asset.id}`} className="hover:underline hover:text-accent transition-colors text-left flex items-center gap-1.5">
                                                    {isOrphaned && <span title="This item is for sale but not in any market." className="text-yellow-400">⚠️</span>}
                                                    {asset.name}
                                                </button>
                                            </td>
                                            <td className="p-4 text-stone-400">{asset.category}</td>
                                            <td className="p-4 text-stone-300">{asset.isForSale ? 'Yes' : 'No'}</td>
                                            <td className="p-4 relative">
                                                <button onClick={() => setOpenDropdownId(openDropdownId === asset.id ? null : asset.id)} className="p-2 rounded-full hover:bg-stone-700/50">
                                                    <EllipsisVerticalIcon className="w-5 h-5 text-stone-300" />
                                                </button>
                                                {openDropdownId === asset.id && (
                                                    <div ref={dropdownRef} className="absolute right-10 top-0 mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                                                        <a href="#" onClick={(e) => { e.preventDefault(); handleEdit(asset); setOpenDropdownId(null); }} data-log-id={`manage-items-action-edit-${asset.id}`} className="block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Edit</a>
                                                        <button onClick={() => { handleClone(asset.id); setOpenDropdownId(null); }} data-log-id={`manage-items-action-clone-${asset.id}`} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Clone</button>
                                                        <button onClick={() => { setConfirmation({ action: 'delete', ids: [asset.id] }); setOpenDropdownId(null); }} data-log-id={`manage-items-action-delete-${asset.id}`} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700/50">Delete</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        Icon={ItemManagerIcon}
                        title="No Assets Found"
                        message={searchTerm ? "No assets match your search." : "Create your first asset to be used as a reward or marketplace item."}
                        actionButton={<Button onClick={handleCreate} data-log-id="manage-items-create-empty-state">Create Asset</Button>}
                    />
                )}
            </Card>
            
            {fileToCategorize && (
                <UploadWithCategoryDialog
                    file={fileToCategorize}
                    onClose={() => setFileToCategorize(null)}
                    onUpload={handleUploadWithCategory}
                    existingCategories={categories.filter(c => c !== 'All')}
                />
            )}
            
            {isCreateDialogOpen && <EditGameAssetDialog 
                assetToEdit={editingAsset} 
                initialData={initialCreateData} 
                onClose={() => { setEditingAsset(null); setIsCreateDialogOpen(false); setInitialCreateData(null); }}
                onSave={handleSaveAsset}
            />}
            {isGeneratorOpen && <ItemIdeaGenerator onUseIdea={handleUseIdea} onClose={() => setIsGeneratorOpen(false)} />}

            <ConfirmDialog
                isOpen={!!confirmation}
                onClose={() => setConfirmation(null)}
                onConfirm={handleConfirmAction}
                title="Delete Asset(s)"
                message={`Are you sure you want to delete ${confirmation?.ids.length} asset(s)? This action is permanent.`}
            />

            {previewImageUrl && (
                <ImagePreviewDialog
                    imageUrl={previewImageUrl}
                    altText="Asset preview"
                    onClose={() => setPreviewImageUrl(null)}
                />
            )}
        </div>
    );
};

export default ManageItemsPage;
]]>
    </content>
  </change>
</changes>
```