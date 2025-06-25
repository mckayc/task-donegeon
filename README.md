# Task Donegeon

## Welcome to the Donegeon

**Task Donegeon** is a self-hosted web application designed to gamify chores for kids, wrapped in an immersive medieval dungeon and castle theme. Players take on roles as Donegeon Masters (admins), Bailiffs (moderators), or Adventurers (players), earning Currencies (Gold Coins, Gems, Potions, Weapons) through Adventures (one-time tasks) and Trials (recurring tasks). With Guild-based collaboration, Markets for trading, and leaderboards in the Great Hall, Task Donegeon makes chores fun and engaging for up to 30 users.

The app features a dungeon aesthetic with stone textures, parchment forms, gothic fonts (Cinzel), and red/gold/gray colors, enhanced by torchlit effects and animated buttons. It’s built with a beginner-friendly tech stack and deployed via Docker for easy setup.

## Features

### Authentication
- **Roles**:
  - **Donegeon Masters**: Full control, require username/password.
  - **Bailiffs**: Verify Adventures/Trials, assign Marks (demerits), require username/password.
  - **Adventurers**: Optional password, user-switching via top-right dropdown.
- Guild selection optional during registration.

### Quest Management
- Adventurers self-report Adventures (unique tasks) and Trials (recurring tasks).
- Donegeon Masters/Bailiffs can undo completions.
- Deadlines: Minutes, hours, days, weeks, months.
- Trial recurrence: Weekly checkboxes.
- Task states: Active, Inactive, Archived, Deleted (soft delete).

### Currency System
- Initial Currencies: Gold Coins, Gems, Potions, Weapons.
- Donegeon Masters can add/edit/delete Currencies.
- No accumulation limits; optional negative balances.
- Adventurer’s Armory for trading Currencies and custom Bounties (requires buyer/seller approval).

### Markets and Bounties
- Markets unlocked by completing mandatory Adventures/Trials.
- Guild Vaults show Guild-specific Bounties on the Guild Quest page.
- Low Stockpile notifications (configurable, off by default).
- Donegeon Master-confirmed Bounty redemption.

### Leaderboards and History
- **Great Hall**: Per-Currency leaderboards (day, week, month) showing total earned and unspent balances.
- **Hall of Records**: Task and Bounty history.

### Additional Features
- **Avatars**: Customizable with medieval Relics (armor, dragons).
- **Analytics**: Donegeon Master charts with CSV/JSON exports.
- **Guilds**: Support Guild Quests and shared Currency/Bounties.
- **Leveling**: Valor-based Ranks for unlocking perks.

### UI Theme
- Dungeon aesthetic: Stone textures, parchment forms, Cinzel font, red/gold/gray colors, torchlit glows, animated buttons.

### Deployment
- Docker Compose with automated backups.
- Basic offline support via browser caching.

## Tech Stack
- **Frontend**: React (Create React App), Tailwind CSS (CDN).
- **Backend**: Node.js, Express, Sequelize.
- **Database**: PostgreSQL with pgAdmin GUI.
- **Auth**: JWT, bcrypt.
- **Docker**: PostgreSQL, Node.js, Nginx containers.

## Getting Started

### Prerequisites
- **Docker**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (`docker --version` to verify).
- **Docker Compose**: Included with Docker Desktop (`docker-compose --version` to verify).

### Setup Instructions
1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd task-donegeon
   ```
2. **Set Up JWT Secret**:
   - Open `docker-compose.yml`.
   - Replace `your_jwt_secret_here` with a secure key:
     ```bash
     openssl rand -base64 32
     ```
3. **Run the Application**:
   - In the `task-donegeon/` directory, run:
     ```bash
     docker-compose up --build
     ```
   - This starts the frontend (`http://localhost`), backend (`http://localhost:5000`), and PostgreSQL database.
4. **Access the App**:
   - Open `http://localhost` in a browser.
   - Register a user (e.g., username: “SquireJane”, role: Adventurer, optional Guild).
   - Log in and test user-switching via the top-right dropdown.
5. **Manage the Database** (optional):
   - Use pgAdmin (`http://localhost:5050`, user: `taskdonegeon`, password: `donegeon2025`, database: `taskdonegeon_db`) to view tables (`users`, `guilds`).
6. **Stop the App**:
   ```bash
   docker-compose down
   ```

### Project Structure
```
task-donegeon/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── index.js
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.js
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
└── README.md
```

## Roadmap
- **Current State** (June 2025):
  - Functional login/register page with dungeon-themed UI (stone background, parchment forms, centered inputs).
  - Backend API: `/api/login`, `/api/register`, `/api/users`, `/api/guilds`.
  - Database: `users`, `guilds`, `currencies`, `user_currencies` tables.
  - Optional Guild selection during registration.
- **Next Steps**:
  1. **Enhance Backend API**:
     - Add `/api/currencies` (list, create, edit, delete Gold Coins, Gems, Potions, Weapons).
     - Add `/api/adventures`, `/api/trials` (create, complete, verify tasks).
     - Add `/api/marks` for Bailiffs/Donegeon Masters to assign demerits.
  2. **Expand Database Schema**:
     - Tables for Adventures, Trials, Markets, Adventurer’s Armory, Bounties, Guild Quests, Guild Vaults.
  3. **Build Adventurer Great Hall**:
     - Dashboard showing Currency balances, available Adventures/Trials, and links to Great Hall (leaderboard) and Hall of Records (history).
  4. **UI Improvements**:
     - Add local dungeon-themed assets (stone/parchment textures, SVG icons).
     - Implement background audio (e.g., dungeon ambiance).
     - Add Avatar previews during registration.
  5. **Finalize GitHub Repository**:
     - Complete structure with detailed `README.md` and setup guides.
     - Add automated tests and CI/CD pipeline for deployment.

## Contributing
Contributions are welcome! Please:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit changes (`git commit -m 'Add your feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License
This project is licensed under the MIT License.

## Contact
For questions or feedback, open an issue on the GitHub repository or contact the maintainers.

*Embark on your quest in the Task Donegeon and turn chores into epic adventures!*