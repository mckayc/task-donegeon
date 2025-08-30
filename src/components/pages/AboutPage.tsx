import React, { useState, ReactNode } from 'react';
import Card from '../user-interface/Card';
import { ChevronDownIcon } from '../user-interface/Icons';
import Button from '../user-interface/Button';
import { useSystemState } from '../../context/SystemContext';
import { version } from '../../../package.json';

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
                <li><strong>Kiosk Mode Pending Notifications:</strong> The Kiosk Mode header now displays a notification badge on a user's avatar if they have items awaiting approval.</li>
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

export const AboutPage: React.FC = () => {
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

            <CollapsibleSection title="Version History" defaultOpen>
                <VersionHistoryContent />
            </CollapsibleSection>

            <CollapsibleSection title="Roadmap">
                <RoadmapContent />
            </CollapsibleSection>

        </div>
    );
};
