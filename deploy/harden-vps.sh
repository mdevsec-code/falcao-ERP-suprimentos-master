#!/usr/bin/env bash
# Reforço de segurança do VPS (auditoria de 28/10/2026). Pode rodar mais de uma vez.
#
#   sudo bash /var/www/falcao-erp/deploy/harden-vps.sh
#
# 1. API escuta só em 127.0.0.1 (HOST no .env; vale a partir do próximo deploy/reload)
# 2. Pasta de uploads só para o usuário da aplicação (750)
# 3. Backup diário do banco e dos uploads às 02:30 (deploy/backup.sh, 14 dias) + um backup agora
# 4. fail2ban contra tentativa de senha no SSH
# Cada arquivo alterado ganha uma cópia em /root antes.
set -euo pipefail

APP=/var/www/falcao-erp
APP_USER=falcao
STAMP=$(date +%Y%m%d-%H%M)
[ "$(id -u)" -eq 0 ] || { echo "Rode com sudo." >&2; exit 1; }

echo "==> 1. HOST=127.0.0.1 no .env"
cp -p "$APP/.env" "/root/falcao-env.bak-$STAMP"
chmod 600 "/root/falcao-env.bak-$STAMP"
if ! grep -q '^HOST=' "$APP/.env"; then
  printf '\n# Só o Nginx (no mesmo servidor) fala com a API.\nHOST=127.0.0.1\n' >> "$APP/.env"
fi
grep '^HOST=' "$APP/.env"

echo "==> 2. Uploads só para $APP_USER"
UPLOADS=$(grep -h '^UPLOADS_DIR=' "$APP/.env" | cut -d= -f2- | tr -d '"')
chmod 750 "$UPLOADS"
stat -c '%U:%G %a %n' "$UPLOADS"

echo "==> 3. Backup diário"
install -d -o "$APP_USER" -g "$APP_USER" -m 700 /var/lib/falcao-erp/backups
touch /var/log/falcao-erp-backup.log
chown "$APP_USER:$APP_USER" /var/log/falcao-erp-backup.log
chmod 640 /var/log/falcao-erp-backup.log
cat > /etc/cron.d/falcao-erp-backup <<'CRON'
# Backup diário do Falcão ERP (banco + uploads), 14 dias de retenção — deploy/backup.sh
30 2 * * * falcao cd /var/www/falcao-erp && bash deploy/backup.sh >> /var/log/falcao-erp-backup.log 2>&1
CRON
chmod 644 /etc/cron.d/falcao-erp-backup
sudo -u "$APP_USER" -H bash -lc "cd $APP && bash deploy/backup.sh"
LAST=$(ls -t /var/lib/falcao-erp/backups/banco_*.dump | head -1)
TABLES=$(sudo -u "$APP_USER" pg_restore --list "$LAST" | grep -c "TABLE DATA" || true)
echo "Último backup: $LAST ($TABLES tabelas com dados)"
[ "$TABLES" -gt 10 ] || { echo "O backup parece incompleto — confira antes de seguir." >&2; exit 1; }

echo "==> 4. fail2ban (SSH)"
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq fail2ban >/dev/null
systemctl enable --now fail2ban >/dev/null
sleep 3
systemctl is-active fail2ban
fail2ban-client status sshd | head -4

echo
echo "Pronto. A API passa a escutar só em 127.0.0.1 no próximo deploy (ou: sudo -u $APP_USER -H bash -lc 'pm2 reload falcao-erp-api --update-env')."
