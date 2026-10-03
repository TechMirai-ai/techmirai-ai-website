'use client'

import type { AvailabilityTier } from './availability-symbol'

const TIER_COLOR_VAR: Record<AvailabilityTier['labelKey'], string> = {
  plenty: 'var(--booking-tier-plenty)',
  available: 'var(--booking-tier-available)',
  few: 'var(--booking-tier-few)',
  full: 'var(--booking-tier-full)',
  closed: 'var(--booking-tier-closed)',
}

interface CalendarCellProps {
  tier: AvailabilityTier
  isSelected: boolean
  isSelectable: boolean
  ariaLabel: string
  onSelect: () => void
}

/**
 * A single (day, time) cell — the whole cell is the tap target (min 48px),
 * and availability is always shown with both a symbol AND a color, never
 * color alone. Selected state adds a fill AND a border, never color alone.
 */
export function CalendarCell({ tier, isSelected, isSelectable, ariaLabel, onSelect }: CalendarCellProps) {
  return (
    <button
      type="button"
      disabled={!isSelectable}
      aria-pressed={isSelected}
      aria-label={ariaLabel}
      onClick={onSelect}
      style={!isSelected ? { color: TIER_COLOR_VAR[tier.labelKey] } : undefined}
      className={[
        'flex min-h-[48px] w-full min-w-[48px] items-center justify-center rounded-md border text-lg font-medium',
        'transition-colors duration-[var(--booking-transition-duration)] ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] focus-visible:ring-offset-2',
        isSelected
          ? 'border-2 border-[var(--booking-selected-border)] bg-[var(--booking-selected-bg)] text-[var(--booking-selected-text)]'
          : 'border-[var(--booking-border)] bg-transparent',
        isSelectable && !isSelected ? 'hover:bg-[var(--booking-border)]/30' : '',
        !isSelectable ? 'cursor-not-allowed opacity-60' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span aria-hidden="true">{tier.symbol}</span>
    </button>
  )
}
