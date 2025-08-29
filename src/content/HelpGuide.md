# Welcome to the {appName} Help Guide

This guide is the single source of truth for how {appName} works. It's designed to be a comprehensive resource for both players ({users}) and administrators ({admin}s). The terminology used here (like "{task}", "{group}", etc.) is dynamic and will always match what you've configured in the Settings page.

## Table of Contents

---

## The Basics: Core Concepts

Understanding these fundamental concepts is key to mastering {appName}.

### Roles: Who's Who?
Every member of your {group} has a role that defines what they can do:
- **{admin}:** The game administrator. They can create and manage all users, {tasks}, {stores}, {groups}, and settings. They have the ultimate authority.
- **{moderator}:** A helper role. They can approve or reject {task} completions, assisting the {admin} in managing the game's day-to-day activity.
- **{user}:** The standard player role. They complete {tasks}, earn {points}, and customize their character.

### Personal vs. {group} Mode
The app has two primary contexts, which you can switch between using the dropdown in the header:
- **Personal Mode:** This is your individual space. {tasks} you complete here add to your personal balances of currency and XP. You can spend this personal currency in personal {stores}.
  _Example: A personal {task} might be "Read a chapter of a book" or "Practice piano for 30 minutes"._
- **{group} Mode:** When you switch to a {group}, you'll see {tasks} and {stores} specific to that group. Rewards earned here go into your balance for that specific {group}, creating a separate economy. This is perfect for family chores or group projects.
  _Example: A {group} {task} might be "Help clean the kitchen after dinner" or "Rake the leaves in the yard"._

### The Three {task} Types
All tasks fall into one of three categories:
- **{recurringTasks}:** These are repeating tasks that happen on a schedule. They are great for building habits. For {recurringTasks} with a specific time, you can set a **Due Time** (the deadline) and an optional **Incomplete Time** (the final cutoff). The time between these two appears on the calendar as a colored "late period" to show the grace period before penalties are applied.
  _Example: "Take out the trash every Tuesday" or "Make your bed every morning"._
- **{singleTasks}:** These are one-time tasks or projects. They can be completable once, or have a certain number of available "slots" for multiple people to complete.
  _Example: "Organize the garage" (completable once) or "Help wash the car" (could have 2 slots)._
- **{journeys}:** These are epic, multi-step adventures. Each {journey} is made of several 'checkpoints' that must be completed in order.
  _Example: A "Book Report" {journey} might have checkpoints like "Read the Book", "Write the Draft", and "Finalize the Report"._

---

## An Adventurer's Guide (Player View)

This section covers the pages that all players will use, accessible from the sidebar.

### {link_dashboard}
Your main hub. This is the first page you see after logging in. It gives you a quick overview of your progress and what you need to do.
- **{level} Card:** Shows your current {level}, total XP, and progress toward the next {level}.
- **Inventory Card:** Displays your current balances for all types of {currency} and {xp}.
- **Latest {award} Card:** Showcases the most recent {award} you've earned.
- **Leaderboard:** A friendly competition showing the top XP earners for the current mode (Personal or {group}).
- **My Pending Items:** When you have {tasks} or purchases awaiting approval from an {admin}, a new card will appear here showing a list of everything you're waiting on. You can also see a summary of pending items by clicking the new bell icon (🔔) in the header.
- **Quick Actions:** A list of **all** your most urgent and available {tasks} for easy access. The {task} cards here use the same visual system (colors, borders, animations) as the main {link_quests} page for consistency. This list is scrollable if you have many active {tasks}.
- **Recent Activity:** A summary of recent events from the last **7 days**, showing up to **50 items** (or all of today's events, if there are more than 50).
- **Weekly Progress:** A chart showing how much XP you've earned over the last seven days.

### {link_quests}
This is your main {task} board. It shows all available {tasks} for your current mode (Personal or {group}).
- **Filtering:** You can filter the view to see all {tasks} or just specific types like {recurringTasks} or {singleTasks}.
- **{task} Cards:** Each card gives you a summary of the {task}, including its rewards and deadlines.
- **To-Do:** {singleTasks} can be marked as a "To-Do". These will appear on your {link_calendar} for today and are sorted with higher priority on the {link_quests} page.

### {link_calendar}
A calendar view of your scheduled life.
- **Events View:** Shows {recurringTasks} on their scheduled days, {singleTasks} on their due dates, and special events created by the {admin}. You can also see user birthdays.
- **{history} View:** See a log of all past activities, such as completed {tasks} and earned {points}. This is a read-only view of your history.

### {link_marketplace}
The central hub for all {stores}. Here you can browse different {stores} to spend your {points}.
- **{store} Cards:** Each card represents a different {store} created by the {admin}. Some may only be open under certain conditions (e.g., on weekends, or after you've reached a certain {level}).
- **Exchange Post:** A special, default {store} that allows you to exchange one type of {point} for another, based on the values set by the {admin}.

### {link_avatar}
Customize your character's appearance.
- **Avatar Preview:** A large view of your current avatar.
- **Profile Picture:** You can upload a custom image to serve as your profile picture. This image will be layered underneath any equipped avatar items.

### {link_collection}
View all the non-avatar items you've purchased or earned.
- **Item Cards:** Each card shows an item you own, its description, and the quantity you possess.
- **"Use" Button:** If an item is a consumable (e.g., a potion that gives you a bonus), a "Use" button will appear, allowing you to consume it.

### {link_guild}
View details about the {groups} you are a member of.
- **Member List:** See all members of the {group}. Clicking a member shows you their public profile.
- **Treasury:** View the currency and items held collectively by the {group}.
- **Interactions:** From here you can initiate gifts or trades with other {group} members.

### {link_progress}
A detailed breakdown of your performance.
- **Stat Cards:** At-a-glance totals for your XP and the number of different {task} type you've completed.
- **Charts:** See your XP gains over the past week and month to track your progress over time.

### {link_ranks}
See the full hierarchy of {levels} in the game.
- **Your Current {level}:** A large card at the top shows your current {level}, icon, and a progress bar to the next {level}.
- **Full {level} List:** A list of every {level} from Novice to the highest rank, showing the XP required to achieve each one.

### {link_trophies}
Your personal trophy case.
- **Earned {awards}:** A gallery of all the {awards} you've unlocked, showing when you earned them.
- **Available {awards}:** A list of all the {awards} you have yet to earn. For automatic {awards}, it will show the requirements you need to meet.

### {link_chronicles}
Your complete activity log. This page provides a detailed, filterable history of everything you and others have done that pertains to you in the current game mode.

### {link_chat}
A real-time chat client to communicate with other members of your {group}(s).
- **Direct Messages:** Have one-on-one conversations with other users.
- **{group} Halls:** Each {group} has its own chat room for all members.
- **Announcements:** {admin}s can send special, highlighted announcements in {group} chats.

### My Profile (from Header)
Edit your personal and account details.
- **Account Info:** Change your name, username, email, and other personal details.
- **Security:** Set or change your PIN (for easy profile switching) and your password.

---

## The Admin's Toolkit ({admin}/{moderator} View)

This section details the powerful management tools available to administrators.

### Asset Management Actions: Edit, Clone, Delete
-   **Editing:** To modify an existing asset, you can typically click on its name in the table or use an "Edit" button (often represented by a ✏️ icon).
-   **Cloning:** To quickly create a new asset based on an existing one, use the "Clone" button (usually a 📄 icon). This is a great time-saver.
-   **Deleting:** To permanently remove an asset, use the "Delete" button (a 🗑️ icon).
-   **Bulk Actions:** All management tables feature checkboxes. You can select multiple items to perform actions on them simultaneously, such as **Delete**, **Mark Active**, or **Bulk Edit**.

### {link_approvals}
This is the central queue for all actions that require an admin's attention.
- **{task} Completions:** Approve or reject {tasks} that users have submitted for verification.
- **Purchase Requests:** Approve or reject requests for items that are configured to require approval.
- **Trade Offers:** View, accept, or reject trade offers sent to you by other users.

### User Management
- **{link_manage_users}:** Add, edit, or delete members. The "Adjust" button allows for manual adjustments to a user's currency, XP, or manually awarded {awards}.
- **{link_manage_guilds}:** Create, edit, or delete {groups}.
- **{link_triumphs_trials}:** Define "Triumphs" (positive effects) and "Trials" (negative effects) that can be manually applied to users. Also includes a full history of all applied modifiers.

### Content Management
- **{link_manage_quests}:** The master list of all {tasks}. You can create, edit, delete, and clone {tasks}. This page includes search, sorting, and filtering tools. For convenience, the rewards for each {task} are displayed directly in the main list, giving you a quick overview of your game's economy.
- **{link_manage_quest_groups}:** Organize your {tasks} into logical groups for easier management and bulk assignment.
- **{link_manage_rotations}:** Create automated schedules that rotate a specific set of {tasks} among a specific group of users.
- **{link_manage_items}:** Manage all "Game Assets," which are the items that can be bought in {stores}.
- **{link_manage_markets}:** Design and manage your {stores}.
- **{link_manage_rewards}:** Define the types of {currency} and {xp} that exist in your game.
- **{link_manage_ranks}:** Create the progression ladder for your game by defining the different {levels}.
- **{link_manage_trophies}:** Design the {awards} that users can earn.
- **{link_manage_events}:** Schedule special, time-limited events that appear on the calendar.

### System Tools
- **{link_suggestion_engine}:** (AI Studio) Use Google's Gemini AI to generate creative ideas for any game asset.
- **{link_asset_manager}:** Upload and manage all image files used in the game.
- **{link_asset_library}:** Import pre-made content packs into your game.
- **{link_backup_import}:** Your main data management hub for backups, restores, and sharing content "Blueprints".
- **{link_appearance} & {link_themes}:** Access the Theme Editor to create and customize new visual themes.
- **{link_settings}:** The master control panel for the entire application.

### Developer Tools
- **{link_bug_tracker}:** A built-in tool for tracking bugs, feedback, and feature requests.
- **{link_test_cases}:** A page for running automated tests to verify that core application features are working.

---

## Functional Specifications

This section serves as the definitive source of truth for the application's intended functionality.

### {link_approvals} Page Responsiveness
The {link_approvals} page is fully responsive to provide an optimal experience on any device.
-   **Desktop View:** On larger screens, the page displays a comprehensive table for each approval type (Quests, Claims, Purchases, Trades). This view is optimized for reviewing many items at once and performing quick actions.
-   **Mobile View:** On mobile devices, the page automatically switches to a touch-friendly card layout. Each pending item is displayed on its own card within a categorized section. For Quests and Claims, you can tap the main body of the card to view the full details of the {task} before making a decision. Quick actions to approve or reject are available directly on each card.

### {task} Card Visual System
To provide at-a-glance information, all {task} cards (on the {link_quests} page, Dashboard, Kiosk Mode, etc.) share a consistent visual system.

#### Background Colors
Each {task} type has a unique background color to make it easily distinguishable. These colors are based on the current theme.
-   `{recurringTask}:` Blueish background (`bg-sky-900/30`)
-   `{singleTask}:` Amber/Orange background (`bg-amber-900/30`)
-   `{journey}:` Purple background (`bg-purple-900/30`)

#### Dimmed States
{tasks} that are not currently actionable are dimmed to de-emphasize them.
-   **Completed:** Any {task} that has been completed for the day will remain on screen but appear dimmed.
-   **Incomplete:** Any `{recurringTask}` that is past its final "Incomplete Time" for the day will be dimmed.

#### Border Colors & Animations
The border of a {task} card indicates its urgency and status.
-   `Solid Border:` Indicates the {task} is **required**.
-   `Dashed Border:` Indicates the {task} is **optional**.
-   `Green Border:` The {task} is due in **more than 2 hours**.
-   `Yellow Border:` The {task} is due in **1-2 hours**.
-   `Orange Border (Pulsing):` The {task} is due in **less than 1 hour**. This animation draws attention to its urgency.
-   `Red Border (Pulsing):` The {task} is **past its due time** but can still be completed before it is marked incomplete.
-   `Black Border:` The {task} is now **incomplete** for the day and cannot be completed (applies mainly to {recurringTasks} with an `endTime`).

#### Time Display
-   **Time Remaining:** For {tasks} with a deadline, the card will show the time remaining (e.g., "Due in: 2d 3h", "Due in: 45m").
-   **Absolute Date:** The full due date and time is also shown for clarity (e.g., "Due: Sep 20, 2025, 5:00 PM").
-   **Past Due:** If a {task} is past its due time but still completable, the text will turn red and show "Past Due" or, if applicable, the time remaining until it is marked "Incomplete" (e.g., "Incomplete in: 30m").
-   **No Deadline:** {tasks} without a specific deadline will show "No due date".

### Shared / Kiosk Mode
**Purpose:** This mode is for shared family devices. It provides a fast user-switching interface and can automatically log users out after a period of inactivity.

**How it Works:**
- When enabled, logging out or clicking "Exit" in the header goes to a Kiosk screen. This screen defaults to a calendar view of today's available {tasks} for each selected user.
- The header displays avatars and **usernames** for quick login. It also has icons to switch between the **Calendar View** (🗓️) and the **Leaderboard View** (📊).
- The calendar view is categorized into "{recurringTasks}" and "{singleTasks} & {journeys}" for each user to improve clarity.
- {task} cards in Kiosk Mode use the same visual border system as the main {link_quests} page, providing at-a-glance status information.
- **Updating:** When an application update is available, a toast notification will appear at the bottom-left of the screen. Additionally, a persistent "Update" icon (an arrow pointing down into a tray) will appear in the header. Clicking either of these will install the update.
- **Pending Notifications:** If a user has items awaiting approval, a red notification badge will appear on their avatar in the header.

#### {task} Visibility in Kiosk Mode
A {task} will only appear in Kiosk Mode if it is relevant for **today**. It must meet one of the following criteria:
-   A **{recurringTask}** scheduled to run today.
-   A **{singleTask}** or **{journey}** whose start date is today.
-   A **{singleTask}** that the user has manually marked as a "To-Do".
-   An optional, dateless **{singleTask}** that is configured with a daily completion limit. These now appear automatically without needing to be a "To-Do".

**Completing {tasks} in Kiosk Mode:**
- If enabled, users can click a {task} to open its detail view and complete it.
- If **"Require PIN for quest completion"** is enabled, the user must enter their PIN to confirm. Otherwise, the {task} is completed immediately.

### {link_triumphs_trials}
**Purpose:** This system allows {admin}s to apply immediate or temporary effects to users, either as a reward ({triumph}) or a consequence ({trial}). This is ideal for handling situations that fall outside the normal {task} system, like rewarding exceptional behavior or enforcing house rules.

**How it Works:**
The `Manage Triumphs & Trials` page is split into three sections:
1.  **Definitions:** Here, {admin}s create reusable templates for Triumphs and Trials. A definition includes a name, icon, and one or more **effects**.
2.  **Active Modifiers:** This section lists any **duration-based** effects that are currently active on a user (e.g., a 24-hour market closure).
3.  **Modifier Application History:** This is a comprehensive, paginated log of **every** Triumph and Trial that has ever been applied to any user. It provides a complete audit trail of all manual adjustments. You can control how many items are shown per page and navigate through the history.

**Types of Effects:**
There are two main types of effects, and they behave very differently:
-   **Instantaneous Effects:** These are one-time actions that happen immediately and are finished.
    -   **Examples:** `Grant Rewards`, `Deduct Rewards`.
    -   **Behavior:** When a Triumph/Trial with only these effects is applied, it does **not** create a persistent "Active Modifier". Instead, the user's balances are adjusted instantly, and a single entry is created in the `{history}` log to record what happened.

-   **Duration-Based Effects:** These are ongoing effects that last for a specific period.
    -   **Examples:** `Close Market`, `Open Market`, `Market Discount`.
    -   **Behavior:** When a Triumph/Trial containing any of these effects is applied, it **does** create an "Active Modifier" that is tracked in the "Active Modifiers" list until it expires. The `{history}` is still updated to inform the user that the effect has started.

### {link_chronicles}
**Purpose:** The {history} provides a comprehensive log of all significant actions within the application for motivational and auditing purposes.

#### Dashboard "Recent Activity" Widget
-   **Time-Limited:** Shows activity from the last **7 days**.
-   **Count-Limited:** Displays up to **50 events**, or **all events from today** if that number is greater than 50.

#### What Creates a {history} Event?
The system logs every significant step in a process to provide a clear audit trail.
-   **Quest Completion:** Records when a {task} is completed, approved, or rejected.
-   **Quest Claiming:** Logs when a {task} is claimed, unclaimed, or has its claim approved/rejected.
-   **Quest To-Do:** Logs when a {task} is marked as a To-Do or removed from the To-Do list.
-   **Purchase:** Logs when an item purchase is requested, approved, rejected, or cancelled from a {store}.
-   **Trophy Awarded:** Appears when a user unlocks a new {award}.
-   **Admin Adjustment:** Shows when an {admin} manually gives or takes away {points}.
-   **Admin Asset Management:** Logs when an {admin} creates or deletes assets (e.g., {tasks}, users, items).
-   **Gift Received:** Records when a user receives a gift.
-   **Trade:** Logs the initiation, update, and completion of trades.
-   **Exchange:** Logs when a user exchanges currencies at the Exchange Post.
-   **Crafting:** Appears when a user crafts a new item.
-   **Triumph/Trial:** Logs when an {admin} applies a Triumph or Trial to a user.
-   **System:** Logs automated system actions, such as applying {negativePoints}.

#### {history} Consolidation Logic
To prevent clutter, some admin actions are consolidated.
-   **Consolidate:** If an {admin} creates or deletes multiple assets of the same type in a row (e.g., creating 5 {tasks}), it will be grouped into a single {history} entry, like `Created 5 {tasks}`. The action "chain" is broken if the {admin} performs a different type of action.
-   **Do NOT Consolidate:** All other user-facing actions are logged individually. For example, if a user marks a {task} as a to-do, completes it, an admin rejects it, the user completes it again, and an admin approves it, you will see **5 distinct {history} entries** for that {task}.
-   **Full Audit Trail:** Multi-step processes are now logged at each stage to provide a complete history. For example, when an item is purchased:
    -   A `{history}` entry is created when the user first **requests** the item.
    -   A *new, separate* `{history}` entry is created when an {admin} **approves** or **rejects** the request, or when the user **cancels** it.

#### Richer {history} UI
- **Clearer Purchase UI:** To prevent confusion, the cost of a purchase is only shown on the initial "Requested" event. Subsequent "Completed" events show a confirmation message, and "Rejected" or "Cancelled" events show an explicit refund.
- **Visual Purchase Context:** Purchase events now show the specific item's image instead of a generic icon, falling back to the {store}'s icon if no image is available.

### Quest Claiming
**Purpose:** The "Claim" feature prevents multiple {users} from working on the same single-person {task}.

**Admin Setup:**
- In the "Create/Edit Quest" dialog, a **"Requires Claim Before Starting"** toggle is available for {singleTasks} and {journeys}.
- A **"Claim Limit"** can be set (default is 1).

**User Workflow:**
1.  A {user} clicks **"Claim {task}"** in the detail view. Their request is sent for approval.
2.  The {task} now shows as "Claimed by [User]" for others. The "Claim" button is disabled if the limit is reached.
3.  {admin}s see the request in the **"Pending Claims"** tab on the {link_approvals} page.
4.  If approved, the claiming {user} is notified and can now complete the {task}. Completing it releases their claim.
5.  If rejected, the claim is removed and the slot becomes available.
6.  An {admin} can **"Force Unclaim"** a {task} from the "Manage Quests" page to clear all pending/approved claims.

### Bug Tracker
**Purpose:** A tool for `{admin}`s to systematically track bugs, feedback, and feature requests.

**How it Works:**
- A reporting bar at the bottom of the screen allows you to start recording a session.
- During a session, it logs navigation, state changes, and optionally, user clicks and element details.
- {admin}s can add manual notes, use a special "picker" to identify specific UI elements, and even enable temporary server-side logging for deep debugging.
- All reports are managed on the **{link_bug_tracker}** page, where they can be tagged, commented on, and have their status updated.
- A bug report can be converted into a new {task} with a single click, automatically populating the {task} description with the bug's details.

### UI Components and Controls
- **Number Inputs:** The number input fields throughout the app (used for setting rewards, costs, etc.) have been enhanced.
    - The input field is now wide enough to display at least 4 digits clearly.
    - You can click the `+` and `-` buttons to increment or decrement the value.
    - You can **click and hold** the `+` or `-` buttons to rapidly change the value after a short delay, making it faster to adjust numbers significantly.

---

## Appendix: Version History

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