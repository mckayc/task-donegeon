# Stage 1: Build the React frontend
FROM node:18-alpine AS build
WORKDIR /app

# Copy frontend package.json and install dependencies
COPY package.json ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY index.tsx ./
COPY App.tsx ./
COPY components ./components
COPY context ./context
COPY data ./data
COPY hooks ./hooks
COPY utils ./utils
COPY types.ts ./
# Copy public assets if any (like the avatar svg)
# Assuming it's in a public/assets folder based on standard Vite setup
# If the path is different, adjust it here.
# Example: COPY public/assets ./public/assets
COPY public ./public

RUN npm install

# Build the frontend
RUN npm run build

# Stage 2: Create the production server
FROM node:18-alpine
WORKDIR /app

# Copy backend dependencies and install them
COPY backend/package.json ./backend/
RUN cd backend && npm install --production

# Copy built frontend from Stage 1
COPY --from=build /app/dist ./dist

# Copy backend server code
COPY backend/server.js ./backend/

# Expose the port the backend server will run on
EXPOSE 3001

# The command to start the server
CMD ["node", "backend/server.js"]