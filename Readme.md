# TwinsStock

Control de stock para una tienda de açaí. Permite registrar cuándo se abre un
consumible (granola, leche en polvo, cremas, etc.) y consultar estadísticas de
consumo en un panel de control.

## Stack

- **Frontend**: React + Vite + TypeScript, `react-router-dom`, `recharts`.
- **Backend**: NestJS + TypeORM + PostgreSQL.
- **Base de datos**: PostgreSQL en [Neon](https://neon.tech) (pensado para desplegar con Vercel).

## Estructura

```
backend/     API NestJS (además expone api/index.ts para desplegar como función serverless en Vercel)
frontend/    App React
```

## Puesta en marcha

### 1. Base de datos (Neon)

Crea un proyecto en Neon y copia el connection string (con `sslmode=require`).

### 2. Backend

```bash
cd backend
cp .env.example .env
# pega tu connection string de Neon en DATABASE_URL dentro de .env
npm install
npm run start:dev
```

La API queda en `http://localhost:3000/api`. Al arrancar, si la tabla de
consumibles está vacía, se crean automáticamente:

- Granola
- Leche en polvo
- Crema de lotus
- Crema de pistacho
- Crema de cacahuete

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

La app queda en `http://localhost:5173`.

## Funcionalidad

- **Registrar consumo** (`/`): botones grandes por producto para marcar que se
  ha abierto una unidad; queda registrada la fecha y hora exactas.
- **Panel de control** (`/dashboard`): totales por producto, tendencia en el
  tiempo (día/semana/mes) y tabla de datos, con filtros de rango de fechas.

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/consumables` | Lista consumibles activos |
| POST | `/api/consumables` | Crea un nuevo consumible |
| PATCH | `/api/consumables/:id` | Activa/desactiva un consumible |
| POST | `/api/consumption-logs` | Registra un consumo (`consumableId`) |
| GET | `/api/consumption-logs` | Lista registros recientes (filtros: `from`, `to`, `consumableId`, `limit`) |
| GET | `/api/stats/summary` | Totales por producto en un rango (`from`, `to`) |
| GET | `/api/stats/timeseries` | Serie temporal por producto (`from`, `to`, `groupBy=day\|week\|month`) |

## Despliegue en Vercel

El repo se despliega como **dos proyectos de Vercel separados** apuntando al
mismo repositorio de Git, cada uno con su propio "Root Directory".

### Backend (`backend/`)

1. En Vercel, "Add New Project" → importa este repo → **Root Directory:
   `backend`**. Framework preset: "Other" (no hace falta tocar build/output).
2. `backend/api/index.ts` es el entrypoint serverless: arranca Nest sobre un
   adaptador Express y reutiliza la instancia entre invocaciones (evita
   reconectar a la base de datos en cada request). `backend/vercel.json`
   reescribe cualquier ruta hacia esa función.
3. Variables de entorno del proyecto (Settings → Environment Variables):
   - `DATABASE_URL`: el connection string **pooled** de Neon (el que trae
     `-pooler` en el host), imprescindible en serverless para no agotar
     conexiones.
   - `CORS_ORIGIN`: la URL del frontend desplegado (p. ej.
     `https://twinsstock.vercel.app`).
4. Despliega. La API queda en `https://<tu-backend>.vercel.app/api/...`.

### Frontend (`frontend/`)

1. "Add New Project" → mismo repo → **Root Directory: `frontend`**. Vercel
   detecta Vite automáticamente.
2. Variable de entorno: `VITE_API_URL` = `https://<tu-backend>.vercel.app/api`.
3. `frontend/vercel.json` hace fallback a `index.html` para que las rutas de
   React Router (`/dashboard`) funcionen al recargar o enlazar directo.

## Notas

- El esquema de la base de datos se sincroniza automáticamente
  (`synchronize: true`) para simplificar el desarrollo inicial. Antes de pasar
  a producción, conviene sustituirlo por migraciones de TypeORM.
- Añadir nuevos consumibles se puede hacer vía `POST /api/consumables` (se
  puede exponer más adelante en la UI si hace falta gestionarlos ahí).
