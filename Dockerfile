# Stage 1: Build the Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./

# Use npm ci for a clean, reproducible install from the lockfile
RUN npm ci

COPY frontend/ ./

RUN npm run build

# Stage 2: Build the Backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json ./

# Use npm ci for a clean, reproducible install
RUN npm ci

COPY backend/ ./

RUN npm run build

# Stage 3: The Final Production Image
FROM node:18-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy only the necessary package files and prisma schema
COPY backend/package.json backend/package-lock.json ./backend/
COPY backend/prisma ./backend/prisma

# Install ONLY production dependencies and generate Prisma Client
RUN cd backend && npm ci

# Copy the compiled code from the builder stages
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=frontend-builder /app/frontend/dist ./backend/public

# Copy game assets
COPY assets ./assets

EXPOSE 3000

CMD ["node", "backend/dist/server.js"]