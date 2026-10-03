# Pack 4 of 4: Forms, chat, SEO, legal, images and final checks

Steps **J1 to J2, K1 to K2, L1 to L2, M1, N1, O1 to O3**. The rulebook is `docs/WORK-ORDER.md`; do not paste it. Paste **one step block at a time**.

## Before starting (Jamal)

- [ ] Pack 3 is finished and Jamal has signed off Checkpoint 6.
- [ ] Jamal has the old techmirai-ai.com's list of real URLs ready for L1 (the Spec mentions redirecting the old site's "anchors", which cannot be done on a server).
- [ ] Jamal knows the production AI provider for the chat fallback is his decision (decision 10). Development uses whatever the template already uses.
- [ ] Jamal has a plan for who tests email in development: the Resend sandbox only delivers to the Resend account owner's address.

**How to run a pack (every step, every time)**

1. Fresh session for each pack, ideally for each step: type `/clear`, or exit and start `claude` again. (`/clear` should be in the `/` menu; if your version does not list it, exit and restart.) `CLAUDE.md` is re-read each time, so the standing rules are never lost.
2. Check the status bar says `plan mode on`. If it does not, press **Shift+Tab** until it does.
3. Paste the session opener (below) **once per session**.
4. Paste **ONE** step block. Never paste a whole pack.
5. Review the plan with the checklist in section 1.2 of the rulebook. "No, keep planning" if anything is missing.
6. Approve with **"Yes, and use auto mode"** (or "Yes, auto-accept edits" if that is what your account shows). Never bypass permissions.
7. Check every "Done when" item yourself (the browser for anything visual). Then commit by hand: `<step id>: <what changed>`.
8. At every ★, send Jamal: commit hash, a screenshot or two, open questions.

**Session opener** (paste once per session, before the first step block):

```text
Read CLAUDE.md and docs/WORK-ORDER.md sections 1.2, 1.3 and 1.4 (plan checklist, the six common
gates, stop-and-ask triggers). Then wait. I will paste one step at a time. Every step starts in
plan mode: no edits until I approve a written plan. "The six common gates" in a step means
section 1.3.
```

---

**Rules for all build steps** (apart from the common gates in section 1.3 and the standing rules in section 1.5 of `docs/WORK-ORDER.md`):

- Reuse an existing block when it fits. Add a new block only when configuration cannot do the job. New blocks follow the repo's existing block pattern (project notes call it four files: config, types, adapter, component).
- Content comes from the Spec only. Copy English and Japanese exactly. Where a string has brackets, keep them (section 5).
- Japanese copy is never edited by the developer or by ECC. Haruka reviews all of it before launch.
- Each prompt below is the text to paste, **one at a time**, after the plan-mode setup in section 1.1 of `docs/WORK-ORDER.md`. Each already starts with the plan-first line.
- Page numbers refer to the Spec PDF.

---

### Phase J: Forms and booking

#### J1. Free AI Website Assessment form (Spec 12.1 to 12.3, pp.64-68)

```text
Plan only. Make no edits until I approve.
STEP J1 — /assessment form and emails. Read: Spec p.64-68.
Do: page copy; the "what you receive" sample-report card (a labelled "Sample" mock report using demo
data); the four "what happens next" steps; the form with the fields, types, options and required flags in
the Spec table (website address, company, name, email, phone, industry, current booking system, LINE
account yes/no/not sure, main problems (multi-select), preferred contact, message, privacy consent
checkbox linking to /privacy); the three error messages in both languages; on success go to /thanks
with the Spec's thank-you text; the auto-reply email in English or Japanese by the visitor's locale
(subject and body as in the Spec, with {name} and {url}); a staff notification email to
info@techmirai-ai.com (the Spec names this recipient for booking notifications; use it here too and
add a register row so Jamal confirms it). Use the existing forms pipeline with its rate limit and spam protection.
In development, email goes wherever the repo's Resend sandbox setup allows (the sandbox delivers
only to the Resend account owner); the plan must say how.
Done when: the six common gates (section 1.3) pass; submitting the form stores the submission, sends both emails (to the sandbox
address) and lands on /thanks; each error message shows in the right language; no field is
required that the Spec does not mark required.
```

#### J2. Consultation booking, repurposed from clinic booking (Spec 12.4, pp.69-70)

```text
Plan only. Make no edits until I approve.
STEP J2 — Consultation booking. Read: Spec p.69-70.
Do: bookable services: consult-online ("Free online consultation", 30 min), demo-walkthrough
("Live demo walkthrough", 30 min), voice-demo ("AI Reception Voice demo", 30 min), visit
("[In-person consultation — CONFIRM area and who visits]", [60 min]). Relabel the clinic's
初診/再診 (first visit / return visit) choice to "First time with us / Existing client" (Japanese
text in the Spec). Booking steps and labels as in the Spec table. Add the company field. Make kana
optional when the locale is English ("Name in kana (optional for English users)") and keep it required
in Japanese. Confirmation, reminder, cancellation and staff-notification texts as in the Spec,
sent to the customer by email and to info@techmirai-ai.com for staff. Confirmation says the
meeting link comes by email before the call; the meeting tool (Google Meet, Zoom or Teams) is a
CONFIRM item, so leave a bracket. Seed demo slots on weekdays in the [9:00-18:00] window. LINE
booking stays switched off (decision 6). The chat button "Book a call" must open this booking
inside the chat (see K2).
Done when: the six common gates (section 1.3) pass; a full booking, confirmation, reschedule and cancel works end to end in
English and Japanese, including with no kana in English; double-booking the same slot is impossible
(existing concurrency tests still pass); the staff email arrives; no clinic wording remains in any
booking text.
```

### Phase K: Reception chat (Spec Section 16, pp.87-98)

#### K1. Chat content: greeting, buttons, matched answers

```text
Plan only. Make no edits until I approve.
STEP K1 — Chat content. Read: Spec p.87-96.
Do: replace the clinic reception flow with a TechMirai flow in the reception engine's flows folder,
following the pattern the clinic flow used. Greeting with the "Automated assistant" tag and the
always-visible "Talk to a person" link; the six-button menu B1 to B6 with sub-buttons B1a, B1b and
B4 (clinic, beauty, auto, hotel, other), each answer and its "next buttons" exactly as in the Spec;
the 36 matched answers (F01-F26 from the FAQ collection plus C01-C10 chat-only answers) with the
keywords for matching. Buttons open pages in a new tab where the Spec says so. "Book a call" mounts
the booking flow inline. "Send my website" goes to /assessment.
Text lives in the CMS where the engine supports it (the Spec says to load buttons and answers into
the CMS exactly as written); the plan states what is in code and what is in the CMS.
Done when: the six common gates (section 1.3) pass; every button leads to the right answer and next buttons in both languages;
typing each FAQ question returns its answer; "Book a call" completes a booking from inside the chat;
no clinic wording remains in the chat.
```

#### K2. AI fallback rules, hand-off, out-of-hours, test script ★

```text
Plan only. Make no edits until I approve.
STEP K2 — Fallback, hand-off, test script. Read: Spec p.96-98.
Do: configure the AI fallback with all 13 rules in Spec 16.4 (for example: answer only from the
pages listed in 16.6; never state prices except the published starting prices; never say the voice
edition is available; never promise an integration; no legal, tax, medical or subsidy advice; never
invent clients or quotes; reply in the visitor's language; three sentences maximum and end with one
button; say it is automated when asked; do not repeat personal data; apologise and hand over for
complaints; politely redirect unrelated topics). Hand-off (16.5): during hours, outside hours
(using the hours in config) and "AI does not know". Mark the pages in 16.6 as visible to the AI
(including /privacy and blog posts only after Japanese review) and exclude /thanks, forms and drafts.
Turn the 15-row test script in Spec 16.7 into automated tests for every row in English and Japanese.
Tests assert structure (which answer id matched, which buttons showed, that no price or promise
appears), not the exact wording of LLM replies. Rows that depend on LLM output are also run by hand
and recorded in the report.
Stop and ask Jamal if typed-question matching (layer 2) does not exist in the engine: building it is
engine work beyond this clone.
Done when: the six common gates (section 1.3) pass; all 15 rows pass in both languages; asking for a person at 23:00 returns the
out-of-hours message; the LLM key is read from the environment and no key is in the repo.
```

★ **Checkpoint 7** (after K2): a screen recording of the chat doing the 15 test-script rows.

### Phase L: SEO and GEO (Spec Section 17, pp.98-107)

#### L1. Metadata and technical SEO

```text
Plan only. Make no edits until I approve.
STEP L1 — Metadata and technical SEO. Read: Spec p.98-103.
Do: title and meta description for every page in both languages from the table in 17.1; one
sitemap.xml listing both /ja and /en URLs; hreflang ja, en and x-default (pointing to /ja) on every
page; a self-referencing canonical per locale; noindex on /thanks and form-result pages; one H1
per page with headings in order; the production robots.txt text from Spec p.103 (guarded by the D2
environment switch); /llms.txt from p.106-107; 301 redirects for the old legal paths
(/legal/privacy.html, /legal/terms.html, /legal/tokutei.html) to the new paths.
Stop and ask Jamal: the Spec also mentions redirecting the old site's "anchors". A URL fragment
(the part after #) never reaches the server, so it cannot be redirected. Ask for the old site's
list of real URLs.
Done when: the six common gates (section 1.3) pass; a crawl of every route in both locales shows one H1, a unique title, the
right canonical and hreflang; sitemap lists every public URL in both languages; the redirects return
301.
```

#### L2. Structured data, GEO and share images

```text
Plan only. Make no edits until I approve.
STEP L2 — Structured data and share images. Read: Spec p.103-107, p.111-113.
Do: Organization and WebSite JSON-LD in the site-wide layout; Service on /ai-reception and /pricing;
FAQPage on /faq (one entry per question in the page language); BlogPosting on posts; BreadcrumbList
on industry pages, posts and the case study. All values come from config. Any bracketed value
is OMITTED from the output rather than shown with a placeholder, and gets a register row. The founder
property follows the founder switch. Put the canonical company-facts sentences from 17.4 on the
About page, in the schema description and in the chat's company answers, word for word. Every page
starts with a direct one-sentence answer where the Spec's copy does. Share images: 1200 x 630,
one per page, page title in the page's language. The plan must say how Japanese text will be drawn in
the images (font file needed) and whether images are generated or static.
Done when: the six common gates (section 1.3) pass; the JSON-LD validates (Google's Rich Results Test and validator.schema.org,
run on the deployed preview by Jamal or the developer); no JSON-LD output contains a bracket;
switching the founder off removes the founder property.
```

### Phase M: Legal pages (Spec Section 18, pp.107-111)

#### M1. Privacy policy, terms of use, legal notice

```text
Plan only. Make no edits until I approve.
STEP M1 — /privacy, /terms, /legal. Read: Spec p.107-111.
Do: create the three pages in both languages using ONLY the headings in the Spec table on p.111
(privacy: business information, information we collect, purposes, outside services, data outside
Japan, security measures, your requests, contact, updates; terms: scope, content and copyright,
prohibited acts, disclaimer, changes, governing law; legal notice: seller, representative, address,
phone, email, prices, other fees, payment, delivery, cancellation). Under each heading put one
clearly marked placeholder: "[PLACEHOLDER: wording to be written by a professional. Do not
launch with this text.]" Do NOT write legal text. Pull the business details that are known (name,
email, phone) from config. Link the consent checkbox and the footer to these pages.
Also confirm the code-side compliance items: the chat says it is automated on every page (item 8);
the clinic page and demo are labelled fictional (item 7); no analytics or cookies are added (item
11, Jamal decides).
Done when: the six common gates (section 1.3) pass; each page has exactly the Spec's headings in both languages; the launch scan
flags the placeholder bodies (that is expected); no legal prose written by ECC.
```

### Phase N: Images and alt text (Spec Section 19, pp.111-113)

#### N1. Image slots, alt text, QR code

```text
Plan only. Make no edits until I approve.
STEP N1 — Image slots and alt text. Read: Spec p.111-113.
Do: a table (in docs/IMAGE-SLOTS.md) of every image on the site: slot, size, page, placeholder file,
real asset needed, who supplies it. Alt text in both languages for every image, using the examples
on p.113 as the model; decorative images get empty alt. The phone mockup, three-step strip,
before/after illustration, layers diagram, admin screenshot and sample report each have a labelled
slot. The QR code is generated from the demo URL in config. Logo as SVG plus a square favicon.
Done when: the six common gates (section 1.3) pass; every image has alt text in both languages; the launch scan reports every
remaining placeholder image; docs/IMAGE-SLOTS.md is complete.
```

### Phase O: Final checks and handoff

#### O1. Whole-site sweep

```text
Plan only. Make no edits until I approve.
STEP O1 — Whole-site sweep. Read: Appendix B in docs/WORK-ORDER.md.
Do: run the launch scan and the normal preflight. Crawl every public and legal route in /ja and
/en. Report: (a) every remaining bracket placeholder grouped by register ID; (b) any leftover
clinic or old-site wording; (c) any English text on a Japanese page and any Japanese text on an
English page; (d) any banned claim, old price or avoid-list word, each either fixed or allow-listed
with a written reason; (e) every route that returns an error. Fix (b) to (e). Do not fix (a): those
need Jamal's answers.
Done when: the launch scan fails only on register items; the report lists them with their IDs.
```

#### O2. Tests, accessibility, build

```text
Plan only. Make no edits until I approve.
STEP O2 — Tests, accessibility, build.
Do: run typecheck and all test suites; update tests whose expectations changed with the content
(never delete or weaken); run the accessibility check script (project notes say a Playwright and
axe script exists but was not wired into package.json and used a path list without locale prefixes;
wire it up and test both locales); run `next build`; run /quality-gate and /code-review. Fix real
findings. Log anything outside scope in docs/FINDINGS.md.
Done when: typecheck, tests and build pass; the accessibility check has no serious violations on any
route in either language, or each is listed with a reason; /code-review and /quality-gate reports are
saved in docs/.
```

#### O3. Handoff documents ★

```text
Plan only. Make no edits until I approve.
STEP O3 — Handoff.
Do: rewrite the README for this project (what it is, how to run it, how to seed, how to reset the
database, the environment variables by name only, the launch gate). Update the deploy runbook the
template already has so Jamal can deploy from it (the template's earlier practice: you prepare, Jamal
deploys). Write docs/HANDOFF.md: what is built, route list, the count of open placeholders by owner,
known issues, the contents of docs/ENGINE-FIXES.md and docs/FINDINGS.md, and anything not done. Do not
write any real secret into any file, including .env.example.
Done when: a person who has never seen the repo can run it from the README; .env.example contains
names only; HANDOFF.md lists every open item.
```

★ **Checkpoint 8 (final):** push the branch and tell Jamal. Jamal reviews against section 8.

---

**Pack 4 is finished when Checkpoint 8 is signed off and Jamal has reviewed the definition of done (rulebook section 8).**
