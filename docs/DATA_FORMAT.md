# Frontier Radar data format

Pages are built from these files by `scripts/build.mjs`; `scripts/verify.mjs` enforces every rule.
Plain English everywhere. Allowed markup in text: `**bold**` and `[a link](https://...)`. No em dashes.
Grok's maker is SpaceXAI (xAI joined SpaceX on Feb 2 2026); never write "xAI" as the current name.

## `data/days/<YYYY-MM-DD>/items.json` (one per day)

```json
{
  "date": "2026-10-08",
  "top": "gemini-long-memory",
  "items": [
    {
      "id": "gemini-long-memory",
      "ai": "gemini",
      "category": "model",
      "story": "gemini-long-memory",
      "headline": "Max 120 characters, plain English",
      "summary": "Max 300 characters, in our own words. Never pasted.",
      "why": "Top story only: two sentences on why it matters.",
      "published": "2026-10-07T16:00:00Z",
      "rumor": false,
      "sources": [
        { "url": "https://...", "outlet": "Google", "kind": "official" },
        { "url": "https://...", "outlet": "TechCrunch", "kind": "press" },
        { "url": "https://...", "outlet": "Some blog", "kind": "press", "repeats": "https://...the original..." }
      ]
    }
  ]
}
```

- `ai`: `claude`, `grok`, `gemini`, `chatgpt` or `jev`.
- `category`: `model`, `feature`, `pricing`, `apps` or `policy` (policy, safety and outages).
- `story`: the same key for every item about the same story. Items sharing a key are shown once.
- `kind`: `official` (the company itself, or a company insider's own X post), `press` (trusted press
  and insider scoops), `expert` or `community`. Leak trackers and rumor accounts are `community`.
- `repeats`: set it on a source that only repeats another outlet's report. It does not count as independent.
- `rumor`: must be `true` unless there is an official source or at least 2 independent outlets.
  Everything from a leak tracker or a rumor account starts `true`. The top story can never be a rumor.
- `published`: when the source published it (UTC), never later than the day's date.
- A source on github.com is a code repo: the gate must have cleared it (`node scripts/gate.mjs owner/name`)
  or the item is refused. Prefer the announcement page that is not on GitHub.

## `data/ai/<id>.json` (status boxes; update when something changes)

```json
{ "flagship": "Model name", "newest": "2026-10-07", "plans_from": "$20 / month",
  "sources": [{ "url": "https://...", "outlet": "Anthropic", "kind": "official" }] }
```
Leave a box out when there is no source; the page says "no data found".

## `data/experts/<date>.json` (only on days with at least one real quote)

```json
{ "date": "2026-10-08",
  "debate": { "title": "...", "consensus": "Most builders say X. The skeptics say Y.", "story": "<story key>" },
  "quotes": [{ "person": "Full name", "role": "AI researcher", "outlet": "Their newsletter", "url": "https://...",
    "quote": "25 words or fewer, exactly as said", "stance": "impressed", "ai": "gemini", "story": "<story key>", "said": "2026-10-07" }] }
```
`stance`: `impressed`, `skeptical` or `other`. A debate needs at least one quote on its story. A quote
whose link is a github.com page needs that repo cleared by the gate.

## `data/top20/<friday>.json` (Fridays)

```json
{ "date": "2026-10-09", "projects": [
  { "rank": 1, "kind": "repo", "name": "...", "ai": "claude", "oneliner": "...", "url": "https://github.com/owner/name",
    "why": "Launched Tuesday, top of Show HN", "shot": { "src": "https://...", "alt": "what it really shows" },
    "sources": [{ "url": "https://...", "outlet": "Hacker News" }] },
  { "rank": 2, "kind": "app", "name": "...", "ai": "gemini", "oneliner": "...", "url": "https://product.example.com",
    "why": "...", "sources": [{ "url": "https://...", "outlet": "Product Hunt" }] }
] }
```
Up to 20, ranks 1 to n with no gaps. Every project has `kind`:
- `repo`: code people install. It must be a GitHub repo (`repo: "owner/name"` or a github.com `url`)
  and it must pass the security gate first: `node scripts/gate.mjs owner/name`. Code on GitLab,
  Codeberg, Bitbucket, npm, PyPI or Hugging Face cannot be gated and is left out.
- `app`: a hosted product with nothing to install. Its `url` may not be on a code host.
`shot` only for a real screenshot. The list may not be dated in the future.

## `data/courses/<friday>.json` (Fridays)

See `docs/COURSE_VETTING.md` for every field and rule.

## `data/x/<date>.json` (written by JJ's Mac, `scripts/x-scout.mjs`; the cloud run only reads it)

```json
{ "date": "2026-10-08", "read_at": "2026-10-08T11:31:00Z", "accounts": [
  { "handle": "btibor91", "tier": "leaks", "posts": [
    { "id": "...", "url": "https://x.com/btibor91/status/...", "time": "2026-10-08T09:12:00Z", "text": "...", "likes": 120, "retweet_of": null } ] },
  { "handle": "sama", "tier": "insiders", "error": "could not read" } ] }
```
`tier` is `rumor`, `leaks` or `insiders` (the groups in `data/sources.json`). A post from `rumor` or
`leaks` is always a rumor; a post from `insiders` counts as official when the account announces its
own company's news. If today's file is missing, the report says "X not read today".

## `data/corrections.json`

```json
[{ "date": "2026-10-09", "item": "<item id>", "note": "What was wrong and what is right." }]
```

## `data/blocklist.json`, `data/rr-blocklist.json`, `data/gate-log.json`

`data/blocklist.json` is this site's own blocklist (`gate.mjs` adds FAILs; only JJ removes).
`data/rr-blocklist.json` is Repo Radar's, copied by `scripts/sync-blocklist.mjs` as
`{ fetched, source, repos }`; a copy older than 2 days or empty is refused. `data/gate-log.json` is the
gate's evidence, written only by `gate.mjs`. A push that adds a day may add to these files but never
remove a blocklist entry or turn an existing FAIL or REVIEW into a PASS.

## `docs/reports/<date>.md` (every day)

Starts with `## Needs JJ`, then what was published, what was dropped and why, and whether X was read.
