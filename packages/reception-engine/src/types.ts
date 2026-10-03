// ─────────────────────────────────────────────────────────────────────────────
// The seam.
//
// A flow is *data*: a graph of nodes that the generic engine walks. Nodes
// reference i18n KEYS (never inline copy) and NAMED validators (never inline
// functions) so the whole graph stays serializable. Text resolution is
// dependency-injected (a `TextResolver` passed in by the host) rather than a
// fixed import, so the same pure engine can serve static i18n copy and
// CMS-sourced content (e.g. FAQ answers) without ever doing I/O itself.
//
// Ported from sadiatec-assistant's src/lib/chat-engine/types.ts, generalized:
// CollectedData/target drop their recruitment-specific (candidate/b2b) shape
// in favor of an open string/string bag, and text resolution is injected
// instead of imported. Five node types are additive: component, link, refusal,
// triage, ai-fallback.
// ─────────────────────────────────────────────────────────────────────────────

export type Locale = 'en' | 'ja' | 'bn'

export type NodeId = string

/** Serializable validators (resolved to functions inside the engine). */
export type ValidatorName = 'required' | 'phone' | 'email'

/** Open data bag — callers define their own field names as string keys. */
export type CollectedData = Record<string, string>

export type TextResolver = (key: string, locale: Locale, params?: Record<string, string>) => string

export interface BaseNode {
  id: NodeId
}

/** Bot says something, then auto-advances. */
export interface MessageNode extends BaseNode {
  type: 'message'
  textKey: string
  audioUrl?: string
  audioIntroKey?: string
  next: NodeId
}

/** Bot asks; renders quick-reply buttons. Options may also record data. */
export interface ChoiceOption {
  labelKey: string
  value: string
  next: NodeId
  /** Optionally record collected fields when this option is chosen. */
  set?: Partial<CollectedData>
  /** Optionally fix which collection captures target from here on. */
  setTarget?: string
}

export interface ChoiceNode extends BaseNode {
  type: 'choice'
  promptKey: string
  options: ChoiceOption[]
}

/** Collects exactly one field. `select` renders as quick-reply buttons too. */
export interface InputNode extends BaseNode {
  type: 'input'
  promptKey: string
  field: string
  inputType: 'text' | 'email' | 'phone' | 'select' | 'textarea'
  options?: Array<{ labelKey: string; value: string }>
  validate?: ValidatorName
  optional?: boolean
  next: NodeId
}

/** Answers a common question, then returns to a menu node. */
export interface FaqNode extends BaseNode {
  type: 'faq'
  answerKey: string
  audioUrl?: string
  backTo: NodeId
}

/** The point where the assembled record is finalized. */
export interface CaptureNode extends BaseNode {
  type: 'capture'
  target: string
  next: NodeId
}

/** Requests a human callback (host sets wantsCallback + notifies staff). */
export interface HandoffNode extends BaseNode {
  type: 'handoff'
  textKey: string
  next: NodeId
}

export interface EndNode extends BaseNode {
  type: 'end'
  textKey: string
}

/** Mounts a host-registered React component inline (e.g. a booking flow). */
export interface ComponentNode extends BaseNode {
  type: 'component'
  componentId: string
  /** Optional lead-in bot message shown before the component mounts. */
  textKey?: string
}

/** Renders a CTA that navigates the user out to another page. */
export interface LinkNode extends BaseNode {
  type: 'link'
  textKey: string
  href: string
  labelKey: string
}

/**
 * A fixed, non-clinical refusal message. Structurally identical to `faq`
 * (message + backTo) but its own node type so a flow's refusal path is an
 * independently testable, greppable graph node — never a prompt instruction.
 */
export interface RefusalNode extends BaseNode {
  type: 'refusal'
  textKey: string
  backTo: NodeId
}

/**
 * How one free-text question was screened. Produced by a host-injected
 * `TriageResolver`: the engine never inspects the text itself, it only routes
 * on the verdict, so matching (fuzzy search over FAQ content) and screening
 * (medical / off-topic) stay outside the pure engine.
 */
export type TriageOutcome = { kind: 'refuse' } | { kind: 'static'; nodeId: NodeId } | { kind: 'ai' }

export type TriageResolver = (text: string, locale: Locale) => TriageOutcome

/**
 * The one point where free text is routed. Auto-advancing: reads the text a
 * preceding `input` node collected into `field`, asks the host's
 * `TriageResolver` about it, and moves to exactly one of three targets the
 * graph declares — never anywhere else:
 *
 *  - `refuseTo`     symptom/medical or off-topic -> the flow's fixed refusal node
 *  - one of `allow` a good static answer exists. A whitelist, so a matcher can
 *                   never steer free text to a node this graph didn't name here
 *  - `aiFallback`   no static answer -> a single AI answer
 *
 * A verdict the node doesn't allow (including a `static` hit outside `allow`)
 * falls to `refuseTo` rather than being followed.
 *
 * With no resolver injected the engine treats every question as `ai`. That is
 * a build-order stub for the AI path, not the intended production routing —
 * a host that means to screen free text must pass a `TriageResolver`.
 */
export interface TriageNode extends BaseNode {
  type: 'triage'
  field: string
  refuseTo: NodeId
  allow: NodeId[]
  aiFallback: NodeId
}

/**
 * One AI answer to a free-text question, then back to a menu. Structurally
 * identical to `faq`/`refusal` (message + backTo) and its own node type for
 * the same reason: the AI path stays an independently testable, greppable
 * graph node. It carries only `backTo` — an ai-fallback node with an edge
 * into itself would be a multi-turn AI chat, which this is deliberately not.
 */
export interface AiFallbackNode extends BaseNode {
  type: 'ai-fallback'
  /** Data field holding the question this answer responds to. */
  field: string
  /** Copy for the answer until a grounded one is wired in. */
  textKey: string
  backTo: NodeId
}

export type FlowNode =
  | MessageNode
  | ChoiceNode
  | InputNode
  | FaqNode
  | CaptureNode
  | HandoffNode
  | EndNode
  | ComponentNode
  | LinkNode
  | RefusalNode
  | TriageNode
  | AiFallbackNode

export interface FlowGraph {
  id: string
  /** Default capture target (a node or choice option may override per branch). */
  target?: string
  start: NodeId
  nodes: Record<NodeId, FlowNode>
}

/** A rendered chat bubble. */
export interface ChatMessage {
  id: string
  role: 'bot' | 'user'
  text: string
  audioUrl?: string
  audioIntro?: string
  timestamp: number
  nodeId?: NodeId
}

/** What the UI must render *now* to move the conversation forward. */
export type Interaction =
  | { kind: 'choice'; options: Array<{ label: string; value: string }> }
  | {
      kind: 'input'
      field: string
      inputType: InputNode['inputType']
      options?: Array<{ label: string; value: string }>
      optional: boolean
      /** Resolved prompt text (from the host TextResolver), same as `label` on `link`/`choice` — never a raw key. */
      placeholder: string
    }
  | { kind: 'component'; componentId: string }
  | { kind: 'link'; href: string; label: string }
  | { kind: 'none' } // conversation finished

/** Side effects the host performs — keeps the engine pure (no I/O). */
export type SideEffect = { type: 'capture'; target: string } | { type: 'handoff' }

export interface EngineState {
  flowId: string
  target?: string
  currentNodeId: NodeId | null
  history: NodeId[]
  data: CollectedData
  status: 'active' | 'done'
  error: string | null
  effects: SideEffect[]
  suppressNextPrompt?: boolean
}
