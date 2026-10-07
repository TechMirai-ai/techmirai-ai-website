import type { Payload } from 'payload'

/**
 * Pack-2/F3 "contact" page-group module. Documented no-op: `/contact` is
 * already a fully real, non-stub page (contact/page.tsx, built on
 * form-submissions) — nothing clinic-demo-tagged to remove and no `pages`
 * doc needed, since this route never reads the `pages` collection either.
 */
export async function seedContact(payload: Payload): Promise<void> {
  payload.logger.info('⏭️  contact: nothing to seed — /contact is already a real, built page')
}
