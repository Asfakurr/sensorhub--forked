# One Dockerfile, three targets (api, web, simulator) that share one dependency layer.
# Build a single target with: docker build --target api -t sensorhub-api .
FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN npm install -g pnpm@12.21.0
WORKDIR /repo

# Manifests first, so `pnpm install` is cached until a dependency changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/simulator/package.json apps/simulator/
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN pnpm --filter @sensorhub/shared build

FROM base AS api
RUN pnpm --filter api build
ENV PORT=4000
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]

FROM base AS simulator
RUN pnpm --filter simulator build
CMD ["node", "apps/simulator/dist/index.js"]

FROM base AS web
# Rewrites are resolved at build time: inside the compose network the API is "api:4000".
ARG API_URL=http://api:4000
ENV API_URL=$API_URL
RUN pnpm --filter web build
EXPOSE 3000
CMD ["pnpm", "--filter", "web", "start"]
