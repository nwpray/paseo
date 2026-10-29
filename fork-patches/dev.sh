#!/usr/bin/env bash
# Run a local dev surface from the verified, patch-applied release worktree.
set -euo pipefail

surface="${1:-}"
case "$surface" in
  server | app | desktop | android | ios) script="dev:$surface" ;;
  web) script="web" ;;
  *) echo "usage: $0 {server|app|desktop|android|ios|web} [TAG]" >&2; exit 2 ;;
esac
TAG="${2:-v0.13.2}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKTREE="$("$SCRIPT_DIR/prepare.sh" "$TAG")"

if [[ ! -d "$WORKTREE/node_modules" ]]; then
  echo "Dependencies missing in $WORKTREE; run npm ci there before starting dev" >&2
  exit 1
fi

cd "$WORKTREE"
echo "Starting patched $TAG $surface dev from $WORKTREE (HEAD $(git rev-parse --short HEAD))" >&2
if node -e 'process.exit(/fork-patches\/dev\.sh/.test(require("./package.json").scripts[process.argv[1]] || "") ? 0 : 1)' "$script"; then
  exec env -u PASEO_HOME npm run "$script:raw"
fi
exec env -u PASEO_HOME npm run "$script"
