import type { AvailabilityResponse, BookableService } from '../../api/schemas'

/**
 * Shared fixtures for booking/ui component tests. vi.mock() calls themselves
 * must stay inline in each test file (Vitest hoists them per-file), but
 * sample data is safe to share here so tests don't re-derive it.
 */

export const SAMPLE_SERVICE: BookableService = {
  id: 1,
  name: 'General Checkup',
  duration_min: 30,
  price_yen: 3000,
  first_visit_allowed: true,
}

export function buildAvailability(date: string, time: string, overrides: Partial<AvailabilityResponse['dates'][number]['slots'][number]> = {}): AvailabilityResponse {
  return {
    dates: [
      {
        date,
        slots: [
          {
            slot_id: 5,
            resource_id: 20,
            starts_at: `${date}T${time}:00.000Z`,
            ends_at: `${date}T${time.slice(0, 2)}:30:00.000Z`,
            capacity: 4,
            remaining_capacity: 4,
            ...overrides,
          },
        ],
      },
    ],
  }
}

/** A mocked useTranslations that preserves interpolation params (as a JSON suffix) instead of discarding them, so tests can still tell distinct calls apart. */
export function interpolatingTranslate(key: string, params?: Record<string, unknown>): string {
  return params ? `${key}:${JSON.stringify(params)}` : key
}
