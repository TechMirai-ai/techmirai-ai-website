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
 * doc comment, and apps/clinic-demo/e2e/booking-journey.spec.ts, which
 * mocks the booking API for exactly this reason).
 *
 * Fictional identity matches WO-0's seed content exactly (see
 * seed/demo/{services,doctors}.ts): さくら接骨院 (Sakura Sekkotsuin), its 4
 * departments, and its 5 named practitioners — not generic placeholder data.
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

// Mirrors site.config.ts's contact.businessHours exactly. Previously
// missing Tuesday/Thursday/Saturday entirely, so no bookable slots ever
// existed on three of the six days the site advertises as open — found
// while fixing the same bug for a second client's booking.ts.
const CONSULTATION_HOURS: Record<number, HourWindow[]> = {
  1: [
    { startHour: 9, startMinute: 0, endHour: 12, endMinute: 0 },
    { startHour: 15, startMinute: 0, endHour: 19, endMinute: 30 },
  ], // Monday
  2: [
    { startHour: 9, startMinute: 0, endHour: 12, endMinute: 0 },
    { startHour: 15, startMinute: 0, endHour: 19, endMinute: 30 },
  ], // Tuesday
  3: [{ startHour: 9, startMinute: 0, endHour: 12, endMinute: 0 }], // Wednesday
  4: [
    { startHour: 9, startMinute: 0, endHour: 12, endMinute: 0 },
    { startHour: 15, startMinute: 0, endHour: 19, endMinute: 30 },
  ], // Thursday
  5: [
    { startHour: 9, startMinute: 0, endHour: 12, endMinute: 0 },
    { startHour: 15, startMinute: 0, endHour: 19, endMinute: 30 },
  ], // Friday
  6: [
    { startHour: 9, startMinute: 0, endHour: 12, endMinute: 0 },
    { startHour: 13, startMinute: 0, endHour: 16, endMinute: 0 },
  ], // Saturday
}

const APPOINTMENT_MINUTES = 30

const PRACTITIONERS = ['田中 大輔', '佐藤 美咲', '山本 健太', '鈴木 愛', '小林 真一']

interface BookableServiceSeed {
  ja: string
  en: string
  durationMin: number
  priceYen: number | null
  firstVisitAllowed: boolean
  sortOrder: number
}

// Matches seed/demo/services.ts's 4 departments (整形外科的施術 / スポーツ障害・
// リハビリ / 交通事故治療 / 産前産後骨盤矯正), split into a first/follow-up pair
// for the largest department (mirroring the booking UI's visit-type step)
// plus one bookable entry per remaining department.
const BOOKABLE_SERVICES: BookableServiceSeed[] = [
  { ja: '初診（整形外科的施術）', en: 'First Visit — Orthopedic Care', durationMin: 30, priceYen: null, firstVisitAllowed: true, sortOrder: 1 },
  { ja: '再診（整形外科的施術）', en: 'Follow-up — Orthopedic Care', durationMin: 20, priceYen: null, firstVisitAllowed: false, sortOrder: 2 },
  { ja: 'スポーツ障害・リハビリ', en: 'Sports Injury & Rehab', durationMin: 40, priceYen: null, firstVisitAllowed: true, sortOrder: 3 },
  { ja: '交通事故治療', en: 'Traffic Accident Treatment', durationMin: 30, priceYen: null, firstVisitAllowed: true, sortOrder: 4 },
  { ja: '産前産後骨盤矯正', en: 'Pre/Postnatal Pelvic Care', durationMin: 40, priceYen: 5000, firstVisitAllowed: true, sortOrder: 5 },
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
      priceYen: seed.priceYen,
      firstVisitAllowed: seed.firstVisitAllowed,
      active: true,
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

async function seedSlotsForResource(payload: Payload, resourceId: number | string): Promise<number> {
  await clearFutureOpenSlots(payload, resourceId)

  let count = 0
  const todayUtcMidnight = todayInJst()

  for (let dayOffset = 1; dayOffset <= SLOT_HORIZON_DAYS; dayOffset++) {
    const date = new Date(todayUtcMidnight.getTime() + dayOffset * DAY_MS)
    const windows = CONSULTATION_HOURS[date.getUTCDay()]
    if (!windows) continue

    for (const window of windows) {
      let cursorMinutes = window.startHour * 60 + window.startMinute
      const endMinutes = window.endHour * 60 + window.endMinute

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
  }
  return count
}

async function seedBooking(): Promise<void> {
  if (process.env['NODE_ENV'] === 'production' || process.env['NEXT_PHASE'] === 'phase-production-build') {
    console.log('⏭️ Skipping booking seed in production build')
    return
  }

  const dbUri = process.env['DATABASE_URI'] ?? ''
  const isLocalSqlite = dbUri.startsWith('file:') || dbUri.endsWith('.db')
  if (isLocalSqlite) {
    console.error(
      '🛑 Refusing to run: DATABASE_URI is a local SQLite file, which disables real transactions. ' +
        'The reservation engine cannot complete a booking against it. Point DATABASE_URI at a real ' +
        'Postgres database (a dedicated dev database, never production) and re-run. Aborting.',
    )
    process.exit(1)
  }

  const payload = await getPayload({ config })
  payload.logger.info(`🌱 Seeding booking data (bookable-services/resources/slots) into ${dbUri}...\n`)

  const serviceIds: (number | string)[] = []
  for (const seed of BOOKABLE_SERVICES) {
    serviceIds.push(await upsertBookableService(payload, seed))
  }
  payload.logger.info(`✅ ${serviceIds.length} bookable services ready`)

  let totalSlots = 0
  for (const [i, name] of PRACTITIONERS.entries()) {
    const resourceId = await upsertResource(payload, name, i + 1)
    const slotCount = await seedSlotsForResource(payload, resourceId)
    totalSlots += slotCount
    payload.logger.info(`   ${name}: ${slotCount} open slots over the next ${SLOT_HORIZON_DAYS} days`)
  }

  payload.logger.info(`\n✅ Booking seed complete. ${PRACTITIONERS.length} resources, ${totalSlots} total open slots.`)
  process.exit(0)
}

seedBooking().catch((err: unknown) => {
  console.error('Booking seed failed:', err)
  process.exit(1)
})
