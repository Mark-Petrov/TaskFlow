#!/bin/sh
set -e

if ! docker image inspect taskflow:latest >/dev/null 2>&1; then
  echo ""
  echo "❌  Образ taskflow:latest не найден на этом сервере."
  echo ""
  echo "Сборка на VPS не поддерживается (нет node_modules, мало RAM)."
  echo ""
  echo "На Mac выполните:"
  echo "  npm run docker:export"
  echo "  scp taskflow-image.tar.gz root@THIS_SERVER:~/"
  echo ""
  echo "Затем на сервере:"
  echo "  docker load < ~/taskflow-image.tar.gz"
  echo "  ./scripts/server-up.sh"
  echo ""
  exit 1
fi

docker compose -f docker-compose.prod.yml up -d --no-build
echo "✓ TaskFlow запущен → http://localhost:${PORT:-3000}"
