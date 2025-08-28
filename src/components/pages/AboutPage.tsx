import React, { useState, ReactNode } from 'react';
import Card from '../user-interface/Card';
import { ChevronDownIcon } from '../user-interface/Icons';
import Button from '../user-interface/Button';
import { useSystemState } from '../../context/SystemContext';

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

const V0_1_57_DATE = new Date(2025, 8, 5);
const V0_1_56_DATE = new Date(2025, 8, 4);
const V0_1_55_DATE = new Date(2025, 8, 3);
const V0_1_54_DATE = new Date(2025, 8, 2);
const V0_1_53_DATE = new Date(2025, 8, 1);
const V0_1_40_DATE = new Date(2025, 7, 26);
const V0_0_99Y_DATE = new Date(2025, 7, 19);
const V0_0_54_DATE = new Date(2025, 7, 17);
const V0_0_53_DATE = new Date(2025, 7, 15);
const V0_0_52_DATE = new Date(2025, 7, 15);
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

const WhatsNewContent: React.FC = () => {
    const { settings } = useSystemState();
    return (
        <div className="prose prose-invert max-w-none text-stone-300 space-y-4">
            <p className="text-sm">Here are the latest updates to {settings.terminology.appName}.</p>
            <div>
                <h4 className="text-lg font-bold text-stone-100">
                    Version 0.1.57 ({V0_1_57_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
                </h4>
                <ul className="list-disc list-inside space-y-2 mt-2">
                    <li><strong>Granular Chronicle Logging:</strong> The Chronicles system is now more detailed. Actions that require multiple steps (like a task completion followed by an admin approval) will now correctly generate separate, distinct log entries for each step, providing a clearer and more complete audit trail.</li>
                    <li><strong>Help Guide Enhancements:</strong> The in-app Help Guide is now easier to navigate, with clickable links for every major heading and subheading. The Table of Contents has also been streamlined into a single-column layout for better readability.</li>
                    <li><strong>Dashboard & Chronicles Sync:</strong> The "Recent Activity" widget on the Dashboard now correctly uses the same user-defined filters as the main Chronicles page, ensuring a consistent view of your activity across the app.</li>
                </ul>
            </div>
            <div>
                <h4 className="text-lg font-bold text-stone-100">
                    Version 0.1.56 ({V0_1_56_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
                </h4>
                <ul className="list-disc list-inside space-y-2 mt-2">
                    <li><strong>Update Test Release:</strong> Incremented version number to validate the new PWA update flow. This release contains no major features but serves as a way to confirm that background updates and the "Update Now" functionality are working reliably for all users.</li>
                </ul>
            </div>
        </div>
    );
}

const VersionHistoryContent: React.FC = () => (
    <div className="prose prose-invert max-w-none text-stone-300 space-y-4">
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.1.55 ({V0_1_55_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>PWA Update Reliability:</strong> Completely overhauled the service worker's caching strategy to resolve a critical bug that could cause the app to crash or show a blank screen after an update. The new "cache-first" approach for navigation ensures that the application and its assets are always in sync, providing a seamless and reliable update experience.</li>
                <li><strong>Automatic Background Updates:</strong> The app now automatically checks for new versions every hour for all users, not just admins. When an update is found, a notification will appear, allowing any user to install the latest version.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.1.54 ({V0_1_54_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Test Release & UI Improvement:</strong> Incremented version to test the new robust app update functionality.</li>
                <li><strong>New "What's New" Section:</strong> Added this dedicated "What's New" section to provide users with a clear and concise summary of the latest features and fixes directly within the app.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.1.53 ({V0_1_53_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Robust App Updates:</strong> Overhauled the service worker logic to ensure seamless in-app updates. The application now correctly fetches the latest version without requiring a manual hard refresh, preventing "Dragon Broke the Bridge" errors and blank screens after an update is installed.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.1.40 ({V0_1_40_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Data Integrity &amp; Reset Fixes:</strong> Resolved critical issues where core game elements like the default Guild, Exchange Market, and Explorer Chronicles would disappear after a full data reset. The system now correctly re-initializes these essential components.</li>
                <li><strong>Revamped Asset Pack Importer:</strong> Improved the asset pack import process. The import dialog now provides a clearer preview of all assets within the pack, including quests, markets, items, and trophies. It also includes a "select all" checkbox for easier bulk importing.</li>
                <li><strong>Enhanced Setback Rules:</strong> Added more granular control over setbacks in the "Game Rules" settings. Admins can now globally disable setbacks or choose to only apply them if quests are incomplete at the end of the day ("Forgive Late Setbacks").</li>
                <li><strong>UI Polish in Settings:</strong> Cleaned up the UI in the "Game Rules" section to prevent text from overlapping, improving readability.</li>
            </ul>
        </div>
         <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.99y ({V0_0_99Y_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>New "Journey" Quest Type:</strong> The simple "Unlocks Next Quest" feature has been completely replaced by a new, powerful <strong>Journey</strong> quest type. Journeys are multi-stage adventures composed of multiple <strong>checkpoints</strong>.</li>
                <li><strong>Dedicated Checkpoint Editor:</strong> Admins can now create epic, multi-step quests using a new, intuitive dialog to add and manage checkpoints, each with its own description and unique rewards.</li>
                <li><strong>Enhanced User Experience:</strong> Journey quests feature a distinct purple UI, progress tracking in the header (e.g., "Checkpoint 1/5"), and mystery rewards for future checkpoints to keep players engaged.</li>
                <li><strong>Full System Integration:</strong> The new Journey type is fully supported by the AI Suggestion Engine for content creation and can be exported/imported via the Asset Pack system.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.54 ({V0_0_54_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li>The calendar's day and week views now correctly display the full time range for timed quests, making deadlines much clearer.</li>
            </ul>
        </div>
         <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.53 ({V0_0_53_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Renamed an asset pack to "Student's Daily Quest" and added new tech-related marketplace rewards.</li>
            </ul>
        </div>
         <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.52 ({V0_0_52_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Added a new default asset pack for a student's daily routine with screen-time rewards.</li>
            </ul>
        </div>
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
                <li><strong>Reward Rework:</strong> Overhaul the reward system to allow for more complex and interesting rewards, such as items that grant temporary bonuses or unlock special abilities.</li>
            </ul>
        </div>
    </div>
);

export const AboutPage: React.FC = () => {
    const { settings } = useSystemState();
    
    return (
        <div className="max-w-4xl mx-auto pb-12">
            <Card className="text-center">
                <h1 className="text-5xl font-medieval text-accent mb-2">{settings.terminology.appName}</h1>
                <p className="text-stone-300 text-lg">A gamified task and chore tracker for families and groups.</p>
                <p className="mt-4 text-stone-400">Version: 0.1.57</p>
                 <div className="mt-6">
                    <a href="https://github.com/google/codewithme-task-donegeon" target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary">
                            View Project on GitHub
                        </Button>
                    </a>
                </div>
            </Card>

            <CollapsibleSection title="What's New" defaultOpen>
                <WhatsNewContent />
            </CollapsibleSection>

            <CollapsibleSection title="Version History">
                <VersionHistoryContent />
            </CollapsibleSection>

            <CollapsibleSection title="Roadmap">
                <RoadmapContent />
            </CollapsibleSection>

        </div>
    );
};