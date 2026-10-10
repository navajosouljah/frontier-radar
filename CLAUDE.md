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
7. **Links for JJ, and in a terminal session on his Mac, open the finished deliverable in a new browser
   tab as well** (his ruling of Oct 7 2026: Apple Terminal gives him nothing to click). One tab for the
   finished thing, never a folder, never mid-task. The cloud routine has no screen and opens nothing.
8. **Grok's maker is SpaceXAI** (xAI joined SpaceX on Feb 2 2026). Never write "xAI" as the current name.

## How a day is made
`docs/DAILY_PLAYBOOK.md`. Pages are built from data (`docs/DATA_FORMAT.md`) by `scripts/build.mjs`.
Never hand-edit a generated page. Each day's report is `docs/reports/<date>.md`: read its
"Needs JJ" section first. X posts arrive from JJ's Mac as `data/x/<date>.json` (`scripts/scout.sh`).

## The daily routine
Cloud routine "Frontier Radar Daily", trigger id `trig_01WJAo1P938GdeLoXeodZ6CT`, every day at 12:00 UTC
(6 AM Mountain), created Oct 10 2026. No connectors attached: the create call auto-attached all of JJ's
connectors, and they were cleared with an update (`clear_mcp_connections: true`). Re-check `mcp_connections`
is empty after any create or update. Change its instructions with RemoteTrigger `update` (prompt only), and
save each version in `docs/` (current text: `docs/routine-prompt-v1.md`).
