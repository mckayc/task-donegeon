import React, { useMemo, useState } from 'react';
import Card from '../user-interface/Card';
import { useSystemState } from '../../context/SystemContext';
import { version } from '../../../package.json';
import Button from '../user-interface/Button';

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
                <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isOpen && (
                <div className="p-6 border-t" style={{ borderColor: 'hsl(var(--color-border))' }}>
                    {children}
                </div>
            )}
        </div>
    );
};

const V0_4_06_DATE = new Date(2025, 9, 14);
const V0_4_05_DATE = new Date(2025, 9, 13);
const V0_4_04_DATE = new Date(2025, 9, 12);
const V0_4_03_DATE = new Date(2025, 9, 11);
const V0_4_02_DATE = new Date(2025, 9, 10);
const V0_4_01_DATE = new Date(2025, 9, 9);
const V0_4_0_DATE = new Date(2025, 9, 8);
const V0_3_02_DATE = new Date(2025, 9, 7);
const V0_3_01_DATE = new Date(2025, 9, 6);
const V0_3_0_DATE = new Date(2025, 9, 5);
const V0_2_01_DATE = new Date(2025, 9, 4);
const V0_2_0_DATE = new Date(2025, 9, 3);
const V0_1_99_DATE = new Date(2025, 9, 2);
const V0_1_98_DATE = new Date(2025, 9, 1);
const V0_1_97_DATE = new Date(2025, 8, 30);
const V0_1_96_DATE = new Date(2025, 8, 29);
const V0_1_95_DATE = new Date(2025, 8, 28);
const V0_1_94_DATE = new Date(2025, 8, 27);
const V0_1_93_DATE = new Date(2025, 8, 26);
const V0_1_92_DATE = new Date(2025, 8, 25);
const V0_1_91_DATE = new Date(2025, 8, 24);
const V0_1_90_DATE = new Date(2025, 8, 23);
const V0_1_89_DATE = new Date(2025, 8, 22);
const V0_1_88_DATE = new Date(2025, 8, 21);
const V0_1_87_DATE = new Date(2025, 8, 20);
const V0_1_86_DATE = new Date(2025, 8, 19);
const V0_1_85_DATE = new Date(2025, 8, 18);
const V0_1_84_DATE = new Date(2025, 8, 17);
const V0_1_83_DATE = new Date(2025, 8, 16);
const V0_1_77_DATE = new Date(2025, 8, 15);
const V0_1_76_DATE = new Date(2025, 8, 14);
const V0_1_75_DATE = new Date(2025, 8, 13);
const V0_1_74_DATE = new Date(2025, 8, 12);
const V0_1_73_DATE = new Date(2025, 8, 11);
const V0_1_72_DATE = new Date(2025, 8, 10);
const V0_1_71_DATE = new Date(2025, 8, 9);
const V0_1_70_DATE = new Date(2025, 8, 8);
const V0_1_69_DATE = new Date(2025, 8, 7);
const V0_1_68_DATE = new Date(2025, 8, 6);
const V0_1_67_DATE = new Date(2025, 8, 5);
const V0_1_66_DATE = new Date(2025, 8, 4);
const V0_1_65_DATE = new Date(2025, 8, 3);
const V0_1_64_DATE = new Date(2025, 8, 2);
const V0_1_63_DATE = new Date(2025, 8, 1);
const V0_1_62_DATE = new Date(2025, 7, 31);
const V0_1_61_DATE = new Date(2025, 7, 30);
const V0_1_60_DATE = new Date(2025, 7, 29);
const V0_1_52_DATE = new Date(2025, 7, 28);
const V0_1_50_DATE = new Date(2025, 7, 27);
const V0_1_49_DATE = new Date(2025, 7, 26);
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

const VersionHistoryContent: React.FC = () => (
    <div className="prose prose-invert max-w-none text-stone-300 space-y-4">
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.4.06 ({V0_4_06_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Revamped Kiosk Mode:</strong> Kiosk Mode has been completely re-engineered to be a persistent, device-specific setting.
                    <ul className="list-disc list-inside pl-6">
                        <li><strong>Admin Activation:</strong> An admin can now log into any device, open their profile dropdown, and use a "Kiosk Mode" toggle to turn that specific device into a permanent kiosk.</li>
                        <li><strong>Persistent State:</strong> Once enabled, a device will always boot directly to the shared user selection screen, surviving reloads and new sessions.</li>
                        <li><strong>Clearer Logout:</strong> On kiosk devices, a dedicated "Kiosk" button appears in the header, providing an intuitive way for users to log out and return the device to the shared screen.</li>
                        <li><strong>Cleanup:</strong> All old URL-based (`/kiosk`) logic has been removed for a cleaner, more robust implementation.</li>
                    </ul>
                </li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.4.05 ({V0_4_05_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Flexible Manual Adjustments:</strong> The "Manual Adjustment" dialog for users has been completely overhauled. Instead of a restrictive dropdown, administrators can now grant rewards, apply setbacks, and award a trophy all in a single, streamlined action, making it much easier to handle special occasions like birthdays.</li>
                <li><strong>New Birthday Trophies:</strong> Added 16 new manually-awarded trophies to celebrate user birthdays for every age from 5 to 20.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.4.04 ({V0_4_04_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>New Full-Screen AI Teacher UI:</strong> Replaced the small AI Teacher side panel with a full-screen, two-column "Activity Panel." This provides a more immersive and standardized experience that can accommodate future media types like videos or documents. The left column contains the AI avatar and chat history, while the right serves as a dedicated user interaction workspace.</li>
                <li><strong>Smarter AI Teaching Loop:</strong> Overhauled the AI's system instructions to follow a "Teach, Check, Feedback" loop. The AI is now required to ask a multiple-choice question after teaching a concept, which makes the learning process more effective and guarantees that the interactive choice buttons appear frequently and reliably.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.4.03 ({V0_4_03_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Robust AI Teacher Choices:</strong> Re-architected the AI Teacher's multiple-choice feature to use Gemini's "Tool Calling" functionality. This replaces the old, fragile string-parsing method with a reliable, structured data approach, ensuring interactive buttons now appear consistently.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.4.02 ({V0_4_02_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>AI Teacher Button Fix:</strong> Resolved an issue where the multiple-choice buttons in the AI Teacher chat were not responding to clicks. Users can now interact with the choices as intended.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.4.01 ({V0_4_01_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Simplified Kiosk Mode Entry:</strong> Removed the dedicated "Enter Kiosk Mode" button from the login page. A new "Enter Kiosk Mode" toggle is now available directly on the main App Lock screen for administrators.</li>
                <li><strong>Default Item Approval:</strong> All newly created goods/items now require administrator approval by default to ensure better control over the game economy.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.4.0 ({V0_4_0_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Enhanced AI Teacher with Quizzes & Timers:</strong> The AI Teacher feature has been transformed into a full learning module.
                    <ul className="list-disc list-inside pl-6">
                        <li><strong>Proactive Start & In-Chat Quizzes:</strong> The AI is now more interactive, proactively starting conversations and asking questions mid-lesson to check for understanding.</li>
                        <li><strong>Optional Learning Timer:</strong> Admins can now set a minimum learning time for "AI Teacher" quests. A timer appears in the chat, and users must complete it before they can take the final quiz.</li>
                        <li><strong>Final Quiz for Completion:</strong> A new "I'm ready for the quiz" button appears (enabled after any required time is met), which prompts the AI to generate a 3-question quiz based on the conversation. Users must pass this quiz (2/3 correct) before the main "Complete Quest" button becomes enabled, ensuring a structured and effective learning experience.</li>
                    </ul>
                </li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.3.02 ({V0_3_02_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>AI Teacher Chat UI:</strong> Implemented the full chat interface for the AI Teacher feature. The panel now supports a real-time, back-and-forth conversation with the Gemini-powered AI, complete with a message history, typing indicators, and user avatars, all connected to the new stateful backend API.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.3.01 ({V0_3_01_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>AI Teacher UI Scaffolding:</strong> Implemented the frontend scaffolding for the AI Teacher feature. Admins can now designate a quest with an "AI Teacher" media type. This makes a new "AI Teacher" button appear in the quest details, which opens a placeholder panel for the future chat interface.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.3.0 ({V0_3_0_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>AI Teacher Foundation:</strong> Implemented the backend foundation for the new "AI Teacher" feature. This includes new, stateful API endpoints to manage interactive chat sessions with the Gemini API, laying the groundwork for personalized, quest-based learning conversations.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.2.01 ({V0_2_01_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Simplified Kiosk Button:</strong> Moved the Kiosk button to the main header, next to the fullscreen icon, and simplified the label to "Kiosk" for easier access on `/kiosk` URLs.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.2.0 ({V0_2_0_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Return to Kiosk Mode:</strong> Added a "Return to Kiosk" button to the user profile dropdown when using the app via the `/kiosk` URL. This provides a clear and intuitive way for users to end their session and return to the shared user selection screen.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.1.99 ({V0_1_99_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Critical Kiosk Security Fix:</strong> Patched a major security flaw where the Kiosk Mode page (`/kiosk`) could be accessed without authentication in a new session (e.g., an incognito window).</li>
                <li><strong>Kiosk Login Flow Fixed:</strong> Resolved a critical bug where logging in from the Kiosk Mode screen would incorrectly redirect users to the main login page instead of their dashboard.</li>
                <li><strong>Robust Kiosk State Management:</strong> The logout process is now path-aware, correctly returning users to the Kiosk screen when appropriate.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.1.98 ({V0_1_98_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>New URL-Based Kiosk Mode:</strong> Kiosk Mode is now accessed via a dedicated URL (`/kiosk`), improving reliability.</li>
                <li><strong>Simplified Admin UI:</strong> Removed Kiosk toggles from the admin profile dropdown for a cleaner interface.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.1.97 ({V0_1_97_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Kiosk Mode State Management Fix:</strong> Resolved an issue where logging into a Kiosk-enabled device would incorrectly disable its Kiosk setting.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.1.96 ({V0_1_96_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Kiosk Mode Logic Fix:</strong> Corrected a logical flaw to ensure the correct "Disable Kiosk Mode" toggle appears for admins on Kiosk-enabled devices.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.1.95 ({V0_1_95_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Revamped Kiosk Mode Activation:</strong> Administrators now enable Kiosk Mode for a specific device directly from their profile dropdown menu.</li>
                <li><strong>Full-Width Kiosk Header Scrolling:</strong> The entire header in Kiosk Mode is now horizontally scrollable on mobile devices.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.1.94 ({V0_1_94_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Per-Device Kiosk Mode:</strong> Kiosk/Shared Mode is now a device-specific setting, enabled via a button on the login screen.</li>
                <li><strong>Mobile Header Fix:</strong> The Kiosk Mode header is now horizontally scrollable on mobile.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.1.93 ({V0_1_93_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Mobile-Friendly Approvals:</strong> The Approvals page is now fully responsive with a touch-friendly card view on mobile devices.</li>
                <li><strong>Interactive Approval Cards:</strong> Quest and Claim approval cards on mobile are now clickable, opening a full detail dialog.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.1.92 ({V0_1_92_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Kiosk Mode Pending Notifications:</strong> The shared Kiosk Mode header now displays a notification badge on a user's avatar if they have items awaiting approval.</li>
                <li><strong>Backend Optimizations:</strong> Added a new, efficient backend endpoint to fetch pending item counts for multiple users at once.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.1.91 ({V0_1_91_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Maintenance Release:</strong> Incremented version and updated the service worker to ensure all users receive the latest updates.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.1.90 ({V0_1_90_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>"My Pending Items" Dashboard Widget:</strong> Added a new card to the dashboard showing items awaiting approval.</li>
                <li><strong>Pending Items Header Notification:</strong> A new bell icon in the header now displays a badge with a count of pending items.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.1.49 ({V0_1_49_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Mobile Responsiveness:</strong> Implemented a fully responsive design for mobile devices.</li>
                <li><strong>Data Integrity & Reset Fixes:</strong> Resolved critical issues where core game elements would disappear after a full data reset.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.99y ({V0_0_99Y_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>New "Journey" Quest Type:</strong> The simple "Unlocks Next Quest" feature has been completely replaced by a new, powerful <strong>Journey</strong> quest type. Journeys are multi-stage adventures composed of multiple <strong>checkpoints</strong>.</li>
                <li><strong>Dedicated Checkpoint Editor:</strong> Admins can now create epic, multi-step quests using a new, intuitive dialog to add and manage checkpoints, each with its own description and unique rewards.</li>
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

const HelpPage: React.FC = () => {
    const { settings } = useSystemState();
    
    return (
        <div className="max-w-4xl mx-auto pb-12">
            <Card className="text-center">
                <h1 className="text-5xl font-medieval text-accent mb-2">{settings.terminology.appName}</h1>
                <p className="text-stone-300 text-lg">A gamified task and chore tracker for families and groups.</p>
                <p className="mt-4 text-stone-400">Version: {version}</p>
                 <div className="mt-6">
                    <a href="https://github.com/google/codewithme-task-donegeon" target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary">
                            View Project on GitHub
                        </Button>
                    </a>
                </div>
            </Card>

            <CollapsibleSection title="Functional Specifications" defaultOpen>
                <div className="prose prose-invert max-w-none text-stone-300 space-y-6">
                    <h3>AI Teacher</h3>
                    <p><strong>Purpose:</strong> An interactive, AI-powered tutor that provides lessons on the topic of a specific {settings.terminology.task}.</p>
                    <p><strong>How it Works:</strong></p>
                    <ol className="list-decimal list-inside space-y-2">
                        <li><strong>Activation:</strong> An {settings.terminology.admin} can set the "Interactive Media" type of a {settings.terminology.task} to "AI Teacher". This adds an "AI Teacher" button to the {settings.terminology.task} detail dialog for players.</li>
                        <li><strong>Baseline Assessment:</strong> When a session begins, the AI generates a short, ~5 question multiple-choice quiz based on the {settings.terminology.task}'s topic. This quiz is designed to assess the user's existing knowledge before the lesson starts. All questions include an **"I don't know"** option to allow for more accurate feedback instead of guessing.</li>
                        <li><strong>Instant Feedback:</strong> The user answers the questions one by one and receives immediate feedback on whether their choice was correct.</li>
                        <li><strong>Personalized Learning Path:</strong> Once the quiz is complete, the user clicks "Begin Lesson," which sends their quiz results to the AI. The AI analyzes these results to identify the specific topic the user struggled with the most.</li>
                        <li><strong>Focused Instruction:</strong> The AI Teacher's first message will explicitly state which topic it's going to focus on. It then begins a tailored lesson using an interactive "Teach, Check, Feedback" loop, presenting small chunks of information followed by simple multiple-choice questions (which appear as buttons) to ensure understanding. All in-lesson questions also include an "I don't know" option.</li>
                        <li><strong>Final Quiz &amp; Completion:</strong> After the lesson (and any optional timer set by the {settings.terminology.admin}), the user can request a final 3-question quiz. They must pass this quiz to enable the main "Complete {settings.terminology.task}" button.</li>
                    </ol>
                    <h3>Manual Adjustments</h3>
                    <p><strong>Purpose:</strong> To give an {settings.terminology.admin} a flexible way to manually grant {settings.terminology.points} or award {settings.terminology.awards} for actions that happen outside the formal {settings.terminology.task} system.</p>
                    <p><strong>How it Works:</strong></p>
                    <ul className="list-disc list-inside space-y-2 mt-2">
                        <li>From the `{settings.terminology.link_manage_users}` page, an {settings.terminology.admin} can click the "Adjust" button for any {settings.terminology.user}.</li>
                        <li>This opens a unified dialog where the {settings.terminology.admin} can perform multiple actions at once.</li>
                        <li>**Grant Rewards:** Add any amount of any {settings.terminology.currency} or {settings.terminology.xp} type.</li>
                        <li>**Apply Setbacks:** Deduct any amount of any {settings.terminology.currency} or {settings.terminology.xp} type.</li>
                        <li>**Award Trophy:** Select and award any manually-awarded {settings.terminology.award}.</li>
                        <li>All actions are logged in the `{settings.terminology.history}` as a single, consolidated "Manual Adjustment" event for clarity.</li>
                    </ul>
                    <h4>New Birthday Trophies</h4>
                    <p>A set of 16 new, manually-awarded trophies have been added to celebrate user birthdays for ages 5 through 20. These can be awarded using the Manual Adjustment dialog.</p>
                    <h3>Shared / Kiosk Mode (Device-Specific)</h3>
                    <p><strong>Purpose:</strong> To create a persistent, shared access point for the application on a specific device, like a family tablet. This mode provides a fast user-switching interface and can automatically log users out after a period of inactivity.</p>
                    <p><strong>How it Works:</strong></p>
                    <ul className="list-disc list-inside space-y-2 mt-2">
                        <li><strong>Global Prerequisite:</strong> An {settings.terminology.admin} must first enable the main **"Shared Mode"** feature in `{settings.terminology.link_settings} &gt; Shared / Kiosk Mode`. This makes the device-specific functionality available.</li>
                        <li>
                            <strong>Device Activation:</strong>
                            <ol className="list-decimal list-inside pl-6">
                                <li>An {settings.terminology.admin} logs into the application on the device they want to turn into a kiosk (e.g., the living room tablet).</li>
                                <li>They click their profile avatar in the header to open the dropdown menu.</li>
                                <li>A new toggle switch, **"Kiosk Mode (This Device)"**, will be visible.</li>
                                <li>The {settings.terminology.admin} flips this switch to **ON**. The page will reload.</li>
                            </ol>
                        </li>
                        <li><strong>Persistent Kiosk State:</strong> Once activated, that device is now a dedicated Kiosk. It will **always** start on the shared user selection screen, even if the browser is closed or the device is restarted. This setting is saved locally in the browser's storage.</li>
                        <li>
                            <strong>Using the Kiosk:</strong>
                            <ul className="list-disc list-inside pl-6">
                                <li>When a user logs in on the Kiosk device, a new **"Kiosk" button** appears in the header.</li>
                                <li>Clicking this "Kiosk" button is the primary way to log out. It immediately returns the device to the shared user selection screen for the next person.</li>
                                <li>The automatic inactivity timer (if configured in `{settings.terminology.link_settings}`) will also correctly log users out and return to this screen.</li>
                            </ul>
                        </li>
                        <li><strong>Deactivation:</strong> To turn Kiosk Mode off, an {settings.terminology.admin} must log in on that specific device, open their profile dropdown, and toggle the **"Kiosk Mode (This Device)"** switch to **OFF**.</li>
                    </ul>
                </div>
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

export default HelpPage;