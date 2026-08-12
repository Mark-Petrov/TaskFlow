# Деплой TaskFlow на VPS (Docker)

На слабом VPS (512 MB–1 GB RAM) **`npm install` внутри Docker падает** с `Exit handler never called` — не хватает памяти.

**Решение:** собирать образ **на Mac**, на сервер отправлять готовый image. На VPS — только `docker load` и `docker compose up` (без сборки).

---

## Быстрый деплой (рекомендуется)

### 1. На Mac — собрать и упаковать образ

```bash
cd TaskFlow
npm run docker:export
```

Создаётся файл **`taskflow-image.tar.gz`** (~150–200 MB).

Что делает `prepare:docker`:
- `frontend/dist/` — Vite
- `server/dist/` — TypeScript
- `server/node_modules/` — только production + Prisma client

### 2. Отправить на сервер

```bash
scp taskflow-image.tar.gz root@YOUR_SERVER:~/
scp .env.example root@YOUR_SERVER:~/TaskFlow/.env   # если ещё нет .env
```

Или через git — код проекта без `node_modules` и образа:

```bash
git push   # frontend/dist, server/dist в репозитории
```

### 3. На сервере — загрузить образ и запустить

```bash
cd ~/TaskFlow
git pull                    # docker-compose.yml, .env и т.д.

cp .env.example .env        # первый раз
nano .env                   # JWT_SECRET, CORS_ORIGIN

docker load < ~/taskflow-image.tar.gz
docker compose up -d --no-build
```

Проверка:

```bash
curl http://localhost:3000/api/health
```

---

## Обновление после изменений в коде

**На Mac:**

```bash
npm run docker:export
scp taskflow-image.tar.gz root@YOUR_SERVER:~/
```

**На сервере:**

```bash
docker load < ~/taskflow-image.tar.gz
cd ~/TaskFlow && docker compose up -d --no-build
```

---

## `.env` на сервере

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
docker compose ps
docker cp taskflow:/data/taskflow.db ./backup.db
```

---

## Альтернатива: сборка на сервере (нужен swap 1 GB+)

Только если на VPS добавлен swap и ≥2 GB RAM:

```bash
npm run prepare:docker   # локально, затем rsync server/node_modules на сервер
# или сборка образа на Mac: npm run docker:build
```

На слабом VPS **не используйте** `docker compose build` на сервере.

---

## Локальная разработка

```bash
cd server && cp .env.example .env && npm install && npm run db:push
cd .. && npm install && npm run dev:all
```
