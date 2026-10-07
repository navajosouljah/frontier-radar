# Frontier Radar - design spec

Status: approved by JJ Oct 5 2026 ("approved and we can make changes as we go"). Amended Oct 6 2026
after JJ's three rulings (rulings 9 to 12 below); building started the same day.

## 1. What it is, and for whom

Frontier Radar is a **public** website that keeps track of everything happening with five frontier AIs:
**Claude, Grok, Gemini, ChatGPT/OpenAI and Jev**. It refreshes every morning. JJ's words: "Things are
happening so fast that we need to keep tabs on all the things that are happening. It's basically like
Repo [Radar], but larger, with the models."

Success means a reader can open the front page any morning and, in two minutes, know what changed
across the five AIs, what the experts think of it, what people are building, and which courses are
worth paying for, with every item linked to a real source.

### JJ's rulings (Oct 4-5 2026)

| # | Ruling |
|---|---|
| 1 | Build on the **Repo Radar engine** (data files -> page builder -> checker -> push deploys). |
| 2 | Audience is **public**. |
| 3 | Refresh **daily**. |
| 4 | The fifth AI is **Jev** (TypeSafe AI, limited early access since Sep 15 2026). |
| 5 | The site sections in section 3 below (approved Oct 4). |
| 6 | Sources and the daily run in section 4 (approved Oct 4). |
| 7 | The safety rules in section 5 (approved Oct 4). |
| 8 | Name: **Frontier Radar**. The layout in `docs/mockup-approved-2026-10-05.html` is approved. |
| 9 | Oct 6: the verified source list in `docs/SOURCES.md` is adopted (official sites first, then trusted press, insider scoops, leak trackers, rumor accounts, expert reaction, video, communities). GitHub is only the security check and the hosting, never a news source. |
| 10 | Oct 6: X is read from JJ's Mac by the "X scout" job (section 4.4). The cloud run never signs in to X. |
| 11 | Oct 6: the safety review's reachable findings 1, 2, 3, 4, 6, 7 and 8 are fixed (section 5.1) and the weekly gate re-check is added; finding 5 (a two-push fence bypass) is accepted as a known ceiling, the same call as on Repo Radar. |
| 12 | Oct 6: xAI joined SpaceX on Feb 2 2026 and is now **SpaceXAI**. The Grok tab's maker line and every footer say SpaceXAI. |

### Assumptions (stated, not ruled)

- "OpenAI" and "ChatGPT" are one tab, labelled "ChatGPT / OpenAI".
- Repo Radar is not touched by this build. It stays in `~/Projects/repo-radar`.

## 2. Where it lives

| Thing | Value |
|---|---|
| Local folder | `~/Projects/frontier-radar` |
| GitHub | `navajosouljah/frontier-radar` (new, to be created at build time) |
| Vercel project | `frontier-radar`, team `my-honey-co`, deploys from GitHub on push to `main` |
| Public address | `frontier-radar-daily.vercel.app` (checked Oct 5 2026: free). `frontier-radar.vercel.app` already belongs to a stranger's app, so it is never used. Added as a project domain so Deployment Protection does not bounce visitors. |

## 3. The site

Five kinds of page, plus an archive. Layout per the approved mockup.

### 3.1 Today (front page)
- **Top story**: one item, with a two-sentence "why it matters". Never a Rumor.
- **Trending now**: the 10 biggest items across all five AIs. Each item has the AI tag, a one-line
  summary, the source count and type, the age and a source link.
- **Teasers**: 3 expert takes, the top 3 projects, and the newest vetted course if one was added that day.
- Update time stamp and a link to yesterday's edition.

### 3.2 One tab per AI (Claude, Grok, Gemini, ChatGPT/OpenAI, Jev)
- **Status boxes**: flagship model, newest release, plans from (price), number of updates this week.
- **Update timeline**: newest first. Every item has one category: Model, Feature, Pricing & plans,
  Apps & integrations, Policy/safety/outage.
- **Category filter** chips above the timeline.
- The timeline is cumulative. Each new day adds items; old items stay.
- A tab with little news says so ("Jev has been in early access since Sep 15 2026") rather than padding.

### 3.3 What experts say
- **Biggest debate this week**, with a plain one-line consensus ("most builders say X, the skeptics say Y").
- **Impressed vs Skeptical** columns of quotes for that debate.
- **More takes**: other quotes, each tagged to its AI and story.
- Every quote: named person, who they are, the outlet, a quote of 25 words or fewer, and a link.

### 3.4 Top 20 projects
- Real things people are building on these five AIs. Refreshed **Fridays**.
- Card: rank, AI tag, name, one plain line, a real screenshot if one exists ("no real picture found"
  otherwise), and why it is here this week.

### 3.5 Courses
- Grouped by AI. Refreshed **Fridays**.
- Each listing: name, provider, format (live cohort / self-paced) and length, what you leave with,
  price, independent review score with count, and a Vetted badge.
- An AI with no vetted courses says so plainly.

### 3.6 Archive
- One dated edition per day, like Repo Radar's `editions/`. The front page links to yesterday.

### 3.7 On every page
- Text-only colored AI tags (no company logos): Claude terracotta, Grok near-black, Gemini blue,
  ChatGPT green, Jev violet.
- Footer: "independent and not affiliated with Anthropic, SpaceXAI, Google, OpenAI or TypeSafe AI",
  plus Corrections and Archive links.
- Works at phone width with no sideways scroll.

## 4. Where the news comes from, and the daily run

### 4.1 The run
- A claude.ai **cloud routine** runs every day at **12:00 UTC (6 AM Mountain)**. It clones the repo,
  gathers the last 24 hours, writes data files, builds, checks and ships with `scripts/ship.sh`.
- On **Fridays** the same run also refreshes Top 20 and Courses.
- **One agent, no helpers.** The routine has **no connectors** attached (it reads untrusted web pages
  and must never hold access to JJ's email, Slack, CRM or files), the same as Repo Radar.
- The routine's instructions are a short pointer to `docs/DAILY_PLAYBOOK.md`; every version of the
  prompt is saved in `docs/routine-prompt-vN.md`.

### 4.2 Sources, most trusted first (rescanned Oct 6 2026; the full list with every address is `docs/SOURCES.md`)
The machine-readable copy the run reads is `data/sources.json`, so adding a source is a data change.
1. **Official** (28 pages): each company's news, research, release notes, changelogs, status and pricing
   pages. OpenAI and SpaceXAI block plain fetches; the run reads those through the page reader
   (`https://r.jina.ai/<address>`). Six RSS feeds exist (OpenAI news, two Google blogs, three status pages).
2. **Trusted press** (9): The Verge, TechCrunch, Ars Technica, Wired, MIT Technology Review, The Decoder,
   CNBC, VentureBeat, InfoQ.
3. **Insider scoops** (7): The Information, Reuters, Bloomberg, Sources (Alex Heath), Semafor, Axios,
   Platformer. Treated as press: a scoop with two independent outlets is confirmed; alone it is a rumor.
4. **Leak trackers** (6): TestingCatalog, Tibor Blaho, 9to5Google and Android Authority teardowns,
   ArtificialWatch, AI Weekly. Everything from here starts as a **Rumor** until an official source or two
   independent outlets confirm it.
5. **Rumor accounts on X** (4): Jimmy Apples, Chubby, scaling01, Andrew Curran. Always a Rumor, never the
   top story. Two of them agreeing is still one rumor.
6. **Company insiders on X**: Logan Kilpatrick (Google), Alex Albert (Anthropic), TypeSafe AI's account and
   the five company accounts. An announcement from one of these counts as official.
7. **Expert reaction** (18): Simon Willison, Import AI, Stratechery, Latent Space, Interconnects, The Batch,
   Ethan Mollick, Zvi, Big Technology and the rest of the list.
8. **YouTube and podcasts** (11): AI Explained, Matthew Berman, Wes Roth, The AI Daily Brief, Hard Fork,
   No Priors, Dwarkesh Patel and the rest, read as transcripts.
9. **Communities**: ten subreddits (read through Exa, never directly) and Hacker News.
10. **Projects**: Show HN, Product Hunt AI, GitHub trending and launch posts. GitHub is where code projects
    get their security check and where this site's code lives; it is not a news source.
11. **Courses**: the provider's own course page plus independent review sites.

Jev coverage is thin (InfoQ, TechCrunch, a few small sites). The Jev tab says so rather than padding.

### 4.3 How trending is ranked
An item scores higher with more **independent** sources covering it, an **official** source, and
**freshness**. Several outlets repeating one original report count once. The scoring is a script
(`scripts/rank.mjs`), not a judgment call, so it is the same every day.

### 4.4 X (Twitter) is read from JJ's Mac: the X scout
The cloud run cannot sign in to X. JJ's Mac can (the saved X login in `~/.agent-reach/config.yaml`). So a
small job on the Mac (`scripts/scout.sh`, launchd `com.jjgilmore.frontier-radar-scout`) runs every morning
at 5:30 AM Mountain, half an hour before the cloud run:
- `scripts/x-scout.mjs` reads the last day of posts from every X account in `data/sources.json` and writes
  `data/x/<today>.json` (handle, time, text, link, like count; never the login values).
- On Mondays it also runs the weekly gate re-check (`node scripts/gate.mjs --recheck`, every repo the site
  lists) and refreshes the Repo Radar blocklist copy.
- It commits only those data files and pushes `main`. It never builds pages, so the "updated" stamp on the
  live site still belongs to the last real edition. No day is added, so the fence allows the push.
- The cloud run reads today's X file if it exists. If the Mac was asleep, the day's report says
  "X not read today" and the run carries on without X.

## 5. Safety rules (enforced by `scripts/verify.mjs`; a failing page is not published)

**Truth**
1. Nothing invented. Every item, number, quote and project has a working source link.
2. Rumors carry a visible **Rumor** tag and are never the top story. Official confirmation removes the tag.
3. Corrections are visible: a wrong item gets a "Corrected" note and goes on the Corrections page;
   it is never quietly swapped.

**Fair use**
4. Summaries are in our own words. Quotes are 25 words or fewer, with speaker and link.
5. No company logos.
6. The not-affiliated line is in every footer.

**What we recommend**
7. Every Top 20 project declares what it is: `kind: "repo"` (code people install; it must be a GitHub repo
   and pass Repo Radar's security gate, `docs/SECURITY_GATE.md` and `scripts/gate.mjs` copied in) or
   `kind: "app"` (a hosted product with nothing to install). Code on any other host (GitLab, Codeberg,
   Bitbucket, npm, PyPI, Hugging Face) cannot be gated and is left out. Every github.com link anywhere on
   the site, including inside news items and quotes, points at a repo the gate has cleared; nothing on
   either blocklist ever appears, on any page, including archived days.
8. Every course passes `docs/COURSE_VETTING.md`: a real named provider, a working page with the price
   shown, and independent reviews. Income promises or "guaranteed results" disqualify it.
   Popularity alone never qualifies a course.

**The run can't bend the rules**
9. The daily run never edits `scripts/`, `CLAUDE.md` or the rule docs. `verify.mjs` refuses a push
   that adds an edition and changes any of them (the Repo Radar Oct 2 2026 fence). The same push may
   add entries to either blocklist but never remove or alter one, and may add gate records but never
   turn an existing FAIL or REVIEW into a PASS; only the Mac-side weekly re-check or JJ does that.
10. If a run fails, yesterday's site stays up with a "not updated today" note, and the reason goes in
    `docs/reports/<date>.md` under "Needs JJ".

House style: no em dashes, human-readable numbers (85K, 1.2M), dates are the publish date.

### 5.1 The Oct 6 safety review: what was fixed, and the one known ceiling
A fenced adversarial pass on the plan (claim: nothing invented, unsafe or rule-breaking can reach the
site) found eight reachable paths. JJ's ruling: fix seven, accept one.
1. Fixed: a code project on a non-GitHub host skipped the gate (rule 7 now requires `kind`, and only
   GitHub repos can be listed as code).
2. Fixed: GitHub links inside news items and quotes were only checked against the blocklist (every
   github.com link on every page must now be a cleared repo).
3. Fixed: older Top 20 lists were exempt from the gate yet re-rendered on archived day pages (every
   list is checked; an old list may be stale but never FAILed, never gated or blocklisted).
4. Fixed: the run could edit the blocklists or gate log (rule 9 now covers them).
5. Accepted ceiling: two pushes, one changing a script and a second adding the day, pass the fence.
   The same ceiling as Repo Radar (accepted Oct 3 2026). The routine prompt forbids it and the day's
   report shows every push.
6. Fixed: course vetting could be fooled by a review site on the provider's own subdomain, by
   "earn $5k a month" wording, by a free price of 0 with no "Free" label, or by a list dated in the
   future (all four now refused).
7. Fixed: a stale or empty copy of Repo Radar's blocklist was accepted silently (the copy carries the
   time it was fetched; older than 2 days or empty is refused).
8. Fixed: the build never deleted orphan pages (a day or AI page not produced by this build is removed).
Plus the weekly re-check: every listed repo's advisories are re-read each Monday from the Mac.

## 6. What is reused from Repo Radar, and what is new

| Reused (copied, then adapted) | New |
|---|---|
| Data-files-to-pages approach (`build.mjs` pattern) | Data shapes for news items, quotes, projects, courses (`docs/DATA_FORMAT.md`) |
| `verify.mjs` + tests, `ship.sh` push-to-deploy | Trending ranker (`rank.mjs`) and de-duplication |
| Security gate + blocklist for code projects | Course vetting rules and checker |
| Cloud routine pattern, fence rule, daily report | Daily playbook, tiered source list, AI tabs with cumulative timelines |
| Weekly gate re-check (`gate.mjs --recheck`) | The Mac-side X scout (section 4.4) |
| Visual family: Bricolage Grotesque + Atkinson Hyperlegible | Newsroom layout per the approved mockup |

Copying means Frontier Radar gets its own copies; Repo Radar's files are not changed.

## 7. Data shape (summary; full detail goes in `docs/DATA_FORMAT.md` during the build)

- `data/days/<YYYY-MM-DD>/items.json`: the day's news items. Each: `id`, `ai`, `category`, `story` (items
  sharing a story key show once), `headline`, `summary`, `why` (top story only), `sources[]` (`url`,
  `outlet`, `kind`: official/press/expert/community, optional `repeats`), `published`, `rumor`. The rank
  score is computed by `scripts/rank.mjs` at build time, never stored (section 4.3).
- `data/ai/<ai>.json`: the status boxes with their sources. The timeline is every item for that AI across
  every day, so it needs no file of its own.
- `data/experts/<date>.json`: debate, consensus line, quotes (`person`, `role`, `outlet`, `quote`, `url`,
  `stance`, `ai`, `story`, `said`).
- `data/top20/<friday>.json` (each project with `kind`, and `repo` for code) and `data/courses/<friday>.json`
  (each course with its vetting evidence). The gate's evidence lives in `data/gate-log.json`.
- `data/x/<date>.json`: the X scout's posts for the day (section 4.4).
- `data/corrections.json`, `data/blocklist.json`, `data/rr-blocklist.json` (Repo Radar's copy, with the
  time it was fetched), `data/sources.json`.

## 8. Testing and the done bar

- Unit tests for the ranker, de-duplication, the verify rules (each rule has a test that fails on a bad
  fixture) and the course vetting checker.
- A fixture day built end to end in tests.
- **Dry run before launch**: the routine's playbook is run once by hand from this Mac on a real day,
  the result is reviewed by JJ on the live address, and only then is the daily schedule switched on.
- Done = tests green, `verify.mjs` clean, the live address shows a real day with zero console errors on
  desktop and phone width, and JJ has approved it.

## 9. Cost

- Hosting: free tier (static pages), same as Repo Radar.
- The daily run is one cloud Claude session per day (Repo Radar's is one per week). It counts against
  JJ's plan usage. The first week's actual usage gets reported to JJ.

## 10. Out of scope for this build

- Reading X from the cloud (the Mac-side scout in 4.4 is the only X reader).
- Email newsletter, accounts, comments, search.
- AIs beyond the five; adding one later is a data change plus a tab.
