# Pack 3 of 4: Homepage, product, industry and business pages

Steps **G1 to G4, H1 to H3, I1 to I4**. The rulebook is `docs/WORK-ORDER.md`; do not paste it. Paste **one step block at a time**.

## Before starting (Jamal)

- [x] Pack 2 is finished. Jamal has signed off Checkpoint 4 and has answered the header behaviour question. (Signed off 2026-10-05 — see `docs/FINDINGS.md` "Checkpoint 4: header-behaviour decision signed off by Jamal". Note: F1-F3 still need to be planned/executed before Pack 2 is fully closed per `docs/packs/PACK-2-FOUNDATION.md`'s own closing line.)
- [ ] Jamal knows that copy written from the Spec is a first load only. Haruka's Japanese review and the Director's sign-off on homepage, positioning and pricing happen before launch, not in these steps.

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

### Phase G: Homepage (Spec Section 5, pp.19-33, 14 sections in the director's order)

For each step, the Spec has the exact English and Japanese text per element. Where the Spec says "reuse the clinic hero", the plan confirms what the existing hero block can do.

#### G1. Hero, problem, before/after (5.1 to 5.3)

```text
Plan only. Make no edits until I approve.
STEP G1 — Homepage part 1. Read: Spec p.19-23.
Do: build 5.1 Hero (logo top-left, headline, contained image; the clinic's opening-hours card
becomes the "who answers, and when" card; right column with language switch, Call and LINE, 2x2 nav
cards from the shared nav source, main button, first-time-visitors card with Haruka; channel chips;
trust line; chat pointer; phone-mockup image slot with alt text in both languages), 5.2 Problem
(heading, intro, journey strip, six cards, navy band, closing line), 5.3 Before/After table.
Done when: the six common gates (section 1.3) pass; the hero shows at phone width without horizontal scroll; the 10-second
test from Spec p.11 holds on a phone (what it is, what it does, proof it is real, who we are, one
next step); text matches the Spec in both languages.
```

#### G2. What AI Reception does, live demo, industries (5.4 and 5.5)

```text
Plan only. Make no edits until I approve.
STEP G2 — Homepage part 2. Read: Spec p.23-27.
Do: 5.4 (six capability cards with status badges, the badge row, and the "AI does not replace your
staff" two-column block), 5.5 (live demo block: checklist, "Open the live demo" button to
[demo.techmirai-ai.com], QR code for desktop only that encodes the same URL from config, small
print "[Demo clinic name] is a fictional clinic created for this demo", and six industry tiles: four
link to the industry pages, Restaurants and Real estate link to /contact with the label "Ask us").
Done when: the six common gates (section 1.3) pass; the voice card says "In development" and never "available now"; the QR code
is generated from the config URL (change the URL, the code changes); tile links resolve.
```

#### G3. Tools, process, case study, pricing, security (5.6 to 5.10)

```text
Plan only. Make no edits until I approve.
STEP G3 — Homepage part 3. Read: Spec p.27-31.
Do: 5.6 three columns (works out of the box / case by case / if it cannot connect); 5.7 six
implementation steps with the "[X weeks]" placeholder; 5.8 Sadiatec case-study card behind its
visibility switch (permission pending); 5.9 starter-package pricing card with the bracketed
prices and "[Tax wording]"; 5.10 five security-and-support points.
Done when: the six common gates (section 1.3) pass; no figure other than the bracketed starter prices appears; the case-study
card disappears when its switch is off and the card's button never links to a hidden page.
```

#### G4. Team, PoC, FAQ, final call to action (5.11 to 5.14)

```text
Plan only. Make no edits until I approve.
STEP G4 — Homepage part 4. Read: Spec p.31-33.
Do: 5.11 company and team (intro, three bullets, five cards: Jamal Shah, Abdullah Al Maruf, Haruka
Fujimori, Nahida Rahaman, and the Sadiatec partner card; photos are labelled placeholders; the
Japanese name for Haruka stays as the bracketed form in the Spec; each card honours its visibility
switch); 5.12 PoC strip; 5.13 six FAQ items F01, F07, F03, F14, F17 and F22 pulled from the FAQ
collection (not copied) plus the "See all questions" link; 5.14 final call to action with the
contact strip.
Done when: the six common gates (section 1.3) pass; turning the founder switch off removes the founder from this page (and the
plan lists the other pages that still need to follow in later steps); the six FAQ items change when
the FAQ source changes.
```

★ **Checkpoint 5** (after G4): screenshots of the whole homepage in both languages at desktop and phone width.

### Phase H: Product and industry pages

#### H1. AI Reception product page (Spec Section 6, pp.33-37)

```text
Plan only. Make no edits until I approve.
STEP H1 — /ai-reception. Read: Spec p.33-37.
Do: hero; "seven things it does"; Web edition (badge "Available now", way to start A, way to start B
as a CONFIRM item that can be hidden); Voice edition (badge "In development · Demo available", the
callback sentence marked CONFIRM, button "Request a voice demo" linking to the voice-demo booking);
short "how answers stay accurate" block linking to /how-it-works; "who it is for"; closing call to
action from 5.14.
Done when: the six common gates (section 1.3) pass; voice is labelled "In development" everywhere on the page; the voice demo
button leads to the booking step (stub acceptable until J2).
```

#### H2. Solutions hub and the four industry pages (Spec Section 7, pp.37-45)

```text
Plan only. Make no edits until I approve.
STEP H2 — /solutions and /solutions/{clinic,beauty,automobile,hotel}. Read: Spec p.37-45.
Do: one industry-page template: hero, four problems, what AI Reception does, an example chat, what
staff still handle, three FAQs, call to action. Example chats keep the Spec's bracketed business
details and carry the label "Example conversation. Details are illustrative." (Japanese label in
the Spec.) The clinic page has the "Open the live clinic demo" button, says the demo clinic is
fictional and gives no medical advice (the symptoms example hands over to staff and mentions the
emergency number). Hub: intro, links to the four pages, "Don't see your industry?" line.
Done when: the six common gates (section 1.3) pass; four pages render from one template; the example label appears on every
example chat; no page claims results or numbers.
```

#### H3. How It Works and Integrations (Spec Section 8, pp.45-51)

```text
Plan only. Make no edits until I approve.
STEP H3 — /how-it-works and /integrations. Read: Spec p.45-51.
Do: How It Works: four answer layers, the accuracy callout, the "customers are told it is an
automated assistant" note, the five-step customer journey, "what your staff see", the six setup
steps with a "what we need from you" column, the under-table line, and the layered-answers diagram
(redraw as inline SVG in brand colours; the Spec p.50-51 describes it: four steps, with the
"Talk to a person" route open from every step). Integrations: intro, the honest status table with
four statuses (Available / Case by case / In development / Not offered), CONFIRM markers kept, and
the bottom line.
Done when: the six common gates (section 1.3) pass; the diagram has a text alternative in both languages; every row shows one of
the four statuses; nothing promises an integration.
```

### Phase I: Business pages

#### I1. Pricing and Security & Support (Spec Section 9, pp.51-56)

```text
Plan only. Make no edits until I approve.
STEP I1 — /pricing and /security. Read: Spec p.51-56.
Do: one starter package with "from" prices in brackets, no tiers, the included and excluded lists,
the options table (including the CONFIRM markers), "what changes the price", the pricing FAQ
(minimum contract, payment, what happens if you stop), and the tax-wording placeholder. Security:
"accurate answers" and "bookings" lists, the personal-information table (what we collect, why, who
can see it, where stored, AI providers, how long, rules) with every CONFIRM kept, and the support
table. Pricing shows no "was/now" prices and none of the old prices.
TRUTH CHECK for the Security page: the Spec says it "states only what the system actually does
today". For each statement (no double bookings, private manage link, spam protection and request
limits, HTTPS, AI only from published content, automated-assistant label), the report names the
evidence in the repo. Project notes say the rate limiter is in-memory with a documented
serverless limitation, so "request limits" and the rate-limiting row on the Technology page need
checking; if the evidence is weaker than the sentence, mark it [CONFIRM] and add a register row.
Done when: the six common gates (section 1.3) pass; the launch scan finds no old prices; every CONFIRM from these pages is in the
register; the evidence table is in the report.
```

#### I2. About (Spec Section 10, pp.56-61)

```text
Plan only. Make no edits until I approve.
STEP I2 — /about. Read: Spec p.56-61.
Do: in order: hero, founder message (it is marked DRAFT for Jamal; seed it as written and add a
register row; keep the optional personal-sentence slot as an empty bracket), four promises, team
with full bios (each person approves their own bio, photo and the name in katakana or kanji; the
fifth entry is the "[New engineer]" placeholder), partner (Sadiatec with the clarity line marked
CONFIRM), company profile table (use the existing company-profile block or a generic key-value
block; fields from Spec 10.6; every bracketed value stays bracketed).
Done when: the six common gates (section 1.3) pass; the founder switch hides the founder message, bio, photo and profile row on
this page; the canonical company-facts sentences from Spec 17.4 appear on the page exactly as written.
```

#### I3. Technology and the Sadiatec case study (Spec Sections 11 and 13, pp.61-64 and 70-73)

```text
Plan only. Make no edits until I approve.
STEP I3 — /technology and /case-studies/sadiatec. Read: Spec p.61-64, p.70-73.
Do: Technology: hero, "what we can test" (four areas), how a PoC runs (five steps), "why our
websites are built differently", and the stack table. THE STACK TABLE MUST BE TRUE: generate each row
from what package.json and env usage prove (framework, CMS, styling, database, media storage,
i18n, search, AI, voice, email, rate limiting, monorepo). Keep the Spec's [CONFIRM] on the AI and
voice rows. Any row the repo cannot prove gets [CONFIRM] and a register row, even if the Spec states
it as fact. Case study: a new simple page (the clinic template removed its case-study routes) with
summary, at-a-glance table, before, what we built, what it means, empty client-comment slot, "what
came next", call to action. No prices. Screenshot slots are labelled placeholders. The whole page
sits behind the case-study visibility switch.
Done when: the six common gates (section 1.3) pass; a table of "stack row / evidence from the repo" is in the report; the client
comment is empty; no prices on the case study.
```

#### I4. FAQ, blog, contact, thanks (Spec Sections 14 and 15, pp.73-87)

```text
Plan only. Make no edits until I approve.
STEP I4 — /faq, /blog, /blog/[slug], /contact, /thanks. Read: Spec p.73-87, and p.16 for the contact and thanks entries.
Do: FAQ page: 26 questions in six categories, keeping ids F01-F26 stable (the homepage and the
chat use them). Blog: index (intro, categories, byline format, end-of-post box, related posts) and
the three launch posts in full: front-desk checklist, "can you trust AI with your customers",
"serving foreign customers without English-speaking staff". Bylines show author and reviewer
(both CONFIRM). Posts are seeded with the "AI may read" flag OFF until Haruka's Japanese review is
done. The editorial calendar (Spec 15.5) goes into docs/ as a plain file, not into the site.
Contact: the Spec gives only the title and description (p.102), not page copy. Build the page
with the shared contact form pipeline, the contact details from config, and the visible placeholder
"[TBD: contact page copy]" with a register row. Thanks: the assessment thank-you from Spec 12.3,
noindex, reachable only after a form.
Done when: the six common gates (section 1.3) pass; F01-F26 appear exactly once each with the right category; blog posts render
with bylines; /thanks sends a noindex signal; the contact form submits.
```

★ **Checkpoint 6** (after I4): send Jamal the list of all pages built and the register so far.

---

**Pack 3 is finished when Checkpoint 6 (after I4) is signed off.** Next: Pack 4.
