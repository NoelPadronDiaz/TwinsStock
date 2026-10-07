ARG NODE_VERSION=24-alpine

FROM node:${NODE_VERSION} AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
# Config files only (rarely change, baked into the image). docker-compose.yml
# bind-mounts ./backend/src over /app/src for hot reload — deliberately NOT
# the whole ./backend, so the real backend/.env (with production secrets)
# never ends up inside the container; @nestjs/config would happily read it
# and silently override DB_HOST/etc. with it if it did.
COPY nest-cli.json tsconfig.json tsconfig.build.json ./

# --- dev: only src/ is bind-mounted by docker-compose.yml, see above ---
FROM base AS dev
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# --- build: compile to dist/ ---
FROM base AS build
COPY . .
RUN npm run build

# --- prod: dist/ + production deps only, non-root user ---
FROM node:${NODE_VERSION} AS prod
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp
USER nodeapp
EXPOSE 3000
CMD ["node", "dist/main.js"]
