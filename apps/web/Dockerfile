# syntax=docker/dockerfile:1
FROM node:24-slim AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY apps/api/package*.json ./apps/api/

# Install dependencies. El lockfile fue generado en Windows y no incluye los
# bindings nativos de Linux (rolldown/lightningcss), asi que se reinstala sin
# lockfile para que npm resuelva los paquetes de la plataforma actual.
RUN rm -f package-lock.json && npm install --no-audit --no-fund

# Copy source
COPY apps/web ./apps/web

# Build web (configuración production: apiUrl relativa, proxied por nginx)
RUN npm run build --workspace=apps/web

# Production stage
FROM nginx:alpine AS production

COPY --from=builder /app/apps/web/dist/web/browser /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
