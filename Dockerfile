# Stage 1: Build the React frontend and install all dependencies
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json files first to leverage Docker layer caching
COPY package*.json ./

# Install all dependencies for both frontend and backend, including dev dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Run the build script to compile the server and client
RUN npm run build
# Stage 2: Create the final production image
FROM node:20-alpine

WORKDIR /app

# Copy package files again
COPY package*.json ./

# Install only production dependencies for the backend
RUN npm install --omit=dev

# Copy the built frontend, the server, and the data source logic from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/src/data ./src/data
COPY --from=builder /app/dist/assets ./assets

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "server.js"]