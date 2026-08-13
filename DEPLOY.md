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
curl http://91.135.156.114:3000/api/health   # с вашего компьютера
```

**Открыть в браузере:** http://91.135.156.114:3000

### `.env` на сервере (важно для CORS)

```env
CORS_ORIGIN=http://91.135.156.114:3000
HOST=0.0.0.0
PORT=3000
JWT_SECRET=<ваш секрет>
```

### Если сайт не открывается

**Симптом:** `curl` с Mac пишет `Connected`, но ответа нет (зависает), а на сервере `curl http://127.0.0.1:3000/api/health` работает.

Это почти всегда **Docker + ufw/iptables**: порт «открыт», но пакеты не доходят до контейнера.

1. Обновите код и перезапустите (в compose включён `network_mode: host`):
   ```bash
   cd ~/TaskFlow
   git pull
   sudo docker compose -f docker-compose.prod.yml up -d --build
   sudo ss -tlnp | grep 3000   # должен быть node, не docker-proxy
   ```
2. **Фаервол панели хостинга** — входящий TCP **3000** и **22** для всех адресов, группа **подключена** к серверу.
3. **ufw** (если включён):
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 3000/tcp
   sudo ufw status
   ```
   Если не помогло — временно `sudo ufw disable` и проверьте с Mac снова.
4. Проверка с Mac:
   ```bash
   curl -v --max-time 10 http://91.135.156.114:3000/api/health
   ```
   Должно вернуть `{"ok":true,...}`.

```bash
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

## Docker Hub недоступен (ETIMEDOUT / registry-1.docker.io)

Если при сборке падает тайм-аут на `node:20-alpine`, настройте **зеркало registry** на сервере:

```bash
sudo nano /etc/docker/daemon.json
```

```json
{
  "registry-mirrors": [
    "https://mirror.gcr.io"
  ]
}
```

> Если в файле уже есть другие настройки — добавьте `"registry-mirrors"` внутрь существующего `{ ... }`.

```bash
sudo systemctl restart docker
cd ~/TaskFlow
sudo docker compose -f docker-compose.prod.yml up -d --build
```

Проверка, что зеркало применилось:

```bash
docker info | grep -A3 "Registry Mirrors"
```

**Альтернатива без сборки на сервере** — собрать образ на Mac и загрузить на VPS:

```bash
# Mac
npm run docker:export
scp taskflow-image.tar.gz root@91.135.156.114:~/

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
