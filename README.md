# Task Donegeon

**Version:** 0.5.27

---

Task Donegeon is a gamified task and chore management application designed for families, groups, or individuals. It turns everyday responsibilities into an engaging medieval-themed role-playing game. Users complete "quests" (tasks), earn virtual currency and experience points (XP), customize their avatars, and level up their characters in a fun and motivating environment. It leverages a powerful backend to persist all data and includes unique features like an **Asset Library** full of pre-made content and a **Suggestion Engine** powered by Google Gemini to help administrators generate new quests and items, making world-building a breeze.

## Table of Contents
- [✨ Features](#-features)
- [🗺️ Roadmap](#️-roadmap)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Installation and Running](#️-installation-and-running)

### Weekly Summaries

-   **Week of November 27, 2025 (v0.5.27):**
    -   **AI Tutor Overhaul & Bug Fixes:** A major overhaul of the AI Tutor feature to improve stability and user experience. Fixes a critical bug where the AI would show raw tool code instead of interactive questions during a lesson. The UI has been redesigned to separate conversation from quizzes, and the chat now auto-scrolls correctly. Also resolves an issue where the last question of the initial quiz was always marked incorrect.

-   **Week of November 27, 2025 (v0.5.26):**
    -   **Sidebar Interactivity Fix:** Fixed bugs where the "Chat" link in the sidebar was unresponsive and collapsed section headers (e.g., "Content Management") were not interactive. Clicking a collapsed header icon now correctly opens a persistent flyout menu to access its sub-links.

-   **Week of November 20, 2025 (v0.5.25):**
    -   **Arcade Enhancements:** Added a "Rules" button to every minigame in the Arcade, which opens a dialog explaining the objective and controls for that game.
    -   **New Games (Coming Soon):** Implemented placeholder components for five new minigames: Labyrinth of the Minotaur, Alchemist's Trial, Goblin Ambush, River Crossing, and Wizard's Vortex. These games now appear in the Arcade and are ready for full development.

-   **Week of November 13, 2025 (v0.5.24):**
    -   **Sidebar UI/UX Fix:** Fixed a bug where section headers in the sidebar (e.g., "Content Management") were missing their icons when expanded. Additionally, when the sidebar is collapsed, these headers are now interactive; hovering over their icons reveals a flyout menu of their child links, fixing an issue where they were previously unclickable.

-   **Week of November 6, 2025 (v0.5.23):**
    -   **AI Tutor Readability & UX:** The AI Tutor now displays a friendly welcome message while it prepares its initial quiz. The font size for both chat messages and quiz answers has been increased for better readability, improving the overall user experience.

-   **Week of October 30, 2025 (v0.5.22):**
    -   **AI Tutor Enhancements:** Resolved a configuration issue causing the "Manage AI Tutors" sidebar link to appear without a text label on new installations. Added a new "General Instructions" field to the AI Tutor editor, allowing administrators to provide overarching guidelines to the AI during tutoring sessions.

-   **Week of October 23, 2025 (v0.5.21):**
    -   **AI Tutor Enhancements:** Fixed a bug where the "Manage AI Tutors" sidebar link was missing its text label. Added a new "General Instructions" field to the AI Tutor editor to allow for better personalization of the tutor's behavior, which is now passed to the AI during sessions.

-   **Week of October 16, 2025 (v0.5.20):**
    -   **Sidebar Label Fix:** Fixed a UI bug where the "Manage AI Tutors" link in the sidebar was missing its text label due to an incomplete backend configuration. The terminology is now correctly displayed.

-   **Week of October 9, 2025 (v0.5.19):**
    -   **Automated Backup Cleanup Fix:** Resolved a critical bug where the system would fail to delete old automated backups according to the defined schedule limits, causing an excessive number of backup files to accumulate. The sorting logic for identifying the oldest backups has been made more robust to ensure cleanup runs correctly.

-   **Week of October 2, 2025 (v0.5.18):**
    -   **AI Tutor UX Fix:** Resolved a bug where the AI Tutor would display multiple-choice questions as raw code in the main chat area. All interactive questions now correctly appear in the side panel, creating a clear separation between conversation and quizzes for a more stable user experience.

-   **Week of September 25, 2025 (v0.5.17):**
    -   **AI Tutor UX Improvement:** Fixed a critical bug where multiple-choice questions from the AI Tutor could appear as raw code in the chat. The interaction model has been redesigned: the main chat area is now reserved for conversation, while all interactive questions appear in a dedicated panel on the right, providing a cleaner and more stable learning experience.

-   **Week of October 9, 2025 (v0.5.16):**
    -   **Approvals Page Stability Fix:** Fixed a critical state management bug on the Approvals page where acting on one item (approving or rejecting) would cause all other pending items to incorrectly disappear from the view until the page was refreshed. The state update logic has been refactored to be more precise, ensuring a stable and predictable UI for administrators.

-   **Week of October 2, 2025 (v0.5.15):**
    -   **Login Persistence Fix:** Resolved a critical bug that caused the application to forget the last logged-in user after an app update and page refresh. The system now correctly restores the user's session, ensuring a seamless experience without being redirected to the user selection screen.

-   **Week of September 25, 2025 (v0.5.14):**
    -   **Enhanced Login Notifications:** Overhauled the login notification system for a more informative and user-friendly experience. The new popup includes a "Daily Briefing" that lists all required quests for the day, providing an immediate action list. Notifications are now grouped by type (e.g., "New Quests," "Approvals"), and users have two dismissal options: "Acknowledge & Continue" to mark notifications as read, and "Remind Me Later" to hide them for the current session while keeping them unread for the next login.

-   **Week of September 25, 2025 (v0.5.13):**
    -   **Bug Squashing & Stability:** A major stability update resolving a large number of bugs across the application. This version fixes issues with state management, data synchronization, user management, automated backups, and significantly enhances the AI Tutor's reliability and user interface. Key fixes include ensuring the correct user is logged in after an update, fixing stale data in user selection screens, adding missing notification badges and labels, resolving UI disappearing acts in the approvals queue, and overhauling the AI Tutor to be more robust and user-friendly.

-   **Week of September 18, 2025 (v0.5.12):**
    -   **Stability & AI Tutor Overhaul:** A major stability update resolving numerous bugs related to state management, data synchronization, and UI consistency. This version also significantly enhances the AI Tutor feature, improving its instructional flow, reliability, and administrative customization options. Key fixes include preventing the app from defaulting to the user selection screen after updates, ensuring the approvals queue updates correctly, adding missing sidebar labels, and fixing AI Tutor's quiz logic and response handling to prevent raw code from being displayed.

-   **Week of September 18, 2025 (v0.5.11):**
    -   **New Feature: AI Tutor Management:** Added a new "Manage AI Tutors" page for administrators. This allows for the creation of unique AI tutor personas with specific subjects, teaching styles, and sample questions.
    -   **Quest Integration:** The "Create Quest" dialog now includes a new "AI Tutor" media type. When selected, administrators can choose from the list of created tutors to assign one to a quest, paving the way for interactive, AI-powered learning sessions.
    -   **Technical Foundation:** The backend has been updated with new database entities, services, and API endpoints to support the creation, editing, and deletion of AI Tutors.

-   **Week of February 14, 2026 (v0.5.10):**
    -   **Kiosk Dimness Logic Refactor:** Refactored the Kiosk Mode dimming feature to use a more intuitive "Dimness Level" control. The percentage now directly corresponds to the screen overlay's opacity, fixing a bug where different levels looked the same and providing more predictable control for administrators.

-   **Week of February 7, 2026 (v0.5.9):**
    -   **Kiosk Mode Dimness Fix:** Reworked the Kiosk Mode dimming control to be more intuitive. It now uses a "Screen Brightness" slider where lower values correctly result in a dimmer screen (higher opacity), addressing user confusion about the dimness level's effect.

-   **Week of January 31, 2026 (v0.5.8):**
    -   **Kiosk Mode Enhancements:** Overhauled the auto-dimming feature for shared devices. It is now exclusively active in Kiosk Mode, uses the globally-managed screen dimming overlay for reliability, and respects the dimness level set in the admin settings.
    -   **Dimness Preview:** Added a "Preview" button in the Kiosk Mode settings, allowing administrators to test the configured dimness level for 5 seconds.
    -   **UI Cleanup:** Removed the redundant manual "Dim Screen" toggle from the user profile dropdown.

-   **Week of January 24, 2026 (v0.5.7):**
    -   **New Statistics Page:** Added a dedicated "Statistics" page under System Tools for administrators.
    -   **Quest & Item Analytics:** The new page includes widgets that display the top 10 most-completed quests and the top 10 most-purchased items, providing valuable insight into user engagement and the in-game economy.

-   **Week of January 17, 2026 (v0.5.6):**
    -   **Kiosk Mode Enhancements:** Added new administrative controls for shared devices.
    -   **Battery Display:** Admins can now enable a battery level indicator in the Kiosk Mode header, perfect for managing shared tablets.
    -   **Auto-Dimming:** A new feature allows admins to configure automatic screen dimming during specific hours (e.g., at night). The screen will dim after a set period of inactivity and instantly brighten on touch, saving power and reducing screen burn-in.

-   **Week of January 10, 2025 (v0.5.5):**
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
    -   **The Grand Arcade Expansion:** Added six brand new minigames to the Arcade: Gemstone Mines, Labyrinth of the Minotaur, Alchemist's Trial, Goblin Ambush, River Crossing, and Wizard's Vortex.
    -   **Major Tetris Improvements:** Overhauled Tetris with modern features, including a Hold Queue, a Ghost Piece, and satisfying particle effects.

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
        -   **Snake:** Fixed a bug that allowed players to reverse direction and end the game. Added a "Tablet Mode" toggle for a two-handed D-pad layout for larger devices.
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

-   **Week of September 6, 2025 (v0.4.65):**
    -   **EPUB Reader Fix:** Fixed a bug in the EPUB reader where the progress bar would incorrectly display 100% and not update. The progress calculation is now more robust, ensuring the slider accurately reflects the user's position in the book.

-   **Week of September 6, 2025 (v0.4.64):**
    -   **Bug Bar Consolidation:** The bug recording bar has been consolidated into a more compact and responsive two-row layout to prevent controls from overflowing on smaller screens.

-   **Week of September 1, 2025 (v0.4.61):**
    -   **Rank & Leaderboard Logic Overhaul:** Ranks and the main Leaderboard are now calculated based on a user's *total lifetime XP earned from quests*, rather than their current XP balance. This provides a more accurate and fair representation of a user's overall progress that isn't affected by spending rewards. The Rank Card on the dashboard has been updated to display both current balances and total earned values for clarity.

-   **Week of September 1, 2025 (v0.4.60):**
    -   **Quest Scheduling Fix:** Implemented a new rule preventing users from completing "Duty" quests on days they are not scheduled to be active. Users now receive a notification explaining why the quest is unavailable, improving clarity and preventing incorrect completions.

-   **Week of November 24, 2025 (v0.4.52):**
    -   **Customizable Dashboard:** All cards on the Dashboard are now collapsible and can be reordered via drag-and-drop. Your preferred layout and collapsed states are saved automatically to your profile, allowing for a personalized view of your most important information.

-   **Week of November 17, 2025 (v0.4.46):**
    -   **eBook Reader Redesign:** The EPUB reader has been completely overhauled with a new UI. It now features permanent, opaque top and bottom bars for controls, an "immersive" mode to hide the UI for distraction-free reading, a scrubbable progress slider for quick navigation, a dedicated "add bookmark" button, and a subtle page-turn animation.

-   **Week of November 10, 2025 (v0.4.45):**
    -   **EPUB Reader Overhaul:** The eBook reader has been significantly upgraded with fullscreen mode, swipe controls, light/dark themes, improved bookmark display (with progress percentage), and database-backed progress syncing for a seamless experience across devices. Session and total time read are now also tracked and displayed.
    -   **Media Library Enhancements:** Added the ability to create folders, fixed upload paths, and implemented drag-and-drop for files and folders in the media library.
    -   **Bug Fixes:** Resolved an issue allowing users to complete daily duties multiple times and fixed a syntax error on the server.
    -   **Quality of Life:** Added timestamps to the approvals page for better tracking.

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
-   **AI Tutor:** Engage with an AI-powered tutor on educational {tasks}.

### For Admins ({admin}s)
-   **Powerful Content Management:** Create and manage every aspect of the game world, including {tasks}, items, {stores}, {levels}, and {awards}.
-   **AI Suggestion Engine:** Use Google's Gemini AI to generate creative ideas for any game asset, from {tasks} to items to {awards}.
-   **AI Tutor Management:** Create and configure unique AI Tutor personas with specific subjects, teaching styles, and sample questions to create personalized learning experiences.
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
-   **Enhanced Security:
