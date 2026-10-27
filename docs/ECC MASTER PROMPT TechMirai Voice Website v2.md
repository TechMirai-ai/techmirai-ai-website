# ECC MASTER PROMPT v2 — TechMirai: voice-first Japanese B2B website (launch scope)

Paste everything below the line into Claude Code (ECC) at the root of the TechMirai website repository.
Every Japanese term is followed by its English meaning in [brackets]. The brackets are for the owner, not site copy. Japanese copy marked DRAFT must be reviewed by a native Japanese speaker before launch.

---

## 0. Role and mission

Act as the project owner and, together, as: senior Japanese B2B product strategist, UX architect, conversion copywriter, SEO/GEO specialist, motion designer and principal frontend engineer.

Mission: turn the existing TechMirai website into a focused Japanese B2B product site with ONE offer: an AI voice agent for call centers and phone desks, sold mainly through white-label partnerships with small and medium-sized call centers. Illustration-led and animated, very little text on the home page, detail on inner pages.

Do not redesign from zero. Do not re-ask questions answered here. Inspect first, preserve what is good, keep every change reversible.

## 1. Hard rules

- Never fabricate capabilities, customers, case studies, results, statistics, testimonials, ratings, awards, certifications, integrations, pricing or production readiness. If the repo does not prove it, label it: working / partial / demo / integration required / planned / consultation option.
- Never mention PBX, PBX compatibility or "no PBX changes" anywhere on the site. Do not claim the service works on a customer's existing phone number. The phone connection is discussed in consultation only.
- Never mention Bangladesh or any specific country for the engineering team. Describe it only as an international engineering team. No national-flag colors or motifs.
- Never name any current or past employer of any team member. No "No.1", "100%", "perfect", or "replaces operators" (this also risks 景品表示法 [Act against Unjustifiable Premiums and Misleading Representations]).
- Position AI as supporting human operators (fewer missed calls, less workload), never replacing people.
- Unconfirmed commercial terms (OEM, white-label pricing, revenue share, PoC fees, founding-partner benefits) appear only as placeholders or "consultation options". No public prices.
- Every real person shown (photo, video, name, role) needs written consent, noted in the repo's content notes. Build a CMS switch to hide any individual. No consent = placeholder.
- Never expose secrets or personal data. Create a reversible checkpoint (branch plus tag) before changing anything. No force-pushes.

## 2. Data security and privacy (applies to every page)

- No personal data in logs beyond what the privacy policy states. Redact phone numbers, emails and names in application logs and analytics events.
- Before any demo call starts: a clear recording and transcription notice (what is recorded, why, how long it is kept, who can see it). The visitor must actively agree before the microphone opens.
- Every form (contact, demo, requirements, PDF download): a consent checkbox, unchecked by default, plus a link to /privacy. No submission without consent.
- Rate-limit and sanitize all inputs. Defend the chatbot and voice demo against prompt injection; answers come only from approved content.
- The public demo must only show the visitor their own call. No lookup of other callers by phone number or any other field on public pages.

## 3. Phase 1 — Inspect and audit (before any design)

Audit the full repository: routes, components, chatbot, voice demo pages, FAQ/RAG, interactive website features, LINE and other integrations, analytics, SEO, structured data, security, tests, deployment, responsive design, CMS content, and existing URLs with search value.

Before implementing, deliver: concise audit; component / route / SEO / integration inventory; feature-status matrix (working / partial / demo / integration required / planned); risks; missing information.

Owner's notes to VERIFY against the repo (they may be out of date; the repo wins):
- The voice product is a separate project (techmirai-voice-premium) with a public browser-call demo at /talk/<clientId>/<language> (Japanese and English), a per-visitor call cap, call logs with summary and status, a staff dashboard behind login, and returning-caller continuity. Its demo deliberately accepted some data-exposure limitations for testing; those are NOT acceptable on the public company site (see section 2).
- Demo businesses: a fictional 整骨院 [bone-setting clinic] and a planned fictional gas-utility call-center (BPO) demo. Confirm which exist and are live.
- Not built as far as the notes say (verify, then label honestly): real phone-line connection, live transfer to a human operator, real caller-ID capture, CRM/LINE/email/Slack/Teams notifications from the voice agent.
- The per-call duration cap was removed for internal testers. Propose a sensible limit for public visitors and flag it for the owner.
- The website engine is the existing Next.js + Payload CMS clone; keep that stack unless the audit proves a blocker.

## 4. Phase 2 — Research

Study current Japanese and international voice-AI / B2B SaaS sites: AIRI, Daisybell, Callix, IVRy AI Contact Center, KARAKURI voice agent, AI Worker VoiceAgent, PKSHA VoiceAgent, Cresta Japan, Sierra. Analyze hero clarity, audience, CTA, demos, illustrations, problem-to-solution story, human handoff, trust, partnerships, mobile UX. Adapt patterns; never copy content, assets or layouts. Report TechMirai's honest differentiation, led by the white-label partner model, and the claims TechMirai must avoid.

## 5. Positioning and audience

- Primary: small and medium-sized Japanese call centers and BPO operators as white-label partners. They bring customers, call flows and operators; TechMirai brings voice AI, conversation design, approved knowledge (FAQ/RAG), customization, dashboard and technical support.
- Secondary (at most one line on the home page): businesses with repetitive, busy-period or after-hours calls.
- The launch site is voice agent plus partnership only. Older products and PoCs stay at their current URLs (section 9) but are not promoted.

## 6. Navigation and home page (/)

Navigation: no "Home" item. The logo links to /. Items: Demo, Partners, Company, Contact, plus a primary button to the demo. Language switch Japanese/English. Mobile: same order, with a sticky bottom bar (Demo, Contact).

The home page has exactly 6 sections. The demo and a CTA must be reachable within the first two screens on a phone (hero buttons plus the sticky bar). A visitor must understand what TechMirai sells, who it is for and why it matters within 5 seconds, and in no case more than 10.

1. **Hero**
   - Product label: 「コールセンター・電話窓口向け AI音声エージェント」 [AI voice agent for call centers and phone desks]
   - Headline: 「電話が集中する時間も、営業時間外も。AIが一次対応を支えます。」 [Even when calls surge, even outside business hours, AI supports first-line response.]
   - Supporting line, which must include the white-label partner model (DRAFT): 「定型的な問い合わせ・混雑時・営業時間外の電話にAIが一次対応し、通話を記録・要約して、必要な対応はスタッフへ。コールセンター事業者様は、自社サービスとして提供できます。」 [AI gives first-line response to routine, busy-time and after-hours calls, records and summarizes them, and passes what needs a person to staff. Call-center operators can offer it as their own service.]
   - Buttons: 「音声デモを体験する」 [Try the voice demo] → /demo, and 「協業について相談する」 [Consult about partnership] → /contact (partnership path).
   - Visual: animated call flow, not a stock photo.
2. **Problems**: four illustrated cards: overflow and waiting, missed after-hours calls, repetitive inquiries, incomplete callback information. One short line each.
3. **How it works**: one animated call flow (customer calls → operators busy or after hours → AI answers from approved knowledge → AI records, transcribes and summarizes → complex or sensitive cases go to a person) plus the next-morning dashboard (caller details, transcript, summary, urgency, callback status, recommended action). Use real dashboard screenshots with dummy data, labelled as demo data. Include one compact AI-vs-human responsibilities strip. AI: repetitive questions, initial reception, approved guidance, after-hours capture, callback scheduling. People: complaints, sensitive information, exceptions, negotiation, uncertain identity, complex judgment, high-risk transactions. No PBX or connection-method wording.
4. **Live demo**: short teaser with the button to /demo, and what the visitor will see (call, transcript, summary).
5. **Partnership and PoC**: the white-label model in one line, the four-step PoC flow (section 8), and a link to /partners.
6. **Final CTA**: the two inquiry paths and the 稟議 [internal approval] PDF download.

## 7. Visual and motion direction

- Keep the existing brand green as primary (exact values from the current site or brochure source; do not guess). Accents only from the existing brand palette. No flags or national symbols.
- One original, modern, calm, professional illustration style. No childish art, cyberpunk, generic robots or AI brains, excessive gradients, unrelated stock photos, fake brands or fake metrics.
- Motion is purposeful: it explains the call flow and the dashboard. Animate transform and opacity where possible. Choose the lightest tool that fits the stack from: CSS (including scroll-driven animation, if browser support is acceptable), Motion (formerly Framer Motion), GSAP with ScrollTrigger, Lottie/dotLottie, Rive. Verify current versions, licenses, bundle size and API names in the current documentation; do not invent APIs.
- Respect prefers-reduced-motion with static illustrations. Any animation longer than 5 seconds needs a pause control. No autoplay audio. Server-render all text.
- Team media (on /company only): short, light, muted video clips of the team at work (target 6–12 seconds, poster image, lazy loaded, captions if anyone speaks). Team photos are static by default; on click/tap, play a 2–3 second clip of that person with a gentle smile. Prefer clips the person recorded. Never generate or animate a real person's likeness with AI without that person's written consent and a visible note. Static fallback always.
- Build each home-page section as a reusable component so the sections can later be reused elsewhere (see section 10).
- Performance: good LCP, CLS and INP on a throttled mid-range phone; stable layout; AVIF/WebP; minimal JavaScript. Drop any flourish that measurably hurts performance.

## 8. PoC (used on / and /partners)

PoC flow, replacing any earlier five-step flow:
**Validate → Measure → Decide → Production Development**
DRAFT Japanese labels: 検証 [Validate] → 効果測定 [Measure the effect] → 導入判断 [Decide on adoption] → 本番開発 [Production development].

Typical PoC scope. Show each item as a clearly marked placeholder; the owner confirms the real details:
- Target task: [one call type, e.g. after-hours inquiries for one partner client]
- Duration: [X weeks]
- TechMirai delivers: [voice agent configured for the task, approved-knowledge setup, call logs and summaries, dashboard access, test support, evaluation report]
- Partner provides: [one target client or process, call flows and FAQ/manual, test callers or operators, success criteria, a contact person]
- Suggested evaluation measures (no results claimed): response rate, completion rate, transfer rate, callback rate, incorrect-answer rate, missed-call reduction, handling time, after-call work, operator review, abandonment.

## 9. Launch pages (6 plus privacy)

| Route | Content |
| --- | --- |
| / | AI voice agent home: the 6 sections in section 6 |
| /demo | Live voice demo (maximum three scenarios: Reservation/ Booking, busy-time first reception, FAQ/callback request), recording and transcription notice before start, consent, then the visitor's own transcript and summary shown in a dashboard view. Label live AI versus scripted simulation; label demo businesses as fictional; audio fallback; abuse and cost limits |
| /partners | White-label partnership model, founding partner program (benefits and conditions as placeholders for the owner), PoC flow and typical scope (section 8), partner and TechMirai responsibilities |
| /company | Team (consented photos and clips, roles, "international engineering team"), company profile with placeholders for legal name, representative, address and registration where not confirmed |
| /contact | Two inquiry paths: 「AI音声エージェントの導入を相談する」 [Consult about adopting the AI voice agent] and 「協業について相談する」 [Consult about partnership]. Short form (name, company, role, email or phone; optional: call volume range, hours to cover, languages, goal), consent checkbox, privacy link. 稟議 [internal approval] PDF download: a 1–2 page overview generated from site copy (what it is, how it works, PoC flow, privacy summary, contact), with placeholders for the owner to review |
| /privacy | Privacy policy covering forms, demo recordings, transcription, retention, access and contact. Placeholders where legal details are unconfirmed; mark for professional review |

Site chatbot (TechMirai's own reception chat), where it already exists: answers only from approved launch-page content, can collect the same requirements as the /contact form with the same consent rule, and always shows a path to a person. Never promise a response time unless the owner confirms it.

Existing pages and old PoCs: keep them live at their current URLs and indexable so their search rankings are not lost. Remove them from the main navigation; keep at least one internal link (e.g. a footer link) so they are not orphaned. No redirects or moves in this pass.

## 10. Private (owner still deciding)

/presentation: do NOT build in this pass unless the owner confirms. If confirmed: a full-screen route that steps through the home-page section components one at a time (keyboard arrows and buttons) for sales meetings; noindex, excluded from the sitemap, not linked in navigation.

## 11. Add later (do not build now; do not create empty pages or nav links)

- /security: data flow, retention, voiceprints, access, downloadable security checklist.
- /resources (including news): only when articles can be published regularly, e.g. after-hours call handling, AI and customer-harassment measures.
- /technology: move old PoCs here after launch, with proper redirects at that time.
- /use-cases as a full page: when there are more scenarios or a real pilot to describe.
- /pricing: after pricing is decided.

## 12. SEO and GEO (launch pages only)

Natural topics, no keyword stuffing: AI音声エージェント [AI voice agent], コールセンター AI [call-center AI], 電話対応 AI [AI phone handling], AI電話自動応答 [AI automatic phone answering], ボイスボット [voice bot], コールセンター自動化 [call-center automation], あふれ呼対策 [overflow-call countermeasures], 営業時間外電話対応 [after-hours phone handling], 夜間・休日電話受付 [night and holiday phone reception], 通話自動要約 [automatic call summarization], コールセンター人手不足 [call-center staff shortage], 電話取りこぼし対策 [missed-call countermeasures], 音声AI PoC [voice AI proof of concept], コールセンターDX [call-center digital transformation].
Verify: unique titles and descriptions, one H1 per page, headings, canonicals, OG metadata, sitemap (launch pages plus kept old pages; never /presentation), robots (production must allow indexing), breadcrumbs, alt text, Japanese language tags, 404, server-rendered content, Core Web Vitals.
Structured data only where true and present: Organization, WebSite, Service, BreadcrumbList, ContactPoint, VideoObject (only for real published videos). No FAQPage, Article, reviews, ratings, pricing or awards until that content exists.
GEO: each launch page opens with a 2–3 sentence, answer-first summary (what it is, who it is for, what happens next), a last-updated date and the responsible company. Add llms.txt only if appropriate; it does not replace normal SEO.

## 13. Accessibility, security, performance

WCAG 2.2 AA-oriented: keyboard navigation, visible focus, semantic HTML, labels, contrast, reduced motion, captions and transcripts, no autoplay audio, responsive Japanese typography (Noto Sans JP, body line-height about 1.8), accessible chatbot and dialogs. Security review: input sanitization, rate limiting, prompt-injection defenses, approved-knowledge boundaries, safe failure and escalation, CSP/CORS, security headers, secret handling, the logging rule in section 2.

## 14. Process and output

Process: plan → inspect → research → propose → implement → test → review → verify → document.
Before implementing, deliver: audit, inventories, competitor findings, positioning, sitemap, text wireframe of the 6 home sections and the 5 inner pages, Japanese copy with English translations, illustration and animation storyboard, feature-status matrix, implementation plan, test plan, risks, missing information. Then proceed without repeated approval requests unless there is risk of data loss, broken live integrations, confidential-data exposure, legal or compliance issues, or missing credentials.

After implementation, run and document: type check, lint, production build, unit/integration/E2E tests, responsive and browser checks, forms with the consent rule, chatbot, voice demo including the recording notice, metadata, structured data, sitemap and robots, accessibility, performance with animations on a throttled phone, reduced-motion behavior, broken links, 404, Japanese typography, and that old pages still resolve at their original URLs. Verify the core journey: home page understanding → demo → transcript and summary → partnership page → inquiry submission → confirmation.

Final output: audit, adopted strategy, preserved and changed functionality, sitemap, homepage map, illustration and motion notes, Japanese copy with English translations, SEO/GEO and schema changes, test and build results, accessibility and performance findings, limitations, missing information and all placeholders for the owner, desktop and mobile screenshots, next improvements, and a short plain-English explanation the sales team can use in meetings.

Prioritize clarity, trust, realistic Japanese operations and one strong product story over flashy effects.
