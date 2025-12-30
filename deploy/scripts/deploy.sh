#!/bin/bash
set -e

# Load environment from project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$DEPLOY_DIR/.." && pwd)"

if [ -f "$PROJECT_ROOT/.env" ]; then
  source "$PROJECT_ROOT/.env"
fi

if [ -z "$DEPLOY_REMOTE_HOST" ]; then
  echo "ERROR: DEPLOY_REMOTE_HOST environment variable is required"
  echo "Example: DEPLOY_REMOTE_HOST=deploy@your-server.com"
  exit 1
fi

REMOTE_HOST="$DEPLOY_REMOTE_HOST"
SSH_KEY="${DEPLOY_SSH_KEY_PATH:-}"

SSH_OPTS=""
if [ -n "$SSH_KEY" ]; then
  SSH_OPTS="-i $SSH_KEY"
fi

echo "=== Deploy server config ==="
echo "Target: $REMOTE_HOST"
echo ""

# Sync Caddy config to shared infra location
echo "Syncing Caddy config..."
rsync -avz ${SSH_KEY:+-e "ssh -i $SSH_KEY"} \
  "$DEPLOY_DIR/caddy/sites/" "$REMOTE_HOST:/opt/server/caddy/sites/"

# Sync certs if they exist
if [ -d "$DEPLOY_DIR/certs" ]; then
  echo "Syncing certs..."
  rsync -avz ${SSH_KEY:+-e "ssh -i $SSH_KEY"} \
    "$DEPLOY_DIR/certs/" "$REMOTE_HOST:/opt/server/certs/"
fi

# Reload Caddy to pick up config changes
echo "Reloading Caddy..."
ssh $SSH_OPTS "$REMOTE_HOST" "docker exec caddy caddy reload --config /etc/caddy/Caddyfile" || echo "Warning: Caddy reload failed (container may not be running)"

echo ""
echo "Done!"
