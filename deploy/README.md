# DE RUTA en el servidor casero

Corre junto a ahora-lo-reviso, futfinder, kioapp, monkey y appointar, detrás del mismo proxy compartido.

```
internet ──443──▶ ahora-lo-reviso-nginx-1 (jonasal/nginx-certbot, compartido)
                    │  red ahora-lo-reviso_alr-network
                    ├─ /api/ ─▶ deruta-api (NestJS) ──▶ deruta-db (Postgres 16)
                    └─ /     ─▶ deruta-web (nginx con la web de Angular)
```

- Dominio: `deruta.duckdns.org`. La web llama a la API en el mismo dominio (`/api/v1`, ver `apps/web/src/environments/environment.prod.ts`).
- Todo vive en `/opt/deruta`. El deploy copia el compose, el `Dockerfile`, `nginx/web.conf`, el build de la API (`source/`) y la web (`web/`).
- **Secretos:** `/opt/deruta/.env`, solo en el servidor.
- **Deploy:** push a `main` (corre tests de API y web, compila, copia por SSH y hace `docker compose up -d --build`). A mano: GitHub → Actions → *Deploy DE RUTA* → *Run workflow*.
- **Base de datos:** todavía no hay migraciones, así que la API arranca con `DB_SYNCHRONIZE=true` y TypeORM crea/actualiza las tablas desde las entidades. Cuando haya migraciones, poner `DB_SYNCHRONIZE=false` en `.env`. En producción no se cargan los datos de demo.
- **Proxy:** `proxy/deruta.conf` se instala a mano en `/opt/kioapp-develop/proxy/` (la carpeta que el proxy tiene montada en `/etc/nginx/user_conf.d`). El deploy no lo toca: un error ahí deja sin servicio a todas las apps.
- **Node 24 en CI:** Angular 22 pide Node ≥ 22.22. El `package-lock.json` se regeneró con npm 11 para que incluya los binarios nativos de Linux (rolldown); si se vuelve a generar en Windows/macOS con npm viejo, el build de CI falla con *Cannot find native binding*.

## Secrets de GitHub

| Secret | Valor |
| --- | --- |
| `DERUTA_HOST` | `deruta.duckdns.org` |
| `DERUTA_USER` | `cristianengel` |
| `DERUTA_SSH_PORT` | `22` |
| `DERUTA_SSH_KEY` | clave privada `github-actions-deruta` (su pública está en `~/.ssh/authorized_keys` del servidor) |

## `.env` del servidor

```bash
sudo install -d -o cristianengel -g cristianengel /opt/deruta
(umask 077 && cat > /opt/deruta/.env <<EOF
DB_PASSWORD=$(openssl rand -hex 24)
JWT_SECRET=$(openssl rand -hex 48)
WEB_URL=https://deruta.duckdns.org
EOF
)
```

## Proxy (una sola vez)

```bash
cp deploy/proxy/deruta.conf /opt/kioapp-develop/proxy/
docker exec ahora-lo-reviso-nginx-1 nginx -t
docker kill --signal=HUP ahora-lo-reviso-nginx-1   # recarga y pide el certificado nuevo
docker logs --tail 50 ahora-lo-reviso-nginx-1
```

## Operación diaria

| Qué | Cómo |
| --- | --- |
| Estado | `cd /opt/deruta && docker compose ps` |
| Logs de la API | `docker logs -f deruta-api` |
| Consola Postgres | `docker exec -it deruta-db psql -U deruta deruta` |
| Backup manual | `docker exec deruta-db pg_dump -U deruta deruta \| gzip > deruta-$(date +%F).sql.gz` |
