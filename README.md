# Task Donegeon

**Version:** 0.0.97

---

Task Donegeon is a gamified task and chore management application designed for families, groups, or individuals. It turns everyday responsibilities into an engaging medieval-themed role-playing game. Users complete "quests" (tasks), earn virtual currency and experience points (XP), customize their avatars, and level up their characters in a fun and motivating environment. It leverages a powerful backend to persist all data and includes unique features like an **Asset Library** full of pre-made content and an **AI Studio** powered by Google Gemini to help administrators generate new quests and items, making world-building a breeze.

## Table of Contents
- [✨ Features](#-features)
- [🗺️ Roadmap](#️-roadmap)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Installation and Running](#️-installation-and-running)

## ✨ Features

### What's New in Version 0.0.97 (July 23, 2025)
-   **Switched to SQLite Database:** The backend has been migrated from PostgreSQL to SQLite for radical simplicity, zero configuration, and ultimate portability in Docker environments.
-   **Simplified Docker Setup:** The entire deployment process is now streamlined into a single `docker-compose.yml` file with no external database dependencies.

### Core Features
-   **Full-featured In-App Chat:** A real-time chat system allows users to message each other directly within the app, with notifications for unread messages.
-   **Bulk Content Management:** Admins can now select multiple items on management pages to perform bulk actions like deleting or changing status.
-   **AI Image Generation Helper:** The Asset Manager now includes an AI prompt helper with links to free AI art generators to streamline asset creation.
-   **AI Studio:** The AI Studio, powered by Google Gemini, can generate ideas for quests, items, markets, trophies, and themes.
-   **Gamified Task Management:** Create recurring "Duties" and one-time "Ventures" with customizable rewards, deadlines, and penalties.
-   **Avatar Customization:** Unlock and equip different cosmetic items, now correctly reflected in the header and throughout the app.
-   **Full Backup, Restore, and Sharing:** Admins can download a complete backup, restore it, or create smaller "Blueprints" to share content with others.
-   **Data Synchronization:** Automatic data syncing keeps your application state consistent across all your devices.

## 🗺️ Roadmap

Here is the planned development path for Task Donegeon, prioritized for the most impactful features first.

-   **Conditional Market Opening:** Allow markets to open based on conditions like the day of the week, user rank, or quest completion.
-   **Quest Bundles:** Group quests into "Quest Chains" or "Storylines." This allows admins to create multi-step adventures.
-   **Showcase Page:** A public profile page for each explorer to showcase their avatar, earned trophies, and key stats.
-   **Advanced Object Manager:** Implement bulk editing, quick duplication, and powerful filtering/sorting for all game objects.
-   **User-Created Content:** A system allowing Explorers to design their own quests and items, then submit them to admins for approval.
-   **Game Map:** A visual map with unlockable locations. Traveling to a location could unlock new quests or markets.
-   **Mobile App / PWA:** Package the application as a Progressive Web App (PWA) for a native-like experience on mobile devices.

## 🛠️ Tech Stack

-   **Frontend:** React (with Hooks & Context API), TypeScript, Vite, TailwindCSS
-   **Backend:** Node.js with Express.js, **SQLite**, Google Gemini
-   **Deployment:** Docker

## 🚀 Getting Started

When you run the application for the first time, you will be prompted to create the first administrator account. This user will be the "Donegeon Master" with full control over the app. After the first run, the app will present a lock screen.

**Login as the administrator to unlock the app:**
-   Select your administrator account from the dropdown.
-   Enter the password you created during setup.

Once unlocked, other users can be created and can log in using the "Switch Profile" button with their PIN.

## ⚙️ Installation and Running

The recommended way to run Task Donegeon is with Docker and Docker Compose. This provides a simple, self-contained, and persistent setup.

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/mckayc/task-donegeon.git
    cd task-donegeon
    ```

2.  **Configure `.env` File:**
    -   Copy the provided `.env.example` file to a new file named `.env`.
    -   Open `.env` and fill in the required variables. At a minimum, you need to provide your **`API_KEY`** for Google Gemini if you want to use the AI features.

3.  **Create Directories for Persistent Storage:**
    Before running for the first time, create the local folders that Docker will use to store your data.
    ```bash
    mkdir uploads
    mkdir backend/data
    mkdir backend/backups
    ```
    *   `uploads`: Stores all uploaded images for game assets.
    *   `backend/data`: Stores the main `taskdonegeon.db` SQLite database file.
    *   `backend/backups`: Stores all server-side manual and automated backups.

4.  **Build and Run with Docker Compose:**
    ```bash
    docker-compose up --build -d
    ```
    -   The `--build` flag tells Docker to build the image from the `Dockerfile` the first time.
    -   The `-d` flag runs the container in detached mode (in the background).

5.  **Access the Application:**
    Open your web browser and navigate to `http://localhost:3002`.

Your data, uploads, and backups are now safely stored on your host machine in the folders you created, and they will persist even if you stop or restart the Docker container.
