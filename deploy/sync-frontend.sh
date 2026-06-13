#!/usr/bin/env bash
set -euo pipefail

REPO="${REPO:-/srv/artshopvirts/mini-app-artyom130609}"
# Как в deploy/nginx/artshopvirts.space.example.conf — проверь: grep root /etc/nginx/sites-enabled/*
NGINX_HTML="${NGINX_HTML:-/var/www/artshopvirts/html}"

cd "$REPO"
git pull
npm ci
npm run build

if [[ ! -d "$NGINX_HTML" ]]; then
  echo "Папка $NGINX_HTML не существует. Задайте путь:" >&2
  echo "  NGINX_HTML=/путь/из/nginx/root sudo -E bash deploy/sync-frontend.sh" >&2
  exit 1
fi

rsync -a --delete "$REPO/dist/" "$NGINX_HTML/"
echo "OK: dist → $NGINX_HTML"
ls -la "$NGINX_HTML/index.html"
