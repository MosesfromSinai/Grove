# Adolfo Magallanes — Business Dashboard

> Session rules: `CLAUDE.md` → Session protocol. Your next Claude session starts from this file, so keep it current.

_Last updated: 2026-10-25_

---

## Role
- **Engineering:** everything a business owner or staff member sees: onboarding, deal posting, deal list, stats, sticker download, redemption settings, staff scanner, staff list, club nights, deal link and QR.
- **Business:** pilot outreach (sign 2–3 businesses near UCR); 1–2 restaurant interviews and at least one student interview.
- **Design:** screens 10–14 (Overview, Post a deal, My deals, Stats, QR sticker & PIN) on the [design canvas](https://claude.ai/artifact/9gApUhQQWpkU2FWTU27K1d). The staff scanner, redemption mode selector, staff list, post-club-night form, and repeat-days controls aren't drawn yet; build them in the same style. Tokens are in `CLAUDE.md` → Design reference.

## Owns
`app/(business)/`, `components/business/`.

## Depends on
- **Moses:** `mocks/`, real tables (end of week 1), Realtime on `redemptions` (week 2), `club_nights` and `getClubNights` (week 2, for your week 3 club night screens), `set-pin` (week 2), `staff-redeem`, `getBusinessStats`, `add-staff`, and `getStaff` (week 3).
- **Celso:** business sign-in routing; `business_members` access for staff.
- **Edward:** the deal page at `/deals/<id>`, which your deal link and QR open. (The theme is done; see `/theme`.)
- **Hikaru:** the "I'm here now" button component (week 3), which you place on the dashboard for food trucks.

## Others depend on you
- **Everyone:** real businesses for the week-4 pilot.

---

## Tasks

### Week 1 — Foundation (Oct 19–25)
- [x] Dashboard layout (desktop sidebar, phone and tablet friendly) (#69) — reviewed and accepted by Adolfo; commit and push authorized
- [ ] Business onboarding: name, address (sets `location`), hours, logo upload, food-truck toggle; first PIN via `setPin()` (#70)
- [ ] Post-deal form: title, description, discount, start/end, photo, "UCR students only" (#71)
- [ ] My deals list: active, scheduled, expired, with redemption counts; End now and Cancel (mocks) (#72)

### Week 2 — Live data, stickers, repeat days (Oct 26–Nov 1)
- [ ] Wire onboarding, posting, and My deals to real tables (#73)
- [ ] Repeat days and visibility on the post-deal form: day checkboxes, daily start/end time, public or link-only (while wiring it to real tables) (#112)
- [ ] Printable sticker: QR of `grove.app/b/<qr_slug>` via `qrcode`, Grove branding, "Scan in the Grove app to redeem," download as PDF or PNG (#74)
- [ ] Overview page: today's and this week's redemptions, active deals, live visit feed via Realtime (#75)

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

## Notes and decisions
_Record things only you need to remember. Decisions that affect others go in `docs/LOG.md` as **Decision** lines._

- Sprint 1 review order: #69, #71, #72, then #70. Stop after each stage; commits and publishing require Adolfo's explicit approval.
- Adolfo authorized committing and pushing #69 (including relevant `.gitignore` rules), then implementing #71. This does not authorize committing/pushing #71 or opening a PR, merging, or deploying.
- #69 preview lives at `/dashboard` on `adolfo/dashboard-foundation`. Navigation destinations are labeled placeholders; overview metrics and visit feed belong to #75. The sample business is not an authenticated business session.
- Review: Adolfo accepted the local #69 layout ("looks good"). Preview: `http://127.0.0.1:3000/dashboard`; resize to phone/tablet/desktop, follow all five navigation links, and use Tab then Enter on "Skip to content."
- Checks passed on Node 22.23.4: `npm run lint`, `npm run typecheck`, and `npm run build`. Browser checks passed at 320, 390, 768, 1024, and 1440px (no horizontal overflow; navigation targets at least 44px), all navigation destinations and return links, skip-link focus, and navigation without JavaScript. WCAG A/AA scans at 390 and 1440px reported no violations; no browser page errors. Desktop, tablet, and phone screenshots were inspected.
- The initial sandboxed build failed downloading the existing Google Fonts in `app/layout.tsx`; the network-enabled build passed. No source-code check failures remain. The temporary browser harness and screenshots are outside the repository at `D:/CS175/.tools/dashboard-check/`; no test dependencies or lockfile changes were added to Grove.
- Preview restart (PowerShell from the repo): add `D:/CS175/.tools/node-v22.23.4-win-x64` to this shell's PATH if Node 22 is unavailable, then `npm run start -- --hostname 127.0.0.1`. Rebuild first after code edits.
- The design artifact content could not be retrieved (web access failed; direct content request was challenged). Existing Grove tokens and documented screen descriptions guide the layout. Adolfo accepted the preview; exact canvas matching was not independently verified.
- Mocks currently provide reads, `setPin`, and staff operations, but no deal create/update/delete or business onboarding save wrappers. Coordinate any additions to `mocks/` or `lib/supabase/` with Moses before the later stages; keep the contract aligned.

---

## Session log
_Newest at the top. One entry per session._

### 2026-10-25
- **Did:** Inspected the clean checkout, fetched origin, confirmed main was current, and created `adolfo/dashboard-foundation`. Read project guidance, teammate decisions, contract, mocks, and GitHub #69–#72 acceptance criteria. Implemented only #69's dashboard shell and navigation placeholders using the existing theme. Lint, type checking, production build, responsive/behavioral checks, and accessibility scans passed; inspected screenshots and left the local production preview running. Updated only my team file, my LOG section, and the Adolfo status entry. Nothing committed or published.
- **Review:** Adolfo accepted the #69 layout ("looks good"); marked the local task complete. No commit, publishing, or next-stage implementation authorized by that feedback.
- **Authorization:** Adolfo subsequently authorized committing and pushing #69, then implementing #71. Added ignores for local tools, assistant state, AWS credentials, browser auth state, test reports, and logs; existing env/build/dependency ignores remain in place.
- **Next:** Commit and push the accepted #69 work, then implement and test #71 and stop for review. #72 and #70 follow separately; #71 commit/push requires explicit approval.
- **Blockers:** None for the accepted layout. Exact canvas matching was not independently verified because artifact content access failed. The old repo-creation blocker is resolved.

### 2026-10-19
- **Did:** Assigned role.
- **Next:** Dashboard layout once the repo exists; start pilot outreach list.
- **Blockers:** Repo not created yet.
