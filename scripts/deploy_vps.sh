#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/srv/zhinan}"
BACKEND_SERVICE="${BACKEND_SERVICE:-zhinan-backend}"
FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_DIR="$APP_DIR/backend"

echo "==> Updating code in $APP_DIR"
cd "$APP_DIR"
git fetch origin
git pull --ff-only origin "${DEPLOY_BRANCH:-main}"

echo "==> Installing backend dependencies"
cd "$BACKEND_DIR"
if [ ! -d venv ]; then
  python3 -m venv venv
fi
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt

echo "==> Initializing database"
./venv/bin/python scripts/init_db.py

echo "==> Building frontend"
cd "$FRONTEND_DIR"
npm ci
npm run build

echo "==> Restarting backend"
sudo systemctl restart "$BACKEND_SERVICE"
sudo systemctl --no-pager --full status "$BACKEND_SERVICE"

echo "==> Reloading web server"
if command -v nginx >/dev/null 2>&1; then
  sudo nginx -t
  sudo systemctl reload nginx
elif command -v caddy >/dev/null 2>&1; then
  sudo systemctl reload caddy
fi

echo "Deploy finished."
