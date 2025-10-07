# Task Donegeon

**Version:** 0.5.69

---

Task Donegeon is a gamified task and chore management application designed for families, groups, or individuals. It turns everyday responsibilities into an engaging medieval-themed role-playing game. Users complete "quests" (tasks), earn virtual currency and experience points (XP), customize their avatars, and level up their characters in a fun and motivating environment. It leverages a powerful backend to persist all data and includes unique features like an **Asset Library** full of pre-made content and a **Suggestion Engine** powered by Google Gemini to help administrators generate new quests and items, making world-building a breeze.

## Table of Contents
- [✨ Features](#-features)
- [🗺️ Roadmap](#️-roadmap)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Installation and Running](#️-installation-and-running)

### Weekly Summaries

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