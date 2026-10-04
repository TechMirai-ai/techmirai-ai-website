'use client'

import { useState, type FormEvent, type FocusEvent } from 'react'
import { z } from 'zod'
import { Alert, Badge } from '@techmirai/cms-core/components/ui'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InquiryType = 'general' | 'visa' | 'recruitment' | 'other'

type FormLabels = {
  name: string
  furigana: string
  email: string
  company: string
  inquiryType: string
  message: string
  submit: string
  submitting: string
  success: string
  error: string
  inquiryOptions: Record<InquiryType, string>
  required: string
}

type ContactFormProps = {
  locale: string
  labels: FormLabels
  apiPath: string
}

type FieldErrors = Partial<Record<string, string[]>>

// ---------------------------------------------------------------------------
// Client-side schema (mirrors server schema)
// ---------------------------------------------------------------------------

const clientSchema = z.object({
  name: z.string().min(1),
  furigana: z.string().optional(),
  email: z.string().email(),
  company: z.string().optional(),
  inquiryType: z.enum(['general', 'visa', 'recruitment', 'other']),
  message: z.string().min(10),
})

const fieldSchemas = {
  name: clientSchema.shape.name,
  email: clientSchema.shape.email,
  message: clientSchema.shape.message,
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContactForm({ locale, labels, apiPath }: ContactFormProps) {
  const [name, setName] = useState('')
  const [furigana, setFurigana] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [inquiryType, setInquiryType] = useState<InquiryType>('general')
  const [message, setMessage] = useState('')

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [serverMessage, setServerMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})
    setServerMessage(null)

    const values = { name, furigana: furigana || undefined, email, company: company || undefined, inquiryType, message }

    // Client-side Zod validation
    const parsed = clientSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as FieldErrors)
      return
    }

    setStatus('submitting')

    // Collect Turnstile token if widget is present
    let turnstileToken: string | undefined
    if (typeof window !== 'undefined' && 'turnstile' in window) {
      try {
        turnstileToken = (window.turnstile as { getResponse: () => string }).getResponse() || undefined
      } catch {
        // no widget present
      }
    }

    try {
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsed.data, locale, ...(turnstileToken ? { turnstileToken } : {}) }),
      })

      const json = (await res.json()) as {
        success: boolean
        message?: string
        fieldErrors?: FieldErrors
      }

      if (json.success) {
        setStatus('success')
      } else {
        setStatus('error')
        setServerMessage(json.message ?? labels.error)
        if (json.fieldErrors) setFieldErrors(json.fieldErrors)
      }
    } catch {
      setStatus('error')
      setServerMessage(labels.error)
    }
  }

  // Live inline validation: re-check a single field on blur so errors surface
  // before the user reaches submit, not only after.
  function validateField(field: keyof typeof fieldSchemas, value: string) {
    const result = fieldSchemas[field].safeParse(value)
    setFieldErrors((prev) => ({
      ...prev,
      [field]: result.success ? undefined : result.error.flatten().formErrors,
    }))
  }

  function handleBlur(field: keyof typeof fieldSchemas) {
    return (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => validateField(field, e.target.value)
  }

  if (status === 'success') {
    return (
      <Alert variant="success">
        <p className="text-center">{labels.success}</p>
      </Alert>
    )
  }

  const fieldClass =
    'w-full min-h-[48px] rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-base text-[var(--color-text)] placeholder:text-neutral-400 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors'
  const errorClass = 'mt-1 text-sm text-[var(--color-error)]'
  const labelClass = 'flex items-center gap-2 text-sm font-medium text-[var(--color-text)] mb-1'

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={status === 'submitting'} className="space-y-5">
      {/* Screen-reader announcement for async state changes */}
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {status === 'submitting' ? labels.submitting : ''}
      </p>

      {/* Name */}
      <div>
        <label htmlFor="cf-name" className={labelClass}>
          {labels.name} <Badge variant="accent">{labels.required}</Badge>
        </label>
        <input
          id="cf-name"
          type="text"
          autoComplete="name"
          required
          aria-invalid={Boolean(fieldErrors['name'])}
          aria-describedby={fieldErrors['name'] ? 'cf-name-error' : undefined}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleBlur('name')}
          className={fieldClass}
        />
        {fieldErrors['name'] && (
          <p id="cf-name-error" role="alert" className={errorClass}>{fieldErrors['name']?.[0]}</p>
        )}
      </div>

      {/* Furigana (optional) */}
      <div>
        <label htmlFor="cf-furigana" className={labelClass}>
          {labels.furigana}
        </label>
        <input
          id="cf-furigana"
          type="text"
          autoComplete="off"
          value={furigana}
          onChange={(e) => setFurigana(e.target.value)}
          className={fieldClass}
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="cf-email" className={labelClass}>
          {labels.email} <Badge variant="accent">{labels.required}</Badge>
        </label>
        <input
          id="cf-email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(fieldErrors['email'])}
          aria-describedby={fieldErrors['email'] ? 'cf-email-error' : undefined}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={handleBlur('email')}
          className={fieldClass}
        />
        {fieldErrors['email'] && (
          <p id="cf-email-error" role="alert" className={errorClass}>{fieldErrors['email']?.[0]}</p>
        )}
      </div>

      {/* Company */}
      <div>
        <label htmlFor="cf-company" className={labelClass}>
          {labels.company}
        </label>
        <input
          id="cf-company"
          type="text"
          autoComplete="organization"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className={fieldClass}
        />
      </div>

      {/* Inquiry type */}
      <div>
        <label htmlFor="cf-inquiry" className={labelClass}>
          {labels.inquiryType} <Badge variant="accent">{labels.required}</Badge>
        </label>
        <select
          id="cf-inquiry"
          required
          value={inquiryType}
          onChange={(e) => setInquiryType(e.target.value as InquiryType)}
          className={fieldClass}
        >
          {(Object.entries(labels.inquiryOptions) as [InquiryType, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="cf-message" className={labelClass}>
          {labels.message} <Badge variant="accent">{labels.required}</Badge>
        </label>
        <textarea
          id="cf-message"
          required
          rows={5}
          aria-invalid={Boolean(fieldErrors['message'])}
          aria-describedby={fieldErrors['message'] ? 'cf-message-error' : undefined}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onBlur={handleBlur('message')}
          className={`${fieldClass} resize-y min-h-[120px]`}
        />
        {fieldErrors['message'] && (
          <p id="cf-message-error" role="alert" className={errorClass}>{fieldErrors['message']?.[0]}</p>
        )}
      </div>

      {/* Server error */}
      {status === 'error' && serverMessage && (
        <div aria-live="assertive">
          <Alert variant="danger">{serverMessage}</Alert>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full min-h-[48px] rounded-lg bg-[var(--color-primary)] px-6 py-3 text-base font-medium text-white hover:opacity-90 disabled:opacity-60 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
      >
        {status === 'submitting' ? labels.submitting : labels.submit}
      </button>
    </form>
  )
}
