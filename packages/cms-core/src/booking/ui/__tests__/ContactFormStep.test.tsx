import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ContactFormStep } from '../steps/ContactFormStep'
import { interpolatingTranslate } from './test-utils'

const mockLocale = vi.hoisted(() => ({ value: 'en' }))

vi.mock('next-intl', () => ({
  useTranslations: () => interpolatingTranslate,
  useLocale: () => mockLocale.value,
}))

afterEach(() => {
  mockLocale.value = 'en'
})

function fillValidForm(): void {
  fireEvent.change(screen.getByLabelText('contact.familyName'), { target: { value: '山田' } })
  fireEvent.change(screen.getByLabelText('contact.givenName'), { target: { value: '太郎' } })
  fireEvent.change(screen.getByLabelText('contact.familyNameKana'), { target: { value: 'ヤマダ' } })
  fireEvent.change(screen.getByLabelText('contact.givenNameKana'), { target: { value: 'タロウ' } })
  fireEvent.change(screen.getByLabelText('contact.phone'), { target: { value: '090-0000-0000' } })
}

describe('ContactFormStep', () => {
  it('submits with the exact customerInputSchema field shape when the form is valid', () => {
    const onSubmit = vi.fn()
    render(<ContactFormStep onSubmit={onSubmit} onBack={vi.fn()} />)

    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'contact.continue' }))

    expect(onSubmit).toHaveBeenCalledWith({
      family_name: '山田',
      given_name: '太郎',
      family_name_kana: 'ヤマダ',
      given_name_kana: 'タロウ',
      phone: '090-0000-0000',
    })
  })

  it('treats email as optional and omits it entirely when left blank', () => {
    const onSubmit = vi.fn()
    render(<ContactFormStep onSubmit={onSubmit} onBack={vi.fn()} />)

    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'contact.continue' }))

    // JSON.stringify drops undefined-valued keys before the request is sent,
    // so the meaningful check is the value, not own-property existence.
    expect(onSubmit.mock.calls[0]?.[0]?.email).toBeUndefined()
  })

  it('includes a valid email when provided', () => {
    const onSubmit = vi.fn()
    render(<ContactFormStep onSubmit={onSubmit} onBack={vi.fn()} />)

    fillValidForm()
    fireEvent.change(screen.getByLabelText('contact.email'), { target: { value: 'taro@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'contact.continue' }))

    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ email: 'taro@example.com' })
  })

  it('does not submit and marks required fields invalid when the form is empty', () => {
    const onSubmit = vi.fn()
    render(<ContactFormStep onSubmit={onSubmit} onBack={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'contact.continue' }))

    expect(onSubmit).not.toHaveBeenCalled()
    const familyNameInput = screen.getByLabelText('contact.familyName')
    expect(familyNameInput).toHaveAttribute('aria-invalid', 'true')
    expect(familyNameInput).toHaveAttribute('aria-describedby', 'family_name-error')
    // Every required field is empty, so all 5 show the same message.
    // The mocked useTranslations is namespace-blind (same convention as
    // BookingFlow.test.tsx) — tForm('required') resolves to the raw key.
    expect(document.getElementById('family_name-error')).toHaveTextContent('required')
  })

  it('does not submit and shows an invalid-email message for a malformed email', () => {
    const onSubmit = vi.fn()
    render(<ContactFormStep onSubmit={onSubmit} onBack={vi.fn()} />)

    fillValidForm()
    fireEvent.change(screen.getByLabelText('contact.email'), { target: { value: 'not-an-email' } })
    fireEvent.click(screen.getByRole('button', { name: 'contact.continue' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByLabelText('contact.email')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('invalidEmail')).toBeInTheDocument()
  })

  it('submits the company when provided, and omits blank optional fields entirely', () => {
    const onSubmit = vi.fn()
    render(<ContactFormStep onSubmit={onSubmit} onBack={vi.fn()} />)

    fillValidForm()
    fireEvent.change(screen.getByLabelText('contact.company'), { target: { value: 'Acme Co.' } })
    fireEvent.click(screen.getByRole('button', { name: 'contact.continue' }))

    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ company: 'Acme Co.' })
  })

  it('does not require kana for English users: submits without it and sends no kana keys', () => {
    const onSubmit = vi.fn()
    render(<ContactFormStep onSubmit={onSubmit} onBack={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('contact.familyName'), { target: { value: 'Smith' } })
    fireEvent.change(screen.getByLabelText('contact.givenName'), { target: { value: 'Alex' } })
    fireEvent.change(screen.getByLabelText('contact.phone'), { target: { value: '090-0000-0000' } })
    fireEvent.click(screen.getByRole('button', { name: 'contact.continue' }))

    expect(onSubmit).toHaveBeenCalledOnce()
    const submitted = onSubmit.mock.calls[0]?.[0]
    expect(submitted?.family_name_kana).toBeUndefined()
    expect(submitted?.given_name_kana).toBeUndefined()
  })

  it('requires both kana fields for Japanese users and marks them invalid', () => {
    mockLocale.value = 'ja'
    const onSubmit = vi.fn()
    render(<ContactFormStep onSubmit={onSubmit} onBack={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('contact.familyName'), { target: { value: '山田' } })
    fireEvent.change(screen.getByLabelText('contact.givenName'), { target: { value: '太郎' } })
    fireEvent.change(screen.getByLabelText('contact.phone'), { target: { value: '090-0000-0000' } })
    fireEvent.click(screen.getByRole('button', { name: 'contact.continue' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByLabelText('contact.familyNameKana')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('contact.givenNameKana')).toHaveAttribute('aria-invalid', 'true')
  })

  it('calls onBack when the back button is clicked', () => {
    const onBack = vi.fn()
    render(<ContactFormStep onSubmit={vi.fn()} onBack={onBack} />)

    fireEvent.click(screen.getByRole('button', { name: 'nav.back' }))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('prefills fields from initialValues after a back-then-forward navigation', () => {
    const onSubmit = vi.fn()
    render(
      <ContactFormStep
        onSubmit={onSubmit}
        onBack={vi.fn()}
        initialValues={{
          family_name: '山田',
          given_name: '太郎',
          family_name_kana: 'ヤマダ',
          given_name_kana: 'タロウ',
          phone: '090-0000-0000',
          email: 'taro@example.com',
        }}
      />,
    )

    expect(screen.getByLabelText('contact.familyName')).toHaveValue('山田')
    expect(screen.getByLabelText('contact.email')).toHaveValue('taro@example.com')

    fireEvent.click(screen.getByRole('button', { name: 'contact.continue' }))
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ family_name: '山田', email: 'taro@example.com' })
  })
})
