# --- Stage 1: Build the React Frontend ---
# We use 'AS build' to name this stage. It will be discarded later,
# leaving behind only its final output (the 'dist' folder).
FROM node:20-alpine AS build

# Set the working directory inside the container for the build process.
WORKDIR /usr/src/app

# Copy ONLY the package.json file first.
# This is the key to solving your caching issue. This layer is only
# re-run if this specific file changes, not every time you edit a component.
COPY package.json ./

# Install all frontend dependencies, including devDependencies needed for building.
# This step is now cached and will be skipped on subsequent builds unless
# package.json has been modified.
RUN npm install

# --- CHANGES FOR ENTRYPOINT to copy images ---

# 1. Copy default images to a staging directory, NOT the final destination.
#COPY backend/uploads /app/default-uploads - original code
COPY backend/uploads /app/uploads

# 2. Copy the new entrypoint script into the container.
#    /usr/local/bin is a standard location for user-installed scripts.
COPY backend/docker-entrypoint.sh /usr/local/bin/

# 3. Make the script executable. This is a critical step!
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# --- END OF CHANGES ---

# Now, copy the rest of your project's source code into the container.
# When you 'git pull' new code, this is the first layer that will be invalidated.
COPY . .

# Run the build script defined in package.json to create the static assets.
# The output will be in the `/usr/src/app/dist` directory. This runs only
# when the source code above it changes.
RUN npm run build


# --- Stage 2: Prepare Backend Production Dependencies ---
# This stage's only job is to install the backend's production dependencies.
# We ignore development tools like 'nodemon' to keep the final image small and secure.
FROM node:20-alpine AS dependencies

# Set a working directory.
WORKDIR /usr/src/app

# Copy only the backend's package.json file.
COPY backend/package.json ./backend/

# Install ONLY production dependencies for the backend.
# This is a major optimization for size and security.
RUN npm install --prefix backend --omit=dev


# --- Stage 3: Create the Final Production Image ---
# Start from a fresh, lightweight Node.js image for the final product.
# This image will NOT contain any of the build tools or dev dependencies.
FROM node:20-alpine

# Set the final working directory for the running application.
WORKDIR /app

# Create a dedicated, non-root user and group for security purposes.
# Running as a non-root user is a critical security best practice.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy the built frontend assets from the 'build' stage into the final image.
COPY --from=build /usr/src/app/dist ./dist

# Copy the production-only backend node_modules from the 'dependencies' stage.
COPY --from=dependencies /usr/src/app/backend/node_modules ./backend/node_modules

# Copy the backend's server code and the initial default uploads.
COPY backend/server.js ./backend/
COPY backend/uploads ./backend/uploads

# Change ownership of all application files to our new non-root user.
# This is important for security.
RUN chown -R appuser:appgroup /app

# Switch to the non-root user. From this point on, all commands run as 'appuser'.
USER appuser

# Expose the port that the backend server will listen on inside the container.
EXPOSE 3001

# Define the command that will run when the container starts.
CMD ["node", "backend/server.js"]