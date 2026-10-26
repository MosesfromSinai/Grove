# Status — Where Grove Is Right Now

The project's live memory. Read this first every session. Overwrite it (don't append) whenever the current state changes, so it always describes **now**. History goes in `LOG.md`, not here.

_Last updated: 2026-10-25 by Adolfo_

> Branch sync note: fetched `origin/main` at `d999191`; it has 16 commits not integrated into this checkout. Its project status is now Phase 2, with tables/seed/CI delivered and real browser access still blocked by missing RLS policies/typed queries. The project-wide snapshot below predates those updates; use [upstream STATUS](https://github.com/MosesfromSinai/Grove/blob/main/docs/STATUS.md) for current teammate status until the branch is synchronized. The local Adolfo entry is current. No upstream merge has been performed.

---

## Current phase

**Phase 1: Foundation** (week 1 of 4, Oct 19–25): sign-in, foundation, database.
**Next gate:** Students can log in with a school Google account.
**Production:** https://grove-jade.vercel.app (every PR also gets a preview link).

Scope, direction, and the full week plan with gates: `CLAUDE.md` → What Grove is, MVP scope, Week plan.

**Feature freeze at the end of Nov 8** (see `CLAUDE.md` → Week plan).

## This week's focus

| Person | Focus |
|---|---|
| Moses | Supabase (#6) and Vercel (#13) are done. Next: migrations (#7) by Oct 25 so Celso's sign-in isn't blocked, then CI (#12) and seed data (#8). Invite everyone to the Supabase org |
| Celso | Google sign-in, .edu check, profile creation, threat model (3 new rows to review) |
| Edward | App shell, deal feed and deal page on mocks (theme done; see `/theme`) |
| Adolfo | #69 pushed as `51dfd63` on `adolfo/dashboard-foundation`. #71/#72 reviewed and sanity-audited; lint, typecheck, build, 14 regression groups, responsive/behavioral and accessibility checks passed. Publishing #71/#72, then #70 onboarding on mocks. Upstream sync/shared API review pending |
| Hikaru | Map with mock pins, filter chips, location permission handling |

## Blockers

- Shared API review (Moses): the #71/#72 business adapter, mock writes, validation, types, contract additions, and test script are local proposals pending review. Real auth/RLS/Storage wiring remains #73; the current dashboard is a sample-only preview.
- Branch sync: reconcile the newer upstream guidance, CI, STATUS, and LOG before integration. Preserve uncommitted #71/#72 work; synchronization requires the existing commit/merge approvals.

- **Everyone: review your team file.** Moses edited all five on 2026-10-24 (one-time exception, like setup) for the Activity 2 changes: new tasks, interview work, dependencies, and the week plan. Fix anything that's wrong in your own file.
- **Everyone:** accept the Supabase org invite, then copy the Supabase URL and anon key into your `.env.local` (see README → Getting started). The service-role key stays with Moses.
- Celso still needs to accept his GitHub invite; his issues stay unassigned until he does. **If he isn't active by Oct 26, Moses takes Google OAuth setup (#29)** so the Phase 1 gate isn't stuck.
- Week 1 ends Oct 25 and most Week 1 tasks are open. Build on `mocks/`; don't wait on real tables.
- Week 2 order for Moses (others build on mocks meanwhile): #101 and #102 first (Oct 26–27), then typed queries #16, then `redeem` / `redeem-pin` / `claim-club-night` / `set-pin`, then Realtime #17. Celso writes the rate-limit and PIN-hash helpers early in Week 2 so Moses's functions call them.

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
