# Деплой TaskFlow на VPS

На сервере **не нужен npm** — multi-stage Dockerfile собирает всё внутри Docker.

## Быстрый запуск (одна команда)

```bash
cd ~/TaskFlow
git pull
cp .env.example .env   # первый раз: задайте JWT_SECRET и CORS_ORIGIN
bash scripts/server-up.sh
```

## Ручной запуск

```bash
sudo docker compose -f docker-compose.prod.yml up --build -d
```

## Проверка

```bash
curl http://localhost:3000/api/health
docker compose -f docker-compose.prod.yml logs -f taskflow
```

---

## `.env` (обязательно)

```env
JWT_SECRET=<openssl rand -hex 32>
CORS_ORIGIN=http://YOUR_IP:3000
DATABASE_URL=file:/data/taskflow.db
PORT=3000
```

---

## Готовый образ с Mac (без сборки на сервере)

```bash
# Mac
npm run docker:export
scp taskflow-image.tar.gz root@SERVER:~/

# Server
docker load < ~/taskflow-image.tar.gz
docker compose -f docker-compose.prod.yml up -d --no-build
```

---

## Локальная разработка

```bash
npm install && npm install --prefix server
npm run dev:all
```
