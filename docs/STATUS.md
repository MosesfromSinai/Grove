# Status — Where Grove Is Right Now

The project's live memory. Read this first every session. Overwrite it (don't append) whenever the current state changes, so it always describes **now**. History goes in `LOG.md`, not here.

_Last updated: 2026-10-27 by Moses_

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
| Moses | Done: `deal_status()`, typed queries (#16), `redeem` (#14), `claim-club-night` (#103), Realtime (#17), all on grove-dev. Next: `redeem-pin` (#15) and `set-pin` (#120) once #128 lands; agree staff-scan tokens (#19) with Celso by Nov 1; gate test (#18) |
| Celso | #127 and #128 review fixes pushed (main merged in, CI passing). Next: #38, #106, #39 |
| Edward | Rework #129 onto `mocks/` and the contract; then the scanner, `redeem` call, and Redeemed screen |
| Adolfo | #126 merged (#70, #72 done; business writes final in the contract). Canvas check for #69 and #71, then repeat days and visibility on the post-deal form (#112), and #73 |
| Hikaru | `/map` merged (#125; #86, #87 done). #85 awaits the Mapbox token (#84) and canvas check; then `deals_nearby` (#88) after `deal_status()` |

## Open PRs (merge in this order)

Moses re-checks each PR when its author pushes fixes. It merges when CI passes and every item in its review is done. #126 (Adolfo, dashboard foundation) merged on Oct 27.

| Order | PR | Waiting on |
|---|---|---|
| 1 | #127 Celso, Google sign-in | All review items done. Moses confirms Google sign-in on its preview (UCR account and a personal Gmail), then merges |
| 2 | #128 Celso, RLS and PIN helpers | Security fixes verified on a fresh local database. Waits on #127; then Celso merges main again (docs conflicts only), drops two stale LOG lines, and ticks #32. RLS: business updates are owner-only; business members (owner and staff) insert and update deals |
| 3 | #129 Edward, student shell and feed | Rebuild on `mocks/` and the contract; no typed-code redeem; remove files outside his area; design tokens; docs |

## Blockers

- **Hikaru (#84–85):** restricted Mapbox token still needs creation and transfer to Moses for Vercel. The preview works without tiles; actual Mapbox rendering, canvas screen 3 comparison, and HTTPS phone location testing are pending. Edward can integrate `/map` into the student shell.

- **Everyone: review your team file.** Moses edited all five on 2026-10-24 (one-time exception, like setup) for the Activity 2 changes: new tasks, interview work, dependencies, and the week plan. Fix anything that's wrong in your own file.
- **Everyone:** accept the Supabase org invite, then copy the Supabase URL and anon key into your `.env.local` (see README → Getting started). The service-role key stays with Moses.
- **Sign-in gate:** waits on #127 merging after Moses confirms sign-in on its preview.
- **Settings (done):** Vercel Authentication is off for preview deployments, so anyone with a preview link can open it. Supabase Auth on grove-dev is Google-only: Email is disabled, Google is enabled, and redirect URLs cover production, localhost, and `grove-*-mosesfromsinais-projects.vercel.app` previews.
- **RLS:** every table on grove-dev still has RLS on and no policies, so the browser reads nothing until #128 merges with its security fixes. Until then, real wrappers return nothing for signed-in users.
- **Everyone:** CI ("Lint, typecheck, build") runs on every PR and must pass to merge; it now runs `npm test` (vitest) too. Run `npm run lint && npm run typecheck && npm test && npm run build` before pushing.
- **Everyone:** import data functions from `@/lib/supabase` (not `@/mocks`). It serves mocks until `NEXT_PUBLIC_DATA_SOURCE=supabase`, which flips once #128 lands. Same names and types, so nothing else changes.
- **Gate test (#18):** `redeem` is deployed and tested on grove-dev. The one-sticker, two-phone test waits on sign-in (#127, Google enabled), RLS (#128), and the scanner on real data (#129). `redeem-pin` and `set-pin` wait on #128's PIN helpers.

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
