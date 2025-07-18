# --- Stage 1: Build the React Frontend ---
# We use 'AS build' to name this stage. It will be discarded later,
# leaving behind only its final output (the 'dist' folder).
FROM node:20-alpine AS build

# Set the working directory inside the container for the build process.
WORKDIR /usr/src/app

# This ARG is used to bust the cache and ensure 'git pull' changes are always included.
ARG CACHE_BUSTER
RUN echo "Busting cache with value: $CACHE_BUSTER"

# Copy ONLY the package.json and package-lock.json files first.
# This is the key to caching. This layer is only re-run if these specific files change.
COPY package*.json ./

# Install all frontend dependencies, including devDependencies needed for building.
RUN npm install

# Now, copy the rest of your project's source code into the container.
COPY . .

# Run the build script to create the static assets in the `/usr/src/app/dist` directory.
RUN npm run build


# --- Stage 2: Prepare Backend Production Dependencies ---
# This stage's only job is to install the backend's production dependencies.
FROM node:20-alpine AS dependencies

WORKDIR /usr/src/app

# Copy only the backend's package files.
COPY backend/package*.json ./backend/

# Install ONLY production dependencies for the backend. This keeps the final image small.
RUN npm install --prefix backend --omit=dev


# --- Stage 3: Create the Final Production Image ---
# Start from a fresh, lightweight Node.js image for the final product.
FROM node:20-alpine

WORKDIR /app

# Create a dedicated, non-root user for security (Principle of Least Privilege).
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy the built frontend assets from the 'build' stage.
COPY --from=build /usr/src/app/dist ./dist

# Copy the production-only backend node_modules from the 'dependencies' stage.
COPY --from=dependencies /usr/src/app/backend/node_modules ./backend/node_modules

# Copy the backend's server code and the initial default uploads.
COPY backend/server.js ./backend/
COPY backend/uploads ./backend/uploads

# --- FIX: THIS LINE WAS MISSING ---
# Copy the metadata.json file, which the server needs for the /api/metadata endpoint.
# Without this, the server would fail to start.
COPY metadata.json .

# Change ownership of all application files to our new non-root user.
RUN chown -R appuser:appgroup /app

# Switch to the non-root user. From this point on, all commands run as 'appuser'.
USER appuser

# Expose the port that the backend server will listen on inside the container.
EXPOSE 3001

# Define the command that will run when the container starts.
CMD ["node", "backend/server.js"]