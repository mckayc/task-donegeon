# --- Stage 1: Build the React Frontend ---
    FROM node:20-alpine AS build
    WORKDIR /usr/src/app
    COPY package.json package-lock.json ./
    RUN npm ci
    COPY . .
    RUN npm run build
    
    # --- Stage 2: Backend dependencies ---
    FROM node:20-alpine AS dependencies
    WORKDIR /usr/src/app
    COPY backend/package.json backend/package-lock.json ./backend/
    RUN npm ci --prefix backend --omit=dev
    
    # --- Stage 3: Final Production Image ---
    FROM node:20-alpine
    WORKDIR /app
    RUN addgroup -S appgroup && adduser -S appuser -G appgroup
    
    COPY --from=build /usr/src/app/dist ./dist
    COPY --from=dependencies /usr/src/app/backend/node_modules ./backend/node_modules
    COPY backend ./backend
    
    RUN chown -R appuser:appgroup /app
    USER appuser
    EXPOSE 3001
    CMD ["node", "backend/server.js"]
    