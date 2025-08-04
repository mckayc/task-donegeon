
# Task Donegeon

A gamified chore and task tracker.

## Architecture

This is a full-stack application built with:
- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Fastify, Prisma
- **Database**: SQLite
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions for automatic Docker image builds and pushes to Docker Hub.
- **Assets**: JSON files for game data (Quests, Rewards, etc.) stored in the `assets` directory.

## Prerequisites

- [Docker](https://www.docker.com/get-started) must be installed and running on your system.

## Getting Started

1.  **Clone the repository** (if you haven't already).

2.  **Create Environment File**

    Navigate to the `backend` directory and create a `.env` file by copying the example:

    ```bash
    cp backend/.env.example backend/.env
    ```

    You **must** fill in the `GEMINI_API_KEY` with your API key from Google AI Studio. You should also update the `JWT_SECRET` to a new random string for better security. Finally, make sure your Docker Hub username is correct in `docker-compose.yml` or update the images to your own.

3.  **Run with Docker Compose**

    From the root directory of the project, run the following command:

    ```bash
    docker-compose up
    ```

    This command will:
    - Pull the pre-built Docker images for both `frontend` and `backend` services from Docker Hub.
    - Start the containers.
    - Set up a network for them to communicate.
    - Create named volumes for persistent database and backup storage.
    - Mount the `/assets` directory into the backend container for live game data editing.

4.  **Access the Application**

    - The **Task Donegeon** web app will be available at the port you configured (default: [http://localhost:9373](http://localhost:9373)).
    - The backend API will be available at its configured port (default: 9374).

5.  **Stopping the Application**

    To stop the application, press `Ctrl+C` in the terminal where `docker-compose` is running. To remove the containers and network, run:
    
    ```bash
    docker-compose down
    ```
    *Note: This will not remove your persistent data, which is stored in the Docker volumes `db-data` and `backups`.*

## CI/CD Automation

This project uses GitHub Actions to automatically build and publish Docker images.

- **Trigger**: The workflow runs on every `push` to the `main` branch.
- **Process**:
  1. Logs into Docker Hub using credentials stored in repository secrets.
  2. Builds a new `frontend` image and pushes it to `<your-username>/task-donegeon-frontend:latest`.
  3. Builds a new `backend` image and pushes it to `<your-username>/task-donegeon-backend:latest`.
- **Configuration**: The workflow is defined in the `.github/workflows/docker-build.yml` file.

This automation ensures that the images used in the `docker-compose.yml` file are always up-to-date with the latest code from the `main` branch.
