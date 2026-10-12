import { getPayload } from 'payload'
import type { Payload, Where } from 'payload'
import config from '../../payload.config'

/**
 * Real, committed booking-data seed for the reservation engine's own
 * collections (bookable-services/resources/slots) — separate from
 * seed/demo/*.ts, which only covers marketing content and explicitly
 * refuses to run against anything but local SQLite. This one is the
 * opposite: booking data must live in a real Postgres database, since the
 * reservation engine's atomic booking logic needs real transactions
 * (SQLite disables them for this app — see booking/test/config.ts's own
 * doc comment, and apps/techmirai-web/e2e/booking-journey.spec.ts, which
 * mocks the booking API for exactly this reason).
 *
 * Pack-4/J2 (Spec §12.4): the four consultation services below replace the
 * clinic-demo services, and ONE demo resource carries the demo slots. The
 * clinic-demo services/resources from earlier seeds are deactivated (never
 * deleted) so a dev database that already has them stops offering them.
 *
 * Run via `pnpm seed:booking`. Safe to re-run: services/resources are
 * upserted by name (created once, left alone after), and only *future,
 * still-open* slots are refreshed each run — past slots and anything with
 * a real booking against it (bookedCount > 0) are never touched, so a
 * reseed can never violate the booking-indexes migration's ON DELETE
 * RESTRICT constraints or erase a real test booking.
 */

const DAY_MS = 24 * 60 * 60 * 1000
const SLOT_HORIZON_DAYS = 14
const JST_OFFSET_HOURS = 9

interface HourWindow {
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
}

/**
 * The Spec gives the demo window only as the bracketed `[9:00-18:00]`
 * (WORK-ORDER.md §219: "Dummy slots are fine ... Mark them as demo"), so it
 * stays a single named constant — nothing here asserts it is confirmed.
 * Which time zone these wall-clock hours are in is open decision D2; the
 * generator below keeps the pre-existing JST conversion unchanged until then.
 */
const DEMO_WINDOW: HourWindow = { startHour: 9, startMinute: 0, endHour: 18, endMinute: 0 }
const DEMO_WEEKDAYS: readonly number[] = [1, 2, 3, 4, 5] // Monday to Friday (getUTCDay())

const APPOINTMENT_MINUTES = 30

/**
 * Decision D4 (approved by Jamal): one shared calendar/resource named
 * "TechMirai" — no person is named. The slots generated for it are DEMO
 * availability and must be replaced with real availability before launch.
 */
const DEMO_RESOURCE_NAME = 'TechMirai'

/** The resource name used by the first J2 seed run, retired when the shared "TechMirai" calendar replaced it. */
const SUPERSEDED_PLACEHOLDER_RESOURCE_NAME = '[Demo resource — CONFIRM]'

interface BookableServiceSeed {
  ja: string
  en: string
  durationMin: number
  active: boolean
  sortOrder: number
}

/**
 * Spec §12.4 bookable services (EN / JA / length). `visit` keeps the Spec's
 * bracketed names and `[60 min]` verbatim and is seeded INACTIVE: the engine
 * reserves a single slot and ignores duration, so a 60-minute visit cannot be
 * booked safely until open decision D3 is resolved.
 */
const BOOKABLE_SERVICES: BookableServiceSeed[] = [
  { ja: '無料オンライン相談', en: 'Free online consultation', durationMin: 30, active: true, sortOrder: 1 },
  { ja: 'デモのご案内', en: 'Live demo walkthrough', durationMin: 30, active: true, sortOrder: 2 },
  { ja: 'AI受付（電話）のデモ', en: 'AI受付 Voice demo', durationMin: 30, active: true, sortOrder: 3 },
  {
    ja: '[訪問でのご相談 — 対応エリアと担当を確認中]',
    en: '[In-person consultation — CONFIRM area and who visits]',
    durationMin: 60,
    active: false,
    sortOrder: 4,
  },
]

// Clinic-demo leftovers from the original seed (deactivated, never deleted).
const LEGACY_SERVICE_NAMES_JA = [
  '初診（整形外科的施術）',
  '再診（整形外科的施術）',
  'スポーツ障害・リハビリ',
  '交通事故治療',
  '産前産後骨盤矯正',
]
const LEGACY_RESOURCE_NAMES = [
  '田中 大輔',
  '佐藤 美咲',
  '山本 健太',
  '鈴木 愛',
  '小林 真一',
  SUPERSEDED_PLACEHOLDER_RESOURCE_NAME,
]

/** JST wall-clock time on a given UTC calendar date, expressed as UTC (JST = UTC+9, no DST). */
function jstToUtcIso(dateUtcMidnight: Date, hour: number, minute: number): string {
  const utc = new Date(dateUtcMidnight)
  utc.setUTCHours(hour - JST_OFFSET_HOURS, minute, 0, 0)
  return utc.toISOString()
}

/**
 * Today's JST calendar date, at UTC midnight. Reading `new Date()`'s raw
 * UTC calendar components is wrong here — during UTC 15:00-23:59 (JST
 * 00:00-08:59 the next day), that's still yesterday's JST date, which
 * shifted the whole slot horizon and weekday lookup back a day for ~9
 * hours of every 24.
 */
function todayInJst(): Date {
  const nowJst = new Date(Date.now() + JST_OFFSET_HOURS * 60 * 60 * 1000)
  return new Date(Date.UTC(nowJst.getUTCFullYear(), nowJst.getUTCMonth(), nowJst.getUTCDate()))
}

async function findOneByName(payload: Payload, collection: string, name: string): Promise<{ id: number | string } | null> {
  const { docs } = await payload.find({ collection, where: { name: { equals: name } }, limit: 1, depth: 0 })
  return (docs[0] as { id: number | string } | undefined) ?? null
}

async function upsertResource(payload: Payload, name: string, sortOrder: number): Promise<number | string> {
  const existing = await findOneByName(payload, 'resources', name)
  if (existing) return existing.id
  const doc = await payload.create({
    collection: 'resources',
    data: { name, kind: 'practitioner', active: true, sortOrder },
  })
  return doc.id as number | string
}

async function upsertBookableService(payload: Payload, seed: BookableServiceSeed): Promise<number | string> {
  const existing = await findOneByName(payload, 'bookable-services', seed.ja)
  if (existing) return existing.id
  const doc = await payload.create({
    collection: 'bookable-services',
    locale: 'ja',
    data: {
      name: seed.ja,
      durationMin: seed.durationMin,
      priceYen: null,
      firstVisitAllowed: true,
      active: seed.active,
      sortOrder: seed.sortOrder,
    },
  })
  await payload.update({
    collection: 'bookable-services',
    id: doc.id,
    locale: 'en',
    data: { name: seed.en },
  })
  return doc.id as number | string
}

/** Deletes only future, still-open (bookedCount 0) slots for a resource — never past or booked ones. */
async function clearFutureOpenSlots(payload: Payload, resourceId: number | string): Promise<void> {
  const where: Where = {
    and: [
      { resource: { equals: resourceId } },
      { startsAt: { greater_than: new Date().toISOString() } },
      { bookedCount: { equals: 0 } },
    ],
  }
  const { docs } = await payload.find({ collection: 'slots', where, limit: 1000, depth: 0 })
  for (const doc of docs) {
    await payload.delete({ collection: 'slots', id: doc.id })
  }
}

/** Marks any pre-J2 clinic-demo service/resource inactive (and drops its future open slots). Returns how many rows changed. */
async function deactivateLegacyClinicData(payload: Payload): Promise<number> {
  let changed = 0
  for (const name of LEGACY_SERVICE_NAMES_JA) {
    const existing = await findOneByName(payload, 'bookable-services', name)
    if (!existing) continue
    await payload.update({ collection: 'bookable-services', id: existing.id, data: { active: false } })
    changed++
  }
  for (const name of LEGACY_RESOURCE_NAMES) {
    const existing = await findOneByName(payload, 'resources', name)
    if (!existing) continue
    await clearFutureOpenSlots(payload, existing.id)
    await payload.update({ collection: 'resources', id: existing.id, data: { active: false } })
    changed++
  }
  return changed
}

async function seedSlotsForResource(payload: Payload, resourceId: number | string): Promise<number> {
  await clearFutureOpenSlots(payload, resourceId)

  let count = 0
  const todayUtcMidnight = todayInJst()

  for (let dayOffset = 1; dayOffset <= SLOT_HORIZON_DAYS; dayOffset++) {
    const date = new Date(todayUtcMidnight.getTime() + dayOffset * DAY_MS)
    if (!DEMO_WEEKDAYS.includes(date.getUTCDay())) continue

    let cursorMinutes = DEMO_WINDOW.startHour * 60 + DEMO_WINDOW.startMinute
    const endMinutes = DEMO_WINDOW.endHour * 60 + DEMO_WINDOW.endMinute

    while (cursorMinutes + APPOINTMENT_MINUTES <= endMinutes) {
      const startHour = Math.floor(cursorMinutes / 60)
      const startMinute = cursorMinutes % 60
      const endTotal = cursorMinutes + APPOINTMENT_MINUTES
      const endHour = Math.floor(endTotal / 60)
      const endMinute = endTotal % 60

      await payload.create({
        collection: 'slots',
        data: {
          resource: resourceId,
          startsAt: jstToUtcIso(date, startHour, startMinute),
          endsAt: jstToUtcIso(date, endHour, endMinute),
          capacity: 1,
          status: 'open',
        },
      })
      count++
      cursorMinutes += APPOINTMENT_MINUTES
    }
  }
  return count
}

/**
 * Seeds bookable-services/resources/slots into an already-booted `payload`
 * instance. Exported so apps/techmirai-web/src/seed/index.ts's unified
 * `pnpm seed` orchestrator can call this directly (reusing its own
 * already-initialized Payload instance) alongside the standalone
 * `pnpm seed:booking` entrypoint below — Pack-2/F3 explicitly keeps this
 * mechanism as-is, only changing its shape from a top-level script to a
 * callable function.
 */
export async function seedBooking(payload: Payload): Promise<void> {
  const dbUri = process.env['DATABASE_URI'] ?? ''
  const isLocalSqlite = dbUri.startsWith('file:') || dbUri.endsWith('.db')
  if (isLocalSqlite) {
    throw new Error(
      'Refusing to seed booking data: DATABASE_URI is a local SQLite file, which disables real ' +
        'transactions. The reservation engine cannot complete a booking against it. Point DATABASE_URI ' +
        'at a real Postgres database (a dedicated dev database, never production) and re-run.',
    )
  }

  payload.logger.info('🌱 Seeding booking data (bookable-services/resources/slots)...\n')

  const legacyChanged = await deactivateLegacyClinicData(payload)
  if (legacyChanged > 0) payload.logger.info(`   Deactivated ${legacyChanged} legacy clinic-demo service/resource rows`)

  const serviceIds: (number | string)[] = []
  for (const seed of BOOKABLE_SERVICES) {
    serviceIds.push(await upsertBookableService(payload, seed))
  }
  payload.logger.info(`✅ ${serviceIds.length} bookable services ready (the in-person visit is inactive — see D3)`)

  const resourceId = await upsertResource(payload, DEMO_RESOURCE_NAME, 1)
  const slotCount = await seedSlotsForResource(payload, resourceId)

  payload.logger.info(
    `\n✅ Booking seed complete. 1 shared resource ("${DEMO_RESOURCE_NAME}"), ${slotCount} DEMO open slots over the next ` +
      `${SLOT_HORIZON_DAYS} days — replace with real availability before launch.`,
  )
}

async function runStandalone(): Promise<void> {
  if (process.env['NODE_ENV'] === 'production' || process.env['NEXT_PHASE'] === 'phase-production-build') {
    console.log('⏭️ Skipping booking seed in production build')
    return
  }
  const payload = await getPayload({ config })
  await seedBooking(payload)
  process.exit(0)
}

// Only run the CLI wrapper when this file is executed directly (`pnpm
// seed:booking`), not when `seedBooking` is imported by index.ts.
if (import.meta.url === `file://${process.argv[1]}`) {
  runStandalone().catch((err: unknown) => {
    console.error('Booking seed failed:', err)
    process.exit(1)
  })
}
