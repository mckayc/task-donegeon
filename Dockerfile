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

# Crucially, copy ONLY the built frontend (`dist` folder) from the `builder` stage.
# We leave behind all the frontend source code and dev dependencies.
COPY --from=builder /app/dist ./dist

# The backend server will run on port 3001 inside the container.
# This line is for documentation; it doesn't actually open the port.
EXPOSE 3001

# The command that will be executed when the container starts.
# It changes to the backend directory and starts the Node.js server.
CMD ["sh", "-c", "cd backend && node server.js"]