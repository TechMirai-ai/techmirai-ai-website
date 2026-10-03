# LINE Reservation Integration

A deep-dive into how this project's booking system is exposed inside LINE —
for a developer who's never touched this feature before. It assumes you've
skimmed [docs/online-reservation.md](online-reservation.md) for how the
underlying booking engine works; this doc only covers what's specific to
LINE. For the manual LINE Developers Console setup steps (creating the
provider/channels, registering LIFF apps, the webhook URL), see
[docs/DEPLOY-NEW-CLIENT.md](DEPLOY-NEW-CLIENT.md) steps 9 and 9b — this doc
explains *why* those steps exist and *what the code does* with the
credentials they produce, not how to click through the console.

---

## 1. What it is

**From a visitor's perspective:** if the clinic has LINE set up, adding
their LINE Official Account as a friend gets you an automatic greeting
message. From there, two things work today: booking an appointment inside
LINE (opening a booking form that looks and works like the website's, but
inside a LINE in-app browser, with your name pre-filled if you've booked
before), and checking/cancelling an existing booking the same way. Both
currently require tapping a button whose target link exists in the code —
but the actual LINE **rich menu** (the persistent button bar at the bottom
of a LINE chat) hasn't been designed or registered yet, so today these
entry points aren't reachable from a real conversation without that manual
step (see §5).

**From a developer's perspective:** this is not a separate booking system —
it's the *same* booking engine (`packages/cms-core/src/booking/`, see
[online-reservation.md](online-reservation.md)) reached through three new
surfaces:

1. A **webhook** (`apps/clinic-demo/src/app/api/line/webhook/route.ts`) that
   currently handles exactly two LINE event types: `follow` (greet) and
   `unfollow` (mark the linked customer's LINE channel dead).
2. Two **LIFF** (LINE Front-end Framework) pages — LINE's mechanism for
   opening a normal web page inside a webview from within the LINE app —
   one for booking, one for managing an existing booking. Both mount
   existing, unmodified booking-UI components.
3. A **LINE channel** on the existing notification dispatcher, so booking
   confirmations/reminders can be pushed to LINE instead of email when a
   customer is linked.

---

## 2. Why it was built this way

### LIFF, not a chat-only booking flow

Booking was never rebuilt as a back-and-forth chat conversation inside
LINE. The reception AI system's own design principle — "a calendar grid
beats a conversation for choosing a time, always" (see
[ai-receptionist.md](ai-receptionist.md)) — was carried over here
unchanged: LIFF opens a real webview that mounts the *exact same*
`BookingFlow` React component the website uses
(`packages/cms-core/src/booking/ui/BookingFlow.tsx`), unmodified. This was
a deliberate reuse decision, not an oversight — `BookingFlow` was already
verified to have zero Next.js routing dependencies (no `useRouter`,
`useSearchParams`, etc.) and to talk to the booking API over a relative,
same-origin `fetch()`, which makes it trivially portable into any page
shell, LIFF included. Building a second, chat-native booking flow would
have meant maintaining two implementations of slot selection, contact
capture, and confirmation — for a strictly worse UX than a calendar grid.

### Two separate LIFF apps, not one with subpaths

`packages/cms-core` never fetches a `/manage/[id]`-style subpath through a
single LIFF app. There are two independent LIFF app registrations —
booking (`/<locale>/line/booking`) and manage (`/<locale>/line/manage`) —
each with its own LIFF ID (`NEXT_PUBLIC_LIFF_ID` and
`NEXT_PUBLIC_LIFF_MANAGE_ID`). This isn't arbitrary duplication: a LIFF
app's Endpoint URL is fixed per app registration, and appending a subpath
to a LIFF URL does not change which endpoint actually loads — verified
against LINE's own documentation before this was built (see the doc
comment in `apps/clinic-demo/src/app/(liff)/[locale]/line/manage/page.tsx`).
Any second, genuinely distinct LIFF-hosted flow needs its own LIFF app —
this is a LINE platform constraint, not a choice made here.

### The "check my booking" decision: URI action, not postback

The rich-menu button for checking/changing a booking (予約確認・変更) is
wired as a **URI action** — a plain link to
`https://liff.line.me/{manage LIFF ID}` — not a **postback** (a button that
fires a webhook event the server then replies to). This matters because the
whole "check my booking" flow is a LIFF webview, and a URI action is simply
the correct, native LINE mechanism for opening one; a postback exists
specifically for the *other* case, where a button click needs to trigger
server logic and get a reply *inside the chat itself*, with no webview
involved. There is no webhook event to handle here at all — LINE opens the
webview directly, and everything downstream (identity verification, booking
lookup, cancel/reschedule) happens inside the LIFF manage page exactly the
way it happens on the website's own manage page, through the same
`ManageAppointmentView` component and the same token-based access.

This is also where the actual implementation diverged from earlier
planning: `docs/STEP2-LINE-CATALOGUE.md` (a pre-build planning document —
see §6) had recommended a **postback → Flex Message card** for "check my
booking," reasoning that a reply-triggered card would be free (no push
quota) and would feel more native to a chat. What was actually built skips
that entirely in favor of reusing the existing web manage page as-is inside
a LIFF webview. No Flex Message renderer or postback handler exists in this
codebase for this flow. The practical result is the same for the visitor
(a tap that shows their booking with cancel/reschedule controls) but the
implementation is simpler and reuses proven code instead of building a new
LINE-specific rendering layer.

### Free replies vs. paid pushes, and why it shapes when messages are sent

LINE's Messaging API makes **reply** messages (sent via a `replyToken` in
direct response to an inbound event, valid for roughly one minute) free —
they don't count against the account's monthly message quota. **Push**
messages (sent proactively, outside that window) always count. This is why:

- The webhook's `follow`-event greeting is a **reply** (free) — it's sent
  synchronously in response to the inbound `follow` event.
- The notification dispatcher's LINE channel (`LineMessagingChannel`, in
  `packages/cms-core/src/notifications/channels/line-messaging.ts`) is
  **always a push** — booking confirmations, reminders, and cancellations
  are all queued and sent well outside any webhook request's short reply
  window, so there's never a `replyToken` available to them. This is stated
  directly in that file's own doc comment.

The upshot for anyone extending this: if you're responding to something the
user just did inside an active LINE interaction, look for a reply-token
path first — it's free and instant. Anything queued, scheduled, or fired
by a cron job has to be a push, and push consumes the account's monthly
quota.

---

## 3. How it works

### A. A visitor adds the clinic as a friend

1. LINE calls `POST /api/line/webhook` with a `follow` event.
2. `route.ts` verifies the `x-line-signature` header against
   `LINE_CHANNEL_SECRET` (via `verifyLineSignature`,
   `packages/cms-core/src/line/signature.ts`) using the **raw** request body
   string — never a re-serialized/re-parsed version, since that could
   silently break the signature. It also rejects any request whose
   `Content-Length` exceeds 1MB before reading the body at all, so an
   unauthenticated caller can't force an expensive read/HMAC computation
   with an oversized payload.
3. The route responds `{ success: true }` to LINE **immediately**, then
   processes the event afterward via Next's `after()` — mirroring the same
   pattern the booking `reserve` route uses for notification dispatch, so
   LINE's webhook ACK (and the Developers Console's "Verify" button) is
   never held up waiting on database or reply-send work.
4. `processLineWebhookEvents` → `handleFollowEvent`
   (`packages/cms-core/src/line/handlers.ts`) sends a bilingual (ja+en)
   greeting as a **reply** (free — see §2), built from
   `site.config.ts`'s existing `reception.greeting` text (the same copy the
   web reception widget uses). A follow event carries no locale signal, so
   both languages are sent together.
5. If this LINE user ID is already linked to a `customers` record (from an
   earlier LIFF booking) and that customer's `lineChannelDead` flag is set
   (from a previous block), it's cleared — the customer is "live" on LINE
   again. **A brand-new, never-booked follower does not get a customer
   record created here** — a bare follow event has no name or phone to
   populate the collection's required fields with, and a LINE profile
   display name is explicitly not treated as a legal name anywhere in this
   codebase (see §5). Real linking only happens during an actual LIFF
   booking, which has a real form.

### B. A visitor blocks the clinic's OA

Same webhook route, `unfollow` event → `handleUnfollowEvent`. LINE's push
API returns HTTP 200 with silent non-delivery for a blocked recipient —
there is no other reliable way to detect a block. This webhook event is
the **only** signal used: it flips the matched customer's
`lineChannelDead` to `true`, which the notification channel-selection logic
(§C below) then respects.

### C. A visitor books an appointment via LINE

1. The rich-menu booking button (once a rich menu exists — see §5) opens
   `https://<domain>/<locale>/line/booking`, a thin server page
   (`apps/clinic-demo/src/app/(liff)/[locale]/line/booking/page.tsx`) that
   just validates the locale/feature flag and renders `LiffBookingClient`.
2. `LiffBookingClient` (`'use client'`) calls `liff.init()`, then
   `liff.login()` if not already logged in (a no-op inside LINE's in-app
   browser; a real redirect if opened in a plain external browser).
3. It reads an **ID token** via `liff.getIDToken()` — never a raw
   client-asserted `lineUserId`. This token is sent to
   `POST /api/v1/booking/line-customer-lookup`
   (`packages/cms-core/src/booking/api/line-lookup.ts`), which verifies it
   server-side against `LINE_LOGIN_CHANNEL_ID`
   (`resolveVerifiedLineUserId` → `verifyLineIdToken`,
   `packages/cms-core/src/line/id-token.ts`) before trusting the identity
   for anything.
4. If that verified LINE user ID matches an existing `customers` record,
   the visitor sees a "Continue as [name]?" shortcut screen before the
   booking form — confirming skips straight to the calendar with contact
   fields pre-filled. If not matched, it falls through to the ordinary
   full-form flow, with only `liff.getProfile()`'s `displayName` used as an
   **editable name suggestion** (never submitted automatically — see §5).
5. Either way, the mounted component is `BookingFlow` — literally the same
   component the website's `/booking` page renders — just with a
   `lineIdToken` prop threaded through so the reserve API can link the new
   appointment's customer record to this LINE user ID.
6. From here, booking proceeds through the exact same reservation engine,
   validation, and slot-locking logic documented in
   [online-reservation.md](online-reservation.md). Nothing about slot
   availability, atomicity, or confirmation-code generation differs by
   channel.

### D. A visitor checks or cancels a booking via LINE

Same structure as booking: `.../[locale]/line/manage/page.tsx` renders
`LiffManageClient`, which does its own `liff.init()`/ID-token verification
and calls `POST /api/v1/booking/line-manage-lookup`
(`packages/cms-core/src/booking/api/line-manage-lookup.ts`) with the
verified token. Three outcomes: no linked customer at all (told plainly,
with the clinic's phone number as the fallback — deliberately **not**
offering a phone-number-entry workaround, since that would reopen the
identity-verification problem LIFF's ID-token check already solved); zero
upcoming bookings; or one or more bookings (multiple → a picker,
`LineManagePicker`; one → straight to `ManageAppointmentView`, the same
component the website's manage page uses, given the same
confirmation-code/access-token pair a web visitor would have gotten by
email).

### E. A confirmation, reminder, or cancellation notification fires

`resolveNotificationChannel` (in the notifications module) is the single
shared seam every customer-facing notification call site routes through:
LINE if the customer has a `lineUserId` on file and `lineChannelDead` is
not set, otherwise email, otherwise (neither usable) the row is skipped
entirely. Channel and recipient are resolved together in one place, so
there's no way for two code paths to disagree about where a message should
go. `LineMessagingChannel.send()` always pushes (§2) via
`sendLinePush` (`packages/cms-core/src/line/client.ts`), including a
deterministic retry key (derived from the notification's dedupe key via
SHA-256, not a fresh random UUID) so LINE's own retry mechanism can't
double-send. **Staff "new booking" and "cancelled" notifications are still
hardcoded to `channel: 'email'`** — the channel-selection seam exists for
customer-facing messages only; a staff-facing LINE channel (e.g. a group
chat push) was never built (see §5).

---

## 4. How to work on it

### Manual console steps that cannot be done from code

- **Provider, Messaging API channel, LINE Login channel, webhook
  registration, LIFF app registration (×2)** — walk through
  [DEPLOY-NEW-CLIENT.md](DEPLOY-NEW-CLIENT.md) steps 9 and 9b for a new
  client. These are one-time-per-client console actions; nothing in this
  repo can automate LINE Developers Console registration.
- **Rich menu design and registration.** No code in this repo creates or
  uploads a rich menu (the image asset + tap-area-to-action mapping, via
  LINE's Messaging API `richmenu` endpoints). This has to be designed
  (a real image, branded per client) and registered separately — treat it
  as its own deployment task, not something a developer can wire up by
  editing a file. The booking button's target URI
  (`https://liff.line.me/{booking LIFF ID}`) and the manage button's
  (`https://liff.line.me/{manage LIFF ID}`) are both ready and correct —
  they just have nowhere to live until a rich menu exists to hold them.
- **Turning off the console's own auto-reply/greeting.** If left on, it
  fights with the webhook's own `follow`-event greeting — must be disabled
  in LINE Official Account Manager's Response settings (see
  DEPLOY-NEW-CLIENT.md step 9.6).

### Pre-deploy checklist (developer-facing)

Before handing a LINE-enabled client off as ready:

- [ ] `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`,
      `LINE_LOGIN_CHANNEL_ID`, `NEXT_PUBLIC_LIFF_ID`,
      `NEXT_PUBLIC_LIFF_MANAGE_ID` are all set for this client (never
      reused across clients).
- [ ] Webhook URL in the console is `https://<domain>/api/line/webhook`,
      "Use webhook" is on, and the console's **Verify** button returns
      `200` (a `401` almost always means the wrong channel secret for that
      channel).
- [ ] Console auto-reply/greeting messages are turned off.
- [ ] `pnpm db:apply-indexes` has been run against this client's database —
      `customers.lineUserId`/`lineChannelDead` won't exist without it, and
      the webhook's customer lookups then fail silently (caught and logged
      in `handlers.ts`, not thrown), so linking/failover appear to work
      (the greeting still sends) while quietly doing nothing underneath.
- [ ] Booking LIFF app's Endpoint URL is
      `https://<domain>/<locale>/line/booking`; manage LIFF app's is
      `https://<domain>/<locale>/line/manage` — both registered under the
      **LINE Login channel**, not the Messaging API channel.
- [ ] Smoke test on a real phone: add the OA as a friend via QR → greeting
      arrives; block the OA → the linked customer's `lineChannelDead`
      flips to `true` in `/admin`; complete a LIFF booking → it appears in
      `/admin` identical to a web-made booking; open the manage LIFF app →
      the just-made booking is reachable and cancellable.

### Common changes

| Want to change... | Edit |
|---|---|
| The `follow`-event greeting text | `site.config.ts` → `reception.greeting` (shared with the web reception widget — see [ai-receptionist.md](ai-receptionist.md)) |
| Booking/manage LIFF page copy (loading/error/confirm-shortcut text) | `apps/clinic-demo/src/messages/{en,ja}.json` under the `liffBooking`/`liffManage` namespaces |
| Which webhook events are handled | `packages/cms-core/src/line/webhook-service.ts` — currently only `follow`/`unfollow` are dispatched; `message`/`postback`/rich-menu-tap events are explicitly out of scope today (stated directly in that file's own comment) |
| How a notification picks LINE vs. email | `resolveNotificationChannel` (notifications module) — the one shared seam; do not add a second, ad hoc `if (customer.lineUserId)` check anywhere else |
| The cancellation cutoff window shown in the LIFF manage page | `site.config.ts` → `booking.cancellationCutoffHours` (shared with the web manage page) |

### Testing locally

There's no LINE sandbox — every test against LINE's own infrastructure hits
real endpoints (see §6). Locally:

- Unit/integration tests exist for the signature check, ID-token
  verification, webhook event handlers, and the customer/manage lookup
  routes (`packages/cms-core/src/line/*.test.ts`,
  `packages/cms-core/src/booking/api/line-*.test.ts`) — run these via the
  package's normal test command before touching anything in this area.
- To exercise the LIFF pages against a real phone during development,
  you need a real LIFF app pointed at a publicly reachable URL (a tunnel
  like ngrok, or a deployed preview) — `liff.init()` will not meaningfully
  function against `localhost` from a real LINE client.

---

## 5. Known issues / gotchas

- **No rich menu exists yet.** This is the single biggest practical gap:
  every button target described in this doc is correct and working, but
  there's currently no rich menu for a real visitor to tap them from. A
  fresh client isn't LINE-bookable in practice until someone designs and
  registers one (see §4).
- **Staff notifications never got a LINE channel.** The customer-facing
  channel-selection refactor (§3E) was completed, but the earlier planning
  document's "staff group chat" pattern (push into a LINE group the OA bot
  has been invited to, since LINE Notify — the obvious tool for this — was
  discontinued in 2025) was never built. Staff "new booking"/"cancelled"
  alerts are still email-only.
- **Blocked-push detection has exactly one source of truth.** LINE's push
  API returns HTTP 200 even when the message silently isn't delivered
  (blocked recipient) — there is no way to detect this from the push
  response itself. The `unfollow` webhook event is the only mechanism this
  codebase relies on to flip `lineChannelDead`. If the webhook is down or
  misconfigured when a block happens, that customer's record won't reflect
  it, and notifications will keep silently going nowhere until something
  else surfaces the problem.
- **LINE display names are never treated as legal names.** `displayName`
  from `liff.getProfile()` is user-chosen (often a nickname, emoji, or
  alias) and is used only as an editable suggestion pre-filled into the
  booking form — never submitted without the visitor confirming/editing
  it, and never written directly to a customer record. Don't "simplify"
  this into an auto-fill-and-submit shortcut later.
- **Message quota is a real, shared cost pool.** Every push (confirmation
  when not sent as a reply, every reminder, every cancellation notice) eats
  into the LINE Official Account's monthly quota, shared with any manual
  broadcasts staff send. Planning-time arithmetic (see
  `docs/STEP2-LINE-CATALOGUE.md`, recovered in §6) estimated the free tier
  (200 messages/month) supports on the order of 60-100 bookings/month
  depending on push count per booking — **this was a planning-time
  estimate, not a measured production number**; re-derive it for a real
  client's actual volume before recommending a pricing tier.
- **Reply tokens expire in roughly a minute.** Anything that needs to be a
  free reply has to be sent essentially synchronously in response to the
  triggering event — there's no way to "save up" a reply token for later.
  This is why the notification dispatcher's LINE channel doesn't attempt
  to use replies at all (§2/§3E), not an oversight.

---

## 6. History

This feature's early planning survives in git history even though the
planning documents themselves were later deleted from the working tree.
`docs/STEP2-LINE-CATALOGUE.md` and its companion `docs/STEP2-AUDIT.md`
(both removed from `docs/` in a later "delete file" commit, but still
recoverable via `git show 46648b0:docs/STEP2-LINE-CATALOGUE.md` against
this repo's history) were read-only, pre-build audits — the second STEP in
a numbered build process — written specifically to verify real LINE
platform facts against current documentation before any LINE code was
written, rather than relying on possibly-outdated assumptions. Some of what
they flagged shaped the build directly:

- They confirmed, by checking LINE's own docs, that **LINE Notify and LINE
  Pay in Japan are both discontinued** (2025-03-31 and 2025-04-30
  respectively) — ruling out what might otherwise have seemed like the
  obvious tools for staff alerts and deposit payments.
- They caught that **LIFF apps must be registered under a LINE Login
  channel, not a Messaging API channel** (a February 2020 platform change)
  — this shaped the "two channels under one provider" structure the actual
  implementation uses.
- They explicitly ruled out a chat-only booking flow, citing this project's
  own prior design principle from the reception system's build ("a
  calendar grid beats a conversation for choosing a time, always") as
  equally applicable to LINE — this held, and LIFF-hosted `BookingFlow`
  reuse is exactly what got built.
- They recommended sequencing LINE work as: foundation (webhook, both
  channels, rich menu, greeting) → LIFF booking → a **notification-channel
  refactor done *before* building the LINE channel**, specifically to avoid
  three call sites each growing an ad hoc `if (customer.lineUserId)` check
  → self-service management → reception chat as a second FSM renderer. The
  channel-selection refactor recommendation was followed — `service.ts`'s
  three notification call sites now route through one shared
  `resolveNotificationChannel` function, not three independent checks.
- Their recommended "smallest slice that proves LINE works end to end" —
  webhook foundation plus a single rich-menu button linking to LIFF
  booking, deliberately deferring notification-channel work — matches how
  the feature was actually sequenced, based on what's built today (webhook
  + LIFF booking + LIFF manage + the channel-selection refactor are all
  live; the rich menu itself, staff LINE alerts, and the reception-chat
  webhook renderer are not).
- Their demo-account reasoning ("LINE has no real sandbox — build a real,
  unverified LINE Official Account for the demo clinic, since an unverified
  account needs no business registration and costs nothing") is presumably
  what this project's demo LINE credentials follow, though this document
  cannot confirm from code alone whether a real OA was actually created for
  this specific demo — that's outside what's recoverable from the
  repository.

**Where the plan and the actual build diverged, honestly:** the clearest
case is the "check my booking" UX (§2/§3D) — the catalogue recommended a
postback-driven Flex Message card; what got built instead reuses the
existing web manage page inside a plain LIFF webview via a URI action. The
practical result for a visitor is nearly identical, but it's simpler code
and a real, working decision that overrode the original plan once
building started. The catalogue also treated Shop Card/Coupon console
setup, holiday-closure broadcasts, and a post-visit rebooking nudge as
low-effort, business-decision-gated items for "after a real client" — none
of them appear in the code today, consistent with that document's own
sequencing rather than being an unexplained gap.

**Not recoverable from code or git history alone:** the exact reasoning
for skipping the reception-chat-over-LINE renderer (webhook-driven FSM,
catalogued as "the highest-value reuse in the whole catalogue" and
estimated at 4-5 days) — it's simply not built yet, and nothing in the
repository states why it was deprioritized relative to what did ship. Also
unconfirmed: whether the demo clinic's actual LINE Official Account is a
real, live account per the catalogue's recommendation, or a placeholder —
worth asking directly rather than assuming.
