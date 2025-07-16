# Task Donegeon

**Version:** 0.0.56
**Last Updated:** 2025-06-05T10:00:00Z

---

Task Donegeon is a gamified task and chore management application designed for families, groups, or individuals. It turns everyday responsibilities into an engaging medieval-themed role-playing game. Users complete "quests" (tasks), earn virtual currency and experience points (XP), customize their avatars, and level up their characters in a fun and motivating environment. It leverages a powerful backend to persist all data and includes unique features like an **Asset Library** full of pre-made content and an **AI Studio** powered by Google Gemini to help administrators generate new quests and items, making world-building a breeze.

## Table of Contents
- [✨ Features](#-features)
- [🗺️ Roadmap](#️-roadmap)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Installation and Running](#️-installation-and-running)

## ✨ Features

-   **Standardized Quest Interactions:** All quests in every view (Dashboard, Calendars, Quest Board) now use a unified interaction model. Click any quest to open a detailed pop-up with "Complete" and "To-Do" options, ensuring a consistent user experience.
-   **Venture Prioritization:** Users can mark one-time "Ventures" as a "To-Do" item, which highlights them visually and sorts them to the top of all lists.
-   **Dynamic Calendar:** The calendar views now intelligently display not only scheduled "Duties" but also any "Ventures" that are due, required, or marked as a "To-Do" item.
-   **Unified Completion Flow:** The "Complete" button now consistently opens a dialog where users can optionally add a note before finalizing the quest.
-   **Redesigned Chronicles:** The history log has been redesigned into a clean, three-column layout for easier readability.
-   **Effortless Setup:** Get started instantly. The app comes pre-configured with a default `admin` account, bypassing any initial setup wizard.
-   **Direct Login:** The application starts on a master password screen, ensuring the game world is secure from the start.
-   **Fullscreen Toggle:** A new button in the header allows users to enter and exit fullscreen mode, perfect for tablet and kiosk use.
-   **Enhanced Security & Login:** Features persistent login sessions, a quick user-switching bar, and configurable PIN/password requirements for different user roles.
-   **Flexible Image Support:** The app supports standard web image formats, including `PNG`, `JPG`, `GIF`, `SVG`, and modern `WebP` files. Admins can manage a local image gallery by simply dropping files into an `uploads` folder, and the app automatically categorizes them by filename for easy use.
-   **Secure AI-Powered Features:** Includes an "AI Studio" for generating quests, items, trophies, and more, powered by a secure backend proxy using the Gemini API.
-   **Advanced Calendar:** Features interactive Month, Week, and Day views for better planning and task management.
-   **Gamified Task Management:** Create recurring "Duties" and one-time "Ventures" with customizable rewards and penalties.
-   **Character Progression & Virtual Economy:** Earn XP to gain Ranks and multiple currencies to spend in a customizable Marketplace.
-   **Avatar Customization:** Unlock and equip different cosmetic items using uploaded images.
-   **Guild System:** Create groups for collaborative tasks with their own separate economy and quests.
-   **Trophy & Theming Systems:** Unlockable trophies for milestones and various visual themes to change the app's look and feel.
-   **Robust Admin Controls & Data Persistence:** A "Donegeon Master" role with full control over the game, with all data saved to a server.
-   **Full Backup & Restore:** Admins can download a complete backup of the entire game state and restore it.

## 🗺️ Roadmap

Here is the planned development path for Task Donegeon, prioritized for the most impactful features first.

### Phase 1: Foundational Features & Quality of Life
This phase focuses on high-impact improvements for admins and players that enhance the core experience.

-   **Backend Authentication:** Implement JWT-based authentication to secure all backend API endpoints.
-   **Enhanced Security:** A comprehensive security audit and implementation of best practices like strict input validation, Content Security Policy (CSP), and secure headers.
-   **Quest Bundles:** Group quests into "Quest Chains" or "Storylines." This allows admins to create multi-step adventures.
-   **Showcase Page:** A public profile page for each explorer to showcase their avatar, earned trophies, and key stats.
-   **Advanced Object Manager:** Implement bulk editing, quick duplication, and powerful filtering/sorting for all game objects.
-   **Improved Progress Page:** A more detailed summary of user activity, highlighting strengths and areas for improvement with visual charts.

### Phase 2: Core Gameplay & Personalization
This phase introduces major new creative outlets and systems for deeper engagement.

-   **Theme Creator:** An admin tool to create and edit custom visual themes (colors, fonts, etc.) that can be sold in a market.
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

### Option 4: Portainer Deployment
1.  In Portainer, go to **Stacks** > **+ Add stack**.
2.  **Name** it `task-donegeon`.
3.  **Paste** the contents of `docker-compose.yml` into the Web editor.
4.  Switch to **Advanced mode** for **Environment variables** and paste the following, replacing the placeholder values:
    ```env
    # Database Credentials
    POSTGRES_DB=taskdonegeon
    POSTGRES_USER=donegeon_master
    POSTGRES_PASSWORD=your_super_secret_password_here
    
    # Node Environment
    NODE_ENV=production

    # Storage Provider ('local' for Docker, 'supabase' for production)
    STORAGE_PROVIDER=local

    # Google Gemini API Key
    API_KEY=your_gemini_api_key_here
    ```
5.  **Deploy the stack**. The app will be available at `http://<your-server-ip>:3002`.

### Option 5: Production Deployment from Docker Hub
1.  Create a `.env` file with the required production variables.
2.  Run the application using the `docker-compose.prod.yml` file:
    ```bash
    docker-compose -f docker-compose.prod.yml up -d
    ```
    This command will pull the latest pre-built image from Docker Hub and run it, along with the database service. It is the recommended way to run the app on a server.