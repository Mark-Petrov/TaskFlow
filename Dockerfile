# syntax=docker/dockerfile:1

# ── Stage 1: build React frontend ──────────────────────────────────────────
FROM node:22-alpine AS frontend-build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY src ./src
COPY public ./public

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: build Express backend ─────────────────────────────────────────
FROM node:22-alpine AS backend-build

WORKDIR /app

COPY server/package.json server/package-lock.json ./
RUN npm ci

COPY server/ ./

RUN npx prisma generate && npm run build

# ── Stage 3: production image ────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache tini curl \
  && addgroup -S taskflow \
  && adduser -S taskflow -G taskflow

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev \
  && npm install prisma@6.19.0 --no-save \
  && npm cache clean --force

COPY server/prisma ./prisma
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-build /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=frontend-build /app/dist ./public

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
  && mkdir -p /data \
  && chown -R taskflow:taskflow /app /data

USER taskflow

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--", "/entrypoint.sh"]
