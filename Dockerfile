# --- Stage 1: Build the React Frontend ---
# We use 'AS build' to name this stage. It will be discarded later.
FROM node:20-alpine AS build

# Set the working directory inside the container for the build process.
WORKDIR /usr/src/app

# Copy ONLY the package.json and package-lock.json files first.
# This is the key to solving your caching issue. This layer is only
# re-run if these specific files change.
COPY package.json package-lock.json ./

# Install all frontend dependencies, including devDependencies needed for building.
RUN npm install

# Now, copy the rest of your project's source code.
# When you 'git pull', only this layer and the ones after it will be rebuilt.
COPY . .

# Run the build script defined in package.json to create the static assets.
# The output will be in the `/usr/src/app/dist` directory.
RUN npm run build


# --- Stage 2: Prepare Backend Production Dependencies ---
# This stage installs only the backend's production dependencies,
# ignoring things like 'nodemon' to keep the final image small.
FROM node:20-alpine AS dependencies

WORKDIR /usr/src/app

# Copy only the backend's package files.
COPY backend/package.json backend/package-lock.json ./backend/

# Install ONLY production dependencies for the backend.
RUN npm install --prefix backend --omit=dev


# --- Stage 3: Create the Final Production Image ---
# Start from a fresh, lightweight Node.js image for the final product.
FROM node:20-alpine

# Set the final working directory for the running application.
WORKDIR /app

# Create a dedicated, non-root user and group for security purposes.
# Running as a non-root user is a critical security best practice.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy the built frontend assets from the 'build' stage.
COPY --from=build /usr/src/app/dist ./dist

# Copy the production-only backend node_modules from the 'dependencies' stage.
COPY --from=dependencies /usr/src/app/backend/node_modules ./backend/node_modules

# Copy the backend's server code and the initial default uploads.
COPY backend/server.js ./backend/
COPY backend/uploads ./backend/uploads

# Change ownership of all application files to our new non-root user.
RUN chown -R appuser:appgroup /app

# Switch to the non-root user. From this point on, all commands run as 'appuser'.
USER appuser

# Expose the port that the backend server will listen on.
EXPOSE 3001

# Define the command that will run when the container starts.
CMD ["node", "backend/server.js"]