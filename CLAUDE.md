# Frontier Radar - rules for any Claude session in this folder

JJ's public daily news site for Claude, Grok, Gemini, ChatGPT/OpenAI and Jev, live at
https://frontier-radar-daily.vercel.app (Vercel project `frontier-radar`, team my-honey-co).
GitHub `navajosouljah/frontier-radar`, branch `main`. Built on the Repo Radar engine.
Design: `docs/superpowers/specs/2026-10-05-frontier-radar-design.md`. Sources: `docs/SOURCES.md`.

## Non-negotiable

1. **Ship only with `scripts/ship.sh "message"`.** The push deploys. **Never run `vercel deploy`.**
2. **Never invent** a number, person, quote, URL or course. Missing data says "no data found".
3. **Every code project passes the security gate** (`docs/SECURITY_GATE.md`, `scripts/gate.mjs`)
   before it appears. Nothing on `data/blocklist.json` or `data/rr-blocklist.json` ever appears.
   Only GitHub repos can be listed as code; a hosted product is `kind: "app"`.
4. **Every course passes `docs/COURSE_VETTING.md`.**
5. **No em dashes.** Numbers are human-readable (85K, 1.2M). Dates are the publish date.
6. **The daily run never edits the checker or the rules**: nothing in `scripts/`, and not this file,
   `docs/SECURITY_GATE.md`, `docs/COURSE_VETTING.md`, `docs/DAILY_PLAYBOOK.md` or
   `docs/DATA_FORMAT.md`. It never removes a blocklist entry or turns a gate FAIL into a PASS.
   A blocked check means stop and report, never a new exception. `verify.mjs` refuses a push
   that adds a day and changes any of them.
7. **Never auto-open anything on JJ's screen.** Give him clickable links.
8. **Grok's maker is SpaceXAI** (xAI joined SpaceX on Feb 2 2026). Never write "xAI" as the current name.

## How a day is made
`docs/DAILY_PLAYBOOK.md`. Pages are built from data (`docs/DATA_FORMAT.md`) by `scripts/build.mjs`.
Never hand-edit a generated page. Each day's report is `docs/reports/<date>.md`: read its
"Needs JJ" section first. X posts arrive from JJ's Mac as `data/x/<date>.json` (`scripts/scout.sh`).
