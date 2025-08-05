FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./

RUN npm cache clean --force && npm install

COPY frontend/ ./

RUN npm run build

FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm cache clean --force && npm install
COPY backend/ ./

RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY backend/package.json backend/package-lock.json ./backend/
COPY backend/prisma ./backend/prisma

RUN cd backend && npm install --omit=dev

COPY --from=backend-builder /app/backend/dist ./backend/dist

COPY --from=frontend-builder /app/frontend/dist ./backend/public

COPY assets ./assets

EXPOSE 3000

CMD ["node", "backend/dist/server.js"]