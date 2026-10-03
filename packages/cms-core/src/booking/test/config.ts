/**
 * Shared configuration for the booking integration test harness.
 *
 * The concurrency tests MUST run against real PostgreSQL: they prove atomicity
 * under true row-level locking. SQLite serialises writes and disables
 * transactions by default, so it cannot validate the invariant.
 *
 * Defaults target a local Postgres reachable over the unix socket with peer
 * auth. Override via env for CI (e.g. TEST_DATABASE_URI=postgres://user:pw@host/db).
 */
export const TEST_PG_HOST = process.env['TEST_PGHOST'] ?? '/var/run/postgresql'
export const TEST_DB_NAME = process.env['TEST_DB_NAME'] ?? 'clinic_booking_test'

export const TEST_DATABASE_URI =
  process.env['TEST_DATABASE_URI'] ??
  `postgresql:///${TEST_DB_NAME}?host=${TEST_PG_HOST}`
