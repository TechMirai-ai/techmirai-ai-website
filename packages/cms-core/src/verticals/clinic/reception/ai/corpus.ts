// ─────────────────────────────────────────────────────────────────────────────
// The grounding corpus.
//
// This is the compilation logic that used to live inside
// apps/techmirai-web/src/app/api/ai/corpus/route.ts — a GET route built for an
// external consumer to pull over HTTP with a bearer token. Grounding an
// in-process answer through that route would mean the app calling itself over
// the network and holding a secret to read its own database, so the logic is
// a plain async function here and the route is now a thin auth wrapper around
// the same function. One corpus definition, two consumers.
//
// WHAT IS IN SCOPE is decided HERE, in code, by `CORPUS_SOURCES` below —
// never by unsetting `aiVisible` on individual records. A record-level opt-out
// is staff-editable and silent: a placeholder blog post created next month
// would arrive with `aiVisible` defaulted to true and quietly become
// grounding material. A source switched off in this table cannot.
// ─────────────────────────────────────────────────────────────────────────────

import type { Payload } from 'payload'
import type { SiteConfig } from '../../../../schema/site-config'
import { lexicalToText } from '../../../../payload/lib/richtext-to-text'
import { ALL_ENTRIES, OFF_TOPIC_NODE_ID, type ChatEntry } from '../techmirai-chat-content'

export interface CorpusDocument {
  type: string
  slug: string
  title: string
  content: string
  sources: { label?: string; url?: string }[]
}

type RawDoc = Record<string, unknown>

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

function pick(group: unknown, locale: string): string {
  if (!group || typeof group !== 'object') return ''
  return str((group as RawDoc)[locale])
}

// ---------------------------------------------------------------------------
// Block-layout text extraction (pages)
// ---------------------------------------------------------------------------

/**
 * Keys whose values are plumbing rather than prose: relationship ids, media
 * ids, routing, and presentation switches. Everything else that is a string
 * is treated as visible copy.
 */
const NON_PROSE_KEYS = new Set([
  'id', 'blockType', 'blockName', 'slug',
  'href', 'ctaHref', 'url', 'link',
  'icon', 'variant', 'columns', 'source', 'align', 'size', 'color', 'theme',
  'image', 'avatar', 'photo', 'backgroundImage', 'media', 'file', 'poster',
  'avatarPosition', 'postsSource',
])

/** 24-char Mongo-style id, uuid, or a bare Postgres integer id. */
const ID_LIKE = /^(?:[0-9a-f]{24}|[0-9a-f-]{32,36}|\d+)$/i
/** At least one letter or CJK character — filters out lone punctuation/symbols. */
const HAS_WORD = /[\p{L}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u
/**
 * A bare lowercase ASCII token with no spaces: `alternating`, `medium`,
 * `vision`, `solid`. Block configs carry dozens of these as select-field
 * values under keys too varied to enumerate (`layout`, `scrollSpeed`,
 * `visionBody`, …), and in the corpus they read as stray nonsense words the
 * model might try to make sense of. Real copy in either language is
 * capitalized, CJK, or contains a space.
 */
const ENUM_TOKEN = /^[a-z][a-z0-9_-]*$/

/**
 * `[TBD: …]` and `[JA TODO]` are the repo's own markers for text the Spec has
 * not supplied (CLAUDE.md rules 5 and 6). They are not content: a model that is
 * handed one will quote it as if it were an answer.
 */
const PLACEHOLDER = /^\[(?:TBD|JA TODO)/i

function isProse(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.length < 2) return false
  if (PLACEHOLDER.test(trimmed)) return false
  if (trimmed.startsWith('/') || trimmed.startsWith('http')) return false
  if (ID_LIKE.test(trimmed)) return false
  if (ENUM_TOKEN.test(trimmed)) return false
  return HAS_WORD.test(trimmed)
}

/**
 * Walks a Payload blocks array and collects the visible copy out of it.
 * Generic on purpose: the homepage's layout is ~15 blocks of many different
 * shapes, and a per-block serializer for each would be a second, drifting
 * copy of the block configs.
 *
 * Lexical rich-text values are handed to `lexicalToText` rather than walked
 * here — walking them generically would harvest node type names ("paragraph",
 * "root") as if they were copy.
 */
function collectBlockText(value: unknown, out: string[], depth = 0): void {
  if (depth > 8) return

  if (typeof value === 'string') {
    if (isProse(value)) out.push(value.trim())
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) collectBlockText(item, out, depth + 1)
    return
  }

  if (!value || typeof value !== 'object') return

  const record = value as RawDoc
  if ('root' in record) {
    const text = lexicalToText(record)
    if (text) out.push(text)
    return
  }

  for (const [key, child] of Object.entries(record)) {
    if (NON_PROSE_KEYS.has(key)) continue
    collectBlockText(child, out, depth + 1)
  }
}

// ---------------------------------------------------------------------------
// Per-collection serializers
// ---------------------------------------------------------------------------

function serializeServices(docs: unknown[]): CorpusDocument[] {
  return (docs as RawDoc[]).map((doc) => ({
    type: 'service',
    slug: str(doc['slug']),
    title: str(doc['title']),
    content: [str(doc['excerpt']), lexicalToText(doc['body'])].filter(Boolean).join('\n\n'),
    sources: [],
  }))
}

/**
 * Answer grounding comes from the chat's own content, not a Payload query: the
 * TechMirai answers in `techmirai-chat-content.ts` (the menu answers, F01–F26
 * and C01–C10) — the same text the buttons and the matcher show, so the AI can
 * never contradict them. Spec §16.4 rule 1 allows only published content, and
 * this is published in the chat itself.
 *
 * Left out: the rule-13 redirect (not a fact); an answer that is wholly a
 * `[CONFIRM]`-style bracket (F19, F24 — handing those to the model is how a
 * placeholder gets quoted as an answer, so the model says it does not know);
 * and a repeat of an answer already included ("Same as B1" is the same text).
 */
function serializeChatAnswers(locale: 'en' | 'ja'): CorpusDocument[] {
  const seen = new Set<string>()
  const documents: CorpusDocument[] = []
  for (const entry of ALL_ENTRIES) {
    if (entry.id === OFF_TOPIC_NODE_ID) continue
    const answer = entry.answer[locale].trim()
    if (/^\[[^\]]*\]$/.test(answer) || seen.has(answer)) continue
    seen.add(answer)
    documents.push({ type: 'faq', slug: entry.id, title: chatAnswerTitle(entry, locale), content: answer, sources: [] })
  }
  return documents
}

/** What the answer is about, for the grounding heading: the FAQ question, the button label, or the first keyword. */
function chatAnswerTitle(entry: ChatEntry, locale: 'en' | 'ja'): string {
  return entry.question?.[locale] ?? entry.label?.[locale] ?? entry.keywords?.[locale][0] ?? entry.code
}

/**
 * A team record's role and biography, minus any `[TBD…]` / `[JA TODO]` line:
 * the seed keeps Spec placeholders for facts it was not given, and a model
 * handed one will quote it (Spec §16.4 rule 7: never invent team members). A
 * record whose name is a placeholder, or that has nothing left to say, is
 * dropped whole.
 */
function serializeTeam(docs: unknown[]): CorpusDocument[] {
  return (docs as RawDoc[]).flatMap((doc) => {
    const name = str(doc['name']).trim()
    if (!name || PLACEHOLDER.test(name)) return []

    const keep = (text: string): string[] =>
      text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !PLACEHOLDER.test(line))
    const content = [...keep(str(doc['title'])), ...keep(lexicalToText(doc['bio']))].join('\n')
    if (!content) return []

    return [{ type: 'team', slug: str(doc['slug']), title: name, content, sources: [] }]
  })
}

function serializePages(docs: unknown[]): CorpusDocument[] {
  return (docs as RawDoc[]).map((doc) => {
    const blockText: string[] = []
    collectBlockText(doc['layout'], blockText)
    const meta = doc['meta'] as RawDoc | undefined
    return {
      type: 'page',
      slug: str(doc['slug']),
      // A `[JA TODO]` page title is a marker, not a name: fall back to the slug.
      title: PLACEHOLDER.test(str(doc['title']).trim()) ? str(doc['slug']) : str(doc['title']),
      content: [PLACEHOLDER.test(str(meta?.['description']).trim()) ? '' : str(meta?.['description']), ...blockText]
        .filter(Boolean)
        .join('\n'),
      sources: [],
    }
  })
}

function serializeCaseStudies(docs: unknown[]): CorpusDocument[] {
  return (docs as RawDoc[]).map((doc) => ({
    type: 'case-study',
    slug: str(doc['slug']),
    title: str(doc['title']),
    content: [
      str(doc['tagline']),
      lexicalToText(doc['challenge']),
      lexicalToText(doc['solution']),
      lexicalToText(doc['outcome']),
    ]
      .filter(Boolean)
      .join('\n\n'),
    sources: [],
  }))
}

function serializeArticles(type: string) {
  return (docs: unknown[]): CorpusDocument[] =>
    (docs as RawDoc[]).map((doc) => ({
      type,
      slug: str(doc['slug']),
      title: str(doc['title']),
      content: [str(doc['excerpt']), lexicalToText(doc['content'])].filter(Boolean).join('\n\n'),
      sources: [],
    }))
}

function serializeSeminars(docs: unknown[]): CorpusDocument[] {
  return (docs as RawDoc[]).map((doc) => {
    const speaker = doc['speaker'] as RawDoc | undefined
    return {
      type: 'seminar',
      slug: str(doc['slug']),
      title: str(doc['title']),
      content: [
        str(doc['excerpt']),
        lexicalToText(doc['description']),
        speaker?.['name'] ? `Speaker: ${str(speaker['name'])}` : '',
      ]
        .filter(Boolean)
        .join('\n\n'),
      sources: [],
    }
  })
}

function serializeCompanyInfo(global: unknown, locale: string, fallbackName: string): CorpusDocument | null {
  if (!global || typeof global !== 'object') return null
  const g = global as RawDoc

  const lines: string[] = [
    g['legalName'] ? `Company: ${str(g['legalName'])}` : '',
    g['foundedYear'] ? `Founded: ${String(g['foundedYear'])}` : '',
    g['employeeCount'] ? `Employees: ~${String(g['employeeCount'])}` : '',
    g['capital'] ? `Capital: ${str(g['capital'])}` : '',
    pick(g['description'], locale),
    pick(g['mission'], locale),
    pick(g['vision'], locale),
    pick(g['address'], locale) ? `Address: ${pick(g['address'], locale)}` : '',
    pick(g['businessHours'], locale) ? `Hours: ${pick(g['businessHours'], locale)}` : '',
  ]

  const executives = arr<RawDoc>(g['executives'])
  if (executives.length > 0) {
    lines.push(
      'Leadership: ' +
        executives.map((e) => `${str(e['name'])} (${pick(e['role'], locale)})`).filter(Boolean).join(', '),
    )
  }

  const timeline = arr<RawDoc>(g['timeline'])
  if (timeline.length > 0) {
    lines.push(
      'History:\n' + timeline.map((t) => `${String(t['year'])}: ${pick(t['label'], locale)}`).filter(Boolean).join('\n'),
    )
  }

  return {
    type: 'company',
    slug: 'company-info',
    title: str(g['legalName']) || fallbackName,
    content: lines.filter(Boolean).join('\n'),
    sources: [],
  }
}

// ---------------------------------------------------------------------------
// CORPUS_SOURCES — the one place that controls what the AI can be grounded on
// ---------------------------------------------------------------------------

const AI_VISIBLE = { aiVisible: { equals: true } }
const ACTIVE = { active: { equals: true } }
const AI_VISIBLE_AND_ACTIVE = { and: [AI_VISIBLE, ACTIVE] }

interface CorpusSource {
  collection: 'services' | 'team' | 'pages' | 'blog' | 'news' | 'case-studies' | 'seminars'
  /**
   * Code-level AI-scope switch, in the same shape as search-index.ts's
   * `INDEXED_COLLECTIONS.enabled`. `false` here means "this content type is
   * not grounding material", full stop — independent of whether the site
   * renders it and of any record's own `aiVisible` checkbox.
   */
  enabled: boolean
  /** Additionally requires the site feature to be on, where one exists. */
  isFeatureEnabled?: (config: SiteConfig) => boolean
  where?: Record<string, unknown>
  limit?: number
  serialize: (docs: unknown[]) => CorpusDocument[]
}

// `faqs` is deliberately NOT a Payload-queried entry here — FAQ grounding
// comes from the static `faq-content.ts` file (see `serializeStaticFaqs` and
// its use in `compileAiCorpus` below), not this table. It stays gated on the
// same `features.faq` flag the query used to be gated on, just applied
// directly rather than through this generic find-and-serialize loop.
/**
 * Spec §16.6 "What the AI may read", as page slugs: home, /ai-reception, all
 * /solutions pages, /how-it-works, /integrations, /pricing, /security, /about,
 * /technology, /faq. Decided HERE, in code — never by a record's own
 * `aiVisible` checkbox (the pattern this file's header describes).
 *
 * Deliberately NOT listed, each pending a decision (docs/FINDINGS.md, K2):
 *   - `thanks`, `privacy`, `terms`, `legal-notice`: /thanks is excluded by the
 *     Spec; the legal pages are placeholder bodies, and the model would quote
 *     the placeholder (§16.6 lists /privacy — include it once it has real text).
 *   - form pages (assessment, contact): excluded by the Spec; they are not in
 *     the `pages` collection's slugs below.
 *   - `/case-studies/sadiatec`: a `case-studies` document, off below until its
 *     `aiVisible: false` is deliberately changed and the case is confirmed.
 *   - blog posts: off below, "after Japanese review".
 */
export const AI_PAGE_SLUGS: readonly string[] = [
  'home',
  'ai-reception',
  'solutions',
  'clinic',
  'beauty',
  'automobile',
  'hotel',
  'how-it-works',
  'integrations',
  'pricing',
  'security',
  'about',
  'technology',
  'faq',
]

export const CORPUS_SOURCES: readonly CorpusSource[] = [
  {
    // Unchanged from before K2 (gated by `features.services` and `aiVisible`).
    // What this collection holds is UNVERIFIED — no TechMirai seed writes it and
    // there is no database access here — so a leftover clinic record would be
    // grounded. To be checked by hand in the admin (docs/FINDINGS.md, K2).
    collection: 'services',
    enabled: true,
    isFeatureEnabled: (config) => config.features.services,
    where: AI_VISIBLE_AND_ACTIVE,
    serialize: serializeServices,
  },
  {
    // Exactly the pages Spec §16.6 lists — `AI_PAGE_SLUGS` above — and nothing
    // else in the collection.
    collection: 'pages',
    enabled: true,
    where: { and: [AI_VISIBLE, { slug: { in: [...AI_PAGE_SLUGS] } }] },
    limit: AI_PAGE_SLUGS.length,
    serialize: serializePages,
  },
  {
    // Unchanged from before K2 (gated by `features.team` and `aiVisible`). The
    // seed writes real TechMirai members and /about (a §16.6 page) is built
    // from them. Placeholder text inside a record is dropped by
    // `serializeTeam`; the content itself is unverified (no database access).
    collection: 'team',
    enabled: true,
    isFeatureEnabled: (config) => config.features.team,
    where: AI_VISIBLE,
    serialize: serializeTeam,
  },
  {
    // OFF DELIBERATELY, and note that `features.blog` is TRUE on this site —
    // the blog renders, it is simply not something the receptionist answers
    // from. Its posts are dated commentary and self-care columns: the closest
    // thing in the CMS to content that reads as medical advice when an LLM
    // paraphrases it out of context. Turning this on is a content decision,
    // not a config toggle that should follow the feature flag.
    collection: 'blog',
    enabled: false,
    isFeatureEnabled: (config) => config.features.blog,
    where: AI_VISIBLE_AND_ACTIVE,
    serialize: serializeArticles('blog'),
  },
  {
    // OFF DELIBERATELY, `features.news` is likewise TRUE. News is
    // time-sensitive (closure notices, schedule changes) and the corpus is
    // cached: a stale "we are closed this week" is worse than no answer, and
    // the visitor is better served by the phone number.
    collection: 'news',
    enabled: false,
    isFeatureEnabled: (config) => config.features.news,
    where: AI_VISIBLE,
    serialize: serializeArticles('news'),
  },
  {
    // OFF until explicitly approved: Spec §16.6 lists /case-studies/sadiatec,
    // but the seeded case study is `aiVisible: false` on purpose and its facts
    // are not yet confirmed. Turning this on is a content decision, not a flag
    // that should follow `features.caseStudies`.
    collection: 'case-studies',
    enabled: false,
    isFeatureEnabled: (config) => config.features.caseStudies,
    where: AI_VISIBLE_AND_ACTIVE,
    serialize: serializeCaseStudies,
  },
  {
    // Unchanged from before K2: off for this site through `features.seminars`
    // (it follows `recruitmentVertical`), so it needs no separate decision.
    collection: 'seminars',
    enabled: true,
    isFeatureEnabled: (config) => config.features.seminars,
    where: AI_VISIBLE_AND_ACTIVE,
    serialize: serializeSeminars,
  },
]

/**
 * Unchanged from before K2 (gated by `features.company`). What the global holds
 * beyond the seeded founder is unverified, so a leftover clinic value would be
 * grounded — see docs/FINDINGS.md (K2). Same shape of switch as `CORPUS_SOURCES`.
 */
const COMPANY_INFO_ENABLED = true

const DEFAULT_LIMIT = 500

export interface CompileAiCorpusArgs {
  payload: Payload
  siteConfig: SiteConfig
  locale: string
}

/**
 * Compiles the AI-eligible CMS content for one locale.
 *
 * `depth: 0` on every query is load-bearing, not a performance tweak: at
 * Payload's default depth the homepage's `blog-teaser` / `news-list` blocks
 * populate their relationship fields with whole blog and news documents,
 * which would put the very content `CORPUS_SOURCES` switches off back into
 * the corpus through the page that references it.
 */
export async function compileAiCorpus({ payload, siteConfig, locale }: CompileAiCorpusArgs): Promise<CorpusDocument[]> {
  const activeSources = CORPUS_SOURCES.filter(
    (source) => source.enabled && (!source.isFeatureEnabled || source.isFeatureEnabled(siteConfig)),
  )

  const results = await Promise.all(
    activeSources.map((source) =>
      payload.find({
        collection: source.collection,
        where: source.where,
        locale,
        depth: 0,
        limit: source.limit ?? DEFAULT_LIMIT,
      } as Parameters<Payload['find']>[0]),
    ),
  )

  const documents: CorpusDocument[] = []
  results.forEach((result, i) => {
    documents.push(...activeSources[i]!.serialize(result.docs as unknown[]))
  })

  // Static, not Payload-queried — see `serializeChatAnswers`.
  if (siteConfig.features.faq) {
    documents.push(...serializeChatAnswers(locale === 'ja' ? 'ja' : 'en'))
  }

  if (COMPANY_INFO_ENABLED && siteConfig.features.company) {
    const companyGlobal = await payload.findGlobal({ slug: 'company-info', depth: 0 } as Parameters<Payload['findGlobal']>[0])
    const companyDoc = serializeCompanyInfo(companyGlobal, locale, siteConfig.site.name)
    if (companyDoc) documents.push(companyDoc)
  }

  return documents.filter((doc) => doc.title || doc.content)
}
