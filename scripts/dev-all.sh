#!/usr/bin/env bash
#
# dev-all.sh — sobe todos os apps do monorepo (server + web).
#
# Uso:
#   bash scripts/dev-all.sh              # mesma tela (concurrently, saída colorida)
#   bash scripts/dev-all.sh --terminals  # cada app numa janela do Terminal.app (macOS)
#
set -euo pipefail

# Raiz do repo (pasta acima de scripts/)
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Carrega o .env na raiz (se existir) e exporta as vars para os processos filhos.
if [[ -f ".env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

run_terminals() {
  if [[ "$(uname)" != "Darwin" ]]; then
    echo "❌ --terminals só é suportado no macOS (usa osascript/Terminal.app)."
    exit 1
  fi
  echo "Abrindo server e web em janelas separadas do Terminal..."
  for app in server web; do
    osascript <<APPLESCRIPT
tell application "Terminal"
  do script "cd \"$ROOT\" && set -a && [ -f .env ] && . ./.env; set +a; pnpm dev:$app"
  activate
end tell
APPLESCRIPT
  done
}

run_same_screen() {
  echo "Subindo server (:3011) e web (:3010) na mesma tela. Ctrl+C encerra todos."
  pnpm exec concurrently \
    --names "server,web" \
    -c "blue,green" \
    --kill-others-on-fail \
    "pnpm dev:server" \
    "pnpm dev:web"
}

case "${1:-}" in
  --terminals) run_terminals ;;
  "")          run_same_screen ;;
  *)
    echo "Opção inválida: $1"
    echo "Uso: bash scripts/dev-all.sh [--terminals]"
    exit 1
    ;;
esac
