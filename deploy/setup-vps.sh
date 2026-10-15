#!/usr/bin/env bash
# Preparação única do VPS da Hostinger (Ubuntu 24.04 ou 26.04) para o Falcão ERP:
# PostgreSQL 16 (só local), Node 22, Nginx, Certbot, PM2, firewall e pastas.
# O PostgreSQL vem do repositório oficial (apt.postgresql.org) para ser o mesmo 16
# do desenvolvimento, seja qual for o padrão da versão do Ubuntu (o 26.04 traz o 18).
#
#   sudo DB_PASSWORD='senha-forte-do-banco' bash deploy/setup-vps.sh
#
# Pode rodar de novo: o que já existe é mantido.
set -euo pipefail

APP_USER="${APP_USER:-falcao}"
APP_DIR="${APP_DIR:-/var/www/falcao-erp}"
DATA_DIR="${DATA_DIR:-/var/lib/falcao-erp}"
DB_NAME="${DB_NAME:-falcao_erp}"
DB_USER="${DB_USER:-falcao}"
PG_VERSION="${PG_VERSION:-16}"
: "${DB_PASSWORD:?Defina DB_PASSWORD (senha do usuário do banco).}"

if [[ $EUID -ne 0 ]]; then
  echo "Rode como root (sudo)." >&2
  exit 1
fi

echo "==> Pacotes do sistema"
apt-get update -y
apt-get install -y ca-certificates curl gnupg git ufw nginx certbot python3-certbot-nginx

echo "==> PostgreSQL ${PG_VERSION} (repositório oficial)"
install -d /usr/share/postgresql-common/pgdg
curl -fsSL -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
  https://www.postgresql.org/media/keys/ACCC4CF8.asc
echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $(. /etc/os-release && echo "$VERSION_CODENAME")-pgdg main" \
  > /etc/apt/sources.list.d/pgdg.list
apt-get update -y
apt-get install -y "postgresql-${PG_VERSION}" "postgresql-client-${PG_VERSION}"

echo "==> Node.js 22 (NodeSource) e PM2"
if ! command -v node >/dev/null || [[ "$(node -v)" != v22* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
npm install -g pm2

echo "==> Usuário e pastas da aplicação"
id -u "$APP_USER" >/dev/null 2>&1 || adduser --system --group --home "/home/$APP_USER" --shell /bin/bash "$APP_USER"
mkdir -p "$APP_DIR" "$DATA_DIR/uploads" "$DATA_DIR/backups"
chown -R "$APP_USER:$APP_USER" "$APP_DIR" "$DATA_DIR"
chmod 750 "$DATA_DIR"

echo "==> PostgreSQL: banco e usuário (aceita conexão só de dentro do servidor)"
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;
SQL
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"
fi
# O padrão do Ubuntu já escuta só em localhost; garante que continue assim.
PG_CONF="$(sudo -u postgres psql -tAc 'SHOW config_file')"
sed -i "s/^#\?listen_addresses.*/listen_addresses = 'localhost'/" "$PG_CONF"
systemctl restart postgresql

echo "==> Firewall: só SSH e web (a porta 5432 do banco e a 3333 da API ficam fechadas)"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> PM2 sobe junto com o servidor"
pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" >/dev/null

cat <<EOF

Pronto. Próximos passos (como o usuário $APP_USER):
  1. sudo -iu $APP_USER
  2. git clone <repositório> $APP_DIR && cd $APP_DIR
  3. cp deploy/env.production.example .env   # e preencha (DATABASE_URL com a senha do banco)
  4. bash deploy/deploy.sh
  5. Nginx e HTTPS: veja deploy/nginx-falcao-erp.conf
  6. Primeiro administrador: npm run prisma:bootstrap -w apps/api (variáveis BOOTSTRAP_*)
  7. Backup diário: crontab -e  →  30 3 * * * bash $APP_DIR/deploy/backup.sh
EOF
