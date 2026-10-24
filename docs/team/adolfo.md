# Adolfo Magallanes — Business Dashboard

> **Session reminder.** Full rules are in `CLAUDE.md` → Session protocol. Your next Claude session starts from this file, so keep it current.
> - **Start:** pull `main`; read `CLAUDE.md`, `docs/STATUS.md`, and this file; catch up on teammates and their **Decision** lines in `docs/LOG.md`.
> - **During:** tick tasks here as they finish; log decisions that affect others as **Decision** lines in your section of `docs/LOG.md`.
> - **End:** add a dated Session log entry here and a line in your section of `docs/LOG.md`; commit them with your code.

_Last updated: 2026-10-24_

---

## Role
- **Engineering:** everything a business owner or staff member sees: onboarding, deal posting, deal list, stats, sticker download, redemption settings, staff scanner.
- **Business:** pilot outreach (sign 2–3 businesses near UCR); 1–2 customer interviews.
- **Design:** screens 10–14 (Overview, Post a deal, My deals, Stats, QR sticker & PIN) on the [design canvas](https://claude.ai/artifact/9gApUhQQWpkU2FWTU27K1d). The staff scanner and redemption mode selector aren't drawn yet; build them in the same style. Tokens are in `CLAUDE.md` → Design reference.

## Owns
`app/(business)/`, `components/business/`.

## Depends on
- **Moses:** `mocks/`, real tables (end of week 1), Realtime on `redemptions` (week 2), `club_nights` and `getClubNights` (week 2, for your week 3 club night screens), `staff-redeem` and `getBusinessStats` (week 3).
- **Celso:** business sign-in routing; `business_members` access for staff.
- **Edward:** the deal page at `/deals/<id>`, which your deal link and QR open. (The theme is done; see `/theme`.)
- **Hikaru:** food-truck "I'm here now" location update (week 3); agree on who builds the button.

## Others depend on you
- **Everyone:** real businesses for the week-4 pilot.

---

## Tasks

### Week 1 — Foundation (Oct 19–25)
- [ ] Dashboard layout (desktop sidebar, phone and tablet friendly) (#69)
- [ ] Business onboarding: name, address (sets `location`), hours, logo upload, food-truck toggle (#70)
- [ ] Post-deal form: title, description, discount, start/end, photo, "UCR students only" (#71)
- [ ] My deals list: active, scheduled, expired, with redemption counts (mocks) (#72)

### Week 2 — Live data, stickers, repeat days (Oct 26–Nov 1)
- [ ] Wire onboarding, posting, and My deals to real tables (#73)
- [ ] Repeat days and visibility on the post-deal form: day checkboxes, daily start/end time, public or link-only (while wiring it to real tables)
- [ ] Printable sticker: QR of `grove.app/b/<qr_slug>` via `qrcode`, Grove branding, "Scan in the Grove app to redeem," download as PDF or PNG (#74)
- [ ] Overview page: today's and this week's redemptions, active deals, live visit feed via Realtime (#75)

### Week 3 — Stats, settings, staff scanner, club nights (Nov 2–8)
- [ ] Stats: redemptions per deal and busiest hours (Recharts) (#76)
- [ ] Redemption settings: Sticker vs. Staff scan selector, show/reset store PIN (#77)
- [ ] Staff scanner: camera via `html5-qrcode`, calls `staff-redeem`, green "Verified" or red "Not valid" with reason, "Scan next" (#78)
- [ ] Post an open club night: date, time window, giveback text (e.g. "15% back to your club")
- [ ] Club night results on the dashboard: claimed club name and verified visits per night
- [ ] Deal link and QR download for flyers and group chats (`/deals/<id>`; it opens the deal only, never redeems)

_Feature freeze at the end of Nov 8: anything unfinished goes to the team to decide (finish quickly or move to the stretch goal)._

### Week 4 — Pilot, no new features (Nov 9–15)
- [ ] Onboard pilot businesses in person; print and place stickers (#79)
- [ ] Test the dashboard on a phone and a tablet at the counter (#80)
- [ ] Fix issues owners report (#81)

### Business
- [ ] Pilot outreach: contact local businesses near UCR, track in the shared Drive folder, aim for 2–3 signed; first deal free for pilot restaurants (#82)
- [ ] 1–2 restaurant interviews testing hypotheses 1–4 (slow days, per-visit vs. flat fee, hosting club nights, trusting QR check-in); notes in the shared Drive folder (#83)
- [ ] At least one student interview for hypothesis 5 (students try Grove when a deal reaches them through a club or fraternity they're in); notes in the shared Drive folder

---

## Notes and decisions
_Record things only you need to remember. Decisions that affect others go in `docs/LOG.md` as **Decision** lines._

---

## Session log
_Newest at the top. One entry per session._

### 2026-10-19
- **Did:** Assigned role.
- **Next:** Dashboard layout once the repo exists; start pilot outreach list.
- **Blockers:** Repo not created yet.
