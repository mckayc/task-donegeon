# -----------------------------------------------------------------
# DOCKERFILE FOR BUILDING THE PRODUCTION IMAGE
#
# This uses a multi-stage build to create a small, optimized image.
# Stage 1: Builds the React frontend and prepares backend files.
# Stage 2: Creates the final image with only production dependencies.
# -----------------------------------------------------------------

# --- Stage 1: Build Stage ---
    FROM node:20-alpine AS build

    # Set the working directory
    WORKDIR /usr/src/app
    
    # Copy root and backend package.json files
    COPY package.json ./
    COPY backend/package.json ./backend/
    
    # Install root (frontend) dependencies
    RUN npm install
    
    # Install backend dependencies
    RUN npm install --prefix backend
    
    # Copy all source code
    COPY . .
    
    # Build the React frontend
    RUN npm run build
    
    # --- Stage 2: Production Stage ---
    FROM node:20-alpine
    
    # Set the working directory
    WORKDIR /usr/src/app
    
    # Copy package.json files for production install
    COPY package.json ./
    COPY backend/package.json ./backend/
    
    # Install ONLY production dependencies for a smaller image size
    RUN npm install --omit=dev
    RUN npm install --prefix backend --omit=dev
    
    # Copy the built frontend static files from the build stage
    COPY --from=build /usr/src/app/dist ./dist
    
    # Copy the backend source code from the build stage
    COPY --from=build /usr/src/app/backend ./backend
    
    # Copy metadata.json
    COPY --from=build /usr/src/app/metadata.json ./
    
    # Ensure the uploads directory exists
    RUN mkdir -p /usr/src/app/backend/uploads
    
    # Expose the port the backend server will run on
    EXPOSE 3001
    
    # Command to run the application
    CMD [ "node", "backend/server.js" ]