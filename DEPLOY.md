# Деплой TaskFlow на VPS (Docker)

## Сборка на сервере (после добавления Swap)

```bash
# 1. Фронтенд — локально или на сервере (лёгкая сборка)
npm run build

# 2. На сервере — Docker собирает бэкенд сам (npm install + tsc + prisma)
git pull
sudo docker compose build --no-cache
sudo docker compose up -d
```

Docker **не копирует** `node_modules` с хоста — всё ставится внутри контейнера.

---

## Сборка образа на Mac (альтернатива)

```bash
npm run build
npm run docker:export
scp taskflow-image.tar.gz root@SERVER:~/
```

На сервере:

```bash
docker load < ~/taskflow-image.tar.gz
./scripts/server-up.sh
```

---

## `.env`

```env
PORT=3000
JWT_SECRET=<openssl rand -hex 32>
CORS_ORIGIN=http://YOUR_IP:3000
DATABASE_URL=file:/data/taskflow.db
```

---

## Полезные команды

```bash
docker compose logs -f taskflow
docker compose down
curl http://localhost:3000/api/health
```
