# Voice-pivot research, positioning and storyboard

Companion to `docs/VOICE-PIVOT-REPORT.md`. Source: ECC Master Prompt v2 §4, §5, §7, §14.

## 1. Competitor findings (Phase 2)

Method: web searches on 2026-10-21. Most sources are comparison directories, press and vendor pages, **not independent verification**; figures are the vendors' own and may be out of date. Not studied directly (no results retrieved in this pass): AIRI, Callix, KARAKURI voice agent, AI Worker VoiceAgent. Nothing was copied; patterns only.

| Vendor | What the sources say | Pattern worth adapting | Pattern to avoid |
| --- | --- | --- | --- |
| IVRy (AI Contact Center) | AI-native contact-center platform; first-line response to routine questions, hand-off to operators, call transcription and structured data, no-code set-up, 24/7. Japanese-focused. | Plain statement of AI first response + operator hand-off; transcript and summary as the visible output. | Price-led or "cheaper than IVR" framing; TechMirai publishes no prices. |
| PKSHA VoiceAgent | Voice bot for contact centers combining speech recognition and LLM; AI-IVR routing and full-automation plans; consultants support set-up; price on request; sources quote customer results (e.g. a completion rate). | Named plans/phases and a clear implementation path (maps to our 4-step PoC). | Quoting customer results. TechMirai has none and must not imply any. |
| Daisybell (AI agent) | Handles inbound and outbound calls, data entry, transfer and post-call summary; guardrails and a monitoring agent to reduce wrong answers; escalates complex cases to humans; partnership with a BPO player for "AI-BPO"; describes AI as covering labour shortage, not replacing people. | Human-handoff and "supports people" message; BPO/partner channel. | Autonomy language ("completes the whole task on its own"); TechMirai demo is scripted. |
| Cresta / Sierra | US enterprise platforms; Cresta contact-center voice and chat with agent assist; Sierra branded consumer agents. Custom pricing. No Japan-specific information found. | Dashboard-as-product thinking; clear "for whom" split. | Enterprise-scale or compliance-certification claims (SOC 2, ISO etc.). TechMirai holds none. |

## 2. TechMirai's honest differentiation

1. **Partner model first:** call-center and BPO operators bring customers, flows and operators; TechMirai supplies voice AI, approved knowledge, dashboard and technical support. The operator sells it as their own (white-label).
2. **Supports people:** AI takes routine, busy-time and after-hours calls; complex or sensitive calls go to a person.
3. **Small, proof-first start:** a four-step PoC (Validate → Measure → Decide → Production) with evaluation measures defined before any result is claimed.
4. **Next-morning dashboard:** transcript, summary, urgency, callback status, recommended action.

## 3. Claims TechMirai must avoid

"No.1", "100%", "perfect", "replaces operators"; any customer name, result, rating, award or certification; any integration not built (phone-line connection, live transfer, caller-ID capture, CRM/LINE/Slack notifications — all unbuilt); PBX or "no PBX changes"; prices; any country or employer for the team; "works on your existing phone number".

## 4. Illustration and animation storyboard

**Style:** one calm, original, flat illustration style in the existing brand green (`#0F6E56`) with the existing neutral palette; no robots, AI brains, cyberpunk or gradients; no real people unless consented; no flags. All illustration is to be produced by a designer; this repo currently ships text-based cards only.

**Home — "How it works" call flow (implemented as the `call-flow` block):**

| Step | Visual (target) | Motion (implemented) |
| --- | --- | --- |
| 1 Customer calls | Phone icon, incoming ring | Step card highlights |
| 2 Operators busy / after hours | Queue of waiting cards or moon icon | Next highlight after 1.6 s |
| 3 AI answers from approved knowledge | Speech bubble + "approved knowledge" book | Highlight |
| 4 Records, transcribes, summarizes | Transcript lines condensing into a summary card | Highlight |
| 5 Complex cases → a person | Hand-off arrow to an operator figure (abstract) | Highlight, then loop |

Rules honoured: motion only changes opacity and transform; loops pause with a visible button; `prefers-reduced-motion` shows a static list with no highlight loop and hides the button; no autoplay audio; all text is server-rendered.

**Dashboard strip:** six fields (caller details, transcript, summary, urgency, callback status, recommended action), labelled "Demo data". A real dashboard screenshot with dummy data must come from the voice product; none was available in this repo.

**Team media (on /company only, later):** static consented photo by default; on tap a 2–3 s muted clip with captions; poster image; lazy loaded; no AI-generated likeness without written consent.

## 5. Chatbot — what changed and what is blocked

Existing behaviour that already meets the brief: always-visible "Talk to a person" button; "automated assistant" disclosure; answers grounded on an approved corpus; rate limiting; prompt-injection guard.

Blocked, because the code is locked by existing tests (rule 14 / stop trigger):
- `AI_PAGE_SLUGS` in `ai/corpus.ts` is asserted by `corpus.test.ts`; adding `demo`, `partners`, `company` and removing old product pages needs that test updated.
- The 36 static answers in `techmirai-chat-content.ts` are about the earlier "AI受付" product (incl. bracketed prices) and are covered by tests.
- Collecting the contact-form fields inside the chat with the same consent rule is a new flow node plus tests.

Recommended change set once the tests may be updated: (1) corpus slugs → `home`, `demo`, `partners`, `company`; (2) replace the static answers and greeting with voice-agent/partnership answers; (3) add a consent-gated "Leave your details" node posting to `/api/forms/contact`; (4) never state a response time.

Done now: chatbot error logs mask emails and phone numbers.
