#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="docker-compose.prod.yml"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "❌  Не найден $COMPOSE_FILE"
  exit 1
fi

if [ ! -f .env ]; then
  echo "⚠️  Файл .env не найден — создайте из .env.example"
  echo "   cp .env.example .env && nano .env"
  exit 1
fi

run_compose() {
  docker compose -f "$COMPOSE_FILE" up -d --build "$@"
}

echo "→ Сборка и запуск TaskFlow (npm на сервере не нужен)..."

if docker info >/dev/null 2>&1; then
  run_compose
elif command -v sudo >/dev/null 2>&1; then
  sudo docker compose -f "$COMPOSE_FILE" up -d --build
else
  echo "❌  Нет доступа к Docker. Запустите от root или добавьте пользователя в группу docker."
  exit 1
fi

echo "✓ TaskFlow запущен → http://localhost:${PORT:-3000}"
echo "  Логи: docker compose -f $COMPOSE_FILE logs -f taskflow"
