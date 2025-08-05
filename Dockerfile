# === STAGE 1: Build Environment ===
# Use an official Node.js runtime as a parent image.
# The "-alpine" version is a lightweight Linux distribution.
FROM node:20-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy backend package files and install backend dependencies
COPY backend/package*.json ./backend/
RUN npm install --prefix backend

# Copy frontend package files and install frontend dependencies
COPY package*.json ./
RUN npm install
# Copy the rest of the application source code
COPY . .

# Build the frontend application for production
# This creates a static 'dist' folder with optimized files.
RUN npm run build
# === STAGE 2: Production Environment ===
# Start from a fresh, clean Node.js image for the final container
FROM node:20-alpine

WORKDIR /app

# Copy only the backend dependencies from the 'build' stage
COPY --from=build /app/backend/node_modules ./backend/node_modules
COPY backend/package*.json ./backend/

# Copy the backend server code
COPY backend/server.js ./backend/
COPY backend/drizzle.config.js ./backend/
COPY backend/db ./backend/db

# Copy the built frontend assets from the 'build' stage
COPY --from=build /app/dist ./dist

# Copy other necessary root files
COPY vercel.json .
COPY metadata.json .