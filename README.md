# Task Donegeon

**Version:** 0.0.69
**Last Updated:** 2024-07-18T10:00:00Z

---

Task Donegeon is a gamified task and chore management application designed for families, groups, or individuals. It turns everyday responsibilities into an engaging medieval-themed role-playing game. Users complete "quests" (tasks), earn virtual currency and experience points (XP), customize their avatars, and level up their characters in a fun and motivating environment. It leverages a powerful backend to persist all data and includes unique features like an **Asset Library** full of pre-made content and an **AI Studio** powered by Google Gemini to help administrators generate new quests and items, making world-building a breeze.

## Table of Contents
- [✨ Features](#-features)
- [🗺️ Roadmap](#️-roadmap)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Installation and Running](#️-installation-and-running)

## ✨ Features

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
-   **Backend:** Node.js with Express.js, PostgreSQL, Google Gemini
-   **Deployment:** Docker, Vercel (Frontend & Serverless Functions), Supabase (Database & Storage)

## 🚀 Getting Started

When you run the application for the first time, it will be automatically seeded with a default set of users and data. You will be presented with a lock screen.

**Login as the administrator to unlock the app:**
-   **Username**: Select `admin` from the dropdown (if shown).
-   **Password**: `123456`

Once unlocked, you and other users can log in using the "Switch Profile" button. Other pre-seeded accounts have the password `123456` if they are an admin/moderator role, or a PIN of `1234` if they are a standard user.

## ⚙️ Installation and Running

### Option 1: Local Development (Recommended for contributing)
1.  **Clone & Install:**
    ```bash
    git clone https://github.com/mckayc/task-donegeon.git
    cd task-donegeon
    npm install
    cd backend
    npm install
    cd ..
    ```
2.  **Run PostgreSQL with Docker:**
    ```bash
    docker run --name task-donegeon-db -e POSTGRES_PASSWORD=your_secret_password -p 5432:5432 -d postgres
    ```
3.  **Configure `.env` File:**
    Copy `.env.example` to `.env` and fill in the variables.
    -   `DATABASE_URL`: `postgres://postgres:your_secret_password@localhost:5432/postgres`
    -   `STORAGE_PROVIDER`: `local`
    -   **`API_KEY`**: Your Google Gemini API Key. Without this, AI features will be disabled.

4.  **Run Backend & Frontend:**
    -   In one terminal, from the `backend` directory: `npm start`
    -   In another terminal, from the root directory: `npm run dev`

### Option 2: Vercel & Supabase Deployment (Recommended for production)
1.  **Fork the Repository** to your own GitHub account.

2.  **Set up Supabase Project:**
    -   Create a new Supabase project.
    -   Go to **Project Settings > Database** and copy the **URI** connection string.
    -   Go to the **SQL Editor** and run: `CREATE TABLE app_data (key TEXT PRIMARY KEY, value JSONB NOT NULL);`
    -   Go to **Storage**, click **New bucket**, name it `media-assets`, and check the box to make it a **Public bucket**.

3.  **Set up and Deploy on Vercel:**
    -   Import your forked repository on Vercel.
    -   Under **Environment Variables**, add the following:
        -   `DATABASE_URL`: Your full Supabase URI connection string.
        -   `STORAGE_PROVIDER`: `supabase`
        -   `SUPABASE_URL`: Your Supabase project URL (from **Project Settings > API**).
        -   `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase `service_role` key (from **Project Settings > API**).
        -   **`API_KEY`**: Your Google Gemini API Key.
    -   Click **Deploy**.

### Option 3: Docker Deployment
1.  **Clone the Repository**.
2.  **Configure `.env` File:** Copy `.env.example` to `.env` and set all variables.
    -   `POSTGRES_PASSWORD`: A strong, unique password.
    -   `STORAGE_PROVIDER`: `local`
    -   **`API_KEY`**: Your Google Gemini API Key.
3.  **Build and Run:**
    ```bash
    docker-compose up --build
    ```
    The app will be at `http://localhost:3002`. Uploaded files will be in the `./uploads` directory.

### Option 4: Portainer Deployment (Updated Guide)
1.  In Portainer, go to **Stacks** > **+ Add stack**.
2.  Give the stack a **Name** (e.g., `task-donegeon`).
3.  **Paste** the contents of `docker-compose.prod.yml` into the Web editor.
4.  Scroll down to the **Environment variables** section. It's crucial to add the required secrets here. Click **Add environment variable** for each of the following:
    -   **Name:** `POSTGRES_PASSWORD`, **Value:** `your_super_secret_password_here` (Choose a strong password)
    -   **Name:** `API_KEY`, **Value:** `your_gemini_api_key_here` (If you want AI features)
    -   You can also explicitly set `POSTGRES_USER` and `POSTGRES_DB` here if you wish to override the defaults.
5.  Click **Deploy the stack**. The app will be available at `http://<your-server-ip>:3002`.

### Option 5: Production Deployment from Docker Hub
1.  Create a `.env` file with the required production variables.
2.  Run the application using the `docker-compose.prod.yml` file:
    ```bash
    docker-compose -f docker-compose.prod.yml up -d
    ```
    This command will pull the latest pre-built image from Docker Hub and run it, along with the database service. It is the recommended way to run the app on a server.