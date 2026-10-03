/**
 * Payload document IDs are numbers on SQLite (serial primary key) and strings
 * on Postgres/Mongo — normalize to a string for use as a React key or filter.
 */
export function toIdString(id: unknown): string {
  return typeof id === 'string' || typeof id === 'number' ? String(id) : ''
}
