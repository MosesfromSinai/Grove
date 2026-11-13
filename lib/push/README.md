# Grove push notifications

Local implementation for #91–93; physical delivery remains #95. This branch is independent of PR #162. The install guide in #162 is helpful on iPhone, but the push settings also explain the Home Screen requirement themselves.

Both rollout switches default off. No production keys are generated, migration applied remotely, schedule installed, or real notification sent by this work. Profile controls, service worker, subscription RPCs and dispatcher are ready for Moses/Celso review.

## Behavior and limits

- `/profile` shows the controls only with `NEXT_PUBLIC_PUSH_ENABLED=true`, a public VAPID key, real data mode and a verified student profile. Nothing requests notification or location permission on page load. The service worker can register without requesting either permission.
- Set alert area asks for location on tap, rounds it to 0.001 degrees (about 100 m), and keeps it only in memory until Enable alerts saves it. Denial never substitutes campus center. The saved area expires after seven days; dispatch removes expired rows. There is no background tracking.
- Enable alerts requests notification permission directly from the tap, creates/reuses a browser subscription, then saves through the data boundary. A rejected/uncertain new save attempts browser rollback. If a subscription may remain, the UI shows unknown status with Turn off recovery instead of claiming Off.
- Turn off and every shared `signOut()` revoke server preference and/or unsubscribe the browser. A shared lock prevents enable/sign-out races. If neither revocation path succeeds, the failure is surfaced rather than claiming success. Already accepted provider messages cannot be recalled.
- Public live deals from the student’s campus within 3 km of the saved area qualify. Link-only deals never qualify. Campus-local repeat windows are deduplicated separately. Consent, verification, current area and public/live status are checked again immediately before sending.
- One attempt per deal/live window/subscription, at most three attempts per continuous saved subscription in a rolling 24 hours. **Turning alerts off deletes that subscription’s delivery history; re-enabling creates a new setup and allowance.** This prioritizes removal of preferences over tracking a device after opt-out. Moses should review this proposed policy before enabling push.
- A batch claims up to 50 deliveries before sending, with four provider requests at a time. Claimed/failed/uncertain attempts are not retried automatically: this avoids duplicate notifications but can miss an alert if a worker crashes. Claims older than 30 days are removed during dispatch. The minute schedule picks up new, scheduled and repeating live windows while they remain live.
- TTL is at most one hour and never beyond the claimed live window. 404/410 removes expired subscriptions; other provider errors are recorded without logging endpoints, keys or response bodies. The worker’s network destinations are restricted to FCM, Mozilla and Apple push hosts, with no user-selected URL, port, credentials or fragment.
- `sw.js` only handles push and clicks. It caches no pages, auth responses or locations. Click paths are restricted to same-origin `/deals/<uuid>` or `/map`.

## What Moses needs to do

1. **Review and apply the backend change.** Review the radius/expiry/rate policy above, migration `20261112000000_push_notifications.sql`, RPCs and Edge Function. Celso should review auth, private table grants and endpoint restrictions. Run the normal fresh local Supabase reset/DB tests, then apply the migration to grove-dev through the normal migration workflow and regenerate `lib/supabase/database.types.ts`. The local SQL checks described below do not exercise Supabase Auth HTTP or the hosted Edge gateway.
2. **Create the matching key pair once.** From the repo root on Node 22, run `node scripts/generate-push-keys.mjs`. It writes only ignored `.env.local` with mode 0600, preserves other settings and refuses to replace existing push keys. It prints no values. Do not run it again on a configured installation or rotate one side independently; existing subscriptions must be recreated when the public key changes.
3. **Configure Supabase Function secrets securely.** Copy `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `PUSH_DISPATCH_SECRET` and `PUSH_SEND_ENABLED=false` from `.env.local` into the Supabase secrets UI. Public/private VAPID keys are the same pair generated in step 2. Keep the dispatcher secret server-only. Do not put private values in GitHub, chat, logs, or any `NEXT_PUBLIC_*` variable.
4. **Deploy `notify-deal`.** Use the normal function deployment workflow, e.g. `npx supabase functions deploy notify-deal`. Its config disables the gateway JWT check because the function verifies an owner JWT for one owned deal, or the separate dispatcher secret for scheduled batches. Anonymous and student callers cannot dispatch. The sender also requires all secrets and `PUSH_SEND_ENABLED=true`; keep it false through setup. Redeploy after changing sender flags/secrets so workers use the new configuration.
5. **Enable a test preview.** In Vercel Preview env, set `NEXT_PUBLIC_DATA_SOURCE=supabase`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to the matching public key, and `NEXT_PUBLIC_PUSH_ENABLED=true`, then redeploy. No private VAPID/dispatcher key belongs in Vercel’s public build variables. Use a signed-in verified test student on HTTPS; confirm `/sw.js` is public, registers at `/`, and is served with no-cache/no-store. Complete opt-in only on agreed test devices.
6. **Set up the server schedule.** Enable `pg_cron` and `pg_net` in grove-dev. In Vault create `grove_push_function_url` (the deployed HTTPS `.../functions/v1/notify-deal` URL) and `grove_push_dispatch_secret` (same value as step 3). Review/apply `supabase/push_schedule.sql` separately; it installs one idempotent minute job and reads credentials from Vault at execution. This script was not installed locally or remotely. When test recipients are ready, set the sender flag true and redeploy the function. A direct owner call with `{ "deal_id": "<owned-public-live-deal>" }` can dispatch that deal; only the private scheduled caller may send an empty body for a batch. No browser receives the schedule secret.
7. **Run #95 and finish #159.** On an installed iPhone/iPad (16.4+) and installed Android, opt in, put the app in the background, create a public deal within the saved area and observe actual arrival and safe navigation. Test scheduled/repeating windows, hidden deal exclusion, area expiry, cap/dedup, revoked permission, unsubscribe and sign-out. Record device/OS/browser/preview URL and actual results. The existing iPhone installation report is not evidence of push delivery; Android install testing is still pending.
8. **Rollback if needed.** Pause `grove-push-live-deals` with `cron.unschedule`, set `PUSH_SEND_ENABLED=false` and redeploy the function. Hiding the frontend alone does not stop existing subscriptions. Do not drop existing app tables or change another project’s resources.

## Local verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
# Full local Supabase environment, when available:
npm run test:db
# Inside the function directory (Deno 2):
deno check index.ts
deno run --allow-env offline_check.ts
```

`offline_check.ts` generates throwaway keys in memory and signs/encrypts a synthetic Web Push request using pinned `web-push@4.0.0`. It has **no network permission**, sends nothing and prints no key values. `deno.lock` pins dependencies. It also catches module-export/runtime compatibility issues that static type checking alone can miss.

All 242 unit tests pass (23 service/DB tests are skipped without the full Supabase stack), along with lint, typecheck and production build. Unit tests cover flags, explicit opt-in, denied location/notification, saved-area rounding, rejected/uncertain saves, rollback and unknown-state recovery, both sign-out race orders, private endpoint rejection, subscription RPCs/mocks, one-shot key generation, worker auth/disabled behavior, provider failures, expired endpoints and safe worker click paths. UI simulation is not OS delivery proof.

With explicit user permission, an isolated PostgreSQL 17/PostGIS/pgTAP container was created with a 512 MB/1 CPU limit and no published port. Its network was disconnected after package setup. A minimal Supabase-compatible auth schema/default grants allowed all migrations and the seed to run. All eight SQL suites pass (180 checks, including 43 push checks). This proves those SQL paths in PostgreSQL; it is not a full Supabase service/hosted test. Only this Grove container is removed after verification; Nanka resources are untouched.

Relevant platform references: [PushManager opt-in](https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe), [WebKit Home Screen Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/), [Supabase scheduled Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions), [web-push](https://github.com/web-push-libs/web-push).


Chrome verification used the real component on a temporary public `/theme` fixture with dummy loopback Supabase configuration. The original route was restored before the final build. Native `/sw.js` registration at `/` and no-cache headers passed without requesting permission. A separate mocked-browser/API fixture verified explicit permission/location calls, rounded inputs, opt-out, denied-location no-op, uncertain-save recovery, iPhone install instructions and no overflow at 320/390/1280 px; no provider message was sent. The preview server was stopped and the authorized Grove test container/anonymous volumes were removed; Nanka was untouched.
