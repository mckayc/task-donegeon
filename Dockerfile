# Stage 1: The Build Stage
# This stage builds the frontend and backend code from source.
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install all dependencies (including dev dependencies)
# This is done first to leverage Docker's layer caching for faster builds.
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Generate the Prisma client - this is required before building the backend
RUN npx prisma generate

# Run the build script from package.json to compile everything
RUN npm run build
# Stage 2: The Production Stage
# This stage creates the final, lean image with only what's needed to run the app.
FROM node:20-alpine

WORKDIR /app

# Copy package files again
COPY package*.json ./
# Install ONLY production dependencies and ignore postinstall scripts
RUN npm install --omit=dev --ignore-scripts

# === Copy Artifacts from Builder Stage ===
# Copy the compiled backend code
COPY --from=builder /app/dist-backend ./dist-backend
# Copy the static frontend assets
COPY --from=builder /app/dist ./dist
# Copy the Prisma schema and migrations (needed at runtime)
COPY backend/prisma ./backend/prisma

# Expose the port the application server will run on
EXPOSE 3000

# The command to start the server. It first runs migrations, then starts the app.
CMD ["npm", "start"]