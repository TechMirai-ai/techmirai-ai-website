import type { Payload } from 'payload'

/**
 * Pack-2/F3 "blog" page-group module. Documented no-op: `/blog` is a
 * bespoke built route (blog/page.tsx) that never reads the `pages`
 * collection, so a `pages` doc here would be dead data nothing renders.
 * The `blog` collection itself is fully cleared of leftover clinic-demo
 * posts by lib/clear.ts's clearLegacyContent — nothing further to seed
 * until Phase G writes real posts.
 */
export async function seedBlog(payload: Payload): Promise<void> {
  payload.logger.info('⏭️  blog: 0 docs seeded — /blog does not read the pages collection; real posts are Phase G')
}
