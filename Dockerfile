# syntax=docker/dockerfile:1
# Полная сборка внутри Docker — на сервере npm не нужен.

# ── Stage 1: frontend ────────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app

ENV NODE_ENV=development

COPY package.json package-lock.json ./
RUN npm install \
  && npm cache clean --force

COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY src ./src
COPY public ./public

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: backend ─────────────────────────────────────────────────────────
FROM node:20-alpine AS backend-builder

WORKDIR /app

ENV NODE_ENV=development

COPY server/package.json server/package-lock.json ./
RUN npm install \
  && npm cache clean --force

COPY server/prisma ./prisma
COPY server/tsconfig.json ./
COPY server/src ./src

RUN npx prisma generate \
  && npm run build

# ── Stage 3: production ────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app/server

ENV NODE_ENV=production

COPY server/package.json server/package-lock.json ./
RUN npm install --production \
  && npm cache clean --force

COPY server/prisma ./prisma
COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=frontend-builder /app/frontend/dist ./public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
