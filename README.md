# Task Donegeon

**Version:** 0.2.01

---

Task Donegeon is a gamified task and chore management application designed for families, groups, or individuals. It turns everyday responsibilities into an engaging medieval-themed role-playing game. Users complete "quests" (tasks), earn virtual currency and experience points (XP), customize their avatars, and level up their characters in a fun and motivating environment. It leverages a powerful backend to persist all data and includes unique features like an **Asset Library** full of pre-made content and a **Suggestion Engine** powered by Google Gemini to help administrators generate new quests and items, making world-building a breeze.

## Table of Contents
- [✨ Features](#-features)
- [🗺️ Roadmap](#️-roadmap)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Installation and Running](#️-installation-and-running)

### What's New in Version 0.2.01 (October 4, 2025)
-   **Simplified Kiosk Button:** Moved the Kiosk button to the main header, next to the fullscreen icon, and simplified the label to "Kiosk" for easier access on `/kiosk` URLs.

### What's New in Version 0.2.0 (October 3, 2025)
-   **Return to Kiosk Mode:** Added a "Return to Kiosk" button to the user profile dropdown when using the app via the `/kiosk` URL. This provides a clear and intuitive way for users to end their session and return to the shared user selection screen.

### What's New in Version 0.1.99 (October 2, 2025)
-   **Critical Kiosk Security Fix:** Patched a major security flaw where the Kiosk Mode page (`/kiosk`) could be accessed without authentication in a new session (e.g., an incognito window). The application now correctly enforces the master `AppLockScreen` as the primary gatekeeper before any other content is rendered.
-   **Kiosk Login Flow Fixed:** Resolved a critical bug where logging in from the Kiosk Mode screen would incorrectly redirect users to the main login page instead of their dashboard. The user login flow from the shared view is now seamless and correct.
-   **Robust Kiosk State Management:** The logout process is now path-aware. Logging out from a Kiosk device correctly returns the user to the Kiosk selection screen, while logging out from a normal session correctly locks the application, preventing state confusion and fixing hard-refresh bugs.

### What's New in Version 0.1.98 (October 1, 2025)
-   **New URL-Based Kiosk Mode:** Kiosk Mode has been re-architected to be more robust and reliable. It is no longer a device-specific state but is now accessed via a dedicated URL (`/kiosk`). This eliminates all state management bugs related to toggling the mode on and off.
-   **Simplified Admin UI:** The "Enable/Disable Kiosk Mode" toggle and "Exit" button have been removed from the admin profile dropdown to create a cleaner, more intuitive interface. Admins now simply navigate to the `/kiosk` URL on a device to set it up for shared use.
-   **Updated Documentation:** The in-app Help Guide and project README have been updated to reflect the new, simpler Kiosk Mode functionality.

### What's New in Version 0.1.97 (September 30, 2025)
-   **Kiosk Mode State Management Fix:** Resolved a core state management issue where logging into a Kiosk-enabled device would incorrectly disable its Kiosk setting. The application now correctly distinguishes between the session's view (personal vs. shared) and the device's persistent Kiosk Mode setting, ensuring the UI for administrators is always correct.

### What's New in Version 0.1.96 (September 29, 2025)
-   **Kiosk Mode Logic Fix:** Corrected a logical flaw where an administrator logged into a Kiosk-enabled device would see an "Exit" button and an "Enable Kiosk Mode" option instead of the correct "Disable Kiosk Mode" toggle. The UI now correctly reflects the device's state.

### What's New in Version 0.1.95 (September 28, 2025)
-   **Revamped Kiosk Mode Activation:** The "Enter Kiosk Mode" button has been removed from the public login page. Administrators now enable Kiosk Mode for a specific device directly from their profile dropdown menu, providing a more secure and intuitive workflow.
-   **Full-Width Kiosk Header Scrolling:** The entire header in Kiosk Mode is now horizontally scrollable on mobile devices. This ensures all controls and user avatars are always accessible, even on very narrow screens.

### What's New in Version 0.1.94 (September 27, 2025)
-   **Per-Device Kiosk Mode:** Kiosk/Shared Mode is now a device-specific setting. The global setting enables the feature, and a new "Enter Kiosk Mode" button on the login screen allows any permitted device to enter this view. A device will remain in Kiosk Mode until a user explicitly logs in.
-   **Mobile Header Fix:** The user selection area in the Kiosk Mode header is now horizontally scrollable on mobile devices, ensuring all user avatars and the "Switch User" button are always accessible.

### What's New in Version 0.1.93 (September 26, 2025)
-   **Mobile-Friendly Approvals:** The Approvals page is now fully responsive. On mobile devices, it displays a touch-friendly card view for each pending item (Quests, Claims, Purchases, and Trades), making it easier for administrators to manage approvals on the go.
-   **Interactive Approval Cards:** Quest and Claim approval cards on mobile are now clickable, opening a full detail dialog so admins can review the requirements before approving.

### What's New in Version 0.1.92 (September 25, 2025)
-   **Kiosk Mode Pending Notifications:** The shared Kiosk Mode header now displays a notification badge on a user's avatar if they have items (quests or purchases) awaiting approval, providing an immediate visual cue without requiring login.
-   **Backend Optimizations:** Added a new, more efficient backend endpoint to fetch pending item counts for multiple users at once, improving performance for the Kiosk Mode view.

### What's New in Version 0.1.91 (September 24, 2025)
-   **Maintenance Release:** Incremented application version number and updated the service worker to ensure all users receive the latest application updates correctly. This release also includes several internal bug fixes to improve build stability and correct data access patterns on the Quests and Management pages.

### What's New in Version 0.1.90 (September 23, 2025)
-   **"My Pending Items" Dashboard Widget:** A new card has been added to the {link_dashboard} that provides a consolidated, at-a-glance view of all your submitted {tasks} and purchases that are awaiting administrator approval.
-   **Pending Items Header Notification:** A new bell icon (🔔) in the header now displays a badge with a count of your pending items. Clicking it opens a dropdown for a quick overview.
-   **Clearer Transaction UI in {history}:** To prevent confusion, the {history} log now displays the cost of a purchase only on the initial "Pending" event. Subsequent "Completed" or "Approved" events no longer repeat the cost, and "Rejected" or "Cancelled" events explicitly show a refund.
-   **Richer Purchase Logging:** Item purchases in the {history} log now display the specific item's image instead of a generic icon. If no item image is available, it defaults to the icon of the {store} where it was purchased.

### What's New in Version 0.1.89 (September 22, 2025)
-   **Full Audit Trail for {history}:** The {history} system has been updated to provide a complete audit trail for multi-step actions. Instead of updating a single log entry, the system now creates a new, separate entry for each step, such as "Requested," "Approved," "Rejected," or "Cancelled," ensuring a full and transparent history of all transactions.
-   **Updated Help Guide:** The in-app {link_help_guide} has been updated to document the new, more detailed logging behavior.

### What's New in Version 0.1.88 (September 21, 2025)
-   **Enhanced Chronicle Logging:** Fixed an issue where creating new items ({link_manage_items}) and making purchases from a {store} were not being recorded. These events will now correctly appear in the {history} log.
-   **UI Fix:** Added "Admin Asset Management" to the default filters on the {history} page so that events related to creating and deleting assets are visible by default.
-   **Updated Help Guide:** The in-app {link_help_guide} has been updated to document the new logging events.

### What's New in Version 0.1.87 (September 20, 2025)
-   **Enhanced Number Input:** Fixed a bug in the number input component where holding down the increment/decrement buttons would not accelerate the value change. The component now correctly handles click-and-hold for rapid adjustments.
-   **UI Fix:** Increased the default width of the number input to prevent numbers with four or more digits from being cut off.
-   **Updated Help Guide:** The in-app {link_help_guide} has been updated to document the number input's functionality.

### What's New in Version 0.1.86 (September 19, 2025)
-   **Enhanced Time-Remaining Display:** All quest cards across the app ({link_quests} page, Dashboard, and Kiosk Mode) now show detailed time-remaining information. This includes days, hours, and minutes until a {task} is due.
-   **Smarter Deadline Logic:** The quest card display now intelligently switches to show the time remaining until a {task} is marked "Incomplete" if it's past its initial due time.
-   **Clearer Due Dates:** Alongside the time remaining, cards also display the absolute due date and time for better planning.
-   **Updated Help Guide:** The in-app {link_help_guide} has been updated to fully document the new time-remaining display system.

### What's New in Version 0.1.85 (September 18, 2025)
-   **Self-Healing Backup System:** Fixed a critical issue where old automated backups would accumulate indefinitely if their parent schedule was edited or deleted. The system now automatically finds and deletes these "orphaned" backup files, ensuring that storage is managed correctly and preventing uncontrolled disk usage.

### What's New in Version 0.1.84 (September 17, 2025)
-   **Consistent Quest Card Styling:** The "Quick Actions" widget on the Dashboard now uses the same detailed styling as the main Quests page, including dynamic, color-coded borders to indicate due dates and status for a more consistent user experience.
-   **Slower "Due Soon" Animation:** The pulsing animation for quest cards that are due soon has been slowed down to be less jarring.

### What's New in Version 0.1.83 (September 16, 2025)
-   **Visible Quest Rewards:** The "Manage Quests" page now includes a "Rewards" column in the table view and displays rewards directly on the quest cards in mobile view, making it much easier for administrators to see the rewards for each quest at a glance.

### What's New in Version 0.1.77 (September 15, 2025)
-   **Enhanced Chronicles System:** The `{history}` system has been overhauled to be more comprehensive and intelligent.
    -   **New Event Logging:** The system now logs a wider range of activities, including when a {task} is marked as a "To-Do," when an exchange is made, and when a Triumph or Trial is applied.
    -   **Consolidated Admin Logs:** To keep the `{history}` clean, consecutive creations or deletions of the same asset type by an {admin} are now grouped into a single, consolidated log entry (e.g., "Created 5 {tasks}").
    -   **More Robust Logging:** All user-facing actions are now logged individually to provide a complete audit trail.
-   **Smarter Dashboard Widget:** The "Recent Activity" widget on the Dashboard now shows events from the last **7 days** and displays up to **50 items** or all of today's events, whichever is greater, giving a more comprehensive recent overview.
-   **Updated Documentation:** The in-app `{link_help_guide}` has been thoroughly updated with these new specifications, ensuring it remains the definitive source of truth for the application's functionality.

### What's New in Version 0.1.76 (September 14, 2025)
-   **No Cap on Quick Actions:** The "Quick Actions" widget on the Dashboard now displays all available quests for the user, rather than being capped at 10. The list is scrollable if many quests are available.
-   **Kiosk Mode Logic Update:** Optional, dateless `{singleTasks}` (Ventures) that can be completed daily will now automatically appear for all assigned users in Kiosk Mode, without needing to be manually marked as a "To-Do".
-   **Updated Documentation:** The in-app Help Guide has been updated to reflect these new functional specifications.

### What's New in Version 0.1.75 (September 13, 2025)
-   **Functional Specification UI Overhaul:** Implemented the full set of UI and behavior requirements from Bug Report #bug-1756437.
-   **Consistent Background Colors:** Quest cards now have consistent, distinct background colors based on their type ({recurringTask}, {singleTask}, {journey}) across all parts of the application.
-   **Time-Sensitive Border System:** Quest card borders now dynamically change color and animate based on their deadline proximity:
    -   `Green:` More than 2 hours until due.
    -   `Yellow:` 1-2 hours until due.
    -   `Orange (pulsing):` Less than 1 hour until due.
    -   `Red (pulsing):` Past due.
    -   `Black:` Marked as incomplete for the day (for {recurringTasks}).
-   **Dimmed States:** Quests that are completed for the day or past their "incomplete" time are now visually dimmed to de-emphasize them.
-   **Updated Documentation:** The in-app Help Guide has been updated to fully document this new, detailed visual system.

### What's New in Version 0.1.74 (September 12, 2025)
-   **Maintenance Release:** Incremented application version number and updated the service worker cache to ensure all users receive the latest application updates correctly.

### What's New in Version 0.1.73 (September 11, 2025)
-   **Visual Task State System:** Quest cards on the main Quest Board and in Kiosk Mode now use a color-coded and animated border system to indicate their status at a glance (e.g., Overdue, Due Soon, To-Do, Optional).
-   **Kiosk Mode Upgrades:** The Kiosk Mode calendar view has been enhanced. It now features the new visual border system for quests and re-introduces categorization, separating quests into "{recurringTasks}" and "{singleTasks} & {journeys}" for better clarity.
-   **Functional Specification Documentation:** Re-established and updated the `HelpGuide.md` file to serve as the definitive source of truth for all application functionality, including the new visual quest state system.

### What's New in Version 0.1.72 (September 10, 2025)
-   **Kiosk Mode Reward Display:** The shared Kiosk Mode calendar view now displays the rewards for each available quest, giving users a better at-a-glance understanding of their potential earnings.

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
-   **Data Integrity & Reset Fixes:** Resolved critical issues where core game elements like the default Guild, Exchange Market, and Explorer Chronicles would disappear after a full data reset. The system now correctly re-initializes these essential components.
-   **Revamped Asset Pack Importer:** Improved the asset pack import process. The import dialog now provides a clearer preview of all assets within the pack, including quests, markets, items, and trophies. It also includes a "select all" checkbox for easier bulk importing.
-   **Enhanced Setback Rules:** Added more granular control over setbacks in the "Game Rules" settings. Admins can now globally disable setbacks or choose to only apply them if quests are incomplete at the end of the day ("Forgive Late Setbacks").
-   **UI Polish in Settings:** Cleaned up the UI in the "Game Rules" section to prevent text from overlapping, improving readability.

### Version History
-   **v0.0.99y (August 19, 2025):**
    -   **New "Journey" Quest Type:** The simple "Unlocks Next Quest" feature has been completely replaced by a new, powerful **Journey** quest type.
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
-   **v0.0.92 (July 24, 2025):** Added in-dialog Quest Group creation and made item titles on management pages clickable