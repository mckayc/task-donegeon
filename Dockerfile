# --- Stage 1: Build the Frontend ---
# This stage is temporary and only exists to build the static React files.
FROM node:20 AS builder

# Set the working directory inside the container for the build process.
WORKDIR /app

# Copy the package.json and other config files first.
# This leverages Docker's caching. If these files don't change,
# Docker won't re-run the `npm install` step, speeding up future builds.
COPY package*.json tsconfig*.json vite.config.ts ./

# Install the frontend dependencies.
RUN npm install

# Copy the rest of the frontend source code.
COPY . .

# Build the frontend for production. This creates a `dist` folder
# with optimized, static HTML, CSS, and JavaScript files.
RUN npm run build

# --- Stage 2: Create the Final Production Image ---
# This is the stage that creates the final, lean image we will actually run.
FROM node:20

# Set the working directory for the backend server.
WORKDIR /app

# Copy the backend's package files and install its dependencies.
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy the entire backend source code.
COPY backend/ ./backend/

# Crucially, copy ONLY the built frontend (`dist` folder) from the `builder` stage (stage 0).
# We leave behind all the frontend source code and dev dependencies. This resolves
# a build issue in some CI/CD environments like GitHub Actions.
COPY --from=0 /app/dist ./dist

# The backend server will run on port 3001 inside the container.
# This line is for documentation; it doesn't actually open the port.
EXPOSE 3001

# The command that will be executed when the container starts.
# It changes to the backend directory and starts the Node.js server.
CMD ["sh", "-c", "cd backend && node server.js"]