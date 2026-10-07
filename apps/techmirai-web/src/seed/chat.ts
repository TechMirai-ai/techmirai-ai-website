import type { Payload } from 'payload'

/**
 * Pack-2/F3 "chat" page-group module. Documented no-op: `chat-answers`'
 * schema already exists (Pack-2/F2), but the real C01-C10 question/answer
 * content (Content Spec §16.3) is Phase G's job, not F3's — this file exists
 * so the 16-group enumeration stays complete and gives Phase G one obvious
 * place to add real seeding later, rather than a silent gap.
 */
export async function seedChat(payload: Payload): Promise<void> {
  payload.logger.info(
    '⏭️  chat-answers: 0 docs seeded — real C01-C10 content is Spec/Phase-G scope, not F3',
  )
}
