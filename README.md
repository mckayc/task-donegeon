# Task Donegeon

**Version:** 0.1.01

---

Task Donegeon is a gamified task and chore management application designed for families, groups, or individuals. It turns everyday responsibilities into an engaging medieval-themed role-playing game. Users complete "quests" (tasks), earn virtual currency and experience points (XP), customize their avatars, and level up their characters in a fun and motivating environment. It leverages a powerful backend to persist all data and includes unique features like an **Asset Library** full of pre-made content and an **AI Studio** powered by Google Gemini to help administrators generate new quests and items, making world-building a breeze.

## Table of Contents
- [✨ Features](#-features)
- [🗺️ Roadmap](#️-roadmap)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Installation and Running](#️-installation-and-running)

## ✨ Features

### What's New in Version 0.1.01 (July 28, 2025)
-   **Critical Build Fix:** Fixed a critical build failure caused by incorrect import casing on case-sensitive filesystems (e.g., Docker/Linux) and various TypeScript type errors. This resolves numerous `TS2307` (Cannot find module) and `TS7006` (implicitly has an 'any' type) errors that prevented the application from compiling.

### Version History
- **v0.1.0 (July 27, 2025):** Critical Bug Fix: Quest Approval Rewards.
- **v0.0.99 (July 27, 2025):** New Feature: Theme Variety & Marketplace, New Store: "The Gilded Brush (Themes)".
- **v0.0.98 (July 23, 2025):** Bug fixes for chat indicator and quest completion server error, plus backend stability improvements.
- **v0.0.97 (July 23, 2025):** New "Vacation" Event Type, Calendar-Driven Vacations, Automatic Penalty Pausing, Streamlined Settings.
- **v0.0.96 (July 22, 2025):** Default Quest Groups, AI-powered group suggestions, streamlined quest creation.
- **v0.0.95 (July 22, 2025):** Smarter AI Studio, powerful bulk editing for quests, enhanced collapsed sidebar with fly-out menus, and default quest categories.
- **v0.0.94 (July 26, 2025):** Added default quest categories and improved the collapsed sidebar with expandable menus.
- **v0.0.93 (July 25, 2025):** Implemented a purchase escrow system, integrated purchase requests into the Chronicles, and improved the login notification popup with a scrollbar and close button.
- **v0.0.92 (July 24, 2025):** Added in-dialog Quest Group creation and made item titles on management pages clickable for quick editing.
- **v0.0.91 (July 23, 2025):** Redesigned "Manage Goods" and "Manage Quests" pages with tabs, sorting, and search. Added a new "Quest Group" system for organization and bulk assignment.
- **v0.0.90 (July 22, 2025):** **Smarter Asset Pack Importer:** The "Import from Library" feature was overhauled to intelligently compare local and remote files, preventing duplicate downloads and giving admins granular import control.
- **v0.0.89 (July 21, 2025):** **Enhanced Chronicles:** The activity feed now displays the currency and amount spent for each item purchase, providing a clearer transaction history.
- **v0.0.88 (July 20, 2025):** **Critical Docker Stability Fix:** Resolved a race condition that caused chat messages to not save and the app to become unresponsive in Docker environments. The data saving mechanism is now more robust, preventing server syncs from overwriting unsaved local changes and eliminating the frequent "Failed to fetch" errors.
- **v0.0.87 (July 20, 2025):** **Calendar Day View Enhancement:** Added due date/time information for quests on the main 'Day' view of the calendar, improving at-a-glance scheduling clarity.
- **v0.0.86 (July 19, 2025):** **Enhanced Reward Valuation Helper:** The helper text in the quest editor now shows both the anchor reward equivalent and the final "real-world" value (e.g., `(equals 5 💎 or $5.00)`), providing admins with clearer context for balancing the game's economy. The layout of the reward input has also been improved for better readability.
- **v0.0.85 (July 19, 2025):** **Image Pack Importer:** A new feature has been added to the `Asset Manager` page, allowing administrators to dynamically import curated image packs directly from the project's GitHub repository. This keeps the main application lean while providing easy access to a library of high-quality images.
- **v0.0.84 (July 19, 2025):** **Categorized Frontend Uploads:** The asset management workflow has been significantly improved. Admins can now specify a category when uploading an image from the `Asset Manager`, and the backend will automatically organize the file into a corresponding sub-folder.
- **v0.0.83 (July 19, 2025):** **Durable Server-Side Backups:** The entire backup system has been overhauled for production-grade reliability. Backups are now saved directly on the server's file system, and automated backups run as a reliable server-side process.
- **v0.0.82 (July 19, 2025):** **Login Notifications System & DM Announcements:** A comprehensive notification system has been added. Users now see a popup on login detailing new quest assignments, guild announcements from Donegeon Masters, trophies unlocked, and items pending approval. This feature can be toggled in a new "Notifications" section in the settings.
- **v0.0.81 (July 19, 2025):** Revamped About Page, direct GitHub link, and a new Version History section.
- **v0.0.80 (July 19, 2025):** UI Streamlining (Global Reward Display), Smarter Sticky Card Headers, Docker Chat Fix, Dashboard Cleanup.

### Core Features
-   **Full-featured In-App Chat:** A real-time chat system allows users to message each other directly within the app, with notifications for unread messages.
-   **Bulk Content Management:** Admins can now select multiple items on management pages to perform bulk actions like deleting or changing status.
-   **AI Image Generation Helper:** The Asset Manager now includes an AI prompt helper with links to free AI art generators to streamline asset creation.
-   **New Default Marketplaces:** Added a bank for currency exchange, an experience shop, and a candy store, complete with new items.
-   **AI Studio Enhancements:** The asset generator now distinguishes between creating "Duties" and "Ventures" and can generate up to 20 ideas at once.
-   **Expanded Trophy Collection:** Added over 30 new default trophies for users to earn.
-   **Complete Theme Editor Overhaul:** Redesigned with a live preview, more fonts, and granular controls for colors and sizes.
-   **Enhanced Calendar Views:** Day view now has two columns (Duties/Ventures), and Week/Month "Chronicles" views are fully functional.
-   **Guild-Specific Themes:** Guilds can now have their own unique, lockable themes when in "Guild View".
-   **Profile Picture Uploads:** Users can upload their own profile pictures for a more personalized avatar.
-   **Automated Backups:** Configure automated local backups to run at set intervals, ensuring data safety.
-   **Numerous UI/UX Improvements:** Including a redesigned PIN pad, scrollable dashboard sections, improved quest board sorting, and more customization options like editable sidebar link names.
-   **Market Controls:** Admins can now set markets to "Open" or "Closed" status, controlling their visibility in the Marketplace.
-   **Data Synchronization:** Automatic data syncing keeps your application state consistent across all your devices.
-   **AI-Powered Content Generation:** The AI Studio, powered by Google Gemini, can generate ideas for quests, items, markets, trophies, and themes.
-   **Gamified Task Management:** Create recurring "Duties" and one-time "Ventures" with customizable rewards, deadlines, and penalties.
-   **Avatar Customization:** Unlock and equip different cosmetic items, now correctly reflected in the header and throughout the app.
-   **Full Backup, Restore, and Sharing:** Admins can download a complete backup, restore it, or create smaller "Blueprints" to share content with others.

## 🗺️ Roadmap

Here is the planned development path for Task Donegeon, prioritized for the most impactful features first.

### Phase 1: Foundational Features & Quality of Life
This phase focuses on high-impact improvements for admins and players that enhance the core experience.

-   **Conditional Market Opening:** Allow markets to open based on conditions like the day of the week, user rank, or quest completion.
-   **Backend Authentication:** Implement JWT-based authentication to secure all backend API endpoints.
-   **Enhanced Security:** A comprehensive security audit and implementation of best practices like strict input validation, Content Security Policy (CSP), and secure headers.
-   **Quest Bundles:** Group quests into "Quest Chains" or "Storylines." This allows admins to create multi-step adventures.
-   **Showcase Page:** A public profile page for each explorer to showcase their avatar, earned trophies, and key stats.
-   **Advanced Object Manager:** Implement bulk editing, quick duplication, and powerful filtering/sorting for all game objects.
-   **Improved Progress Page:** A more detailed summary of user activity, highlighting strengths and areas for improvement with visual charts.

### Phase 2: Core Gameplay & Personalization
This phase introduces major new creative outlets and systems for deeper engagement.

-   **User-Created Content:** A system allowing Explorers to design their own quests and items, then submit them to admins for approval. This fosters creativity and allows the game world to be co-created by its members.
-   **Reward Rarity & Limits:** Ability to specify how many of a certain reward can be claimed, creating rare or one-of-a-kind items.
-   **Automated Quest Rotation:** A system for automatically rotating daily or weekly duties among guild members to ensure fair distribution of chores.

### Phase 3: Advanced Systems & World Expansion
This phase includes the big, game-changing features that add new dimensions to the world.

-   **Game Map:** A visual map with unlockable locations. Traveling to a location could unlock new quests or markets.
-   **Explorer Markets:** Allow explorers to open their own markets to sell items or services to other players, creating a player-driven economy.
-   **Advanced Reporting:** A dedicated reporting dashboard for admins to track user engagement, economic flow, and quest completion rates.

### Phase 4: Platform Maturity & Polish
This phase focuses on long-term stability, accessibility, and preparing the app for a wider audience.

-   **Real-time Notifications:** Use WebSockets for instant updates on approvals, purchases, and guild activity.
-   **Accessibility (A11Y) Audit:** A full review to ensure the application is usable by people with disabilities.
-   **Mobile App / PWA:** Package the application as a Progressive Web App (PWA) for a native-like experience on mobile devices.


## 🛠️ Tech Stack

-   **Frontend:** React (with Hooks & Context API), TypeScript, Vite, TailwindCSS
-   **Backend:** Node.js with Express.js, **SQLite**, Google Gemini
-   **Deployment:** Docker

## 🚀 Getting Started

When you run the application for the first time, it will be automatically seeded with a default set of users and data. You will be presented with a lock screen.

**Login as the administrator to unlock the app:**
-   **Username**: `admin`
-   **Password**: `123456`

Once unlocked, you and other users can log in using the "Switch Profile" button. Other pre-seeded accounts have the password `123456` if they are an admin/moderator role, or a PIN of `1234` if they are a standard user.

## ⚙️ Installation and Running

**Important Note on Deployment:** This application uses a file-based SQLite database for data persistence. As a result, it requires a persistent filesystem and is **not compatible with serverless deployment platforms like Vercel**. The recommended methods for running the application are via local development or Docker.

### Option 1: Local Development (Recommended)
1.  **Clone & Install:**
    ```bash
    git clone https://github.com/mckayc/task-donegeon.git
    cd task-donegeon
    npm install
    cd backend
    npm install
    cd ..
    ```
2.  **Configure `.env` File (Optional):**
    If you want to use the AI features, copy `.env.example` to `.env` and fill in your Google Gemini API key.
    -   **`API_KEY`**: `your_gemini_api_key_here`

3.  **Run Backend & Frontend:**
    -   In one terminal, from the `backend` directory: `npm start`
    -   In another terminal, from the root directory: `npm run dev`
    
    The application will be running at `http://localhost:5173`. A `db` folder containing a `data.db` file will be created automatically in the `backend` directory to store all application data.

### Option 2: Docker Deployment
1.  **Clone the Repository**.
2.  **Configure `.env` File (Optional):**
    If you want to use the AI features, copy `.env.example` to `.env` and set your `API_KEY`.
3.  **Create local directories for persistent storage:**
    ```bash
    mkdir uploads
    mkdir db
    # Ensure folders have correct permissions for the container user (UID 1000)
    sudo chown -R 1000:1000 ./uploads ./db
    ```
4.  **Build and Run:**
    ```bash
    docker-compose up --build -d
    ```
    The app will be at `http://localhost:3002`. Your database, uploaded files, and server-side backups will be persistent in the `./db`, and `./uploads` folders on your host machine.

### Option 3: Portainer Deployment
1.  In Portainer, go to **Stacks** > **+ Add stack**.
2.  Give the stack a **Name** (e.g., `task-donegeon`).
3.  **Paste** the contents of `docker-compose.yml` into the Web editor.
4.  Scroll down to the **Environment variables** section (if you want AI features). Click **Add environment variable**:
    -   **Name:** `API_KEY`, **Value:** `your_api_key_here`
5.  **Important:** To make your data persistent, go to the **Volumes** tab in Portainer and map the container paths to a host path.
    -   `./uploads:/app/uploads`
    -   `./db:/app/backend/db`
6.  Click **Deploy the stack**. The app will be available at `http://<your-server-ip>:3002`.