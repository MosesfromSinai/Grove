# Status — Where Grove Is Right Now

The project's live memory. Read this first every session. Overwrite it (don't append) whenever the current state changes, so it always describes **now**. History goes in `LOG.md`, not here.

_Last updated: 2026-11-09 by Moses_

---

## Current phase

**Phase 4: Finish and pilot** (week 4 of 4, Nov 9–15). The feature freeze passed on Nov 8; Moses is finishing the open Week 2–3 code issues (see `LOG.md` → Team, 2026-11-09), then pilot, phone testing, and demo prep.
**Week 2 gate passed (2026-11-04):** first test redemption with one sticker and two phones (#18).
**Next gates:** a link-only deal stays out of the feed and map (needs `deals_nearby` on grove-dev); a club claims a club night and a member redeems from its link; first real redemption at a business near UCR.
**Production:** https://grove-jade.vercel.app (every PR also gets a preview link).

Scope, direction, and the full week plan with gates: `CLAUDE.md` → What Grove is, MVP scope, Week plan. **Staff-scan mode is now a stretch goal** (#19, #20, #39, #40, #60, #61, #121, #78, #122).

## This week's focus

| Person | Focus |
|---|---|
| Moses | Finishing the taken-over code issues on `moses/` branches, in order: nearby deals and truck pin (#138's work), sticker and PIN screens (#139's work), deal link through sign-in (#109), claim club night (#110), profile (#62), claim limit and location checks (#106, #38), all merged. Security pass recorded below (#41). The real-data switch has been live in Vercel since Nov 4 (`NEXT_PUBLIC_DATA_SOURCE=supabase`) |
| Celso | Business: competitor analysis (#45), interviews (#46, #107), attendance cell (#47). Security test pass (#41) once the screens are merged |
| Edward | Business: student survey (#67), interviews (#68, #111) |
| Adolfo | Dashboard branches (his own). Place `<TruckLocation businessId={…} />` on the dashboard for trucks to finish #94 |
| Hikaru | Business: Lean Canvas (#97), pricing (#98), interviews (#99, #118). Mapbox token (#84) to Moses by one-time link |

## Open PRs (merge in this order)

One `moses/` branch at a time; each merges when CI passes.

## Blockers

- **Real data:** `20261102000000_nearby_and_truck_location.sql` passes all SQL tests locally but isn't applied to grove-dev yet (Moses). The feed and map stay empty on real data until it is. Then set `NEXT_PUBLIC_DATA_SOURCE=supabase` in Vercel.
- **Mapbox (#84):** the restricted token still needs to reach Moses for Vercel; without it the map shows the labeled pin preview, no tiles.
- **Test data:** delete Grove Test Kitchen (ids starting `7e57`) from grove-dev before the switch; it would show as a pin near campus.
- **Settings (done):** Vercel Authentication is off for previews. `NEXT_PUBLIC_SITE_URL` is set for Production only, so previews sign in on their own domain. Supabase Auth on grove-dev is Google-only; its Redirect URLs are `https://grove-jade.vercel.app/**`, `http://localhost:3000/**`, and `https://grove-*-mosesfromsinais-projects.vercel.app/**`.
- **Everyone:** CI ("Lint, typecheck, build") runs `npm test` too. Run `npm run lint && npm run typecheck && npm test && npm run build` (Node 22) before pushing. SQL tests: `npx supabase@2.122.0 db reset && npx supabase@2.122.0 test db` with Docker running.

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
| Pricing: per verified visit (~$0.50–1, monthly cap) plus a flat fee for club nights; first deal free for pilots. Still to be validated | Hikaru (with everyone's interviews) | Before the pitch deck |
| MVP demo date (week dates assume a demo around Nov 16–20; re-date the plan once it's set) | Team | Next sync |
| Final name ("Grove" may be trademarked) | Team | Before slides are final |
| Which campus channels to pursue (clubs, fraternities, student ambassadors); none confirmed | Team | Before club night outreach |

## Business status

- Interviews (five hypotheses, see `CLAUDE.md` → Business): **0 done so far.**
- Lean Canvas: Problem, Solution, UVP, Customer Segments filled. Key Metrics, Unfair Advantage, Channels, Cost Structure, Revenue Streams, and Project Name still blank.
- Pilot businesses signed: **0.** Offer: first deal free. Target: at least one signed by Nov 6 for the Week 4 pilot.
- Effort table: Celso's attendance cell is blank.
