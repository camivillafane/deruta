# DE RUTA

> Encontrá con quién viajar.

Plataforma de carpooling para conectar personas que viajan entre ciudades de Argentina.

## Estructura

- `apps/web` - Frontend Angular
- `apps/api` - Backend NestJS

## Desarrollo local

### Opción A: SQLite (sin Docker)

El backend usa `better-sqlite3` por defecto para desarrollo local, por lo que no es necesario levantar PostgreSQL.

1. Instalar dependencias (desde la raíz):

```bash
npm install
```

2. Iniciar backend:

```bash
npm run dev:api
```

3. En otra terminal, iniciar frontend:

```bash
npm run dev:web
```

La app estará disponible en `http://localhost:4200` y la API en `http://localhost:3000/api/v1`.

### Opción B: PostgreSQL con Docker

Si preferís usar PostgreSQL, asegurate de tener Docker Desktop corriendo y ejecutá:

```bash
npm run infra:up
```

Luego iniciá backend y frontend como en la Opción A.

### Datos de prueba

Al iniciar el backend se cargan automáticamente usuarios, vehículos y viajes de demo. Podés iniciar sesión con:

- **Email:** `martin@example.com`
- **Contraseña:** `password123`

### Tests

```bash
npm run test:api
npm run test:web
```

### Build de producción

```bash
npm run build
```
