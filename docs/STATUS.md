# Status — Where Grove Is Right Now

The project's live memory. Read this first every session. Overwrite it (don't append) whenever the current state changes, so it always describes **now**. History goes in `LOG.md`, not here.

_Last updated: 2026-10-28 by Moses_

---

## Current phase

**Phase 2: Core loop** (week 2 of 4, Oct 26–Nov 1): scan-to-redeem end to end, repeat days, visibility, club nights, live-now check.
**Next gate:** First test redemption (one sticker, two phones); a link-only deal stays out of the feed and map.
**Week 1 gate passed (2026-10-27):** a UCR Google sign-in on production creates a verified student profile.
**Production:** https://grove-jade.vercel.app (every PR also gets a preview link).

Scope, direction, and the full week plan with gates: `CLAUDE.md` → What Grove is, MVP scope, Week plan.

**Feature freeze at the end of Nov 8** (see `CLAUDE.md` → Week plan).

## This week's focus

| Person | Focus |
|---|---|
| Moses | Done: sign-in gate, RLS, `redeem`, `redeem-pin`, `set-pin`, `claim-club-night`, Realtime, typed queries, all on grove-dev. Next: staff-scan design (#19) with Celso by Nov 1, the #18 gate test, then `issue-code` and `staff-redeem` (#20) |
| Celso | #127 and #128 merged; sign-in gate passed. Next: #38, #106, #39 (staff-scan review by Nov 1) |
| Edward | #129 merged: shell, feed, deal page, scanner calling `redeem()`, Redeemed screen (#49–#52, #55, #56 done). Next: phone test of the scanner (#53), PIN backup link and screen (#54, #58), sticker page (#57) |
| Adolfo | #126 merged (#70, #72 done; business writes final in the contract). Canvas check for #69 and #71, then repeat days and visibility on the post-deal form (#112), and #73 |
| Hikaru | `/map` merged (#125; #86, #87 done). #85 awaits the Mapbox token (#84) and canvas check; then `deals_nearby` (#88); `deal_status()` is live |

## Open PRs (merge in this order)

No open PRs. Moses re-checks each PR when its author pushes fixes; it merges when CI passes and every item in its review is done.


## Blockers

- **Hikaru (#84–85):** restricted Mapbox token still needs creation and transfer to Moses for Vercel. The preview works without tiles; actual Mapbox rendering, canvas screen 3 comparison, and HTTPS phone location testing are pending. Edward can integrate `/map` into the student shell.

- **Everyone: review your team file.** Moses edited all five on 2026-10-24 (one-time exception, like setup) for the Activity 2 changes: new tasks, interview work, dependencies, and the week plan. Fix anything that's wrong in your own file.
- **Everyone:** accept the Supabase org invite, then copy the Supabase URL and anon key into your `.env.local` (see README → Getting started). The service-role key stays with Moses.
- **Gate test (#18):** the full path is merged (deal page → Redeem in store → scanner → `redeem()` → Redeemed screen). Waiting on a test business at the test location and `NEXT_PUBLIC_DATA_SOURCE=supabase` in Vercel (Moses). The feed stays empty on real data until `deals_nearby` (#88), so the test opens the deal by its link.
- **Settings (done):** Vercel Authentication is off for preview deployments, so anyone with a preview link can open it. Supabase Auth on grove-dev is Google-only: Email is disabled, Google is enabled, and redirect URLs cover production, localhost, and `grove-*-mosesfromsinais-projects.vercel.app` previews.
- **RLS is live on grove-dev (#128).** Screens can switch to real data once `NEXT_PUBLIC_DATA_SOURCE=supabase` is set; until then they use mocks.
- **Everyone:** CI ("Lint, typecheck, build") runs on every PR and must pass to merge; it now runs `npm test` (vitest) too. Run `npm run lint && npm run typecheck && npm test && npm run build` before pushing.
- **Everyone:** import data functions from `@/lib/supabase` (not `@/mocks`). It serves mocks until `NEXT_PUBLIC_DATA_SOURCE=supabase` is set in Vercel (Moses), now possible since RLS is live. Same names and types, so nothing else changes.

## Open decisions

| Decision | Owner | Needed by |
|---|---|---|
| Pricing: per verified visit (~$0.50–1, monthly cap) plus a flat fee for club nights; first deal free for pilots. Still to be validated | Hikaru (with everyone's interviews) | Before the pitch deck |
| MVP demo date (week dates assume a demo around Nov 16–20; re-date the plan once it's set) | Team | Next sync |
| Final name ("Grove" may be trademarked) | Team | Before slides are final |
| Staff-scan token design: Moses recommends a `redemption_codes` table (write-up on #19) | Celso reviews | Nov 1 |
| Which campus channels to pursue (clubs, fraternities, student ambassadors); none confirmed | Team | Before club night outreach |

## Business status

- Interviews (five hypotheses, see `CLAUDE.md` → Business): **0 done so far.**
- Lean Canvas: Problem, Solution, UVP, Customer Segments filled. Key Metrics, Unfair Advantage, Channels, Cost Structure, Revenue Streams, and Project Name still blank.
- Pilot businesses signed: **0.** Offer: first deal free. Target: at least one signed by Nov 6 for the Week 4 pilot.
- Effort table: Celso's attendance cell is blank.
