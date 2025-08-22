import React, { useState, ReactNode } from 'react';
import Card from '../user-interface/Card';
import { ChevronDownIcon } from '../user-interface/Icons';
import Button from '../user-interface/Button';
import { useSystemState } from '../../context/SystemContext';
import { logger } from '../../utils/logger';

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const handleToggle = () => {
        logger.log(`[AboutPage] Toggled '${title}' section.`);
        setIsOpen(!isOpen);
    };
    return (
        <div className="bg-stone-800/50 border border-stone-700/60 rounded-xl shadow-lg mt-8" style={{ backgroundColor: 'hsl(var(--color-bg-secondary))', borderColor: 'hsl(var(--color-border))' }}>
            <button
                className="w-full flex justify-between items-center text-left px-6 py-4 hover:bg-stone-700/30 transition-colors"
                onClick={handleToggle}
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
        </div>
    </div>
);

export const AboutPage: React.FC = () => {
    const { settings } = useSystemState();
    const { terminology } = settings;

    return (
        <div className="max-w-4xl mx-auto">
             <Card className="text-center">
                <h1 className="text-4xl font-medieval text-accent">{terminology.appName}</h1>
                <p className="text-stone-300 mt-2">Version 0.0.97</p>
                <p className="mt-4 text-stone-400">A gamified task manager for families and groups. Turn chores into quests, earn rewards, and level up!</p>
                <div className="mt-6 flex justify-center gap-4">
                    <a href="https://github.com/google/codewithme-task-donegeon" target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary">View on GitHub</Button>
                    </a>
                    <a href="https://github.com/google/codewithme-task-donegeon/issues" target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary">Report an Issue</Button>
                    </a>
                </div>
            </Card>

            <CollapsibleSection title="Version History">
               <VersionHistoryContent />
            </CollapsibleSection>
        </div>
    );
};
