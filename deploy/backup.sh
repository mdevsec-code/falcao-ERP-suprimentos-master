#!/usr/bin/env bash
# Backup diário do banco (pg_dump) e dos arquivos enviados, guardando 14 dias.
#
#   crontab -e  →  30 3 * * * bash /var/www/falcao-erp/deploy/backup.sh
#
# Copie a pasta de backups para fora do VPS de tempos em tempos (outro servidor,
# Google Drive, S3…) — backup que fica só no mesmo disco não protege de perda do VPS.
set -euo pipefail

cd "$(dirname "$0")/.."
# shellcheck disable=SC1091
set -a; source .env; set +a

BACKUP_DIR="${BACKUP_DIR:-/var/lib/falcao-erp/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y-%m-%d_%H%M)"
mkdir -p "$BACKUP_DIR"

# O pg_dump não entende o parâmetro `schema` da URL do Prisma.
PG_URL="${DATABASE_URL%%\?*}"
pg_dump --format=custom --no-owner "$PG_URL" > "$BACKUP_DIR/banco_$STAMP.dump"
tar -czf "$BACKUP_DIR/uploads_$STAMP.tar.gz" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")"

find "$BACKUP_DIR" -type f \( -name 'banco_*.dump' -o -name 'uploads_*.tar.gz' \) -mtime +"$KEEP_DAYS" -delete
echo "Backup $STAMP concluído em $BACKUP_DIR"

# Restaurar o banco:  pg_restore --clean --no-owner -d "$PG_URL" banco_AAAA-MM-DD_HHMM.dump
