# Status — Where Grove Is Right Now

The project's live memory. Read this first every session. Overwrite it (don't append) whenever the current state changes, so it always describes **now**. History goes in `LOG.md`, not here.

_Last updated: 2026-10-25 by Moses_

---

## Current phase

**Phase 2: Core loop** (week 2 of 4, Oct 26–Nov 1): scan-to-redeem end to end, repeat days, visibility, club nights, live-now check.
**Next gate:** First test redemption (one sticker, two phones); a link-only deal stays out of the feed and map.
**Carried over from Week 1:** the sign-in gate (students log in with a school Google account) isn't passed yet; it blocks real redemptions.
**Production:** https://grove-jade.vercel.app (every PR also gets a preview link).

Scope, direction, and the full week plan with gates: `CLAUDE.md` → What Grove is, MVP scope, Week plan.

**Feature freeze at the end of Nov 8** (see `CLAUDE.md` → Week plan).

## This week's focus

| Person | Focus |
|---|---|
| Moses | Sprint 1 done: Supabase (#6), Vercel (#13), tables (#7, #101), CI (#12), seed data (#8). Next: `deal_status()` (#102), then typed queries (#16), then `redeem` (#14). Backup for Google OAuth (#29) |
| Celso | #29, #30, #33 done (OAuth clients, sign-in page, root routing). Next: ping Moses for #32 (profiles trigger), then #34 (threat model), then week 2: #35 (RLS), #36 (PIN hash), #37 (rate limits) |
| Edward | Finish the app shell and deal feed on mocks, then the scanner, `redeem` call, and Redeemed screen |
| Adolfo | Dashboard layout in progress (`adolfo/dashboard-foundation`), then onboarding, the post-deal form with repeat days and visibility, and the sticker |
| Hikaru | Finish the map on mocks, then `deals_nearby` (tables and seed are on grove-dev) |

## Blockers

- **Everyone: review your team file.** Moses edited all five on 2026-10-24 (one-time exception, like setup) for the Activity 2 changes: new tasks, interview work, dependencies, and the week plan. Fix anything that's wrong in your own file.
- **Everyone:** accept the Supabase org invite, then copy the Supabase URL and anon key into your `.env.local` (see README → Getting started). The service-role key stays with Moses.
- **Celso:** .edu check in `/auth/callback` needs a public-read RLS policy on `campuses` (allow anon `SELECT`) before `verified_student` is set. Also needs Moses's profiles trigger migration (#32). Both required before the sign-in gate can be called fully passed.
- **Celso:** every table has RLS on and no policies, so the browser (anon and signed-in users) reads nothing until policies land. Includes hiding `businesses.staff_pin` and `club_nights.claimed_by`. The profile trigger can insert into `profiles` as is.
- **Everyone:** CI ("Lint, typecheck, build") now runs on every PR and must pass to merge. Run `npm run lint && npm run typecheck && npm run build` before pushing.
- Real tables and seed data are on grove-dev, but keep building on `mocks/` until typed queries (#16) and RLS policies exist.
- Week 2 order for Moses (others build on mocks meanwhile): #102 first (Oct 26–27; #101 is done), then typed queries #16, then `redeem` / `redeem-pin` / `claim-club-night` / `set-pin`, then Realtime #17. Celso writes the rate-limit and PIN-hash helpers early in Week 2 so Moses's functions call them.

## Open decisions

| Decision | Owner | Needed by |
|---|---|---|
| Pricing: per verified visit (~$0.50–1, monthly cap) plus a flat fee for club nights; first deal free for pilots. Still to be validated | Hikaru (with everyone's interviews) | Before the pitch deck |
| MVP demo date (week dates assume a demo around Nov 16–20; re-date the plan once it's set) | Team | Next sync |
| PIN lockout limit (tries before lockout) | Celso | Week 2 |
| Final name ("Grove" may be trademarked) | Team | Before slides are final |
| Staff-scan token design (signed token vs. table) | Moses (Celso reviews) | Nov 1 |
| Which campus channels to pursue (clubs, fraternities, student ambassadors); none confirmed | Team | Before club night outreach |

## Business status

- Interviews (five hypotheses, see `CLAUDE.md` → Business): **0 done so far.**
- Lean Canvas: Problem, Solution, UVP, Customer Segments filled. Key Metrics, Unfair Advantage, Channels, Cost Structure, Revenue Streams, and Project Name still blank.
- Pilot businesses signed: **0.** Offer: first deal free. Target: at least one signed by Nov 6 for the Week 4 pilot.
- Effort table: Celso's attendance cell is blank.
