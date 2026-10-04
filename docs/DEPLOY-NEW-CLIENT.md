# Deploying a new client site

Step-by-step, from an empty repository to a live site. Follow it in order —
later steps assume earlier ones are done.

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

## 1. Create the new repo

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
  default. Swap the hex values for the client's palette (see README's
  [Color Tokens](../README.md#color-tokens) section); every color is used
  from this one place, no hardcoded hex elsewhere.
- `verticals.clinic` — leave `true` for any clinic-type business (the
  "clinic" vertical covers doctors/practitioners + treatments generically,
  not just osteopathic care).
- `locales.enabled` / `locales.default` — which languages the site ships,
  and which one search engines/browsers see first.
- The medical disclaimer — this lives in CMS content, not
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

**Known gap — read before you provision Postgres:** `payload.config.ts`'s
`postgresAdapter` call is set to `push: false` (the safe production
setting), but this repo's bundled `payload migrate` CLI currently fails
outright here (an internal tsx version pin in Payload's own CLI can't
resolve this monorepo's cross-package extensionless imports). No
`migrations/` directory has ever been generated. There is currently no
fully automated, production-safe migration path — this is a known
limitation being tracked for a future engine fix, not something specific
to your client's config.

Until that's fixed, provision a fresh Postgres database like this:

1. Create the database and get its connection string.
2. Temporarily set `push: true` on the `postgresAdapter(...)` call in
   `apps/techmirai-web/payload.config.ts`.
3. Boot the app once against that `DATABASE_URI` (`pnpm dev` or `pnpm build
   && pnpm start` with the Postgres URI set) — this creates the base
   schema (all of Payload's own collection/global tables).
4. Set `push` back to `false`.
5. Run the booking/notification modules' hand-written indexes and
   constraints (composite indexes, CHECK constraints, FK behavior — the
   parts Payload's field config can't express):
   ```bash
   pnpm db:apply-indexes
   ```
   This is idempotent — safe to re-run any time, including after step 3
   above regenerates the base tables.

If you don't need the in-house booking engine for this client (external
booking provider URL only, `features.bookingWidget` pointed at it), you
can skip the Postgres requirement and run entirely on SQLite, including in
production — accept that tradeoff explicitly rather than defaulting into
it.

---

## 5. Seed content

**Placeholder/demo content** (fastest way to see a working site):

```bash
pnpm seed:demo --confirm
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
  `--confirm` flag shown above, or `SEED_DEMO_CONFIRM_CLEAR=yes` set for
  that one command. This is deliberately not something you set once in
  `.env.local` — run it without confirming and it prints exactly what it's
  about to clear, then exits without touching the database. Don't interrupt
  a confirmed run partway through; if one gets cut off, just run it again
  to completion rather than trying to patch up partial state.

**Real client content:** structure the client's content into JSON matching
the collection shapes in
`packages/cms-core/src/verticals/clinic/collections/`, then write real
seeding logic in `apps/techmirai-web/src/seed/index.ts` (currently a stub
that tells you this — see the file itself), following the pattern in
`src/seed/demo/index.ts`. Run it with:

```bash
pnpm seed
```

Otherwise, enter content directly through `/admin` once the dev server is
running.

**Booking data** (only if the in-house booking engine is enabled and
you're on Postgres):

```bash
pnpm seed:booking
```

Seeds bookable services/resources/slots. Refuses to run against SQLite
(see the script's own error message). Safe to re-run.

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
2. **FAQ content.** The widget's FAQ content (button answers, free-text
   fuzzy matching, and AI grounding) is **not** CMS content — it's a static
   file per client:
   ```
   packages/cms-core/src/verticals/clinic/reception/faq-content.ts
   ```
   This ships with this template's demo clinic's placeholder Q&A. Before
   launch, replace it with the real client's Q&A content (structure: an
   array of `{ id, category, question: { en, ja }, answer: { en, ja } }`
   entries — follow the existing shape). Editing the CMS `faqs` collection
   through `/admin` has **no effect** on this widget — that collection only
   backs the site's separate, unrelated public `/faq` page.
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

---

## 8. Configure email

1. Verify the client's sending domain in Resend (or use Resend's sandbox
   `onboarding@resend.dev` — fine for demos, not for real client
   deliverability).
2. Set `RESEND_API_KEY`, `FROM_EMAIL`, `CONTACT_NOTIFICATION_EMAIL`.
3. Set `site.config.ts`'s `integrations.resendFromEmail` to the verified
   from-address once the client's domain is verified.

---

## 9. Configure LINE (optional)

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
node scripts/preflight-check.mjs
pnpm build
```

Then smoke-test manually:

- [ ] Home page loads in every enabled locale
- [ ] Contact form submits and the notification email arrives
- [ ] Booking flow works end-to-end (if enabled) — book, then
      cancel/reschedule from the manage link
- [ ] `/admin` login works and the medical disclaimer has been reviewed
      and replaced (footer shows no unreviewed-placeholder warning)
- [ ] Media uploads render (confirms R2 config, if configured)
- [ ] `pnpm e2e` passes (Playwright — run `pnpm e2e:install` once first)
- [ ] If LINE is configured (step 9): adding the OA as a friend via QR
      triggers the greeting reply, and blocking the OA flips the linked
      customer's `lineChannelDead` to `true` in `/admin`

Once all of the above pass, the site is ready to hand off.
