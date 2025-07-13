# Task Donegeon

**Version:** 0.0.34
**Last Updated:** 2023-10-29T12:00:00Z

---

Task Donegeon is a gamified task and chore management application designed for families, groups, or individuals. It turns everyday responsibilities into an engaging medieval-themed role-playing game. Users complete "quests" (tasks), earn virtual currency and experience points (XP), customize their avatars, and level up their characters in a fun and motivating environment.

## Table of Contents
- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
- [⚙️ Installation and Running](#️-installation-and-running)
  - [Option 1: Local Development (Recommended for contributing)](#option-1-local-development-recommended-for-contributing)
  - [Option 2: Vercel & Supabase Deployment (Recommended for production)](#option-2-vercel--supabase-deployment-recommended-for-production)
  - [Option 3: Docker Deployment (Recommended for self-hosting)](#option-3-docker-deployment-recommended-for-self-hosting)
  - [Option 4: Portainer Deployment (Self-hosting with a UI)](#option-4-portainer-deployment-self-hosting-with-a-ui)

## ✨ Features

-   **Session-Based Master Lock:** The application is locked upon first visit and requires an admin password to unlock for the session, providing a strong security layer before any user profiles are accessible.
-   **AI-Powered Asset Library:** Use the Gemini API to automatically generate themed quests and market items to quickly populate your game world.
-   **Hybrid File Storage:** Supports local file storage for Docker development and Supabase cloud storage for production deployments.
-   **Gamified Task Management:** Create recurring "Duties" and one-time "Ventures" with customizable rewards and penalties.
-   **Character Progression:** Users earn Experience Points (XP) to gain Ranks, from Novice to Grandmaster.
-   **Virtual Economy:** Earn multiple types of currency (e.g., Gold, Gems, Crystals) to spend in a customizable Marketplace.
-   **Avatar Customization:** Users can unlock and equip different cosmetic items using uploaded images.
-   **Guild System:** Create groups for collaborative tasks. Guilds have their own separate economy and quests, perfect for managing family chores.
-   **Trophy & Achievement System:** Unlockable trophies for completing milestones, which can be awarded automatically or manually.
-   **Theming Engine:** Unlock and apply various visual themes to completely change the look and feel of the application.
-   **Robust Admin Controls:** A "Donegeon Master" role with full control over users, quests, rewards, game rules, and terminology.
-   **Data Persistence:** A full backend ensures all data is saved to a server, providing a consistent experience across sessions.
-   **Sharing & Backup:** Export and import game content (quests, markets, etc.) via "Blueprints," and create full data backups for peace of mind.

## 🛠️ Tech Stack

-   **Frontend:** React (with Hooks & Context API), TypeScript, Vite, TailwindCSS
-   **Backend:** Node.js with Express.js, PostgreSQL
-   **AI:** Google Gemini API
-   **Deployment:** Docker, Vercel (Frontend & Serverless Functions), Supabase (Database & Storage)

## 🚀 Getting Started

### Prerequisites
-   **Node.js:** v18 or later.
-   **npm:** (usually comes with Node.js).
-   **Git:** For cloning the repository.
-   **Docker & Docker Compose:** Required for Docker/Portainer deployment.
-   **Google Gemini API Key:** Required for the AI Asset Library feature. Get one at [Google AI Studio](https://aistudio.google.com/app/apikey).
-   **Cloud Accounts:** Required for the Vercel/Supabase option (Vercel, Supabase, GitHub).

---

## ⚙️ Installation and Running

### Option 1: Local Development
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
    - `DATABASE_URL`: `postgres://postgres:your_secret_password@localhost:5432/postgres`
    - `API_KEY`: Your Google Gemini API Key.
    - `STORAGE_PROVIDER`: `local`

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
        -   `API_KEY`: Your Google Gemini API Key.
        -   `STORAGE_PROVIDER`: `supabase`
        -   `SUPABASE_URL`: Your Supabase project URL (from **Project Settings > API**).
        -   `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase `service_role` key (from **Project Settings > API**).
    -   Click **Deploy**.

### Option 3: Docker Deployment
1.  **Clone the Repository**.
2.  **Configure `.env` File:** Copy `.env.example` to `.env` and set all variables.
    -   `POSTGRES_PASSWORD`: A strong, unique password.
    -   `API_KEY`: Your Google Gemini API Key.
    -   `STORAGE_PROVIDER`: `local`
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

    # Gemini API Key (Required for Asset Library)
    API_KEY=your_google_gemini_api_key_here

    # Storage Provider ('local' for Docker, 'supabase' for production)
    STORAGE_PROVIDER=local
    ```
5.  **Deploy the stack**. The app will be available at `http://<your-server-ip>:3002`.