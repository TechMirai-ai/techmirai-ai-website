import type { Payload } from 'payload'
import { richText } from './lib/rich-text'

const BLOG_POSTS = [
  { title: 'Demo Blog Post One', category: 'Insights', publishedAt: '2026-06-05', readTime: 6 },
  { title: 'Demo Blog Post Two', category: 'Guides', publishedAt: '2026-05-22', readTime: 8 },
  { title: 'Demo Blog Post Three', category: 'Industry News', publishedAt: '2026-05-10', readTime: 5 },
  { title: 'Demo Blog Post Four', category: 'Insights', publishedAt: '2026-04-28', readTime: 7 },
  { title: 'Demo Blog Post Five', category: 'Guides', publishedAt: '2026-04-12', readTime: 9 },
]

export async function seedDemoBlog(payload: Payload, featuredImageIds: string[]): Promise<string[]> {
  const ids: string[] = []
  for (const [i, post] of BLOG_POSTS.entries()) {
    const doc = await payload.create({
      collection: 'blog',
      locale: 'ja',
      data: {
        title: post.title,
        subtitle: 'This is a sample blog subtitle — replace with real content.',
        excerpt: 'This is a sample blog excerpt — replace with real content summarizing the article.',
        content: richText('This is a sample blog article — replace with real content.'),
        featuredImage: featuredImageIds[i]!,
        category: post.category,
        author: {
          name: 'Demo Editorial Team',
          jobTitle: 'Content Team',
        },
        readTime: post.readTime,
        publishedAt: post.publishedAt,
        slug: `demo-blog-${i + 1}`,
        active: true,
        aiVisible: true,
      },
    })
    ids.push(doc.id as string)
  }
  return ids
}
