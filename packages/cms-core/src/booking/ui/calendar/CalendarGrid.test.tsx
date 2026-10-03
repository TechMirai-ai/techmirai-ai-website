import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CalendarGrid } from './CalendarGrid'
import type { AvailabilityLabelKey } from './availability-symbol'
import type { AvailabilityResponse } from '../../api/schemas'

const LEGEND_LABELS: Record<AvailabilityLabelKey, string> = {
  plenty: 'Plenty available',
  available: 'Available',
  few: 'Few remaining',
  full: 'Full',
  closed: 'Closed',
}

function baseProps(overrides: Partial<Parameters<typeof CalendarGrid>[0]> = {}) {
  const availability: AvailabilityResponse = {
    dates: [
      {
        date: '2027-01-04',
        slots: [
          { slot_id: 1, resource_id: 10, starts_at: '2027-01-04T01:00:00.000Z', ends_at: '2027-01-04T01:30:00.000Z', capacity: 4, remaining_capacity: 4 },
        ],
      },
      {
        date: '2027-01-05',
        slots: [
          { slot_id: 2, resource_id: 10, starts_at: '2027-01-05T01:00:00.000Z', ends_at: '2027-01-05T01:30:00.000Z', capacity: 4, remaining_capacity: 0 },
        ],
      },
    ],
  }

  return {
    weekStart: new Date('2027-01-04T00:00:00.000Z'),
    availability,
    selectedSlot: undefined,
    onSelectSlot: vi.fn(),
    onPrevWeek: vi.fn(),
    onNextWeek: vi.fn(),
    canGoPrevWeek: true,
    weekdayLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    weekRangeLabel: 'Jan 4 – Jan 10, 2027',
    prevWeekLabel: 'Previous week',
    nextWeekLabel: 'Next week',
    legendLabels: LEGEND_LABELS,
    getSlotAriaLabel: ({ date, time, labelKey }: { date: string; time: string; labelKey: AvailabilityLabelKey }) =>
      `${date} ${time}, ${LEGEND_LABELS[labelKey]}`,
    ...overrides,
  }
}

describe('CalendarGrid', () => {
  it('renders a cell showing the plenty symbol for a fully-open slot', () => {
    render(<CalendarGrid {...baseProps()} />)
    expect(screen.getByRole('button', { name: /2027-01-04 01:00, Plenty available/ })).toHaveTextContent('◎')
  })

  it('renders a cell showing the full symbol and disables it', () => {
    render(<CalendarGrid {...baseProps()} />)
    const fullCell = screen.getByRole('button', { name: /2027-01-05 01:00, Full/ })
    expect(fullCell).toHaveTextContent('×')
    expect(fullCell).toBeDisabled()
  })

  it('renders a closed (−) cell for a date with no slot at that time, and disables it', () => {
    render(<CalendarGrid {...baseProps()} />)
    // Week runs 2027-01-04..10; only 01-04 and 01-05 have a 01:00 slot, so
    // every other day's 01:00 cell has no matching slot at all.
    const closedCell = screen.getByRole('button', { name: /2027-01-06 01:00, Closed/ })
    expect(closedCell).toHaveTextContent('−')
    expect(closedCell).toBeDisabled()
  })

  it('renders a real <button> for every cell, so it is reachable and activatable via keyboard by default', () => {
    render(<CalendarGrid {...baseProps()} />)
    const plentyCell = screen.getByRole('button', { name: /2027-01-04 01:00, Plenty available/ })
    expect(plentyCell.tagName).toBe('BUTTON')
    expect(plentyCell).not.toHaveAttribute('disabled')
  })

  it('meets the 48px minimum tap target on every cell', () => {
    render(<CalendarGrid {...baseProps()} />)
    const plentyCell = screen.getByRole('button', { name: /2027-01-04 01:00, Plenty available/ })
    expect(plentyCell.className).toContain('min-h-[48px]')
    expect(plentyCell.className).toContain('min-w-[48px]')
  })

  it('shows the selected state with both a fill (background) and a border class — never color alone', () => {
    const props = baseProps({ selectedSlot: { slotId: 1, resourceId: 10, startsAt: '2027-01-04T01:00:00.000Z', endsAt: '2027-01-04T01:30:00.000Z' } })
    render(<CalendarGrid {...props} />)
    const selectedCell = screen.getByRole('button', { name: /2027-01-04 01:00, Plenty available/ })
    expect(selectedCell).toHaveAttribute('aria-pressed', 'true')
    expect(selectedCell.className).toContain('bg-[var(--booking-selected-bg)]')
    expect(selectedCell.className).toContain('border-2')
    expect(selectedCell.className).toContain('border-[var(--booking-selected-border)]')
  })

  it('calls onSelectSlot with the representative slot when a selectable cell is clicked', () => {
    const onSelectSlot = vi.fn()
    render(<CalendarGrid {...baseProps({ onSelectSlot })} />)
    fireEvent.click(screen.getByRole('button', { name: /2027-01-04 01:00, Plenty available/ }))
    expect(onSelectSlot).toHaveBeenCalledWith({
      slotId: 1,
      resourceId: 10,
      startsAt: '2027-01-04T01:00:00.000Z',
      endsAt: '2027-01-04T01:30:00.000Z',
    })
  })

  it('does not call onSelectSlot when a full (disabled) cell is clicked', () => {
    const onSelectSlot = vi.fn()
    render(<CalendarGrid {...baseProps({ onSelectSlot })} />)
    fireEvent.click(screen.getByRole('button', { name: /2027-01-05 01:00, Full/ }))
    expect(onSelectSlot).not.toHaveBeenCalled()
  })

  it('disables the previous-week button once the visible week is the one containing today', () => {
    render(<CalendarGrid {...baseProps({ canGoPrevWeek: false })} />)
    expect(screen.getByRole('button', { name: 'Previous week' })).toBeDisabled()
  })

  it('keeps the previous-week button enabled for a future week', () => {
    render(<CalendarGrid {...baseProps({ canGoPrevWeek: true })} />)
    expect(screen.getByRole('button', { name: 'Previous week' })).not.toBeDisabled()
  })

  it('calls onPrevWeek / onNextWeek when the nav buttons are clicked', () => {
    const onPrevWeek = vi.fn()
    const onNextWeek = vi.fn()
    render(<CalendarGrid {...baseProps({ onPrevWeek, onNextWeek })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next week' }))
    expect(onNextWeek).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: 'Previous week' }))
    expect(onPrevWeek).toHaveBeenCalledOnce()
  })

  it('renders the legend with all 5 symbols and their translated labels', () => {
    render(<CalendarGrid {...baseProps()} />)
    for (const label of Object.values(LEGEND_LABELS)) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })
})
