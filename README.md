# Task Donegeon

**Version:** 0.4.24

---

Task Donegeon is a gamified task and chore management application designed for families, groups, or individuals. It turns everyday responsibilities into an engaging medieval-themed role-playing game. Users complete "quests" (tasks), earn virtual currency and experience points (XP), customize their avatars, and level up their characters in a fun and motivating environment. It leverages a powerful backend to persist all data and includes unique features like an **Asset Library** full of pre-made content and a **Suggestion Engine** powered by Google Gemini to help administrators generate new quests and items, making world-building a breeze.

## Table of Contents
- [✨ Features](#-features)
- [🗺️ Roadmap](#️-roadmap)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Installation and Running](#️-installation-and-running)

### What's New in Version 0.4.24 (October 17, 2025)
-   **Build Stability Fixes:** Resolved a recurring TypeScript JSX error in the help guide that was causing build failures and consolidated the version history for better readability and maintenance.

### Weekly Summaries

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
-   **AI Suggestion Engine:** Use Google Gemini to generate creative ideas for any game asset, from {tasks} to items to {awards}.
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

## 🛠️ Tech Stack

-   **Frontend:** React, TypeScript, Vite, Tailwind CSS
-   **Backend:** Node.js, Express
-   **Database:** TypeORM with SQLite for easy, file-based persistence.
-   **AI Integration:** Google Gemini API

## 🚀 Getting Started

To get started with Task Donegeon, you'll need Node.js and npm installed. The application is designed to be self-contained and run easily on your local machine or a server.

### Prerequisites
-   Node.js (v18 or higher recommended)
-   npm

### Environment Variables
For full functionality, especially the AI Suggestion Engine, you need to configure environment variables. Create a `.env` file in the root directory of the project.

```env
# (Required for AI Features) Your Google Gemini API Key
# Get one from https://aistudio.google.com/app/apikey
API_KEY="your_gemini_api_key_here"

# (Optional, Recommended for Production) A long, random, secret string for signing authentication tokens.
JWT_SECRET="your_long_random_secret_string"

# (Optional, Recommended for Production) The path where the application's data (database, assets) will be stored.
# This is crucial for persistent data when using Docker.
APP_DATA_PATH="./data"
```

## ⚙️ Installation and Running

### Using `npm` (for local development)
1.  **Install dependencies** for both the frontend and backend:
    ```bash
    npm install
    npm install --prefix backend
    ```
2.  **Build the frontend:**
    ```bash
    npm run build
    ```
3.  **Start the server:**
    ```bash
    npm start --prefix backend
    ```
4.  Open your browser and navigate to `http://localhost:3000`.

### Using Docker (recommended for production)
A `Dockerfile` and `docker-compose.yml` are included for easy containerization.
1.  **Ensure you have a `.env` file** in the root directory with your `API_KEY` and a secure `JWT_SECRET`.
2.  **Build and run the container** using Docker Compose:
    ```bash
    docker-compose up --build -d
    ```
3.  The application will be available at `http://localhost:3000`. Your data will be persisted in a `data` directory created in the project root, as mapped in the `docker-compose.yml` file.