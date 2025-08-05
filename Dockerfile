# Stage 1: Build the React frontend
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies, including development ones
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application. The output will be in the /app/dist directory
RUN npm run build
# Stage 2: Create the final production image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the server file
COPY server.js .

# Copy the built frontend assets from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# The command to run the application
CMD ["node", "server.js"]