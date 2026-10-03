export type AvailabilitySymbol = '◎' | '○' | '△' | '×' | '−'
export type AvailabilityLabelKey = 'plenty' | 'available' | 'few' | 'full' | 'closed'

export interface AvailabilityTier {
  symbol: AvailabilitySymbol
  labelKey: AvailabilityLabelKey
}

export interface SlotCapacity {
  capacity: number
  remaining_capacity: number
}

// remaining/capacity ratio boundaries for the 3 nonzero tiers. Both
// boundaries are inclusive on their "better" side (>= PLENTY is ◎, <= FEW is
// △), so a ratio can never fall between tiers.
const FEW_REMAINING_RATIO = 0.3
const PLENTY_REMAINING_RATIO = 0.7

/**
 * Maps a slot's capacity/remaining_capacity (or `undefined`, when no slot
 * document exists for a calendar cell at all) to one of the 5 availability
 * tiers the spec requires shown with both a symbol and a color, never color
 * alone: ◎ plenty, ○ available, △ few remaining, × full, − closed/not
 * offered. `−` is a client-side default, not a field the API returns.
 */
export function getAvailabilityTier(slot: SlotCapacity | undefined): AvailabilityTier {
  if (!slot) return { symbol: '−', labelKey: 'closed' }
  if (slot.remaining_capacity <= 0) return { symbol: '×', labelKey: 'full' }

  const ratio = slot.capacity > 0 ? slot.remaining_capacity / slot.capacity : 1
  if (ratio <= FEW_REMAINING_RATIO) return { symbol: '△', labelKey: 'few' }
  if (ratio >= PLENTY_REMAINING_RATIO) return { symbol: '◎', labelKey: 'plenty' }
  return { symbol: '○', labelKey: 'available' }
}

/** A cell is tappable only when its tier represents an actual bookable opening. */
export function isTierSelectable(labelKey: AvailabilityLabelKey): boolean {
  return labelKey === 'plenty' || labelKey === 'available' || labelKey === 'few'
}
