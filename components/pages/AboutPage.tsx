import React, { useState, ReactNode } from 'react';
import Card from '../ui/Card';
import { useAppState } from '../../context/AppContext';
import { ChevronDownIcon } from '../ui/Icons';

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

const V0_0_98_DATE = new Date(2025, 6, 23);
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
                Version 0.0.98 ({V0_0_98_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Bug Fix:</strong> Resolved an issue where the unread message indicator for chat would not disappear correctly after reading messages.</li>
                <li><strong>Bug Fix:</strong> Fixed a critical server error that prevented users from completing quests.</li>
                <li><strong>Stability:</strong> General improvements to backend stability.</li>
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
                <li><strong>Smarter Asset Pack Importer:</strong> The "Import from Library" feature in the Asset Manager has been completely overhauled. It now performs a smart comparison between your local gallery and the server's image packs, highlighting new files (in green, pre-selected) versus duplicates (in red, disabled). This gives administrators granular control over which new assets to import, preventing accidental re-downloads and making library management much more efficient.</li>
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
                <li><strong>Reward Rarity & Limits:</strong> Ability to specify how many of a certain reward can be claimed, creating rare or one-of-a-kind items.</li>
                <li><strong>Automated Quest Rotation:</strong> A system for automatically rotating daily or weekly duties among guild members to ensure fair distribution of chores.</li>
            </ul>
        </div>

        <div>
            <h4 className="text-xl font-bold text-stone-100 font-medieval">Phase 3: Advanced Systems &amp; World Expansion</h4>
            <p className="text-xs text-stone-400">This phase includes the big, game-changing features that add new dimensions to the world.</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Game Map:</strong> A visual map with unlockable locations. Traveling to a location could unlock new quests or markets.</li>
                <li><strong>Explorer Markets:</strong> Allow explorers to open their own markets to sell items or services to other players, creating a player-driven economy.</li>
                <li><strong>Advanced Reporting:</strong> A dedicated reporting dashboard for admins to track user engagement, economic flow, and quest completion rates.</li>
            </ul>
        </div>
        
        <div>
            <h4 className="text-xl font-bold text-stone-100 font-medieval">Phase 4: Platform Maturity &amp; Polish</h4>
            <p className="text-xs text-stone-400">This phase focuses on long-term stability, accessibility, and preparing the app for a wider audience.</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Real-time Notifications:</strong> Use WebSockets for instant updates on approvals, purchases, and guild activity.</li>
                <li><strong>Accessibility (A11Y) Audit:</strong> A full review to ensure the application is usable by people with disabilities.</li>
                <li><strong>Mobile App / PWA:</strong> Package the application as a Progressive Web App (PWA) for a native-like experience on mobile devices.</li>
            </ul>
        </div>
    </div>
);


const AboutPage: React.FC = () => {
    const { settings } = useAppState();

    return (
        <div className="max-w-4xl mx-auto">
            <Card>
                <div className="text-center">
                    <h1 className="text-5xl font-medieval text-accent">{settings.terminology.appName}</h1>
                    <p className="text-lg text-stone-300 mt-2">A gamified task and chore tracker.</p>
                    <div className="mt-4">
                        <a href="https://github.com/mckayc/task-donegeon" target="_blank" rel="noopener noreferrer" className="inline-block bg-stone-700 hover:bg-stone-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            View on GitHub
                        </a>
                    </div>
                </div>
            </Card>

            <CollapsibleSection title="Version History" defaultOpen>
                <VersionHistoryContent />
            </CollapsibleSection>

             <CollapsibleSection title="Roadmap">
                <RoadmapContent />
            </CollapsibleSection>
        </div>
    );
};

export default AboutPage;