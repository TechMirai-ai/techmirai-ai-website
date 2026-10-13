import type { Payload } from 'payload'
import { TECHMIRAI_CHAT_ENTRIES } from '@techmirai/cms-core/reception'
import { createLocalizedDoc } from '@techmirai/cms-core/seed'
import { richText } from './lib/rich-text'

// Spec §16.3 "Topic" column — the admin-only label for each chat-only answer.
const TOPICS: Record<string, string> = {
  C01: 'Greeting',
  C02: 'Thanks',
  C03: 'Contact details',
  C04: 'Location',
  C05: 'Brochure',
  C06: 'Discount or negotiation',
  C07: 'Other companies',
  C08: 'Complaint',
  C09: 'AI training on data',
  C10: 'Jobs and partnerships',
}

/**
 * Pack-4/K1 "chat" page-group module: the Spec §16.3 chat-only answers C01–C10
 * as editable `chat-answers` records, text copied from the same source the
 * widget uses (cms-core reception/techmirai-chat-content.ts).
 *
 * The widget does NOT read this collection at runtime — it renders from code
 * (see docs/FINDINGS.md, K1). These records exist so the Spec's "load into the
 * CMS" has a home, and so a future runtime fetch has data to read. Editing one
 * here changes nothing a visitor sees until that fetch is built.
 *
 * `nextButtons` is left unseeded: its localized label inside an array row is
 * exactly the shape lib/locale-safety.ts guards against, and the buttons live
 * in code. Idempotent: an `answerId` that already exists is skipped.
 */
export async function seedChat(payload: Payload): Promise<void> {
  const answers = TECHMIRAI_CHAT_ENTRIES.filter((entry) => entry.code.startsWith('C'))
  let created = 0

  for (const [index, entry] of answers.entries()) {
    const existing = await payload.find({
      collection: 'chat-answers',
      where: { answerId: { equals: entry.code } },
      limit: 1,
      depth: 0,
    })
    if (existing.docs[0]) continue

    const base = { answerId: entry.code, topic: TOPICS[entry.code] ?? entry.code, sortOrder: index + 1, active: true }
    await createLocalizedDoc(payload, 'chat-answers', {
      en: { ...base, keywords: entry.keywords?.en.join(', ') ?? '', answer: richText(entry.answer.en) },
      ja: { ...base, keywords: entry.keywords?.ja.join(', ') ?? '', answer: richText(entry.answer.ja) },
    })
    created += 1
  }

  payload.logger.info(`💬 chat-answers: ${created} created, ${answers.length - created} already present (C01–C10)`)
}
