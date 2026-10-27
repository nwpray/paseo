#!/usr/bin/env bash
# fork-patches/build.sh: build the Paseo desktop app from an upstream release tag
# plus the local patch stack in fork-patches/*.patch.
#
# USAGE
#   fork-patches/build.sh [TAG]          # TAG defaults to v0.13.2
#   fork-patches/build.sh --help
#
# WHAT IT DOES
#   1. Resolves TAG (fetches it from the `upstream` remote if it is not local).
#   2. Recreates a detached git worktree of TAG at $FORK_BUILD_DIR/<TAG>
#      (default: <repo>/.fork-build/<TAG>, gitignored). Any previous worktree
#      at that path is removed first, so every build starts clean.
#   3. Applies fork-patches/*.patch in lexical order with `git am --3way`.
#      Any patch that does not apply aborts the build (exit 1).
#   4. Runs `npm ci` (upstream's postinstall patch-package step runs as usual)
#      and `npm run build:desktop` for macOS, unsigned-for-distribution:
#      ad-hoc signature, no hardened runtime, no notarization, --publish never.
#
# ENVIRONMENT
#   FORK_BUILD_DIR   Scratch root for worktrees (default: <repo>/.fork-build)
#   FORK_BUILD_ARCH  arm64 (default) or x64
#   NODE_HEAP_MB     Node heap for the Metro/expo export (default: 4096, as CI)
#
# PREREQUISITES
#   macOS + Xcode Command Line Tools, Node 22.x (upstream pins 22.20.0 in
#   .tool-versions) with npm 10, network access (npm registry, Electron
#   download). No Apple signing identity needed. ~6 GB free disk per worktree.
#
# OUTPUT
#   $FORK_BUILD_DIR/<TAG>/packages/desktop/release/
#     Paseo-<version>-<arch>.dmg, .zip, mac-<arch>/Paseo.app
#   Nothing is installed or published.
#
# NOTES
#   - The built app still contains upstream's auto-updater config
#     (provider: github, getpaseo/paseo). If you install it, an upstream update
#     will replace it and drop the patches. Add a patch that changes `publish:`
#     in packages/desktop/electron-builder.yml before relying on it day to day.
#   - Adding a patch: commit the change on top of TAG in the worktree, then
#     `git format-patch -1 HEAD -o fork-patches/` and rename to NNNN-slug.patch.
#   - Patch commits in the scratch worktree are made with commit.gpgsign=false;
#     they never leave the worktree.
#
# EXAMPLES
#   fork-patches/build.sh
#   fork-patches/build.sh v0.13.3
#   FORK_BUILD_ARCH=x64 fork-patches/build.sh v0.13.2
#   FORK_BUILD_DIR=$HOME/tmp/paseo-builds fork-patches/build.sh

set -euo pipefail

usage() { sed -n '2,/^$/{s/^# \{0,1\}//;p;}' "$0"; }

case "${1:-}" in
  -h | --help) usage; exit 0 ;;
  -*) echo "error: unknown option $1" >&2; usage >&2; exit 2 ;;
esac

TAG="${1:-v0.13.2}"
ARCH="${FORK_BUILD_ARCH:-arm64}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
BUILD_ROOT="${FORK_BUILD_DIR:-$REPO_ROOT/.fork-build}"
WORKTREE="$BUILD_ROOT/$TAG"

die() { echo "error: $*" >&2; exit 1; }
log() { printf '\n==> %s\n' "$*"; }

[[ "$(uname -s)" == Darwin ]] || die "this script builds the macOS app; run it on macOS"
[[ "$ARCH" == arm64 || "$ARCH" == x64 ]] || die "FORK_BUILD_ARCH must be arm64 or x64"
command -v node >/dev/null || die "node not found"
node_major="$(node -p 'process.versions.node.split(".")[0]')"
[[ "$node_major" == 22 ]] || die "need Node 22.x (upstream pins 22.20.0), found $(node -v)"

shopt -s nullglob
patches=("$SCRIPT_DIR"/*.patch)
shopt -u nullglob
(( ${#patches[@]} > 0 )) || die "no patches found in $SCRIPT_DIR"

log "Resolving $TAG"
if ! git -C "$REPO_ROOT" rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  git -C "$REPO_ROOT" fetch upstream "refs/tags/$TAG:refs/tags/$TAG" ||
    die "tag $TAG not found locally or on the upstream remote"
fi
TAG_SHA="$(git -C "$REPO_ROOT" rev-parse "$TAG^{commit}")"
echo "$TAG -> $TAG_SHA"

log "Creating clean worktree at $WORKTREE"
if [[ -e "$WORKTREE" ]]; then
  git -C "$REPO_ROOT" worktree remove --force "$WORKTREE" 2>/dev/null || rm -rf "$WORKTREE"
fi
git -C "$REPO_ROOT" worktree prune
mkdir -p "$BUILD_ROOT"
git -C "$REPO_ROOT" worktree add --detach "$WORKTREE" "$TAG_SHA"

log "Applying ${#patches[@]} patch(es)"
for p in "${patches[@]}"; do
  echo "  $(basename "$p")"
  if ! git -C "$WORKTREE" -c commit.gpgsign=false am --3way --quiet "$p"; then
    git -C "$WORKTREE" am --abort 2>/dev/null || true
    die "patch $(basename "$p") does not apply to $TAG; rebase it and regenerate"
  fi
done
git -C "$WORKTREE" log --oneline "$TAG_SHA..HEAD"

cd "$WORKTREE"

log "Installing dependencies (npm ci)"
# LEFTHOOK=0 keeps the root `prepare` script from installing git hooks into the
# shared .git/hooks of the parent clone.
LEFTHOOK=0 npm ci

log "Building desktop app (macOS $ARCH, ad-hoc signed, not notarized)"
start=$SECONDS
# CSC_IDENTITY_AUTO_DISCOVERY=false: never pick up a Developer ID from the keychain.
# mac.identity=-: ad-hoc signature, required for arm64 binaries to launch.
# mac.hardenedRuntime=false: hardened runtime + ad-hoc breaks library validation.
# mac.notarize=false: no Apple credentials. PASEO_DESKTOP_SMOKE unset: the
# afterSign/afterPack smoke test would launch the packaged app.
env -u PASEO_DESKTOP_SMOKE \
  CSC_IDENTITY_AUTO_DISCOVERY=false \
  NODE_OPTIONS="--max-old-space-size=${NODE_HEAP_MB:-4096}" \
  npm run build:desktop -- \
  --publish never --mac "--$ARCH" \
  -c.mac.identity=- \
  -c.mac.hardenedRuntime=false \
  -c.mac.notarize=false

log "Done in $(( (SECONDS - start) / 60 ))m $(( (SECONDS - start) % 60 ))s"
ls -lh "$WORKTREE/packages/desktop/release/"*.{dmg,zip} 2>/dev/null || true
echo "App bundle: $(ls -d "$WORKTREE/packages/desktop/release/"mac*/Paseo.app 2>/dev/null)"
