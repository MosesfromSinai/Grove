# Map, truck location, and PWA install

Use Node 22, `npm ci`, then `npm run dev`. Screens import `@/lib/supabase`: mocks are the default; `NEXT_PUBLIC_DATA_SOURCE=supabase` selects the authenticated wrappers. Configure Supabase as described in the root README. No service-role key belongs in the browser.

## What is implemented

- `/map`: one pin per business, orange for live public deals and green otherwise, combining Open now, Has deals, and Walking distance. Default radius is 3 km; Walking distance is 800 m in a straight line, not a route. Location is requested on tap with a UC Riverside fallback.
- Pin/list selection opens a native modal bottom sheet with business name, open/closed status, distance, and Edward’s shared deal cards. Keyboard focus is retained on marker selection; the modal handles focus and Escape.
- Dashboard food trucks get **I’m here now**. Only a successful device position is submitted; denial, unavailability, timeout, and failed saves leave the pin alone. The mock updates memory for the current browser session. The real RPC persists PostGIS location and is owner-only; staff and other owners cannot move it.
- `public/manifest.json`, 192/512 PNGs, a maskable PNG, Apple touch icon, and root metadata provide standalone install identity. The source artwork is `public/icons/grove.svg`; all PNGs are resized from that SVG. Colors match the existing Grove theme. Push and offline caching are outside this change.

## Database handoff to Moses

Review/apply `supabase/migrations/20261102000000_nearby_and_truck_location.sql` on the normal migration path, then regenerate database types. It adds:

- `deals_nearby(lat, lng, radius_m, open_now, has_deals)`: PostGIS geography radius/distance, campus-local split/overnight hours, live public deals via `deal_status()`, and exact repeating-window end timestamps. Radius must be 1–50,000 m. A `nearby_deal_card` composite return type preserves the existing RPC argument and row names. Invoker security respects column grants/RLS, and the explicit public-only join also hides link-only deals from their owners and past redeemers.
- `update_truck_location(business_id, lat, lng)`: authenticated owner-only, validated coordinates, locked business row, truck-only update, safe coordinate response. Generated lat/lng follow PostGIS location automatically.

Truck updates use the data switch; `getMyBusiness` and other dashboard writes stay mocks until Adolfo’s #73. `TruckLocation` takes `businessId` (and an optional `onMoved`) as props; the dashboard renders it only for food trucks.

## Checks and evidence

```sh
npm run lint
npm run typecheck
npm test
npm run build
# After an isolated local Supabase database has been started/reset with this migration:
npm run test:db
```

The new pgTAP file covers RLS-safe discovery, multiple deals, empty businesses, radius/filters, open hours, repeat windows, hidden deals as anon/owner/past redeemer, owner vs staff/other-owner truck updates, invalid coordinates, and discovery after a move. It runs in a transaction and rolls back. The old DB-wrapper test expecting a missing RPC now expects real rows.

Local Chrome checks on 2026-11-02 used the actual components on a temporary fixture under `/theme` with placeholder local auth configuration; the original theme route was restored and no auth bypass was committed. The fixture confirmed the bottom sheet and shared card, a synthetic truck location moving the mock pin from 373 m to 35 m after query refresh, denial leaving the pin unchanged, and a narrow viewport without horizontal overflow. Chrome parsed the manifest with zero manifest errors and reported zero installability errors; Apple title/icon links were present. Synthetic browser overrides were removed afterward.

Still pending: isolated PostGIS/pgTAP execution (Docker handoff requested), applying the migration to grove-dev, authenticated hosted truck testing, actual Mapbox rendering with #84’s restricted token, design-canvas comparison, and physical iPhone Safari/Android Chrome installation checks. Local browser/manifest checks do not establish those outcomes. #84–85, #88/#117 server validation, #94, and #119 remain open until their corresponding checks pass.
