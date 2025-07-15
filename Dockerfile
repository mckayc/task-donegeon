# === Stage 1: Build the React Frontend ===
# Use a Node.js image as a base for building
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json to leverage Docker layer caching
COPY package.json ./

# Install frontend dependencies
RUN npm install

# Copy the rest of the frontend source code
COPY . .

# Build the frontend for production
RUN npm run build

# === Stage 2: Create the Final Production Image ===
# Use a lean Node.js image for the final container
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy over the built frontend from the 'builder' stage
COPY --from=builder /app/dist ./dist

# Copy the backend's package.json
COPY backend/package.json ./backend/

# Change to the backend directory and install only production dependencies
WORKDIR /app/backend
RUN npm install --only=production

# Copy the backend source code
COPY backend/server.js ./

# Expose the port the backend server runs on
EXPOSE 3001

# The command to run the backend server when the container starts
CMD ["node", "server.js"]