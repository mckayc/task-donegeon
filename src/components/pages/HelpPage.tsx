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

const FeaturesContent: React.FC = () => {
    const { settings } = useSystemState();

    return (
        <div className="prose prose-invert max-w-none text-stone-300 space-y-6">
            <div>
                <h4 className="text-lg font-bold text-stone-100">For Players ({settings.terminology.users})</h4>
                <ul className="list-disc list-inside space-y-2 mt-2">
                    <li><strong>Gamified Experience:</strong> Complete {settings.terminology.tasks} to earn {settings.terminology.points} and {settings.terminology.xp}.</li>
                    <li><strong>Character Progression:</strong> Level up through a series of configurable {settings.terminology.levels}.</li>
                    <li><strong>Virtual Economy:</strong> Spend {settings.terminology.currency} in {settings.terminology.stores} to buy virtual goods.</li>
                    <li><strong>Avatar Customization:</strong> Personalize your character with purchased items.</li>
                    <li><strong>Trophy Room:</strong> Earn {settings.terminology.awards} for completing milestones.</li>
                    <li><strong>Multiple Scopes:</strong> Manage tasks in both a <strong>Personal</strong> space and within shared <strong>{settings.terminology.groups}</strong>.</li>
                    <li><strong>AI Teacher:</strong> Engage with an AI-powered tutor on educational {settings.terminology.tasks}.</li>
                </ul>
            </div>
             <div>
                <h4 className="text-lg font-bold text-stone-100">For Admins ({settings.terminology.admin}s)</h4>
                <ul className="list-disc list-inside space-y-2 mt-2">
                    <li><strong>Powerful Content Management:</strong> Create and manage every aspect of the game world, including {settings.terminology.tasks}, items, {settings.terminology.stores}, {settings.terminology.levels}, and {settings.terminology.awards}.</li>
                    <li><strong>AI Suggestion Engine:</strong> Use Google's Gemini AI to generate creative ideas for any game asset, from {settings.terminology.tasks} to items to {settings.terminology.awards}.</li>
                    <li><strong>Asset Library:</strong> Kickstart your world with pre-made content packs that can be imported with a single click.</li>
                    <li><strong>Blueprint System:</strong> Export your own custom content as a "Blueprint" file to share with others or back up your creations.</li>
                    <li><strong>Dynamic Rules Engine:</strong> Create powerful "Condition Sets" to control when {settings.terminology.tasks} and {settings.terminology.stores} become available based on player progress, time of day, or items owned.</li>
                    <li><strong>User Management:</strong> Easily manage members, assign roles, and make manual adjustments to player accounts.</li>
                    <li><strong>Shared / Kiosk Mode:</strong> Configure a device for shared family use with a quick-login screen and optional PIN protection.</li>
                    <li><strong>In-Depth Theming:</strong> Customize the application's entire look and feel, from fonts and colors to button shapes, using the Theme Editor.</li>
                    <li><strong>Robust Data Management:</strong> Create manual or automated backups of your entire application data (in JSON or SQLite format) and restore from them at any time.</li>
                </ul>
            </div>
        </div>
    );
};

const FunctionalSpecificationsContent: React.FC = () => (
    <div className="prose prose-invert max-w-none text-stone-300 space-y-6 p-6">
        <h3>Interactive Media</h3>
        <p>
            Certain quests can now include interactive elements to make them more engaging or educational.
        </p>
        <ul className="list-disc list-inside space-y-2 mt-2">
            <li>
                <strong>AI Teacher:</strong> This turns a quest into a full-screen, interactive lesson. The AI gauges the user's knowledge with a pre-quiz, creates a personalized lesson using relatable examples from the user's profile, and confirms understanding with a final quiz. Passing this quiz is required to complete the quest.
            </li>
            <li>
                <strong>AI Story Teller:</strong> This feature generates a unique, short story based on the quest's title and description, turning a simple chore into a narrative adventure.
            </li>
            <li>
                <strong>Video:</strong> Attach a video to a quest. You can use a URL from a service like YouTube or a video file uploaded to the Asset Manager. This is perfect for instructional videos or adding a multimedia element to a quest.
            </li>
            <li>
                <strong>EPUB Reader:</strong> Attach <code>.epub</code> files to quests. Users can open a full-featured reader to read books directly within the app. Progress (location, bookmarks, time read) is now saved to the database, syncing across devices. The reader now supports fullscreen mode, light/dark themes, and swipe gestures for turning pages.
            </li>
        </ul>
        <h3>The Arcade & Minigames</h3>
        <p>The "Arcade" is a special market where users can spend "Game Tokens" to play minigames.</p>
         <ul className="list-disc list-inside space-y-2">
            <li><strong>Dragon's Dice (Farkle):</strong> A classic dice game of risk and reward. Roll the dice and set aside scoring combinations. Bust, and you lose your points for the turn. Know when to stop and bank your score to reach the goal!
                <ul className="list-disc list-inside pl-6 mt-2">
                    <li><strong>Bug Fix & UI Improvement:</strong> Fixed a bug where the game would sometimes fail to recognize a "bust," causing it to get stuck. When you bust now, a large, impactful "BUSTED!" message will appear to make the outcome clear.</li>
                </ul>
            </li>
            <li><strong>Rune Breaker:</strong> A fantasy-themed version of the classic *Breakout*. Control a magical shield and bounce an orb to break rows of enchanted runes.</li>
            <li><strong>Dungeon Dash:</strong> A simple side-scrolling "endless runner." An adventurer runs automatically, and the player taps to make them jump over pits and slide under obstacles.</li>
            <li><strong>Forge Master:</strong> A rhythm and timing game. The player must click at the right moment to strike a piece of hot metal with a hammer to forge a powerful weapon.</li>
            <li><strong>Archer's Folly:</strong> An archery game where the player clicks and drags to aim their bow, hitting a series of moving targets.</li>
            <li><strong>Snake:</strong> The classic game of snake. The game now features a larger play area, a slower starting speed, and a "3, 2, 1, GO!" countdown. You can also press any arrow key on the "Game Over" screen to instantly start a new game.</li>
        </ul>
        <h4>Arcade Leaderboard</h4>
        <p>The Arcade now features an "All-Time Arcade Legends" leaderboard. It shows the top 5 players based on their <strong>cumulative scores</strong> across <strong>all</strong> minigames. Additionally, each individual game card now proudly displays the name of the current high score holder for that game.</p>
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

const VersionHistoryContent: React.FC = () => (
    <div className="prose prose-invert max-w-none text-stone-300 space-y-4">
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of November 10, 2025 (v0.4.45)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>EPUB Reader Overhaul:</strong> The eBook reader has been significantly upgraded with fullscreen mode, swipe controls, light/dark themes, improved bookmark display (with progress percentage), and database-backed progress syncing for a seamless experience across devices. Session and total time read are now also tracked and displayed.</li>
                <li><strong>Media Library Enhancements:</strong> Added the ability to create folders, fixed upload paths, and implemented drag-and-drop for files and folders in the media library.</li>
                <li><strong>Bug Fixes:</strong> Resolved an issue allowing users to complete daily duties multiple times and fixed a syntax error on the server.</li>
                <li><strong>Quality of Life:</strong> Added timestamps to the approvals page for better tracking.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">November 3, 2025 (v0.4.28)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>The Arcade Expansion:</strong> Five new minigames have been added: Dragon's Dice (Farkle), Rune Breaker, Dungeon Dash, Forge Master, and Archer's Folly.</li>
                <li><strong>Arcade Leaderboard:</strong> A new "All-Time Arcade Legends" leaderboard now appears in the Arcade, showing top players based on cumulative scores across all games.</li>
                <li><strong>High Score Display:</strong> Each minigame card now proudly displays the name of the current global high score holder.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of October 27, 2025 (v0.4.27)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Snake Minigame Overhaul:</strong> The Snake minigame in the Arcade has been significantly improved for better playability. The game window is now larger, the initial speed is slower, a "3, 2, 1, GO!" countdown has been added, and players can now restart the game by pressing any arrow key on the "Game Over" screen.</li>
                <li><strong>Global Condition Fix:</strong> Resolved a critical logic bug where a quest that was part of a quest group used in a *globally applied* condition set would lock itself, making it impossible to complete. The global condition check now correctly excludes the quest being evaluated from its own group's completion requirements.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of October 20, 2025 (v0.4.25)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Conditional Market Unlocks:</strong> Locked markets now show a dialog detailing the specific conditions a user must meet to gain access, mirroring the functionality of locked quests.</li>
                <li><strong>Global Conditions:</strong> Introduced "Global" condition sets that can lock content across the entire application, providing a new layer of administrative control.</li>
                <li><strong>Circular Dependency Fix:</strong> Resolved a critical logic bug where a quest could be locked by a condition requiring the completion of its own quest group. The system now intelligently ignores the quest being checked when evaluating its group's completion status.</li>
                <li><strong>Refactored Logic:</strong> Refactored the internal condition checking logic to be more robust and consistent between quests and markets.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of October 13, 2025 (v0.4.05 - v0.4.24)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Introduced user-specific and global Condition Sets for granular content control.</li>
                <li>Revamped Kiosk Mode to be a persistent, device-specific setting.</li>
                <li>Overhauled Manual Adjustments for flexibility, adding new birthday trophies.</li>
                <li>Enhanced the AI Teacher with personalization and better question handling.</li>
                <li>Fixed critical bugs related to Quest Group saving and recurring build failures.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of October 6, 2025 (v0.3.01 - v0.4.04)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Developed and launched the full AI Teacher feature, moving from a backend foundation to a full-screen UI with an interactive "Teach, Check, Feedback" loop and robust tool-calling for quizzes.</li>
                <li>Fixed issues with AI Teacher button responsiveness and made minor improvements to Kiosk Mode and item approval defaults.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of September 29, 2025 (v0.1.96 - v0.3.0)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Kiosk Mode Overhaul:</strong> Re-architected Kiosk Mode to be a more stable URL-based system (`/kiosk`), patching critical security and login flow bugs.</li>
                <li><strong>AI Foundations:</strong> Implemented the backend foundation for the AI Teacher feature with stateful chat sessions.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of September 22, 2025 (v0.1.90 - v0.1.95)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Dashboard & Notifications:</strong> Introduced new dashboard widgets and header notifications for pending user items.</li>
                <li><strong>Responsive Approvals:</strong> Made the Approvals page fully responsive for mobile devices.</li>
                <li><strong>Enhanced Chronicles:</strong> The Chronicles system was updated with a full audit trail for multi-step actions and richer logging details.</li>
            </ul>
        </div>
    </div>
);

export const HelpPage: React.FC = () => {
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

            <CollapsibleSection title="Features" defaultOpen>
                <FeaturesContent />
            </CollapsibleSection>

            <CollapsibleSection title="Functional Specifications">
                <FunctionalSpecificationsContent />
            </CollapsibleSection>

            <CollapsibleSection title="Roadmap">
                <RoadmapContent />
            </CollapsibleSection>

            <CollapsibleSection title="Appendix: Version History">
                <VersionHistoryContent />
            </CollapsibleSection>
        </div>
    );
};

export default HelpPage;