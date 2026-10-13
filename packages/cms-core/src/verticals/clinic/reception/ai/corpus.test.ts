import { describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'
import type { SiteConfig } from '../../../../schema/site-config'
import { ALL_ENTRIES } from '../techmirai-chat-content'
import { AI_PAGE_SLUGS, compileAiCorpus, CORPUS_SOURCES } from './corpus'

// A fake Payload, not a database: what is being tested is which collections
// are asked for, with what filters, and how the answers are serialized.

interface FakeCall {
  collection: string
  where: unknown
  depth: unknown
  locale: unknown
  limit: unknown
}

function lexical(text: string) {
  return { root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text }] }] } }
}

const DOCS: Record<string, unknown[]> = {
  services: [{ slug: 'starter', title: 'スタートパッケージ', excerpt: '初期費用と月額', body: lexical('無料診断のあとにお見積りします。') }],
  team: [
    { slug: 'founder', name: 'ジャマル・シャー', title: '代表', bio: lexical('AI受付をつくるチームの代表です。') },
    // Placeholders the seed keeps for facts it was not given — never grounded.
    { slug: 'new-engineer', name: 'New Engineer', title: '[TBD: role]', bio: lexical('[TBD: bio not yet supplied]') },
    { slug: 'unnamed', name: '[TBD: name]', title: 'Engineer', bio: lexical('Builds things.') },
    { slug: 'half', name: 'Haruka', title: '[TBD: role]', bio: lexical('Client relations.') },
  ],
  pages: [
    {
      slug: 'home',
      title: 'Home',
      meta: { description: '小さなお店のためのAI受付です。' },
      layout: [
        {
          blockType: 'hero',
          id: '65f0a1b2c3d4e5f60718293a',
          headline: 'お店の受付を、いつでも。',
          backgroundImage: '65f0a1b2c3d4e5f60718293b',
          sideCards: [{ title: 'ご利用の流れ', description: '無料診断からはじめます。', ctaHref: '/faq' }],
        },
        { blockType: 'blog-teaser', heading: '最新のコラム', selectedPosts: ['12', '13'] },
        { blockType: 'services-grid', layout: 'alternating', scrollSpeed: 'medium', heading: '業種別の活用', cta: { label: 'Learn more', href: '/solutions' } },
        { blockType: 'rich-text', content: lexical('日本語と英語に対応しています。') },
        { blockType: 'rich-text', content: '[TBD: Spec copy not yet seeded]' },
      ],
    },
    {
      slug: 'pricing',
      title: '[JA TODO]',
      meta: { description: '[TBD: Spec Pricing page description not yet seeded]' },
      layout: [{ blockType: 'rich-text', content: lexical('初期費用と月額は無料診断のあとにご提示します。') }],
    },
  ],
  blog: [{ slug: 'column', title: '導入事例コラム', excerpt: '現場の声', content: lexical('毎日ストレッチを。') }],
  news: [{ slug: 'closed', title: '年末年始のお知らせ', excerpt: '12/29〜1/3', content: lexical('休業します。') }],
  'case-studies': [{ slug: 'sadiatec', title: 'Sadiatec', tagline: '導入事例', challenge: lexical('課題。') }],
  seminars: [{ slug: 'seminar', title: 'セミナー', excerpt: '開催', description: lexical('説明。') }],
}

function fakePayload(calls: FakeCall[]) {
  const findGlobal = vi.fn(async () => ({ legalName: 'Sadiatec Co., Ltd.', foundedYear: 2005 }))
  const payload = {
    find: vi.fn(async ({ collection, where, depth, locale, limit }: Record<string, unknown>) => {
      calls.push({ collection: String(collection), where, depth, locale, limit })
      return { docs: DOCS[String(collection)] ?? [] }
    }),
    findGlobal,
  } as unknown as Payload
  return { payload, findGlobal }
}

const siteConfig = {
  site: { name: 'TechMirai' },
  features: {
    faq: true,
    // Every feature TRUE, so what the tests prove is that the code-level gate —
    // not the flags — decides what the AI may read.
    services: true,
    team: true,
    company: true,
    blog: true,
    news: true,
    caseStudies: true,
    seminars: true,
  },
} as unknown as SiteConfig

async function compile(config: SiteConfig = siteConfig, locale = 'ja') {
  const calls: FakeCall[] = []
  const { payload, findGlobal } = fakePayload(calls)
  const documents = await compileAiCorpus({ payload, siteConfig: config, locale })
  return { calls, documents, findGlobal }
}

describe('compileAiCorpus — what the AI is allowed to be grounded on', () => {
  it('queries the pages whitelist, services, team and seminars (each gated by its feature flag) and nothing else', async () => {
    const { calls } = await compile()
    expect([...new Set(calls.map((c) => c.collection))].sort()).toEqual(['pages', 'seminars', 'services', 'team'])
  })

  it('never queries blog or news (blog posts wait for Japanese review), or the Sadiatec case study', async () => {
    const { calls, documents } = await compile()

    for (const collection of ['blog', 'news', 'case-studies', 'faqs']) {
      expect(calls.map((c) => c.collection), collection).not.toContain(collection)
    }
    expect(documents.map((d) => d.type)).not.toContain('blog')
    expect(documents.map((d) => d.type)).not.toContain('case-study')
  })

  it('skips a source whose site feature is off', async () => {
    const off = { ...siteConfig, features: { ...siteConfig.features, services: false, team: false, seminars: false, company: false } }
    const { calls, findGlobal } = await compile(off as unknown as SiteConfig)

    expect([...new Set(calls.map((c) => c.collection))]).toEqual(['pages'])
    expect(findGlobal).not.toHaveBeenCalled()
  })

  it('reads the company-info global when features.company is on', async () => {
    const { findGlobal, documents } = await compile()
    expect(findGlobal).toHaveBeenCalledTimes(1)
    expect(documents.map((d) => d.type)).toContain('company')
  })

  it('leaks no blog or news text through the homepage that references them', async () => {
    const { documents } = await compile()
    const serialized = JSON.stringify(documents)

    expect(serialized).not.toContain('導入事例コラム')
    expect(serialized).not.toContain('年末年始のお知らせ')
    expect(serialized).not.toContain('毎日ストレッチを')
  })

  it('queries at depth 0 so relationship fields cannot populate excluded documents', async () => {
    const { calls } = await compile()
    expect(calls.every((c) => c.depth === 0)).toBe(true)
  })

  it('includes the chat answers, the listed pages, services, team, seminars and the company global', async () => {
    const { documents } = await compile()
    expect([...new Set(documents.map((d) => d.type))].sort()).toEqual(['company', 'faq', 'page', 'seminar', 'service', 'team'])
  })

  it('filters every query on aiVisible', async () => {
    const { calls } = await compile()
    expect(calls.every((c) => JSON.stringify(c.where).includes('aiVisible'))).toBe(true)
  })
})

describe('compileAiCorpus — Spec §16.6 pages', () => {
  it('asks the pages collection for exactly the §16.6 slugs', async () => {
    const { calls } = await compile()
    const pagesCall = calls.find((c) => c.collection === 'pages')

    expect(JSON.stringify(pagesCall?.where)).toContain(JSON.stringify([...AI_PAGE_SLUGS]))
    expect(pagesCall?.limit).toBe(AI_PAGE_SLUGS.length)
  })

  it('lists home, the AI受付 page, every solutions page and the other §16.6 pages', () => {
    expect([...AI_PAGE_SLUGS].sort()).toEqual(
      [
        'about', 'ai-reception', 'automobile', 'beauty', 'clinic', 'faq', 'home', 'hotel',
        'how-it-works', 'integrations', 'pricing', 'security', 'solutions', 'technology',
      ].sort(),
    )
  })

  it.each(['thanks', 'privacy', 'terms', 'legal-notice', 'assessment', 'contact'])('excludes %s', (slug) => {
    expect(AI_PAGE_SLUGS).not.toContain(slug)
  })
})

describe('compileAiCorpus — page text', () => {
  it('extracts homepage block copy — including rich text — but not ids, hrefs or media references', async () => {
    const { documents } = await compile()
    const home = documents.find((d) => d.type === 'page' && d.slug === 'home')

    expect(home?.content).toContain('お店の受付を、いつでも。')
    expect(home?.content).toContain('無料診断からはじめます。')
    expect(home?.content).toContain('日本語と英語に対応しています。')
    expect(home?.content).toContain('小さなお店のためのAI受付です。')
    expect(home?.content).not.toContain('/faq')
    expect(home?.content).not.toContain('65f0a1b2c3d4e5f60718293b')
  })

  it('drops select-field enum values, which read as stray words in the grounding context', async () => {
    const { documents } = await compile()
    const home = documents.find((d) => d.type === 'page' && d.slug === 'home')

    expect(home?.content).toContain('業種別の活用')
    expect(home?.content).toContain('Learn more') // real copy, has a space
    expect(home?.content).not.toContain('alternating')
    expect(home?.content).not.toContain('medium')
  })

  it('drops [TBD] and [JA TODO] placeholders — the model would quote them as answers', async () => {
    const { documents } = await compile()
    const serialized = JSON.stringify(documents.filter((d) => d.type === 'page'))

    expect(serialized).not.toContain('[TBD')
    expect(serialized).not.toContain('JA TODO')
    const pricing = documents.find((d) => d.slug === 'pricing')
    expect(pricing?.title).toBe('pricing')
    expect(pricing?.content).toContain('初期費用と月額は無料診断のあとにご提示します。')
  })
})

describe('compileAiCorpus — team documents never carry a placeholder', () => {
  it('keeps a real member and drops one whose name is a placeholder', async () => {
    const { documents } = await compile()
    const team = documents.filter((d) => d.type === 'team')

    expect(team.map((d) => d.title)).toContain('ジャマル・シャー')
    expect(team.map((d) => d.slug)).not.toContain('unnamed')
  })

  it('drops a member that is nothing but placeholders (the seed\'s new-engineer entry)', async () => {
    const { documents } = await compile()
    expect(documents.map((d) => d.slug)).not.toContain('new-engineer')
  })

  it('drops only the placeholder line of a member that has real content', async () => {
    const { documents } = await compile()
    const haruka = documents.find((d) => d.slug === 'half')

    expect(haruka?.content).toBe('Client relations.')
    expect(JSON.stringify(documents.filter((d) => d.type === 'team'))).not.toContain('[TBD')
  })
})

describe('compileAiCorpus — the chat answers as grounding', () => {
  it('includes every answer the chat can give, once, except placeholders and the rule-13 redirect', async () => {
    const { documents } = await compile(siteConfig, 'en')
    const faqs = documents.filter((d) => d.type === 'faq')
    const texts = faqs.map((d) => d.content)

    expect(new Set(texts).size).toBe(texts.length)
    expect(texts).not.toContain('[CONFIRM]')
    expect(JSON.stringify(faqs)).not.toContain('RULE13')
    expect(JSON.stringify(faqs)).not.toContain('TBD: polite redirect')
    // Spec §16.7 row 14 grounding: the demo is a clinic, and only that.
    expect(texts.some((t) => t.includes('Our live demo is a working clinic website'))).toBe(true)
    // F23, F20 and the published prices are there too.
    expect(texts.some((t) => t.includes('founded by Jamal Shah'))).toBe(true)
    expect(texts.some((t) => t.includes('[¥300,000]'))).toBe(true)
  })

  it('leaves out an answer that is wholly a bracketed placeholder (F19, F24)', async () => {
    const { documents } = await compile(siteConfig, 'en')
    const slugs = documents.filter((d) => d.type === 'faq').map((d) => d.slug)

    expect(slugs).not.toContain('f19')
    expect(slugs).not.toContain('f24')
    // F17 says exactly what B3 says, so only the first of the two is included.
    expect(slugs).toContain('b3')
    expect(slugs).not.toContain('f17')
  })

  it('serializes each document from the requested locale', async () => {
    const ja = (await compile(siteConfig, 'ja')).documents.find((d) => d.slug === 'f05')
    const en = (await compile(siteConfig, 'en')).documents.find((d) => d.slug === 'f05')

    expect(ja?.title).toBe('対応言語は？')
    expect(ja?.content).toBe('日本語と英語に標準対応しています。その他の言語もご相談ください。')
    expect(en?.title).toBe('Which languages does it support?')
    expect(en?.content).toBe('Japanese and English as standard. Other languages can be added on request.')
  })

  it('carries no leftover clinic content', async () => {
    const { documents } = await compile(siteConfig, 'en')
    expect(JSON.stringify(documents.filter((d) => d.type === 'faq'))).not.toMatch(/osteopath|practitioner|insurance card|接骨院/i)
  })

  it('has at most one document per answer text, from the same entries the chat shows', async () => {
    const { documents } = await compile(siteConfig, 'en')
    const faqCount = documents.filter((d) => d.type === 'faq').length
    expect(faqCount).toBeLessThanOrEqual(ALL_ENTRIES.length)
    expect(faqCount).toBeGreaterThan(30)
  })

  it('skips the chat-answer documents when features.faq is off', async () => {
    const { documents } = await compile({ ...siteConfig, features: { ...siteConfig.features, faq: false } } as unknown as SiteConfig)
    expect(documents.map((d) => d.type)).not.toContain('faq')
  })
})

describe('CORPUS_SOURCES — the code-level gate itself', () => {
  it('keeps every excluded source in the table, switched off, so the exclusion is greppable and reversible in one flag', () => {
    // blog (after Japanese review), news (time-sensitive), case-studies (the Sadiatec exclusion, Jamal's K2 decision).
    const disabled = CORPUS_SOURCES.filter((s) => !s.enabled).map((s) => s.collection)
    expect(disabled.sort()).toEqual(['blog', 'case-studies', 'news'])
  })

  it('leaves services, pages, team and seminars enabled, as before K2', () => {
    expect(CORPUS_SOURCES.filter((s) => s.enabled).map((s) => s.collection)).toEqual(['services', 'pages', 'team', 'seminars'])
  })

  it('does not list faqs at all — it is not a Payload source', () => {
    expect(CORPUS_SOURCES.map((s) => s.collection)).not.toContain('faqs')
  })
})
