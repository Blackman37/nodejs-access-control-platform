# syntax=docker/dockerfile:1

ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-bookworm-slim AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/access-service/package.json ./services/access-service/package.json

RUN npm ci \
    && chown node:node /app /app/services /app/services/access-service

FROM dependencies AS source

COPY --chown=node:node tsconfig.base.json ./
COPY --chown=node:node services/access-service/tsconfig.json services/access-service/tsconfig.build.json ./services/access-service/
COPY --chown=node:node services/access-service/src ./services/access-service/src
COPY --chown=node:node services/access-service/test ./services/access-service/test

FROM source AS development

ENV NODE_ENV=development

USER node

EXPOSE 3000

CMD ["npm", "run", "dev:access"]

FROM source AS build

USER node

RUN npm run build --workspace @access-control/access-service

FROM node:${NODE_VERSION}-bookworm-slim AS production-dependencies

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/access-service/package.json ./services/access-service/package.json

RUN npm ci --omit=dev

FROM node:${NODE_VERSION}-bookworm-slim AS production

ENV NODE_ENV=production

WORKDIR /app

COPY --from=production-dependencies /app/node_modules ./node_modules
COPY services/access-service/package.json ./services/access-service/package.json
COPY --chown=root:root --from=build /app/services/access-service/dist ./services/access-service/dist

USER node

EXPOSE 3000

CMD ["node", "services/access-service/dist/main.js"]
