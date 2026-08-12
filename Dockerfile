# syntax=docker/dockerfile:1

# ── Stage 1: build React frontend ────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install \
  && npm cache clean --force

COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY src ./src
COPY public ./public

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: build Express backend ─────────────────────────────────────────────
FROM node:20-alpine AS backend-builder

WORKDIR /app

COPY server/package.json server/package-lock.json ./
RUN npm install \
  && npm cache clean --force

COPY server/ ./

RUN npx prisma generate \
  && npm run build

# ── Stage 3: production runtime ──────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S taskflow \
  && adduser -S taskflow -G taskflow \
  && mkdir -p /data \
  && chown taskflow:taskflow /data

COPY server/package.json server/package-lock.json ./
RUN npm install --production \
  && npm cache clean --force

COPY server/prisma ./prisma
COPY --from=backend-builder /app/dist ./
COPY --from=backend-builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=frontend-builder /app/frontend/dist ./public

USER taskflow

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "index.js"]
