# Log

What each person got done, **grouped by person**, newest first within each section. Anyone can open this file and see exactly what Celso (or anyone) shipped and when.

**Rules**
- Write only in your own section (or **Team**, for things done together).
- One line per thing shipped, changed, or learned. Link the PR or file.
- Add lines at the end of every session, in the same PR as your code.
- Detail stays in your `team/<name>.md` session log; this file is the summary everyone reads.

**Format:** `- **YYYY-MM-DD:** what happened (PR #, file, or link)`

**Decisions**
- Only decisions that affect someone else are logged, as a line in your own section tagged **Decision** with who it affects: `- **2026-10-20:** **Decision** (affects Hikaru, Edward): getDealsNearby returns businesses with no deal; id is now deal_id.` Decisions made together at a sync go under **Team**.
- If you disagree, raise it with the person who decided or at the weekly sync.

How each session catches up on this file: `CLAUDE.md` → Session protocol, step 3.

---

## Team
- **2026-10-24:** **Decision** (affects everyone): Grove is a marketing company first (restaurants pay to bring in students, especially Mon–Wed). MVP adds repeat days, link-only deals, club nights (no club accounts; giveback paid outside the app), and a shareable deal link and QR (advertising only; redeeming still needs the counter sticker). Push moves to a stretch goal. Weeks 2–3 are front-loaded; feature freeze at the end of Nov 8 (`CLAUDE.md`).
- **2026-10-19:** Assigned engineering and business roles (see `CLAUDE.md` → Team).
- **2026-10-09:** Lean Canvas: Problem, Solution, UVP, Customer Segments filled.
- **2026-10-08:** Professor approved the reframed idea: campus marketing platform for food businesses near campuses.

## Moses
- **2026-10-27:** **Decision** (affects Adolfo, Celso): Adolfo's business writes (`createDeal`, `endDeal`, `cancelDeal`, `getMyBusiness`, `saveBusiness`) are final in the contract, mock-backed until #73. Celso's RLS must let business members insert and update their own deals and business. Merged #126 (main merged in, `getMyDeals` and `setPin` routed through the data switch); #69 and #71 stay open until the canvas check.
- **2026-10-26:** **Decision** (affects everyone): screens import data functions from `@/lib/supabase`. It serves `mocks/` by default and the real Supabase wrappers when `NEXT_PUBLIC_DATA_SOURCE=supabase` (after Celso's RLS lands); a compile-time check keeps both signatures identical (#131).
- **2026-10-26:** **Decision** (affects Hikaru): `businesses` has generated `lat`/`lng` columns, and `deals_nearby(lat, lng, radius_m, open_now, has_deals)` returning `DealCard` rows is in the contract for #88 (#131).
- **2026-10-26:** **Decision** (affects Adolfo): new `subscribeToRedemptions({ businessId }, onRedemption)` for the live visit feed (#75), on mocks and real data; reuse `openNow()` from `lib/supabase/deal-status.ts` (#131, #135).
- **2026-10-26:** **Decision** (affects Celso): four more must-fixes on #128: rename migrations after the newest on main, let students read deals they redeemed, grant `lat`/`lng`, and hide `redemptions.student_location` with a column grant (Realtime follows column grants).
- **2026-10-26:** Realtime on `redemptions` plus `subscribeToRedemptions()` in contract, types, mocks, and wrappers; applied to grove-dev (#17, PR #135).
- **2026-10-26:** `claim-club-night` deployed to grove-dev: `claim_club_night()` makes one conditional update and creates the link-only deal; tests include a two-student race (#103, PRs #133, #134).
- **2026-10-26:** `redeem` deployed to grove-dev: `redeem_sticker()` runs the contract's checks and `record_redemption()` inserts in one transaction; pgTAP and served-function tests (#14, PR #132).
- **2026-10-26:** Typed queries for every contract function in `lib/supabase/queries.ts`, the mock/real switch in `lib/supabase/index.ts`, `openNow()`, generated DB types, and `npm run test:db` (#16, PR #131).
- **2026-10-26:** `deal_status()` and `deal_by_id()` on grove-dev, with the same 9 examples in pgTAP and vitest (#102, PR #130).
- **2026-10-26:** **Decision** (affects Edward): `claim-club-night` answers a blank club name with HTTP 400, so `claimClubNight()` throws. The claim screen must require a name and show a generic error if the claim throws.
- **2026-10-26:** **Decision** (affects Edward): every redemption requires a verified student (`NOT_VERIFIED_STUDENT` otherwise), so `students_only` is display-only (the "UCR students only" tag).
- **2026-10-26:** **Decision** (affects everyone): merged Hikaru's map (#125); vitest with `npm test` in CI is the team test runner. Requested changes on #126, #127, #128, #129 with fix prompts; merge order is #127, #128, #126, #129 (STATUS → Open PRs).
- **2026-10-26:** Removed the PR template (descriptions are now 1–3 lines plus `Closes #` lines), reviewed open PRs #125–#129 (RLS and PIN-function holes in #128 confirmed on a local database), and assigned Celso's 22 issues now that he has accepted his invite.
- **2026-10-25:** **Decision** (affects everyone): CI ("Lint, typecheck, build") is a required check on `main`; a PR can't merge until it passes (`.github/workflows/ci.yml`, #12).
- **2026-10-25:** **Decision** (affects Celso): every table has RLS on with no policies; RLS policies (including hiding `staff_pin` and `club_nights.claimed_by`) are Celso's next step before the app reads real data.
- **2026-10-25:** Seed data on grove-dev: UCR (with timezone), the eight canvas businesses, 15 deals including the Mon–Wed 2–5 PM repeat at Verde Bowl, and one open club night at Pepper Tree Pizza Co.; re-runnable (`supabase/seed.sql`, #8).
- **2026-10-25:** Made "Lint, typecheck, build" a required check in the `protect main` ruleset; PR + 1 approval unchanged, admins still bypass (#12).
- **2026-10-25:** CI workflow runs lint, typecheck, and build on Node from `.nvmrc` for every PR and push to `main` (`.github/workflows/ci.yml`, #12).
- **2026-10-25:** `club_nights` migration with every contract check, pulled forward from Week 2 so the seed has a club night (`supabase/migrations/20261025000100_club_nights.sql`, #101).
- **2026-10-25:** Core table migrations on grove-dev, matching the contract: `campuses` (with `timezone`), `profiles`, `businesses`, `business_members`, `deals` (with repeat days and `visibility`), `redemptions` with the `(student_id, deal_id, redeemed_on)` unique rule (`supabase/migrations/20261025000000_core_tables.sql`, #7).
- **2026-10-24:** **Decision** (affects everyone): no password manager. Teammates copy the Supabase URL and anon key from the dashboard (grove-dev → Project Settings → API Keys → Legacy) after accepting the Supabase org invite; the service-role key stays with Moses; anything else goes by one-time link (onetimesecret.com), never chat or email. Replaces the earlier password-manager rule.
- **2026-10-24:** **Decision** (affects everyone): Vercel is on the Hobby plan, so teammates can't be added or run `vercel env pull`. Moses shares secrets through a password manager; paste them into your own `.env.local`. Replaces the Oct 20 "keys only via `vercel env pull`" rule. Vercel connected (#13): production https://grove-jade.vercel.app, preview links on every PR.
- **2026-10-24:** Connected Vercel on the Hobby plan: production https://grove-jade.vercel.app, a preview deploy on every PR, env vars set in Vercel (#13).
- **2026-10-24:** Created the Supabase dev project `grove-dev` (us-west-1) with PostGIS 3.3.7, ran `supabase init` and `supabase link`, and committed `supabase/config.toml` (#6).
- **2026-10-24:** De-bloat pass: README cut to setup and doc links (156 → 44 lines), week gates moved into `CLAUDE.md`, repeated text trimmed in `CLAUDE.md`, STATUS, the contract, LOG, and team files (every rule, task, and issue number kept); ignored editor and Supabase CLI files; removed scaffold leftovers.
- **2026-10-24:** **Decision** (affects everyone): health check fixes. Moses owns every unlisted file (Celso may edit root routing for onboarding); Hikaru's role is maps and PWA install (push stretch) and he builds the "I'm here now" button Adolfo places; Moses owns the staff-token design (#19, Celso reviews by Nov 1); new `set-pin` (week 2) and `add-staff` (week 3) functions, `deal_by_id()` for link-only deals; Resend moved to stretch; production Supabase moved to week 3; if Celso isn't active by Oct 26, Moses takes #29. Added `.env.example` and a Done-when line on every open issue.
- **2026-10-24:** Split the PWA manifest and app icons out of push (#91) into #119 (Hikaru, week 3), so Grove is installable without push.
- **2026-10-24:** Updated the repo for Activity 2: `CLAUDE.md`, README, STATUS, all five team files, and the API contract (now final: repeat days, `visibility`, `club_nights`, `claim-club-night`), with `mocks/` to match. Synced GitHub issues and the board's week field.
- **2026-10-20:** **Decision** (affects everyone): no password manager; everyone gets keys only by running `vercel env pull .env.local` after Moses invites them to Vercel and Supabase. Node 22 is pinned (`.nvmrc`, `package.json` engines). PRs need 1 teammate approval; `CODEOWNERS` requests reviewers but code-owner review isn't required yet.
- **2026-10-20:** **Decision** (affects Celso, Adolfo, Hikaru, Edward): deal status is computed from `starts_at`/`ends_at`, not stored. "End now" sets `ends_at = now()`; cancelling a scheduled deal deletes it. RLS and `deals_nearby` check the time window.
- **2026-10-20:** **Decision** (affects Adolfo, Edward, Hikaru): deals get `discount_type` (`amount_off`, `percent_off`, `free_item`, `bogo`) and `discount_value` (dollars or percent; null for free item and BOGO), matching the Post a deal form.
- **2026-10-20:** **Decision** (affects Hikaru, Edward): `getDealsNearby` returns businesses with no deal (`has_deal: false`) for the map's green pins; the feed passes `hasDeals: true`; id is now `deal_id`.
- **2026-10-20:** Buttons are at least 44px tall at every size, bold, with dark-green links; `/theme` uses the defaults. Added Tailwind class names to the Design reference in `CLAUDE.md` (`components/ui/button.tsx`, `app/theme/page.tsx`).
- **2026-10-20:** Built the Grove Tailwind theme for Edward's #48: color, radius, and shadow tokens, Bricolage Grotesque + Figtree, shadcn mapped to Grove colors, preview at `/theme` (`app/globals.css`, `app/layout.tsx`, `app/theme/page.tsx`).
- **2026-10-20:** Created the GitHub repo `MosesfromSinai/Grove`, protected `main`, linked the Grove project board; Hikaru and Adolfo accepted invites.
- **2026-10-20:** API contract: defined `Deal`, `DealDetail`, `MyDeal`, `Redemption`, `BusinessPublic`, `BusinessStats`; added structured discount; deal status now computed; `getDealsNearby` returns businesses without deals (`has_deal`) (`docs/API_CONTRACT.md`).
- **2026-10-20:** Added `mocks/` for every contract query and function, with canvas sample data, plus `lib/supabase/types.ts` (`mocks/`, `lib/supabase/`).
- **2026-10-20:** Added the public-repo secrets rule to `CLAUDE.md` Conventions.
- **2026-10-20:** Scaffolded Next.js 16 with TypeScript strict, Tailwind, shadcn/ui, and the README folder layout; pinned Node 22; added `CODEOWNERS` (`moses/scaffold`).
- **2026-10-20:** Keys now come only from `vercel env pull`; updated the secrets and review rules in `CLAUDE.md` and the README setup.
- **2026-10-20:** Created issues #1–#99 for every team-file task, added them to the Grove board, and wrote the numbers into all five team files.
- **2026-10-20:** Fixed the Team table formatting in `README.md`.
- **2026-10-19:** Created project docs: README, CLAUDE.md, STATUS, DECISIONS, LOG, API_CONTRACT, five team files, PR template.
- **2026-10-19:** Wrote Claude Design prompt for the app with both redemption modes.
- **2026-10-12:** Updated the Grove Tech Stack Plan (Claude Docs) for sticker redemption and both modes.

## Celso
- **2026-10-26:** #128 review fixes: merged main, migrations renamed after main's newest, browser can update only `profiles.full_name` (column grant; the old trigger never fired), `lat`/`lng` readable on businesses, attempts tables closed to the browser, PIN wrappers fail closed, 45-check security test (`supabase/tests/rls_security.test.sql`) passing locally.
- **2026-10-26:** **Decision** (affects Edward, Adolfo): the browser can update only `profiles.full_name`; `role`, `verified_student`, and `campus_id` are set by the `handle_new_user()` trigger. Any profile edit screen gets a permission error for other columns.
- **2026-10-26:** **Decision** (affects Moses): the `_shared/pin.ts` wrappers throw on a database error instead of returning false, and the rate-limit checks treat anything but `false` as limited. Call `recordRedeemAttempt` on every `redeem` attempt before `isRedeemRateLimited`.
- **2026-10-26:** Security hardening: REVOKE EXECUTE on all PIN/rate-limit SQL functions from anon/authenticated, GRANT to service_role only; `redeem_attempts` table and fixed `is_redeem_rate_limited` to count attempts not redemptions; `protect_profile_columns` trigger blocks browser from writing role/email/verified_student/campus_id; .edu check moved into `handle_new_user()` trigger; `student_location` column-level REVOKE on redemptions; `deals_read_redeemed` policy; `claimed_club_name is null` on club_nights student policy; 18 pgTAP tests in `supabase/tests/rls_security_test.sql`.
- **2026-10-26:** Profiles trigger on `auth.users`: creates profiles row on first sign-in, sets role (business if email is in business_members, else student), links pending staff invites. Sprint 1 complete. Closes #32.
- **2026-10-26:** RLS policies on all tables: `is_business_member`/`is_business_owner` helpers, column-level REVOKE for `staff_pin` and `claimed_by`, all row-level policies. bcrypt PIN helpers (`hash_pin`, `verify_pin`, `is_pin_rate_limited`, `record_pin_attempt`, `is_redeem_rate_limited`) + TS wrappers in `_shared/pin.ts`. Threat model updated. Closes #34, #35, #36, #37, #105.
- **2026-10-26:** **Decision** (affects Moses): PIN lockout is 5 failures in 15 minutes. Call `is_pin_rate_limited` before attempting, `record_pin_attempt` after. Use `_shared/pin.ts` wrappers in `redeem-pin` and `set-pin`.
- **2026-10-26:** **Decision** (affects Moses): .edu check in `/auth/callback` needs a public-read RLS policy on `campuses` (anon can SELECT); that policy is now in #35 migration. Callback on PR #127 works once both PRs merge.
- **2026-10-26:** Google OAuth setup: Supabase clients, proxy.ts session refresh, /auth/callback route, sign-in page, root routing. Closes #29, #30, #33. (PR #127)

## Edward
_Nothing logged yet._

## Adolfo
- **2026-10-26:** Prepared PR #126 review fixes: concise contract/docs, 21 isolated Vitest tests via `npm test`, shared `openNow`, and verified ignore coverage; lint, typecheck, build, responsive/behavioral and accessibility checks passed; main merge waits on #127.
- **2026-10-26:** Business setup with profile, coordinates, hours, logo, food-truck toggle, and first-PIN flow on mocks (#70, PR #126).
- **2026-10-25:** Responsive dashboard shell and navigation (#69, PR #126); canvas comparison remains unverified.
- **2026-10-25:** Post-deal form with discounts, campus-time scheduling, photo preview, validation, and mock save (#71, PR #126); canvas comparison remains unverified.
- **2026-10-25:** My deals tabs/counts, End now with retained history, and guarded Cancel with confirmation (#72, PR #126).
- **2026-10-25:** **Decision** (affects Moses): business-write signatures remain proposals; photos/logos stay in mock memory until Storage wiring in #73.
- **2026-10-25:** **Decision** (affects Celso): `/dashboard` is the business entry route; real data requires authenticated business membership (#73).
- **2026-10-25:** **Decision** (affects Moses, Celso): onboarding configures the existing mock owner's business with explicit coordinates; provisioning, geocoding, and real PIN integration remain #73.

## Hikaru
- **2026-10-25:** Synced latest main and prepared `hikaru/map-foundation` for team review. Fixed real-map keyboard focus on selection; added Mapbox lifecycle and location-race regression tests plus `npm test` in the required CI job. #84 and real-map verification for #85 remain blocked on the restricted token.
- **2026-10-25:** Implemented the Week 1 map at `/map` on `hikaru/map-foundation`: grouped orange/green mock pins, combinable filters (#86), and location with campus fallback (#87). Mapbox wiring is in place, with a labeled pin preview until #84 supplies a restricted token; #85 remains open for actual-map and canvas verification. Four data tests and local browser checks cover filtering and synthetic location outcomes (`components/map/README.md`).
- **2026-10-25:** **Decision** (affects Edward, Moses): map defaults to a 3 km search radius; Walking distance narrows it to 800 m in a straight line, explicitly labeled as proximity rather than a route. The API contract and mocks are unchanged.
