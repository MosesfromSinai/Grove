# Status — Where Grove Is Right Now

The project's live memory. Read this first every session. Overwrite it (don't append) whenever the current state changes, so it always describes **now**. History goes in `LOG.md`, not here.

_Last updated: 2026-10-24 by Moses_

---

## Current phase

**Phase 1: Foundation** (week 1 of 4, Oct 19–25): sign-in, foundation, database.
**Next gate:** Students can log in with a school Google account.

**Direction (Activity 2):** Grove is a marketing company first. Restaurants pay us to bring in students, especially on slow days (Mon–Wed). New in the MVP: repeating deals, link-only deals, club nights, and a shareable deal link and QR. Push notifications moved to a stretch goal. See `CLAUDE.md` → What Grove is, MVP scope, Week plan.

## Week plan

| Week | Focus |
|---|---|
| 1 (Oct 19–25) | Sign-in, foundation, database |
| 2 (Oct 26–Nov 1) | Core loop plus all the data work: `redeem`, `redeem-pin`, repeat days, visibility, `club_nights`, live-now check, `claim-club-night`; repeat days and visibility on the post-deal form; link-only deals hidden from feed and map, opened from their link |
| 3 (Nov 2–8) | Every remaining feature: staff scan, club night screens (post, claim, results), deal link and QR download, stats |
| 4 (Nov 9–15) | No new features: pilot at a real restaurant, phone testing, bug fixes, demo prep |

**Feature freeze at the end of Nov 8.** Anything unfinished then goes to the team to decide: finish quickly or move to the stretch goal.

## This week's focus

| Person | Focus |
|---|---|
| Moses | **Today:** Supabase dev project (#6), then migrations (#7) by Oct 25 so Celso's sign-in isn't blocked. Then seed data, CI, Vercel. API contract is final; `mocks/` match it |
| Celso | Google sign-in, .edu check, profile creation, threat model (3 new rows to review) |
| Edward | App shell, deal feed and deal page on mocks (theme done; see `/theme`) |
| Adolfo | Dashboard layout, business onboarding, post-deal form on mocks |
| Hikaru | Map with mock pins, filter chips, location permission handling |

## Blockers

- **Everyone: review your team file.** Moses edited all five on 2026-10-24 (one-time exception, like setup) for the Activity 2 changes: new tasks, interview work, dependencies, and the week plan. Fix anything that's wrong in your own file.
- Celso still needs to accept his GitHub invite; his issues stay unassigned until he does. **If he isn't active by Oct 26, Moses takes Google OAuth setup (#29)** so the Phase 1 gate isn't stuck.
- Week 1 ends Oct 25 and most Week 1 tasks are open. Build on `mocks/`; don't wait on real tables.
- Week 2 order for Moses (others build on mocks meanwhile): #101 and #102 first (Oct 26–27), then typed queries #16, then `redeem` / `redeem-pin` / `claim-club-night` / `set-pin`, then Realtime #17. Celso writes the rate-limit and PIN-hash helpers early in Week 2 so Moses's functions call them.

## Open decisions

| Decision | Owner | Needed by |
|---|---|---|
| Pricing: per verified visit (~$0.50–1, monthly cap) plus a flat fee for club nights; first deal free for pilots. Still to be validated | Hikaru (with everyone's interviews) | Before the pitch deck |
| MVP demo date | Team | Next sync |
| PIN lockout limit (tries before lockout) | Celso | Week 2 |
| Final name ("Grove" may be trademarked) | Team | Before slides are final |
| Staff-scan token design (signed token vs. table) | Moses (Celso reviews) | Nov 1 |
| Which campus channels to pursue (clubs, fraternities, student ambassadors); none confirmed | Team | Before club night outreach |

Push targeting radius is no longer open: push is a stretch goal.

## Business status

- Part 3 interviews test five hypotheses (see `CLAUDE.md` → Business). Each person: 1–2 restaurant interviews (hypotheses 1–4) and at least one student interview (hypothesis 5). **0 done so far.** Notes go in the shared Drive folder.
- Lean Canvas: Problem, Solution, UVP, Customer Segments filled. Key Metrics, Unfair Advantage, Channels, Cost Structure, Revenue Streams, and Project Name still blank.
- Pilot businesses signed: **0.** Offer: first deal free. Target: at least one signed by Nov 6 for the Week 4 pilot.
- Effort table: Celso's attendance cell is blank.
