# API de DE RUTA. El contexto es /opt/deruta: el deploy copia el build (dist) y los package.json en `source/`.
FROM node:24-slim

WORKDIR /app
COPY source/package.json source/package-lock.json ./
COPY source/apps/api/package.json apps/api/package.json
COPY source/apps/web/package.json apps/web/package.json

# Solo las dependencias de producción de la API (el build ya viene hecho desde GitHub Actions).
RUN npm ci --omit=dev --workspace=apps/api --no-audit --no-fund \
 && npm cache clean --force

COPY source/apps/api/dist apps/api/dist

# Carpeta de imágenes subidas (STORAGE_PROVIDER=local). Se crea con dueño node para que
# el volumen nombrado herede los permisos y la API (que corre como node) pueda escribir.
RUN mkdir -p /app/apps/api/uploads && chown node:node /app/apps/api/uploads

ENV NODE_ENV=production
WORKDIR /app/apps/api
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
