# Moses Avila — Backend and Redemption Engine

> **Session reminder.** Full rules are in `CLAUDE.md` → Session protocol. Your next Claude session starts from this file, so keep it current.
> - **Start:** pull `main`; read `CLAUDE.md`, `docs/STATUS.md`, and this file; catch up on teammates (and answer their **Decision** lines) in `docs/LOG.md`.
> - **During:** tick tasks here as they finish; log decisions that affect others as **Decision** lines in your section of `docs/LOG.md`.
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
   - Teammates: Hikaru and Adolfo accepted; Celso and Edward invited, pending (2026-10-20).
   - `main` protected (ruleset: PR + 1 approval); Grove board (project #6) linked to the repo.
   - Step 2 done: issues #1–#99 created for every task, on the board, numbers written in all five team files. Celso's and Edward's are unassigned until they accept.
   - Step 3: `moses/scaffold` created.
2. Once teammates accept their invites, create a GitHub issue for every task in all five team files, assigned to its owner and on the board, and write each issue number next to its task (one-time exception to "never write in someone else's team file").
3. Create your first feature branch from `main` (`moses/scaffold`) and tell the team the repo is ready.

## Tasks

### Week 1 — Foundation (Oct 19–25)
- [x] Create GitHub repo (#1)
- [x] Protect `main` (PR + 1 review; add passing checks once CI exists) (#2)
- [x] Link the existing Grove project board to the repo (Todo, In progress, In review, Done; auto-add on) (#3)
- [x] Add teammates; collect GitHub usernames; set up `CODEOWNERS` (#4)
- [x] Scaffold Next.js (App Router, TypeScript strict, Tailwind, shadcn/ui) with the folder layout from the README (#5)
- [ ] Create Supabase dev project; enable PostGIS (#6)
- [ ] Migrations for `campuses`, `profiles`, `businesses`, `business_members`, `deals`, `redemptions`, `push_subscriptions`, including the unique rule on `(student_id, deal_id, redeemed_on)` (#7)
- [ ] `seed.sql` with UCR campus and invented sample businesses and deals (#8)
- [x] `mocks/` matching `API_CONTRACT.md` (day 1–3) (#9)
- [ ] Finalize `API_CONTRACT.md` with the team by Oct 21; change status from DRAFT (gaps filled 2026-10-20; waiting on teammates' ✅ lines in `LOG.md`) (#10)
- [ ] `.env.example`; keys reach teammates only through `vercel env pull` (#11)
- [ ] GitHub Actions: lint, type check, build (#12)
- [ ] Connect Vercel; preview deploy per PR (#13)

### Week 2 — Core loop (Oct 26–Nov 1)
- [ ] `redeem` Edge Function: sticker belongs to business, deal live, within ~150 m (PostGIS `ST_DWithin`), daily limit, returns `ErrorCode` on failure (#14)
- [ ] `redeem-pin` Edge Function (hashed PIN check, with Celso) (#15)
- [ ] Typed queries in `lib/supabase/` for every function in the contract (#16)
- [ ] Enable Realtime on `redemptions` for dashboards (#17)
- [ ] Run the week-2 gate test: one printed sticker, two phones (#18)

### Week 3 — Staff mode and stats (Nov 2–8)
- [ ] Agree staff-scan token design with Celso; log it as a **Decision** in `LOG.md` (#19)
- [ ] `issue-code` (token refreshes ~every 30 s) and `staff-redeem` (staff of that business only) (#20)
- [ ] `getBusinessStats` SQL (per deal, per hour) (#21)
- [ ] Sentry for app and functions (#22)

### Week 4 — Pilot and demo (Nov 9–15)
- [ ] Production Supabase project; migrate; real campus data only (#23)
- [ ] Pilot support and bug fixes (#24)
- [ ] Demo script (sticker redemption live on stage) (#25)
- [ ] Pitch deck (#26)

### Business
- [ ] 1–2 customer interviews; notes in the shared Drive folder (#27)
- [ ] Pitch deck built from real interview numbers (#28)

---

## Notes and decisions
_Record things only you need to remember (gotchas, commands, links). Decisions that affect others go in `docs/LOG.md` as **Decision** lines._

- GitHub usernames: Moses `MosesfromSinai`, Hikaru `hika583`, Celso `CelsoSLopez`, Edward `TheEdwardVan`, Adolfo `GorillaAdolfo`.
- `gh` needs the `project` scope for the board: `gh auth refresh -s project`.
- Local Node 22 via nvm: `nvm install 22 && nvm use` (the default was 21). Scaffold is Next.js 16.4.2; `npm run typecheck` runs `next typegen` first because `LayoutProps` is generated.
- `AGENTS.md` is git-ignored: `next dev` rewrites it on every run, and shared rules live in `CLAUDE.md`.
- The Grove board is user project #6 (`gh project item-add 6 --owner MosesfromSinai`). Project #2 is an unused duplicate.

## Blockers
- Celso and Edward haven't accepted their GitHub invites; their issues stay unassigned until they do.

---

## Session log
_Newest at the top. One entry per session._

### 2026-10-20 (theme)
- **Did:** Built Edward's theme task (#48) on `main`: Grove tokens in `app/globals.css`, Bricolage Grotesque + Figtree in the root layout, shadcn mapped to Grove colors, `/theme` preview page. Updated the review rule in `CLAUDE.md`.
- **Next:** `.env.example` (#11) and CI (#12), Vercel (#13), Supabase (#6).
- **Blockers:** None new.

### 2026-10-20 (scaffold)
- **Did:** Scaffolded Next.js 16.4.2 on `moses/scaffold` (TypeScript strict, Tailwind 4, shadcn/ui, README folder layout), pinned Node 22, added `CODEOWNERS`. Lint, typecheck, and build pass on Node 22. Updated the secrets rule (keys via `vercel env pull`), review rules, and README setup; recorded the dev setup decision.
- **Next:** Push and open the scaffold PR (Closes #4, #5); Hikaru or Adolfo approves. Then `.env.example` (#11) and CI (#12), Vercel (#13), Supabase (#6).
- **Blockers:** Celso and Edward haven't accepted invites; until they do, only Hikaru or Adolfo can approve PRs.

### 2026-10-20
- **Did:** Confirmed repo exists; Hikaru and Adolfo accepted, Celso and Edward still pending. Protected `main`; linked Grove board #6; created issues #1–#99 and numbered every team-file task. Filled API contract gaps (`Deal`, `DealDetail`, `MyDeal`, `Redemption`, `BusinessPublic`, `BusinessStats`), added structured discount, computed deal status, and `has_deal` rows in `getDealsNearby`. Wrote `lib/supabase/types.ts`, `lib/supabase/deal-status.ts`, and `mocks/` (all contract queries and functions, canvas sample data); strict type check and smoke test pass. Added the public-repo secrets rule to `CLAUDE.md`.
- **Next:** Week 1 build on `moses/scaffold`: Next.js scaffold (#5), Supabase dev project (#6), migrations (#7).
- **Blockers:** Celso and Edward haven't accepted their GitHub invites, so their issues are unassigned.

### 2026-10-19
- **Did:** Set up project docs and roles.
- **Next:** Create repo and scaffold.
- **Blockers:** Need everyone's GitHub usernames.
