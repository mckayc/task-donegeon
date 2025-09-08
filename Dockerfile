FROM node:20-alpine AS dependencies
WORKDIR /usr/src/app
COPY backend/package.json ./backend/
# Install ONLY production dependencies for the backend.
RUN npm install --prefix backend --omit=dev
FROM node:20-alpine
WORKDIR /app
# Create a dedicated, non-root user and group for security purposes.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# Copy the built frontend assets from the 'build' stage...
COPY --from=build /usr/src/app/dist ./dist
# Copy the production-only backend node_modules from the 'dependencies' stage.
COPY --from=dependencies /usr/src/app/backend/node_modules ./backend/node_modules
# Copy the backend's server code...
COPY backend/ ./backend/
# Change ownership of all application files to our new non-root user.
RUN chown -R appuser:appgroup /app
# Switch to the non-root user.
USER appuser
# Expose the port that the backend server will listen on inside the container.
EXPOSE 3001
# Define the command that will run when the container starts.
CMD ["node", "backend/server.js"]