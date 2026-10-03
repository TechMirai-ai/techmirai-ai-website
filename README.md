# Clinic Demo — Project Overview

This is the starting point for anyone new to this project. It's a map, not
a manual — a few minutes of reading to understand the whole project's
shape, with links out to the real depth. If you want to know *how* a
specific feature works internally, follow the links in §3 or §6, not this
file.

---

## 1. What this project is

This repository builds websites for medical/clinic-type businesses. It's
split into two layers:

- **`packages/cms-core`** — a shared, vertical-agnostic "engine" package
  that provides generic CMS building blocks (pages, blog, news, team, FAQs,
  contact forms), driven by a config object. It has no built-in idea of
  what a "clinic" is.
- **`apps/clinic-demo`** — one concrete website built on that engine, with
  clinic-specific functionality (doctors, treatments, departments, an
  in-house booking system, a LINE integration, and an AI-assisted
  reception widget) layered on top.

If you're deploying this for a **real client**, you scaffold a new repo
from this one and configure it for that client — see
[docs/DEPLOY-NEW-CLIENT.md](docs/DEPLOY-NEW-CLIENT.md). The internal folder
names (`apps/clinic-demo`, `packages/cms-core`) stay the same across every
client repo; only config and content change.

---

## 2. Tech stack

Next.js 15 (App Router) · Payload CMS v3 · React 19 · Tailwind CSS 4 ·
SQLite (dev) / Postgres (production) · Cloudflare R2 (media) · `next-intl`
(English/Japanese/Bengali) · `fuse.js` (fuzzy matching) · Groq (AI
fallback) · Resend (email) · Upstash Redis (rate limiting) · pnpm +
Turborepo (monorepo tooling)

See [ARCHITECTURE.md](ARCHITECTURE.md) for why each of these was chosen.

---

## 3. The three core features

**Online reservation** — visitors book a real appointment (visit type,
service, time slot, contact details) directly on the site, with staff
seeing it land in `/admin` immediately. It's the foundation the LINE
integration and parts of the reception widget build on top of. See
[docs/online-reservation.md](docs/online-reservation.md) for how it works
and how to develop it.

**LINE reservation** — the same booking system, reachable from inside
LINE: a visitor adds the clinic as a LINE friend, books or manages an
appointment through a LINE-embedded page, and gets confirmations there
too. It layers on top of the online reservation system rather than
duplicating it. See [docs/line-reservation.md](docs/line-reservation.md)
for how it works and how to develop it.

**AI receptionist** — a chat widget that answers visitor questions
through a mix of buttons, a static FAQ lookup, and an AI fallback for
anything neither of those handles, with a "talk to a human" escape hatch
throughout. It's the newest and most complex feature in the project. See
[docs/ai-receptionist.md](docs/ai-receptionist.md) for how it works and
how to develop it.

---

## 4. Monorepo structure

```
apps/clinic-demo/           # the deployable Next.js app — routes, config, seed scripts
packages/cms-core/          # the shared engine — Payload config, blocks, collections
packages/reception-engine/  # generic, framework-agnostic state-machine engine
```

Inside `apps/clinic-demo`, `site.config.ts` is the single source of truth
for this instance's branding and feature flags. Inside `packages/cms-core`,
generic engine code lives directly under `src/`, and clinic-specific code
lives under `src/verticals/clinic/`. Beyond that, prefer the feature docs
in §6 or [ARCHITECTURE.md](ARCHITECTURE.md) over browsing — they'll get you
to the right file faster than guessing from folder names.

---

## 5. Running this locally

```bash
pnpm install
cp apps/clinic-demo/.env.example apps/clinic-demo/.env.local
pnpm dev
```

Visit `http://localhost:3000` for the site, `http://localhost:3000/admin`
for the CMS. `apps/clinic-demo/.env.example` documents every environment
variable the app reads; at minimum you'll want `DATABASE_URI` and
`PAYLOAD_SECRET` set to see the site running.

To populate the site with placeholder content:

```bash
pnpm seed:demo --confirm
```

This is destructive (it clears existing demo content first), so it's
gated behind an explicit `--confirm` flag plus a few other safety checks —
see [ARCHITECTURE.md §11](ARCHITECTURE.md#11-seed-safety-mechanism) for
why it's built this way.

---

## 6. Where to go next

| Doc | Read it when... |
|---|---|
| [docs/online-reservation.md](docs/online-reservation.md) | You're working on booking, availability, or the appointment data model |
| [docs/line-reservation.md](docs/line-reservation.md) | You're working on the LINE webhook, LIFF pages, or LINE notifications |
| [docs/ai-receptionist.md](docs/ai-receptionist.md) | You're working on the chat widget, FAQ content, or the Groq integration |
| [ARCHITECTURE.md](ARCHITECTURE.md) | You need the technical reference — data model, config system, exact mechanisms |
| [docs/DEPLOY-NEW-CLIENT.md](docs/DEPLOY-NEW-CLIENT.md) | You're standing up a new client site from this template |

---

## 7. Known gaps

- **Japanese content is still incomplete in places** — UI chrome text is
  fully translated, but some CMS-seeded placeholder content is still
  English under the `ja` locale, being completed section by section.
- **Business name inconsistency** — `site.config.ts` uses 「さくら接骨院」
  consistently; hardcoded copy in `services-grid/component.tsx` uses a
  different name, 「さくら整骨院」. Needs reconciling before a real launch.
- **Two hardcoded content spots** in `services-grid/component.tsx`
  (symptom cards, bottom CTA) await a proper CMS field.
- **The homepage's booking CTA is currently dead** — see
  [docs/online-reservation.md](docs/online-reservation.md) for the
  specifics.
- **No LINE rich menu has been registered yet** — the buttons it would
  hold already work as standalone links; see
  [docs/line-reservation.md](docs/line-reservation.md).
- Two placeholder values must be replaced before any real launch: the
  medical disclaimer text and the external booking provider URL. Details
  in [ARCHITECTURE.md §7](ARCHITECTURE.md#7-known-placeholders--pre-launch-requirements).
