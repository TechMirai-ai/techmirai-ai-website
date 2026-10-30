import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ReceptionWidget } from '../ReceptionWidget'

vi.mock('../../../../../booking/ui', () => ({
  BookingFlow: () => <div data-testid="booking-flow-mock" />,
}))

const defaultProps = {
  enabled: true,
  greeting: { ja: '長い挨拶', en: 'A long greeting' },
  openDelayMs: 1,
  locales: ['ja', 'en'],
  locale: 'en',
  clinicPhone: '+81-3-5432-1188',
  clinicName: 'TechMirai',
}

describe('ReceptionWidget teaser bubble', () => {
  it('shows the short teaser for the page locale when one is configured', async () => {
    render(<ReceptionWidget {...defaultProps} teaser={{ ja: '短い挨拶', en: 'Chat with me' }} />)

    expect(await screen.findByText('Chat with me')).toBeInTheDocument()
    expect(screen.queryByText('A long greeting')).not.toBeInTheDocument()
  })

  it('falls back to the greeting when no teaser is configured', async () => {
    render(<ReceptionWidget {...defaultProps} />)

    expect(await screen.findByText('A long greeting')).toBeInTheDocument()
  })

  it('falls back to the greeting when the teaser has no entry for the locale', async () => {
    render(<ReceptionWidget {...defaultProps} teaser={{ ja: '短い挨拶' }} />)

    expect(await screen.findByText('A long greeting')).toBeInTheDocument()
  })
})
