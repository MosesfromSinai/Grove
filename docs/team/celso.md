# Celso Lopez — Security and Auth

> **Session reminder.** Full rules are in `CLAUDE.md` → Session protocol. Your next Claude session starts from this file, so keep it current.
> - **Start:** pull `main`; read `CLAUDE.md`, `docs/STATUS.md`, and this file; catch up on teammates in `docs/LOG.md` and `docs/DECISIONS.md`.
> - **During:** tick tasks here as they finish; record decisions in your section of `docs/DECISIONS.md`.
> - **End:** add a dated Session log entry here and a line in your section of `docs/LOG.md`; commit them with your code.

_Last updated: 2026-10-19_

---

## Role
- **Engineering:** sign-in, student verification, database security rules, anti-fraud for redemptions, security testing. Reviews every change touching auth or RLS policies.
- **Business:** competitor analysis; 1–2 customer interviews.
- **Design:** screen 1 (Sign in) on the [design canvas](https://claude.ai/artifact/9gApUhQQWpkU2FWTU27K1d). Tokens are in `CLAUDE.md` → Design reference.

## Owns
`app/(auth)/`, `lib/auth/`, RLS policies in `supabase/migrations/` (Moses reviews), the threat model below.

## Depends on
- **Moses:** tables (week 1) before RLS policies can be written; the redemption functions for rate limiting.

## Others depend on you
- **Everyone:** Google sign-in by end of week 1 (Phase 1 gate).
- **Moses:** `profiles` row created on sign-in.
- **Adolfo:** business vs. student onboarding routing.

---

## Tasks

### Week 1 — Foundation (Oct 19–25)
- [ ] Set up Google OAuth in Google Cloud and Supabase Auth (#29)
- [ ] Sign-in page (one button: "Sign in with your school Google account") (#30)
- [ ] .edu check: email domain must match a `campuses.email_domain`; set `verified_student` (#31)
- [ ] Database trigger to create a `profiles` row on first sign-in (#32)
- [ ] Onboarding: route to student app or business onboarding (#33)
- [ ] Review the threat model below; add anything missing (#34)

### Week 2 — Lock down data (Oct 26–Nov 1)
- [ ] RLS on every table, e.g. students read live deals and only their own redemptions; owners read only their own business's data; nobody inserts redemptions directly (only Edge Functions) (#35)
- [ ] Hash `staff_pin`; never return it to the browser (#36)
- [ ] Rate limits on `redeem` and `redeem-pin`; lockout after repeated bad PINs (#37)
- [ ] Server-side sanity checks on location (reject impossible coordinates) (#38)

### Week 3 — Staff mode security (Nov 2–8)
- [ ] Design staff-scan tokens with Moses (short-lived, signed, single use) (#39)
- [ ] `business_members` access: only staff of that business can call `staff-redeem` (#40)
- [ ] Security test pass: try to redeem without being there, reuse a token, redeem twice in a day, read another business's stats; log results in the Security test log below (#41)

### Week 4 — Review (Nov 9–15)
- [ ] Fix findings from the test pass (#42)
- [ ] Check no secrets are in the repo or browser bundle (#43)
- [ ] Competitor slide for the pitch (#44)

### Business
- [ ] Competitor analysis in the shared Drive folder (Instagram, Yelp, Google Maps, coupon and student-discount apps) (#45)
- [ ] 1–2 customer interviews; notes in the shared Drive folder (#46)
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

## Security test log
Add a row for every test you run.

| Date | Test | Result | Fix |
|---|---|---|---|

---

## Notes and decisions
_Record things only you need to remember. Team-wide decisions go in `docs/DECISIONS.md`._

---

## Session log
_Newest at the top. One entry per session._

### 2026-10-19
- **Did:** Assigned role.
- **Next:** Google OAuth setup once the repo exists.
- **Blockers:** Repo not created yet.
