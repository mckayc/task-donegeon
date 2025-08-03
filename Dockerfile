# --- Stage 1: Build Dependencies ---
# Use the official Node.js image based on Alpine Linux.
# Alpine is very small, which helps keep our final image size down.
# We name this stage 'dependencies' for clarity.
FROM node:20-alpine AS dependencies
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
# --- Stage 2: Build the Application ---
# This stage uses the previous stage as its base.
FROM dependencies AS build
WORKDIR /usr/src/app
# Copy the source code into the container.
COPY . .
# Run the 'build' script from package.json (tsc && vite build).
# The output will be in the `/usr/src/app/dist` directory.
RUN npm run build
# --- Stage 3: Production Environment ---
# Start fresh with another small Node.js Alpine image for the final product.
# This keeps the final image clean and free of build tools and source code.
FROM node:20-alpine AS production
WORKDIR /home/appuser/app
# Copy backend package files first for better caching.
COPY --chown=appuser:appgroup ./backend/package*.json ./backend/
RUN cd backend && npm install
# Copy the built frontend and backend source code.
COPY --from=build --chown=appuser:appgroup /usr/src/app/dist ./dist
COPY --chown=appuser:appgroup ./backend ./backend
# Copy the entrypoint script and make it executable.
COPY --chown=appuser:appgroup entrypoint.sh .
RUN chmod +x ./entrypoint.sh
EXPOSE 3001
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "backend/server.js"]