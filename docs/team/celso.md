# Celso Lopez — Security and Auth

> Session rules: `CLAUDE.md` → Session protocol. Your next Claude session starts from this file, so keep it current.

_Last updated: 2026-10-26_

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
- [x] .edu check: email domain must match a `campuses.email_domain`; set `verified_student` — scaffolded in callback; needs RLS read policy on `campuses` (#31)
- [ ] Database trigger to create a `profiles` row on first sign-in (#32)
- [x] Onboarding: route to student app or business onboarding (root routing in `app/page.tsx`, Moses reviews) (#33)
- [ ] Review the threat model below; add anything missing (#34)

### Week 2 — Lock down data (Oct 26–Nov 1)
- [ ] RLS on every table, e.g. students select only public deals (link-only deals open only through `deal_by_id()`) and only their own redemptions; owners read only their own business's data; nobody inserts redemptions directly (only Edge Functions) (#35)
- [ ] Hash `staff_pin`; never return it to the browser; write the PIN-hash helper early in week 2 so `redeem-pin` and `set-pin` use it (#36)
- [ ] Rate limits on `redeem` and `redeem-pin`; lockout after repeated bad PINs (log the limit as a **Decision**); write the rate-limit helper early in week 2 so Moses's functions call it (#37)
- [ ] Server-side sanity checks on location (reject impossible coordinates) (#38)
- [ ] RLS for `club_nights`: businesses manage their own; students read open nights at their campus; only `claim-club-night` writes the claim columns; `claimed_by` never reaches the browser (#105)
- [ ] Rate-limit club night claims (per student) in `claim-club-night` (#106)
- [ ] Review the staff-scan token design with Moses (short-lived, signed, single use), agreed by Nov 1 (#39)

### Week 3 — Staff mode security (Nov 2–8)
- [ ] `business_members` access: only staff of that business can call `staff-redeem` (#40)
- [ ] Security test pass: try to redeem without being there, reuse a token, redeem twice in a day, read another business's stats, open a link-only deal off campus, claim the same club night twice; log results in the Security test log below (#41)

_Feature freeze Nov 8 (see `CLAUDE.md` → Week plan)._

### Week 4 — Review, no new features (Nov 9–15)
- [ ] Fix every failed test from #41, or record it as an accepted risk in the threat model (#42)
- [ ] Check no secrets are in the repo or browser bundle (#43)
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
| Sticker photo scanned from elsewhere | Location within ~150 m; cashier sees the student | Planned |
| Spoofed GPS | Daily limit; cashier check; flag unusual redemption patterns | Planned |
| Screenshot of the Redeemed screen | Live clock + animation | Planned |
| Same deal redeemed repeatedly | Unique rule on (student, deal, date) | Planned |
| PIN guessing | Hashed PIN, rate limit, lockout | Planned |
| Reused or shared staff-scan code | Short-lived, single-use, signed token; staff-only redeem | Planned |
| Non-student signs up | .edu domain check, `verified_student` | Planned |
| Reading another business's data | RLS on every table | Planned |
| Leaked service-role or VAPID key | Server-only env vars, never committed; rotate if leaked | Planned |
| Link-only deal shared off campus | Link only shows the deal; redeeming still needs a verified student, the counter sticker, ~150 m, a live window, and the daily limit | Planned |
| Fake or duplicate club night claims | One claim per club night (conditional update), signed-in verified student, claim rate limit | Planned |
| Claiming a club night for a club you're not in | Not checked: no club accounts in the MVP. **Accepted risk**; the restaurant sees the club name and visits | Accepted |

## Security test log
Add a row for every test you run.

| Date | Test | Result | Fix |
|---|---|---|---|

---

## Notes and decisions
_Record things only you need to remember. Decisions that affect others go in `docs/LOG.md` as **Decision** lines._

---

## Session log
_Newest at the top. One entry per session._

### 2026-10-26
- **Did:** Google OAuth setup (#29): installed `@supabase/ssr` + `@supabase/supabase-js`; created `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` (SSR); added `proxy.ts` (Next.js 16 session-refresh + unauthenticated redirect); created `/auth/callback` route handler (exchanges code, runs .edu check, routes by role); built the sign-in page (`/sign-in`, canvas screen 1) with Google OAuth button; updated `app/page.tsx` to route by role. Also covers #30 (sign-in page) and #33 (onboarding routing). .edu check (#31) is scaffolded but needs Moses or me to add a public-read RLS policy on `campuses`. Profile trigger (#32) is Moses's migration.
- **Next:** #32 (ping Moses for the profiles trigger migration), then #34 (threat model review), then week 2: #35 (RLS on every table), #36 (PIN hash), #37 (rate limits).
- **Blockers:** .edu check (#31) and callback routing (#33) are fully wired but won't run until the `campuses` and `profiles` RLS policies exist (#35). Sign-in flow itself works once Moses configures Google OAuth in the Supabase Auth dashboard (grove-dev → Authentication → Providers → Google) and sets the redirect URL to `{SITE_URL}/auth/callback`.

### 2026-10-19
- **Did:** Assigned role.
- **Next:** Google OAuth setup once the repo exists.
- **Blockers:** Repo not created yet.
