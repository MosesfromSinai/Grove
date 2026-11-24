# Celso Lopez — Security and Auth

> Session rules: `CLAUDE.md` → Session protocol. Your next Claude session starts from this file, so keep it current.

_Last updated: 2026-11-22_

---

## Role
- **Engineering:** sign-in, student verification, database security rules, anti-fraud for redemptions, security testing. Reviews every change touching auth or RLS policies.
- **Business:** competitor analysis; 1–2 restaurant interviews and at least one student interview.
- **Design:** screen 1 (Sign in) on the [design canvas](https://claude.ai/artifact/9gApUhQQWpkU2FWTU27K1d). Tokens are in `CLAUDE.md` → Design reference.

## Owns
`app/(auth)/`, `lib/auth/`, RLS policies in `supabase/migrations/` (Moses reviews), the threat model below. You may edit the root routing in `app/page.tsx` for onboarding (Moses reviews).

## Depends on
- **Moses:** tables (week 1) before RLS policies can be written; the redemption functions for rate limiting; `club_nights` and `claim-club-night` (week 2) for their RLS and claim rate limits.

## Others depend on you
- **Everyone:** Google sign-in by end of week 1 (Phase 1 gate).
- **Moses:** `profiles` row created on sign-in (his `add-staff` links invited staff on their first sign-in, week 3), and the rate-limit and PIN-hash helpers (early week 2) that `redeem`, `redeem-pin`, `set-pin`, and `claim-club-night` call.
- **Adolfo:** business vs. student onboarding routing.

---

## Tasks

### Week 1 — Foundation (Oct 19–25)
- [x] Set up Google OAuth in Google Cloud and Supabase Auth (needs the Supabase project, #6; if you aren't active by Oct 26, Moses takes this) (#29)
- [x] Sign-in page (canvas screen 1, one button: "Sign in with your school Google account"); business owners use the same Google sign-in with any account (#30)
- [x] .edu check: email domain must match a `campuses.email_domain`; set `verified_student` (runs in `handle_new_user()`, PR #128) (#31)
- [x] Database trigger to create a `profiles` row on first sign-in (#32)
- [x] Onboarding: route to student app or business onboarding (root routing in `app/page.tsx`, Moses reviews) (#33)
- [x] Review the threat model below; add anything missing (#34)

### Week 2 — Lock down data (Oct 26–Nov 1)
- [x] RLS on every table, e.g. students select only public deals (link-only deals open only through `deal_by_id()`) and only their own redemptions; owners read only their own business's data; nobody inserts redemptions directly (only Edge Functions) (#35)
- [x] Hash `staff_pin`; never return it to the browser; write the PIN-hash helper early in week 2 so `redeem-pin` and `set-pin` use it (#36)
- [x] Rate limits on `redeem` and `redeem-pin`; lockout after repeated bad PINs (log the limit as a **Decision**); write the rate-limit helper early in week 2 so Moses's functions call it (#37)
- [x] Server-side sanity checks on location (reject impossible coordinates) (#38)
- [x] RLS for `club_nights`: businesses manage their own; students read open nights at their campus; only `claim-club-night` writes the claim columns; `claimed_by` never reaches the browser (#105)
- [x] Rate-limit club night claims (per student) in `claim-club-night` (#106)
- [ ] _Stretch goal (2026-11-09):_ Review the staff-scan token design with Moses (short-lived, signed, single use) (#39)

### Week 3 — Staff mode security (Nov 2–8)
- [ ] _Stretch goal (2026-11-09):_ `business_members` access: only staff of that business can call `staff-redeem` (#40)
- [x] Security test pass: try to redeem without being there, reuse a token, redeem twice in a day, read another business's stats, open a link-only deal off campus, claim the same club night twice; log results in the Security test log below (#41)

_Feature freeze Nov 8 (see `CLAUDE.md` → Week plan)._

### Week 4 — Review, no new features (Nov 9–15)
- [x] Fix every failed test from #41, or record it as an accepted risk in the threat model (#42)
- [x] Check no secrets are in the repo or its git history, e.g. with gitleaks (browser bundle already clean, Moses #41) (#43)
- [x] Browse without signing in, auth side: feed, map and deal pages open to signed-out visitors; anon reads only public data (`celso/public-browse`) (#156)
- [ ] Run the 6 security phone checks in `docs/STATUS.md` → Security test results on production, plus: a signed-out visitor can't redeem or see student data; send results to Moses (#158)
- [ ] Competitor slide for the pitch (#44)

### Business
- [ ] Competitor analysis in the shared Drive folder (Instagram, Yelp, Google Maps, coupon and student-discount apps); start from the Activity 2 competition table (#45)
- [ ] 1–2 restaurant interviews (hypotheses 1–4, see `CLAUDE.md` → Business); notes in the shared Drive folder (#46)
- [ ] At least one student interview (hypothesis 5, see `CLAUDE.md` → Business); notes in the shared Drive folder (#107)
- [ ] Fill in your attendance cell on the effort table (#47)

---

## Threat model
Update the Status column as defenses are built.

| Threat | Defense | Status |
|---|---|---|
| Sticker photo scanned from elsewhere | Location within ~150 m (`TOO_FAR`); cashier sees the student | Built (Moses #14) |
| Spoofed GPS | Daily limit; cashier check; flag unusual redemption patterns | Planned |
| Screenshot of the Redeemed screen | Live clock + animation | Built (phone check in #158) |
| Same deal redeemed repeatedly | Unique rule on (student, deal, date) | Built (#41 tests) |
| PIN guessing | PIN functions are service-role only (browser can't call `verify_pin`); bcrypt hash; lockout after 5 failures in 15 min (`is_pin_rate_limited`, `record_pin_attempt`); wrappers fail closed on DB errors | Built (#128) |
| Reused or shared staff-scan code | Short-lived, single-use, signed token; staff-only redeem | Planned |
| Non-student signs up | .edu domain check in the `handle_new_user()` trigger sets `verified_student`; redeeming still requires the flag | Built (#128) |
| Reading another business's data | RLS on every table; `is_business_member` helper prevents cross-business reads | Built |
| `staff_pin` exposed via API | Column-level REVOKE on `businesses` for anon/authenticated; bcrypt if leaked | Built |
| `club_nights.claimed_by` exposed via API | Column-level REVOKE on `club_nights` for anon/authenticated | Built |
| Leaked service-role or VAPID key | Server-only env vars, never committed; rotate if leaked | Built: gitleaks finds nothing in any commit (#43, 2026-11-22) |
| Link-only deal shared off campus | Link only shows the deal; redeeming still needs a verified student, the counter sticker, ~150 m, a live window, and the daily limit | Built (#41 tests) |
| Fake or duplicate club night claims | One claim per club night (conditional update), signed-in verified student, 3 claims per 7 days | Built (#106) |
| Claiming a club night for a club you're not in | Not checked: no club accounts in the MVP. **Accepted risk**; the restaurant sees the club name and visits | Accepted |
| Session token theft | httpOnly cookies + HTTPS (Supabase defaults); sessions expire | Built (Supabase) |
| Client-side time manipulation to access an out-of-window deal | Server uses `now()` for all deal status checks; client time is never trusted | Built (`deal_status()`) |
| User manually sets `verified_student`, `role`, or `campus_id` on their own profile | Column grant: the browser can update only `full_name` (the old `protect_profile_columns` trigger never fired inside `security definer`, so it was replaced) | Built (#128) |
| Someone signs up with another person's email (email/password provider) to get verified or take a staff invite | Google-only sign-in: turn off the Email provider in Supabase Auth | Planned (needs Moses) |
| Signed-out visitor reads student data or link-only deals, or redeems (#156) | Anon has no grant on `redemptions`, `profiles`, attempts tables; no anon policy on `business_members`, `club_nights`; `deals_read_public` and `deals_nearby` filter link-only; redeem and claim functions are service-role only; `/scan`, `/pin`, `/club-nights`, `/profile`, `/dashboard` need a session | Built (`anon_browse.test.sql`) |
| Flooding `redeem` with failed attempts | `redeem_attempts` table; 10 attempts per minute per student, counted before success or failure | Built (#128) |

## Security test log
Add a row for every test you run.

| Date | Test | Result | Fix |
|---|---|---|---|
| 2026-10-26 | `supabase/tests/rls_security.test.sql` (45 checks) on a local database: logged-out PIN guessing, making yourself verified or a business, seeing claimed club nights, reading `owner_id`/`staff_pin`/`claimed_by`/`student_location`, editing `qr_slug`, staff editing the business, browser inserting redemptions, attempt-based redeem limit | All pass; reopening the holes makes 7 checks fail | #128 |
| 2026-11-22 | gitleaks 8.30.1: `gitleaks git --log-opts=--all` (every branch, 336 commits) plus every patch including merge diffs through `gitleaks stdin`; `gitleaks dir` on the working tree | History: no leaks. Working tree: 27 hits, all in git-ignored files never committed (`.env.local`, `.next/`, `supabase/.temp/`); the only JWTs in `.next/static` are the anon key, and `supabase/.temp` holds the local CLI's demo keys | None needed (#43) |
| 2026-11-22 | `supabase/tests/anon_browse.test.sql` (22 checks) on a fresh local database: signed-out role reads public deals and businesses, opens a link-only deal only by id, can't see link-only deals in the table or `deals_nearby`, can't read redemptions, profiles, members, club nights or attempts, can't write deals, club nights or businesses, can't run redeem, claim or truck functions | All pass with no grant changes; full suite 159 checks pass | #156 |
| 2026-11-09 | Moses's #41 pass (automated checks and bundle scan) | All pass | See `docs/STATUS.md` → Security test results |
| 2026-10-26 | Old `protect_profile_columns` trigger, as a signed-in user | **Failed**: user set `verified_student = true`, `role = business` | Replaced with a column grant (#128) |

---

## Notes and decisions
_Record things only you need to remember. Decisions that affect others go in `docs/LOG.md` as **Decision** lines._

---

## Session log
_Newest at the top. One entry per session._

### 2026-11-22 (#156 browse without signing in)
- **Did:** Caught up on Nov 9–15 (Moses finished my open Week 2–3 code, closing #33, #35–#38, #41, #42, #105, #106; staff scan moved to stretch, so #39 and #40 too). On `celso/public-browse`: `/feed`, `/map` and `/deals/<id>` open to signed-out visitors (`lib/auth/public-paths.ts`, used by `proxy.ts`, with tests); redeeming, PIN, claiming and Profile still redirect to sign-in and come back through `grove_next`. New `supabase/tests/anon_browse.test.sql` (22 checks) confirms the anon role reads only public data; no migration or grant change needed. Lint, typecheck, 229 unit tests, build and 159 SQL checks pass; local signed-out routes checked with curl. Ticked closed issues and updated the threat model.
- **Also:** #43 gitleaks scan: no secrets in any commit on any branch; working-tree hits are only git-ignored local files (see Security test log). PR #164 opened for #156.
- **Next:** Moses reviews #164, then Edward's #157 can start. #158 phone checks on production (ask Moses for a test deal). Business: #44–#47, #107.
- **Blockers:** none. `/` still sends signed-out visitors to `/sign-in` (team call, see STATUS).

### 2026-10-26 (#128 review fixes)
- **Did:** Merged main; renamed migrations to `20261026220000`–`220200`; replaced the broken `protect_profile_columns` trigger with a column grant (browser updates only `full_name`); added `lat`/`lng` to the businesses select grant; revoked browser rights on `pin_attempts` and `redeem_attempts`; PIN helper wrappers now throw on DB errors; rewrote `rls_security.test.sql` (45 behavioral checks, all pass locally, plus Moses's tests and `npm run test:db`). Unticked #29–#33, #35–#37, #105 per Moses's review.
- **Next:** Moses's re-review of #127 and #128; #38, #106, #39 (staff-scan tokens, by Nov 1).
- **Blockers:** #127 preview check needs Vercel access from Moses. Email provider should be turned off in Supabase Auth (Moses).

### 2026-10-26 (session 3)
- **Did:** Security hardening fixes from Moses's PR review. Added REVOKE EXECUTE on all PIN/rate-limit functions from public/anon/authenticated, GRANT to service_role only. Created `redeem_attempts` table and rewrote `is_redeem_rate_limited` to count attempts (not successful redemptions); added `record_redeem_attempt`. Added `recordRedeemAttempt` and `isRedeemRateLimited` to `_shared/pin.ts`. Added .edu check to `handle_new_user()` trigger (sets verified_student and campus_id at sign-in). Added `protect_profile_columns` BEFORE UPDATE trigger (resets role/email/verified_student/campus_id when current_role = 'authenticated', so only full_name is browser-writable). Fixed column-level REVOKE on redemptions to exclude student_location. Added `deals_read_redeemed` policy. Added `claimed_club_name is null` to club_nights_read_students. Removed owner_id from businesses SELECT grant, qr_slug from UPDATE grant. Businesses update policy is now owner-only (not member-level). Created `supabase/tests/rls_security_test.sql` with 18 pgTAP assertions.
- **Next:** #38 (location sanity checks, server-side), #106 (rate-limit club night claims in `claim-club-night`), #39 (staff-scan token design review with Moses by Nov 1).
- **Blockers:** Moses needs to configure Google OAuth in the Supabase dashboard and set redirect URL to `{SITE_URL}/auth/callback` before sign-in works end to end. PR #127 (auth) must merge before PR #128 (RLS) since the callback lives in the same repo and Moses noted the move to `app/(auth)/auth/callback/route.ts`.

### 2026-10-26 (session 2)
- **Did:** RLS policies on every table (#35, #105): `is_business_member` and `is_business_owner` security-definer helpers; column-level REVOKE on `businesses.staff_pin` and `club_nights.claimed_by`; all row-level policies for campuses, profiles, businesses, business_members, deals, redemptions, club_nights. bcrypt PIN helpers via pgcrypto (`hash_pin`, `verify_pin`, `is_pin_rate_limited`, `record_pin_attempt`, `is_redeem_rate_limited`) plus typed TS wrappers for Moses in `supabase/functions/_shared/pin.ts` (#36, #37). Threat model reviewed and updated (#34). Excluded `supabase/functions/` from `tsconfig.json` so Deno imports don't break CI. Profiles trigger on `auth.users` insert: creates profiles row, sets role (business if email is in business_members, else student), links pending staff invites (#32). Sprint 1 complete.
- **Next:** #38 (location sanity checks, server-side), #106 (rate-limit club night claims in `claim-club-night`), #39 (staff-scan token design review with Moses by Nov 1).
- **Blockers:** Moses needs to configure Google OAuth in the Supabase dashboard and set redirect URL to `{SITE_URL}/auth/callback` before sign-in works end to end.

### 2026-10-26 (session 1)
- **Did:** Google OAuth setup (#29): installed `@supabase/ssr` + `@supabase/supabase-js`; created Supabase browser + server clients; `proxy.ts` session refresh; `/auth/callback` route; sign-in page; root routing. Closes #29, #30, #33. (PR #127)
- **Next:** Threat model review, RLS, PIN hash, rate limit.
- **Blockers:** .edu check needs `campuses` RLS (done this session). Profile trigger (#32) still needs Moses.

### 2026-10-26 (PR #127 review fixes)
- **Did:** Fixes from Moses's review of #127: removed the .edu check from the callback (it only reads the profile now; the check runs in `handle_new_user()` in #128), moved the callback to `app/(auth)/auth/callback/route.ts` (URL unchanged), made `/manifest.json`, `/sw.js` and `/icons/` public in `proxy.ts`. PR now closes #30 only; unticked #29, #31, #33.
- **Next:** Enable Google in Supabase Auth (#29), confirm sign-in on this PR's preview, then the #128 review fixes.
- **Blockers:** none.

### 2026-10-26
- **Did:** Google OAuth setup (#29): installed `@supabase/ssr` + `@supabase/supabase-js`; created `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` (SSR); added `proxy.ts` (Next.js 16 session-refresh + unauthenticated redirect); created `/auth/callback` route handler (exchanges code, runs .edu check, routes by role); built the sign-in page (`/sign-in`, canvas screen 1) with Google OAuth button; updated `app/page.tsx` to route by role. Also covers #30 (sign-in page) and #33 (onboarding routing). .edu check (#31) is scaffolded but needs Moses or me to add a public-read RLS policy on `campuses`. Profile trigger (#32) is Moses's migration.
- **Next:** #32 (ping Moses for the profiles trigger migration), then #34 (threat model review), then week 2: #35 (RLS on every table), #36 (PIN hash), #37 (rate limits).
- **Blockers:** .edu check (#31) and callback routing (#33) are fully wired but won't run until the `campuses` and `profiles` RLS policies exist (#35). Sign-in flow itself works once Moses configures Google OAuth in the Supabase Auth dashboard (grove-dev → Authentication → Providers → Google) and sets the redirect URL to `{SITE_URL}/auth/callback`.

### 2026-10-19
- **Did:** Assigned role.
- **Next:** Google OAuth setup once the repo exists.
- **Blockers:** Repo not created yet.
