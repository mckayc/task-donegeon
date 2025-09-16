# Task Donegeon

**Version:** 0.5.6

---

Task Donegeon is a gamified task and chore management application designed for families, groups, or individuals. It turns everyday responsibilities into an engaging medieval-themed role-playing game. Users complete "quests" (tasks), earn virtual currency and experience points (XP), customize their avatars, and level up their characters in a fun and motivating environment. It leverages a powerful backend to persist all data and includes unique features like an **Asset Library** full of pre-made content and a **Suggestion Engine** powered by Google Gemini to help administrators generate new quests and items, making world-building a breeze.

## Table of Contents
- [✨ Features](#-features)
- [🗺️ Roadmap](#️-roadmap)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Installation and Running](#️-installation-and-running)

### Weekly Summaries

-   **Week of January 17, 2026 (v0.5.6):**
    -   **Kiosk Mode Enhancements:** Added new administrative controls for shared devices.
    -   **Battery Display:** Admins can now enable a battery level indicator in the Kiosk Mode header, perfect for managing shared tablets.
    -   **Auto-Dimming:** A new feature allows admins to configure automatic screen dimming during specific hours (e.g., at night). The screen will dim after a set period of inactivity and instantly brighten on touch, saving power and reducing screen burn-in.

-   **Week of January 10, 2026 (v0.5.5):**
    -   **Quest Timers:** Implemented a new feature allowing administrators to add timers to quests. This includes a "Stopwatch" mode for tracking time spent and a "Countdown" mode for tasks requiring a minimum duration (e.g., reading for 20 minutes).
    -   **Persistent Timer Widget:** When a timed quest is started, a persistent widget appears in the header, allowing users to navigate the app while keeping track of their active quest. Clicking the widget returns the user to the quest details.
    -   **Timer in Approvals:** The time recorded for a completed timed quest is now displayed on the Approvals page for administrators to review.

-   **Week of December 13, 2025 (v0.4.82):**
    -   **Quest Group Exemptions:** Added the ability to exempt entire Quest Groups from "Global" Condition Sets, allowing admins to create categories of quests that will always be available regardless of other global rules.

-   **Week of December 13, 2025 (v0.4.81):**
    -   **PDF Reader Fix:** Fixed a bug where the PDF reader page would revert immediately after navigation due to a state synchronization issue. Reading progress is now stable.

-   **Week of December 13, 2025 (v0.4.80):**
    -   **New Media Type - PDF:** Added a full-featured PDF reader. Quests can now include PDF documents, which users can read directly in the app. The reader includes page navigation, zoom, fullscreen mode, automatic progress saving, and offline caching.

-   **Week of December 6, 2025 (v0.4.79):**
    -   **Data Import/Export Fixes:** Fixed critical bugs preventing user imports from blueprints and causing failures in JSON/SQLite database restores. Data portability is now reliable.
    -   **Service Worker Update:** Made a minor change to the service worker to ensure update prompts are triggered correctly.

-   **Week of November 29, 2025 (v0.4.78):**
    -   **EPUB Reader Caching & Offline Support:** The EPUB reader now downloads and caches book files locally. This provides instant loading times on subsequent opens and allows for full offline reading. A progress bar has been added to show the download status on the first open.
    -   **Service Worker Update:** The service worker has been updated to enable this new caching strategy.

-   **Week of November 22, 2025 (v0.4.77):**
    -   **The Grand Arcade Expansion:** Added six brand new minigames to the Arcade:
        -   **Gemstone Mines:** A classic match-3 puzzle game.
        -   **Labyrinth of the Minotaur:** A procedurally generated maze runner.
        -   **Alchemist's Trial:** A "Simon Says" style memory game.
        -   **Goblin Ambush:** A fast-paced "Whack-a-Mole" reflex game.
        -   **River Crossing:** A fantasy take on the arcade classic *Frogger*.
        -   **Wizard's Vortex:** A top-down magical survival shooter.
    -   **Major Tetris Improvements:** Overhauled Tetris with modern features, including a **Hold Queue** to save pieces for later, a **Ghost Piece** to preview placement, and satisfying particle effects for line clears.

-   **Week of November 15, 2025 (v0.4.76):**
    -   **New Game: Tetris!** Added a complete, from-scratch implementation of the classic puzzle game Tetris to the Arcade, featuring scoring, levels, a next-piece preview, and on-screen controls.
    -   **Tablet Mode:** The new Tetris game includes a "Tablet Mode" toggle, which provides an optimized two-handed control layout for larger devices.
    -   **Game Rules:** A new "Game Rules" dialog has been created to show players how to play any game in the Arcade.

-   **Week of November 8, 2025 (v0.4.75):**
    -   **Arcade Gameplay Overhaul:** Implemented a massive update to the Arcade based on user feedback. This includes:
        -   **UI Improvements:** Game cards now have explicit "Play", "Rules", and "Stats" buttons for clearer actions.
        -   **Rune Breaker:** Added falling power-ups (e.g., paddle widener) to make gameplay more dynamic.
        -   **Dungeon Dash:** Fixed a critical bug where players were not correctly defeated upon hitting a spike.
        -   **Forge Master:** Implemented a combo system to reward consecutive "Perfect" hits with bonus points and a progressive speed increase.
        -   **Archer's Folly:** Added a trajectory line and power meter to make aiming more intuitive.
        -   **Snake:** Fixed a bug that allowed players to reverse direction and end the game. Added a "Tablet Mode" toggle for a two-handed D-pad layout on larger devices.
        -   **Dragon's Dice:** Added a clear "BUSTED!" message when a player fails to score on a roll.
        -   **Admin Tools:** Admins can now edit minigame properties like cost, plays per token, and prize thresholds from the management page.

-   **Week of October 25, 2025 (v0.4.74):**
    -   **Bug Reporter Visibility Fix:** Fixed a bug where the Bug Reporter tool was visible to all users. It is now correctly restricted to Donegeon Masters (admins) only.

-   **Week of October 18, 2025 (v0.4.72):**
    -   **Quest Group UI Fix:** Fixed a bug where creating, editing, or deleting a Quest Group would not update the UI until the page was refreshed. All CUD operations for Quest Groups now provide immediate feedback.

-   **Week of October 11, 2025 (v0.4.71):**
    -   **Quest To-Do Crash Fix:** Fixed a critical bug where toggling a quest's 'To-Do' status from the Dashboard or Calendar would cause the app to crash. The state management on affected pages has been refactored to prevent stale data and ensure stability.

-   **Week of September 27, 2025 (v0.4.70):**
    -   **Real-Time UI Updates:** Implemented a major fix for real-time UI updates. All create, update, and delete actions on management pages now reflect instantly without needing a page refresh, greatly improving the administrative workflow and resolving a long-standing state synchronization bug.

-   **Week of October 4, 2025 (v0.4.69):**
    -   **Service Worker Update Fix:** Resolved a critical issue where the application would fail to automatically update on some browsers due to aggressive caching of the service worker script. The app now explicitly checks for updates on every page load, ensuring users receive new versions promptly.

-   **Week of September 20, 2025 (v0.4.67):**
    -   **Arcade UX & Gameplay Improvements:** Made several enhancements to the Arcade. The "Play" button on game cards is now a primary, full-width button for better visibility. The Snake game's on-screen controls are now always visible on tablets, improving playability on touch devices. Archer's Folly has been updated with a new aiming guide showing power and trajectory, and its difficulty now progressively increases as the player's score rises.

-   **Week of September 13, 2025 (v0.4.66):**
    -   **Dashboard Customization UX Improvements:** Overhauled the "Customize Dashboard" dialog for better usability. The layout editor columns now have equal heights for a cleaner look. Cards can now be moved between main, side, and hidden columns using new arrow icons, providing an alternative to drag-and-drop. Fixed a bug where cards in the side column would disappear when switching to the "single-column" layout.

-   **Week of September 6, 2025 (v0.4.64):**
    -   **Bug Bar Consolidation:** The bug recording bar has been consolidated into a more compact and responsive two-row layout to prevent controls from overflowing on smaller screens.

-   **Week of September 1, 2025 (v0.4.61):**
    -   **Rank & Leaderboard Logic Overhaul:** Ranks and the main Leaderboard are now calculated based on a user's *total lifetime XP earned from quests*, rather than their current XP balance. This provides a more accurate and fair representation of a user's overall progress that isn't affected by spending rewards. The Rank Card on the dashboard has been updated to display both current balances and total earned values for clarity.

-   **Week of September 1, 2025 (v0.4.60):**
    -   **Quest Scheduling Fix:** Implemented a new rule preventing users from completing "Duty" quests on days they are not scheduled to be active. Users now receive a notification explaining why the quest is unavailable, improving clarity and preventing incorrect completions.

-   **Week of November 24, 2025 (v0.4.52):**
    -   **Customizable Dashboard:** All cards on the Dashboard are now collapsible and can be reordered via drag-and-drop. Your preferred layout and collapsed states are saved automatically to your profile, allowing for a personalized view of your most important information.

-   **November 3, 2025 (v0.4.28):**
    -   **The Arcade Expansion:** Five new minigames have been added: Dragon's Dice (Farkle), Rune Breaker, Dungeon Dash, Forge Master, and Archer's Folly.
    -   **Arcade Leaderboard:** A new "All-Time Arcade Legends" leaderboard now appears in the Arcade, showing top players based on cumulative scores across all games.
    -   **High Score Display:** Each minigame card now proudly displays the name of the current global high score holder.

-   **Week of October 27, 2025 (v0.4.27):**
    -   **Snake Minigame Overhaul:** The Snake minigame in the Arcade has been significantly improved for better playability. The game window is now larger, the initial speed is slower, a "3, 2, 1, GO!" countdown has been added, and players can now restart the game by pressing any arrow key on the "Game Over" screen.
    -   **Global Condition Fix:** Resolved a critical logic bug where a quest that was part of a quest group used in a *globally applied* condition set would lock itself, making it impossible to complete. The global condition check now correctly excludes the quest being evaluated from its own group's completion requirements.

-   **Week of October 20, 2025 (v0.4.25):**
    -   **Conditional Market Unlocks:** Locked markets now show a dialog detailing the specific conditions a user must meet to gain access, mirroring the functionality of locked quests.
    -   **Global Conditions:** Introduced "Global" condition sets that can lock content across the entire application, providing a new layer of administrative control.
    -   **Circular Dependency Fix:** Resolved a critical logic bug where a quest could be locked by a condition requiring the completion of its own quest group. The system now intelligently ignores the quest being checked when evaluating its group's completion status.
    -   **Refactored Logic:** Refactored the internal condition checking logic to be more robust and consistent between quests and markets.

-   **Week of October 13, 2025 (v0.4.05 - v0.4.24):**
    -   Introduced user-specific and global Condition Sets for granular content control.
    -   Revamped Kiosk Mode to be a persistent, device-specific setting.
    -   Overhauled Manual Adjustments for flexibility, adding new birthday trophies.
    -   Enhanced the AI Teacher with personalization and better question handling.
    -   Fixed critical bugs related to Quest Group saving and recurring build failures.

-   **Week of October 6, 2025 (v0.3.01 - v0.4.04):**
    -   Developed and launched the full AI Teacher feature, moving from a backend foundation to a full-screen UI with an interactive "Teach, Check, Feedback" loop and robust tool-calling for quizzes.
    -   Fixed issues with AI Teacher button responsiveness and made minor improvements to Kiosk Mode and item approval defaults.

-   **Week of September 29, 2025 (v0.1.96 - v0.3.0):**
    -   **Kiosk Mode Overhaul:** Re-architected Kiosk Mode to be a more stable URL-based system (`/kiosk`), patching critical security and login flow bugs.
    -   **AI Foundations:** Implemented the backend foundation for the AI Teacher feature with stateful chat sessions.

-   **Week of September 22, 2025 (v0.1.90 - v0.1.95):**
    -   **Dashboard & Notifications:** Introduced new dashboard widgets and header notifications for pending user items.
    -   **Responsive Approvals:** Made the Approvals page fully responsive for mobile devices.
    -   **Enhanced Chronicles:** The Chronicles system was updated with a full audit trail for multi-step actions and richer logging details.

-   **September 2025 (Pre v0.1.90):**
    -   **Full Mobile Responsiveness:** Implemented a responsive design across the application.
    -   **New "Journey" Quest Type:** Introduced multi-stage quests with checkpoints.
    -   **Visual Quest System:** Added color-coded and animated borders to quest cards to indicate urgency and status.
    -   **Core Feature Development:** Initial public release and foundational feature development.
---

## ✨ Features

### For Players ({users})
-   **Gamified Experience:** Complete {tasks} to earn {points} and {xp}.
-   **Character Progression:** Level up through a series of configurable {levels}.
-   **Virtual Economy:** Spend {currency} in {stores} to buy virtual goods.
-   **Avatar Customization:** Personalize your character with purchased items.
-   **Trophy Room:** Earn {awards} for completing milestones.
-   **Multiple Scopes:** Manage tasks in both a **Personal** space and within shared **{groups}**.
-   **AI Teacher:** Engage with an AI-powered tutor on educational {tasks}.

### For Admins ({admin}s)
-   **Powerful Content Management:** Create and manage every aspect of the game world, including {tasks}, items, {stores}, {levels}, and {awards}.
-   **AI Suggestion Engine:** Use Google's Gemini AI to generate creative ideas for any game asset, from {tasks} to items to {awards}.
-   **Asset Library:** Kickstart your world with pre-made content packs that can be imported with a single click.
-   **Blueprint System:** Export your own custom content as a "Blueprint" file to share with others or back up your creations.
-   **Dynamic Rules Engine:** Create powerful "Condition Sets" to control when {tasks} and {stores} become available based on player progress, time of day, or items owned.
-   **User Management:** Easily manage members, assign roles, and make manual adjustments to player accounts.
-   **Shared / Kiosk Mode:** Configure a device for shared family use with a quick-login screen and optional PIN protection. This mode now includes configurable options for displaying battery status and automatically dimming the screen after a period of inactivity.
-   **In-Depth Theming:** Customize the application's entire look and feel, from fonts and colors to button shapes, using the Theme Editor.
-   **Robust Data Management:** Create manual or automated backups of your entire application data (in JSON or SQLite format) and restore from them at any time.

## 🗺️ Roadmap

Here is the planned development path for Task Donegeon, prioritized for the most impactful features first.

### Phase 1: Foundational Features & Quality of Life
-   **Backend Authentication:** Implement JWT-based authentication to secure all backend API endpoints.
-   **Enhanced Security:** A comprehensive security audit and implementation of best practices like strict input validation, Content Security Policy (CSP), and secure headers.
-   **Quest Bundles:** Group quests into "Quest Chains" or "Storylines." This allows admins to create multi-step adventures.
-   **Showcase Page:** A public profile page for each explorer to showcase their avatar, earned trophies, and key stats.
-   **Advanced Object Manager:** Implement bulk editing, quick duplication, and powerful filtering/sorting for all game objects.
-   **Improved Progress Page:** A more detailed summary of user activity, highlighting strengths and areas for improvement with visual charts.

### Phase 2: Core Gameplay & Personalization
-   **User-Created Content:** A system allowing Explorers to design their own quests and items, then submit them to admins for approval. This fosters creativity and allows the game world to be co-created by its members.
-   **Reward Rework:** Overhaul the reward system to allow for more complex and interesting rewards, such as items that grant temporary bonuses or unlock special abilities.