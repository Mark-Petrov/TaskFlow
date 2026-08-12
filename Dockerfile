FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Только production-зависимости бэкенда — без dev-пакетов и сборки внутри контейнера
COPY server/package.json server/package-lock.json ./
RUN npm install --production \
  && npm cache clean --force

# Скомпилированный бэкенд (server/dist → /app, entrypoint: index.js)
COPY server/dist/ ./

# Prisma schema + сгенерированный клиент (собирается на хосте до docker build)
COPY server/prisma ./prisma
COPY server/node_modules/.prisma ./node_modules/.prisma

# Готовая статика фронтенда (собирается на хосте: npm run build → frontend/dist)
COPY frontend/dist ./public

EXPOSE 3000

CMD ["node", "index.js"]
