#!/bin/sh
set -e

cd /app

mkdir -p /data

echo "Applying database schema..."
npx prisma db push --skip-generate

echo "Starting TaskFlow..."
exec node dist/index.js
