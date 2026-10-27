# Moses Avila — Backend and Redemption Engine

> Session rules: `CLAUDE.md` → Session protocol. Your next Claude session starts from this file, so keep it current.

_Last updated: 2026-10-26_

---

## Role
- **Engineering:** database, server functions, redemption logic for both modes, live updates, repo and deployment setup. Reviews every change to `supabase/migrations` and `supabase/functions`.
- **Business:** pitch deck and live demo; 1–2 restaurant interviews and at least one student interview.
- **Design:** no screens, but use the canvas's sample businesses and deals (Orange Peel Tacos, Boba Bungalow, etc.) in `mocks/` and `seed.sql` so screens and data match. [Design canvas](https://claude.ai/artifact/9gApUhQQWpkU2FWTU27K1d).

## Owns
`supabase/migrations/`, `supabase/functions/redeem*`, `supabase/functions/issue-code`, `supabase/functions/staff-redeem`, `supabase/functions/claim-club-night`, `supabase/functions/set-pin`, `supabase/functions/add-staff`, `supabase/seed.sql`, `lib/supabase/`, `mocks/`, `docs/API_CONTRACT.md`, CI and Vercel setup, and every file not listed for someone else (root config, `app/layout.tsx`, `app/page.tsx`, `app/theme/`, `components/ui/`, `lib/utils.ts`, `.github/`).

## Depends on
- **Celso:** sign-in and `profiles` creation (needed to know who the student is), RLS policies on your tables, RLS on `club_nights` and claim rate limits (week 2), the rate-limit and PIN-hash helpers your functions call (early week 2), and the `profiles` trigger (#32) that `add-staff` builds on to link invited staff (week 3).
- **Hikaru:** `deals_nearby` SQL function (you review the migration).

## Others depend on you
Everyone, for the repo on day 1, `mocks/` and the API contract by day 3, and real tables by end of week 1. **This is the critical path.**
- **Adolfo and Edward:** `club_nights`, the live-now check, and `claim-club-night` by end of week 2, for their week 3 club night screens.
- **Adolfo:** `set-pin` (week 2, for onboarding and Reset PIN) and `add-staff` / `getStaff` (week 3, for his staff list).
- **Edward and Hikaru:** the `visibility` column and `deal_status()` (week 2) to hide link-only deals and show repeating deals at the right times.

---

## Tasks

### Week 1 — Foundation (Oct 19–25)
- [x] Create GitHub repo (#1)
- [x] Protect `main` (PR + 1 review; add passing checks once CI exists) (#2)
- [x] Link the existing Grove project board to the repo (Todo, In progress, In review, Done; auto-add on) (#3)
- [x] Add teammates; collect GitHub usernames; set up `CODEOWNERS` (#4)
- [x] Scaffold Next.js (App Router, TypeScript strict, Tailwind, shadcn/ui) with the folder layout from the README (#5)
- [x] Create Supabase dev project; enable PostGIS (#6)
- [x] Migrations for `campuses`, `profiles`, `businesses`, `business_members`, `deals`, `redemptions`, including the unique rule on `(student_id, deal_id, redeemed_on)`; `push_subscriptions` waits for the push stretch goal, and repeat days and club nights are #101 (#7)
- [x] `seed.sql` with UCR campus and invented sample businesses and deals, plus one Mon–Wed repeating deal and one open club night (same as `mocks/`) (#8)
- [x] `mocks/` matching `API_CONTRACT.md` (day 1–3) (#9)
- [x] Finalize `API_CONTRACT.md`; change status from DRAFT (final 2026-10-24, with repeat days, link-only deals, club nights) (#10)
- [x] `.env.example`; teammates copy the URL and anon key from the Supabase dashboard; other keys go by one-time link (#11)
- [x] GitHub Actions: lint, type check, build (#12)
- [x] Connect Vercel; preview deploy per PR; set the env vars in Vercel and teammates copy their Supabase keys from the dashboard; the service-role key stays with Moses (Hobby plan: teammates can't be added) (#13)

### Week 2 — Core loop and data (Oct 26–Nov 1)
- [x] `redeem` Edge Function: sticker belongs to business, deal live, within ~150 m (PostGIS `ST_DWithin`), daily limit, returns `ErrorCode` on failure; live check via `deal_status()` (#102) (#14)
- [ ] `redeem-pin` Edge Function (hashed PIN check, with Celso) (#15)
- [x] Typed queries in `lib/supabase/` for every function in the contract (#16)
- [x] Enable Realtime on `redemptions` for dashboards (#17)
- [ ] Run the week-2 gate test: one printed sticker, two phones (#18)
- [x] Migration: `active_days`, `daily_start`, `daily_end`, `visibility` on `deals`; `timezone` on `campuses`; `club_nights` table (#101)
- [ ] Live-now check with repeat days: one `deal_status()` SQL function used by `redeem`, `redeem-pin`, `issue-code`, `staff-redeem`, `deals_nearby`, and RLS (#102)
- [x] `claim-club-night` Edge Function: one claim per night (conditional update), creates the link-only deal, returns `ALREADY_CLAIMED` / `CLUB_NIGHT_EXPIRED` / `NOT_SIGNED_IN` (#103)
- [ ] `set-pin` Edge Function (owner only; random 4-digit PIN returned once, stored hashed with Celso's helper) and the database default for `qr_slug` on new businesses (#120)
- [ ] Agree staff-scan token design with Celso by Nov 1; log it as a **Decision** in `LOG.md` (#19)

### Week 3 — Staff mode and stats (Nov 2–8)
- [ ] `issue-code` (token refreshes ~every 30 s) and `staff-redeem` (staff of that business only) (#20)
- [ ] `getBusinessStats` SQL (per deal, per hour) (#21)
- [ ] Sentry for app and functions (#22)
- [ ] `add-staff` Edge Function and `getStaff` query (owner adds staff by Google email; an invited email becomes active on its first sign-in) (#121)
- [ ] Production Supabase project; migrate; real campus data only; ready before the Week 4 pilot (#23)

_Feature freeze Nov 8 (see `CLAUDE.md` → Week plan)._

### Week 4 — Pilot and demo, no new features (Nov 9–15)
- [ ] Pilot support and bug fixes (#24)
- [ ] Demo script (sticker redemption live on stage) (#25)
- [ ] Pitch deck, built from real interview numbers (#26)

### Business
- [ ] 1–2 restaurant interviews (hypotheses 1–4, see `CLAUDE.md` → Business); notes in the shared Drive folder (#27)
- [ ] At least one student interview (hypothesis 5, see `CLAUDE.md` → Business); notes in the shared Drive folder (#104)

---

## Notes and decisions
_Record things only you need to remember (gotchas, commands, links). Decisions that affect others go in `docs/LOG.md` as **Decision** lines._

- GitHub usernames: Moses `MosesfromSinai`, Hikaru `hika583`, Celso `CelsoSLopez`, Edward `TheEdwardVan`, Adolfo `GorillaAdolfo`.
- `gh` needs the `project` scope for the board: `gh auth refresh -s project`.
- Local Node 22 via nvm: `nvm install 22 && nvm use` (the default was 21). Scaffold is Next.js 16.4.2; `npm run typecheck` runs `next typegen` first because `LayoutProps` is generated.
- `AGENTS.md` is git-ignored: `next dev` rewrites it on every run, and shared rules live in `CLAUDE.md`.
- Production: https://grove-jade.vercel.app. Vercel is on the Hobby plan (only Moses has access). Teammates copy the Supabase URL and anon key from the dashboard after the org invite; the service-role key stays with Moses; anything else goes by one-time link (onetimesecret.com).
- Never run `supabase config push`: the local `config.toml` still has the default `127.0.0.1` auth URLs and would overwrite the remote Site URL and redirect URLs.
- The Grove board is user project #6 (`gh project item-add 6 --owner MosesfromSinai`). Project #2 is an unused duplicate.
- `main` is protected by the "protect main" ruleset (not classic branch protection): PR + 1 approval, plus the required CI check "Lint, typecheck, build". Admins bypass.
- Query grove-dev without the DB password: `npx supabase db query --linked "<sql>"` (or `-f file.sql`). Refresh the seed's live deals with `npx supabase db query --linked -f supabase/seed.sql`; it clears its own rows first.
- `supabase db reset` (local) needs Docker Desktop running; `supabase start -x studio,...` keeps it light.
- Check invite status with `gh api repos/MosesfromSinai/Grove/invitations`, not the collaborators list: on a public repo that lists pending invitees too, with `read`.
- Local tests: `npx supabase start -x studio,imgproxy,inbucket,mailpit,storage-api,logflare,vector,supavisor,postgres-meta` (keeps auth, REST, Realtime, and the edge runtime), then `npm run test:db` (pgTAP plus the `*.db.test.ts` files).
- After adding a new Edge Function, restart the whole local stack (`supabase stop` then `start`); the runtime only serves functions that existed at start. After `supabase db reset`, restart Realtime (`docker restart supabase_realtime_Grove`) before `test:db`.
- Deploy a function with `npx supabase functions deploy <name> --use-api`. Smoke test signed out with the anon key from `.env.local`; it should answer `NOT_SIGNED_IN`.
- Realtime `postgres_changes` follows column grants (checked locally): a role without select on `student_location` doesn't receive it.
- Migration timestamps on main end at `20261026216000`; Celso renames #128's when he merges main.

## Blockers
- `redeem-pin` (#15) and `set-pin` (#120) wait on Celso's PIN-hash and rate-limit helpers (#128).
- The #18 gate test waits on sign-in (#127, Google enabled in Supabase Auth), RLS (#128), and Edward's scanner on real data (#129). `redeem` itself is deployed and tested.
- #102 stays open until `redeem-pin`, `issue-code`, `staff-redeem`, and `deals_nearby` use `deal_status()`.
---

## Session log
_Newest at the top. One entry per session._

### 2026-10-26 (Week 2)
- **Did:** `deal_status()` and `deal_by_id()` with matching pgTAP and vitest examples (#130, part of #102). Typed queries for every contract function behind one mock/real switch, plus `businesses.lat`/`lng` and `openNow()` (#16, #131). `redeem` (#14, #132) and `claim-club-night` (#103, #133, #134) in SQL behind Edge Functions, deployed to grove-dev, with pgTAP and served-function tests including a two-student claim race. Realtime on `redemptions` plus `subscribeToRedemptions()` (#17, #135). Drafted the staff-scan token write-up (#19). Added four must-fix lines to Celso's #128 review (migration timestamps, redeemed-deal read policy, lat/lng grant, `student_location` grant).
- **Next:** `redeem-pin` (#15) and `set-pin` with the `qr_slug` default (#120) once #128 lands; agree #19 with Celso by Nov 1; the #18 gate test once sign-in, RLS, and the scanner are merged.
- **Blockers:** Celso's #127 and #128 (sign-in, RLS, PIN helpers).

### 2026-10-25
- **Did:** Core table migrations (#7) and repeat days, visibility, campus timezone, `club_nights` (#101, pulled forward so the seed has a club night), pushed to grove-dev and checked against the contract; RLS on every table, no policies yet. CI workflow (#12) passes on GitHub and is a required check on `main`. `seed.sql` (#8) with UCR, the eight canvas businesses, 15 deals including the Mon–Wed repeat, and one open club night, applied to grove-dev. Merged PR #123; Sprint 1 is done. Found Celso's invite is still pending (it was misread as accepted earlier), so his issues stay unassigned.
- **Next:** `deal_status()` (#102), then typed queries (#16), then `redeem` (#14). Take #29 on Oct 26 if Celso still isn't active.
- **Blockers:** No RLS policies yet, so only the service role can read the tables (Celso). Celso's GitHub invite is still pending.

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
