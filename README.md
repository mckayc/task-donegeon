# Task Donegeon

**Version:** 0.1.71

---

Task Donegeon is a gamified task and chore management application designed for families, groups, or individuals. It turns everyday responsibilities into an engaging medieval-themed role-playing game. Users complete "quests" (tasks), earn virtual currency and experience points (XP), customize their avatars, and level up their characters in a fun and motivating environment. It leverages a powerful backend to persist all data and includes unique features like an **Asset Library** full of pre-made content and a **Suggestion Engine** powered by Google Gemini to help administrators generate new quests and items, making world-building a breeze.

## Table of Contents
- [✨ Features](#-features)
- [🗺️ Roadmap](#️-roadmap)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Installation and Running](#️-installation-and-running)

## ✨ Features

### What's New in Version 0.1.71 (September 9, 2025)
-   **Robust File Pathing Fix:** Resolved a stubborn avatar display issue by replacing all hardcoded absolute paths in the backend with dynamically resolved paths. This ensures the server can reliably locate and serve uploaded files (avatars, assets) and the database, regardless of the deployment environment.

### What's New in Version 0.1.70 (September 8, 2025)
-   **Avatar Display Fix:** Resolved an issue where uploaded avatar images would appear broken in the development environment due to a missing server proxy configuration for media files.

### What's New in Version 0.1.69 (September 7, 2025)
-   **Avatar System Simplification:** The avatar system has been streamlined. It no longer uses a layered system for equipped items and instead displays a single, user-uploaded profile picture. This resolves display issues and simplifies the user experience.
-   **Optimized Avatar Resizing:** The image cropper now resizes uploaded photos to a web-friendly 512x512 pixels, significantly reducing file sizes for faster performance and less storage usage.

### What's New in Version 0.1.68 (September 6, 2025)
-   **Avatar Upload Optimization:** Cropped avatar uploads are now saved as JPEGs instead of PNGs, resulting in significantly smaller file sizes and faster uploads.
-   **Avatar Display Fix:** Resolved an issue where uploaded profile pictures would sometimes appear as broken images. The avatar component now correctly handles rendering custom profile pictures alongside equipped items.
-   **Reliable Picture Removal:** Fixed a bug where the "Remove Picture" button would not work reliably. It now correctly clears the user's profile picture on the first click.

### What's New in Version 0.1.67 (September 5, 2025)
-   **Avatar Upload Fix:** Resolved a race condition that could cause avatar uploads to intermittently fail after cropping. The upload process is now more reliable.
-   **Admin Avatar Editing:** Administrators can now edit and manage user avatars directly from the "Edit User" dialog, including uploading new images, selecting from the gallery, and removing pictures.

### What's New in Version 0.1.66 (September 4, 2025)
-   **Consistent Mobile Management Pages:** Applied the responsive card layout, previously on the "Manage Quests" page, to all other management pages (Users, Items, Markets, Trophies, etc.). This creates a unified, touch-friendly experience for administrators on mobile devices.

### What's New in Version 0.1.65 (September 3, 2025)
-   **PWA Update Reliability:** Fixed a critical issue where the application would show an error page after an update. The service worker now correctly takes control of the page, ensuring a smooth and reliable update process without asset loading errors.

### What's New in Version 0.1.64 (September 2, 2025)
-   **Version Bump:** Incremented application version number to trigger update notifications.

### What's New in Version 0.1.63 (September 1, 2025)
-   **Responsive Manage Quests Page:** The "Manage Quests" page is now fully responsive. It will display a data table on desktop for efficient management and automatically switch to a touch-friendly card view on mobile devices for a better user experience. Bulk selection and actions are supported in both views.

### What's New in Version 0.1.62 (August 31, 2025)
-   **Service Worker Update Reliability:** Overhauled the service worker registration and update detection logic to eliminate a race condition. The application will now reliably show an "Update Available" notification when a new version is ready to be installed.

### What's New in Version 0.1.61 (August 30, 2025)
-   **New Enhanced Number Input:** Replaced all standard number input fields throughout the application with a custom stepper component. This new component features increment/decrement buttons, supports rapid changes by holding the buttons, and allows for easier direct text entry, resolving a long-standing issue with deleting the first digit in a number.

### What's New in Version 0.1.60 (August 29, 2025)
-   **Version Update:** Incremented application version number to prepare for upcoming features.

### What's New in Version 0.1.52 (August 28, 2025)
-   **Mobile Sidebar Scrolling:** Fixed a bug where the mobile sidebar menu would not scroll properly when sections were expanded, making some links inaccessible.
-   **Improved Number Inputs:** Corrected an issue where the first digit of a number could not be deleted in various reward and XP input fields across the application, improving the content editing experience.

### What's New in Version 0.1.50 (August 27, 2025)
-   **UI Opacity Adjustments:** Made several UI overlays, such as the header and chat panel, fully opaque to improve readability and provide a more solid feel. The mobile sidebar overlay is also now darker to improve focus on the menu.

### What's New in Version 0.1.49 (August 26, 2025)
-   **Mobile Responsiveness:** Implemented a fully responsive design. The application now adapts its layout for mobile devices, featuring an off-canvas sidebar, a condensed header, and touch-friendly card-based views on management pages to ensure a great user experience on any screen size.
-   **View Mode Switcher:** Added a manual toggle in the header to switch between mobile and desktop views, facilitating testing and improving usability on tablets.

### What's New in Version 0.1.40 (August 26, 2025)
-   **Data Integrity & Reset Fixes:** Resolved critical issues where core game elements like the default Guild, Exchange Market, and Explorer Chronicles would disappear after a full data reset. The system now correctly re-initializes these essential components.
-   **Revamped Asset Pack Importer:** Improved the asset pack import process. The import dialog now provides a clearer preview of all assets within the pack, including quests, markets, items, and trophies. It also includes a "select all" checkbox for easier bulk importing.
-   **Enhanced Setback Rules:** Added more granular control over setbacks in the "Game Rules" settings. Admins can now globally disable setbacks or choose to only apply them if quests are incomplete at the end of the day ("Forgive Late Setbacks").
-   **UI Polish in Settings:** Cleaned up the UI in the "Game Rules" section to prevent text from overlapping, improving readability.

### Version History
-   **v0.0.99y (August 19, 2025):**
    -   **New "Journey" Quest Type:** The simple "Unlocks Next Quest" feature has been completely replaced by a new, powerful **Journey** quest type. Journeys are multi-stage adventures composed of multiple **checkpoints**.
    -   **Dedicated Checkpoint Editor:** Admins can now create epic, multi-step quests using a new, intuitive dialog to add and manage checkpoints, each with its own description and unique rewards.
    -   **Enhanced User Experience:** Journey quests feature a distinct purple UI, progress tracking in the header (e.g., "Checkpoint 1/5"), and mystery rewards for future checkpoints to keep players engaged.
    -   **Full System Integration:** The new Journey type is fully supported by the AI Suggestion Engine for content creation and can be exported/imported via the Asset Pack system.
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
-   **v0.0.80 (July 19, 2025):** Initial public version.

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
-   **Reward R-- END OF FILE README.md --