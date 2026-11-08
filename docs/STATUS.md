# Status — Where Grove Is Right Now

The project's live memory. Read this first every session. Overwrite it (don't append) whenever the current state changes, so it always describes **now**. History goes in `LOG.md`, not here.

_Last updated: 2026-11-07 by Adolfo_

---

## Current phase

**Week 3 (Nov 2–8):** finish overdue Week 2 work before remaining features; freeze at the end of Nov 8.
**Next gate:** Staff-scan redemption; a club claims a club night and a member redeems from its link.
**Week 2 update:** Moses's Nov 4 checklist reports a successful real sticker redemption and a blocked repeat scan. #18 is still open and main's LOG has no Nov 4 result; reconcile that record with Moses. Link-only discovery checks still depend on #138.
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
| Adolfo | Stack through #114 is published (`fc404ad` on `adolfo/club-night-results`); open PRs #140/#141 carry posting/settings and earlier work. #115 implemented and locally verified on `adolfo/deal-sharing`; local commit approved, no push requested. Next #76/#78/#122. Shared/hosted/physical acceptance remains pending; live Staff scan gated on #20 |
| Hikaru | `/map` merged (#125; #86, #87 done). #85 awaits the Mapbox token (#84) and canvas check; then `deals_nearby` (#88); `deal_status()` is live |

## Open PRs

- #140 (Adolfo, open): open club-night posting with the dashboard feature stack; shared review and hosted acceptance pending.
- #141 (Adolfo, open): redemption settings with earlier dashboard work; overlaps #140's stack, so coordinate merge order before merging either.
- #138 (Hikaru, draft): truck location/PWA and `deals_nearby`; migration review/application and hosted/physical-phone checks pending.
- #139 (Edward, open): PIN backup and sticker page; not merged.


## Blockers

- **Hikaru (#84–85):** restricted Mapbox token still needs creation and transfer to Moses for Vercel. The preview works without tiles; actual Mapbox rendering, canvas screen 3 comparison, and HTTPS phone location testing are pending. Edward can integrate `/map` into the student shell.

- **Everyone: review your team file.** Moses edited all five on 2026-10-24 (one-time exception, like setup) for the Activity 2 changes: new tasks, interview work, dependencies, and the week plan. Fix anything that's wrong in your own file.
- **Everyone:** accept the Supabase org invite, then copy the Supabase URL and anon key into your `.env.local` (see README → Getting started). The service-role key stays with Moses.
- **Gate record (#18):** Nov 4 checklist reports the test passed; issue and main's LOG still need reconciliation. The feed remains dependent on #88/#138. Coordinate current Test Kitchen access/data with Moses; LOG's original deal ended Nov 4.
- **Adolfo (#73/#74):** local adapters use the shared switch for membership/profile, provisioned-business updates, posting, My deals, End now/Cancel, and the new member-checked sticker slug read; no real operation falls back to mocks. Moses's review and authorized grove-dev verification remain pending. Provisioning and Storage uploads are unsupported; unknown PIN readiness preserves existing PINs. #74 also needs the configured deployment origin, Edward's landing page (#139), and physical print/phone checks. Mode (#77) and club-night posting (#113) wrappers are now local; staff removal remains later work. Moses is unavailable; local implementation/testing proceeds without remote changes.
- **Adolfo (#75):** local overview uses a proposed member-checked exact-count/feed helper and optional Realtime connection status. Mock and simulated HTTP/WebSocket checks pass; authorized Test Kitchen counts, owner/staff/nonmember RLS, real Realtime recovery, browser/database clock agreement, and helper review remain pending. No new backend objects or remote data changes. PR CI for #140/#141 needs separate review; local checks do not verify it.
- **Adolfo (#77):** owner settings and one-time Reset PIN are implemented locally, with no automatic reset and no current PIN read. Mode writes use existing grants; live Staff scan activation is refused until #20's absent functions are ready. Mocks exercise both modes. Shared review and authorized hosted mode/RLS/Edge Function checks, old-PIN invalidation, and physical devices remain pending. No new backend objects or remote writes.
- **Adolfo (#113/#114):** posting and claimed-club/verified-visit results are implemented locally, using existing member policies and `getClubNights` with paged history and strict aggregate checks. Shared review, authorized RLS/persistence/aggregate behavior, clock consistency and downstream claim/redemption checks remain pending. Current claim SQL lacks the same-date restriction stated in the contract; Moses must reconcile it. No backend objects or remote data changed.
- **Adolfo (#115):** per-deal advertising links and QR PNGs are implemented/tested locally using existing deal reads, with no backend changes. Review, configured deployment origin, authorized hosted/link-only landing, actual phone clipboard/camera and printed-flyer acceptance remain pending. QR scanning opens `/deals/<id>`; it never redeems by itself.
- **Settings (done):** Vercel Authentication is off for preview deployments, so anyone with a preview link can open it. Supabase Auth on grove-dev is Google-only: Email is disabled, Google is enabled, and redirect URLs cover production, localhost, and `grove-*-mosesfromsinais-projects.vercel.app` previews.
- **RLS is live on grove-dev (#128).** The shared switch selects real query/function wrappers, including the local #73 business adapters; hosted acceptance and unsupported provisioning/uploads remain pending.
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
