# syntax=docker/dockerfile:1
FROM node:24-alpine AS builder

WORKDIR /app

# Herramientas de compilación para módulos nativos (better-sqlite3 en dev)
RUN apk add --no-cache python3 make g++

# Copy root package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Install dependencies (including workspace dependencies)
RUN npm ci

# Copy source
COPY apps/api ./apps/api

# Build API
RUN npm run build --workspace=apps/api

# Production stage
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Solo dependencias de producción (better-sqlite3 es opcional y no se usa con Postgres)
RUN npm ci --omit=dev --omit=optional && npm cache clean --force

COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Directorio de/uploads para el proveedor de storage local
RUN mkdir -p /app/uploads
VOLUME ["/app/uploads"]

EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]
