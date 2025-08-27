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
- **{recurringTasks}:** These are repeating tasks that happen on a schedule, like daily, weekly, or on specific dates of the month. They are great for building habits.
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
- **Quick Actions:** A list of your most urgent and available {tasks} for easy access.
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
- **Equipment Slots:** Browse the avatar items you own, sorted by equipment slot (e.g., 'hat', 'shirt'). Clicking an item equips it.

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
- **Stat Cards:** At-a-glance totals for your XP and the number of different {task} types you've completed.
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

### {link_approvals}
This is the central queue for all actions that require an admin's attention.
- **{task} Completions:** Approve or reject {tasks} that users have submitted for verification. You can add an optional note when approving or rejecting.
- **Purchase Requests:** Approve or reject requests for items that are configured to require approval.
- **Trade Offers:** View, accept, or reject trade offers sent to you by other users.

### User Management
- **{link_manage_users}:** Add new members, edit existing user details (including their role), or delete users. The "Adjust" button allows for manual adjustments to a user's currency, XP, or manually awarded {awards}.
- **{link_manage_guilds}:** Create, edit, or delete {groups}. You can manage group membership and assign a unique theme to each {group}.
- **{link_triumphs_trials}:** Define "Triumphs" (positive effects) and "Trials" (negative effects) that can be manually applied to users. These can grant/deduct rewards, open/close {stores}, or offer special discounts.

### Content Management
- **{link_manage_quests}:** The master list of all {tasks}. You can create, edit, delete, and clone {tasks}. This page also includes powerful search, sorting, and filtering tools.
- **{link_manage_quest_groups}:** Organize your {tasks} into logical groups (e.g., "Household Chores," "Schoolwork"). This makes them easier to manage and assign in bulk.
- **{link_manage_rotations}:** Create automated schedules that rotate a specific set of {tasks} among a specific group of users. Perfect for daily or weekly chore wheels.
- **{link_manage_items}:** Manage all "Game Assets," which are the items that can be bought in {stores} or earned as special rewards.
- **{link_manage_markets}:** Design and manage your {stores}. Each {store} can have a theme and be populated with specific items for sale.
- **{link_manage_rewards}:** Define the types of {currency} and {xp} that exist in your game. Each one can have a name, icon, and a "real world" value for economic balancing.
- **{link_manage_ranks}:** Create the progression ladder for your game by defining the different {levels} and the XP thresholds required to reach them.
- **{link_manage_trophies}:** Design the {awards} that users can earn, either automatically by meeting certain criteria or by being manually awarded by an {admin}.
- **{link_manage_events}:** Schedule special, time-limited events that appear on the calendar, such as "Bonus XP Weekends" or "{store} Sales."

### System Tools
- **{link_suggestion_engine}:** (AI Studio) Use Google's Gemini AI to generate creative ideas for any game asset. If you need a new {task} about kitchen chores or a new {award} for reading, the AI can provide a list of suggestions to get you started.
- **{link_asset_manager}:** Upload and manage all image files used in the game. It also includes an AI Image Prompt Helper to assist in creating art with external tools.
- **{link_asset_library}:** Import pre-made content packs, such as collections of {tasks} or items, directly into your game.
- **{link_backup_import}:** Your main data management hub.
  - **Backup:** Create and download a full backup of your entire application state.
  - **Restore:** Restore the application from a previously saved backup file.
  - **Export Blueprint:** Create smaller, shareable "Blueprint" files that contain only specific assets (e.g., just your chore {tasks}) to share with other {appName} users.
  - **Import Blueprint:** Import a Blueprint file shared by someone else.
- **{link_appearance} & {link_themes}:** Access the powerful Theme Editor to create and customize new visual themes for the application. You can also manage which themes are available to users.
- **{link_settings}:** The master control panel for the entire application. See the "System & Settings Reference" section for a full breakdown.

### Developer Tools
- **{link_bug_tracker}:** A built-in tool for tracking bugs and feature requests. You can start a recording session that logs all your actions, making it easy to reproduce issues.
- **{link_test_cases}:** A page for running automated tests to verify that core application features are working as expected after an update.

---

## AI Instructions

This section serves as the definitive source of truth for the application's intended functionality. All development and changes should adhere to the standards and behaviors documented here.

### {link_chronicles}

**Purpose:** The primary goal of the {history} is to provide a comprehensive log of all significant actions within the application.
- **For {users}:** It serves as a motivational tool, allowing them to see a clear history of their progress, achievements, and transactions.
- **For {admin}s:** It provides an audit trail to see what other administrators are doing and to monitor the progress and activities of all users in their scope.

**Locations & Views:**
The {history} are accessible in two main locations:
1.  **Dashboard ("Recent Activity"):** This widget on the main {link_dashboard} displays a user's most recent personal activity.
2.  **{history} Page:** A dedicated page with more powerful viewing options.
    -   **My Activity View:** This view shows all historical events for the currently logged-in user within their current scope (Personal or {group}).
    -   **All Activity View:** Available to {admin}s and {moderator}s, this view shows a combined feed of all user activities within the current scope.

**Functional Specification:**
- The **"Recent Activity"** widget on the {link_dashboard} and the **"My Activity"** view on the {history} page should display the **exact same information and event types**.
- The only functional difference is that the **"Recent Activity"** widget on the dashboard is limited to displaying events from the **last 7 days**.
- The main **{history} Page** is paginated, allowing users to browse through their entire history. It also features a powerful filtering system, allowing users to show or hide different types of events.

**Event Breakdown:**
Each entry in the {history} represents a specific event:
- **Quest Completion:** Records when a {task} is completed, approved, or rejected.
- **Purchase:** Logs when an item is purchased from a {store}.
- **Trophy Awarded:** Appears when a user unlocks a new {award}.
- **Admin Adjustment:** Shows when an {admin} manually gives or takes away {points} or {awards}.
- **Gift Received:** Records when a user receives a gift from another player.
- **Trade:** Logs the initiation, update, and completion of trades.
- **Crafting:** Appears when a user crafts a new item from a recipe.
- **System:** Logs automated system actions, such as applying {negativePoints} for overdue {tasks}.

**Visual Cues:**
The status of each event is color-coded for quick reference:
- `Green:` Indicates a positive or completed action (e.g., 'Approved', 'Completed', 'Awarded').
- `Yellow:` Indicates a pending action (e.g., 'Pending', 'Requested').
- `Red:` Indicates a negative action (e.g., 'Rejected', 'Setback').
- `Gray:` Indicates a neutral or cancelled action (e.g., 'Cancelled').

### Quest Claiming

**Purpose:** The "Claim" feature is designed for {singleTasks} and {journeys} to solve two main problems:
1.  **Preventing Redundant Work:** It stops {users} from starting a {task} that may no longer be necessary (e.g., "Take out the trash" when it has already been taken out).
2.  **Avoiding Overlap:** It prevents multiple {users} from working on the same single-person {task} simultaneously.

**Admin Setup:**
- In the "Create/Edit Quest" dialog, a new toggle switch labeled **"Requires Claim Before Starting"** will be available for {singleTasks} and {journeys}.
- When this toggle is enabled, a new input field appears next to it: **"Claim Limit"**. This is a number that defaults to `1`.
- A `Claim Limit` of `1` means the {task} is a solo job. A limit of `2` or more means it's a small group task that multiple people can claim.

**User Workflow:**
1.  **Viewing an Unclaimed {task}:** An available {task} that requires a claim will display a **"Claim {task}"** button in its detail view.
2.  **Claiming a {task}:**
    - When a {user} clicks "Claim {task}", their request is submitted to the {admin}s.
    - The button immediately changes to **"Claim Pending Approval"** and becomes disabled.
3.  **Viewing a Pending/Approved Claim:**
    - For all other {users}, the {task} card will now clearly display a status like **"Claimed by [User's Name]"** (or "Claims: 1/3") to show that a slot is taken.
    - The "Claim {task}" button will be disabled for all {users} once the claim limit is reached.
4.  **Admin Approval:**
    - A new **"Pending Claims"** tab will appear on the {link_approvals} page.
    - {admin}s can **Approve** or **Reject** the claim.
5.  **Claim Approved:**
    - The claiming {user} receives a notification that their claim was approved.
    - Their button in the {task} detail view changes to **"Complete {task}"**. They can now proceed with the {task}.
6.  **Claim Rejected:**
    - The claiming {user} receives a notification that their claim was rejected.
    - The claim is removed, and the slot becomes available again for others to claim.
7.  **Unclaiming a {task}:** If a {user} has an **approved** claim but decides not to do the {task}, they will have an **"Unclaim"** option in the detail view. This will free up their slot, making the {task} available for others.
8.  **Admin Oversight:**
    - To prevent {tasks} from being locked indefinitely, an {admin} will have a **"Force Unclaim"** option on the "Manage Quests" page for any claimed {task}. This will remove all current claims (both pending and approved) and make the {task} available again.

### Bug Tracker

**Purpose:** A tool for `{admin}`s to systematically track bugs, feedback, and feature requests. It records user actions to help reproduce issues.

**Enabling the Tracker:** The Bug Tracker is a developer tool. It must first be enabled in `Settings > General > Enable Developer Mode`. Once enabled, a 🐞 icon will appear in the sidebar, providing access to the main tracking page.

**The Reporter UI:** When developer mode is on, a bug reporting bar appears at the bottom of the screen.
- **Creating a Report:** From the initial view, select a report type (Bug, Feature, etc.), give it a descriptive title, and click "Start Recording."
- **Continuing a Report:** You can also choose to continue recording for a previously created report that is still "In Progress."

**During a Recording Session:**
- **Automatic Logging:** The app automatically logs key events like page navigation and major state changes.
- **Click Tracking:** This can be toggled on or off. When on, it logs all user clicks. The "Log Details" sub-option can be enabled to capture more specific information about the HTML element that was clicked.
- **Adding Notes:** Manually add text notes to the log to provide context, describe what you're seeing, or explain your actions.
- **Picking Elements:** This special mode turns your cursor into a crosshair, allowing you to click on any specific UI element. The details of that element (like its type, ID, and classes) are then added to the log. This is extremely useful for identifying problematic buttons or components.
- **Server-Side Logging:** For advanced debugging, an admin can enable temporary logging of their own backend API calls for a set duration (e.g., 30 seconds). This helps diagnose issues that may originate from the server.
- **Cancelling:** A "Cancel" button allows you to discard the current recording session at any time without saving a report.
- **Stopping:** When you're finished, click "Stop Recording" to save the report with all the captured logs.

**The {link_bug_tracker} Page:** This is the central hub where all reports are managed.
- **Viewing Reports:** Click on any report to open a detailed view.
- **Managing Status:** Change a report's status to keep track of its lifecycle: `Open`, `In Progress`, `Resolved`, or `Closed`.
- **Tagging:** Add or remove tags to categorize and filter reports.
- **Commenting:** {admin}s can add comments to a report, creating a discussion thread to collaborate on a fix.
- **Copying Logs:** Easily copy selected log entries or the entire log to your clipboard for sharing or external documentation.
- **Converting to Quest:** With one click, you can turn a bug report into a completable `{task}`. This automatically creates a new {singleTask}, populates its description with the bug's title and logs, and marks the original bug report as 'Resolved'.

---

## Appendix: Default Content

{appName} comes with a set of default content to get you started. You can edit or delete any of this content as you see fit.

### Default Reward Types
- **Gold Coins (Currency):** Standard currency for item purchases.
- **Gems (Currency):** Premium currency, often used for special rewards or experiences.
- **Crystals (Currency):** A common currency, often used for smaller rewards like screen time.
- **Strength (XP):** Earned from physical tasks.
- **Diligence (XP):** Earned from careful, persistent work like cleaning.
- **Wisdom (XP):** Earned from learning and educational activities.
- **Skill (XP):** Earned from practicing hobbies or sports.
- **Creativity (XP):** Earned from artistic and creative endeavors.

### Default Ranks
The app includes 50 default {levels}, starting from "Novice" and progressing through thematic tiers like Knight, Lord, Mystic, and finally to "The Absolute." Each requires an increasing amount of total XP to achieve.

### Default Quest Groups
- **Household Chores:** For tasks related to keeping the house tidy.
- **School & Learning:** For homework, studying, and educational goals.
- **Personal Goals:** For self-improvement and personal projects.
- **Health & Wellness:** For exercise, hygiene, and mental well-being.
- **Family & Social:** For tasks involving family members and friends.
- **Creative & Hobbies:** For artistic pursuits.
- **Outdoor & Adventure:** For yard work and exploring nature.
- **Kindness & Service:** For helping others and showing appreciation.