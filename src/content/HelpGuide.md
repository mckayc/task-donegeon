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
- **Quick Actions:** A list of **all** your most urgent and available {tasks} for easy access. This list is scrollable if you have many active {tasks}.
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
- **{link_triumphs_trials}:** Define "Triumphs" (positive effects) and "Trials" (negative effects) that can be manually applied to users.

### Content Management
- **{link_manage_quests}:** The master list of all {tasks}. You can create, edit, delete, and clone {tasks}. This page includes search, sorting, and filtering tools.
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

### Shared / Kiosk Mode
**Purpose:** This mode is for shared family devices. It provides a fast user-switching interface and can automatically log users out after a period of inactivity.

**How it Works:**
- When enabled, logging out or clicking "Exit" in the header goes to a Kiosk screen. This screen defaults to a calendar view of today's available {tasks} for each selected user.
- The header displays avatars and **usernames** for quick login. It also has icons to switch between the **Calendar View** (🗓️) and the **Leaderboard View** (📊).
- The calendar view is categorized into "{recurringTasks}" and "{singleTasks} & {journeys}" for each user to improve clarity.
- {task} cards in Kiosk Mode use the same visual border system as the main {link_quests} page, providing at-a-glance status information.

#### {task} Visibility in Kiosk Mode
A {task} will only appear in Kiosk Mode if it is relevant for **today**. It must meet one of the following criteria:
-   A **{recurringTask}** scheduled to run today.
-   A **{singleTask}** or **{journey}** whose start date is today.
-   A **{singleTask}** that the user has manually marked as a "To-Do".
-   An optional, dateless **{singleTask}** that is configured with a daily completion limit. These now appear automatically without needing to be a "To-Do".

**Completing {tasks} in Kiosk Mode:**
- If enabled, users can click a {task} to open its detail view and complete it.
- If **"Require PIN for quest completion"** is enabled, the user must enter their PIN to confirm. Otherwise, the {task} is completed immediately.

### {link_chronicles}
**Purpose:** The {history} provides a comprehensive log of all significant actions within the application for motivational and auditing purposes. The dashboard widget shows the last 7 days of activity, while the main page is a full, filterable history.

**Event Breakdown:**
- **Quest Completion:** Records when a {task} is completed, approved, or rejected.
- **Purchase:** Logs when an item is purchased from a {store}.
- **Trophy Awarded:** Appears when a user unlocks a new {award}.
- **Admin Adjustment:** Shows when an {admin} manually gives or takes away {points}.
- **Gift Received:** Records when a user receives a gift.
- **Trade:** Logs the initiation, update, and completion of trades.
- **Crafting:** Appears when a user crafts a new item.
- **System:** Logs automated system actions, such as applying {negativePoints}.
- **Quest Claiming:** Logs the full lifecycle of a {task} claim (claimed, approved, cancelled, etc.).

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

---

## Appendix: Default Content

{appName} comes with a set of default content to get you started.

### Default Reward Types
- **Gold Coins (Currency):** Standard currency for item purchases.
- **Gems (Currency):** Premium currency for special rewards.
- **Crystals (Currency):** Common currency, often for smaller rewards.
- **Strength (XP):** Earned from physical tasks.
- **Diligence (XP):** Earned from careful work like cleaning.
- **Wisdom (XP):** Earned from learning activities.
- **Skill (XP):** Earned from practicing hobbies.
- **Creativity (XP):** Earned from artistic endeavors.

### Default Ranks
The app includes 50 default {levels}, from "Novice" to "The Absolute," each requiring an increasing amount of total XP to achieve.

### Default Quest Groups
- Household Chores, School & Learning, Personal Goals, Health & Wellness, Family & Social, Creative & Hobbies, Outdoor & Adventure, and Kindness & Service.