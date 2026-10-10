#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

cd "$SCRIPT_DIR"

echo "Building plugin..."
npm run build

echo "Starting SearXNG..."
cd "$SCRIPT_DIR/docker"
docker compose up -d

echo "Done."
echo "SearXNG: http://localhost:8080"
