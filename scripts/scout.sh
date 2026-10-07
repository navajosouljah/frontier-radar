#!/usr/bin/env bash
# scout.sh - JJ's Mac, every morning at 4:30 AM Mountain, 60 to 90 minutes before the 12:00 UTC cloud run
# (4:30 MDT is 10:30 UTC, 4:30 MST is 11:30 UTC, so it is always before the cloud run, whatever the clocks do)
# (launchd: ops/com.jjgilmore.frontier-radar-scout.plist). It does the two things the cloud cannot:
#   1. read X (scripts/x-scout.mjs -> data/x/<today>.json)
#   2. on Mondays, the weekly gate re-check of every listed repo and a fresh copy of Repo Radar's blocklist
# It commits only those data files and pushes main. It never builds pages, so the live site's "updated"
# stamp still belongs to the last real edition, and no day is added, so the fence allows the push.
# Log: ~/System/logs/frontier-radar-scout.log
set -uo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.nvm/versions/node/v24.14.1/bin:$HOME/.local/bin:/opt/homebrew/bin:/usr/bin:/bin"
echo "== scout $(date -u +%FT%TZ)"
git fetch -q origin || { echo "scout: cannot reach GitHub; stopping"; exit 1; }
# This is JJ's working copy. Never push anything of his that was not checked: stop when local main is
# ahead of GitHub, and never sweep his staged or unstaged edits into the scout's commit.
[ "$(git rev-list --count origin/main..HEAD)" = "0" ] || { echo "scout: local main has unpushed commits; stopping so nothing unchecked ships"; exit 1; }
git pull -q --ff-only origin main || { echo "scout: local main has diverged from GitHub; stopping (fix by hand)"; exit 1; }
node scripts/x-scout.mjs || echo "scout: X read failed (see above); continuing"
if [ "$(date +%u)" = 1 ]; then
  node scripts/sync-blocklist.mjs --replace || echo "scout: blocklist refresh failed; continuing"
  node scripts/gate.mjs --recheck || echo "scout: gate re-check had errors; continuing"
fi
paths="data/x data/gate-log.json data/blocklist.json data/rr-blocklist.json"
# shellcheck disable=SC2086
if git diff --quiet -- $paths && [ -z "$(git ls-files --others --exclude-standard -- data/x)" ]; then echo "scout: nothing new"; exit 0; fi
weekly=""; [ "$(date +%u)" = 1 ] && weekly=", weekly gate re-check"
# shellcheck disable=SC2086
git add -- $paths && git commit -q -m "Scout $(date -u +%F): X posts${weekly}" -- $paths || { echo "scout: commit failed"; exit 1; }
git push -q origin main && echo "scout: pushed $(git rev-parse --short HEAD)" || echo "scout: push failed"
