import React, { useMemo, useState } from 'react';
import Card from '../user-interface/Card';
import { useSystemState } from '../../context/SystemContext';
import { version } from '../../../package.json';
import Button from '../user-interface/Button';
import CollapsibleSection from '../user-interface/CollapsibleSection';

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
    <div className="prose prose-invert max-w-none text-stone-300 space-y-6">
        <h3>Suggestion Engine: The Foundry</h3>
        <p>
            The Suggestion Engine has been upgraded into a powerful "Foundry" that can generate multiple types of assets from a single prompt, dramatically speeding up content creation.
        </p>
        <ul className="list-disc list-inside space-y-2 mt-2">
            <li>
                <strong>Multi-Asset Generation:</strong> Administrators can now select multiple asset types (e.g., Ventures, Items, Trophies, Quest Groups) and specify a quantity for each.
            </li>
            <li>
                <strong>Unified Prompting:</strong> A single, general theme is all that's needed. The AI will intelligently apply the theme to create all requested assets in one go.
            </li>
            <li>
                <strong>Interactive Results View:</strong> After generation, the results are presented in a new, organized view, grouped by asset type. Each suggested asset is shown on a card with several actions.
            </li>
             <li>
                <strong>Full Control over Suggestions:</strong> Each card has three options:
                 <ul className="list-disc list-inside pl-6 mt-2">
                    <li><strong>Add to Game:</strong> Instantly saves the asset to your game world as-is.</li>
                    <li><strong>Edit & Add:</strong> Opens the standard creation/editing dialog for that asset type, pre-filled with the AI's suggestion. This allows for fine-tuning before the asset is saved.</li>
                    <li><strong>Discard:</strong> Removes the suggestion from the results list.</li>
                 </ul>
            </li>
        </ul>
        <h3>Approvals Queue & Chronicles</h3>
        <p>
            The Approvals Queue and Chronicles pages have been enhanced to provide more context and control for administrators.
        </p>
        <ul className="list-disc list-inside space-y-2 mt-2">
            <li>
                <strong>Sortable Tables:</strong> All tables in the Approvals Queue (Quests, Claims, Purchases, Trades) are now sortable. Click any column header to sort the data, making it easier to find specific items.
            </li>
            <li>
                <strong>Timestamps:</strong> All pending items now display the exact time they were submitted. This helps administrators prioritize and understand the context of each request.
            </li>
            <li>
                <strong>Undo Approvals:</strong> Donegeon Masters can now undo an accidental quest or item purchase approval directly from the Chronicles page. This will revert the item to "Rejected" status, remove any rewards that were granted (or refund the cost), and log the reversal for a clear audit trail.
            </li>
            <li>
                <strong>Incomplete/Late Quest Logging:</strong> The system now logs specific "Quest Incomplete" and "Quest Late" events in the Chronicles whenever a setback is automatically applied. This provides a clearer audit trail than the generic "Trial" event used previously.
            </li>
        </ul>
        <h3>Shared / Kiosk Mode</h3>
        <p>
            Kiosk mode is designed for shared devices, like a family tablet. It provides a simplified interface focused on user switching and at-a-glance information.
        </p>
        <ul className="list-disc list-inside space-y-2 mt-2">
            <li>
                <strong>Auto-Dimming:</strong> To save power and reduce screen burn-in on devices that are always on, Kiosk Mode now supports automatic screen dimming.
                <ul className="list-disc list-inside pl-6 mt-2">
                    <li>Admins can enable this feature and set a specific time window (e.g., 9 PM to 6 AM) during which it will be active.</li>
                    <li>After a configurable period of inactivity, the screen will dim. Touching the screen at any time will immediately restore full brightness.</li>
                    <li>The dimming level is controlled by a <strong>Dimness Level</strong> slider. A higher percentage results in a dimmer screen (a more opaque black overlay).</li>
                    <li>The brightness level can be previewed in the settings page for 5 seconds.</li>
                </ul>
            </li>
            <li>
                <strong>Live Data Refresh:</strong> To ensure information like quest deadlines ("Due in...") is always accurate on long-running kiosk screens, the quest list now automatically refreshes its data every minute without requiring a full page reload. This provides up-to-date information without interrupting the user experience.
            </li>
        </ul>
        <h3>Quest Timers</h3>
        <p>
            Certain quests can now be configured with timers, ideal for tasks where duration is a key component, such as reading, practicing an instrument, or screen time.
        </p>
         <ul className="list-disc list-inside space-y-2 mt-2">
            <li>
                <strong>Stopwatch Mode:</strong> When a user starts a stopwatch quest, the timer begins counting up. The user can stop it at any time to complete the quest, and the total elapsed time is recorded for approval.
            </li>
             <li>
                <strong>Countdown Mode:</strong> Admins can set a required duration (e.g., 20 minutes of reading). The user starts the timer, and it counts down. The quest can only be marked as complete once the timer has finished.
            </li>
             <li>
                <strong>Persistent Timer Widget:</strong> While a timed quest is active, a small, persistent timer widget appears in the main header. This allows users to navigate away to other parts of the app without losing track of their time. Clicking the widget instantly brings them back to the quest detail view.
            </li>
             <li>
                <strong>Smart Pausing:</strong> The timer automatically pauses if a user switches accounts in Kiosk Mode and resumes when they log back in, ensuring accurate time tracking in shared environments.
            </li>
             <li>
                <strong>Approval Context:</strong> The final time recorded by the timer is displayed on the Approvals page, giving Donegeon Masters clear context to verify the completion.
            </li>
        </ul>
        <h3>Application Shell & PWA</h3>
        <p>Details about the app's shell and progressive web app features.</p>
        <ul className="list-disc list-inside space-y-2 mt-2">
            <li><strong>Favicon Fix:</strong> Resolved an issue where the application's browser tab icon (favicon) was missing. The castle icon has been restored.</li>
            <li><strong>Sidebar Navigation:</strong> Fixed several issues with sidebar interactivity. The 'Chat' link now correctly opens the chat panel. In the collapsed view, section headers (e.g., 'Content Management') are now clickable. Clicking a header icon will open a persistent flyout menu with its sub-links, improving usability on both desktop and touch devices. The flyout closes when a link is clicked or when clicking outside of it.</li>
        </ul>
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
            <li><strong>Automated Backup Cleanup:</strong> Fixed a logic error where the system could fail to delete the oldest automated backups, causing more backups to be stored than the configured limit. The cleanup process now reliably prunes old files based on the timestamp in their filename.</li>
        </ul>
        <h3>Real-Time UI Updates</h3>
        <p>A comprehensive fix has been implemented to address state synchronization issues across the application. Previously, actions such as creating, updating, or deleting assets (like Quests, Items, Markets, etc.) would not immediately reflect in the user interface, requiring a page refresh to see the changes. This has been resolved.</p>
        <ul className="list-disc list-inside space-y-2 mt-2">
            <li><strong>Instant Feedback:</strong> All create, update, and clone actions on management pages now immediately update the application's state with the data returned from the server. This ensures that the UI always shows the most current information without any delay.</li>
            <li><strong>Optimized Deletion:</strong> Deletion actions now use a more robust callback system. When items are deleted, they are instantly removed from the view on the management pages, providing a much smoother and more intuitive administrative experience.</li>
            <li><strong>Quest Group Management:</strong> Fixed a bug where creating, editing, or deleting a Quest Group would not update the UI until the page was refreshed.</li>
        </ul>
        <h3>Dashboard Customization</h3>
        <p>The dashboard can be fully customized to suit your needs. Changes are saved automatically to your profile.</p>
        <ul className="list-disc list-inside space-y-2 mt-2">
            <li><strong>Reorder Cards:</strong> In the "Customize Dashboard" popup (accessible from your profile menu), you can drag and drop cards within a column to change their order.</li>
            <li><strong>Move Cards:</strong> Use the arrow icons on each card in the editor to move it between the Main and Side columns.</li>
            <li><strong>Hide Cards:</strong> Click the eyeball icon on any card in the editor to toggle its visibility. Hidden cards (which will appear dimmed in the editor) will not be displayed on your dashboard but can be re-enabled at any time.</li>
            <li><strong>Change Layout:</strong> Choose between a two-column layout (with a wider main column on the left or right) or a single-column layout, which is ideal for narrower screens.</li>
            <li><strong>Layout Stability:</strong> Resolved a logic error where certain cards like "My Pending Items" would either be duplicated across columns or disappear entirely after customization or an app update. The new layout system correctly handles all card states to prevent these issues.</li>
        </ul>
        <h3>Dynamic Rules Engine</h3>
        <ul className="list-disc list-inside space-y-2 mt-2">
            <li><strong>Quest Group Exemptions:</strong> Added the ability to exempt entire Quest Groups from "Global" Condition Sets. This allows administrators to create categories of quests (e.g., "Essential Daily Chores") that will always be available, regardless of other global rules that might be in effect (like a "Weekend Only" rule).</li>
        </ul>
        <h3>Quest Logic & Availability</h3>
        <p>To ensure fairness and clarity, the system now enforces stricter availability rules for quests:</p>
        <ul className="list-disc list-inside space-y-2 mt-2">
            <li><strong>Calendar Completion Logic:</strong> The "Complete" button within the Quest Detail dialog (when opened from the Calendar) will now be disabled if the quest is not available for completion on the selected date. This prevents completing a quest scheduled for a future date, or completing a "Duty" on a day it's not scheduled to run. The button text will now change to "Cannot Complete" to provide clear user feedback.</li>
            <li><strong>Scheduled Duties:</strong> Duties (recurring quests) that are not scheduled to be active on the current day will now be fully disabled. While they may still appear dimmed on the Quest Page for informational purposes, they cannot be selected or completed until their scheduled day. This prevents accidental completions on non-active days and clarifies user expectations.</li>
            <li><strong>Quest Completion Timing:</strong> Server-side validation has been strengthened to strictly enforce quest deadlines. The system now prevents users from submitting a quest completion after its defined "incomplete" time has passed. This resolves an issue where completions could be logged with a timestamp that was after the quest's cutoff, ensuring that all completion data is accurate and adheres to the established rules.</li>
            <li>
                <strong>Quest Locking Logic:</strong> Fixed a critical bug that caused circular dependencies in quest requirements. A quest can no longer be locked by a condition that requires the quest itself to be completed. Additionally, quests that are unavailable (e.g., expired or not scheduled for today) are now correctly ignored when checking lock conditions. The "Quest Locked" dialog now clearly indicates which requirements are self-exempt or unavailable, so users know exactly what they need to do.
            </li>
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
                <strong>AI Teacher:</strong> This feature provides an interactive, one-on-one lesson. Upon starting, the tutor introduces themselves with a welcome message while preparing an initial pre-quiz. The AI then assesses baseline knowledge with this quiz. During the lesson, the conversation happens on the left, while any multiple-choice questions from the tutor appear on the right as large, readable buttons, keeping the main chat clean. A final quiz confirms understanding. The font size throughout the interface has been increased for better readability.
            </li>
            <li>
                <strong>AI Story Teller:</strong> This feature generates a unique, short story based on the quest's title and description, turning a simple chore into a narrative adventure.
            </li>
            <li>
                <strong>Video:</strong> Attach a video to a quest. You can use a URL from a service like YouTube or a video file uploaded to the Asset Manager. This is perfect for instructional videos or adding a multimedia element to a quest.
            </li>
            <li>
                <strong>PDF Reader:</strong> Attach <code>.pdf</code> files to quests. The integrated reader allows users to view documents directly in the app. It includes controls for page navigation, zooming, and fullscreen mode. The reader automatically saves the user's last viewed page and total time read *for this specific document*, allowing you to pick up where you left off.
                <ul className="list-disc list-inside pl-6 mt-2">
                    <li><strong>PDF Persistence Fix:</strong> Resolved a critical bug where the `pdfUrl` for a quest was not being saved to the database. PDF attachments are now correctly persisted.</li>
                    <li><strong>Two-Page View:</strong> A new "book view" mode has been added to the reader, allowing users to view two pages side-by-side, mimicking a real book. This is ideal for documents designed as spreads. The reader intelligently handles the cover page.</li>
                    <li><strong>Navigation Stability Fix:</strong> Resolved a state synchronization bug that caused the page number to revert to its previously saved state immediately after navigating to a new page. The reading experience is now smooth and stable.</li>
                    <li><strong>Large File Support:</strong> The PDF reader has been optimized for performance. It now uses progressive loading, allowing very large documents to open almost instantly without requiring the entire file to be downloaded first. This significantly reduces memory usage and prevents browser crashes with big files.</li>
                    <li><strong>Total Time & UI Fixes:</strong> Corrected an issue where total read time was calculated incorrectly. The UI has been improved by simplifying page controls and ensuring the viewer properly fills the screen in fullscreen mode.</li>
                </ul>
            </li>
             <li>
                <strong>Image Slideshows:</strong> A new media type that allows admins to create a sequence of images with captions. This is ideal for visual guides, storytelling, or showcasing multiple pictures related to a task. Users can launch a full-screen viewer to navigate through the slides.
            </li>
            <li>
                <strong>Play Mini Game:</strong> A new media type that turns any game in the Arcade into a quest objective. Administrators can require users to play a game and achieve a certain score to complete the quest. This works with the existing timer system, allowing for quests that require both a minimum play time and a minimum score.
            </li>
        </ul>
        <h3>The Arcade & Minigames</h3>
        <p>The "Arcade" is a special market where users can spend "Game Tokens" to play minigames.</p>
         <ul className="list-disc list-inside space-y-2">
            <li><strong>UI Overhaul:</strong> The action buttons on game cards have been redesigned for clarity. The "Play" button is now a prominent, primary action and clearly displays the cost to play. Placeholder or under-construction games are now disabled to prevent users from spending tokens on them.</li>
            <li><strong>Game Rules:</strong> A new "Rules" button has been added to every game card in the Arcade. Clicking it will open a dialog explaining the objective and how to play.</li>
            <li>
                <strong>Math Muncher:</strong> This educational game has received several stability fixes and enhancements.
                <ul className="list-disc list-inside pl-6 mt-2">
                    <li><strong>Stability Fix:</strong> Resolved a critical bug causing the game to freeze when a player selected a grade. The issue was traced to an infinite loop in the question-generation logic, which has been rewritten for stability and performance.</li>
                    <li><strong>UI & AI Enhancements:</strong> The game header has been cleaned up to prevent text wrapping issues. Enemy AI has been improved to be more challenging and less predictable.</li>
                    <li><strong>Real-time Rewards:</strong> Rewards earned in the game are now instantly reflected in your total balance in the main application header.</li>
                    <li><strong>Reward Chronicles:</strong> Each time a reward is collected in the game, a "Prize Won" event is automatically recorded in the player's Chronicles, providing a clear history of in-game earnings.</li>
                </ul>
            </li>
            <li><strong>Dragon's Dice (Farkle):</strong> A classic dice game of risk and reward. Roll the dice and set aside scoring combinations. Bust, and you lose your points for the turn. Know when to stop and bank your score to reach the goal!
                <ul className="list-disc list-inside pl-6 mt-2">
                    <li><strong>Bug Fix & UI Improvement:</strong> Fixed a bug where the game would sometimes fail to recognize a "bust," causing it to get stuck. When you bust now, a large, impactful "BUSTED!" message will appear to make the outcome clear.</li>
                </ul>
            </li>
            <li><strong>Rune Breaker:</strong> A fantasy-themed version of the classic *Breakout*. Control a magical shield and bounce an orb to break rows of enchanted runes.</li>
            <li><strong>Dungeon Dash:</strong> An endless runner with a new "slide" mechanic! Control a hero emoji ('🏃') who must jump over fire pits ('🔥') and slide under flying ghosts ('👻'). The runner emoji now correctly faces right.</li>
            <li><strong>Forge Master:</strong> A complete gameplay overhaul! Instead of a simple timing bar, strike a piece of metal on an anvil as it heats and cools. Time your strike when the metal is glowing bright yellow for a "Perfect" hit to maximize your score and weapon quality.</li>
            <li><strong>Archer's Folly:</strong> An archery game where the player clicks and drags to aim their bow, hitting a series of moving targets. The game now includes a power meter and a trajectory line to help players aim. The difficulty also gradually increases, with targets getting smaller and faster as the score increases.</li>
            <li><strong>Snake:</strong> The classic game of snake. It now features a larger play area, a slower starting speed, a "3, 2, 1, GO!" countdown, and instant restart from the game over screen. On-screen controls are now always visible on tablet-sized devices.</li>
            <li><strong>Labyrinth of the Minotaur:</strong> Navigate a procedurally generated maze, find the exit, and escape the fearsome Ogre ('👹') who relentlessly hunts your hero ('🦸').</li>
            <li><strong>Gemstone Mines:</strong> This match-3 game has been visually upgraded. Instead of plain colors, it now uses vibrant fruit emojis and features a satisfying particle burst effect when you make a match.</li>
            <li><strong>Alchemist's Trial:</strong> A brand new "Simon"-style memory game. Watch the sequence of magical ingredients and repeat it perfectly. The sequence gets longer with each successful round!</li>
            <li><strong>Goblin Ambush:</strong> A "whack-a-mole" style game where you must click on goblins as they appear, but avoid the friendly gnomes!</li>
            <li><strong>River Crossing:</strong> A "Frogger"-style game. Guide your hero across a busy road and a dangerous river to reach safety.</li>
            <li><strong>Wizard's Vortex:</strong> A top-down shooter where you defend a central point from waves of monsters.</li>
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
            <h4 className="text-lg font-bold text-stone-100">Week of October 3, 2025 (v0.5.64)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Chronicle Logging for Incomplete Quests:</strong> Implemented new "Quest Incomplete" and "Quest Late" event types in the Chronicles. These events are now logged automatically whenever a user fails to complete a quest by its deadline or submits it late, providing a clearer history of setbacks.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of October 3, 2025 (v0.5.63)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Grace Period Overhaul:</strong> Renamed "Vacation Mode" to "Grace Period." Admins can now enable a global Grace Period from Settings, set recurring weekly Grace Periods (e.g., weekends), and get AI-powered suggestions for upcoming holidays on the Manage Events page.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of October 3, 2025 (v0.5.62)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Setback Substitution:</strong> Added an option on quests with time-based setbacks to allow the system to automatically substitute other reward types of equal value if a user has an insufficient balance of the primary penalty type.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of October 3, 2025 (v0.5.61)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Approval Timestamps:</strong> Added a "Submitted At" timestamp to all pending quest completions in the Approvals Queue to provide administrators with better context for reviewing tasks.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of October 2, 2025 (v0.5.60)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Approval Queue Sorting:</strong> Implemented sorting on all tables in the Approvals Queue page, allowing admins to sort by user, quest, date, etc.</li>
                <li><strong>Chronicles Undo Feature:</strong> Added an "Undo" button for Donegeon Masters on approved quest completions in the Chronicles, allowing for the reversal of accidental approvals.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of July 18, 2026 (v0.5.55)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Math Muncher Freeze Fix:</strong> Fixed a critical bug that caused the "Math Muncher" game to freeze indefinitely when a player selected a grade level. The problem was traced to an infinite loop in the logic that generates incorrect answers for certain challenges. The generation algorithm has been rewritten to be more robust, ensuring the game starts correctly and is fully playable.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of July 11, 2026 (v0.5.54)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Math Muncher Fixes:</strong> Addressed a critical crash that occurred when losing a life in the Math Muncher minigame. Also resolved an issue where the grade selection buttons were unclickable.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of July 4, 2026 (v0.5.53)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Math Muncher Fixes:</strong> Addressed a critical crash that occurred when losing a life in the Math Muncher minigame. The game grid has been standardized to a 6x6 layout for all challenges to improve consistency and readability.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of June 27, 2026 (v0.5.52)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Math Muncher Curriculum Expansion:</strong> This major update massively expands the "Math Muncher" minigame with a full curriculum for grades 1-6, featuring dozens of unique, auto-generated challenges based on common core standards. Gameplay has been polished based on user feedback: the power-up spawn rate has been reduced for better balance, and power-ups can now be collected with the "Munch" action. A critical stability issue causing random crashes when the player is hit has been fixed. The game now displays the player's current balance for any earnable rewards and shows a clear animation when more are gained after clearing a level. Finally, enemy AI has been improved for more varied and challenging movement patterns.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of March 7, 2026 (v0.5.33)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Arcade Overhaul:</strong> A major update to the Arcade with new games and gameplay improvements.
                    <ul className="list-disc list-inside pl-6 mt-2">
                        <li><strong>New Games Implemented:</strong> Three new games are now fully playable: **Alchemist's Trial** (a Simon-style memory game), **Goblin Ambush** (a whack-a-mole game), and **River Crossing** (a Frogger-style game).</li>
                        <li><strong>Forge Master Rework:</strong> Completely redesigned the Forge Master game. It now features a more interactive heat-based mechanic where players must time their strikes to the metal's temperature for optimal scores.</li>
                        <li>**Dungeon Dash Fixes:** The runner emoji now correctly faces the direction of movement, and flying ghost obstacles have been repositioned to make the slide mechanic functional.</li>
                    </ul>
                </li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of February 28, 2026 (v0.5.32)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Minigame Mania:</strong> A massive update to the Arcade based on user feedback!
                    <ul className="list-disc list-inside pl-6 mt-2">
                        <li><strong>New Game - Alchemist's Trial:</strong> A "Simon"-style memory game where you must repeat increasingly long sequences of magical ingredients.</li>
                        <li><strong>Labyrinth Overhaul:</strong> The player and minotaur are now represented by emojis ('🦸' and '👹') for a more thematic experience.</li>
                        <li><strong>Dungeon Dash Overhaul:</strong> The player is now a running emoji ('🏃'). Added a new "slide" mechanic (down arrow) to dodge flying ghost obstacles ('👻') in addition to jumping over fire pits ('🔥').</li>
                        <li><strong>Forge Master Overhaul:</strong> This game has been completely rebuilt. Instead of a simple timing bar, you now strike a piece of metal on an anvil that heats and cools, with sparks flying. Time your strike to the "perfect" heat to maximize your weapon's quality and score.</li>
                    </ul>
                </li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of February 21, 2026 (v0.5.31)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Minigame Bonanza:</strong> A major update to the Arcade!
                    <ul className="list-disc list-inside pl-6 mt-2">
                        <li><strong>New Game - Labyrinth of the Minotaur:</strong> A brand new maze game where you must find the exit while being hunted by a minotaur. The maze is different every time!</li>
                        <li><strong>Arcade UI Overhaul:</strong> Game cards now have a primary "Play" button that clearly shows the cost in Game Tokens. Under-construction games are now disabled to prevent accidental spending.</li>
                        <li><strong>Gemstone Mines Visual Upgrade:</strong> The classic match-3 game now uses vibrant fruit emojis instead of plain colors and features a satisfying particle burst effect for matches.</li>
                    </ul>
                </li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of February 14, 2026 (v0.5.10)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Kiosk Dimness Logic Refactor:</strong> Refactored the Kiosk Mode dimming feature to use a more intuitive "Dimness Level" control. The percentage now directly corresponds to the screen overlay's opacity, fixing a bug where different levels looked the same and providing more predictable control for administrators.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of February 7, 2026 (v0.5.9)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Kiosk Mode Dimness Fix:</strong> Reworked the Kiosk Mode dimming control to be more intuitive. It now uses a "Screen Brightness" slider where lower values correctly result in a dimmer screen (higher opacity), addressing user confusion about the dimness level's effect.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of January 31, 2026 (v0.5.8)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Kiosk Mode Enhancements:</strong> Overhauled the auto-dimming feature for shared devices. It is now exclusively active in Kiosk Mode, uses the globally-managed screen dimming overlay for reliability, and respects the dimness level set in the admin settings.</li>
                <li><strong>Dimness Preview:</strong> Added a "Preview" button in the Kiosk Mode settings, allowing administrators to test the configured dimness level for 5 seconds.</li>
                <li><strong>UI Cleanup:</strong> Removed the redundant manual "Dim Screen" toggle from the user profile dropdown.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of January 24, 2026 (v0.5.7)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>New Statistics Page:</strong> Added a dedicated "Statistics" page under System Tools for administrators.</li>
                <li><strong>Quest & Item Analytics:</strong> The new page includes widgets that display the top 10 most-completed quests and the top 10 most-purchased items, providing valuable insight into user engagement and the in-game economy.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of January 17, 2026 (v0.5.6)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Kiosk Mode Enhancements:</strong> Added new administrative controls for shared devices.</li>
                <li><strong>Battery Display:</strong> Admins can now enable a battery level indicator in the Kiosk Mode header, perfect for managing shared tablets.</li>
                <li><strong>Auto-Dimming:</strong> A new feature allows admins to configure automatic screen dimming during specific hours (e.g., at night). The screen will dim after a set period of inactivity and instantly brighten on touch, saving power and reducing screen burn-in.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of January 10, 2025 (v0.5.5)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Quest Timers:</strong> Implemented a new feature allowing administrators to add timers to quests. This includes a "Stopwatch" mode for tracking time spent and a "Countdown" mode for tasks requiring a minimum duration (e.g., reading for 20 minutes).</li>
                <li><strong>Persistent Timer Widget:</strong> When a timed quest is started, a persistent widget appears in the header, allowing users to navigate the app while keeping track of their active quest. Clicking the widget returns the user to the quest details.</li>
                <li><strong>Timer in Approvals:</strong> The time recorded for a completed timed quest is now displayed on the Approvals page for administrators to review.</li>
            </ul>
        </div>
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
            <h4 className="text-lg font-bold text-stone-100">Week of November 15, 2025 (v0.4.76)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>New Game: Tetris!</strong> Added a complete, from-scratch implementation of the classic puzzle game Tetris to the Arcade, featuring scoring, levels, a next-piece preview, and on-screen controls.</li>
                <li><strong>Tablet Mode:</strong> The new Tetris game includes a "Tablet Mode" toggle, which provides an optimized two-handed control layout for larger devices.</li>
                <li><strong>Game Rules:</strong> A new "Game Rules" dialog has been created to show players how to play any game in the Arcade.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of November 8, 2025 (v0.4.75)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Arcade Gameplay Overhaul:</strong> Implemented a massive update to the Arcade based on user feedback. This includes:
                    <ul className="list-disc list-inside pl-6 mt-2">
                        <li><strong>UI Improvements:</strong> Game cards now have explicit "Play", "Rules", and "Stats" buttons for clearer actions.</li>
                        <li><strong>Rune Breaker:</strong> Added falling power-ups (e.g., paddle widener) to make gameplay more dynamic.</li>
                        <li><strong>Dungeon Dash:</strong> Fixed a critical bug where players were not correctly defeated upon hitting a spike.</li>
                        <li><strong>Forge Master:</strong> Implemented a combo system to reward consecutive "Perfect" hits with bonus points and a progressive speed increase.</li>
                        <li><strong>Archer's Folly:</strong> Added a trajectory line and power meter to make aiming more intuitive.</li>
                        <li><strong>Snake:</strong> Fixed a bug that allowed players to reverse direction and end the game. Added a "Tablet Mode" toggle for a two-handed D-pad layout for larger devices.</li>
                        <li><strong>Dragon's Dice:</strong> Added a clear "BUSTED!" message when a player fails to score on a roll.</li>
                        <li><strong>Admin Tools:</strong> Admins can now edit minigame properties like cost, plays per token, and prize thresholds from the management page.</li>
                    </ul>
                </li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of October 25, 2025 (v0.4.74)</h4>
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
            <h4 className="text-lg font-bold text-stone-100">Week of September 29, 2025 (v0.1.96 - v0.3.0):</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Kiosk Mode Overhaul:</strong> Re-architected Kiosk Mode to be a more stable URL-based system (`/kiosk`), patching critical security and login flow bugs.</li>
                <li><strong>AI Foundations:</strong> Implemented the backend foundation for the AI Teacher feature with stateful chat sessions.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of September 22, 2025 (v0.1.90 - v0.1.95):</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Dashboard & Notifications:</strong> Introduced new dashboard widgets and header notifications for pending user items.</li>
                <li><strong>Responsive Approvals:</strong> Made the Approvals page fully responsive for mobile devices.</li>
                <li><strong>Enhanced Chronicles:</strong> The Chronicles system was updated with a full audit trail for multi-step actions and richer logging details.</li>
            </ul>
        </div>
    </div>
);

// FIX: Removed duplicated components.

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

            <CollapsibleSection title="Features" defaultOpen className="bg-stone-800/50 border border-stone-700/60 rounded-xl shadow-lg mt-8">
                <FeaturesContent />
            </CollapsibleSection>

            <CollapsibleSection title="Functional Specifications" className="bg-stone-800/50 border border-stone-700/60 rounded-xl shadow-lg mt-8">
                <FunctionalSpecificationsContent />
            </CollapsibleSection>

            <CollapsibleSection title="Roadmap" className="bg-stone-800/50 border border-stone-700/60 rounded-xl shadow-lg mt-8">
                <RoadmapContent />
            </CollapsibleSection>

            <CollapsibleSection title="Appendix: Version History" className="bg-stone-800/50 border border-stone-700/60 rounded-xl shadow-lg mt-8">
                <VersionHistoryContent />
            </CollapsibleSection>
        </div>
    );
};

export default HelpPage;