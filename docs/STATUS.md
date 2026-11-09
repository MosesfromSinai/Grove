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
| Moses | Finishing the taken-over code issues on `moses/` branches, in order: nearby deals and truck pin (#138's work), sticker and PIN screens (#139's work), deal link through sign-in (#109), claim club night (#110), profile (#62), claim limit and location checks (#106, #38). Then the real-data switch in Vercel |
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
- **Settings (done):** Vercel Authentication is off for previews. Supabase Auth on grove-dev is Google-only, with redirect URLs for production, localhost, and `grove-*-mosesfromsinais-projects.vercel.app` previews.
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
