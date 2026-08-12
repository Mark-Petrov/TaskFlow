FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Только production-зависимости (без typescript, vite и т.д.)
COPY server/package.json server/package-lock.json ./
RUN npm install --production \
  && npm cache clean --force

# Prisma + сгенерированный клиент (собирается локально: npm run build:deploy)
COPY server/prisma ./prisma
COPY server/node_modules/.prisma ./node_modules/.prisma

# Готовый бэкенд (локально: npm run build:server)
COPY server/dist ./dist

# Готовый фронтенд (локально: npm run build)
COPY frontend/dist ./public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
