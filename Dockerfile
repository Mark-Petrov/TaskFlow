FROM node:20-alpine

WORKDIR /app/server

ENV NODE_ENV=production

# На сервере npm install НЕ запускается — всё готовится локально: npm run prepare:docker
COPY server/package.json ./
COPY server/node_modules ./node_modules
COPY server/prisma ./prisma
COPY server/dist ./dist
COPY frontend/dist ./public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
