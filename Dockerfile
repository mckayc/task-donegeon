# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json files first to leverage Docker layer caching
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install all dependencies for both frontend and backend, including dev dependencies
RUN npm install
RUN npm install --prefix backend

# Copy the rest of the application source code
COPY . .

# Run the build script to compile TypeScript and build the frontend
RUN npm run build
# Stage 2: Create the final production image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Set the environment to production
ENV NODE_ENV=production

# Copy package files again
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install only production dependencies for both frontend and backend
RUN npm install --omit=dev
RUN npm install --prefix backend --omit=dev

# Copy the built frontend assets from the builder stage
COPY --from=builder /app/dist ./dist

# Copy the compiled backend server files from the builder stage
COPY --from=builder /app/backend ./backend

# Expose the port the app runs on
EXPOSE 3000

# The command to run when the container starts
CMD [ "node", "backend/server.js" ]