# Task Donegeon

**Version:** 0.0.51
**Last Updated:** 2025-05-30T11:00:00Z

---

Task Donegeon is a gamified task and chore management application designed for families, groups, or individuals. It turns everyday responsibilities into an engaging medieval-themed role-playing game. Users complete "quests" (tasks), earn virtual currency and experience points (XP), customize their avatars, and level up their characters in a fun and motivating environment. It leverages a powerful backend to persist all data and includes unique features like an **Asset Library** full of pre-made content and an **AI Studio** powered by Google Gemini to help administrators generate new quests, items, and images, making world-building a breeze.

## Table of Contents
- [✨ Features](#-features)
- [🗺️ Roadmap](#️-roadmap)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Installation and Running](#️-installation-and-running)

## ✨ Features

-   **Bug Fixes & Stability:** Fixed various UI bugs and missing icons across the application for a more stable and consistent user experience.
-   **AI Image Generation:** Admins can generate images for items from prompts within the Asset Manager and directly in the item editing dialog. A global image style can be set in the AI Studio for a consistent look.
-   **Refactored Architecture:** The application's state management has been refactored from a single context into multiple, focused contexts for better scalability and maintainability.
-   **Enhanced UI/UX:** Features improved loading states, engaging empty state components, standardized confirmation dialogs, and a new user onboarding wizard.
-   **Selective Asset Library:** A large, built-in library of pre-made quests and items with a new dialog for selective, checkbox-based importing.
-   **Secure AI-Powered Features:** Includes an "AI Studio" for generating quests, items, trophies, and images, all powered by a secure backend proxy.
-   **Advanced Calendar:** Features interactive Month, Week, and Day views for better planning and task management.
-   **Refreshed UI:** A complete overhaul of the sidebar icons for a modern, consistent look.
-   **Session-Based Master Lock:** The application is locked upon first visit and requires an admin password to unlock for the session.
-   **Gamified Task Management:** Create recurring "Duties" and one-time "Ventures" with customizable rewards and penalties.
-   **Character Progression & Virtual Economy:** Earn XP to gain Ranks and multiple currencies to spend in a customizable Marketplace.
-   **Avatar Customization:** Unlock and equip different cosmetic items using uploaded or AI-generated images.
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

### Prerequisites
-   **Node.js:** v18 or later.
-   **npm:** (usually comes with Node.js).
-   **Git:** For cloning the repository.
-   **Google Gemini API Key:** Required for all AI features. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).
-   **Docker & Docker Compose:** Required for Docker/Portainer deployment.
-   **Cloud Accounts:** Required for the Vercel/Supabase option (Vercel, Supabase, GitHub).

---

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