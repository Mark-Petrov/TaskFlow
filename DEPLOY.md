# Деплой TaskFlow на VPS (Docker)

**Сборка фронтенда и бэкенда — локально.** Prisma client генерируется **на сервере при `docker build`** (не копируется из git). На VPS не нужны TypeScript и Vite.

## Схема

```
[Ваш Mac/PC]  npm run build:deploy  →  frontend/dist + server/dist
       ↓ git push / rsync / scp
[VPS]         docker compose up --build -d  →  готово за ~30 сек
```

---

## 1. Локальная сборка (один раз перед деплоем)

```bash
cd TaskFlow
npm install
npm install --prefix server
npm run build:deploy
```

Проверьте, что появились папки:

```bash
ls frontend/dist/index.html
ls server/dist/index.js
```

---

## 2. Отправка на сервер

**Через Git** (рекомендуется — `frontend/dist` и `server/dist` не в `.gitignore`):

```bash
git add frontend/dist server/dist
git commit -m "build: deploy artifacts"
git push origin main
```

**Через архив** (если не хотите коммитить dist):

```bash
tar czf deploy.tar.gz \
  Dockerfile docker-compose.yml .env.example \
  server/package.json server/package-lock.json \
  server/prisma server/dist \
  frontend/dist
scp deploy.tar.gz root@YOUR_SERVER:/root/TaskFlow/
```

---

## 3. Настройка сервера (первый раз)

```bash
# Docker
curl -fsSL https://get.docker.com | sh

# Проект
git clone https://github.com/Mark-Petrov/TaskFlow.git
cd TaskFlow

# Переменные окружения
cp .env.example .env
nano .env   # JWT_SECRET и CORS_ORIGIN
```

Обязательно в `.env`:

| Переменная | Пример |
|---|---|
| `JWT_SECRET` | `openssl rand -hex 32` |
| `CORS_ORIGIN` | `http://123.45.67.89:3000` или ваш домен |

---

## 4. Запуск на сервере

```bash
docker compose up --build -d
```

Проверка:

```bash
curl http://localhost:3000/api/health
# {"ok":true,"service":"taskflow-api"}
```

---

## 5. Обновление после изменений в коде

**На Mac:**

```bash
npm run build:deploy
git add -A && git commit -m "update" && git push
```

**На сервере:**

```bash
git pull
docker compose up --build -d
```

---

## Полезные команды

```bash
docker compose logs -f taskflow   # логи
docker compose down             # остановка
docker compose ps               # статус
```

---

## HTTPS через Nginx

После настройки SSL обновите `.env`:

```env
CORS_ORIGIN=https://your-domain.com
```

```bash
docker compose up -d
```

Пример конфига Nginx — см. раздел ниже в этом файле или стандартный reverse proxy на порт `3000`.

---

## Бэкап базы SQLite

```bash
docker cp taskflow:/data/taskflow.db ./backup.db
```

---

## Локальная разработка (без Docker)

```bash
cd server && cp .env.example .env && npm install && npm run db:push
cd .. && npm install && npm run dev:all
```

Фронтенд: `http://localhost:5173`, API: `http://localhost:3001`.

---

## Устранение неполадок

| Ошибка | Решение |
|---|---|
| `COPY server/dist failed` | Запустите `npm run build:deploy` локально и залейте на сервер |
| `COPY frontend/dist failed` | То же — нужна локальная сборка фронтенда |
| `prisma generate` timeout | Проблема с сетью на сервере; повторите `docker compose build` |
| CORS / WebSocket | `CORS_ORIGIN` = URL в браузере |
| `JWT_SECRET is not set` | Заполните `.env` на сервере |
