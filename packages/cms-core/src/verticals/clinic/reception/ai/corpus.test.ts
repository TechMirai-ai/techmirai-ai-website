import { describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'
import type { SiteConfig } from '../../../../schema/site-config'
import { FAQ_CONTENT } from '../faq-content'
import { compileAiCorpus, CORPUS_SOURCES } from './corpus'

// A fake Payload, not a database: what is being tested is which collections
// are asked for, with what filters, and how the answers are serialized.

interface FakeCall {
  collection: string
  where: unknown
  depth: unknown
  locale: unknown
}

function lexical(text: string) {
  return { root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text }] }] } }
}

const DOCS: Record<string, unknown[]> = {
  services: [{ slug: 'pelvic', title: '産前産後骨盤矯正', excerpt: '自費診療', body: lexical('やさしい手技で整えます。') }],
  team: [{ slug: 'tanaka', name: '田中 大輔', title: '院長', bio: lexical('柔道整復師。') }],
  pages: [
    {
      slug: 'home',
      title: 'さくら接骨院',
      meta: { description: '世田谷区の接骨院です。' },
      layout: [
        {
          blockType: 'hero',
          id: '65f0a1b2c3d4e5f60718293a',
          headline: '地域に根ざした、やさしい施術を',
          backgroundImage: '65f0a1b2c3d4e5f60718293b',
          sideCards: [{ title: '初めての方へ', description: '保険証をお持ちください。', ctaHref: '/faq' }],
        },
        { blockType: 'blog-teaser', heading: '院からのお知らせ・コラム', selectedPosts: ['12', '13'] },
        { blockType: 'services-grid', layout: 'alternating', scrollSpeed: 'medium', heading: '施術メニュー', cta: { label: 'Learn more', href: '/services' } },
        { blockType: 'rich-text', content: lexical('交通事故治療にも対応しています。') },
      ],
    },
  ],
  blog: [{ slug: 'self-care', title: '腰痛セルフケア', excerpt: '自宅でできる', content: lexical('毎日ストレッチを。') }],
  news: [{ slug: 'closed', title: '年末年始休診のお知らせ', excerpt: '12/29〜1/3', content: lexical('休診します。') }],
  'case-studies': [],
  seminars: [],
}

function fakePayload(calls: FakeCall[]): Payload {
  return {
    find: vi.fn(async ({ collection, where, depth, locale }: Record<string, unknown>) => {
      calls.push({ collection: String(collection), where, depth, locale })
      return { docs: DOCS[String(collection)] ?? [] }
    }),
    findGlobal: vi.fn(async () => ({ legalName: 'さくら接骨院', foundedYear: 2014 })),
  } as unknown as Payload
}

const siteConfig = {
  site: { name: 'Sakura Osteopathic Clinic' },
  features: {
    faq: true,
    services: true,
    team: true,
    company: true,
    // Both TRUE, exactly as in apps/clinic-demo/site.config.ts — the point of
    // the exclusion is that it does not follow these flags.
    blog: true,
    news: true,
    caseStudies: false,
    seminars: false,
  },
} as unknown as SiteConfig

async function compile() {
  const calls: FakeCall[] = []
  const documents = await compileAiCorpus({ payload: fakePayload(calls), siteConfig, locale: 'ja' })
  return { calls, documents }
}

describe('compileAiCorpus — what the AI is allowed to be grounded on', () => {
  it('never queries blog or news, even though features.blog and features.news are both on', async () => {
    const { calls, documents } = await compile()

    expect(calls.map((c) => c.collection)).not.toContain('blog')
    expect(calls.map((c) => c.collection)).not.toContain('news')
    expect(documents.map((d) => d.type)).not.toContain('blog')
    expect(documents.map((d) => d.type)).not.toContain('news')
  })

  it('never queries the faqs Payload collection — FAQ grounding is static (faq-content.ts), not live-sourced', async () => {
    const { calls } = await compile()
    expect(calls.map((c) => c.collection)).not.toContain('faqs')
  })

  it('leaks no blog or news text through the homepage that references them', async () => {
    const { documents } = await compile()
    const serialized = JSON.stringify(documents)

    expect(serialized).not.toContain('腰痛セルフケア')
    expect(serialized).not.toContain('年末年始休診のお知らせ')
    expect(serialized).not.toContain('毎日ストレッチを')
  })

  it('queries at depth 0 so relationship fields cannot populate excluded documents', async () => {
    const { calls } = await compile()
    expect(calls.every((c) => c.depth === 0)).toBe(true)
  })

  it('includes faqs, services, team and the homepage', async () => {
    const { documents } = await compile()
    expect([...new Set(documents.map((d) => d.type))].sort()).toEqual(['company', 'faq', 'page', 'service', 'team'])
  })

  it('asks the pages collection for the homepage only', async () => {
    const { calls } = await compile()
    const pagesCall = calls.find((c) => c.collection === 'pages')
    expect(JSON.stringify(pagesCall?.where)).toContain('"home"')
  })

  it('filters every collection on aiVisible', async () => {
    const { calls } = await compile()
    expect(calls.every((c) => JSON.stringify(c.where).includes('aiVisible'))).toBe(true)
  })

  it('skips collections whose site feature is off', async () => {
    const { calls } = await compile()
    expect(calls.map((c) => c.collection)).not.toContain('case-studies')
    expect(calls.map((c) => c.collection)).not.toContain('seminars')
  })

  it('extracts homepage block copy — including rich text — but not ids, hrefs or media references', async () => {
    const { documents } = await compile()
    const home = documents.find((d) => d.type === 'page')

    expect(home?.content).toContain('地域に根ざした、やさしい施術を')
    expect(home?.content).toContain('保険証をお持ちください。')
    expect(home?.content).toContain('交通事故治療にも対応しています。')
    expect(home?.content).toContain('世田谷区の接骨院です。')
    expect(home?.content).not.toContain('/faq')
    expect(home?.content).not.toContain('65f0a1b2c3d4e5f60718293b')
  })

  it('drops select-field enum values, which read as stray words in the grounding context', async () => {
    const { documents } = await compile()
    const home = documents.find((d) => d.type === 'page')

    expect(home?.content).toContain('施術メニュー')
    expect(home?.content).toContain('Learn more') // real copy, has a space
    expect(home?.content).not.toContain('alternating')
    expect(home?.content).not.toContain('medium')
  })

  it('includes all 36 static FAQ_CONTENT entries, not just the six the flow menu buttons show', async () => {
    const { documents } = await compile()
    const faqs = documents.filter((d) => d.type === 'faq')
    expect(faqs).toHaveLength(FAQ_CONTENT.length)
    expect(faqs.map((d) => d.slug).sort()).toEqual(FAQ_CONTENT.map((e) => e.id).sort())
  })

  it('serializes each FAQ document\'s title/content from the requested locale', async () => {
    const { documents } = await compile()
    const parking = documents.find((d) => d.type === 'faq' && d.slug === 'faq-29')
    expect(parking?.title).toBe('駐車場はありますか？')
    expect(parking?.content).toBe(
      '駐車場の有無や利用方法については、当院の「アクセス」ページをご確認ください。ご不明な場合は、お電話やLINEからお問い合わせください。',
    )
  })

  it('skips the static FAQ documents when features.faq is off', async () => {
    const calls: FakeCall[] = []
    const documents = await compileAiCorpus({
      payload: fakePayload(calls),
      siteConfig: { ...siteConfig, features: { ...siteConfig.features, faq: false } } as unknown as SiteConfig,
      locale: 'ja',
    })
    expect(documents.map((d) => d.type)).not.toContain('faq')
  })
})

describe('CORPUS_SOURCES — the code-level gate itself', () => {
  it('marks blog and news as disabled sources rather than deleting them', () => {
    // Kept in the table so the exclusion is greppable and reversible in one
    // flag, in the same shape as search-index's INDEXED_COLLECTIONS.
    const disabled = CORPUS_SOURCES.filter((s) => !s.enabled).map((s) => s.collection)
    expect(disabled.sort()).toEqual(['blog', 'news'])
  })

  it('does not list faqs at all — unlike blog/news, it is not a disabled Payload source, it is not a Payload source', () => {
    expect(CORPUS_SOURCES.map((s) => s.collection)).not.toContain('faqs')
  })
})
