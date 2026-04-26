#!/usr/bin/env bash
# Подключает deploy/nginx/notify.conf к сайту artshopvirts (одна команда на сервере).
# Запуск: sudo bash /srv/artshopvirts/mini-app-artyom130609/deploy/nginx/apply-notify.sh
set -euo pipefail

REPO="${REPO:-/srv/artshopvirts/mini-app-artyom130609}"
CONF="${NGINX_SITE:-/etc/nginx/sites-enabled/artshopvirts.space}"
SNIP="/etc/nginx/snippets/artshopvirts-notify.conf"
NOTIFY_FILE="$REPO/deploy/nginx/notify.conf"
INC_LINE='    include /etc/nginx/snippets/artshopvirts-notify.conf;'

if [[ $EUID -ne 0 ]]; then
  echo "Запустите с sudo: sudo bash $0" >&2
  exit 1
fi

if [[ ! -f "$NOTIFY_FILE" ]]; then
  echo "Нет файла: $NOTIFY_FILE (сделайте git pull в $REPO)" >&2
  exit 1
fi
if [[ ! -f "$CONF" ]]; then
  echo "Нет конфига: $CONF (задайте NGINX_SITE=... )" >&2
  exit 1
fi

ln -sf "$NOTIFY_FILE" "$SNIP"
echo "Symlink: $SNIP -> $NOTIFY_FILE"

if grep -qE 'snippets/artshopvirts-notify|deploy/nginx/notify\.conf' "$CONF"; then
  echo "include уже есть в $CONF — пропускаем вставку"
else
  cp -a "$CONF" "${CONF}.bak.$(date +%Y%m%d%H%M%S)"
  N=$(grep -cE 'server_name[[:space:]]+.*artshopvirts' "$CONF" || true)
  if [[ -z "$N" || "$N" -eq 0 ]]; then
    echo "Не найдено server_name с artshopvirts в $CONF" >&2
    exit 1
  fi
  # Один server — вставка после server_name. Два (80+443) — после второго server_name = обычно HTTPS.
  if [[ "$N" -ge 2 ]]; then
    TGT=2
  else
    TGT=1
  fi
  awk -v t="$TGT" -v line="$INC_LINE" '
    $0 ~ /server_name/ && $0 ~ /artshopvirts/ { c++; if (c==t) { print; print line; next } }
    { print }
  ' "$CONF" > "${CONF}.new"
  mv "${CONF}.new" "$CONF"
  echo "Добавлена строка include (после server_name #${TGT}) в $CONF"
fi

nginx -t
systemctl reload nginx
echo "nginx перезагружен."
echo
echo "Проверка (должен быть JSON, не HTML):"
curl -sS -X POST -H "Content-Type: application/json" -d '{"initData":"x"}' -D- "https://artshopvirts.space/notify/payment/prepare" | head -8 || true
