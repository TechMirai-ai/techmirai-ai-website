'use client'

import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { Alert, Badge } from '@techmirai/cms-core/components/ui'

// Voice-pivot contact form (docs/ECC MASTER PROMPT TechMirai Voice Website v2
// §2, §9): two inquiry paths, short B2B fields, an unchecked consent box that
// is required before anything is sent. The server enforces consent again.

export type InquiryPath = 'adoption' | 'partnership'

export type FormLabels = {
  adoptionPath: string
  partnershipPath: string
  pathLegend: string
  name: string
  company: string
  role: string
  email: string
  phone: string
  optionalHeading: string
  callVolume: string
  hoursToCover: string
  languages: string
  goal: string
  consent: string
  privacyLink: string
  submit: string
  submitting: string
  success: string
  error: string
  required: string
  consentRequired: string
}

type ContactFormProps = {
  locale: string
  labels: FormLabels
  apiPath: string
  initialPath: InquiryPath
}

type FieldErrors = Partial<Record<string, string[]>>

const clientSchema = z.object({
  name: z.string().trim().min(1),
  company: z.string().trim().min(1),
  role: z.string().trim().min(1),
  email: z.string().trim().email(),
  consent: z.literal(true),
})

const fieldClass =
  'w-full min-h-[48px] rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-base text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20'
const errorClass = 'mt-1 text-sm text-[var(--color-error)]'
const labelClass = 'flex items-center gap-2 text-sm font-medium text-[var(--color-text)] mb-1'

type TextFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  requiredLabel?: string
  type?: string
  autoComplete?: string
  error?: string | undefined
}

function TextField({ id, label, value, onChange, required, requiredLabel, type = 'text', autoComplete, error }: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label} {required && <Badge variant="accent">{requiredLabel}</Badge>}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClass}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className={errorClass}>
          {error}
        </p>
      )}
    </div>
  )
}

export function ContactForm({ locale, labels, apiPath, initialPath }: ContactFormProps) {
  const [path, setPath] = useState<InquiryPath>(initialPath)
  const [values, setValues] = useState({
    name: '', company: '', role: '', email: '', phone: '',
    callVolume: '', hoursToCover: '', languages: '', goal: '',
  })
  const [consent, setConsent] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [serverMessage, setServerMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const setField = (key: keyof typeof values) => (value: string) => setValues((prev) => ({ ...prev, [key]: value }))

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})
    setServerMessage(null)

    const parsed = clientSchema.safeParse({ ...values, consent })
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors as FieldErrors
      if (errors['consent']) errors['consent'] = [labels.consentRequired]
      setFieldErrors(errors)
      return
    }

    setStatus('submitting')
    const optional = Object.fromEntries(Object.entries(values).filter(([, v]) => v.trim() !== ''))

    try {
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...optional, inquiryPath: path, consent: true, locale, _hp: honeypot }),
      })
      const json = (await res.json()) as { success: boolean; message?: string; fieldErrors?: FieldErrors }
      if (json.success) {
        setStatus('success')
        return
      }
      setStatus('error')
      setServerMessage(json.message ?? labels.error)
      if (json.fieldErrors) setFieldErrors(json.fieldErrors)
    } catch {
      setStatus('error')
      setServerMessage(labels.error)
    }
  }

  if (status === 'success') {
    return (
      <Alert variant="success">
        <p className="text-center">{labels.success}</p>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={status === 'submitting'} className="space-y-5">
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {status === 'submitting' ? labels.submitting : ''}
      </p>

      <fieldset className="space-y-2">
        <legend className={labelClass}>{labels.pathLegend}</legend>
        {(['adoption', 'partnership'] as const).map((value) => (
          <label key={value} className="flex items-center gap-3 rounded-md border border-neutral-300 p-3 text-sm">
            <input type="radio" name="inquiryPath" value={value} checked={path === value} onChange={() => setPath(value)} />
            {value === 'adoption' ? labels.adoptionPath : labels.partnershipPath}
          </label>
        ))}
      </fieldset>

      <TextField id="cf-name" label={labels.name} value={values.name} onChange={setField('name')} required requiredLabel={labels.required} autoComplete="name" error={fieldErrors['name']?.[0]} />
      <TextField id="cf-company" label={labels.company} value={values.company} onChange={setField('company')} required requiredLabel={labels.required} autoComplete="organization" error={fieldErrors['company']?.[0]} />
      <TextField id="cf-role" label={labels.role} value={values.role} onChange={setField('role')} required requiredLabel={labels.required} autoComplete="organization-title" error={fieldErrors['role']?.[0]} />
      <TextField id="cf-email" label={labels.email} type="email" value={values.email} onChange={setField('email')} required requiredLabel={labels.required} autoComplete="email" error={fieldErrors['email']?.[0]} />
      <TextField id="cf-phone" label={labels.phone} type="tel" value={values.phone} onChange={setField('phone')} autoComplete="tel" />

      <fieldset className="space-y-4 rounded-md border border-neutral-200 p-4">
        <legend className="px-1 text-sm font-semibold">{labels.optionalHeading}</legend>
        <TextField id="cf-volume" label={labels.callVolume} value={values.callVolume} onChange={setField('callVolume')} />
        <TextField id="cf-hours" label={labels.hoursToCover} value={values.hoursToCover} onChange={setField('hoursToCover')} />
        <TextField id="cf-languages" label={labels.languages} value={values.languages} onChange={setField('languages')} />
        <div>
          <label htmlFor="cf-goal" className={labelClass}>{labels.goal}</label>
          <textarea id="cf-goal" rows={4} value={values.goal} onChange={(e) => setField('goal')(e.target.value)} className={`${fieldClass} resize-y`} />
        </div>
      </fieldset>

      {/* Honeypot: hidden from people, filled in by simple bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="cf-website">Website</label>
        <input id="cf-website" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            aria-invalid={Boolean(fieldErrors['consent'])}
            aria-describedby={fieldErrors['consent'] ? 'cf-consent-error' : undefined}
            className="mt-1 h-4 w-4"
          />
          <span>
            {labels.consent}{' '}
            <a href={locale === 'en' ? '/en/privacy' : '/privacy'} className="underline">{labels.privacyLink}</a>
          </span>
        </label>
        {fieldErrors['consent'] && (
          <p id="cf-consent-error" role="alert" className={errorClass}>{fieldErrors['consent'][0]}</p>
        )}
      </div>

      {status === 'error' && serverMessage && (
        <div aria-live="assertive">
          <Alert variant="danger">{serverMessage}</Alert>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full min-h-[48px] rounded-lg bg-[var(--color-primary)] px-6 py-3 text-base font-medium text-on-primary hover:opacity-90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
      >
        {status === 'submitting' ? labels.submitting : labels.submit}
      </button>
    </form>
  )
}
