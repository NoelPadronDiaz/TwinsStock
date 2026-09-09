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

La API queda en `http://localhost:3000/api`. Al arrancar, se crean/actualizan
automáticamente las 4 categorías y sus productos (ver `DEFAULT_CATALOG` en
`backend/src/consumables/consumables.service.ts`):

- **Líquidos y Cremas**: Pistacho, Cacahuete, Cacao, Dulce de Leche (tarrina/fácil),
  Leche Condensada (lata/fácil), Crema de Maracuyá, Nata, Leche de Coco, Leche
  Sin Lactosa, Leche de Avena, Agua.
- **Productos secos**: CornFlakes, Granola, Granola de Chocolate, Galleta
  Salada, Galleta María, Leche en polvo, Pepitas de chocolate (negro/blanco),
  Pistacho Crunchi, Coco Rallado, Cacahuetes, Proteina y semillas de chía.
- **Congelados**: Piña, Mango, Açai 2'9l, Açai 280ml.
- **Consumibles**: vasos (375/500 con logo, 500 sin logo, grandes para
  llevar), tapas, cucharas, servilletas.

Un producto que se quita del catálogo (editando `DEFAULT_CATALOG`) no se
borra: se marca `active: false` para no perder su historial de consumos.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

La app queda en `http://localhost:5173`.

## Funcionalidad

- **Registrar consumo** (`/`): botones grandes por producto, agrupados por
  categoría, para marcar que se ha abierto una unidad; queda registrada la
  fecha y hora exactas y **resta 1 del stock** de ese producto.
- **Control de stock** (`/stock`): mismo agrupado por categoría, mostrando las
  unidades actuales de cada producto con botones +/− para ajustarlas
  manualmente (reponer, corregir un conteo, etc.). Restar aquí **no** cuenta
  como consumo — para eso está "Registrar consumo".
- **Panel de control** (`/dashboard`): totales por producto, tendencia en el
  tiempo (día/semana/mes) y tabla de datos, con filtros de rango de fechas.

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/categories` | Lista categorías, ordenadas |
| GET | `/api/consumables` | Lista consumibles activos con su categoría, ordenados por categoría y posición |
| POST | `/api/consumables` | Crea un nuevo consumible (`name`, `categoryId`) |
| PATCH | `/api/consumables/:id` | Activa/desactiva un consumible |
| PATCH | `/api/consumables/:id/stock` | Ajusta el stock (`delta`, positivo o negativo; nunca baja de 0) |
| POST | `/api/consumption-logs` | Registra un consumo (`consumableId`) y resta 1 del stock |
| GET | `/api/consumption-logs` | Lista registros recientes (filtros: `from`, `to`, `consumableId`, `limit`) |
| GET | `/api/stats/summary` | Totales por producto en un rango (`from`, `to`) |
| GET | `/api/stats/timeseries` | Serie temporal por producto (`from`, `to`, `groupBy=day\|week\|month`) |

## Despliegue en Vercel

El repo se despliega como **dos proyectos de Vercel separados** apuntando al
mismo repositorio de Git, cada uno con su propio "Root Directory".

### Backend (`backend/`)

1. En Vercel, "Add New Project" → importa este repo → en **Settings → General
   → Root Directory** pon `backend` (**imprescindible**: si se deja en `.`,
   Vercel construye desde la raíz del monorepo, no encuentra nada y todo da
   404).
2. `backend/api/index.ts` es el entrypoint serverless: arranca Nest sobre un
   adaptador Express y reutiliza la instancia entre invocaciones (evita
   reconectar a la base de datos en cada request). `backend/vercel.json`
   reescribe cualquier ruta hacia esa función y además pone `buildCommand: ""`
   — sin eso, Vercel ejecuta `npm run build` (`nest build`) y luego falla
   porque espera una carpeta `public` de salida que un proyecto solo-API no
   tiene.
3. Variables de entorno del proyecto (Settings → Environment Variables):
   - `DATABASE_URL`: el connection string **pooled** de Neon (el que trae
     `-pooler` en el host), imprescindible en serverless para no agotar
     conexiones. Si conectaste la integración Neon↔Vercel, ya está puesta
     automáticamente.
   - `CORS_ORIGIN`: la URL del frontend desplegado (p. ej.
     `https://twinsstock.vercel.app`).
4. Despliega. La API queda en `https://<tu-backend>.vercel.app/api/...`.

### Frontend (`frontend/`)

1. "Add New Project" → mismo repo → **Root Directory: `frontend`** (mismo
   motivo que arriba). Vercel detecta Vite automáticamente.
2. Variable de entorno: `VITE_API_URL` = `https://<tu-backend>.vercel.app/api`.
3. `frontend/vercel.json` hace fallback a `index.html` para que las rutas de
   React Router (`/dashboard`) funcionen al recargar o enlazar directo.

Si al desplegar da `404: NOT_FOUND` en todas las rutas, casi seguro es el
Root Directory sin configurar (Settings → General → Root Directory, en cada
proyecto) — es la causa más común.

## Notas

- El esquema de la base de datos se sincroniza automáticamente
  (`synchronize: true`) para simplificar el desarrollo inicial. Antes de pasar
  a producción, conviene sustituirlo por migraciones de TypeORM.
- Añadir nuevos consumibles se puede hacer vía `POST /api/consumables` (se
  puede exponer más adelante en la UI si hace falta gestionarlos ahí).
