#!/bin/bash
set -e

echo "Pulling latest code..."
git pull origin main

echo "Building image..."
docker compose -f docker-compose.prod.yml build --no-cache

echo "Running migrations..."
docker compose -f docker-compose.prod.yml run --rm app npx drizzle-kit migrate

echo "Restarting services..."
docker compose -f docker-compose.prod.yml up -d

echo "Deploy selesai!"
