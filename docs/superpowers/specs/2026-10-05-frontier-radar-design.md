# Frontier Radar - design spec

Status: written Oct 5 2026 for JJ's review. Nothing is built until JJ approves this spec and then the
implementation plan.

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
- Footer: "independent and not affiliated with Anthropic, xAI, Google, OpenAI or TypeSafe AI", plus
  Corrections and Archive links.
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

### 4.2 Sources, most trusted first
1. **Official**: each company's news blog, release notes, changelogs, pricing pages, status pages and
   developer docs. The source list lives in `data/sources.json`, so adding a source is a data change.
2. **Reputable press**: TechCrunch, The Verge, Wired and similar.
3. **Expert voices**: researcher and builder blogs and newsletters, YouTube, podcasts, Hacker News, Reddit.
4. **Projects**: GitHub, Product Hunt, Show HN, builders' launch posts.
5. **Courses**: the provider's own course page plus independent review sites.

### 4.3 How trending is ranked
An item scores higher with more **independent** sources covering it, an **official** source, and
**freshness**. Several outlets repeating one original report count once. The scoring is a script
(`scripts/rank.mjs`), not a judgment call, so it is the same every day.

### 4.4 Known limit: X (Twitter)
The cloud run cannot sign in to X, so it sees only X posts that web search surfaces. If Peer Review is
thin after two weeks, the fix is an extra pass on JJ's Mac, where the X reader works. Not built now.

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
7. Every Top 20 project that is a code repo passes Repo Radar's security gate (`docs/SECURITY_GATE.md`,
   `scripts/gate.mjs`, copied in), and nothing on Repo Radar's blocklist ever appears.
8. Every course passes `docs/COURSE_VETTING.md`: a real named provider, a working page with the price
   shown, and independent reviews. Income promises or "guaranteed results" disqualify it.
   Popularity alone never qualifies a course.

**The run can't bend the rules**
9. The daily run never edits `scripts/`, `CLAUDE.md` or the rule docs. `verify.mjs` refuses a push
   that adds an edition and changes any of them (the Repo Radar Oct 2 2026 fence).
10. If a run fails, yesterday's site stays up with a "not updated today" note, and the reason goes in
    `docs/reports/<date>.md` under "Needs JJ".

House style: no em dashes, human-readable numbers (85K, 1.2M), dates are the publish date.

## 6. What is reused from Repo Radar, and what is new

| Reused (copied, then adapted) | New |
|---|---|
| Data-files-to-pages approach (`build.mjs` pattern) | Data shapes for news items, quotes, projects, courses (`docs/DATA_FORMAT.md`) |
| `verify.mjs` + tests, `ship.sh` push-to-deploy | Trending ranker (`rank.mjs`) and de-duplication |
| Security gate + blocklist for code projects | Course vetting rules and checker |
| Cloud routine pattern, fence rule, daily report | Daily playbook, source list, AI tabs with cumulative timelines |
| Visual family: Bricolage Grotesque + Atkinson Hyperlegible | Newsroom layout per the approved mockup |

Copying means Frontier Radar gets its own copies; Repo Radar's files are not changed.

## 7. Data shape (summary; full detail goes in `docs/DATA_FORMAT.md` during the build)

- `data/days/<YYYY-MM-DD>/items.json`: the day's news items. Each: `id`, `ai`, `category`, `headline`,
  `summary`, `why` (top story only), `sources[]` (`url`, `outlet`, `kind`: official/press/expert/community),
  `published`, `rumor` (true/false), `rank_score`.
- `data/ai/<ai>.json`: status boxes and the cumulative timeline (item ids).
- `data/experts/<date>.json`: debate, consensus line, quotes (`person`, `role`, `outlet`, `quote`, `url`,
  `stance`, `ai`, `story_id`).
- `data/top20/<friday>.json` and `data/courses/<friday>.json`, each item carrying its gate or vetting evidence.
- `data/corrections.json`.

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

- Reading X with a login (see 4.4).
- Email newsletter, accounts, comments, search.
- AIs beyond the five; adding one later is a data change plus a tab.
