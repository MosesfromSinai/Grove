# Grove — Project Context for AI Assistants

This file is the shared memory for every team member's AI sessions. Claude Code reads it automatically from the repo root. In claude.ai, paste or attach it at the start of each session along with the files listed under **Session protocol**. **All shared rules live here and only here.** Team files hold personal tasks, notes, and logs.

_Last updated: 2026-10-20 by Moses_

---

## Session protocol (every session)

### Start
1. **Get the latest:** `git checkout main && git pull`, then switch to the feature branch and run `git merge main` (or create the branch from `main`). Teammates' logs, decisions, and contract changes only reach you through `main`; reading stale files is how context goes out of date.
2. **Read, in order:** this file → `docs/STATUS.md` → `docs/team/<name>.md` → `docs/API_CONTRACT.md` (if the session touches data, queries, or functions).
3. **Catch up on teammates** in `docs/LOG.md` and `docs/DECISIONS.md`, using the date of the person's last Session log entry as the cutoff:
   - **Log:** summarize what each teammate logged since then, by name.
   - **Decisions:** for every decision in someone else's section (or Team) whose **Affects** includes this person or "Everyone" and whose **Acknowledged** line doesn't include them, say who decided what and when, then ask: follow it, ask a question, or push back? Example: "Celso decided yesterday that PINs lock after 5 wrong tries. Do you want to follow the same rule, ask him a question, or push back?" Record ✅ agreed, ❓ question, or ❌ disagree on that entry, with any comment under **Responses**. When everyone affected has ✅, set Status to Accepted.
   - If a teammate's work or decision conflicts with this person's plan, say so before starting.
4. **State back** in a few lines: teammate updates, this week's goal, the next unchecked task, and anything in the files that looks outdated or contradictory.

### First session (each person, once)
- **Moses** creates the repo, project board, and issues for everyone's tasks during setup, with issue numbers written next to each task.
- **Everyone else:** check your issues on the board and the numbers next to your tasks. If a task has no issue, create one (title = the task, assigned to you, added to the Grove project board) and write its number next to the task. Then create your first feature branch from `main`.

### During
Update files **as things happen**, not only at the end:
- **Task finished:** tick it in `docs/team/<name>.md`. **New task:** add it there and create a GitHub issue for it.
- **Decision made:** add it right away to the person's own section of `docs/DECISIONS.md` (or Team, if made together) with **Affects**, Status `Proposed` (or `Accepted` if it only affects them), and ✅ for the person on Acknowledged.
- **Table, column, or function input/output changed:** update `docs/API_CONTRACT.md` and `mocks/` in the same change. Moses reviews it; tell anyone it affects.
- **New blocker:** add it to the person's file and to `docs/STATUS.md`.
- **Feature works:** suggest a small PR and merge into `main`, and say why (see Git workflow).

### End
Before stopping, update:
1. `docs/team/<name>.md`: tasks ticked, new tasks added, a dated Session log entry (Did / Next / Blockers), and today's date on _Last updated_.
2. `docs/LOG.md`: one dated line per thing shipped or changed, in the person's own section.
3. `docs/STATUS.md`: if the current state, a blocker, or an open decision changed.
4. `docs/DECISIONS.md`, `docs/API_CONTRACT.md`, this file: if affected.

Doc updates go in the same pull request as the code. **A session isn't finished until its files are updated.** In Claude Code, make the edits directly. In claude.ai, output the full updated sections ready to paste.

### Rules
- If a request conflicts with this file, the API contract, or MVP scope, say so before writing code.
- Don't build or suggest out-of-scope features (below) unless the team records a decision to add them.
- Don't change another person's area (see Team) without saying so; suggest coordinating with them.
- **Never write in someone else's team file.** If work affects them, note it in `docs/STATUS.md` under Blockers or tell them directly.
- Never invent customer research: no made-up interview answers, quotes, survey numbers, or pilot results. Research lives in the team's shared Google Drive folder, not in this repo.

---

## What Grove is

A campus marketing platform. **Paying customers are locally owned restaurants and food trucks near a college campus** (not chains). **Students are users, not payers.** The student app is the delivery channel for business deals.

- **Problem:** businesses near campuses depend on students, but their deals get buried on platforms students don't check (Instagram, Yelp), and owners can't tell what works.
- **Solution:** businesses post deals; Grove sends them to verified nearby students; students redeem in store with a QR scan, so every visit is proven.
- **Business model (to be validated in interviews):** pay per verified redemption (~$0.50–1, monthly cap) at launch; a flat monthly plan (~$49–99) later.
- **Launch:** UC Riverside, then campus by campus.
- **Name:** "Grove" is a working name; it may be trademarked (see `docs/DECISIONS.md`).
- **Class:** CS 175, UCR, Fall 2026. Graded as a funding decision, 80% business, 20% engineering.

## Team

| Person | Engineering | Owns (code) | Business |
|---|---|---|---|
| Moses Avila | Backend and redemption engine | `supabase/migrations`, `supabase/functions` (redeem, redeem-pin, issue-code, staff-redeem), `lib/supabase`, `mocks` | Pitch deck and demo |
| Celso Lopez | Security and auth | `app/(auth)`, `lib/auth`, RLS policies, threat model (in his team file) | Competitor analysis |
| Edward Van | Student app | `app/(student)` except map, `app/b/[slug]`, `components/student`, theme | Student survey |
| Adolfo Magallanes | Business dashboard | `app/(business)`, `components/business` | Pilot outreach |
| Hikaru Shimada | Maps and notifications | `app/(student)/map`, `components/map`, `lib/geo`, `lib/push`, `public/sw.js`, `public/manifest.json`, `notify-deal`, `deals_nearby` SQL | Lean Canvas, pricing |

Everyone does 1–2 customer interviews.

## MVP scope

**In:** deal posting, deal feed and map with filters, .edu verification, scan-to-redeem (sticker mode and staff-scan mode, PIN backup), business dashboard with stats, Web Push alerts.

**Out (don't build or suggest now):** rewards points, squad deals, club fundraisers, leaderboards, menu import, dish search, Instagram posting, Square/Toast integration, billing/Stripe, native apps.

## Stack

Next.js 16 (App Router) + React + TypeScript PWA on Vercel, Node 22 (pinned in `.nvmrc` and `package.json` engines; run `nvm use`). Supabase for Postgres + PostGIS, Auth (Google), Storage, Edge Functions, Realtime. Mapbox GL JS. `qrcode` and `html5-qrcode` (Safari has no built-in QR reader). Web Push with VAPID. Tailwind + shadcn/ui. Recharts. Sentry. Resend.

## Redemption rules

**Sticker mode (default):** each business has one permanent sticker, a link like `grove.app/b/<qr_slug>`. Student opens a deal → taps Redeem in store → scans the sticker → the `redeem` Edge Function checks:
1. The sticker belongs to the deal's business
2. The deal is live right now
3. The student is within ~150 m (indoor location is off by 20–50 m)
4. The student hasn't redeemed this deal today (a unique rule on student + deal + date enforces this in the database)

On success, the student's phone shows a big green Redeemed screen with a live clock and an animation (screenshots won't pass), and the cashier applies the discount by hand.

If the sticker is scanned with no deal live, it opens the business page ("No deals right now, follow for alerts"). Scanned with a normal camera, it opens Grove to that business, so it doubles as advertising.

**Staff-scan mode (optional per business):** the student's phone shows a one-time QR code from `issue-code` that refreshes about every 30 seconds; a logged-in staff account for that business scans it from the dashboard, which calls `staff-redeem`.

**Backup:** staff type the business's 4-digit PIN on the student's phone (`redeem-pin`) if location or camera fails.

## Conventions

- TypeScript strict mode. No `any` without a comment explaining why.
- All data access goes through `lib/supabase/`. Don't write raw queries inside components.
- Security lives in the database (Row Level Security), not only in the UI. Only Edge Functions insert into `redemptions`.
- `SUPABASE_SERVICE_ROLE_KEY` is only used in Edge Functions and server code, never in the browser.
- Secrets: the repo is public. Every key and password lives only in `.env.local` (git-ignored). Never put a key in code, docs, issues, commit messages, or chat. Moses invites everyone to the Vercel and Supabase projects; get keys only by running `vercel env pull .env.local`, never from a teammate directly. `.env.example` lists the variable names with empty values. If a key is ever committed, rotate it immediately; deleting the commit isn't enough.
- Build against `mocks/` until the real table or function exists. Mocks must match `docs/API_CONTRACT.md` exactly.
- Every `ErrorCode` from a function gets a friendly message in the UI.
- Mobile-first: design for a phone screen, then scale up for the dashboard. Camera, location, and push need HTTPS, so test on the Vercel preview.
- Design: follow the **Design reference** below. No UCR logos or official branding.

## Design reference

**Source of truth for every screen's look:** [Grove MVP design canvas](https://claude.ai/artifact/9gApUhQQWpkU2FWTU27K1d) (15 screens). Match it; don't invent new colors, fonts, or styles. If a screen you build isn't on the canvas, build it in the same style.

| Token | Value | Used for |
|---|---|---|
| Green (primary) | `#1E7A46` | Brand, icons, live dots |
| Dark green | `#135C33` | Active nav text, links, sign-in background, hover |
| Green tint | `#DDF0E2` | Active nav pill, success icon background |
| Orange (accent) | `#FF8A1F` | Main action buttons ("Post a deal"), deal tags, NEW badges |
| Light orange | `#FFB36B` | Slogan, timer icons |
| Peach tints | `#FFE6CC`, `#FFD8B0` | Badges, avatar tiles |
| Brown text | `#8A3B04` | "UCR students only" badge, BUSINESS tag |
| Ink | `#1A2019` | Main text, dark buttons |
| Muted text | `#4F564D` (also `#3F463D` nav, `#5E655C` fine print) | Secondary text |
| Background | `#FBF7EF` student app, `#F7F2E8` dashboard | Page background |
| Surface | `#FFFFFF` student cards, `#FFFDF8` dashboard cards | Cards, bottom nav |
| Borders | `#ECE5D6`, `#E3DCCB`, `#F0EADC` | Dividers, outlines |

- **Fonts:** Bricolage Grotesque (headings, weight 800, slight negative letter-spacing) and Figtree (body, 400–800), both from Google Fonts.
- **Shape:** cards 22–24px radius, buttons 14–18px, pills and chips fully rounded (999px). Soft shadow `0 2px 12px rgba(26,32,25,0.07)`.
- **Sizes:** phone screens 390×844; dashboard is fluid at 1440 wide and stacks on phones. Touch targets at least 44px.
- **Icons:** inline stroke SVG icons (stroke width about 2), no emoji. Food illustrations are flat SVG on colored tiles.
- **Not on the canvas yet** (build in the same style): the staff-scan screens (show-your-code, staff scanner) and the redemption mode selector.

## Git workflow (keep it light)

- **Start of every session:** see Session protocol, step 1.
- **One branch per feature**, named `name/feature` (e.g. `edward/deal-feed`). A feature usually covers a few related tasks. One branch open at a time, about 1–2 a week; merge and delete it before starting the next. No extra branches for experiments or doc-only changes; doc updates ride along with the code.
- **Commits:** short, plain, present tense, under ~50 characters: `Add deal feed`, `Fix PIN lockout`. No body unless something truly needs explaining. No emojis or file-by-file summaries.
- **No attribution:** no `Co-Authored-By` lines, "Generated with" lines, or AI mentions in commits, PRs, or branch names. Each person turns this off once in their own Claude Code settings (`~/.claude/settings.json` on their computer, not in the repo): `"attribution": { "commit": "", "pr": "" }`. The repo ignores `.claude/`.
- **Pull requests:** title in the same style as a commit. Description is 1–3 lines plus the template checklist and `Closes #<issue>` for each issue the feature finishes.
- **Merge into `main` often.** When a feature works, or at the end of a session with working code, suggest a small PR and merge, and say why: log lines and decisions only reach teammates once they're in `main`; small PRs are quick to review and rarely conflict; and anyone waiting on the work gets unblocked. `main` is protected, so everything merges through a PR.
- **Issues:** every task in a team file has a GitHub issue, assigned to its owner, on the Grove project board. The issue number goes next to the task (`- [ ] Deal feed (#12)`). The PR that finishes it says `Closes #12` (one line per issue), which closes the issue and moves it on the board.
- **Reviews:** one review per PR. Moses reviews migrations and functions; Celso reviews auth and RLS. `.github/CODEOWNERS` requests the right reviewer automatically, but code-owner review isn't required yet: any teammate's approval merges. `main` needs 1 approval from someone other than the author, and nobody bypasses it, Moses included.

## File map

| File | What it holds | Who updates it | When |
|---|---|---|---|
| `CLAUDE.md` | All shared rules and project context | Anyone (tell the team) | Scope, stack, roles, or rules change |
| `docs/STATUS.md` | Current phase, this week's gate, focus, blockers, open decisions | Anyone | When the current state changes; at each weekly sync |
| `docs/team/<name>.md` | Personal tasks, notes, and session log | That person only | During and after every session |
| `docs/LOG.md` | What each person did, grouped by person | Each person, own section only | End of every session |
| `docs/DECISIONS.md` | Decisions by who made them, who's affected, who's acknowledged | Decision-maker adds; affected people add ✅/❓/❌ | When made; when acknowledging |
| `docs/API_CONTRACT.md` | Tables, queries, functions, error codes | Moses (others propose) | Any data shape change |

## Start-of-session prompt (copy this)

> I'm [name] on the Grove team. Pull the latest `main` first. Then read `CLAUDE.md`, `docs/STATUS.md`, and `docs/team/[name].md`, plus `docs/API_CONTRACT.md` if we touch data. Catch me up on what teammates logged and any decisions I need to respond to, summarize this week's goal and my next task, and flag anything outdated. Then let's work on: [task]. Keep my team file and the shared docs updated as we go, and give me the end-of-session updates before we finish.
