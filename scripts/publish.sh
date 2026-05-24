#!/usr/bin/env bash
set -euo pipefail

PACKAGES=("packages/core" "packages/react" "packages/server")
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# --- Helpers ---

die() { echo "❌ $1" >&2; exit 1; }
info() { echo "→ $1"; }

current_version() {
  grep -o '"version": *"[^"]*"' "$ROOT/packages/core/package.json" | grep -o '[0-9][^"]*'
}

bump_version() {
  local ver="$1" type="$2"
  local major minor patch
  IFS='.' read -r major minor patch <<< "$ver"
  case "$type" in
    major) echo "$((major + 1)).0.0" ;;
    minor) echo "$major.$((minor + 1)).0" ;;
    patch) echo "$major.$minor.$((patch + 1))" ;;
    *) die "Invalid bump type: $type (use major|minor|patch)" ;;
  esac
}

# --- Parse args ---

BUMP_TYPE="${1:-}"
DRY_RUN=false

if [[ "$BUMP_TYPE" == "--dry-run" ]]; then
  DRY_RUN=true
  BUMP_TYPE="${2:-}"
fi

if [[ -z "$BUMP_TYPE" ]]; then
  echo "Usage: ./scripts/publish.sh [--dry-run] <major|minor|patch>"
  echo ""
  echo "Current version: $(current_version)"
  exit 1
fi

# --- Preflight checks ---

cd "$ROOT"

[[ -z "$(git status --porcelain)" ]] || die "Working tree not clean. Commit or stash first."
command -v gh &>/dev/null || die "gh CLI not found. Install: https://cli.github.com"
command -v pnpm &>/dev/null || die "pnpm not found"

OLD_VERSION="$(current_version)"
NEW_VERSION="$(bump_version "$OLD_VERSION" "$BUMP_TYPE")"

info "Bumping $OLD_VERSION → $NEW_VERSION (all packages)"

if [[ "$DRY_RUN" == true ]]; then
  info "[DRY RUN] Would bump, build, publish, tag, and create GitHub release."
  exit 0
fi

# --- Bump versions in all package.json files ---

for pkg in "${PACKAGES[@]}"; do
  sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" "$pkg/package.json"
  info "Bumped $pkg/package.json → $NEW_VERSION"
done

# Update workspace dependency versions (react/server depend on core)
for pkg in "packages/react" "packages/server"; do
  sed -i "s/\"@voicefield\/core\": \"workspace:\^[^\"]*\"/\"@voicefield\/core\": \"workspace:^$NEW_VERSION\"/" "$pkg/package.json" 2>/dev/null || true
done

# --- Build ---

info "Building all packages..."
pnpm install --frozen-lockfile
pnpm build

# --- Publish to npm (order matters: core first) ---

info "Publishing to npm..."
for pkg in "${PACKAGES[@]}"; do
  (cd "$pkg" && pnpm publish --access public --no-git-checks)
  info "Published $(basename "$pkg")@$NEW_VERSION"
done

# --- Git tag + commit ---

git add -A
git commit -m "release: v$NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "v$NEW_VERSION"
git push && git push --tags

# --- GitHub Release ---

info "Creating GitHub release..."
CHANGELOG=$(git log "v$OLD_VERSION..v$NEW_VERSION" --oneline --no-decorate 2>/dev/null | head -20 || echo "Initial release")

gh release create "v$NEW_VERSION" \
  --title "v$NEW_VERSION" \
  --notes "## Changes

$CHANGELOG

## Packages

- [\`@voicefield/core@$NEW_VERSION\`](https://npmjs.com/package/@voicefield/core/v/$NEW_VERSION)
- [\`@voicefield/react@$NEW_VERSION\`](https://npmjs.com/package/@voicefield/react/v/$NEW_VERSION)
- [\`@voicefield/server@$NEW_VERSION\`](https://npmjs.com/package/@voicefield/server/v/$NEW_VERSION)"

info "✅ Released v$NEW_VERSION"
echo ""
echo "  npm: https://npmjs.com/package/@voicefield/core/v/$NEW_VERSION"
echo "  gh:  $(gh release view "v$NEW_VERSION" --json url -q .url)"
