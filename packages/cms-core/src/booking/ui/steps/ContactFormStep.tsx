'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { BookingButton } from '../shared/BookingButton'
import { ProgressIndicator } from '../shared/ProgressIndicator'
import { StepShell } from '../shared/StepShell'
import { customerInputSchema } from '../../api/schemas'
import type { CustomerInput } from '../../api/schemas'

interface ContactFormStepProps {
  onSubmit: (customer: CustomerInput) => void
  onBack: () => void
  /**
   * Repopulates the form after a back-then-forward navigation instead of
   * losing what the user typed (a full CustomerInput in that case), OR —
   * STEP 2 Part 2 item 3 — pre-fills an editable name suggestion for a
   * first-time LIFF booker (e.g. just given_name from
   * liff.getProfile().displayName, every other field left blank). Either
   * way this is always editable; nothing here is auto-submitted.
   */
  initialValues?: Partial<CustomerInput> | undefined
}

type FieldName = 'family_name' | 'given_name' | 'family_name_kana' | 'given_name_kana' | 'phone' | 'email'
type FormValues = Record<FieldName, string>

const EMPTY_FORM: FormValues = {
  family_name: '',
  given_name: '',
  family_name_kana: '',
  given_name_kana: '',
  phone: '',
  email: '',
}

interface FieldProps {
  id: FieldName
  label: string
  value: string
  error?: string | undefined
  onChange: (value: string) => void
  autoComplete?: string
  type?: string
}

function Field({ id, label, value, error, onChange, autoComplete, type = 'text' }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-[var(--booking-text)]">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={[
          'min-h-[48px] w-full rounded-md border bg-transparent px-3 py-2 text-base text-[var(--booking-text)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          error
            ? 'border-[var(--booking-error)] focus-visible:ring-[var(--booking-error)]'
            : 'border-[var(--booking-border)] focus-visible:ring-[var(--booking-accent)]',
        ].join(' ')}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-[var(--booking-error)]">
          {error}
        </p>
      )}
    </div>
  )
}

function toFormValues(customer: Partial<CustomerInput> | undefined): FormValues {
  if (!customer) return EMPTY_FORM
  // Defaults every field independently rather than spreading `customer`
  // directly — a genuinely partial object (STEP 2 Part 2 item 3's name-only
  // suggestion) would otherwise leave the missing fields `undefined`,
  // turning these into uncontrolled <input> elements.
  return {
    family_name: customer.family_name ?? '',
    given_name: customer.given_name ?? '',
    family_name_kana: customer.family_name_kana ?? '',
    given_name_kana: customer.given_name_kana ?? '',
    phone: customer.phone ?? '',
    email: customer.email ?? '',
  }
}

/** Step 4: name, kana, phone, email (optional) — field shapes mirror customerInputSchema exactly. */
export function ContactFormStep({ onSubmit, onBack, initialValues }: ContactFormStepProps) {
  const t = useTranslations('blocks.booking')
  const tForm = useTranslations('form')
  const [values, setValues] = useState<FormValues>(() => toFormValues(initialValues))
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({})

  function set(field: FieldName, value: string): void {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(event: FormEvent): void {
    event.preventDefault()
    const candidate = { ...values, email: values.email || undefined }
    const result = customerInputSchema.safeParse(candidate)
    if (!result.success) {
      const fieldErrors: Partial<Record<FieldName, string>> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as FieldName | undefined
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = field === 'email' ? tForm('invalidEmail') : tForm('required')
        }
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    onSubmit(result.data)
  }

  return (
    <StepShell
      title={t('contact.title')}
      backLabel={t('nav.back')}
      onBack={onBack}
      progress={<ProgressIndicator current={4} total={6} label={t('progress.stepLabel', { n: 4, total: 6 })} />}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field id="family_name" label={t('contact.familyName')} value={values.family_name} error={errors.family_name} onChange={(v) => set('family_name', v)} autoComplete="family-name" />
          <Field id="given_name" label={t('contact.givenName')} value={values.given_name} error={errors.given_name} onChange={(v) => set('given_name', v)} autoComplete="given-name" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field id="family_name_kana" label={t('contact.familyNameKana')} value={values.family_name_kana} error={errors.family_name_kana} onChange={(v) => set('family_name_kana', v)} />
          <Field id="given_name_kana" label={t('contact.givenNameKana')} value={values.given_name_kana} error={errors.given_name_kana} onChange={(v) => set('given_name_kana', v)} />
        </div>
        <Field id="phone" label={t('contact.phone')} value={values.phone} error={errors.phone} onChange={(v) => set('phone', v)} autoComplete="tel" type="tel" />
        <div>
          <Field id="email" label={t('contact.email')} value={values.email} error={errors.email} onChange={(v) => set('email', v)} autoComplete="email" type="email" />
          <p className="mt-1 text-sm text-[var(--booking-text-muted)]">{t('contact.emailOptionalHint')}</p>
        </div>
        <BookingButton type="submit">{t('contact.continue')}</BookingButton>
      </form>
    </StepShell>
  )
}
