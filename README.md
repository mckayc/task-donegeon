# Task Donegeon

**Version:** 0.0.99y

---

Task Donegeon is a gamified task and chore management application designed for families, groups, or individuals. It turns everyday responsibilities into an engaging medieval-themed role-playing game. Users complete "quests" (tasks), earn virtual currency and experience points (XP), customize their avatars, and level up their characters in a fun and motivating environment. It leverages a powerful backend to persist all data and includes unique features like an **Asset Library** full of pre-made content and a **Suggestion Engine** powered by Google Gemini to help administrators generate new quests and items, making world-building a breeze.

## Table of Contents
- [✨ Features](#-features)
- [🗺️ Roadmap](#️-roadmap)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Installation and Running](#️-installation-and-running)

## ✨ Features

### What's New in Version 0.0.99y (August 19, 2025)
-   **New "Journey" Quest Type:** The simple "Unlocks Next Quest" feature has been completely replaced by a new, powerful **Journey** quest type. Journeys are multi-stage adventures composed of multiple **checkpoints**.
-   **Dedicated Checkpoint Editor:** Admins can now create epic, multi-step quests using a new, intuitive dialog to add and manage checkpoints, each with its own description and unique rewards.
-   **Enhanced User Experience:** Journey quests feature a distinct purple UI, progress tracking in the header (e.g., "Checkpoint 1/5"), and mystery rewards for future checkpoints to keep players engaged.
-   **Full System Integration:** The new Journey type is fully supported by the AI Suggestion Engine for content creation and can be exported/imported via the Asset Pack system.

### Version History
-   **v0.0.54 (August 17, 2025):** The calendar's day and week views now correctly display the full time range for timed quests, making deadlines much clearer.
-   **v0.0.53 (August 15, 2025):** Renamed an asset pack to "Student's Daily Quest" and added new tech-related marketplace rewards.
-   **v0.0.52 (August 15, 2025):** Added a new default asset pack for a student's daily routine with screen-time rewards.
-   **v0.0.51 (August 8, 2025):** Fixed a UI inconsistency with the notification badge for pending approvals in the sidebar.
-   **v0.0.97 (July 23, 2025):** New "Vacation" Event Type, Calendar-Driven Vacations, Automatic Penalty Pausing, Streamlined Settings.
-   **v0.0.96 (July 22, 2025):** Default Quest Groups, AI-powered group suggestions, streamlined quest creation.
-   **v0.0.95 (July 22, 2025):** Smarter Suggestion Engine, powerful bulk editing for quests, enhanced collapsed sidebar with fly-out menus, and default quest categories.
-   **v0.0.94 (July 26, 2025):** Added default quest categories and improved the collapsed sidebar with expandable menus.
-   **v0.0.93 (July 25, 2025):** Implemented a purchase escrow system, integrated purchase requests into the Chronicles, and improved the login notification popup with a scrollbar and close button.
-   **v0.0.92 (July 24, 2025):** Added in-dialog Quest Group creation and made item titles on management pages clickable for quick editing.
-   **v0.0.91 (July 23, 2025):** Redesigned "Manage Goods" and "Manage Quests" pages with tabs, sorting, and search. Added a new "Quest Group" system for organization and bulk assignment.
-   **v0.0.90 (July 22, 2025):** **Smarter Asset Pack Importer:** The "Import from Library" feature was overhauled to intelligently compare local and remote files, preventing duplicate downloads and giving admins granular import control.
-   **v0.0.89 (July 21, 2025):** **Enhanced Chronicles:** The activity feed now displays the currency and amount spent for each item purchase, providing a clearer transaction history.
-   **v0.0.88 (July 20, 2025):** **Critical Docker Stability Fix:** Resolved a race condition that caused chat messages to not save and the app to become unresponsive in Docker environments. The data saving mechanism is now more robust, preventing server syncs from overwriting unsaved local changes and eliminating the frequent "Failed to fetch" errors.
-   **v0.0.87 (July 20, 2025):** **Calendar Day View Enhancement:** Added due date/time information for quests on the main 'Day' view of the calendar, improving at-a-glance scheduling clarity.
-   **v0.0.86 (July 19, 2025):** **Enhanced Reward Valuation Helper:** The helper text in the quest editor now shows both the anchor reward equivalent and the final "real-world" value (e.g., `(equals 5 💎 or $5.00)`), providing admins with clearer context for balancing the game's economy.
-   **v0.0.85 (July 19, 2025):** **Image Pack Importer:** A new feature has been added to the `Asset Manager` page, allowing administrators to dynamically import curated image packs directly from the project's GitHub repository. This keeps the main application lean while providing easy access to a library of high-quality images.
-   **v0.0.84 (July 19, 2025):** **Categorized Frontend Uploads:** The asset management workflow has been significantly improved. Admins can now specify a category when uploading an image from the `Asset Manager`, and the backend will automatically organize the file into a corresponding sub-folder.
-   **v0.0.83 (July 19, 2025):** **Durable Server-Side Backups:** The entire backup system has been overhauled for production-grade reliability. Backups are now saved directly on the server's file system, and automated backups run as a reliable server-side process.
-   **v0.0.82 (July 19, 2025):** **Login Notifications System & DM Announcements:** A comprehensive notification system has been added. Users now see a popup on login detailing new quest assignments, guild announcements from Donegeon Masters, trophies unlocked, and items pending approval. This feature can be toggled in a new "Notifications" section in the settings.
-   **v0.0.81 (July 19, 2025):** Revamped About Page, direct GitHub link, and a new Version History section.
-   **v0.0.80 (July 19, 2025):** UI Streamlining (Global Reward Display), Smarter Sticky Card Headers, Docker Chat Fix, Dashboard Cleanup.

### Core Features
-   **Full-featured In-App Chat:** A real-time chat system allows users to message each other directly within the app, with notifications for unread messages.
-   **Bulk Content Management:** Admins can now select multiple items on management pages to perform bulk actions like deleting or changing status.
-   **AI Image Generation Helper:** The Asset Manager now includes an AI prompt helper with links to free AI art generators to streamline asset creation.
-   **New Default Marketplaces:** Added a bank for currency exchange, an experience shop, and a candy store, complete with new items.
-   **Suggestion Engine Enhancements:** The asset generator now distinguishes between creating "Duties" and "Ventures" and can generate up to 20 ideas at once.
-   **Expanded Trophy Collection:** Added over 30 new default trophies for users to earn.
-   **Complete Theme Editor Overhaul:** Redesigned with a live preview, more fonts, and granular controls for colors and sizes.
-   **Enhanced Calendar Views:** Day view now has two columns (Duties/Ventures), and Week/Month "Chronicles" views are fully functional.
-   **Guild-Specific Themes:** Guilds can now have their own unique, lockable themes when in "Guild View".
-   **Profile Picture Uploads:** Users can upload their own profile pictures for a more personalized avatar.
-   **Automated Backups:** Configure automated local backups to run at set intervals, ensuring data safety.
-   **Numerous UI/UX Improvements:** Including a redesigned PIN pad, scrollable dashboard sections, improved quest board sorting, and more customization options like editable sidebar link names.
-   **Market Controls:** Admins can now set markets to "Open" or "Closed" status, controlling their visibility in the Marketplace.
-   **Data Synchronization:** Automatic data syncing keeps your application state consistent across all your devices.
-   **AI-Powered Content Generation:** The Suggestion Engine, powered by Google Gemini, can generate ideas for quests, items, markets, trophies, and themes.
-   **Gamified Task Management:** Create recurring "Duties", one-time "Ventures", and multi-step "Journeys" with customizable rewards, deadlines, and penalties.
-   **Avatar Customization:** Unlock and equip different cosmetic items, now correctly reflected in the header and throughout the app.
-   **Full Backup, Restore, and Sharing:** Admins can download a complete backup, restore it, or create smaller "Blueprints" to share content with others.

## 🗺️ Roadmap

Here is the planned development path for Task Donegeon, prioritized for the most impactful features first.

### Phase 1: Foundational Features & Quality of Life
This phase focuses on high-impact improvements for admins and players that enhance the core experience.

-   **Conditional Market Opening:** Allow markets to open based on conditions like the day of the week, user rank, or quest completion.
-   **Backend Authentication:** Implement JWT-based authentication to secure all backend API endpoints.
-   **Enhanced Security:** A comprehensive security audit and implementation of best practices like strict input validation, Content Security Policy (CSP), and secure headers.
-   **Showcase Page:** A public profile page for each explorer to showcase their avatar, earned trophies, and key stats.
-   **Advanced Object Manager:** Implement bulk editing, quick duplication, and powerful filtering/sorting for all game objects.
-   **Improved Progress Page:** A more detailed summary of user activity, highlighting strengths and areas for improvement with visual charts.

### Phase 2: Core Gameplay & Personalization
This phase introduces major new creative outlets and systems for deeper engagement.

-   **User-Created Content:** A system allowing Explorers to design their own quests and items, then submit them to admins for approval. This fosters creativity and allows the game world to be co-created by its members.
-   **Reward R------ END OF FILE README.md ------ START OF FILE vercel.json ------ START OF FILE vercel.json ---

{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/backend/server.js" }
  ]
}--- START OF FILE vercel.json ---

{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/backend/server.js" }
  ]
}