ARG NODE_VERSION=24-alpine

FROM node:${NODE_VERSION} AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
# Config/static files only (rarely change, baked into the image).
# docker-compose.yml bind-mounts ./frontend/src over /app/src for hot
# reload — deliberately NOT the whole ./frontend, so the real frontend/.env
# never ends up inside the container (Vite would read it and could override
# VITE_API_URL/etc. set by Compose).
COPY vite.config.ts tsconfig.json index.html ./
COPY public ./public

# --- dev: only src/ is bind-mounted by docker-compose.yml, see above ---
FROM base AS dev
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# --- build: compile static assets ---
FROM base AS build
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
COPY . .
RUN npm run build

# --- prod: nginx serving the built static files ---
FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
