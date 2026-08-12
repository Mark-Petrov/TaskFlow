# TaskFlow

Мобильный Kanban/Checklist менеджер задач с собственным бэкендом.

## Стек

**Frontend:** React 19 + Vite + Tailwind CSS + Socket.io Client  
**Backend:** Node.js + Express + Prisma + SQLite + JWT + Socket.io

## Быстрый старт

```bash
# 1. Установка зависимостей
npm install
cd server && npm install && cd ..

# 2. Настройка БД
cp server/.env.example server/.env
npm run db:push

# 3. Запуск (бэкенд + фронтенд)
npm run dev:server   # терминал 1 → http://localhost:3001
npm run dev          # терминал 2 → http://localhost:5173
```

Или одной командой: `npm run dev:all`

## API

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| GET | `/api/auth/me` | Текущий профиль |
| GET/POST | `/api/boards` | Список / создание досок |
| GET/PATCH/DELETE | `/api/boards/:id` | Доска |
| CRUD | `/api/boards/:id/tasks` | Задачи |
| CRUD | `/api/boards/:id/columns` | Колонки |
| CRUD | `/api/boards/:id/members` | Участники |
| GET | `/api/notifications` | Inbox-уведомления |

## WebSocket события

- `join-board` / `leave-board` — подписка на доску
- `task:created` / `task:updated` / `task:deleted` — синхронизация задач
- `notification` — персональные уведомления

## Структура

```
server/          Express API + Prisma + Socket.io
  prisma/        SQL-схема (SQLite)
  src/routes/    REST эндпоинты
src/             React PWA
  lib/api.ts     HTTP-клиент
  lib/socket.ts  WebSocket-клиент
```

## PostgreSQL (production)

В `server/prisma/schema.prisma` замените provider на `postgresql` и укажите `DATABASE_URL` в `.env`.
