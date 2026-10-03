import type { Payload } from 'payload'

import type { NotificationChannelId } from './types'

const POSTGRES_UNIQUE_VIOLATION_CODE = '23505'
const SQLITE_UNIQUE_VIOLATION_CODE = 'SQLITE_CONSTRAINT_UNIQUE'
const DEDUPE_KEY_FIELD = 'dedupeKey'

/**
 * Recognizes a `dedupeKey` unique-constraint violation.
 *
 * Payload's Local API (see @payloadcms/drizzle's handleUpsertError) already
 * catches the raw Postgres/SQLite driver error itself and re-throws its own
 * `ValidationError` with `data.errors: [{ path: 'dedupeKey', ... }]` — the
 * raw driver error is NOT what reaches application code through
 * `payload.create()`. That Payload-wrapped shape is checked first (and is
 * the one that actually matters for `createNotificationIfAbsent`, which
 * always goes through the Local API); the raw-driver shape is kept as a
 * fallback for defense-in-depth against a lower-level DB client.
 */
export function isDuplicateKeyError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as {
    name?: unknown
    code?: unknown
    message?: unknown
    cause?: unknown
    data?: { errors?: Array<{ path?: unknown }> }
  }

  if (e.name === 'ValidationError' && Array.isArray(e.data?.errors)) {
    return e.data.errors.some((fieldError) => fieldError?.path === DEDUPE_KEY_FIELD)
  }
  if (e.code === POSTGRES_UNIQUE_VIOLATION_CODE || e.code === SQLITE_UNIQUE_VIOLATION_CODE) return true
  if (typeof e.message === 'string' && /duplicate key|unique constraint/i.test(e.message)) return true
  if (e.cause) return isDuplicateKeyError(e.cause)
  return false
}

export interface CreateNotificationInput {
  appointment: number | string
  channel: NotificationChannelId
  templateKey: string
  locale?: string | null
  recipient: string
  subject?: string
  html?: string
  text?: string
  scheduledFor: string
  dedupeKey: string
}

export interface CreateNotificationResult {
  created: boolean
  id?: number | string
}

/**
 * Inserts one notification row. Duplicate prevention relies entirely on the
 * `dedupeKey` UNIQUE constraint on the `notifications` collection (database
 * level, not an application-code pre-check) — for customer AND staff
 * notifications identically, since this primitive has no notion of which is
 * which. If the insert fails because that constraint was hit, this treats
 * it as "already queued" and returns `{ created: false }` instead of
 * throwing; any other error propagates to the caller.
 */
export async function createNotificationIfAbsent(
  payload: Payload,
  data: CreateNotificationInput,
): Promise<CreateNotificationResult> {
  try {
    const doc = await payload.create({
      collection: 'notifications',
      data: { status: 'pending', ...data },
    })
    return { created: true, id: (doc as { id: number | string }).id }
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return { created: false }
    }
    throw err
  }
}
