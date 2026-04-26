#!/usr/bin/env bash
# Подключает deploy/nginx/notify.conf: symlink + include в server с listen 443.
# Выполнение: cd /srv/artshopvirts/mini-app-artyom130609 && sudo bash deploy/nginx/apply-notify.sh
#
# Не кладите .bak в sites-enabled/. Бэкапы: $BACKUP_DIR
set -euo pipefail

REPO="${REPO:-/srv/artshopvirts/mini-app-artyom130609}"
CONF="${NGINX_SITE:-/etc/nginx/sites-enabled/artshopvirts.space}"
SNIP="/etc/nginx/snippets/artshopvirts-notify.conf"
NOTIFY_FILE="$REPO/deploy/nginx/notify.conf"
INS="${REPO}/deploy/nginx/insert-include-443.py"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/nginx-artshopvirts}"

if [[ $EUID -ne 0 ]]; then
  echo "Запустите: sudo bash $0" >&2
  exit 1
fi
if [[ ! -f "$NOTIFY_FILE" || ! -f "$INS" ]]; then
  echo "Сделайте git pull в $REPO (нужны deploy/nginx/notify.conf и insert-include-443.py)" >&2
  exit 1
fi
if [[ ! -f "$CONF" ]]; then
  echo "Нет: $CONF" >&2
  exit 1
fi

ln -sf "$NOTIFY_FILE" "$SNIP"
echo "Symlink: $SNIP -> $NOTIFY_FILE"

export BACKUP_DIR
if ! OUT="$(python3 "$INS" "$CONF" 2>&1)"; then
  echo "$OUT"
  exit 1
fi
echo "$OUT"

nginx -t
systemctl reload nginx
echo "nginx перезагружен."
echo
echo "POST /notify/payment/prepare (ожидается JSON, не 405, не <html>):"
curl -sS -X POST -H "Content-Type: application/json" -d '{"initData":"x"}' -D- "https://artshopvirts.space/notify/payment/prepare" | head -8 || true
