# Adolfo Magallanes — Business Dashboard

> **Session reminder.** Full rules are in `CLAUDE.md` → Session protocol. Your next Claude session starts from this file, so keep it current.
> - **Start:** pull `main`; read `CLAUDE.md`, `docs/STATUS.md`, and this file; catch up on teammates in `docs/LOG.md` and `docs/DECISIONS.md`.
> - **During:** tick tasks here as they finish; record decisions in your section of `docs/DECISIONS.md`.
> - **End:** add a dated Session log entry here and a line in your section of `docs/LOG.md`; commit them with your code.

_Last updated: 2026-10-19_

---

## Role
- **Engineering:** everything a business owner or staff member sees: onboarding, deal posting, deal list, stats, sticker download, redemption settings, staff scanner.
- **Business:** pilot outreach (sign 2–3 businesses near UCR); 1–2 customer interviews.
- **Design:** screens 10–14 (Overview, Post a deal, My deals, Stats, QR sticker & PIN) on the [design canvas](https://claude.ai/artifact/9gApUhQQWpkU2FWTU27K1d). The staff scanner and redemption mode selector aren't drawn yet; build them in the same style. Tokens are in `CLAUDE.md` → Design reference.

## Owns
`app/(business)/`, `components/business/`.

## Depends on
- **Moses:** `mocks/`, real tables (end of week 1), Realtime on `redemptions` (week 2), `staff-redeem` and `getBusinessStats` (week 3).
- **Celso:** business sign-in routing; `business_members` access for staff.
- **Edward:** Tailwind theme (week 1).
- **Hikaru:** food-truck "I'm here now" location update (week 3); agree on who builds the button.

## Others depend on you
- **Everyone:** real businesses for the week-4 pilot.

---

## Tasks

### Week 1 — Foundation (Oct 19–25)
- [ ] Dashboard layout (desktop sidebar, phone and tablet friendly)
- [ ] Business onboarding: name, address (sets `location`), hours, logo upload, food-truck toggle
- [ ] Post-deal form: title, description, discount, start/end, photo, "UCR students only"
- [ ] My deals list: active, scheduled, expired, with redemption counts (mocks)

### Week 2 — Live data and stickers (Oct 26–Nov 1)
- [ ] Wire onboarding, posting, and My deals to real tables
- [ ] Printable sticker: QR of `grove.app/b/<qr_slug>` via `qrcode`, Grove branding, "Scan in the Grove app to redeem," download as PDF or PNG
- [ ] Overview page: today's and this week's redemptions, active deals, live visit feed via Realtime

### Week 3 — Stats, settings, staff scanner (Nov 2–8)
- [ ] Stats: redemptions per deal and busiest hours (Recharts)
- [ ] Redemption settings: Sticker vs. Staff scan selector, show/reset store PIN
- [ ] Staff scanner: camera via `html5-qrcode`, calls `staff-redeem`, green "Verified" or red "Not valid" with reason, "Scan next"

### Week 4 — Pilot (Nov 9–15)
- [ ] Onboard pilot businesses in person; print and place stickers
- [ ] Test the dashboard on a phone and a tablet at the counter
- [ ] Fix issues owners report

### Business
- [ ] Pilot outreach: contact local businesses near UCR, track in the shared Drive folder, aim for 2–3 signed
- [ ] 1–2 customer interviews; notes in the shared Drive folder

---

## Notes and decisions
_Record things only you need to remember. Team-wide decisions go in `docs/DECISIONS.md`._

---

## Session log
_Newest at the top. One entry per session._

### 2026-10-19
- **Did:** Assigned role.
- **Next:** Dashboard layout once the repo exists; start pilot outreach list.
- **Blockers:** Repo not created yet.
