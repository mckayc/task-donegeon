# Task Donegeon

**Version:** 0.5.82

---

Task Donegeon is a gamified task and chore management application designed for families, groups, or individuals. It turns everyday responsibilities into an engaging medieval-themed role-playing game. Users complete "quests" (tasks), earn virtual currency and experience points (XP), customize their avatars, and level up their characters in a fun and motivating environment. It leverages a powerful backend to persist all data and includes unique features like an **Asset Library** full of pre-made content and a **Suggestion Engine** powered by Google Gemini to help administrators generate new quests and items, making world-building a breeze.

## Table of Contents
- [✨ Features](#-features)
- [🗺️ Roadmap](#️-roadmap)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Installation and Running](#️-installation-and-running)

### Weekly Summaries

-   **Week of October 13, 2025 (v0.5.82):**
    -   **New Feature: The Enchanted Vault UI:** Implemented the full user interface for the Enchanted Vault feature.
        -   **Deposit & Withdraw:** Users can now deposit currencies and XP into the vault through a dedicated UI. Inputs for deposit/withdrawals are restricted to whole numbers for simplicity.
        -   **Interest Projections:** A new "Projected Earnings" card allows users to input a time period (weeks, months, years) and see a forecast of how their current vault balance will grow with daily compounded interest.
        -   **Savings Goal Integration:** The vault page prominently displays the user's primary wishlist item and their savings progress, now including vaulted assets in the calculation.
        -   **Transaction History:** All deposits, withdrawals, and interest payments are now visible in a transaction history log on the vault page.

-   **Week of October 13, 2025 (v0.5.81):**
    -   **New Feature: The Enchanted Vault (Backend):** Introduced a major new gameplay mechanic, "The Enchanted Vault," which acts as an in-game savings and investment account.
        -   **Backend Logic:** Implemented all necessary backend functionality for deposits, withdrawals, and daily interest accrual.
        -   **Configurable Interest:** Administrators can enable the vault and configure a multi-tiered interest rate system based on the total value of deposited assets. Specific interest rates can also be set for individual reward types.
        -   **Automated Accrual:** Interest is calculated and applied automatically in the background once per day.
        -   **Full Auditing:** All vault transactions are recorded in the user's Chronicles.

-   **Week of November 3, 2025 (v0.5.79):**
    -   **Chronicle Exchange Logging:** Enhanced the Chronicles to display currency and XP exchanges. The log entries now provide a detailed breakdown of what was paid and what was received, improving clarity and auditability of transactions.

-   **Week of October 27, 2025 (v0.5.78):**
    -   **Approvals Stability Fix:** Resolved a critical server error that could occur when an administrator approved or rejected a quest completion. The issue was caused by a missing check for the administrator's user object, leading to a crash if their account was in an inconsistent state. The backend is now more resilient and handles this edge case gracefully.

-   **Week of October 20, 2025 (v0.5.77):**
    -   **Enhanced Modifier Application:** Overhauled the "Apply Modifier" dialog in the Triumphs & Trials page. Administrators can now apply a single Triumph or Trial to **multiple users at once**. Additionally, for Trials that deduct rewards, a new **"Allow Substitution"** toggle has been added. When enabled, if a user has an insufficient balance of the specified reward, the system will automatically deduct other currencies or XP of equivalent value to cover the deficit.

-   **Week of October 13, 2025 (v0.5.76):**
    -   **Chronicles Admin Actions:** Enhanced the Chronicles page with administrative actions. Admins can now approve or reject pending requests directly from the activity feed. `Donegeon Master`s can also "Undo" completed quests or purchases to correct mistakes, which reverses the action and its associated rewards.

-   **Week of October 13, 2025 (v0.5.74):**
    -   **Chronicles Admin Actions:** Enhanced the Chronicles page with administrative actions. Admins can now approve or reject pending requests directly from the activity feed. `Donegeon Master`s can also "Undo" completed quests or purchases to correct mistakes, which reverses the action and its associated rewards.

-   **Week of October 13, 2025 (v0.5.73):**
    -   **User Deletion Logging Fix:** Fixed a server crash (`NOT NULL constraint failed: chronicle_event.title`) that occurred when deleting a user. The issue was caused by an incorrect logging function being called, which failed to provide a title for the chronicle entry. The deletion logic now uses the correct asset logging action, ensuring deletions are properly recorded.

-   **Week of October 13, 2025 (v0.5.72):**
    -   **Cloned User Deletion Fix:** Fixed a critical server error that occurred when attempting to delete a newly cloned user. The backend deletion logic has been updated to correctly handle relational data (like guild memberships), preventing database constraint violations and ensuring users can be deleted cleanly.

-   **Week of October 10, 2025 (v0.5.71):**
    -   **Undo Quest Fix:** Fixed a critical server error that occurred when a Donegeon Master tried to undo a quest completion from the Chronicles page. The backend controller now has improved error handling to manage the complex process of reverting rewards, ensuring the feature works reliably.

-   **Week of October 10, 2025 (v0.5.70):**
    -   **Universal Undo Fix:** Corrected a logic error where the "Undo" button would not appear for auto-approved quests with an "Awarded" status. The feature now correctly works for all completed quest and purchase events in the Chronicles, regardless of their completion status, providing full administrative control.

-   **Week of October 10, 2025 (v0.5.69):**
    -   **Expanded Undo Functionality:** Enhanced the administrative "Undo" feature on the Chronicles page. Donegeon Masters can now not only revert quest completions but also undo completed item purchases. This action reverses the transaction by refunding the currency and removing the item from the user's inventory, ensuring a complete and auditable correction process.

-   **Week of October 10, 2025 (v0.5.68):**
    -   **Expanded Undo Functionality:** Enhanced the administrative "Undo" feature on the Chronicles page. Donegeon Masters can now not only revert quest completions but also undo completed item purchases. This action reverses the transaction by refunding the currency and removing the item from the user's inventory, ensuring a complete and auditable correction process.

-   **Week of October 10, 2025 (v0.5.67):**
    -   **Expanded Undo Functionality:** Enhanced the administrative "Undo" feature on the Chronicles page. Donegeon Masters can now not only revert quest completions but also undo completed item purchases. This action reverses the transaction by refunding the currency and removing the item from the user's inventory, ensuring a complete and auditable correction process.

-   **Week of October 10, 2025 (v0.5.66):**
    -   **Chronicles Undo Feature:** Donegeon Masters now have the ability to "Undo" an approved quest completion directly from the Chronicles page. This action reverts the quest status to "Rejected," reverses any rewards that were granted, and adds a new entry to the user's history, providing a clear and auditable trail for corrections.

-   **Week of October 10, 2025 (v0.5.65):**
    -   **Calendar Completion Logic Fix:** Fixed a critical bug on the Calendar page where users could complete quests on days they were not scheduled or available (e.g., completing a Monday-only Duty on a Tuesday, or completing a quest for a future date). The "Complete" button is now correctly disabled and provides clear feedback in these scenarios.

-   **Week of October 3, 2025 (v0.5.64):**
    -   **Chronicle Logging for Incomplete Quests: