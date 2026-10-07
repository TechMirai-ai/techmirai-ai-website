import type { Payload } from 'payload'

/**
 * Pack-2/F3 "case study" page-group module. Documented no-op: the
 * `case-studies` collection exists and is active (features.caseStudies),
 * but docs/PLACEHOLDER-REGISTER.md row F1-14 requires Sadiatec's written
 * sign-off for name/screenshots/description before any case-study content
 * can be written — not given yet, and inventing placeholder numbers/results
 * would violate CLAUDE.md's "never invent facts" and "no client counts or
 * results" rules. Real content is Phase G's job, once sign-off exists.
 */
export async function seedCaseStudies(payload: Payload): Promise<void> {
  payload.logger.info(
    '⏭️  case-studies: 0 docs seeded — Sadiatec sign-off still pending (see PLACEHOLDER-REGISTER.md F1-14)',
  )
}
