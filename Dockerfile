# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker layer caching
COPY package*.json ./

# Install all dependencies, including devDependencies needed for the build
RUN npm install

# Copy the rest of the application source code
COPY . .

# Run the build script to compile the server and client
RUN npm run build
# Stage 2: Create the final production image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Set the environment to production
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev
# Copy the built frontend assets from the builder stage
COPY --from=builder /app/dist ./dist

# Copy the server files from the builder stage
COPY --from=builder /app/server.js .
COPY --from=builder /app/src/data ./src/data

# Expose the port the app runs on
EXPOSE 3000

# The command to run when the container starts
CMD [ "node", "server.js" ]