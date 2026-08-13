#!/bin/sh
set -e

cd /app/server

mkdir -p /data

echo "Applying database schema..."
./node_modules/.bin/prisma db push --skip-generate

echo "Starting TaskFlow..."
exec node dist/index.js
