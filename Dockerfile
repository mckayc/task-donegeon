# Stage 1: Build the frontend assets
FROM node:18-alpine AS build

WORKDIR /app

# Copy all necessary configuration and source files
COPY package.json tsconfig.json tsconfig.node.json vite.config.ts ./
COPY index.html index.tsx App.tsx ./
COPY components ./components
COPY context ./context
COPY data ./data
COPY hooks ./hooks
COPY utils ./utils
COPY types.ts ./
COPY public ./public
COPY metadata.json ./

# Install dependencies and build the frontend
RUN npm install
RUN npm run build

# Stage 2: Create the final production image
FROM node:18-alpine AS production

WORKDIR /app

# Copy backend package file and install production dependencies
COPY backend/package.json ./backend/
RUN cd backend && npm install --production

# Copy built frontend assets from the build stage
COPY --from=build /app/dist ./dist

# Copy the backend server code
COPY backend/server.js ./backend/

# Copy the metadata file so the backend can serve it
COPY metadata.json ./

# Expose the port the server runs on
EXPOSE 3001

# Command to run the backend server
CMD ["node", "backend/server.js"]