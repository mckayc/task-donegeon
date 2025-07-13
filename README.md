# Task Donegeon

**Version:** 0.0.15
**Last Updated:** 2023-10-27T12:00:00Z

---

Task Donegeon is a gamified task and chore management application designed for families, groups, or individuals. It turns everyday responsibilities into an engaging medieval-themed role-playing game. Users complete "quests" (tasks), earn virtual currency and experience points (XP), customize their avatars, and level up their characters in a fun and motivating environment.

## ✨ Features

-   **Gamified Task Management:** Create recurring "Duties" and one-time "Ventures" with customizable rewards and penalties.
-   **Character Progression:** Users earn Experience Points (XP) to gain Ranks, from Novice to Grandmaster.
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

## 🚀 Setup & Deployment

This project is configured for a seamless deployment on Vercel with a Supabase database.

### 1. Supabase (Database)

1.  Create a new project on [Supabase](https://supabase.com).
2.  Navigate to **Project Settings > Database**.
3.  Under **Connection string**, copy the URI. This will be your `DATABASE_URL`.

### 2. Vercel (Hosting)

1.  Create a new project on [Vercel](https://vercel.com) and connect it to your Git repository.
2.  In the Vercel project settings, go to **Environment Variables**.
3.  Add a new variable:
    -   **Name:** `DATABASE_URL`
    -   **Value:** Paste the connection string from Supabase.
4.  To ensure API requests are routed correctly, create a `vercel.json` file in the root of your project with the following content:

    ```json
    {
      "rewrites": [
        { "source": "/api/(.*)", "destination": "/backend/server.js" }
      ]
    }
    ```
5.  Deploy the project. Vercel will automatically build the frontend, deploy the backend server as a serverless function, and connect them.

### Local Development

#### Frontend
```bash
# In the root directory
npm install
npm run dev
```

#### Backend
```bash
# In the /backend directory
cd backend
npm install

# Create a .env file in the /backend directory
# Add your DATABASE_URL to it:
# DATABASE_URL=postgres://...

# Run the backend server
npm start
```

---
*This README was generated to reflect the current state of the application.*
