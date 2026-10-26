# Status — Where Grove Is Right Now

The project's live memory. Read this first every session. Overwrite it (don't append) whenever the current state changes, so it always describes **now**. History goes in `LOG.md`, not here.

_Last updated: 2026-10-26 by Moses_

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
| Moses | Sprint 1 done. Next: `deal_status()` (#102), then typed queries (#16), then `redeem` (#14). Merge open PRs in order as fixes land (below) |
| Celso | Fix #127 (enable Google in Supabase Auth, #29) and the #128 security holes; then #38, #106, #39 |
| Edward | Rework #129 onto `mocks/` and the contract; then the scanner, `redeem` call, and Redeemed screen |
| Adolfo | Merge main into #126 after #127 lands, trim contract and docs; then repeat days and visibility on the post-deal form (#112) |
| Hikaru | `/map` merged (#125; #86, #87 done). #85 awaits the Mapbox token (#84) and canvas check; then `deals_nearby` (#88) after `deal_status()` |

## Open PRs (merge in this order)

Moses re-checks each PR when its author pushes fixes. It merges when CI passes and every item in its review is done.

| Order | PR | Waiting on |
|---|---|---|
| 1 | #127 Celso, Google sign-in | Google enabled in Supabase Auth and sign-in working on its preview; .edu check moved into `handle_new_user()`; PWA paths public; callback moved; Closes #30 only |
| 2 | #128 Celso, RLS and PIN helpers | Security fixes (PIN functions service-role only, `profiles` updates `full_name` only, open club nights only, `owner_id` hidden, attempt-based redeem limit) plus a test script; Moses re-runs the security checks on a local database before merging |
| 3 | #126 Adolfo, dashboard foundation | Merge main after #127 (conflicts block CI); trim contract and docs; tests in vitest; canvas check |
| 4 | #129 Edward, student shell and feed | Rebuild on `mocks/` and the contract; no typed-code redeem; remove files outside his area; design tokens; docs |

## Blockers

- **Hikaru (#84–85):** restricted Mapbox token still needs creation and transfer to Moses for Vercel. The preview works without tiles; actual Mapbox rendering, canvas screen 3 comparison, and HTTPS phone location testing are pending. Edward can integrate `/map` into the student shell.

- **Everyone: review your team file.** Moses edited all five on 2026-10-24 (one-time exception, like setup) for the Activity 2 changes: new tasks, interview work, dependencies, and the week plan. Fix anything that's wrong in your own file.
- **Everyone:** accept the Supabase org invite, then copy the Supabase URL and anon key into your `.env.local` (see README → Getting started). The service-role key stays with Moses.
- **Sign-in gate:** waits on #127. Celso enables Google in Supabase Auth (#29); nothing that requires sign-in merges until it works on the preview.
- **RLS:** every table on grove-dev still has RLS on and no policies, so the browser reads nothing until #128 merges with its security fixes.
- **Everyone:** CI ("Lint, typecheck, build") runs on every PR and must pass to merge; it now runs `npm test` (vitest) too. Run `npm run lint && npm run typecheck && npm test && npm run build` before pushing.
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
