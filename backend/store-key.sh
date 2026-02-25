#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"

read -r -s -p "OpenAI API key: " OPENAI_API_KEY
echo

if [[ -z "${OPENAI_API_KEY}" ]]; then
  echo "No key entered. Aborting."
  exit 1
fi

if [[ -f "${ENV_FILE}" ]]; then
  cp "${ENV_FILE}" "${ENV_FILE}.bak"
fi

cat > "${ENV_FILE}" <<ENV
OPENAI_API_KEY=${OPENAI_API_KEY}
HOST=127.0.0.1
PORT=8787
OPENAI_MODEL=gpt-4o-mini
ENV

echo "Saved backend config to ${ENV_FILE}"
