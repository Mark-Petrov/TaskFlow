# Деплой TaskFlow на VPS (Docker)

TaskFlow упаковывается в **один Docker-образ**: Express отдаёт API, WebSocket и собранный React-фронтенд. База SQLite хранится в **Docker Volume** и не теряется при перезапуске контейнера.

## Требования

- VPS с Ubuntu 22.04+ (или другой Linux)
- Docker Engine 24+ и Docker Compose v2
- Открытый порт **3000** (или тот, что зададите в `.env`)
- Домен (опционально, для HTTPS через Nginx/Caddy)

## Быстрый старт

### 1. Установите Docker на сервер

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# перелогиньтесь, чтобы группа docker применилась
```

### 2. Скопируйте проект на сервер

```bash
git clone <url-репозитория> taskflow
cd taskflow
```

Или загрузите архив и распакуйте.

### 3. Настройте переменные окружения

```bash
cp .env.example .env
nano .env
```

Обязательно измените:

| Переменная | Описание |
|---|---|
| `JWT_SECRET` | Случайная строка (`openssl rand -hex 32`) |
| `CORS_ORIGIN` | Публичный URL приложения, напр. `https://taskflow.example.com` |

### 4. Запустите

```bash
docker compose up -d --build
```

Проверка:

```bash
curl http://localhost:3000/api/health
# {"ok":true,"service":"taskflow-api"}
```

Откройте в браузере: `http://<IP-сервера>:3000`

### 5. Полезные команды

```bash
# Логи
docker compose logs -f taskflow

# Остановка
docker compose down

# Пересборка после обновления кода
docker compose up -d --build

# Статус
docker compose ps
```

## HTTPS через Nginx (рекомендуется)

Пример конфига `/etc/nginx/sites-available/taskflow`:

```nginx
server {
    listen 80;
    server_name taskflow.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name taskflow.example.com;

    ssl_certificate     /etc/letsencrypt/live/taskflow.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/taskflow.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

После настройки SSL обновите `.env`:

```env
CORS_ORIGIN=https://taskflow.example.com
```

И перезапустите контейнер:

```bash
docker compose up -d
```

## Данные и резервное копирование

SQLite-файл хранится в volume `taskflow-data` по пути `/data/taskflow.db` внутри контейнера.

```bash
# Путь к volume на хосте
docker volume inspect taskflow-data

# Бэкап базы
docker compose exec taskflow cp /data/taskflow.db /data/taskflow.db.bak
docker cp taskflow:/data/taskflow.db ./taskflow-backup.db
```

## PostgreSQL (опционально)

Для больших нагрузок можно перейти на PostgreSQL:

1. В `server/prisma/schema.prisma` смените `provider` на `"postgresql"`.
2. Добавьте сервис `postgres` в `docker-compose.yml`.
3. Укажите `DATABASE_URL=postgresql://...` в `.env`.
4. Пересоберите образ: `docker compose up -d --build`.

## Локальная разработка (без Docker)

```bash
cd server && cp .env.example .env && npm install && npm run db:push
cd .. && npm install
npm run dev:all
```

Фронтенд: `http://localhost:5173`, API: `http://localhost:3001`.

## Устранение неполадок

| Проблема | Решение |
|---|---|
| `JWT_SECRET is not set` | Заполните `JWT_SECRET` в `.env` |
| CORS / WebSocket ошибки | `CORS_ORIGIN` должен совпадать с URL в браузере |
| Пустая база после деплоя | Проверьте volume: `docker volume ls` |
| Контейнер перезапускается | `docker compose logs taskflow` — часто неверный `DATABASE_URL` |
