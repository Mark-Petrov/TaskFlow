FROM node:20-alpine

WORKDIR /app/server

# Зависимости бэкенда (полный install — нужен prisma CLI для generate)
COPY server/package.json server/package-lock.json ./
RUN npm install \
  && npm cache clean --force

# Схема БД → Prisma client генерируется внутри контейнера (не копируем node_modules с хоста)
COPY server/prisma ./prisma
RUN npx prisma generate

# Готовые артефакты (собираются локально: npm run build:deploy)
COPY server/dist ./dist
COPY frontend/dist ./public

# Убираем dev-зависимости после generate — образ остаётся лёгким
RUN npm prune --production \
  && npm cache clean --force

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
