# Task Donegeon

**Version:** 0.4.19

---

Task Donegeon is a gamified task and chore management application designed for families, groups, or individuals. It turns everyday responsibilities into an engaging medieval-themed role-playing game. Users complete "quests" (tasks), earn virtual currency and experience points (XP), customize their avatars, and level up their characters in a fun and motivating environment. It leverages a powerful backend to persist all data and includes unique features like an **Asset Library** full of pre-made content and a **Suggestion Engine** powered by Google Gemini to help administrators generate new quests and items, making world-building a breeze.

## Table of Contents
- [✨ Features](#-features)
- [🗺️ Roadmap](#️-roadmap)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Installation and Running](#️-installation-and-running)

### What's New in Version 0.4.19 (October 17, 2025)
-   **Global Condition Sets:** Administrators can now create multiple Condition Sets and apply them globally with a new "Apply Globally" toggle. These sets are combined with `AND` logic and apply to all quests and markets, allowing for powerful, layered rules (e.g., "Weekend Hours" AND "Holiday Event"). A persistent banner on management pages provides clear context when global rules are active.

### What's New in Version 0.4.18 (October 16, 2025)
-   **Quest Group Editor Fix:** Resolved a critical bug where changes made in the "Edit Quest Group" dialog would not save correctly if only the group's name or description was modified. The data synchronization logic has been corrected to ensure all changes are reliably persisted.
-   **Updated Help Guide:** The in-app Help Guide has been thoroughly updated to reflect the latest application features and specifications, including a more detailed explanation of the streamlined quest group management workflow.

### What's New in Version 0.4.10 (October 15, 2025)
-   **Smarter, More Personal AI Teacher:** The AI Teacher is now a more effective and engaging tutor.
    -   **Personalized Content:** The AI now uses the user's "About Me" and private "Admin Notes" to create relevant analogies and examples, making lessons more relatable.
    -   **Handles Questions:** The AI can now gracefully handle interruptions. If a user asks a question, it will pause its lesson, provide a clear answer, and then seamlessly resume teaching.
    -   **Lesson Summaries:** After a user successfully passes the final quiz, the AI provides a concise, bulleted summary of the key takeaways from the session to reinforce learning.

### What's New in Version 0.4.06 (October 14, 2025)
-   **Revamped Kiosk Mode:** Kiosk Mode has been completely re-engineered to be a persistent, device-specific setting.
    -   **Admin Activation:** An admin can now log into any device, open their profile dropdown, and use a "Kiosk Mode" toggle to turn that specific device into a permanent kiosk.
    -   **Persistent State:** Once enabled, a device will always boot directly to the shared user selection screen, surviving reloads and new sessions.
    -   **Clearer Logout:** On kiosk devices, a dedicated "Kiosk" button appears in the header, providing an intuitive way for users to log out and return the device to the shared screen.
    -   **Cleanup:** All old URL-based (`/kiosk`) logic has been removed for a cleaner, more robust implementation.

### What's New in Version 0.4.05 (October 13, 2025)
-   **Flexible Manual Adjustments:** The "Manual Adjustment" dialog for users has been completely overhauled. Instead of a restrictive dropdown, administrators can now grant rewards, apply setbacks, and award a trophy all in a single, streamlined action, making it much easier to handle special occasions like birthdays.
-   **New Birthday Trophies:** Added 16 new manually-awarded trophies to celebrate user birthdays for every age from 5 to 20.

### What's New in Version 0.4.04 (October 12, 2025)
-   **New Full-Screen AI Teacher UI:** Replaced the small AI Teacher side panel with a full-screen, two-column "Activity Panel." This provides a more immersive and standardized experience that can accommodate future media types like videos or documents. The left column contains the AI avatar and chat history, while the right serves as a dedicated user interaction workspace.
-   **Smarter AI Teaching Loop:** Overhauled the AI's system instructions to follow a "Teach, Check, Feedback" loop. The AI is now required to ask a multiple-choice question after teaching a concept, which makes the learning process more effective and guarantees that the interactive choice buttons appear frequently and reliably.

### What's New in Version 0.4.03 (October 11, 2025)
-   **Robust AI Teacher Choices:** Re-architected the AI Teacher's multiple-choice feature to use Gemini's "Tool Calling" functionality. This replaces the old, fragile string-parsing method with a reliable, structured data approach, ensuring interactive buttons now appear consistently.

### What's New in Version 0.4.02 (October 10, 2025)
-   **AI Teacher Button Fix:** Resolved an issue where the multiple-choice buttons in the AI Teacher chat were not responding to clicks. Users can now interact with the choices as intended.

### What's New in Version 0.4.01 (October 9, 2025)
-   **Simplified Kiosk Mode Entry:** Removed the dedicated "Enter Kiosk Mode" button from the login page. A new "Enter Kiosk Mode" toggle is now available directly on the main App Lock screen for administrators.
-   **Default Item Approval:** All newly created goods/items now require administrator approval by default to ensure better control over the game economy.

### What's New in Version 0.4.0 (October 8, 2025)
-   **Enhanced AI Teacher with Quizzes & Timers:** The AI Teacher feature has been transformed into a full learning module.
    -   **Proactive Start & In-Chat Quizzes:** The AI is now more interactive, proactively starting conversations and asking questions mid-lesson to check for understanding.
    -   **Optional Learning Timer:** Admins can now set a minimum learning time for "AI Teacher" quests. A timer appears in the chat, and users must complete it before they can take the final quiz.
    -   **Final Quiz for Completion:** A new "I'm ready for the quiz" button appears (enabled after any required time is met), which prompts the AI to generate a 3-question quiz based on the conversation. Users must pass this quiz (2/3 correct) before the main "Complete Quest" button becomes enabled, ensuring a structured and effective learning experience.

### What's New in Version 0.3.02 (October 7, 2025)
-   **AI Teacher Chat UI:** Implemented the full chat interface for the AI Teacher feature. The panel now supports a real-time, back-and-forth conversation with the Gemini-powered AI, complete with a message history, typing indicators, and user avatars, all connected to the new stateful backend API.

### What's New in Version 0.3.01 (October 6, 2025)
-   **AI Teacher UI Scaffolding:** Implemented the frontend scaffolding for the AI Teacher feature. Admins can now designate a quest with an "AI Teacher" media type. This makes a new "AI Teacher" button appear in the quest details, which opens a placeholder panel for the future chat interface.

### What's New in Version 0.3.0 (October 5, 2025)
-   **AI Teacher Foundation:** Implemented the backend foundation for the new "AI Teacher" feature. This includes new, stateful API endpoints to manage interactive chat sessions with the Gemini API, laying the groundwork for personalized, quest-based learning conversations.

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
-   **Maintenance Release:** Incremented version and updated the service worker to ensure all users receive the latest updates.

### What's New in Version 0.1.90 (September 23, 2025)
-   **"My Pending Items" Dashboard Widget:** Added a new card to the dashboard showing items awaiting approval.
-   **Pending Items Header Notification:** A new bell icon in the header now displays a badge with a count of pending items.

### What's New in Version 0.1.49 (August 26, 2025)
-   **Mobile Responsiveness:** Implemented a fully responsive design for mobile devices.
-   **Data Integrity & Reset Fixes:** Resolved critical issues where core game elements would disappear after a full data reset.

### What's New in Version 0.0.99y (August 19, 2025)
-   **New "Journey" Quest Type:** Replaced "Unlocks Next Quest" with a multi-stage **Journey** quest type.
-   **Dedicated Checkpoint Editor:** Admins can now create multi-step quests using a new dialog to manage checkpoints.

### What's New in Version 0.0.80 (July 19, 2025)
-   Initial public version.