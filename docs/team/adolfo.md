# Adolfo Magallanes — Business Dashboard

> Session rules: `CLAUDE.md` → Session protocol. Your next Claude session starts from this file, so keep it current.

_Last updated: 2026-11-06_

---

## Role
- **Engineering:** everything a business owner or staff member sees: onboarding, deal posting, deal list, stats, sticker download, redemption settings, staff scanner, staff list, club nights, deal link and QR.
- **Business:** pilot outreach (sign 2–3 businesses near UCR); 1–2 restaurant interviews and at least one student interview.
- **Design:** screens 10–14 (Overview, Post a deal, My deals, Stats, QR sticker & PIN) on the [design canvas](https://claude.ai/artifact/9gApUhQQWpkU2FWTU27K1d). The staff scanner, redemption mode selector, staff list, post-club-night form, and repeat-days controls aren't drawn yet; build them in the same style. Tokens are in `CLAUDE.md` → Design reference.

## Owns
`app/(business)/`, `components/business/`.

## Depends on
- **Moses:** #126/#127/#128/#131/#135/#137 are merged; RLS, `set-pin`, and Realtime are live. Local #73 adapters now follow the shared switch, with contract/type changes proposed for review. Business provisioning and Storage remain unsupported; PIN readiness is unknown on real data and onboarding preserves existing PINs. Authorized Grove Test Kitchen membership/current test data and a real-database pass are pending; Moses is unavailable, so local work proceeds independently.
- **Celso:** auth routing is merged and the sign-in gate passed. Business updates are owner-only; members can manage deals. Browser profile edits may change only `full_name`, never role or verification. Use provisioned membership; do not self-assign roles.
- **Edward:** the deal page at `/deals/<id>`, which your deal link and QR open. (The theme is done; see `/theme`.)
- **Hikaru:** draft #138 contains the truck-location component and `deals_nearby`; neither is on main yet. Coordinate the dashboard placement after merge.
- **Sticker (#74):** SQL already permits reading `qr_slug`; the local `getBusinessSticker` helper checks membership and returns it separately from `BusinessPublic`. Moses's helper/contract review, authorized grove-dev verification, configured deployment origin, and Edward's `/b/[slug]` page (#139) remain acceptance needs.

## Others depend on you
- **Everyone:** real businesses for the week-4 pilot.

---

## Tasks

### Week 1 — Foundation (Oct 19–25)
- [x] Dashboard layout (desktop sidebar, phone and tablet friendly) (#69) — canvas compared and responsive/keyboard checks passed; pushed on `adolfo/dashboard-review`, PR/merge pending
- [x] Business onboarding: name, address (sets `location`), hours, logo upload, food-truck toggle; first PIN via `setPin()` (#70) — reviewed and tested on mocks
- [x] Post-deal form: title, description, discount, start/end, photo, "UCR students only" (#71) — canvas compared; mock posting and responsive/keyboard checks passed; pushed on `adolfo/dashboard-review`, PR/merge pending
- [x] My deals list: active, scheduled, expired, with redemption counts; End now and Cancel (mocks) (#72) — implemented on mocks

### Week 2 — Live data, stickers, repeat days (Oct 26–Nov 1)
- [ ] Wire onboarding, posting, and My deals to real tables (#73) — supported adapters implemented/tested locally; authorized real-database verification, provisioning/Storage, and review remain pending
- [ ] Repeat days and visibility on the post-deal form: day checkboxes, daily start/end time, public or link-only (while wiring it to real tables) (#112) — controls, normalized mocks/real payloads, and local behavior verified; contract review and hosted acceptance pending
- [ ] Printable sticker: configured origin + `/b/<qr_slug>`, Grove branding, "Scan in the Grove app to redeem," downloadable PNG (#74) — local 3/4/6-inch export/decoding verified; shared review, hosted read, and physical print/phone acceptance pending
- [ ] Overview page: today's and this week's redemptions, active deals, live visit feed via Realtime (#75) — implemented/tested locally; review and authorized hosted RLS/Realtime acceptance pending

### Week 3 — Stats, settings, staff scanner, club nights (Nov 2–8)
- [ ] Stats: redemptions per deal and busiest hours (Recharts) (#76)
- [ ] Redemption settings: Sticker vs. Staff scan selector; Reset PIN calls `set-pin` and shows the new PIN once (#77)
- [ ] Staff scanner: camera via `html5-qrcode`, calls `staff-redeem`, green "Verified" or red "Not valid" with reason, "Scan next" (#78)
- [ ] Post an open club night: date, time window, giveback text (e.g. "15% back to your club") (#113)
- [ ] Club night results on the dashboard: claimed club name and verified visits per night (#114)
- [ ] Deal link and QR download for flyers and group chats (`/deals/<id>`; it opens the deal only, never redeems) (#115)
- [ ] Staff list in settings: add staff by Google email (`add-staff`), see invited vs. active (`getStaff`), remove staff (#122)

_Feature freeze Nov 8 (see `CLAUDE.md` → Week plan)._

### Week 4 — Pilot, no new features (Nov 9–15)
- [ ] Onboard pilot businesses in person; print and place stickers (#79)
- [ ] Test the dashboard on a phone and a tablet at the counter (#80)
- [ ] Fix or file every issue owners report during the pilot (#81)

### Business
- [ ] Pilot outreach: contact local businesses near UCR, track in the shared Drive folder, aim for 2–3 signed, at least one by Nov 6 for the Week 4 pilot; first deal free for pilot restaurants (#82)
- [ ] 1–2 restaurant interviews (hypotheses 1–4, see `CLAUDE.md` → Business); notes in the shared Drive folder (#83)
- [ ] At least one student interview (hypothesis 5, see `CLAUDE.md` → Business); notes in the shared Drive folder (#116)

---

## Notes and session log

### 2026-11-06
- **#75 Commit approval:** Adolfo approved the local overview commit after review; #75 hosted/shared acceptance remains pending. Keep the commit local and continue to #77 on its own feature branch.
- **Publication:** Adolfo authorized pushing the completed work. Fetched origin; main remains `7daf9ed`, with no integration changes needed. Pushed `adolfo/dashboard-review` (`18701ce`), `adolfo/dashboard-data` (`8db37e6`), and `adolfo/counter-sticker` (`7eb0be6`, `#74 Add printable counter sticker`); no PR or merge. Sticker commit's Vercel status succeeded. GitHub Actions has no run for that commit: CI triggers on PRs or pushes to main, so PR CI remains pending. Tools/screenshots stay outside Grove.
- **#75 Did:** Started `adolfo/overview` from current main plus the preserved feature stack. Added member-checked `getBusinessOverview` with exact HEAD counts since campus midnight/Monday and a bounded newest-eight feed, plus optional subscription connection states and late-callback cleanup. The dashboard computes live deals with shared schedule rules, re-reads on events/reconnect/tab return, and polls each minute. Events arriving during a read queue another read; duplicate deliveries never increment totals. Stale/error/retry, revoked membership, zero/empty, and loading states are explicit. No PIN/backend writes.
- **#75 Verification/review:** Lint, typecheck, 102 tests (21 DB skipped), production build, mock browser checks, and actual Supabase-client checks against simulated HTTP/WebSocket passed. Tested exact count request semantics above 1,000 visits; campus DST/Monday/year boundaries; Tokyo device timezone; duplicate INSERT delivery; real client channel rejoin and missed-visit recovery; network/stale/retry/access/empty states; cleanup; keyboard refresh; five widths and six WCAG A/AA scans. Compared canvas screen 10 and inspected desktop/tablet/phone screenshots. Local review: isolated mock window at `http://127.0.0.1:3001/dashboard`; check totals, live deal windows and latest visits, then Refresh overview. Canvas's invented owner greeting, growth, and per-deal daily counts are omitted; names/counts come from available data. Hosted Test Kitchen counts/RLS/Realtime, clock consistency, shared helper review and physical devices remain pending. Stop before committing/pushing #75 for review. Next: #77 settings and Reset PIN.
- **#74 Did:** Started `adolfo/counter-sticker` from updated main plus the preserved local commits (`8db37e6` stack); main/PRs/issues unchanged. Added a membership-checked sticker read, matching mock/type/contract, and `qrcode`/TypeScript dependencies. Implemented the settings sticker preview and 3/4/6-inch, 300-DPI PNG downloads using existing theme/fonts and the configured app origin. Missing membership/slug/configuration, load errors, image failures, retry, stale renders, and object-URL cleanup are handled. No PIN or backend writes.
- **#74 Design/review:** Compared canvas screen 14 in Edge: green branding, warm preview surface, 4-inch default, dark selected-size pill, green download action, and print guidance. PNG is an issue-accepted format; the canvas's PDF label is adapted accordingly. Export is square at the chosen physical dimensions, uses the real encoded QR without a center overlay, and marks mock images DEMO. Local preview: `http://127.0.0.1:3001/dashboard/settings`; choose sizes, download, inspect the URL and print at 100%. Hosted reads, deployed landing route/origin, physical paper dimensions, and real-phone scan/redemption remain pending. Adolfo approved the local commit; push remains deferred. Next: #75 overview.
- **#74 Checks:** Lint, typecheck, `npm test` (92 passed; 21 DB tests skipped), and `npm run build` passed. Both mock and real-adapter HTTP-fixture browser runs downloaded all three sizes; independent QR decoding, PNG CRC checks, pixel dimensions, and 300-DPI metadata passed. Five widths (320–1440px), keyboard sizes, six WCAG A/AA scans, missing/network/permission/retry states, and no PIN calls verified. Inspected exported PNG and desktop/tablet/phone screenshots. HTTP fixture tests are not a database/RLS pass; test images/decoders remain outside Grove.
- **Commit style:** Future commit messages begin with the issue number, e.g. `#74 Add printable counter sticker`; keep simple present tense, fewer than 10 words, preferably under 50 characters, with no attribution trailers. Earlier commits remain unchanged.
- **#73/#112 Did:** Started `adolfo/dashboard-data` from unchanged updated main plus the local UI commit `18701ce` (retained on `adolfo/dashboard-review`); no push. Added membership-based profile/deal reads and real business/deal writes behind the shared switch, with no mock fallback. Added repeat weekdays, daily windows, optional end, and public/link-only controls. Real onboarding edits provisioned businesses; staff cannot edit business details. Missing membership and permission/network failures have explicit states.
- **#73/#112 Limits:** No business creation or owner-membership provisioning; no Storage bucket/policies/upload support. Real deals post without photos; logos may be retained/removed. `pin_ready: null` means unknown and never triggers `setPin`. Multiple memberships require coordinator resolution. Cancel is restricted to a future first start; started repeats use End now. UTC write timestamps come from the browser; database clock/race behavior still needs verification. These contract/type/mock changes require Moses's review.
- **#73/#112 Verification:** Lint, typecheck, 83 local tests (21 DB tests skipped), and a clean `npm run build` passed. Real adapters were tested with simulated responses and the actual Supabase client against a loopback HTTP fixture, not a database/RLS pass. Mock/HTTP browser checks covered repeat/link-only save, My deals/reload, PIN preservation, staff/no-membership/error/retry states, Tokyo-device scheduling, five widths, and 12 WCAG scans including the one-time form. Desktop/tablet/phone screenshots inspected. Docker daemon unavailable. An initial Turbopack cache panic cleared after moving generated cache outside Grove; no build-config change was needed.
- **#73/#112 Local review:** Use the isolated Edge mock preview at `http://127.0.0.1:3001/dashboard/deals/new`; choose repeat days, a daily window, optional end, and Link only, then inspect Scheduled in My deals. Real-adapter HTTP fixture checks use port 3002 and preserve fixture data across reload; they are not grove-dev. Tools, fixtures, and screenshots stay outside the repo. Adolfo approved this local commit; push remains deferred.
- **#73/#112 Access later:** Moses must coordinate current Test Kitchen business/membership and local credentials through the normal secure setup; then verify owner/staff/nonmember RLS, persisted geography/schedules/counts, End now/Cancel/FK races, and unchanged existing PINs. Provisioning, Storage, and safe PIN-readiness support remain backend needs. Do not deploy migrations/functions or push without authorization. Next local feature: #74, printable counter sticker.
- **Did:** Fast-forwarded clean main to `7daf9ed`; created `adolfo/dashboard-review`, preserving the foundation branch. Read Moses's Nov 4 checklist (general instructions, pp. 5–7), current issues/comments, PRs, and contract. Canvas loaded in Edge. Aligned shell branding/navigation/guidance and screen 11's title counter, discount radios, split schedule, photo browse/drop area, UCR switch, primary action, and preview with existing tokens/components.
- **Verified:** `npm run lint`, `npm run typecheck`, `npm test` (66 passed, 21 DB tests skipped), and `npm run build` passed. Mock browser checks at 320/390/768/1024/1440px; six WCAG A/AA scans; keyboard skip/radios/switch; title limit; photo preview; mock posting and My deals. Inspected desktop/tablet/phone screenshots. Five component regressions cover campus scheduling, invalid-window focus, discounts, failed saves, and preview state. Tests use loopback auth and mocks, not grove-dev; physical devices/hosted integration remain untested.
- **Intentional canvas differences:** keep demo wording and Business setup navigation; no invented owner name, distance, sample photo, or live countdown. Preview shows the selected schedule/duration. Push alerts remain stretch; all redemptions require verified students. Existing WebP/5 MB validation and campus DST rejection remain. Overview totals/feed remain #75, outside this shell check.
- **Shared review:** Moses should review the root `lib/supabase/index.ts` re-export of existing business adapters. Components now use `@/lib/supabase`; writes/profile lookup are still mock-backed. No API shape, mock, migration, policy, or function changes.
- **Next:** Adolfo authorized this local commit; defer pushing until larger chunks are ready. Keep feature checkpoints and branches scoped. Next is #73/#112 together, then #74, #75; Week 3: #77, #113, #114, #115, #76 (#21), #78 (#20), #122 (#121). Recheck dependencies; fetch/merge main and verify checks/CI when publication is authorized.
- **Local files:** keep downloaded tools and review artifacts outside Grove when possible. Use existing ignores or narrow `.git/info/exclude` patterns locally; propose targeted team-wide `.gitignore` changes for review. Before each commit inspect `git status --short` and `git diff --cached --name-only`, stage explicit intended paths, and flag tracked local artifacts before removing them from version control.
- **Integration needs:** provisioned owner membership, authorized Test Kitchen access, Storage buckets/policies/uploads, and real-database verification of the local business adapters. `getBusinessSticker` now provides `qr_slug` separately (#74), pending review/hosted verification. SQL permits owner redemption-mode changes, member club-night writes, and owner deletion of staff, but those dashboard wrappers are later work. #20/#21/#121 remain open. LOG's original Test Kitchen deal ended Nov 4; coordinate current test data with Moses. Do not deploy migrations/functions or send keys in chat.

### 2026-10-26
- **Did:** Implemented Sprint 1's mock dashboard, post-deal form, My deals, and business setup (#69-72, PR #126). Prepared review cleanup, 21 isolated tests via `npm test`, and reuse of main's shared `openNow` from merged #131. Lint, typecheck, build, responsive layouts at 320-1440px, posting/onboarding behavioral checks, and WCAG A/AA scans passed. Fresh screenshots were inspected; no source check failures remain.
- **Next:** Merge `origin/main` only after #127 merges, preserving teammates' docs, main's `.gitignore`, and main's contract/types/mocks plus required business writes. Then validate the integrated branch before #73/#112.
- **Blockers/limitations:** #127 remains open; main has not been merged. Canvas access failed, so #69/#71 visual acceptance remains pending. Mocks reset on reload; sample-address lookup supplies coordinates, arbitrary addresses require manual coordinates. Real auth/provisioning, geocoding, Storage, and PIN integration remain #73. Overview metrics (#75), stats, and sticker/PIN settings remain placeholders.
- **Review:** Local preview: `http://127.0.0.1:3001/dashboard`; start with `npm run build` then `npm run start -- --hostname 127.0.0.1 --port 3001`. Check responsive navigation, posting/validation, End now/Cancel confirmations and counts, profile propagation, and one-time PIN visibility. Never record PIN values.
- **Workflow:** Stop before commits or pushes for review. Commit messages use 3-7 lowercase words, simple wording, and no co-author trailer. Keep logs technical and concise.
- **Sanity check:** Ignore rules cover credentials/local state, dependencies, builds, test reports, and Windows metadata; source tests, configuration, and `.env.example` remain trackable. Documentation retains pending canvas/integration work and records no invented research. The requested local ignore additions must be reconciled with Moses's main-version preference during the deferred merge.
