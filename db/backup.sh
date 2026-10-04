#!/usr/bin/env bash
set -euo pipefail

source .env 2>/dev/null || true
TS=$(date +%Y%m%d_%H%M%S)
pg_dump "${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/tycoon}" -F c -f "backup_${TS}.dump"
echo "Backup saved: backup_${TS}.dump"
