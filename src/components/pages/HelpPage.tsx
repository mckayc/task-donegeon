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
                    <li><strong>Customizable Dashboard:</strong> Collapse cards you don't use often and drag-and-drop your most important widgets to the top. Your layout is saved automatically.</li>
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
                    <li><strong>Customizable Dashboard:</strong> Collapse cards you don't use often and drag-and-drop your most important widgets to the top. Your layout is saved automatically.</li>
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
        <h3>Exchange Rate Clarity</h3>
        <p>To improve user understanding and transparency in the Exchange Post, the direct conversion rate between the two selected reward types is now prominently displayed.</p>
        <ul className="list-disc list-inside space-y-2 mt-2">
            <li><strong>Live Calculation:</strong> As soon as a "Pay" and "Receive" currency are selected, the system calculates and shows the one-to-one exchange rate (e.g., "1 Gem 💎 = 20 Diligence 🧹").</li>
            <li><strong>Two-Way Display:</strong> The inverse rate is also shown in a smaller font for complete clarity (e.g., "1 Diligence 🧹 = 0.05 Gems 💎").</li>
            <li><strong>Real-Time Updates:</strong> This display updates instantly if the user changes their selected currencies.</li>
        </ul>
        <h3>Reward Exchange Control</h3>
        <p>Administrators now have granular control over which rewards can be traded in the Exchange Post.</p>
        <ul className="list-disc list-inside space-y-2 mt-2">
            <li><strong>"Include in Exchange" Toggle:</strong> A new toggle has been added to the "Edit Reward" dialog. This option is available for any reward type that has a "Base Value" greater than zero.</li>
            <li><strong>Default Behavior:</strong> By default, all existing and new valuable rewards are included in the exchange to maintain previous functionality.</li>
            <li><strong>Exchange UI:</strong> The Exchange Post will now only display currencies and points that are explicitly enabled for exchange, providing a cleaner and more controlled trading experience.</li>
        </ul>
        <h3>Blueprint & Backup/Restore Fixes</h3>
        <p>A set of critical bugs affecting data portability have been resolved:</p>
        <ul className="list-disc list-inside space-y-2 mt-2">
            <li><strong>Blueprint User Imports:</strong> Fixed an issue where users exported in a blueprint JSON file would not appear in the import preview dialog. The system now correctly identifies users by their username, ensuring successful imports.</li>
            <li><strong>JSON & SQLite Restore:</strong> Overhauled the Backup & Restore functionality. Restoring from a JSON backup now correctly repopulates the entire database. Restoring from an SQLite backup no longer incorrectly triggers the first-run wizard and now correctly re-initializes the database connection.</li>
        </ul>
        <h3>Real-Time UI Updates</h3>
        <p>A comprehensive fix has been implemented to address state synchronization issues across the application. Previously, actions such as creating, updating, or deleting assets (like Quests, Items, Markets, etc.) would not immediately reflect in the user interface, requiring a page refresh to see the changes. This has been resolved.</p>
        <ul className="list-disc list-inside space-y-2 mt-2">
            <li><strong>Instant Feedback:</strong> All create, update, and clone actions on management pages now immediately update the application's state with the data returned from the server. This ensures that the UI always shows the most current information without any delay.</li>
            <li><strong>Optimized Deletion:</strong> Deletion actions now use a more robust callback system. When items are deleted, they are instantly removed from the view on the management pages, providing a much smoother and more intuitive administrative experience.</li>
            <li><strong>Quest Group Management:</strong> Fixed a bug where creating, editing, or deleting a Quest Group would not update the UI until the page was refreshed.</li>
        </ul>
        <h3>Dashboard Customization</h3>
        <p>The dashboard customization experience has been enhanced for better usability:</p>
        <ul className="list-disc list-inside space-y-2 mt-2">
            <li><strong>Layout Editor:</strong> In the "Customize Dashboard" popup, the columns for "Main", "Side", and "Hidden" cards are now equal height for a cleaner visual layout.</li>
            <li><strong>Card Movement:</strong> In addition to drag-and-drop, each card in the editor now features arrow icons, allowing for quick movement between columns with a single click.</li>
            <li><strong>Single-Column Mode:</strong> A bug was fixed where cards from the "Side" column would become hidden when switching to the "single-column" layout. Now, all visible cards from both columns are correctly consolidated into one list, and can be moved to and from the "Hidden" section.</li>
            <li><strong>Duplicate Card Fix:</strong> Resolved a logic error where moving a card from its default column could cause it to appear in both the new and old columns simultaneously. The layout system now correctly handles new and moved cards to prevent duplication.</li>
        </ul>
        <h3>Dynamic Rules Engine</h3>
        <ul className="list-disc list-inside space-y-2 mt-2">
            <li><strong>Quest Group Exemptions:</strong> Added the ability to exempt entire Quest Groups from "Global" Condition Sets. This allows administrators to create categories of quests (e.g., "Essential Daily Chores") that will always be available, regardless of other global rules that might be in effect (like a "Weekend Only" rule).</li>
        </ul>
        <h3>Quest Logic & Availability</h3>
        <p>To ensure fairness and clarity, the system now enforces stricter availability rules for quests:</p>
        <ul className="list-disc list-inside space-y-2 mt-2">
            <li><strong>Scheduled Duties:</strong> Duties (recurring quests) that are not scheduled to be active on the current day will now be fully disabled. While they may still appear dimmed on the Quest Page for informational purposes, they cannot be selected or completed until their scheduled day. This prevents accidental completions on non-active days and clarifies user expectations.</li>
            <li><strong>Quest Completion Timing:</strong> Server-side validation has been strengthened to strictly enforce quest deadlines. The system now prevents users from submitting a quest completion after its defined "incomplete" time has passed. This resolves an issue where completions could be logged with a timestamp that was after the quest's cutoff, ensuring that all completion data is accurate and adheres to the established rules.</li>
        </ul>
        <h3>Rank & Leaderboard Calculations</h3>
        <p>
            To provide a more accurate measure of a user's overall progress, Ranks and the Leaderboard are now calculated based on the <strong>total lifetime Experience Points (XP) earned from completing quests</strong>. This is different from the <em>current XP balance</em>, which can change as rewards are spent. This change ensures that a user's rank reflects their total effort, not just their current wallet.
        </p>
        <p>
            The Rank Card on the Dashboard has been updated to display both your current balance and your total earned values for XP and currencies, offering a complete picture of your in-game economy.
        </p>
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
                <strong>EPUB Reader:</strong> Attach <code>.epub</code> files to quests and read them in a full-featured reader. The interface includes controls for theme (light/dark), font size, bookmarks, and an immersive mode for distraction-free reading. A progress slider allows for quick navigation, and page turns are animated. All progress, including location, bookmarks, and total time read *for this specific book* is saved and synced across your devices. The current session time is also displayed.
                <ul className="list-disc list-inside pl-6 mt-2">
                    <li><strong>Offline Caching:</strong> The reader now downloads and caches eBooks locally on the first open for significantly faster subsequent loads and full offline access. A progress bar displays the initial download status, ensuring a smooth user experience.</li>
                </ul>
            </li>
            <li>
                <strong>PDF Reader:</strong> Attach <code>.pdf</code> files to quests. The integrated reader allows users to view documents directly in the app. It includes controls for page navigation, zooming, and fullscreen mode. The reader automatically saves the user's last viewed page and total time read *for this specific document*, allowing you to pick up where you left off. The file is also downloaded for faster loading and offline access.
                <ul className="list-disc list-inside pl-6 mt-2">
                    <li><strong>Navigation Stability Fix:</strong> Resolved a state synchronization bug that caused the page number to revert to its previously saved state immediately after navigating to a new page. The reading experience is now smooth and stable.</li>
                </ul>
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
            <li><strong>Archer's Folly:</strong> An archery game where the player clicks and drags to aim their bow, hitting a series of moving targets. The game now includes a power meter and a trajectory line to help players aim. The difficulty also gradually increases, with targets getting smaller and faster as the score increases.</li>
            <li><strong>Snake:</strong> The classic game of snake. The game now features a larger play area, a slower starting speed, and a "3, 2, 1, GO!" countdown. You can also press any arrow key on the "Game Over" screen to instantly start a new game. On-screen controls are now always visible on tablet-sized devices to ensure playability.</li>
        </ul>
        <h4>Arcade Leaderboard</h4>
        <p>The Arcade now features an "All-Time Arcade Legends" leaderboard. It shows the top 5 players based on their <strong>cumulative scores</strong> across <strong>all</strong> minigames. Additionally, each individual game card now proudly displays the name of the current high score holder for that game.</p>
        <h3>Bug Tracker & Reporting</h3>
        <p>
            The built-in Bug Tracker includes features to help admins triage and process feedback efficiently.
        </p>
        <ul className="list-disc list-inside space-y-2 mt-2">
            <li>
                <strong>Comment Actions:</strong> In the Bug Detail popup, comments added to a report have quick actions to help with review. You can dim comments that have been processed, and mark comments with a green (good/implemented) or red (for review/invalid) background. These controls are always visible on each comment.
            </li>
            <li>
                <strong>Log Templates:</strong> Admins can create text templates that can be automatically appended to the clipboard when copying bug logs, standardizing communication with external tools or developers.
            </li>
            <li>
                <strong>Consolidated UI:</strong> The bug recording bar has been consolidated into a more compact and responsive layout to ensure all controls are accessible, even on smaller screens with long report titles.
            </li>
        </ul>
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
            <h4 className="text-lg font-bold text-stone-100">Week of December 13, 2025 (v0.4.82)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Quest Group Exemptions:</strong> Added the ability to exempt entire Quest Groups from "Global" Condition Sets, allowing admins to create categories of quests that will always be available regardless of other global rules.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of December 13, 2025 (v0.4.81)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>PDF Reader Fix:</strong> Fixed a bug where the PDF reader page would revert immediately after navigation due to a state synchronization issue. Reading progress is now stable.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of December 13, 2025 (v0.4.80)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>New Media Type - PDF:</strong> Added a full-featured PDF reader. Quests can now include PDF documents, which users can read directly in the app. The reader includes page navigation, zoom, fullscreen mode, automatic progress saving, and offline caching.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of December 6, 2025 (v0.4.79)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Data Import/Export Fixes:</strong> Fixed critical bugs preventing user imports from blueprints and causing failures in JSON/SQLite database restores. Data portability is now reliable.</li>
                <li><strong>Service Worker Update:</strong> Made a minor change to the service worker to ensure update prompts are triggered correctly.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of November 29, 2025 (v0.4.78)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>EPUB Reader Caching & Offline Support:</strong> The EPUB reader now downloads and caches book files locally. This provides instant loading times on subsequent opens and allows for full offline reading. A progress bar has been added to show the download status on the first open.</li>
                <li><strong>Service Worker Update:</strong> The service worker has been updated to enable this new caching strategy.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of November 22, 2025 (v0.4.77)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                 <li><strong>The Grand Arcade Expansion:</strong> Added six brand new minigames to the Arcade: Gemstone Mines, Labyrinth of the Minotaur, Alchemist's Trial, Goblin Ambush, River Crossing, and Wizard's Vortex.</li>
                 <li><strong>Major Tetris Improvements:</strong> Overhauled Tetris with modern features, including a Hold Queue, a Ghost Piece, and satisfying particle effects.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of October 25, 2025 (v0.4.73)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Bug Reporter Visibility Fix:</strong> Fixed a bug where the Bug Reporter tool was visible to all users. It is now correctly restricted to Donegeon Masters (admins) only.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of October 18, 2025 (v0.4.72)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Quest Group UI Fix:</strong> Fixed a bug where creating, editing, or deleting a Quest Group would not update the UI until the page was refreshed. All CUD operations for Quest Groups now provide immediate feedback.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of October 11, 2025 (v0.4.71)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Quest To-Do Crash Fix:</strong> Fixed a critical bug where toggling a quest's 'To-Do' status from the Dashboard or Calendar would cause the app to crash. The state management on affected pages has been refactored to prevent stale data and ensure stability.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of September 27, 2025 (v0.4.70)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Real-Time UI Updates:</strong> Implemented a major fix for real-time UI updates. All create, update, and delete actions on management pages now reflect instantly without needing a page refresh, greatly improving the administrative workflow and resolving a long-standing state synchronization bug.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of October 4, 2025 (v0.4.69)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Service Worker Update Fix:</strong> Resolved a critical issue where the application would fail to automatically update on some browsers due to aggressive caching of the service worker script. The app now explicitly checks for updates on every page load, ensuring users receive new versions promptly.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of September 20, 2025 (v0.4.67)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Arcade UX & Gameplay Improvements:</strong> Made several enhancements to the Arcade. The "Play" button on game cards is now a primary, full-width button for better visibility. The Snake game's on-screen controls are now always visible on tablets, improving playability on touch devices. Archer's Folly has been updated with a new aiming guide showing power and trajectory, and its difficulty now progressively increases as the player's score rises.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of September 13, 2025 (v0.4.66)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Dashboard Customization UX Improvements:</strong> Overhauled the "Customize Dashboard" dialog for better usability. The layout editor columns now have equal heights for a cleaner look. Cards can now be moved between main, side, and hidden columns using new arrow icons, providing an alternative to drag-and-drop. Fixed a bug where cards in the side column would disappear when switching to the "single-column" layout.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of September 6, 2025 (v0.4.65)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>EPUB Reader Fix:</strong> Fixed a bug in the EPUB reader where the progress bar would incorrectly display 100% and not update. The progress calculation is now more robust, ensuring the slider accurately reflects the user's position in the book.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of September 6, 2025 (v0.4.64)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Bug Bar Consolidation:</strong> The bug recording bar has been consolidated into a more compact and responsive two-row layout to prevent controls from overflowing on smaller screens.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of September 1, 2025 (v0.4.61)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Rank & Leaderboard Logic Overhaul:</strong> Ranks and the main Leaderboard are now calculated based on a user's *total lifetime XP earned from quests*, rather than their current XP balance. This provides a more accurate and fair representation of a user's overall progress that isn't affected by spending rewards. The Rank Card on the dashboard has been updated to display both current balances and total earned values for clarity.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of September 1, 2025 (v0.4.60)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Quest Scheduling Fix:</strong> Implemented a new rule preventing users from completing "Duty" quests on days they are not scheduled to be active. Users now receive a notification explaining why the quest is unavailable, improving clarity and preventing incorrect completions.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of November 24, 2025 (v0.4.52)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Customizable Dashboard:</strong> All cards on the Dashboard are now collapsible and can be reordered via drag-and-drop. Your preferred layout and collapsed states are saved automatically to your profile, allowing for a personalized view of your most important information.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of November 17, 2025 (v0.4.46)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>eBook Reader Redesign:</strong> The EPUB reader has been completely overhauled with a new UI. It now features permanent, opaque top and bottom bars for controls, an "immersive" mode to hide the UI for distraction-free reading, a scrubbable progress slider for quick navigation, a dedicated "add bookmark" button, and a subtle page-turn animation.</li>
            </ul>
        </div>
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