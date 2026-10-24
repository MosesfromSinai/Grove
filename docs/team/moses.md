# Moses Avila — Backend and Redemption Engine

> **Session reminder.** Full rules are in `CLAUDE.md` → Session protocol. Your next Claude session starts from this file, so keep it current.
> - **Start:** pull `main`; read `CLAUDE.md`, `docs/STATUS.md`, and this file; catch up on teammates and their **Decision** lines in `docs/LOG.md`.
> - **During:** tick tasks here as they finish; log decisions that affect others as **Decision** lines in your section of `docs/LOG.md`.
> - **End:** add a dated Session log entry here and a line in your section of `docs/LOG.md`; commit them with your code.

_Last updated: 2026-10-24_

---

## Role
- **Engineering:** database, server functions, redemption logic for both modes, live updates, repo and deployment setup. Reviews every change to `supabase/migrations` and `supabase/functions`.
- **Business:** pitch deck and live demo; 1–2 restaurant interviews and at least one student interview.
- **Design:** no screens, but use the canvas's sample businesses and deals (Orange Peel Tacos, Boba Bungalow, etc.) in `mocks/` and `seed.sql` so screens and data match. [Design canvas](https://claude.ai/artifact/9gApUhQQWpkU2FWTU27K1d).

## Owns
`supabase/migrations/`, `supabase/functions/redeem*`, `supabase/functions/issue-code`, `supabase/functions/staff-redeem`, `supabase/functions/claim-club-night`, `supabase/functions/set-pin`, `supabase/functions/add-staff`, `supabase/seed.sql`, `lib/supabase/`, `mocks/`, `docs/API_CONTRACT.md`, CI and Vercel setup, and every file not listed for someone else (root config, `app/layout.tsx`, `app/page.tsx`, `app/theme/`, `components/ui/`, `lib/utils.ts`, `.github/`).

## Depends on
- **Celso:** sign-in and `profiles` creation (needed to know who the student is), RLS policies on your tables, RLS on `club_nights` and claim rate limits (week 2), and the rate-limit and PIN-hash helpers your functions call (early week 2).
- **Hikaru:** `deals_nearby` SQL function (you review the migration).

## Others depend on you
Everyone, for the repo on day 1, `mocks/` and the API contract by day 3, and real tables by end of week 1. **This is the critical path.**
- **Adolfo and Edward:** `club_nights`, the live-now check, and `claim-club-night` by end of week 2, for their week 3 club night screens.
- **Adolfo:** `set-pin` (week 2, for onboarding and Reset PIN) and `add-staff` / `getStaff` (week 3, for his staff list).
- **Edward and Hikaru:** the `visibility` column and `deal_status()` (week 2) to hide link-only deals and show repeating deals at the right times.

---

## Setup (done 2026-10-20)
Repo `MosesfromSinai/Grove` (public), the ruleset on `main`, the Grove board (project #6), an issue for every task, `CODEOWNERS`, and the Next.js scaffold are done. Celso still needs to accept his GitHub invite.

## Tasks

### Week 1 — Foundation (Oct 19–25)
- [x] Create GitHub repo (#1)
- [x] Protect `main` (PR + 1 review; add passing checks once CI exists) (#2)
- [x] Link the existing Grove project board to the repo (Todo, In progress, In review, Done; auto-add on) (#3)
- [x] Add teammates; collect GitHub usernames; set up `CODEOWNERS` (#4)
- [x] Scaffold Next.js (App Router, TypeScript strict, Tailwind, shadcn/ui) with the folder layout from the README (#5)
- [ ] Create Supabase dev project; enable PostGIS (#6)
- [ ] Migrations for `campuses`, `profiles`, `businesses`, `business_members`, `deals`, `redemptions`, `push_subscriptions`, including the unique rule on `(student_id, deal_id, redeemed_on)`; `push_subscriptions` waits for the push stretch goal, and repeat days and club nights are #101 (#7)
- [ ] `seed.sql` with UCR campus and invented sample businesses and deals, plus one Mon–Wed repeating deal and one open club night (same as `mocks/`) (#8)
- [x] `mocks/` matching `API_CONTRACT.md` (day 1–3) (#9)
- [x] Finalize `API_CONTRACT.md`; change status from DRAFT (final 2026-10-24, with repeat days, link-only deals, club nights) (#10)
- [ ] `.env.example`; keys reach teammates only through `vercel env pull` (#11)
- [ ] GitHub Actions: lint, type check, build (#12)
- [ ] Connect Vercel; preview deploy per PR; add every `.env.example` variable in Vercel and invite the team so `vercel env pull` works (#13)

### Week 2 — Core loop and data (Oct 26–Nov 1)
- [ ] `redeem` Edge Function: sticker belongs to business, deal live, within ~150 m (PostGIS `ST_DWithin`), daily limit, returns `ErrorCode` on failure; live check via `deal_status()` (#102) (#14)
- [ ] `redeem-pin` Edge Function (hashed PIN check, with Celso) (#15)
- [ ] Typed queries in `lib/supabase/` for every function in the contract (#16)
- [ ] Enable Realtime on `redemptions` for dashboards (#17)
- [ ] Run the week-2 gate test: one printed sticker, two phones (#18)
- [ ] Migration: `active_days`, `daily_start`, `daily_end`, `visibility` on `deals`; `timezone` on `campuses`; `club_nights` table (#101)
- [ ] Live-now check with repeat days: one `deal_status()` SQL function used by `redeem`, `redeem-pin`, `issue-code`, `staff-redeem`, `deals_nearby`, and RLS (#102)
- [ ] `claim-club-night` Edge Function: one claim per night (conditional update), creates the link-only deal, returns `ALREADY_CLAIMED` / `CLUB_NIGHT_EXPIRED` / `NOT_SIGNED_IN` (#103)
- [ ] `set-pin` Edge Function (owner only; random 4-digit PIN returned once, stored hashed with Celso's helper) and the database default for `qr_slug` on new businesses (#120)
- [ ] Agree staff-scan token design with Celso by Nov 1; log it as a **Decision** in `LOG.md` (#19)

### Week 3 — Staff mode and stats (Nov 2–8)
- [ ] `issue-code` (token refreshes ~every 30 s) and `staff-redeem` (staff of that business only) (#20)
- [ ] `getBusinessStats` SQL (per deal, per hour) (#21)
- [ ] Sentry for app and functions (#22)
- [ ] `add-staff` Edge Function and `getStaff` query (owner adds staff by Google email; an invited email becomes active on its first sign-in) (#121)
- [ ] Production Supabase project; migrate; real campus data only; ready before the Week 4 pilot (#23)

_Feature freeze at the end of Nov 8: anything unfinished goes to the team to decide (finish quickly or move to the stretch goal)._

### Week 4 — Pilot and demo, no new features (Nov 9–15)
- [ ] Pilot support and bug fixes (#24)
- [ ] Demo script (sticker redemption live on stage) (#25)
- [ ] Pitch deck, built from real interview numbers (#26)

### Business
- [ ] 1–2 restaurant interviews testing hypotheses 1–4 (slow days, per-visit vs. flat fee, hosting club nights, trusting QR check-in); notes in the shared Drive folder (#27)
- [ ] At least one student interview for hypothesis 5 (students try Grove when a deal reaches them through a club or fraternity they're in); notes in the shared Drive folder (#104)

---

## Notes and decisions
_Record things only you need to remember (gotchas, commands, links). Decisions that affect others go in `docs/LOG.md` as **Decision** lines._

- GitHub usernames: Moses `MosesfromSinai`, Hikaru `hika583`, Celso `CelsoSLopez`, Edward `TheEdwardVan`, Adolfo `GorillaAdolfo`.
- `gh` needs the `project` scope for the board: `gh auth refresh -s project`.
- Local Node 22 via nvm: `nvm install 22 && nvm use` (the default was 21). Scaffold is Next.js 16.4.2; `npm run typecheck` runs `next typegen` first because `LayoutProps` is generated.
- `AGENTS.md` is git-ignored: `next dev` rewrites it on every run, and shared rules live in `CLAUDE.md`.
- The Grove board is user project #6 (`gh project item-add 6 --owner MosesfromSinai`). Project #2 is an unused duplicate.

## Blockers
- Celso hasn't accepted his GitHub invite; his issues stay unassigned until he does. If he isn't active by Oct 26, Moses takes Google OAuth setup (#29) so the Phase 1 gate isn't stuck.

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
