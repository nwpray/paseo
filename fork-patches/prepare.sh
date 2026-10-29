#!/usr/bin/env bash
# Prepare or verify a patch-applied release worktree without discarding local work.
set -euo pipefail

TAG="${1:-v0.13.2}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
BUILD_ROOT="${FORK_BUILD_DIR:-$REPO_ROOT/.fork-build}"
case "$BUILD_ROOT" in
  /*) ;;
  *) BUILD_ROOT="$REPO_ROOT/$BUILD_ROOT" ;;
esac
WORKTREE="$BUILD_ROOT/$TAG"

die() { echo "error: $*" >&2; exit 1; }
[[ "$TAG" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || die "invalid tag name: $TAG"

shopt -s nullglob
patches=("$SCRIPT_DIR"/*.patch)
shopt -u nullglob
(( ${#patches[@]} > 0 )) || die "no patches found in $SCRIPT_DIR"

if ! git -C "$REPO_ROOT" rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  git -C "$REPO_ROOT" fetch upstream "refs/tags/$TAG:refs/tags/$TAG" ||
    die "tag $TAG not found locally or on the upstream remote"
fi
TAG_SHA="$(git -C "$REPO_ROOT" rev-parse "$TAG^{commit}")"

if [[ -e "$WORKTREE" || -L "$WORKTREE" ]]; then
  [[ -d "$WORKTREE" ]] || die "$WORKTREE exists and is not a directory"
  actual_root="$(git -C "$WORKTREE" rev-parse --show-toplevel 2>/dev/null)" ||
    die "$WORKTREE exists but is not a Git worktree"
  [[ "$actual_root" == "$WORKTREE" ]] || die "$WORKTREE is not its own Git worktree"
  git -C "$WORKTREE" merge-base --is-ancestor "$TAG_SHA" HEAD ||
    die "$WORKTREE is not based on $TAG; choose another FORK_BUILD_DIR"

  commits=()
  while IFS= read -r commit; do commits+=("$commit"); done \
    < <(git -C "$WORKTREE" rev-list --reverse "$TAG_SHA..HEAD")
  (( ${#commits[@]} <= ${#patches[@]} )) ||
    die "$WORKTREE has ${#commits[@]} commits above $TAG, but only ${#patches[@]} patches; inspect it before rebuilding"
  for i in "${!commits[@]}"; do
    # The last patch-id is the actual diff if a patch's prose mentions another
    # commit in mbox form (as 0001 currently does).
    expected="$(git patch-id --stable < "${patches[$i]}" | tail -n 1 | cut -d ' ' -f 1)"
    actual="$(git -C "$WORKTREE" show --format= --binary "${commits[$i]}" | git patch-id --stable | cut -d ' ' -f 1)"
    [[ -n "$expected" && "$expected" == "$actual" ]] ||
      die "$WORKTREE differs from $(basename "${patches[$i]}"); inspect or choose another FORK_BUILD_DIR"
  done
  if (( ${#commits[@]} < ${#patches[@]} )); then
    [[ -z "$(git -C "$WORKTREE" status --porcelain)" ]] ||
      die "$WORKTREE has source edits; commit or stash them before applying new fork patches"
    for (( i=${#commits[@]}; i<${#patches[@]}; i++ )); do
      echo "Applying $(basename "${patches[$i]}") to existing worktree" >&2
      if ! git -C "$WORKTREE" -c commit.gpgsign=false am --3way --quiet "${patches[$i]}"; then
        git -C "$WORKTREE" am --abort 2>/dev/null || true
        die "$(basename "${patches[$i]}") does not apply to $WORKTREE; inspect it before retrying"
      fi
    done
  fi
  echo "Using patch-applied worktree $WORKTREE" >&2
else
  mkdir -p "$BUILD_ROOT"
  git -C "$REPO_ROOT" worktree add --detach "$WORKTREE" "$TAG_SHA" >&2
  for patch in "${patches[@]}"; do
    echo "Applying $(basename "$patch")" >&2
    if ! git -C "$WORKTREE" -c commit.gpgsign=false am --3way --quiet "$patch"; then
      git -C "$WORKTREE" am --abort 2>/dev/null || true
      die "$(basename "$patch") does not apply to $TAG; worktree left at $WORKTREE for inspection"
    fi
  done
fi

printf '%s\n' "$WORKTREE"
