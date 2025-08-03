# --- Stage 1: Build Dependencies ---
# (No major changes here, just added package-lock.json for consistency)
FROM node:20-alpine AS dependencies
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

# --- Stage 2: Build the Application ---
# (No changes here)
FROM dependencies AS build
WORKDIR /usr/src/app
COPY . .
RUN npm run build

# --- Stage 3: Production Environment ---
FROM node:20-alpine AS production

# [-] REMOVED: USER appuser
# The container now starts as the 'root' user by default.
# This gives our entrypoint.sh script the necessary permissions to run 'chown'.

# [+] ADDED: Install su-exec
# Installs a lightweight utility that our entrypoint script will use to
# "step down" from 'root' to the 'appuser' before running the app.
RUN apk add --no-cache su-exec

# [NO CHANGE]
# We still create the non-root user and group. The app will run as this user.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /home/appuser/app

# [NO CHANGE]
# Copy the built frontend files and backend source code, ensuring
# they are owned by our 'appuser'.
COPY --from=build --chown=appuser:appgroup /usr/src/app/dist ./dist
COPY --chown=appuser:appgroup ./backend ./backend

# [OPTIMIZATION]
# Copy backend dependencies and install them *before* the code for better caching.
COPY --chown=appuser:appgroup ./backend/package*.json ./backend/
RUN cd backend && npm install

# [NO CHANGE]
# Copy the entrypoint script and make it executable.
COPY --chown=appuser:appgroup entrypoint.sh .
RUN chmod +x ./entrypoint.sh

# [NO CHANGE]
# Expose the port and set the entrypoint.
EXPOSE 3001
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "backend/server.js"]