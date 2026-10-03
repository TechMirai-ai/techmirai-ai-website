import { execFileSync } from 'node:child_process'

import { TEST_DB_NAME, TEST_PG_HOST } from './config'

/**
 * Vitest globalSetup: create a throwaway Postgres database before the suite and
 * drop it afterwards, so every run starts from a clean schema. Uses `psql`
 * (present on the host) against the maintenance `postgres` database, avoiding a
 * direct `pg` dependency in this package.
 */
function psql(database: string, sql: string): void {
  execFileSync('psql', ['-h', TEST_PG_HOST, '-d', database, '-v', 'ON_ERROR_STOP=1', '-c', sql], {
    stdio: 'pipe',
  })
}

export async function setup(): Promise<void> {
  psql('postgres', `DROP DATABASE IF EXISTS ${TEST_DB_NAME} WITH (FORCE)`)
  psql('postgres', `CREATE DATABASE ${TEST_DB_NAME}`)
}

export async function teardown(): Promise<void> {
  psql('postgres', `DROP DATABASE IF EXISTS ${TEST_DB_NAME} WITH (FORCE)`)
}
