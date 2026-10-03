import { sql } from '@payloadcms/db-postgres/drizzle'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Indexes and constraints for the booking module that Payload field config
 * cannot express:
 *   - the composite index slots(resource_id, starts_at)
 *   - the partial index slots(starts_at) WHERE status = 'open'
 *   - the availability index slots(resource_id, starts_at) WHERE status = 'open'
 *   - foreign-key indexes on appointments(slot_id) and appointments(service_id)
 *   - CHECK constraints keeping booked_count within [0, capacity], capacity
 *     positive, the counters integral, and ends_at after starts_at
 *   - re-asserting the required relationship FKs as ON DELETE RESTRICT
 *
 * Payload generates required relationship FKs with ON DELETE SET NULL, which
 * on a NOT NULL column turns an in-use delete into a confusing raw not-null
 * error. RESTRICT makes "you can't delete a resource/slot/customer/service
 * that is still referenced" the explicit, predictable failure.
 *
 * The single-column indexes appointments(scheduled_at), appointments(customer_id)
 * and customers(phone) are declared with `index: true` on their fields, so
 * Payload/Drizzle create them directly and they are not repeated here.
 *
 * Statements are idempotent so this can run after a Drizzle `push` or as a
 * Payload migration. Exported both as a plain helper (used in tests and app
 * bootstrap) and as Payload `up`/`down` migration functions.
 */

/** Minimal Drizzle-compatible executor: the pool handle or a transaction handle. */
export interface DdlExecutor {
  execute: (query: ReturnType<typeof sql>) => Promise<unknown>
}

export async function applyBookingIndexes(db: DdlExecutor): Promise<void> {
  // --- Indexes -------------------------------------------------------------
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS slots_resource_starts_at_idx ON slots (resource_id, starts_at)`,
  )
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS slots_starts_at_open_idx ON slots (starts_at) WHERE status = 'open'`,
  )
  // Serves the hot path: open slots for a resource, time-ordered.
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS slots_resource_starts_at_open_idx ON slots (resource_id, starts_at) WHERE status = 'open'`,
  )
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS appointments_slot_id_idx ON appointments (slot_id)`,
  )
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS appointments_service_id_idx ON appointments (service_id)`,
  )

  // --- CHECK constraints (drop-then-add keeps definitions authoritative) ----
  await db.execute(sql`ALTER TABLE slots DROP CONSTRAINT IF EXISTS slots_booked_count_within_capacity`)
  await db.execute(sql`ALTER TABLE slots DROP CONSTRAINT IF EXISTS slots_capacity_positive`)
  await db.execute(sql`ALTER TABLE slots DROP CONSTRAINT IF EXISTS slots_counts_integer`)
  await db.execute(sql`ALTER TABLE slots DROP CONSTRAINT IF EXISTS slots_ends_after_starts`)
  await db.execute(
    sql`ALTER TABLE slots ADD CONSTRAINT slots_booked_count_within_capacity CHECK (booked_count >= 0 AND booked_count <= capacity)`,
  )
  await db.execute(sql`ALTER TABLE slots ADD CONSTRAINT slots_capacity_positive CHECK (capacity > 0)`)
  await db.execute(
    sql`ALTER TABLE slots ADD CONSTRAINT slots_counts_integer CHECK (booked_count = trunc(booked_count) AND capacity = trunc(capacity))`,
  )
  await db.execute(sql`ALTER TABLE slots ADD CONSTRAINT slots_ends_after_starts CHECK (ends_at > starts_at)`)

  // --- Foreign keys → ON DELETE RESTRICT -----------------------------------
  // Drop whatever FKs Payload generated on these tables (names are
  // auto-generated), then re-add with RESTRICT under stable names.
  await db.execute(sql`
    DO $$
    DECLARE r record;
    BEGIN
      FOR r IN
        SELECT conname, conrelid::regclass::text AS tbl
        FROM pg_constraint
        WHERE contype = 'f' AND conrelid IN ('slots'::regclass, 'appointments'::regclass)
      LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
      END LOOP;
    END $$;
  `)
  await db.execute(
    sql`ALTER TABLE slots ADD CONSTRAINT slots_resource_id_fk FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE RESTRICT`,
  )
  await db.execute(
    sql`ALTER TABLE appointments ADD CONSTRAINT appointments_slot_id_fk FOREIGN KEY (slot_id) REFERENCES slots (id) ON DELETE RESTRICT`,
  )
  await db.execute(
    sql`ALTER TABLE appointments ADD CONSTRAINT appointments_customer_id_fk FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT`,
  )
  await db.execute(
    sql`ALTER TABLE appointments ADD CONSTRAINT appointments_service_id_fk FOREIGN KEY (service_id) REFERENCES bookable_services (id) ON DELETE RESTRICT`,
  )
}

export async function dropBookingIndexes(db: DdlExecutor): Promise<void> {
  await db.execute(sql`ALTER TABLE slots DROP CONSTRAINT IF EXISTS slots_ends_after_starts`)
  await db.execute(sql`ALTER TABLE slots DROP CONSTRAINT IF EXISTS slots_counts_integer`)
  await db.execute(sql`ALTER TABLE slots DROP CONSTRAINT IF EXISTS slots_capacity_positive`)
  await db.execute(sql`ALTER TABLE slots DROP CONSTRAINT IF EXISTS slots_booked_count_within_capacity`)

  await db.execute(sql`DROP INDEX IF EXISTS appointments_service_id_idx`)
  await db.execute(sql`DROP INDEX IF EXISTS appointments_slot_id_idx`)
  await db.execute(sql`DROP INDEX IF EXISTS slots_resource_starts_at_open_idx`)
  await db.execute(sql`DROP INDEX IF EXISTS slots_starts_at_open_idx`)
  await db.execute(sql`DROP INDEX IF EXISTS slots_resource_starts_at_idx`)

  // Restore Payload's default FK behaviour (ON DELETE SET NULL).
  await db.execute(sql`ALTER TABLE slots DROP CONSTRAINT IF EXISTS slots_resource_id_fk`)
  await db.execute(sql`ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_slot_id_fk`)
  await db.execute(sql`ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_customer_id_fk`)
  await db.execute(sql`ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_service_id_fk`)
  await db.execute(
    sql`ALTER TABLE slots ADD CONSTRAINT slots_resource_id_fk FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE SET NULL`,
  )
  await db.execute(
    sql`ALTER TABLE appointments ADD CONSTRAINT appointments_slot_id_fk FOREIGN KEY (slot_id) REFERENCES slots (id) ON DELETE SET NULL`,
  )
  await db.execute(
    sql`ALTER TABLE appointments ADD CONSTRAINT appointments_customer_id_fk FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL`,
  )
  await db.execute(
    sql`ALTER TABLE appointments ADD CONSTRAINT appointments_service_id_fk FOREIGN KEY (service_id) REFERENCES bookable_services (id) ON DELETE SET NULL`,
  )
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await applyBookingIndexes(db as unknown as DdlExecutor)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await dropBookingIndexes(db as unknown as DdlExecutor)
}
