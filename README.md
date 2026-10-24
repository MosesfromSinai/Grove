# Grove

**Where food finds its campus.**

Grove is a marketing company for locally owned restaurants and food trucks near a college campus. Restaurants pay us to bring in students, especially on slow days. The Grove app runs the deals and proves every visit: students redeem in store by scanning the counter sticker. Launching at UC Riverside. Built for CS 175 (Entrepreneurship in Computing), Fall 2026.

> Working name. "Grove" may be trademarked; see Open decisions in `docs/STATUS.md`.

---

## Getting started

**Requirements:** Node.js 22 (pinned in `.nvmrc`; with [nvm](https://github.com/nvm-sh/nvm), run `nvm install` then `nvm use`), Git, the [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`), the [Supabase CLI](https://supabase.com/docs/guides/cli), and Docker (only if you run Supabase locally).

**Accounts:** accept Moses's invites to the Grove project on Vercel and Supabase first. That's how you get keys; nobody sends them in chat.

```bash
git clone git@github.com:MosesfromSinai/Grove.git grove
cd grove
nvm use                      # Node 22
npm install
vercel link                  # pick the Grove project
vercel env pull .env.local   # downloads every key; .env.local is git-ignored
npm run dev                  # http://localhost:3000
```

When a key changes, run `vercel env pull .env.local` again. Before pushing, run `npm run lint`, `npm run typecheck`, and `npm run build`.

**Environment variables:** values live in Vercel and arrive through `vercel env pull`. `.env.example` lists every variable and what it's for, with empty values.

**Testing on a phone:** camera and location only work over HTTPS. Use the Vercel preview link from your pull request, or run `npx ngrok http 3000`.

---

## Docs

| File | What's in it |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Rules, scope, team and ownership, week plan, redemption rules, stack, design reference. Claude Code reads it automatically |
| [`docs/STATUS.md`](docs/STATUS.md) | Where the project is right now: phase, focus, blockers, open decisions |
| [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) | Tables, queries, functions, and error codes; `mocks/` match it |
| [`docs/LOG.md`](docs/LOG.md) | What each person did, plus decisions that affect others |
| `docs/team/<name>.md` | Each person's tasks, notes, and session log |
| `/theme` | Live preview of the design tokens (run the app and open `/theme`) |
