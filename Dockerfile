# syntax=docker/dockerfile:1

FROM node:20-alpine

WORKDIR /app/server

ENV NODE_ENV=development

# Зависимости устанавливаются внутри контейнера (node_modules не копируется с хоста)
COPY server/package.json server/package-lock.json ./
RUN npm install \
  && npm cache clean --force

# Исходники бэкенда
COPY server/prisma ./prisma
COPY server/tsconfig.json ./
COPY server/src ./src

# Prisma client + компиляция TypeScript
RUN npx prisma generate \
  && npm run build

# Готовый фронтенд (соберите локально: npm run build)
COPY frontend/dist ./public

# Оставляем только production-зависимости
RUN npm prune --production \
  && npm cache clean --force

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
