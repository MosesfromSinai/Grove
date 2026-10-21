# Moses Avila — Backend and Redemption Engine

> **Session reminder.** Full rules are in `CLAUDE.md` → Session protocol. Your next Claude session starts from this file, so keep it current.
> - **Start:** pull `main`; read `CLAUDE.md`, `docs/STATUS.md`, and this file; catch up on teammates in `docs/LOG.md` and `docs/DECISIONS.md`.
> - **During:** tick tasks here as they finish; record decisions in your section of `docs/DECISIONS.md`.
> - **End:** add a dated Session log entry here and a line in your section of `docs/LOG.md`; commit them with your code.

_Last updated: 2026-10-20_

---

## Role
- **Engineering:** database, server functions, redemption logic for both modes, live updates, repo and deployment setup. Reviews every change to `supabase/migrations` and `supabase/functions`.
- **Business:** pitch deck and live demo; 1–2 customer interviews.
- **Design:** no screens, but use the canvas's sample businesses and deals (Orange Peel Tacos, Boba Bungalow, etc.) in `mocks/` and `seed.sql` so screens and data match. [Design canvas](https://claude.ai/artifact/9gApUhQQWpkU2FWTU27K1d).

## Owns
`supabase/migrations/`, `supabase/functions/redeem*`, `supabase/functions/issue-code`, `supabase/functions/staff-redeem`, `supabase/seed.sql`, `lib/supabase/`, `mocks/`, `docs/API_CONTRACT.md`, CI and Vercel setup.

## Depends on
- **Celso:** sign-in and `profiles` creation (needed to know who the student is), RLS policies on your tables.
- **Hikaru:** `deals_nearby` SQL function (you review the migration).

## Others depend on you
Everyone, for the repo on day 1, `mocks/` and the API contract by day 3, and real tables by end of week 1. **This is the critical path.**

---

## Setup — do this first
1. Create the private GitHub repo, push these docs as the first commit, add teammates, protect `main`, and create the Grove project board (Todo, In progress, In review, Done; auto-add on).
   - Done: repo `MosesfromSinai/Grove` exists (currently **public**, not private) with the docs pushed.
   - Teammates: all four accepted (2026-10-20).
   - Left: protect `main`; link the existing Grove board (on Moses's account) to the repo.
2. Once teammates accept their invites, create a GitHub issue for every task in all five team files, assigned to its owner and on the board, and write each issue number next to its task (one-time exception to "never write in someone else's team file").
3. Create your first feature branch from `main` (`moses/scaffold`) and tell the team the repo is ready.

## Tasks

### Week 1 — Foundation (Oct 19–25)
- [x] Create GitHub repo
- [ ] Protect `main` (PR + 1 review; add passing checks once CI exists)
- [ ] Link the existing Grove project board to the repo (Todo, In progress, In review, Done; auto-add on)
- [ ] Add teammates; collect GitHub usernames; set up `CODEOWNERS`
- [ ] Scaffold Next.js (App Router, TypeScript strict, Tailwind, shadcn/ui) with the folder layout from the README
- [ ] Create Supabase dev project; enable PostGIS
- [ ] Migrations for `campuses`, `profiles`, `businesses`, `business_members`, `deals`, `redemptions`, `push_subscriptions`, including the unique rule on `(student_id, deal_id, redeemed_on)`
- [ ] `seed.sql` with UCR campus and invented sample businesses and deals
- [x] `mocks/` matching `API_CONTRACT.md` (day 1–3)
- [ ] Finalize `API_CONTRACT.md` with the team by Oct 21; change status from DRAFT (gaps filled 2026-10-20; waiting on teammates' ✅ in `DECISIONS.md`)
- [ ] `.env.example`; share secrets via a password manager
- [ ] GitHub Actions: lint, type check, build
- [ ] Connect Vercel; preview deploy per PR

### Week 2 — Core loop (Oct 26–Nov 1)
- [ ] `redeem` Edge Function: sticker belongs to business, deal live, within ~150 m (PostGIS `ST_DWithin`), daily limit, returns `ErrorCode` on failure
- [ ] `redeem-pin` Edge Function (hashed PIN check, with Celso)
- [ ] Typed queries in `lib/supabase/` for every function in the contract
- [ ] Enable Realtime on `redemptions` for dashboards
- [ ] Run the week-2 gate test: one printed sticker, two phones

### Week 3 — Staff mode and stats (Nov 2–8)
- [ ] Agree staff-scan token design with Celso; record in `DECISIONS.md`
- [ ] `issue-code` (token refreshes ~every 30 s) and `staff-redeem` (staff of that business only)
- [ ] `getBusinessStats` SQL (per deal, per hour)
- [ ] Sentry for app and functions

### Week 4 — Pilot and demo (Nov 9–15)
- [ ] Production Supabase project; migrate; real campus data only
- [ ] Pilot support and bug fixes
- [ ] Demo script (sticker redemption live on stage)
- [ ] Pitch deck

### Business
- [ ] 1–2 customer interviews; notes in the shared Drive folder
- [ ] Pitch deck built from real interview numbers

---

## Notes and decisions
_Record things only you need to remember (gotchas, commands, links). Team-wide decisions go in `docs/DECISIONS.md`._

- GitHub usernames: Moses `MosesfromSinai`, Hikaru `hika583`, Celso `CelsoSLopez`, Edward `TheEdwardVan`, Adolfo `GorillaAdolfo`.
- `gh` needs the `project` scope for the board: `gh auth refresh -s project`.

## Blockers
- `gh` token still lacks the `project` scope after one refresh attempt; issues wait on it (check with `gh auth status`).

---

## Session log
_Newest at the top. One entry per session._

### 2026-10-20
- **Did:** Confirmed repo exists and all four teammates accepted. Filled API contract gaps (`Deal`, `DealDetail`, `MyDeal`, `Redemption`, `BusinessPublic`, `BusinessStats`), added structured discount, computed deal status, and `has_deal` rows in `getDealsNearby`. Wrote `lib/supabase/types.ts`, `lib/supabase/deal-status.ts`, and `mocks/` (all contract queries and functions, canvas sample data); strict type check and smoke test pass. Added the public-repo secrets rule to `CLAUDE.md`.
- **Next:** Fix the `gh` project scope, create and number the issues, protect `main`, create `moses/scaffold`, then Week 1 build.
- **Blockers:** `gh` token still lacks the `project` scope, so issues aren't created yet.

### 2026-10-19
- **Did:** Set up project docs and roles.
- **Next:** Create repo and scaffold.
- **Blockers:** Need everyone's GitHub usernames.
