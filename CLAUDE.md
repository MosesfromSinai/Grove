# Grove — Project Context for AI Assistants

This file is the shared memory for every team member's AI sessions. Claude Code reads it automatically from the repo root. In claude.ai, paste or attach it at the start of each session along with the files listed under **Session protocol**. **All shared rules live here and only here.** Team files hold personal tasks, notes, and logs.

_Last updated: 2026-10-24 by Moses_

---

## Session protocol (every session)

### Start
1. **Get the latest:** `git checkout main && git pull`, then switch to the feature branch and run `git merge main` (or create the branch from `main`). Teammates' logs, decisions, and contract changes only reach you through `main`; reading stale files is how context goes out of date.
2. **Read, in order:** this file → `docs/STATUS.md` → `docs/team/<name>.md` → `docs/API_CONTRACT.md` (if the session touches data, queries, or functions).
3. **Catch up on teammates** in `docs/LOG.md`, using the date of the person's last Session log entry as the cutoff:
   - **Log:** summarize what each teammate logged since then, by name.
   - **Decisions:** tell the person about every **Decision** line in someone else's section (or Team) since then that affects them (or everyone), in one or two lines each: who decided what, and when. Example: "Celso decided yesterday that PINs lock after 5 wrong tries." Don't ask them to respond or record anything.
   - If a teammate's work or decision conflicts with this person's plan, say so before starting.
4. **State back** in a few lines: teammate updates, this week's goal, the next unchecked task, and anything in the files that looks outdated or contradictory.

### First session (each person, once)
- **Moses** creates the repo, project board, and issues for everyone's tasks during setup, with issue numbers written next to each task.
- **Everyone else:** check your issues on the board and the numbers next to your tasks. If a task has no issue, create one (title = the task, assigned to you, added to the Grove project board) and write its number next to the task. Then create your first feature branch from `main`.

### During
Update files **as things happen**, not only at the end:
- **Task finished:** tick it in `docs/team/<name>.md`. **New task:** add it there and create a GitHub issue for it.
- **Decision made:** if it affects someone else, add it right away as a line in the person's own section of `docs/LOG.md` (or Team, if made together), tagged **Decision** with who it affects: `- **2026-10-20:** **Decision** (affects Hikaru, Edward): getDealsNearby returns businesses with no deal; id is now deal_id.` Decisions that only affect the person go in their team file's notes.
- **Table, column, or function input/output changed:** update `docs/API_CONTRACT.md` and `mocks/` in the same change. Moses reviews it; tell anyone it affects.
- **New blocker:** add it to the person's file and to `docs/STATUS.md`.
- **Feature works:** suggest a small PR and merge into `main`, and say why (see Git workflow).

### End
Before stopping, update:
1. `docs/team/<name>.md`: tasks ticked, new tasks added, a dated Session log entry (Did / Next / Blockers), and today's date on _Last updated_.
2. `docs/LOG.md`: one dated line per thing shipped or changed, plus any **Decision** lines, in the person's own section.
3. `docs/STATUS.md`: if the current state, a blocker, or an open decision changed.
4. `docs/API_CONTRACT.md`, this file: if affected.

Doc updates go in the same pull request as the code. **A session isn't finished until its files are updated.** In Claude Code, make the edits directly. In claude.ai, output the full updated sections ready to paste.

### Rules
- If a request conflicts with this file, the API contract, or MVP scope, say so before writing code.
- Don't build or suggest out-of-scope features (below) unless the team records a decision to add them.
- Don't change another person's area (see Team) without saying so; suggest coordinating with them.
- **Never write in someone else's team file.** If work affects them, note it in `docs/STATUS.md` under Blockers or tell them directly.
- Never invent customer research: no made-up interview answers, quotes, survey numbers, or pilot results. Research lives in the team's shared Google Drive folder, not in this repo.

---

## What Grove is

**A marketing company first.** **Paying customers are locally owned restaurants and food trucks near a college campus** (not chains). They pay Grove to bring in students, especially on slow days (Mon–Wed). **Students are users, not payers.** The app runs the deals and proves every visit.

- **Problem:** businesses near campuses depend on students, but their deals get buried on platforms students don't check (Instagram, Yelp), and owners can't tell what works.
- **Solution:** Grove brings students in through campus channels and its app; every visit is proven by an in-store QR scan.
- **How we reach students:** campus clubs, flyers and tabling, and the Grove app. Clubs and fraternities we know (PAT, ACM, Cyber) and AMA student ambassadors are possible options we could pursue, **not confirmed partners**. Don't describe them as partners anywhere.
- **"Campaign"** is only the business word for the marketing service we sell. In the app, deals stay deals; there's no campaign system.
- **Business model (still to be validated in interviews):** pay per verified visit (~$0.50–1, monthly cap) plus a flat fee for bigger events like club nights. First deal free for pilot restaurants.
- **Launch:** UC Riverside, then campus by campus.
- **Name:** "Grove" is a working name; it may be trademarked (see Open decisions in `docs/STATUS.md`).
- **Class:** CS 175, UCR, Fall 2026. Graded as a funding decision, 80% business, 20% engineering.

## Team

| Person | Engineering | Owns (code) | Business |
|---|---|---|---|
| Moses Avila | Backend and redemption engine | `supabase/migrations`, `supabase/functions` (redeem, redeem-pin, issue-code, staff-redeem, claim-club-night, set-pin, add-staff), `supabase/seed.sql`, `lib/supabase`, `mocks`, `docs/API_CONTRACT.md`, CI and Vercel setup, and every file not listed for someone else | Pitch deck and demo |
| Celso Lopez | Security and auth | `app/(auth)`, `lib/auth`, RLS policies, threat model (in his team file) | Competitor analysis |
| Edward Van | Student app | `app/(student)` except map, `app/b/[slug]`, `components/student`, theme (`app/globals.css`) | Student survey |
| Adolfo Magallanes | Business dashboard | `app/(business)`, `components/business` | Pilot outreach |
| Hikaru Shimada | Maps and PWA install (push: stretch) | `app/(student)/map`, `components/map`, `lib/geo`, `public/manifest.json`, `public/icons/`, `deals_nearby` SQL; stretch: `lib/push`, `public/sw.js`, `notify-deal` | Lean Canvas, pricing |

**Default owner:** Moses owns every file and folder not listed above (root config, `app/layout.tsx`, `app/page.tsx`, `app/theme/`, `components/ui/`, `lib/utils.ts`, `.github/`). Who edits each doc is in the File map below. Celso may edit the root routing in `app/page.tsx` for his onboarding task, with Moses reviewing.

Everyone does 1–2 restaurant interviews testing hypotheses 1–4 and at least one student interview for hypothesis 5 (see Business below).

## MVP scope

**In:**
- Deal posting, deal feed and map with filters, .edu verification, scan-to-redeem (sticker mode and staff-scan mode, PIN backup), business dashboard with stats.
- **Repeat days:** a deal can optionally repeat on chosen days within a daily window (e.g. Mon, Tue, Wed, 2–5 PM). It's live automatically in those windows until the owner turns it off.
- **Link-only deals:** a deal is public (feed and map) or link-only (hidden from feed, map, and sticker page; opens only from its link).
- **Club nights** (the simple version of the club fundraiser idea): a restaurant posts an open club night (date, time window, giveback in text, e.g. "15% back to your club"). Any signed-in student claims it for their club by typing the club name. No club accounts; one claim per club night; same-day claims are fine. Claiming creates a link-only deal the club shares with members, who redeem the normal way. The dashboard shows verified visits for that night. The giveback is paid outside the app. *Fallback if this slips:* we set up club nights by hand as one-date link-only deals.
- **Shareable deal link and QR** on every deal, for flyers and group chats (see Redemption rules: two QR codes).

**Stretch goal (possible future implementation):** Web Push notifications, the Add to Home Screen prompt it needs on iPhone, and email (Resend). The MVP sends no email.

**Out (don't build or suggest now):** club accounts or verified club membership, tracking which channel brought each visit, payments/billing (Stripe), in-app giveback payouts, rewards points, squad deals, leaderboards, menu import, dish search, Instagram posting, Square/Toast integration, native apps.

## Week plan

| Week | Focus |
|---|---|
| 1 (Oct 19–25) | Sign-in, foundation, database |
| 2 (Oct 26–Nov 1) | Core loop, scan-to-redeem end to end, plus all the data work: repeat days, visibility, `club_nights`, live-now check, `claim-club-night`; link-only deals hidden from feed and map |
| 3 (Nov 2–8) | Every remaining feature: staff scan, club night screens (post, claim, results), deal link and QR download, stats |
| 4 (Nov 9–15) | **No new features.** Pilot at a real restaurant, phone testing, bug fixes, demo prep |

**Feature freeze at the end of Nov 8.** Anything unfinished then goes to the team to decide: finish quickly or move to the stretch goal.

## Business

Part 3 interviews test five hypotheses:
1. Restaurants have slow days (Mon–Wed) they want to fill.
2. Which pricing restaurants prefer: per verified visit or a flat fee.
3. Restaurants will host club nights where part of the sales go back to the club.
4. Restaurants trust QR check-in as proof of a visit.
5. Students will try Grove when a deal reaches them through a club or fraternity they're in.

Each person does 1–2 restaurant interviews (1–4) and at least one student interview (5). Notes go in the shared Drive folder; never invent results.

## Stack

Next.js 16 (App Router) + React + TypeScript PWA on Vercel, Node 22 (pinned in `.nvmrc` and `package.json` engines; run `nvm use`). Supabase for Postgres + PostGIS, Auth (Google), Storage, Edge Functions, Realtime. Mapbox GL JS. `qrcode` and `html5-qrcode` (Safari has no built-in QR reader). Tailwind + shadcn/ui. Recharts. Sentry. Stretch goal only: Web Push with VAPID, Resend for email.

## Redemption rules

**Sticker mode (default):** each business has one permanent sticker, a link like `grove.app/b/<qr_slug>`. Student opens a deal → taps Redeem in store → scans the sticker → the `redeem` Edge Function checks:
1. The sticker belongs to the deal's business
2. The deal is live right now (for repeating deals: today is an active day and it's inside the daily window, campus time)
3. The student is within ~150 m (indoor location is off by 20–50 m)
4. The student hasn't redeemed this deal today (a unique rule on student + deal + date enforces this in the database)

On success, the student's phone shows a big green Redeemed screen with a live clock and an animation (screenshots won't pass), and the cashier applies the discount by hand.

If the sticker is scanned with no deal live, it opens the business page ("No deals right now"). Scanned with a normal camera, it opens Grove to that business, so it doubles as advertising.

**Two QR codes, two jobs:**
- **Deal link QR** (`/deals/<id>`, on flyers and in group chats): advertising only. It opens the deal in Grove. It never redeems, never shows a green screen, never applies a discount.
- **Counter sticker:** the only way to redeem, scanned inside Grove, with every check above (.edu, location, live deal, once per day, live Redeemed screen).

Link-only deals (including club night deals) redeem exactly the same way; having the link only lets you see the deal. Club night deals have no student discount; the visit counts toward the club's giveback.

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
- Mobile-first: design for a phone screen, then scale up for the dashboard. Camera and location (and push, if built) need HTTPS, so test on the Vercel preview.
- Design: follow the **Design reference** below. No UCR logos or official branding.

## Design reference

**Source of truth for every screen's look:** [Grove MVP design canvas](https://claude.ai/artifact/9gApUhQQWpkU2FWTU27K1d) (15 screens). Match it; don't invent new colors, fonts, or styles. If a screen you build isn't on the canvas, build it in the same style.

Use the Tailwind class name with any color utility (`bg-green`, `text-ink-muted`, `border-border-strong`); they're defined in `app/globals.css`. See `/theme` for a live preview.

| Token | Value | Tailwind class | Used for |
|---|---|---|---|
| Green (primary) | `#1E7A46` | `green` | Brand, icons, live dots |
| Dark green | `#135C33` | `green-dark` | Active nav text, links, sign-in background, hover |
| Green tint | `#DDF0E2` | `green-tint` | Active nav pill, success icon background |
| Orange (accent) | `#FF8A1F` | `orange` | Main action buttons ("Post a deal"), deal tags, NEW badges |
| Light orange | `#FFB36B` | `orange-light` | Slogan, timer icons |
| Peach tints | `#FFE6CC`, `#FFD8B0` | `peach`, `peach-deep` | Badges, avatar tiles |
| Brown text | `#8A3B04` | `brown` | "UCR students only" badge, BUSINESS tag |
| Ink | `#1A2019` | `ink` | Main text, dark buttons |
| Muted text | `#4F564D` (also `#3F463D` nav, `#5E655C` fine print) | `ink-muted` (`ink-nav`, `ink-fine`) | Secondary text |
| Background | `#FBF7EF` student app, `#F7F2E8` dashboard | `bg-student`, `bg-dashboard` | Page background |
| Surface | `#FFFFFF` student cards, `#FFFDF8` dashboard cards | `surface`, `surface-dashboard` | Cards, bottom nav |
| Borders | `#ECE5D6`, `#E3DCCB`, `#F0EADC` | `border`, `border-strong`, `border-soft` | Dividers, outlines |

- **Fonts:** Bricolage Grotesque (headings, weight 800, slight negative letter-spacing) and Figtree (body, 400–800), both from Google Fonts. Classes: `font-heading` and `font-sans` (the default); `h1`–`h3` use the heading font automatically.
- **Shape:** cards 22–24px radius, buttons 14–18px, pills and chips fully rounded (999px). Soft shadow `0 2px 12px rgba(26,32,25,0.07)`. Classes: `rounded-card` (24px), `rounded-button` (16px), `rounded-pill`, `shadow-card`.
- **Sizes:** phone screens 390×844; dashboard is fluid at 1440 wide and stacks on phones. Touch targets at least 44px.
- **Icons:** inline stroke SVG icons (stroke width about 2), no emoji. Food illustrations are flat SVG on colored tiles.
- **Not on the canvas yet** (build in the same style): the staff-scan screens (show-your-code, staff scanner), the redemption mode selector, the post-club-night form (dashboard), the claim-club-night screen (student app), and the repeat-days controls on the post-deal form (day checkboxes and daily start/end time).

## Git workflow (keep it light)

- **Start of every session:** see Session protocol, step 1.
- **One branch per feature**, named `name/feature` (e.g. `edward/deal-feed`). A feature usually covers a few related tasks. One branch open at a time, about 1–2 a week; merge and delete it before starting the next. No extra branches for experiments or doc-only changes; doc updates ride along with the code.
- **Commits:** short, plain, present tense, under ~50 characters: `Add deal feed`, `Fix PIN lockout`. No body unless something truly needs explaining. No emojis or file-by-file summaries.
- **No attribution:** no `Co-Authored-By` lines, "Generated with" lines, or AI mentions in commits, PRs, or branch names. Each person turns this off once in their own Claude Code settings (`~/.claude/settings.json` on their computer, not in the repo): `"attribution": { "commit": "", "pr": "" }`. The repo ignores `.claude/`.
- **Pull requests:** title in the same style as a commit. Description is 1–3 lines plus the template checklist and `Closes #<issue>` for each issue the feature finishes.
- **Merge into `main` often.** When a feature works, or at the end of a session with working code, suggest a small PR and merge, and say why: log lines and decisions only reach teammates once they're in `main`; small PRs are quick to review and rarely conflict; and anyone waiting on the work gets unblocked. `main` is protected: Moses can push to main and merge on his own; everyone else merges through a PR.
- **Issues:** every task in a team file has a GitHub issue, assigned to its owner, on the Grove project board. The issue number goes next to the task (`- [ ] Deal feed (#12)`). The PR that finishes it says `Closes #12` (one line per issue), which closes the issue and moves it on the board. When Moses pushes directly to main, put Closes #<issue> in the commit message instead.
- **Reviews:** one review per PR. Moses reviews migrations and functions; Celso reviews auth and RLS. `.github/CODEOWNERS` requests the right reviewer automatically, but code-owner review isn't required yet: any teammate's approval merges. Moses can push to main and merge on his own; everyone else merges through a PR with 1 approval.

## File map

| File | What it holds | Who updates it | When |
|---|---|---|---|
| `CLAUDE.md` | All shared rules and project context | Anyone (tell the team) | Scope, stack, roles, or rules change |
| `docs/STATUS.md` | Current phase, this week's gate, focus, blockers, open decisions | Anyone | When the current state changes; at each weekly sync |
| `docs/team/<name>.md` | Personal tasks, notes, and session log | That person only | During and after every session |
| `docs/LOG.md` | What each person did, plus **Decision** lines, grouped by person | Each person, own section only | End of every session; when a decision is made |
| `docs/API_CONTRACT.md` | Tables, queries, functions, error codes | Moses (others propose) | Any data shape change |

## Start-of-session prompt (copy this)

> I'm [name] on the Grove team. Pull the latest `main` first. Then read `CLAUDE.md`, `docs/STATUS.md`, and `docs/team/[name].md`, plus `docs/API_CONTRACT.md` if we touch data. Catch me up on what teammates logged and any decisions that affect me, summarize this week's goal and my next task, and flag anything outdated. Then let's work on: [task]. Keep my team file and the shared docs updated as we go, and give me the end-of-session updates before we finish.
