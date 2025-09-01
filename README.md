# OpenCalcPad

A sleek, modern, self-hosted web application that allows you to use multiple calculators at once. Each calculator is a movable, resizable window with a persistent history and note-taking area.

## Features

-   **Multiple Calculators:** Create, manage, and organize multiple calculator instances.
-   **Window Management:** Each calculator is in a draggable and resizable window.
-   **Persistent State:** Your calculators, notes, and window positions are saved to a SQLite database.
-   **Data Portability:** Easily back up (export) and import your entire workspace.
-   **Scientific Mode:** Switch to a scientific calculator for more advanced functions.
-   **Unit & Currency Conversion:** Perform quick conversions like `10ft in cm` or `15 USD to EUR`.
-   **Dark Mode:** A sleek dark theme for comfortable use in low-light environments.
-   **Self-Hosted:** Run it on your own server with Docker.

## Running with Docker

The easiest way to get OpenCalcPad running is with Docker and Docker Compose.

### Prerequisites

-   [Docker](https://docs.docker.com/get-docker/)
-   [Docker Compose](https://docs.docker.com/compose/install/)

### Instructions

1.  **Clone the repository:**
    ```sh
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Build and run the container:**
    Use Docker Compose to build the image and start the container in the background.
    ```sh
    docker-compose up -d --build
    ```

3.  **Access the application:**
    Open your web browser and navigate to [http://localhost:3000](http://localhost:3000).

### Data Persistence

The application uses a SQLite database to store all your data. Docker Compose is configured to use a named volume (`opencalcpad-data`), which persists the database file (`data/database.db`) on your host machine. This means your data will be safe even if you stop or remove the container.

### Stopping the Application

To stop the running application:
```sh
docker-compose down
```
This will stop and remove the container but will not delete the data volume. To start it again, simply run `docker-compose up -d`.
