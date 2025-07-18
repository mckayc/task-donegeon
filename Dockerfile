# Dockerfile for Task Donegeon

# --- STAGE 1: Install Backend Dependencies ---
# This stage installs only the production dependencies for the backend.
FROM node:20-alpine AS dependencies

WORKDIR /usr/src/app

# Copy only the necessary package files for the backend.
COPY backend/package*.json ./backend/

# Clear npm cache and install ONLY production dependencies for the backend.
# This keeps the final image smaller.
RUN npm cache clean --force && npm install --prefix backend --omit=dev


# --- STAGE 2: Build Frontend Application ---
# This stage builds the React frontend. It needs devDependencies.
FROM node:20-alpine AS build

WORKDIR /usr/src/app

# The CACHE_BUSTER argument is used to manually invalidate the Docker cache for this layer when needed.
ARG CACHE_BUSTER
RUN echo "Busting cache with value: ${CACHE_BUSTER}"

# Copy frontend package files.
COPY package*.json ./

# Clear npm cache and install all frontend dependencies, including devDependencies needed for building.
RUN npm cache clean --force && npm install

# Now, copy the rest of your project's source code into the container.
COPY . .

# Run the build script defined in package.json to create the static assets.
RUN npm run build


# --- STAGE 3: Final Production Image ---
# This stage creates the final, lean image to run the application.
FROM node:20-alpine AS final

WORKDIR /usr/src/app

# Set the environment to production.
ENV NODE_ENV=production

# Copy the pre-installed backend dependencies from the 'dependencies' stage.
COPY --from=dependencies /usr/src/app/backend/node_modules ./backend/node_modules
COPY --from=dependencies /usr/src/app/backend/package*.json ./backend/

# Copy the built frontend static assets from the 'build' stage.
COPY --from=build /usr/src/app/dist ./dist

# Copy only the necessary backend server file and local uploads directory.
COPY backend/server.js ./backend/
COPY backend/uploads ./backend/uploads

# Expose the port the backend server will run on.
EXPOSE 3001

# The command to start the backend server when the container starts.
CMD ["node", "backend/server.js"]