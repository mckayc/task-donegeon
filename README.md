# Task Donegeon

A gamified chore and task tracker.

## Architecture

This is a full-stack application built with a simplified, single-container deployment model.

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Fastify, Prisma (Serves both the API and the frontend)
- **Database**: SQLite
- **Containerization**: Docker & Docker Compose (Single `app` service)
- **CI/CD**: GitHub Actions for automatic build and push of a single Docker image to Docker Hub.

## Prerequisites

- [Docker](https://www.docker.com/get-started) must be installed and running on your system.

## Getting Started

1.  **Clone the repository** (if you haven't already).

2.  **Configure Environment File**

    Navigate to the `backend` directory and create a `.env` file by copying the example:

    ```bash
    cp backend/.env.example backend/.env
    ```

    Open `backend/.env` and fill in the required values:
    -   `JWT_SECRET`: A long, random string for security.
    -   `GEMINI_API_KEY`: Your API key from Google AI Studio.
    -   `APP_DATA_PATH`: This is now **optional**. If you want to store data in a specific location (e.g., `/srv/taskdonegeon`), set the absolute path here. If you leave it unset, data will be stored in a `data` folder in the project root.

3.  **Create Host Directories for Data**

    You must create the directories where the application will store its persistent data.
    
    -   **For the default setup** (if you did **not** set `APP_DATA_PATH`):
        ```bash
        # Create the default data directory and its sub-directories
        mkdir -p ./data/assets ./data/database ./data/backups
        ```

    -   **For a custom path setup** (if you **did** set `APP_DATA_PATH`):
        For example, if you set `APP_DATA_PATH=/srv/taskdonegeon`, run:
        ```bash
        mkdir -p /srv/taskdonegeon/assets /srv/taskdonegeon/database /srv/taskdonegeon/backups
        ```
    
    **Important:** After creating the directories, copy the contents of the project's local `assets` folder into your new host assets directory (`./data/assets` for default, or `/srv/taskdonegeon/assets` for custom) so the game has its starting data.

4.  **Update Docker Compose Image Name**

    Open `docker-compose.yml` and change the image name from `your-dockerhub-username/task-donegeon-app:latest` to use your actual Docker Hub username.

5.  **Run with Docker Compose**

    From the root directory of the project, run the following command:

    ```bash
    docker-compose up --build -d
    ```

6.  **Access the Application**

    - The **Task Donegeon** web app will be available at [http://localhost:9373](http://localhost:9373).

7.  **Stopping the Application**

    To stop the application, run:
    
    ```bash
    docker-compose down
    ```
    *Note: This stops and removes the container, but your data remains safe in the host directories you configured.*

## CI/CD Automation

This project uses GitHub Actions to automatically build and publish a single Docker image.

- **Trigger**: The workflow runs on every `push` to the `main` branch.
- **Process**:
  1. Logs into Docker Hub using credentials stored in repository secrets.
  2. Builds a new application image from the root `Dockerfile`.
  3. Pushes the image to `<your-username>/task-donegeon-app:latest`.
- **Configuration**: The workflow is defined in the `.github/workflows/docker-build.yml` file.