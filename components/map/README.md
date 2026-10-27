# Week 1 map preview

Open `/map` after `npm install` and `npm run dev` with Node 22. No Supabase keys are needed for this sprint: the page uses `getDealsNearby` from `mocks/`, matching the API contract.

Set `NEXT_PUBLIC_MAPBOX_TOKEN` in git-ignored `.env.local` and restart the dev server to load Mapbox streets. Without a token, or if the map fails, a labeled coordinate pin preview and the complete business list remain usable. The preview is approximate and provides no walking directions. Token creation, allowed domains, and Vercel configuration are still #84's handoff to Moses; don't commit a token or paste it into an issue.

## Behavior

- One pin per business, even with several live deals. Orange means at least one live public deal; green means no live public deal. Existing mocks exclude link-only deals.
- All three filters combine. Open now and Has deals use the query parameters; Walking distance changes the radius from 3,000 m to 800 m. Distance is measured in a straight line from campus center or the accepted device location.
- Location is requested only from **Use my location**. Denial, unavailability, and timeout return to UC Riverside. **Back to campus** resets the origin. No location is saved.
- Pin and list selections share a highlight. Edward's shared deal card and the bottom sheet belong to #90 in Week 2; the student tabs belong to Edward's shell.
- Mapbox stays client-side, markers and the map are removed on cleanup, and superseded query/location results are ignored.
- Styles use the `grove-map-` prefix because the scaffold's `*.css` Turbopack loader emits these styles as global CSS. No shared theme or root routing changes are needed.

## Verification

Run the required checks on Node 22:

```sh
npm run lint
npm run typecheck
npm run build
npm test
```

Local browser checks on 2026-10-25:

1. Campus origin shows eight businesses, with Orange Peel Tacos represented by one pin and two public deals.
2. Open now shows seven spots. Adding Has deals shows five. Adding Walking distance shows three. Removing filters restores the matching pins and list rows.
3. Synthetic geolocation responses verify success, permission denial, unavailable position, and timeout. Every failure returns to campus; a granted location far from campus shows an empty state; Back to campus restores eight spots. Browser overrides were removed after testing.
4. The 390×844 mobile viewport has no horizontal overflow. Controls have 44 px touch targets and names, filter and selection state are exposed with `aria-pressed`, and the business list provides an alternative to map pins.
5. Node 22 lint, type checking, production build, and the data, Mapbox-component, and location tests pass. A separate browser tab on the local production-build server verifies the eight default spots and renders without console warnings or errors; local production-build filter interactions also reduce the list to five and three spots.

Still pending: actual Mapbox rendering with the restricted token, exact comparison to the linked design canvas (unavailable during this session), and physical iPhone Safari/Android Chrome testing over HTTPS. The real database query and pin bottom sheet are Week 2 work.

Automated component tests use a mocked Mapbox module; they verify marker focus, marker/map cleanup, map errors, initialization failure, and load timeout without a token or external API requests. Location tests cover granted/denied/unavailable/timeout outcomes and stale callbacks after newer requests or a campus reset. `npm test` runs Vitest; the required CI job now includes it. These tests do not establish real Mapbox tiles or physical-phone behavior.
