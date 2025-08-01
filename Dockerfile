# --- Stage 1: Build Dependencies ---
# Use the official Node.js image based on Alpine Linux.
# Alpine is very small, which helps keep our final image size down.
# We name this stage 'dependencies' for clarity.
FROM node:20-alpine AS dependencies
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install

# --- Stage 2: Build the Application ---
# This stage uses the previous stage as its base.
FROM dependencies AS build
WORKDIR /usr/src/app
# Copy the source code into the container.
COPY . .
# Run the 'build' script from package.json (tsc && vite build).
# The output will be in the `/usr/src/app/dist` directory. This runs only
# when the source code above it changes.
RUN npm run build


# --- Stage 3: Production Environment ---
# Start fresh with another small Node.js Alpine image for the final product.
# This keeps the final image clean and free of build tools and source code.
FROM node:20-alpine AS production

# Create a non-root user for security. Running as 'root' in a container is a security risk.
# We create a group 'appgroup' and a user 'appuser' and give them ownership of the app directory.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

WORKDIR /home/appuser/app

# Copy only the necessary built files from the 'build' stage and the 'backend' folder.
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/backend ./backend

# The backend's package.json is inside the `backend` folder, so we need to
# navigate into it to install its specific dependencies (like express, cors, etc.).
WORKDIR /home/appuser/app/backend
RUN npm install

# Go back to the application root.
WORKDIR /home/appuser/app

# Copy the entrypoint script and give it execute permissions.
# This is a critical step to prevent "permission denied" errors.
COPY --chown=appuser:appgroup entrypoint.sh .
RUN chmod +x ./entrypoint.sh

# Expose port 3001, which is the port our Express server will listen on.
EXPOSE 3001

# Set the entrypoint script to run when the container starts.
ENTRYPOINT ["./entrypoint.sh"]

# The default command to run via the entrypoint.
# This starts the Node.js server.
CMD ["node", "backend/server.js"]