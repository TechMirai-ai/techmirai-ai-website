import type { SQL } from '@payloadcms/db-postgres/drizzle'
import type { Payload } from 'payload'

/**
 * The transaction-scoped query runner. Postgres returns `rowCount` for
 * data-modifying statements, which the engine uses to detect a failed
 * capacity claim (zero rows affected).
 */
export interface TransactionExecutor {
  execute: (
    query: SQL,
  ) => Promise<{ rowCount: number | null; rows: Array<Record<string, unknown>> }>
}

interface AdapterWithSessions {
  sessions: Record<string, { db: TransactionExecutor }>
}

/**
 * Resolve the Drizzle handle bound to an open Payload transaction.
 *
 * Raw SQL MUST run on this handle (not `payload.db.drizzle`, which is the
 * pool-level connection) so that the conditional UPDATE and the appointment
 * INSERT commit or roll back atomically together. Payload stores the live
 * transaction under `db.sessions[transactionID].db` (see @payloadcms/drizzle
 * beginTransaction). This relies on an internal adapter shape verified against
 * payload / @payloadcms/db-postgres 3.85.0; the integration tests exercise it
 * end-to-end so a shape change surfaces as a hard test failure.
 */
export function getTransactionExecutor(
  payload: Payload,
  transactionID: number | string,
): TransactionExecutor {
  const adapter = payload.db as unknown as AdapterWithSessions
  const session = adapter.sessions[String(transactionID)]
  if (!session) {
    throw new Error(`No active transaction session for id ${transactionID}`)
  }
  return session.db
}
