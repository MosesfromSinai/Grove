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

Truck updates and dashboard adapters now use the shared data switch after #73. `TruckLocation` takes `businessId` (and an optional `onMoved`) as props; the dashboard renders it only for food trucks.

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

### Week 4 renderer and install checks (2026-11-12)

```sh
npm ci
# Uses installed Google Chrome. If absent, install it locally first.
npm run test:map-browser
```

The separate Vite test server runs only on `127.0.0.1:3186`, serves the actual map/install components, and is shut down by Playwright. It never edits a Next.js route or bypasses app authentication. Mapbox requests are intercepted and fulfilled with a local blank style; the test token is an inert placeholder. No provider tile requests are sent. This fixture measures DOM marker updates and actual Mapbox GL/WebGL camera movement, not network tile performance.

Latest local desktop Chrome run at 390×844: 100 pins, 20 location/center refreshes, zero pin additions/removals, p95 frame interval 16.8 ms, maximum 16.8 ms, maximum refresh 34 ms. The automated smoke threshold is p95 below 50 ms; results vary with hardware/load and are not a phone FPS guarantee. The original main renderer failed this fixture’s keyboard-focus check when callbacks/center objects refreshed. Regression tests also cover pin cleanup, data refresh and latest callback selection. Metrics and screenshots go under ignored `test-results/map-browser/`.

The install guide lives in the student layout after page content. It is collapsed, supports Safari/iPad instructions and a one-shot browser-provided install action, retains manual steps after cancel/failure, and hides in standalone mode. Four browser tests cover renderer behavior, narrow-view instructions, install events, cancellation, failure and installed hiding. Instructions follow [Apple’s iPhone guide](https://support.apple.com/guide/iphone/iph42ab2f3a7/ios) and [Chrome’s Android guide](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&hl=en).

### Physical installation (#159, still required)

On the HTTPS PR preview, using a real iPhone Safari and Android Chrome:

1. Sign in with a permitted account; expand **Add Grove to your home screen** below the student page.
2. Follow the device instructions; check Grove’s name and sprout icon in the OS install confirmation and home screen.
3. Launch from that icon; confirm standalone navigation, correct icon/name, sign-in/session behavior and that the guide is hidden.
4. Open the map; check navigation and location allow/deny behavior. Record device, OS/browser version, preview URL, result and any defect in #159.
5. Remove only the test installation afterward if it is no longer wanted.

This session passed 210 unit tests, 4 browser checks, lint, typecheck and build. SQL tests were not rerun; Moses’s Nov 9 log records the local SQL pass. #84–85, #88–90, #94, #117 and #119 are closed on GitHub. Hosted migration notes remain inconsistent, so confirm that state with Moses. Physical phone install/relaunch, phone performance, authenticated hosted truck movement and current provider tiles are not established by the local fixture. No research results are invented.
