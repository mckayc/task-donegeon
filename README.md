# Task Donegeon

**Version:** 0.0.28
**Last Updated:** 2023-10-28T10:00:00Z

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
- [🧪 Next Steps for Testing](#-next-steps-for-testing)


## ✨ Features

-   **Session-Based Master Lock:** The application is locked upon first visit and requires an admin password to unlock for the session, providing a strong security layer before any user profiles are accessible.
-   **Gamified Task Management:** Create recurring "Duties" and one-time "Ventures" with customizable rewards and penalties.
-   **Character Progression:** Users earn Experience Points (XP) to gain Ranks, from Novice to Grandmaster.
-   **Secure Admin Login:** The Donegeon Master account is always protected by a password, even when switching users, to prevent unauthorized access.
-   **Virtual Economy:** Earn multiple types of currency (e.g., Gold, Gems, Crystals) to spend in a customizable Marketplace.
-   **Avatar Customization:** Users can unlock and equip different cosmetic items for their personal avatars.
-   **Guild System:** Create groups for collaborative tasks. Guilds have their own separate economy and quests, perfect for managing family chores.
-   **Trophy & Achievement System:** Unlockable trophies for completing milestones, which can be awarded automatically or manually.
-   **Theming Engine:** Unlock and apply various visual themes to completely change the look and feel of the application.
-   **Robust Admin Controls:** A "Donegeon Master" role with full control over users, quests, rewards, game rules, and terminology.
-   **Data Persistence:** A full backend ensures all data is saved to a server, providing a consistent experience across sessions.
-   **Sharing & Backup:** Export and import game content (quests, markets, etc.) via "Blueprints," and create full data backups for peace of mind.

## 🛠️ Tech Stack

-   **Frontend:**
    -   React (with Hooks & Context API)
    -   TypeScript
    -   Vite
    -   TailwindCSS
-   **Backend:**
    -   Node.js with Express.js
    -   PostgreSQL
-   **Deployment:**
    -   Designed for Vercel (Frontend & Serverless Functions)
    -   Designed for Supabase (PostgreSQL Database)
    -   Docker support for self-hosting.

## 🚀 Getting Started

### Prerequisites
Before you begin, ensure you have the following installed or set up:
-   **Node.js:** v18 or later.
-   **npm:** (usually comes with Node.js).
-   **Git:** For cloning the repository.
-   **Docker & Docker Compose:** Required only for the Docker deployment option.
-   **Cloud Accounts:** Required only for the Vercel/Supabase option.
    -   A [Vercel](https://vercel.com) account.
    -   A [Supabase](https://supabase.com) account.
    -   A [GitHub](https://github.com) account.

---

## ⚙️ Installation and Running

### Option 1: Local Development (Recommended for contributing)
This setup runs the frontend and backend as separate processes, which is ideal for development.

1.  **Clone the Repository**
    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```
2.  **Set up the Database**
    You need a PostgreSQL database. You can install it locally or use a free tier from a cloud provider like Supabase. The easiest local method is using Docker:
    ```bash
    # This command runs a PostgreSQL container in the background
    docker run --name task-donegeon-db -e POSTGRES_PASSWORD=your_secret_password -p 5432:5432 -d postgres
    ```
    Your database connection string will be: `postgres://postgres:your_secret_password@localhost:5432/postgres`

3.  **Configure and Run the Backend**
    ```bash
    cd backend
    npm install

    # Create an environment file
    touch .env

    # Add your database connection string to the .env file
    # Example: DATABASE_URL=postgres://postgres:your_secret_password@localhost:5432/postgres
    echo "DATABASE_URL=your_database_connection_string" > .env

    # Start the backend server
    npm start
    ```
    The backend API will be running at `http://localhost:3001`.

4.  **Configure and Run the Frontend**
    In a new terminal, from the project's root directory:
    ```bash
    npm install
    npm run dev
    ```
    The frontend application will be available at `http://localhost:5173`. The Vite development server is configured to automatically proxy API requests to your backend.

### Option 2: Vercel & Supabase Deployment (Recommended for production)
This is the fastest way to get a live, publicly accessible version of your application.

1.  **Fork the Repository**
    Fork this project's repository to your own GitHub account.

2.  **Set up Supabase Project**
    -   Log in to your [Supabase dashboard](https://supabase.com/dashboard) and create a new project.
    -   Once the project is ready, go to **Project Settings** (the gear icon) > **Database**.
    -   Under **Connection string**, make sure the **URI** tab is selected.
    -   **Copy the entire, full connection string.** It is critical that you copy the whole value. It will start with `postgres://`.

    > <div style="border: 2px solid #FBBF24; background-color: #31271A; padding: 1rem; border-radius: 0.5rem;">
    >   <h4 style="color: #FBBF24; margin-top: 0;">⚠️ Critical Vercel Deployment Note</h4>
    >   You <strong>MUST</strong> use the pooled connection string from the <strong>URI</strong> tab for Vercel. Using the wrong string is the most common cause of deployment failure.
    >   <ul>
    >       <li>✅ <strong>Correct Hostname (from URI):</strong> <code>aws-0-us-east-1.pooler.supabase.com</code></li>
    >       <li>❌ <strong>Incorrect Hostname:</strong> <code>db.your-project-ref.supabase.co</code></li>
    >   </ul>
    >   If your app fails with a <code>getaddrinfo ENOTFOUND</code> error, it means you have used the incorrect hostname.
    > </div>

3.  **Create the Database Table**
    - This is a one-time setup step. In your Supabase project, go to the **SQL Editor** (it has a database cylinder icon).
    - In the query window, paste the following command:
      ```sql
      CREATE TABLE IF NOT EXISTS app_data (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL
      );
      ```
    - Click the **RUN** button. You should see a "Success" message. The application table is now ready.

4.  **Set up and Deploy on Vercel**
    -   Log in to your [Vercel dashboard](https://vercel.com/new) and click **Add New... > Project**.
    -   Import the repository you forked on GitHub.
    -   Vercel should automatically detect the project as a Vite application and set the build settings correctly.
    -   Expand the **Environment Variables** section. Add a new variable:
        -   **Name:** `DATABASE_URL`
        -   **Value:** Paste the **full and complete** connection string URI you copied from Supabase.
    -   Click **Deploy**.

Vercel will build and deploy your application. The `vercel.json` file in this repository tells Vercel how to handle API requests, routing them to the backend server. Your site will be live in a few minutes! After the first deployment, remember to **Redeploy** from the Vercel dashboard if you update your environment variables.

### Option 3: Docker Deployment (Recommended for self-hosting)
This method uses Docker Compose to build and run the application and its database in isolated containers.

1.  **Clone the Repository**
    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Create Environment File**
    Create a file named `.env` in the root of the project. This file will provide the credentials for the database container.
    ```bash
    touch .env
    ```
    Add the following content to the `.env` file, replacing the placeholder values:
    ```
    POSTGRES_USER=donegeon
    POSTGRES_PASSWORD=a_very_strong_password
    POSTGRES_DB=task_donegeon_db
    ```

3.  **Build and Run with Docker Compose**
    ```bash
    docker-compose up --build
    ```
    This command will:
    -   Build a production-ready Docker image for the application.
    -   Create and start a PostgreSQL container.
    -   Create and start the application container, connecting it to the database.
    
    The application will be available at `http://localhost:3001`. To stop the application, press `Ctrl+C` in the terminal and then run `docker-compose down`.

---
## 🧪 Next Steps for Testing

- **Cloud Deployment:** Follow the **Vercel & Supabase** guide. This is the quickest way to get a live version of the app to play with and share.
- **Local Changes:** Use the **Local Development** guide if you want to edit the code and see your changes instantly.
- **Self-Hosted Instance:** The **Docker** guide is perfect for running a complete, isolated version of the app and its database on your own machine.