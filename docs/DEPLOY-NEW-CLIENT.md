# Deploying the TechMirai site

**Who this is for:** Jamal, who deploys (WORK-ORDER decision 9: the developer prepares, Jamal deploys). **Status (2026-10-20, commit `269b1ab`): deployment cannot start yet**, because of the hard blocker in section A. Anything marked `[TBD: Jamal to confirm]` is not recorded anywhere in the repo, and no value has been guessed. Everything below the line "Generic template runbook" is the older client-site template text, kept for reference and corrected where it was wrong for this repo.

## TechMirai: read this first

### A. HARD BLOCKER: production schema and migration (Jamal's decision needed)

Verified from the code and the logs:

- `apps/techmirai-web/payload.config.ts` sets `push: true` for Postgres. The `prodMigrations` array is commented out and no `migrations/` folder exists in the app.
- The installed Postgres adapter (`@payloadcms/db-postgres` 3.85.0, `connect.js`) pushes the schema only when `NODE_ENV` is not `production`, and runs `prodMigrations` only when `NODE_ENV` is `production` and the array is set. As configured, **a production start creates no tables and applies no indexes**. A production deploy pointed at an empty database would start with no tables.
- The config comment saying the booking indexes "run on production init" is inaccurate for the same reason.
- `payload migrate` fails in this monorepo. The config states there is "no production-safe automated migration path" that "must be fixed before WO-8" (`docs/ENGINE-FIXES.md`, 2026-10-04, status open).
- The development schema push can ask interactive questions and has hung even when answered (`docs/ENGINE-FIXES.md`, 2026-10-06).
- `pnpm --filter techmirai-web db:apply-indexes` applies the booking, notification and customer-LINE indexes and constraints as idempotent `IF NOT EXISTS` SQL, after the base tables exist. It sets no `NODE_ENV`; by reading the adapter, its own start-up would run the development push first. **It has not been run against an empty database, so this is unverified.**
- The seed scripts refuse to run unless `DATABASE_ENV=development`, so the repo has no supported way to put content into a database that is not declared a development database.
- There is no automated backup. Neon restore points are manual (`docs/SEEDING.md`, section 5).

Open questions for Jamal:

1. Is the launch database a separate Neon database (WORK-ORDER decision 3)? The only database confirmed so far is the separate **development** Neon database.
2. Who creates its tables, and by what approved procedure?
3. How does production content get in, given the seed guard above?
4. Does Jamal want a code fix (for example generating migrations or enabling `prodMigrations`)? That would be a separate, approved change.

No procedure for creating a production schema, seeding production content, or resetting a database is endorsed in this file.

### B. What the repo records about hosting

- **Vercel cron:** `apps/techmirai-web/vercel.json` holds one entry, a daily call to `/api/cron/notifications` at `0 0 * * *` (UTC), guarded by `CRON_SECRET`. Other hosts need their own scheduled caller. Customer reminders are disabled anyway (register J2-09, J2-12).
- **Not recorded in the repo:** the Vercel Root Directory, install command, build command and Node version. `[TBD: Jamal to confirm]`.
- **Facts that bear on those choices:** a pnpm workspace (pnpm 11.1.3); the root `pnpm build` runs `turbo build`, which builds `apps/techmirai-web` together with the workspace packages `packages/cms-core` and `packages/reception-engine`; Next 15.5; Node is not pinned (everything was run on v24.21.0). `vercel.json` lives inside `apps/techmirai-web`.
- **The build reads the database** (static generation of 105 pages queries Payload) but does not change its schema. At O2 it took about 4.5 minutes locally. `turbo.json` lists the environment variables passed to the build.

### C. Production environment

Variable names are in the README (section 3) and `apps/techmirai-web/.env.example`. From the code and `.env.example`:

- Required: `DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL` (the real public URL; it feeds the CORS and CSRF allow-lists in `payload.config.ts`, which also allow `https://techmirai-ai.com` and `https://www.techmirai-ai.com`).
- `SITE_ENV` must be exactly `production`, or `robots.txt` disallows everything and every response carries `X-Robots-Tag: noindex`.
- `DATABASE_ENV`: `.env.example` says to leave it unset in production.
- Media: without the four R2 storage values the app uses local disk, which is not durable on most hosts.
- Email: Resend's sandbox sender delivers only to the account owner until the `techmirai-ai.com` sending domain is verified (WORK-ORDER section 9).
- **Customer booking emails are withheld outside local development by design** (register J2-12, a launch blocker). Enabling them needs a deliberate code change after the meeting workflow is verified; no environment variable turns them on.

### D. Conditions the repo sets before launch

- `pnpm preflight:launch` must fail only on items in `docs/PLACEHOLDER-REGISTER.md`. It is **not** passing today (see README section 7).
- Register rows marked launch blocker: J2-01 (meeting tool and customer email), J2-02 (only if the in-person visit is offered), J2-05 (replace demo booking slots), J2-12 (customer email policy), K2-01 (hand-off hours), M1-01, M1-02, M1-03 (legal pages need professional text). Counts and owners: `docs/HANDOFF.md`.
- What stays with Jamal is listed in WORK-ORDER section 9: the domain and DNS, the LINE Official Account, closing every CONFIRM item, written permissions (Sadiatec, each team member), Haruka's Japanese review, professional legal review, the founder-visibility decision, the production AI provider, and post-launch search and listing submissions.

### E. Checks that exist for a finished site

`pnpm typecheck`, `pnpm build`, `pnpm preflight`, `pnpm preflight:launch`, and `pnpm a11y` (it reads `BASE_URL`, default `http://localhost:3000`). The GET-only SEO check is `CI=1 pnpm --filter techmirai-web exec playwright test e2e/seo.spec.ts` (it also reads `BASE_URL`). Do not run the other three e2e specs: they write to the database. Results at O2 are in `docs/O2-ACCESSIBILITY.md`.

---

# Generic template runbook (reference)

Step-by-step, from an empty repository to a live site, as written for the client-site template. Sections that do not apply to this repo are marked **[Template only]**. Where the old text was wrong for this repo it has been corrected.

This repo has no pinned hosting provider. The steps below are host-agnostic
except where noted (Vercel is called out specifically for its cron support).

---

## 0. Prerequisites

Accounts/services you'll need before starting, and which steps need them:

| Service | Required? | Used for |
|---|---|---|
| GitHub (or equivalent) | Required | Hosting the new repo |
| A Postgres database | Required for production | Step 4 |
| A Node.js host (Vercel, Railway, etc.) | Required | Step 7 |
| Cloudflare R2 (or S3-compatible storage) | Recommended | Step 4 — local disk media storage isn't durable across most hosts' deploys |
| Resend | Required if contact/booking forms send email | Step 8 |
| Cloudflare Turnstile | Optional | Anti-spam on the contact form |
| Upstash Redis | Optional | Rate limiting |

---

## 1. Create the new repo **[Template only]**

This repository already exists. Do not run `create-client-app.mjs` for TechMirai; the text below is for scaffolding other client sites.

From a checkout of this template:

```bash
node scripts/create-client-app.mjs ../my-new-client
cd ../my-new-client
git init
git add -A
git commit -m "Initial scaffold from techmirai-ai-website template"
```

`create-client-app.mjs` copies every git-tracked file (via `git archive`, so
no `node_modules`/`.next`/`.env.local` come along) into the target directory,
and replaces every client-identity value in
`apps/techmirai-web/site.config.ts` with a `__FILL_ME__` sentinel. It does
**not** run `git init` or install anything — that's on you, so nothing
happens to your shell's working directory or git state without you asking.

This produces a genuinely separate repository: its own git history, no
`workspace:*` link back to the source template. Pushing it to its own
remote (a new GitHub repo, not a fork) is what makes it independently
deployable.

**Why the app folder normally keeps its name:** every client repo scaffolded this way keeps
the same internal engineering layout (`apps/<app-name>/`, `packages/cms-core/`) regardless of
the client's actual brand — the client's identity lives entirely in `site.config.ts` and the
new repo's own name, not in internal folder paths. This keeps scaffolding simple and keeps
future engine fixes easy to compare/port across client repos. (`techmirai-ai-website` is the
one known exception: it was hand-cloned per `docs/WORK-ORDER.md`, not scaffolded via this
script, and its app folder was renamed from `apps/clinic-demo` to `apps/techmirai-web` in
Pack-2/D1.)

---

## 2. Configure `site.config.ts`

**For TechMirai the `__FILL_ME__` sentinels are already filled in** and unconfirmed facts are tracked in `docs/PLACEHOLDER-REGISTER.md`; `pnpm preflight` is the check that applies. The text below is the template's.

Open `apps/techmirai-web/site.config.ts` and fill in every `__FILL_ME__`
sentinel. Each one says what it needs and gives an example:

```ts
name: '__FILL_ME__ REQUIRED: client display name, e.g. "Sakura Osteopathic Clinic"',
```

There are ~27 of them, covering: site name/tagline/domain, contact
email/phone/address/business hours/map embed, form recipients, SEO title
and description, the booking provider URL (or disable booking entirely via
`features.bookingWidget: false`), the reception widget's greeting text, and
(optional — safe to delete individual entries) social links.

Things that are **not** sentinel-marked but worth reviewing per client:

- `brand.colors` / `brand.typography` — ships with a working calm-teal
  default. Swap the hex values for the client's palette. For TechMirai the brand
  colours live in two places (`site.config.ts` and
  `packages/cms-core/src/styles/globals.css`); change both. The current
  values are temporary (register D2-01).
- `verticals.clinic` — leave `true` for any clinic-type business (the
  "clinic" vertical covers doctors/practitioners + treatments generically,
  not just osteopathic care).
- `locales.enabled` / `locales.default` — which languages the site ships,
  and which one search engines/browsers see first.
- **[Template only: not applicable to TechMirai, where the clinic vertical
  is switched off; see `apps/techmirai-web/README.md` and
  `docs/ENGINE-FIXES.md`, 2026-10-04, D1.]** The medical disclaimer — this lives in CMS content, not
  `site.config.ts`. It seeds with an obvious `[PLACEHOLDER — replace with
  legally reviewed medical disclaimer...]` marker (see
  `packages/cms-core/src/verticals/clinic/globals/medical-disclaimer.ts`)
  and the footer visibly flags it as unreviewed until you replace it
  through `/admin`. **Do not launch with the placeholder text** — get it
  reviewed against the medical-advertising regulations relevant to the
  client's country (e.g. Japan's 医療広告ガイドライン).

Run the preflight check locally as you go — it tells you exactly what's
still unfilled:

```bash
node scripts/preflight-check.mjs
```

---

## 3. Install dependencies

```bash
pnpm install
```

---

## 4. Provision the database

**Local dev:** SQLite, no setup needed. `DATABASE_URI=file:../../.data/local.db`
(see `.env.example`). The database lives outside the app's watched source
folders to avoid unnecessary dev-server reloads.

**Production: use Postgres, not SQLite.** The in-house booking engine
needs real transactions, which SQLite disables for this app (see
`apps/techmirai-web/src/seed/booking.ts`'s doc comment) — a real client
launch with the booking widget enabled requires Postgres regardless of
scale.

**Production schema: unresolved for this repo. See "A. HARD BLOCKER" at the top of this file.**

The template's earlier instructions here said `payload.config.ts` has
`push: false` and told you to set it to `true`, boot once, and set it
back. That was wrong for this repo: the file already has `push: true`, and
the adapter skips the push when `NODE_ENV` is `production`, so
`pnpm build && pnpm start` does **not** create tables. Those steps were
removed because they were never run against an empty production database
here and they assume a procedure Jamal has not approved.

What is known: `pnpm --filter techmirai-web db:apply-indexes` applies the
hand-written booking, notification and customer-LINE indexes and
constraints as idempotent SQL, after the base tables exist (details in
section A).

**[Template only]** If you don't need the in-house booking engine for this client (external
booking provider URL only, `features.bookingWidget` pointed at it), you
can skip the Postgres requirement and run entirely on SQLite, including in
production — accept that tradeoff explicitly rather than defaulting into
it.

---

## 5. Seed content

**Seeding (TechMirai):** `pnpm seed --confirm` is the single seed command;
`pnpm seed:demo` was retired in Pack-2/F3. The guard list and recovery are in
`docs/SEEDING.md`. These scripts do not cover production content (section A
at the top of this file).

```bash
pnpm seed --confirm
```

This is destructive (it clears existing demo-tagged content before
reseeding), so it's guarded by several independent checks, all of which
must pass before anything is touched:

- Requires `DATABASE_ENV=development` in `.env.local` — a safety flag (not
  an adapter setting), refusing to run otherwise so demo content can never
  accidentally be seeded into a production database.
- Refuses to run at all if it detects a CI or auto-deploy environment (`CI`,
  `VERCEL`, `GITHUB_ACTIONS`, `NETLIFY` set) — this script must never fire
  as a side effect of a deploy pipeline.
- Requires an **explicit confirmation per invocation**: either the
  `--confirm` flag shown above, or `SEED_CONFIRM_CLEAR=yes` set for
  that one command. This is deliberately not something you set once in
  `.env.local` — run it without confirming and it prints exactly what it's
  about to clear, then exits without touching the database. Don't interrupt
  a confirmed run partway through; if one gets cut off, just run it again
  to completion rather than trying to patch up partial state.

**[Template only]** The template-era text about writing seed logic from
JSON no longer applies: `apps/techmirai-web/src/seed/index.ts` is a full seed
(see `docs/SEEDING.md`, section 7). Content entered through `/admin` into a
`pages` document that already exists survives later seed runs.

**Booking data** (only if the in-house booking engine is enabled and
you're on Postgres):

```bash
pnpm --filter techmirai-web seed:booking
```

Seeds bookable services, the shared resource and **DEMO** slots (they must
be replaced with real availability before launch, register J2-05). Refuses to
run against SQLite and, like `pnpm seed`, unless `DATABASE_ENV=development`.

---

## 6. Set environment variables

Copy `apps/techmirai-web/.env.example` to `.env.local` for local dev, and set
the same variables on your host for production:

```bash
cp apps/techmirai-web/.env.example apps/techmirai-web/.env.local
```

Every variable the app actually reads is documented in that file, grouped
by what it's for (database, R2 media storage, email, booking, anti-spam,
AI chat widget, rate limiting) with which ones are required vs optional.
Never reuse a secret across client projects — generate fresh ones per
client (`PAYLOAD_SECRET`, `BOOKING_TOKEN_SECRET`, `CRON_SECRET`: `openssl
rand -base64 32`).

---

## 6b. Configure the reception AI widget (optional)

Only needed if this client wants the AI-assisted reception chat widget
(`features.aiAgent && reception.enabled` in `site.config.ts`). Skip this if
the widget is disabled for this client.

1. **Groq API key.** The widget's free-text AI fallback calls Groq directly.
   Create a key at [console.groq.com/keys](https://console.groq.com/keys)
   (free tier) — one key per client project, never reused — and set
   `GROQ_API_KEY` in `.env.local`/your host's env vars. Without it, the
   widget still works end-to-end; every visitor whose question reaches the
   AI tier just gets a fixed "please contact us" message instead of a
   generated answer, which is the same degradation as a Groq outage. Only
   set `GROQ_MODEL` if you need to override the default
   (`openai/gpt-oss-20b`).
2. **Chat content.** The widget's content (button answers, matching, and AI
   grounding) is **not** CMS content. For TechMirai it is static code in
   `packages/cms-core/src/verticals/clinic/reception/techmirai-chat-content.ts`
   (Pack-4 K1/K2). The clinic template's Q&A file `faq-content.ts` sits in
   the same folder and still contains clinic wording (one of the nine
   preflight hits); whether the TechMirai chat still uses it is not
   confirmed. Editing the CMS `faqs` collection through `/admin` has **no
   effect** on this widget — that collection only backs the public `/faq`
   page.
3. **Staff LINE link.** `site.config.ts` → `reception.staffLineUrl` is the
   URL the widget's "talk to staff" option links to. It is **not** one of
   the `__FILL_ME__` sentinels `preflight-check.mjs` catches, so it's easy
   to miss — check it manually. If you're also setting up LINE (step 9
   below), point it at the client's real LINE add-friend URL. If this
   client isn't using LINE, either leave it unset (the "talk to staff"
   option disappears from the widget entirely rather than showing a dead
   link) or point it at another real staff-contact channel if one exists.

---

## 7. Connect the domain

1. Point the client's domain at your host (DNS steps vary by host).
2. Set `NEXT_PUBLIC_SERVER_URL` to the real production URL — this drives
   CORS/CSRF allow-listing (`payload.config.ts`) as well as absolute links.
3. Set `site.config.ts`'s `site.domain` to match (no protocol).
4. **If the daily appointment-reminder cron matters for this client:**
   `apps/techmirai-web/vercel.json` declares a Vercel Cron
   (`/api/cron/notifications`, daily). This only fires if you're deployed
   on Vercel. On any other host, you need an equivalent scheduled caller
   (e.g. a hosted cron service hitting that endpoint with `CRON_SECRET`).
5. For TechMirai, `SITE_ENV` must be exactly `production`; otherwise
   `robots.txt` disallows everything and every response is sent with
   `X-Robots-Tag: noindex` (section C at the top of this file).

---

## 8. Configure email

1. Verify the client's sending domain in Resend (or use Resend's sandbox
   `onboarding@resend.dev` — fine for demos, not for real client
   deliverability).
2. Set `RESEND_API_KEY`, `FROM_EMAIL`, `CONTACT_NOTIFICATION_EMAIL`.
3. Set `site.config.ts`'s `integrations.resendFromEmail` to the verified
   from-address once the client's domain is verified.

**TechMirai:** customer booking emails are withheld outside local
development (register J2-12), so verifying the domain alone does not turn
them on (section C at the top of this file).

---

## 9. Configure LINE (optional)

**TechMirai:** no LINE Official Account exists yet (WORK-ORDER decision 6) and
LINE booking is switched off, so this section and 9b are not needed for
launch. The text below is the template's and was not reviewed for TechMirai.

Only needed if this client wants the LINE webhook (follow/unfollow
greeting + block detection — STEP 2 Part 1; LIFF booking, LINE
notifications, and reception chat over LINE are later, separate parts not
covered by this step).

1. Create a **Provider** in the [LINE Developers Console](https://developers.line.biz/console/),
   then a **Messaging API channel** under it. Each client needs their own
   provider/channel — never share one across client projects.
2. From the channel's **Basic settings** tab, copy the **Channel secret**
   into `LINE_CHANNEL_SECRET`.
3. From the **Messaging API** tab, issue a **Channel access token** (long-lived)
   and set it as `LINE_CHANNEL_ACCESS_TOKEN`.
4. Make sure the `customers.lineUserId`/`lineChannelDead` columns exist on
   this client's database: a fresh client already gets these from step 4's
   `pnpm db:apply-indexes` run. If you're enabling LINE on a client that
   was deployed **before** this feature existed, run
   `pnpm db:apply-indexes` now (it's idempotent — safe to re-run) before
   going further; otherwise the webhook's customer lookups fail silently
   (caught and logged, not thrown — see `handlers.ts`) and linking/failover
   never work even though the greeting reply still appears to succeed.
5. In the **Messaging API** tab, set the **Webhook URL** to
   `https://<your-domain>/api/line/webhook` and enable **Use webhook**.
   Use the console's **Verify** button to confirm connectivity: LINE's
   Verify button sends a validly-signed test request, so a correctly
   configured webhook returns `200`. A `401` here means a real
   misconfiguration (usually the wrong `LINE_CHANNEL_SECRET` for this
   channel) — treat it as a failure to fix, not as expected.
6. Turn **off** the console's own auto-reply/greeting messages (Response
   settings) so they don't fight with this endpoint's follow-event
   greeting.
7. Smoke-test: add the OA as a friend from a real phone (scan the QR code
   in **Messaging API > QR code**) — confirms the greeting reply arrives.
   Then block the OA from the phone — confirms the linked customer's (once
   Part 2 links one) `lineChannelDead` flips to `true` in `/admin`.

If this client doesn't want LINE at all, skip this section — the webhook
route fails loudly (returns `500`) rather than silently misbehaving if hit
without `LINE_CHANNEL_SECRET`/`LINE_CHANNEL_ACCESS_TOKEN` set. The
notification dispatcher's LINE channel (STEP 2 Part 3) is registered
unconditionally but never actually invoked for this client: the
channel-selection function only picks LINE for a customer with a
`lineUserId` on file, and nothing sets that field without the LINE
foundation above (or LIFF booking, a later part) being live.

---

## 9b. Configure LIFF apps and the rich menu (optional, needs section 9 done first)

Two separate LIFF apps are needed — one per distinct page, because a LIFF
app's Endpoint URL is fixed per app; appending a subpath to a LIFF URL does
not change which endpoint loads (verified against LINE's docs). Both are
registered under the same **LINE Login channel** (not the Messaging API
channel) referenced in section 9.

1. **Booking LIFF app** (STEP 2 Part 2 — code has existed since Part 2, but
   this registration step was never previously written down here):
   LINE Developers Console → your LINE Login channel → **LIFF** tab → Add.
   Endpoint URL: `https://<your-domain>/<locale>/line/booking`. Copy the
   issued LIFF ID into `NEXT_PUBLIC_LIFF_ID`.
2. **Manage LIFF app** (STEP 2 Part 4): same tab, Add again. Endpoint URL:
   `https://<your-domain>/<locale>/line/manage`. Copy the issued LIFF ID
   into `NEXT_PUBLIC_LIFF_MANAGE_ID`.
3. **Rich menu button, once a rich menu exists for this client:** wire a
   予約確認・変更 (check/change booking) button as a **URI** action (not
   postback — this flow is a LIFF webview, so there's no webhook event to
   handle) pointing at the manage LIFF app's `https://liff.line.me/{manage
   LIFF ID}`.

   **Known gap, worth knowing before you look for it:** no code in this repo
   creates or uploads a rich menu (image + button-area mapping via the
   Messaging API's `richmenu` endpoints) — verified by exhaustive search
   during STEP 2 Part 4. Earlier planning assumed a rich menu with this
   button already existed; it doesn't. Rich menu creation needs an actual
   designed image asset (brand-specific, not something to generate from a
   dev session) and covers ALL of a client's menu buttons at once, not just
   this one — treat "design and register the rich menu" as its own
   deployment step for whichever button set a real client wants, using the
   LIFF URLs above for the booking/manage buttons once that's ready.

---

## 10. Verify

```bash
pnpm typecheck
pnpm preflight
pnpm build
```

Then smoke-test manually:

- [ ] Home page loads in every enabled locale
- [ ] Contact form submits and the notification email arrives
- [ ] Booking flow works end-to-end (if enabled) — book, then
      cancel/reschedule from the manage link. Customer confirmation emails
      are withheld outside local development (J2-12); check the staff email
      and the booking in `/admin` instead.
- [ ] `/admin` login works
- [ ] Media uploads render (confirms R2 config, if configured)
- [ ] `pnpm a11y` and the GET-only SEO check pass against the deployed URL
      (set `BASE_URL`; section E at the top). Do not run the three
      database-writing e2e specs against a live database.
- [ ] (Not applicable to TechMirai while LINE is off.) If LINE is configured
      (step 9): adding the OA as a friend via QR triggers the greeting reply,
      and blocking the OA flips the linked customer's `lineChannelDead` to
      `true` in `/admin`

Passing these checks does **not** make the site launch-ready: the launch
conditions in section D at the top of this file must also be met.
