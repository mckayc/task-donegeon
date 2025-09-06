# Task Donegeon

**Version:** 0.4.54

---

Task Donegeon is a gamified task and chore management application designed for families, groups, or individuals. It turns everyday responsibilities into an engaging medieval-themed role-playing game. Users complete "quests" (tasks), earn virtual currency and experience points (XP), customize their avatars, and level up their characters in a fun and motivating environment. It leverages a powerful backend to persist all data and includes unique features like an **Asset Library** full of pre-made content and a **Suggestion Engine** powered by Google Gemini to help administrators generate new quests and items, making world-building a breeze.

## Table of Contents
- [✨ Features](#-features)
- [🗺️ Roadmap](#️-roadmap)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Installation and Running](#️-installation-and-running)

### Version History

#### Week of November 24, 2025 (v0.4.52)
-   **Customizable Dashboard:** All cards on the Dashboard are now collapsible and can be reordered via drag-and-drop. Your preferred layout and collapsed states are saved automatically to your profile, allowing for a personalized view of your most important information.

#### Week of November 17, 2025 (v0.4.46)
-   **eBook Reader Redesign:** The EPUB reader has been completely overhauled with a new UI. It now features permanent, opaque top and bottom bars for controls, an "immersive" mode to hide the UI for distraction-free reading, a scrubbable progress slider for quick navigation, a dedicated "add bookmark" button, and a subtle page-turn animation.

#### Week of November 10, 2025 (v0.4.45)
-   **EPUB Reader Overhaul:** The eBook reader has been significantly upgraded with fullscreen mode, swipe controls, light/dark themes, improved bookmark display (with progress percentage), and database-backed progress syncing for a seamless experience across devices. Session and total time read are now also tracked and displayed.
-   **Media Library Enhancements:** Added the ability to create folders, fixed upload paths, and implemented drag-and-drop for files and folders in the media library.
-   **Bug Fixes:** Resolved an issue allowing users to complete daily duties multiple times and fixed a syntax error on the server.
-   **Quality of Life:** Added timestamps to the approvals page for better tracking.

#### November 3, 2025 (v0.4.28)
-   **The Arcade Expansion:** Five new minigames have been added: Dragon's Dice (Farkle), Rune Breaker, Dungeon Dash, Forge Master, and Archer's Folly.
-   **Arcade Leaderboard:** A new "All-Time Arcade Legends" leaderboard now appears in the Arcade, showing top players based on cumulative scores across all games.
-   **High Score Display:** Each minigame card now proudly displays the name of the current global high score holder.

#### Week of October 27, 2025 (v0.4.27)
-   **Snake Minigame Overhaul:** The Snake minigame in the Arcade has been significantly improved for better playability. The game window is now larger, the initial speed is slower, a "3, 2, 1, GO!" countdown has been added, and players can now restart the game by pressing any arrow key on the "Game Over" screen.
-   **Global Condition Fix:** Resolved a critical logic bug where a quest that was part of a quest group used in a *globally applied* condition set would lock itself, making it impossible to complete. The global condition check now correctly excludes the quest being evaluated from its own group's completion requirements.

#### Week of October 20, 2025 (v0.4.25)
-   **Conditional Market Unlocks:** Locked markets now show a dialog detailing the specific conditions a user must meet to gain access, mirroring the functionality of locked quests.
-   **Global Conditions:** Introduced "Global" condition sets that can lock content across the entire application, providing a new layer of administrative control.
-   **Circular Dependency Fix:** Resolved a critical logic bug where a quest could be locked by a condition requiring the completion of its own quest group. The system now intelligently ignores the quest being checked when evaluating its group's completion status.
-   **Refactored Logic:** Refactored the internal condition checking logic to be more robust and consistent between quests and markets.

#### Week of October 13, 2025 (v0.4.05 - v0.4.24)
-   Introduced user-specific and global Condition Sets for granular content control.
-   Revamped Kiosk Mode to be a persistent, device-specific setting.
-   Overhauled Manual Adjustments for flexibility, adding new birthday trophies.
-   Enhanced the AI Teacher with personalization and better question handling.
-   Fixed critical bugs related to Quest Group saving and recurring build failures.

#### Week of October 6, 2025 (v0.1.96 - v0.4.04)
-   Developed and launched the full AI Teacher feature, moving from a backend foundation to a full-screen UI with an interactive "Teach, Check, Feedback" loop and robust tool-calling for quizzes.
-   Fixed issues with AI Teacher button responsiveness and made minor improvements to Kiosk Mode and item approval defaults.

#### Week of September 29, 2025 (v0.1.96 - v0.3.0)
-   **Kiosk Mode Overhaul:** Re-architected Kiosk Mode to be a more stable URL-based system (`/kiosk`), patching critical security and login flow bugs.
-   **AI Foundations:** Implemented the backend foundation for the AI Teacher feature with stateful chat sessions.

#### Week of September 22, 2025 (v0.1.90 - v0.1.95)
-   **Dashboard & Notifications:** Introduced new dashboard widgets and header notifications for pending user items.
-   **Responsive Approvals:** Made the Approvals page fully responsive for mobile devices.
-   **Enhanced Chronicles:** The Chronicles system was updated with a full audit trail for multi-step actions and richer logging details.

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
-   **Shared / Kiosk Mode:** Configure a device for shared family use with a quick-login screen and optional PIN protection.
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

---
## 🛠️ Tech Stack

-   **Frontend:** React, TypeScript, Vite, Tailwind CSS
-   **Backend:** Node.js, Express, TypeORM
-   **Database:** SQLite
-   **AI Integration:** Google Gemini API
-   **Deployment:** Vercel (or Docker)

## 🚀 Getting Started

### Prerequisites

-   Node.js (v18 or newer recommended)
-   npm or yarn
-   (Optional) Docker and Docker Compose

### Environment Variables

Create a `.env` file in the root of the project. This file is for sensitive information and should not be committed to version control.

```
# .env

# Required for the AI Suggestion Engine
# Get your key from Google AI Studio: https://aistudio.google.com/app/apikey
API_KEY="your-google-gemini-api-key"

# (Optional) A long, random, secret string for signing authentication tokens.
# The server will work without it, but it's highly recommended for security.
JWT_SECRET="your-super-secret-jwt-string"

# (Optional) For Docker, you can specify a custom path for persistent data.
# This helps ensure your data is saved outside the container.
# APP_DATA_PATH=./my-task-data
```

## ⚙️ Installation and Running

### With Docker (Recommended)

This is the easiest way to get the application and its backend running.

1.  **Install Docker and Docker Compose:** Make sure they are installed on your system.
2.  **Build and Run:**
    ```bash
    docker-compose up --build
    ```
3.  **Access:** Open your browser and navigate to `http://localhost:5173`. The Vite frontend will be served on port `5173`, and it will automatically proxy API requests to the backend server running on port `3000`.

### Local Development (Without Docker)

1.  **Install Frontend Dependencies:**
    ```bash
    npm install
    ```
2.  **Install Backend Dependencies:**
    ```bash
    cd backend
    npm install
    ```
3.  **Run Backend Server:**
    ```bash
    # From the 'backend' directory
    npm start
    ```
    The backend will start on `http://localhost:3000`.
4.  **Run Frontend Dev Server:**
    ```bash
    # From the root directory
    npm run dev
    ```
    The frontend will start on `http://localhost:5173`.
