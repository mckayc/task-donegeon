# --- Stage 1: Build Frontend ---
# This stage is responsible for building your React frontend into static files.
# We use the '-slim' image for better compatibility with npm packages.
FROM node:20-slim AS build

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy all necessary files for the frontend build
# This includes package files, source code, and configuration.
COPY package*.json ./
COPY src/ ./src/
COPY index.html vite.config.ts tsconfig.json tsconfig.node.json ./

# Install frontend dependencies and then build the application
# This creates an optimized 'dist' folder with static assets.
RUN npm install
RUN npm run build

# --- Stage 2: Install Backend Dependencies ---
# This stage installs only the production dependencies for your Node.js backend.
# This helps keep the final image smaller.
FROM node:20-slim AS backend-deps

WORKDIR /usr/src/app

# Copy only the backend's package files
COPY backend/package*.json ./backend/

# Install ONLY production dependencies for the backend.
# The '--omit=dev' flag skips developer tools like 'nodemon'.
RUN npm install --prefix backend --omit=dev

# --- Stage 3: Production ---
# This is the final, lean image that will be deployed.
# It copies artifacts from the previous stages without including the build tools.
FROM node:20-slim AS production

WORKDIR /usr/src/app

# Copy backend production dependencies from the 'backend-deps' stage
COPY --from=backend-deps /usr/src/app/backend ./backend

# Copy the backend source code
COPY backend/ ./backend

# Copy the built frontend assets from the 'build' stage
COPY --from=build /usr/src/app/dist ./dist

# Copy the app's metadata file
COPY metadata.json ./

# Tell Docker that the container will listen on port 3001
EXPOSE 3001

# The command that will be run when the container starts
CMD ["node", "backend/server.js"]