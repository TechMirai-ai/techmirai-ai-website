import type { ChoiceOption, FlowGraph } from '@techmirai/reception-engine'

/**
 * Text key for the single AI answer. Unlike every other key in this graph it
 * has TWO resolutions, and which one the visitor sees is the whole point:
 * `createReceptionTextResolver` returns the grounded answer the host fetched
 * for this question if there is one, and otherwise falls through to the
 * static i18n copy for this key — which is the fixed "we could not answer
 * that, please call us" message. A failed, timed-out, unconfigured or
 * rate-limited LLM therefore degrades to safe copy by DEFAULT, without the
 * failure path having to remember to substitute anything.
 */
export const RECEPTION_AI_ANSWER_KEY = 'reception.faq.ai.answer'

// Node id and choice value for the "Talk to staff" LINE link (part 5). Named
// exports rather than inline string literals so the host (useReceptionEngine)
// can reference the exact same node/option it needs to special-case without
// duplicating the string.
export const FAQ_STAFF_LINK_NODE_ID = 'faq.staff'
export const FAQ_STAFF_OPTION_VALUE = 'staff'

/**
 * Every faq.menu option EXCEPT "Type your own question" (faq.opt.ask).
 * Split out from the menu's `options` array — rather than writing "ask"
 * inline among these and trusting it to stay in the right position — so
 * that adding, removing, or reordering options here can never accidentally
 * move "ask" out of last place: see `FAQ_MENU_ASK_OPTION` below, which the
 * `faq.menu` node appends after this list, structurally guaranteeing it is
 * always the final entry regardless of how many options end up here.
 */
const FAQ_MENU_OPTIONS_BEFORE_ASK: ChoiceOption[] = [
  { labelKey: 'reception.faq.opt.hours', value: 'hours', next: 'faq.hours' },
  { labelKey: 'reception.faq.opt.access', value: 'access', next: 'faq.access' },
  { labelKey: 'reception.faq.opt.parking', value: 'parking', next: 'faq.parking' },
  { labelKey: 'reception.faq.opt.prices', value: 'prices', next: 'faq.prices' },
  { labelKey: 'reception.faq.opt.bring', value: 'bring', next: 'faq.bring' },
  { labelKey: 'reception.faq.opt.firstVisit', value: 'first-visit', next: 'faq.first-visit' },
  { labelKey: 'reception.faq.opt.staff', value: FAQ_STAFF_OPTION_VALUE, next: FAQ_STAFF_LINK_NODE_ID },
  { labelKey: 'reception.faq.opt.other', value: 'other', next: 'refusal.medical' },
  { labelKey: 'reception.faq.opt.back', value: 'back', next: 'menu' },
]

/** Always the last entry in faq.menu's options — see the list above. */
const FAQ_MENU_ASK_OPTION: ChoiceOption = { labelKey: 'reception.faq.opt.ask', value: 'ask', next: 'faq.ask' }

/**
 * The explicit ordering rule itself, factored out so it's independently
 * testable (see flow.test.ts's "menu ordering" suite) against an arbitrary
 * list of "other" options — not just today's fixed nine — proving the rule
 * holds structurally rather than by the current array happening to be
 * written in the right order.
 */
export function buildFaqMenuOptions(otherOptions: ChoiceOption[]): ChoiceOption[] {
  return [...otherOptions, FAQ_MENU_ASK_OPTION]
}

/**
 * Reception flow for a 治療院 (clinic): greeting, then three top-level
 * options — book, ask a question, or manage an existing booking. The FAQ
 * menu answers only clinic-operational questions (hours/access/parking/
 * prices/what to bring/first visit); anything else routes through the
 * `refusal` node — a dedicated graph node, not a prompt instruction — which
 * always says the same fixed, non-clinical thing and never varies with what
 * the customer has said or chosen.
 *
 * Free text is accepted at exactly one node — `faq.ask`, reachable only from
 * the FAQ menu's "ask something else" option — and a free-text question can
 * never itself become an answer. Every submission passes through
 * `faq.ask.triage`, which routes it to one of three destinations this graph
 * names and nowhere else: the same fixed `refusal.medical` node (anything
 * about symptoms/treatment, or off-topic), one of the six FAQ answers above,
 * or `faq.ai` for a single grounded AI answer. The refusal node therefore
 * stays in front of the AI path as a separate node rather than a prompt
 * instruction, and free text cannot talk its way past it.
 *
 * Which of the three a question gets is decided outside the engine by the
 * injected `TriageResolver` (`createClinicTriageResolver`): a medical screen
 * first — the only reason free text can now reach `refusal.medical` at all —
 * then the fuse.js FAQ match, then the AI fallback. Free text that is
 * off-topic but not medical still routes to `faq.ai`, where it is answered
 * with fixed copy without an LLM call ever being made.
 *
 * `faq.ai` answers once and returns to `faq.menu` through the same `backTo`
 * mechanism the FAQ answers use; it has no edge back into itself, so "one AI
 * answer, then stop" is a property of the graph rather than of a runtime turn
 * counter — there is no session state to hold one (EngineState is per-tab
 * React state). Re-entering costs the customer a deliberate menu choice.
 */
export const clinicReceptionFlow: FlowGraph = {
  id: 'clinic.reception',
  start: 'greeting',
  nodes: {
    greeting: { id: 'greeting', type: 'message', textKey: 'reception.greeting', next: 'menu' },

    menu: {
      id: 'menu',
      type: 'choice',
      promptKey: 'reception.menu.prompt',
      options: [
        { labelKey: 'reception.menu.book', value: 'book', next: 'booking.mount' },
        { labelKey: 'reception.menu.faq', value: 'faq', next: 'faq.menu' },
        { labelKey: 'reception.menu.manage', value: 'manage', next: 'manage.link' },
      ],
    },

    'booking.mount': {
      id: 'booking.mount',
      type: 'component',
      componentId: 'booking',
      textKey: 'reception.booking.intro',
    },

    'manage.link': {
      id: 'manage.link',
      type: 'link',
      textKey: 'reception.manage.intro',
      href: '/booking/manage',
      labelKey: 'reception.manage.cta',
    },

    'faq.menu': {
      id: 'faq.menu',
      type: 'choice',
      promptKey: 'reception.faq.menu.prompt',
      // `buildFaqMenuOptions` appends "ask" last, not written inline here —
      // see its doc comment and `FAQ_MENU_OPTIONS_BEFORE_ASK`'s for why.
      options: buildFaqMenuOptions(FAQ_MENU_OPTIONS_BEFORE_ASK),
    },

    // `answerKey` is just an internal lookup key now — not a Payload slug.
    // Its text comes from faq-answers.ts's `buildStaticFaqAnswers`, sourced
    // from faq-content.ts via FAQ_CONTENT_NODE_MAP (retired: the old
    // CMS-backed resolveClinicFaqAnswers/CLINIC_FAQ_SLUGS path).
    'faq.hours': { id: 'faq.hours', type: 'faq', answerKey: 'faq.clinic-hours', backTo: 'faq.menu' },
    'faq.access': { id: 'faq.access', type: 'faq', answerKey: 'faq.clinic-access', backTo: 'faq.menu' },
    'faq.parking': { id: 'faq.parking', type: 'faq', answerKey: 'faq.clinic-parking', backTo: 'faq.menu' },
    'faq.prices': { id: 'faq.prices', type: 'faq', answerKey: 'faq.clinic-prices', backTo: 'faq.menu' },
    'faq.bring': { id: 'faq.bring', type: 'faq', answerKey: 'faq.clinic-what-to-bring', backTo: 'faq.menu' },
    'faq.first-visit': { id: 'faq.first-visit', type: 'faq', answerKey: 'faq.clinic-first-visit', backTo: 'faq.menu' },

    // The graph's only free-text entry point. `required` keeps an empty
    // submission from reaching triage as a blank question.
    'faq.ask': {
      id: 'faq.ask',
      type: 'input',
      promptKey: 'reception.faq.ask.prompt',
      field: 'question',
      inputType: 'text',
      validate: 'required',
      next: 'faq.ask.triage',
    },

    // `allow` is the six FAQ answer nodes and nothing else, so a static
    // matcher (part 3) can only ever route free text to content this menu
    // already offers behind a button.
    'faq.ask.triage': {
      id: 'faq.ask.triage',
      type: 'triage',
      field: 'question',
      refuseTo: 'refusal.medical',
      allow: ['faq.hours', 'faq.access', 'faq.parking', 'faq.prices', 'faq.bring', 'faq.first-visit'],
      aiFallback: 'faq.ai',
    },

    // One grounded answer, then back to the menu. `textKey` resolves to the
    // fetched answer when the host has one and to fixed contact-us copy when
    // it does not (see RECEPTION_AI_ANSWER_KEY above); the node itself is
    // unaware of either, exactly as it is unaware of the FAQ answers.
    'faq.ai': {
      id: 'faq.ai',
      type: 'ai-fallback',
      field: 'question',
      textKey: RECEPTION_AI_ANSWER_KEY,
      backTo: 'faq.menu',
    },

    'refusal.medical': {
      id: 'refusal.medical',
      type: 'refusal',
      textKey: 'reception.refusal.text',
      backTo: 'faq.menu',
    },

    // Plain outbound LINE link to the clinic's staff account — no capture,
    // no handoff effect, just a CTA the visitor taps to leave the widget and
    // message a human directly. `href` is a placeholder here: it always
    // resolves empty at the pure-engine level because the real URL is
    // per-client config (site.config.ts's reception.staffLineUrl), which
    // this package-level graph must not import. The host
    // (useReceptionEngine) substitutes the configured URL at render time,
    // and hides the faq.menu option that leads here entirely whenever that
    // config value is unset — see withStaffLineAvailability — so this node
    // is only ever reached with a real URL in hand.
    //
    // Reachable directly from faq.menu (the option above) and, since both
    // faq.ai and refusal.medical already `backTo: 'faq.menu'`, from the
    // backTo loop after an AI answer or a medical refusal too — no extra
    // wiring needed for those paths.
    [FAQ_STAFF_LINK_NODE_ID]: {
      id: FAQ_STAFF_LINK_NODE_ID,
      type: 'link',
      textKey: 'reception.faq.staff.intro',
      href: '',
      labelKey: 'reception.faq.staff.cta',
    },
  },
}
