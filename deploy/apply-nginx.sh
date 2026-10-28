#!/usr/bin/env bash
# Instala deploy/nginx-producao.conf no lugar do site atual, com cópia de segurança.
# Rode DEPOIS do deploy (o site novo já não usa /uploads). Pode rodar mais de uma vez.
#
#   sudo bash /var/www/falcao-erp/deploy/apply-nginx.sh
#
# Se `nginx -t` reclamar, a configuração anterior volta sozinha e nada é recarregado.
set -euo pipefail

[ "$(id -u)" -eq 0 ] || { echo "Rode com sudo." >&2; exit 1; }
SRC=/var/www/falcao-erp/deploy/nginx-producao.conf
SITE=$(readlink -f /etc/nginx/sites-enabled/falcao-erp)
BACKUP=/root/nginx-falcao-erp.bak-$(date +%Y%m%d-%H%M)

cp -p "$SITE" "$BACKUP"
echo "Cópia da configuração atual: $BACKUP"
cp "$SRC" "$SITE"

if nginx -t; then
  systemctl reload nginx
  echo "Nginx recarregado com a configuração nova."
else
  cp -p "$BACKUP" "$SITE"
  nginx -t && echo "Configuração nova recusada pelo nginx -t — a anterior foi restaurada (nada mudou)." >&2
  exit 1
fi

echo
echo "Conferência:"
curl -sS -o /dev/null -D - https://suprimentos.falcaoengenhariasz.com/ | grep -iE "^HTTP|^server:|strict-transport|content-security" || true
echo "Para voltar atrás: sudo cp $BACKUP $SITE && sudo nginx -t && sudo systemctl reload nginx"
