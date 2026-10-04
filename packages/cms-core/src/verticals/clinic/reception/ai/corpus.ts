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
import { FAQ_CONTENT, type FaqLocale } from '../faq-content'

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

function isProse(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.length < 2) return false
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
 * FAQ grounding no longer comes from a live Payload query (see
 * `serializeArticles`/`serializeServices` etc. above, still doc-driven) — it
 * comes from `faq-content.ts`'s static 36-entry file, the same source
 * faq-matcher.ts's `buildFaqMatchEntries` draws from. All 36 entries are
 * included here (unlike the matcher, which only uses the subset mapped to a
 * flow node — see FAQ_CONTENT_NODE_MAP's doc comment in faq-matcher.ts): the
 * AI answers a much broader range of clinic questions than the six
 * button-driven FAQ nodes do.
 */
function serializeStaticFaqs(locale: FaqLocale): CorpusDocument[] {
  return FAQ_CONTENT.map((entry) => ({
    type: 'faq',
    slug: entry.id,
    title: entry.question[locale],
    content: entry.answer[locale],
    sources: [],
  }))
}

function serializeTeam(docs: unknown[]): CorpusDocument[] {
  return (docs as RawDoc[]).map((doc) => ({
    type: 'team',
    slug: str(doc['slug']),
    title: str(doc['name']),
    content: [str(doc['title']), lexicalToText(doc['bio'])].filter(Boolean).join('\n'),
    sources: [],
  }))
}

function serializePages(docs: unknown[]): CorpusDocument[] {
  return (docs as RawDoc[]).map((doc) => {
    const blockText: string[] = []
    collectBlockText(doc['layout'], blockText)
    const meta = doc['meta'] as RawDoc | undefined
    return {
      type: 'page',
      slug: str(doc['slug']),
      title: str(doc['title']),
      content: [str(meta?.['description']), ...blockText].filter(Boolean).join('\n'),
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
export const CORPUS_SOURCES: readonly CorpusSource[] = [
  {
    collection: 'services',
    enabled: true,
    isFeatureEnabled: (config) => config.features.services,
    where: AI_VISIBLE_AND_ACTIVE,
    serialize: serializeServices,
  },
  {
    // Homepage only. The rest of the `pages` collection (/about/*, /faq,
    // /services landing copy) is either duplicated by the collections above
    // or is navigation chrome, and every extra page is grounding tokens spent
    // on every request — see prompt.ts's context budget.
    collection: 'pages',
    enabled: true,
    where: { and: [AI_VISIBLE, { slug: { equals: 'home' } }] },
    limit: 1,
    serialize: serializePages,
  },
  {
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
    // Recruitment-vertical content: already off for this site via the feature
    // flag (site.config.ts sets both from `recruitmentVertical = false`), so
    // these need no separate AI-scope decision today.
    collection: 'case-studies',
    enabled: true,
    isFeatureEnabled: (config) => config.features.caseStudies,
    where: AI_VISIBLE_AND_ACTIVE,
    serialize: serializeCaseStudies,
  },
  {
    collection: 'seminars',
    enabled: true,
    isFeatureEnabled: (config) => config.features.seminars,
    where: AI_VISIBLE_AND_ACTIVE,
    serialize: serializeSeminars,
  },
]

/** Same shape of switch as `CORPUS_SOURCES`, for the one global in scope. */
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

  // Static, not Payload-queried — see the comment above CORPUS_SOURCES.
  if (siteConfig.features.faq) {
    documents.push(...serializeStaticFaqs(locale === 'ja' ? 'ja' : 'en'))
  }

  if (COMPANY_INFO_ENABLED && siteConfig.features.company) {
    const companyGlobal = await payload.findGlobal({ slug: 'company-info', depth: 0 } as Parameters<Payload['findGlobal']>[0])
    const companyDoc = serializeCompanyInfo(companyGlobal, locale, siteConfig.site.name)
    if (companyDoc) documents.push(companyDoc)
  }

  return documents.filter((doc) => doc.title || doc.content)
}
