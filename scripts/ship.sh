#!/usr/bin/env bash
# ship.sh - the only way Frontier Radar goes live: sync with GitHub, build, test, verify, push.
# The push to GitHub triggers the Vercel deploy. Never run `vercel deploy` from a laptop:
# the next GitHub deploy silently overwrites it (Repo Radar, Aug 28 2026).
set -euo pipefail
cd "$(dirname "$0")/.."
msg="${1:?usage: scripts/ship.sh \"commit message\"}"
branch="$(git rev-parse --abbrev-ref HEAD)"
[ "$branch" = "main" ] || { echo "ship.sh ships main only (on $branch)"; exit 1; }
git fetch -q origin
git pull -q --no-rebase --no-edit --autostash origin main
node scripts/build.mjs
node --test scripts/*.test.mjs >/tmp/fr-ship-tests.log 2>&1 || { tail -30 /tmp/fr-ship-tests.log; echo "ship.sh: tests failed, nothing pushed"; exit 1; }
node scripts/verify.mjs
git add -A
if ! git diff --cached --quiet; then git commit -q -m "$msg"; fi
if [ "$(git rev-list --count origin/main..HEAD)" = "0" ]; then echo "nothing to ship"; exit 0; fi
git push -q origin main
echo "pushed $(git rev-parse --short HEAD); Vercel deploys from GitHub in about a minute"
