# Status — Where Grove Is Right Now

The project's live memory. Read this first every session. Overwrite it (don't append) whenever the current state changes, so it always describes **now**. History goes in `LOG.md`, not here.

_Last updated: 2026-11-24 by Moses_

---

## Current phase

**After Week 4 (Nov 22).** The Week 4 pilot window (Nov 9–15) has passed. Positioning is final: Grove is a campus marketing agency, one $179/month plan (club nights included) plus $0.50 per verified visit (`CLAUDE.md` → What Grove is, Business model and pitch numbers).
**Production:** https://grove-jade.vercel.app on real data (`NEXT_PUBLIC_DATA_SOURCE=supabase` since Nov 4; every PR also gets a preview link).
**Staff-scan mode and push are stretch goals** (#19, #20, #39, #40, #60, #61, #78, #91–#93, #95, #121, #122).

| Gate | State |
|---|---|
| Week 1: students log in with a school Google account | Done (Oct 27) |
| Week 2: first test redemption, one sticker and two phones; link-only deal stays out of feed and map | Done (Nov 4; link-only covered by SQL tests) |
| Week 3: a club claims a club night and a member redeems from its link | Claim, link and owner results are on production (Nov 10); a member redeeming from a club link hasn't been run end to end yet |
| Week 4: first real redemption at a business near UCR | Open: no pilot redemption is recorded in this repo |

## Done since Nov 9
Student app (feed, map, deal page, scanner, PIN backup, sticker page, club night claim, profile), business dashboard (overview, post deal with repeat days and visibility, My deals with Share links and QR, club night posting, results and cancel, stats, sticker, redemption settings, truck pin), claim cap and location range check, and the #41 security pass (below).

## Remaining work
- **Pilot:** onboard a real restaurant (#79), test the dashboard at the counter (#80), first real redemption, owner-reported fixes (#81), outreach (#82).
- **Phone checks:** security phone checks on production (#158), PWA install on Android (#159), accessibility pass (#66).
- **Demo and pitch:** demo script (#25), pitch deck (#26), competitor slide (#44).
- **Interviews:** restaurant and student interviews for everyone (#27, #46, #68, #83, #99; #104, #107, #111, #116, #118), student survey (#67), pricing questions (#98).
- **Optional:** Sentry (#22).
- **Week 3 gate:** a club member redeems from a club night link end to end on production.
- **Root route:** signed-out visitors at `/` go to `/feed` (decided 2026-11-24); ships on `moses/root-to-feed` after #168 merges.

## Open PRs
- **#163 (Hikaru, push notifications): blocked.** Stretch goal; adds a migration, the `notify-deal` function, VAPID secrets and a cron job, and needs Supabase and Vercel setup plus a team decision. Left open and untouched.
- **#166 (Moses, stats and share tweaks):** waiting for Moses's preview check.
- **#168 (Moses, design match):** waiting for Moses's preview check; merge after #166.
- **#169 (Moses, Next.js 16.4.6):** waiting for Moses's preview check; merge after #168.

## Blockers

- **Next.js 16.4.2:** `next build` reports a known security vulnerability (the build stops every other run with a notice). Fix is in #169 (16.4.2 → 16.4.6); remove this line once it merges.
- **Interview results:** none recorded in this repo; they live in the shared Drive folder. The pitch numbers in `CLAUDE.md` are estimates until interviews confirm them.
- **Settings (done):** Vercel Authentication is off for previews. `NEXT_PUBLIC_SITE_URL` is set for Production only, so previews sign in on their own domain. Supabase Auth on grove-dev is Google-only; its Redirect URLs are `https://grove-jade.vercel.app/**`, `http://localhost:3000/**`, and `https://grove-*-mosesfromsinais-projects.vercel.app/**`.
- **Everyone:** CI ("Lint, typecheck, build") runs `npm test` too. Run `npm run lint && npm run typecheck && npm test && npm run build` (Node 22) before pushing. SQL tests: `npx supabase@2.122.0 db reset && npx supabase@2.122.0 test db` with Docker running.

## Changes in teammates' areas (2026-11-22, Moses, temporary override)
- Hikaru's `docs/team/hikaru.md` #98: pricing questions updated to the $179/month plan plus $0.50 per visit.
- Adolfo's `docs/team/adolfo.md` #74 and #82: sticker copy is "Scan in Grove to redeem"; pilot offer is "first campaign free".
- Adolfo's `components/business/render-sticker.ts`: sticker text "Scan in the Grove app" → "Scan in Grove to redeem" (no download framing).
- Celso's PR #164 (`celso/public-browse`): merged main into it (STATUS conflict, kept main's) and merged it.
- Edward's PR #161 (`edward/student-states`): merged main into it and merged it. Closed #66 per his LOG.
- Edward's PR #160 (`TheEdwardVan-patch-2`, `docs/LOG.md`): removed his duplicated LOG lines, cleaned the wording of his Nov 12 line, and merged it.
- Hikaru's PR #162 (`hikaru/week4-map-polish`): merged main into it; `components/pwa/install-guide.tsx` button reads "Add to home screen" with a plus icon instead of "Install Grove" with a download icon (no-download positioning), and `tests/map-browser/map.browser.mjs` follows it; `docs/team/hikaru.md` #98 notes the final pricing for the interview guide. Merged.
- Edward's `docs/team/edward.md`: ticked finished tasks (#53, #54, #57, #58, #59, #62, #63, #64, #65, #66, #108, #109, #110) and added his open #157.
- Adolfo's `docs/team/adolfo.md`: ticked finished tasks (#73, #74, #75, #76, #77, #112, #113, #114, #115).
- Design match (`moses/design-match`, 2026-11-23): Celso's `app/(auth)/layout.tsx` and `app/(auth)/sign-in/sign-in-form.tsx` (canvas hero and sheet; tagline unchanged); Edward's `components/student/deal-card.tsx`, `feed.tsx`, `format.ts`, `scanner.tsx`, `redeemed-view.tsx`, `club-nights.tsx`, `club-night-claimed.tsx` and `app/(student)/feed/page.tsx`; Adolfo's `components/business/business-overview.tsx`, `my-deals.tsx`, `business-stats.tsx`, `business-context.tsx` and `app/(business)/dashboard/deals/page.tsx`; Hikaru's `components/map/pin-details.tsx`.

## Pilot owner setup (Moses, by hand)

No self-signup for businesses. In the grove-dev SQL editor, **before the owner's first sign-in**:

1. Create the business with your own profile as a temporary owner (`owner_id` is required):
   ```sql
   insert into businesses (owner_id, name, campus_id, location, address, hours, is_truck)
   select '<your profile id>', 'Taco Place', c.id,
     st_setsrid(st_makepoint(<lng>, <lat>), 4326)::geography, '<address>',
     '{"mon": [["11:00", "21:00"]]}', false
   from campuses c where c.email_domain = 'ucr.edu'
   returning id;
   ```
2. Invite the owner: `insert into business_members (business_id, email, role) values ('<business id>', '<owner email, lower case>', 'owner');`
3. The owner signs in with Google. `handle_new_user()` sets their role to `business` and links `user_id`.
4. Hand over ownership: `update businesses set owner_id = (select id from profiles where email = '<owner email>') where id = '<business id>';`
5. The owner opens `/dashboard` and sets the PIN; print the sticker for `/b/<qr_slug>`.

If the owner already signed in before step 2, also run `update profiles set role = 'business' where email = '<owner email>';` and set `business_members.user_id` to their profile id.

## Test data on grove-dev

The seed deals have expired. To test the feed, map, sticker page (`/b/orange-peel-tacos`), and club night claims on real data, run in the grove-dev SQL editor:

```sql
-- Live public deal at a seed business for the next 4 hours
insert into deals (business_id, title, description, discount_type, discount_value, students_only, starts_at, ends_at)
select id, '[test] $2 off any taco', 'Test deal', 'amount_off', 2, true, now(), now() + interval '4 hours'
from businesses where qr_slug = 'orange-peel-tacos' returning id;

-- Open club night tomorrow, 6–9 PM
insert into club_nights (business_id, night_date, start_time, end_time, giveback)
select id, (now() at time zone 'America/Los_Angeles')::date + 1, '18:00', '21:00', '[test] 15% back to your club'
from businesses where qr_slug = 'orange-peel-tacos' returning id;

-- Clean up when done (redemptions first; also removes a claimed night's link-only deal)
delete from redemptions where deal_id in (select id from deals where title like '[test]%'
  union select deal_id from club_nights where giveback like '[test]%');
with n as (delete from club_nights where giveback like '[test]%' returning deal_id)
delete from deals where title like '[test]%' or id in (select deal_id from n);
```

Redeeming by sticker needs you within 150 m of the business (seed coordinates are near UCR). The PIN backup needs a PIN set for that business first. Re-running `supabase/seed.sql` also refreshes the seed deals, but fails once real redemptions exist on them.

## Security test results
**2026-11-09, Moses (#41).** Fresh local `db reset`, then `npm run test:db` (7 pgTAP files, 137 checks; 22 served-function tests) and `npm test` (118 passed). Staff-scan cases are skipped (stretch). Celso's Security test log isn't edited; these rows are the #41 results.

| Check | How | Result |
|---|---|---|
| Browser can't insert into `redemptions` | `rls_security.test.sql`; only security-definer functions insert | Pass |
| `staff_pin`, `claimed_by` (and `owner_id`, `student_location`) never reach the browser | `rls_security.test.sql` column-grant checks | Pass |
| Link-only deals stay out of `deals_nearby` and the sticker page | `nearby_and_truck_location.test.sql` (even for the owner); `deals_read_public` RLS; `getBusinessBySlug` filters public | Pass |
| Service role key not in client bundles | Built `.next/static` (39 files): no `service_role`, no `SUPABASE_SERVICE_ROLE_KEY`, no key value; only JWT is the anon key | Pass |
| Once per day | `redeem.test.sql`, `redeem.db.test.ts` (`ALREADY_REDEEMED_TODAY`) | Pass |
| PIN lockout (5 bad PINs, per student per business) | `rls_security.test.sql` | Pass |
| Redeem rate limit (10 attempts a minute) | `rls_security.test.sql` (counts attempts, not successes) | Pass |
| Club night claim cap (3 per 7 days) | `claim_club_night.test.sql` | Pass |
| Out-of-range location is `INVALID_LOCATION` | `redeem.test.sql`, `redeem.db.test.ts` | Pass |
| `grove_next` can't open-redirect | `lib/auth/next-path.test.ts` (`//`, `/\`, schemes, control characters, `/auth/*` rejected); callback redirects only to a same-site path | Pass |
| One business can't read or change another's deals, redemptions, club nights or pin | New `cross_business.test.sql` (12 checks, Orange Peel's owner against Pepper Tree) | Pass |
| No keys in the repo or its git history (#43, Celso, 2026-11-22) | gitleaks on all 336 commits (every branch, merge diffs included); working-tree hits are only git-ignored local files | Pass |
| Signed-out visitors read only public data (#156, Celso, 2026-11-22) | `anon_browse.test.sql` (22 checks): no redemptions, profiles, members, club nights or attempts; no link-only deals in discovery; no writes; no redeem or claim functions | Pass |

**Phone checks on production (manual):**
1. Screenshot a Redeemed screen and show it later: the live clock and animation give it away.
2. Scan a photo of the Orange Peel sticker from far away: `TOO_FAR`.
3. Deny location and tap Redeem: the location message and the PIN link show.
4. Scan a `/deals/<id>` QR with the phone camera: it opens the deal only, no green screen.
5. Sign out, press Back: no profile or redemption data shows.
6. Sign in with a non-UCR Google account and try to redeem: `NOT_VERIFIED_STUDENT`.

## Open decisions

| Decision | Owner | Needed by |
|---|---|---|
| Demo date | Team | Next sync |
| Final name ("Grove" may be trademarked) | Team | Before slides are final |
| Which clubs and fraternities to pursue; none confirmed (paid student ambassadors at new campuses from Year 2 are decided) | Team | Before club night outreach |

## Business status

- **Pricing (decided 2026-11-22):** one $179/month plan for 9 school months, club nights included, plus $0.50 per verified visit; first campaign free for pilot restaurants. Interviews still test it (#98).
- Interviews (five hypotheses, see `CLAUDE.md` → Business): individual results aren't recorded in this repo; notes live in the shared Drive folder.
- Lean Canvas: Hikaru closed #97 on Nov 12 after reviewing the completed Activity 2 canvas.
- Pilot businesses signed: none recorded in this repo. Offer: first campaign free.
- **Financial model (2026-11-24):** Financial Modeling of Grove in the Team-01-Grove Drive folder. Founders unpaid until Year 3; 3 paid student ambassadors per new campus from Year 2; 25 Staples flyers per restaurant per monthly campaign; Year 1 costs about $2.8K. Numbers are projections.
- Pitch deck says "8 of 10 restaurants we interviewed": confirm against the interview notes in Drive before presenting.
- Effort table: Celso's attendance cell (#47) is still open.
