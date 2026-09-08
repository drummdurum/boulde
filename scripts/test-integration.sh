#!/bin/sh
set -eu

project_name="boulde-integration"
compose_files="-f ../compose.yml -f ../compose.integration.yml"

cleanup() {
  docker compose -p "$project_name" $compose_files down --volumes --remove-orphans
}

trap cleanup EXIT INT TERM
cleanup
docker compose -p "$project_name" $compose_files up -d --build --wait mail-api mail-worker media-api

INTEGRATION_MAIL_URL=http://localhost:13101 \
INTEGRATION_MEDIA_URL=http://localhost:13102 \
vitest run --config vitest.integration.config.ts
