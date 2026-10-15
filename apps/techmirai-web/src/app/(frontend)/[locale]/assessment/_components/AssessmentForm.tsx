'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Alert, Badge } from '@techmirai/cms-core/components/ui'
import { Link } from '@/i18n/routing'
import siteConfig from '../../../../../../site.config'

// Pack-4/J1: /assessment's form (Spec §12.2, lines 1031-1047 of
// `docs/_inputs/TechMirai Website — Full Content Spec (EN JA).md`).
// Architecturally mirrors `/contact/_components/ContactForm.tsx`: per-field
// state, a client-side Zod mirror of the server schema for inline
// validation, the same Turnstile-token collection snippet, and the same
// honeypot field name (`_hp`) the shared route handler already checks —
// unlike ContactForm, this renders the honeypot input (see docs/FINDINGS.md:
// ContactForm's own `_hp` is checked server-side but never rendered).
//
// Only `url`, `name`, `email` and `consent` are required, matching the
// Spec's own "Required" column exactly. The 3 Spec error messages (§12.2's
// "Error messages" line) are shown verbatim, in the visitor's locale, only
// for those 3 fields — no 4th message is invented for `name`, same as
// ContactForm's own precedent for its required `name` field.
//
// On ANY error response (validation, rate limit, Turnstile, server), no
// field state is reset — every previously typed value stays in the form,
// confirmed in plan review. On success, this redirects to the
// locale-correct `/thanks` (the same one-line locale-prefix rule
// `apps/techmirai-web/src/app/api/search-index/route.ts`'s private
// `localizedPath` already uses), not an inline success message.

type Industry = 'clinic' | 'beauty' | 'automobile' | 'hotel' | 'restaurant' | 'real-estate' | 'other'
type LineAccount = 'yes' | 'no' | 'not-sure'
type Problem = 'missed-calls' | 'same-questions' | 'after-hours' | 'phone-changes' | 'foreign-customers' | 'other'
type ContactPref = 'email' | 'phone' | 'line'

type Locale = 'en' | 'ja'

interface AssessmentFormProps {
  locale: string
}

type FieldErrors = Partial<Record<string, string[]>>

// ---------------------------------------------------------------------------
// Client-side schema (mirrors the server schema)
// ---------------------------------------------------------------------------

const clientSchema = z.object({
  url: z.string().url(),
  company: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  industry: z.enum(['clinic', 'beauty', 'automobile', 'hotel', 'restaurant', 'real-estate', 'other']).optional(),
  bookingSystem: z.string().optional(),
  lineAccount: z.enum(['yes', 'no', 'not-sure']).optional(),
  problem: z.array(z.enum(['missed-calls', 'same-questions', 'after-hours', 'phone-changes', 'foreign-customers', 'other'])).optional(),
  contactPref: z.enum(['email', 'phone', 'line']).optional(),
  message: z.string().optional(),
  consent: z.literal(true),
})

// ---------------------------------------------------------------------------
// Spec §12.1/§12.2 copy, verbatim — labels, options and the 3 error messages
// ---------------------------------------------------------------------------

interface AssessmentFormLabels {
  url: string
  urlPlaceholder: string
  company: string
  name: string
  email: string
  phone: string
  industry: string
  bookingSystem: string
  bookingSystemPlaceholder: string
  lineAccount: string
  problem: string
  contactPref: string
  message: string
  consent: string
  submit: string
  submitting: string
  required: string
  errorUrl: string
  errorEmail: string
  errorConsent: string
  error: string
}

// Named fields, not `Record<string, string>` — this tsconfig sets
// `noUncheckedIndexedAccess: true`, which would make every `t.foo` access
// through a generic index signature type as `string | undefined`.
const labels: Record<Locale, AssessmentFormLabels> = {
  en: {
    url: 'Website address',
    urlPlaceholder: 'https://',
    company: 'Company or shop name',
    name: 'Your name',
    email: 'Email',
    phone: 'Phone',
    industry: 'Industry',
    bookingSystem: 'Current booking system',
    bookingSystemPlaceholder: 'e.g. none, paper, or the service name.',
    lineAccount: 'Do you have a LINE Official Account?',
    problem: 'Main customer-service problem (choose any)',
    contactPref: 'Preferred contact',
    message: 'Anything else?',
    consent: 'I agree to the privacy policy',
    submit: 'Request my free assessment',
    submitting: 'Sending…',
    required: 'Required',
    errorUrl: 'Please enter your website address.',
    errorEmail: 'Please enter a valid email.',
    errorConsent: 'Please agree to the privacy policy.',
    error: 'Something went wrong. Please try again.',
  },
  ja: {
    url: 'ホームページのURL',
    urlPlaceholder: 'https://',
    company: '会社名・店舗名',
    name: 'お名前',
    email: 'メールアドレス',
    phone: '電話番号',
    industry: '業種',
    bookingSystem: '現在お使いの予約方法',
    bookingSystemPlaceholder: '例：なし、紙の予約表、サービス名など',
    lineAccount: 'LINE公式アカウントはお持ちですか？',
    problem: 'いちばんのお困りごと（複数選択可）',
    contactPref: 'ご希望の連絡方法',
    message: 'その他ご質問・ご要望',
    consent: 'プライバシーポリシーに同意します',
    submit: '無料診断を申し込む',
    submitting: '送信中…',
    required: '必須',
    errorUrl: 'ホームページのURLを入力してください。',
    errorEmail: '正しいメールアドレスを入力してください。',
    errorConsent: 'プライバシーポリシーへの同意が必要です。',
    error: 'エラーが発生しました。もう一度お試しください。',
  },
}

const industryOptions: Record<Locale, Record<Industry, string>> = {
  en: {
    clinic: 'Clinic or treatment room',
    beauty: 'Beauty',
    automobile: 'Automobile',
    hotel: 'Hotel or guesthouse',
    restaurant: 'Restaurant',
    'real-estate': 'Real estate',
    other: 'Other',
  },
  ja: {
    clinic: 'クリニック・治療院',
    beauty: '美容',
    automobile: '自動車',
    hotel: '宿泊',
    restaurant: '飲食',
    'real-estate': '不動産',
    other: 'その他',
  },
}

const lineAccountOptions: Record<Locale, Record<LineAccount, string>> = {
  en: { yes: 'Yes', no: 'No', 'not-sure': 'Not sure' },
  ja: { yes: 'はい', no: 'いいえ', 'not-sure': 'わからない' },
}

const problemOptions: Record<Locale, Record<Problem, string>> = {
  en: {
    'missed-calls': 'Missed calls',
    'same-questions': 'Same questions',
    'after-hours': 'After-hours inquiries',
    'phone-changes': 'Changes by phone',
    'foreign-customers': 'Foreign customers',
    other: 'Other',
  },
  ja: {
    'missed-calls': '電話に出られない',
    'same-questions': '同じ質問が多い',
    'after-hours': '営業時間外の問い合わせ',
    'phone-changes': '予約変更の電話',
    'foreign-customers': '外国人のお客様への対応',
    other: 'その他',
  },
}

const contactPrefOptions: Record<Locale, Record<ContactPref, string>> = {
  en: { email: 'Email', phone: 'Phone', line: 'LINE' },
  ja: { email: 'メール', phone: '電話', line: 'LINE' },
}

const privacyLinkLabels: Record<Locale, string> = {
  en: 'privacy policy',
  ja: 'プライバシーポリシー',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AssessmentForm({ locale: rawLocale }: AssessmentFormProps) {
  const locale: Locale = rawLocale === 'ja' ? 'ja' : 'en'
  const t = labels[locale]
  const router = useRouter()

  const [url, setUrl] = useState('')
  const [company, setCompany] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [industry, setIndustry] = useState<Industry | ''>('')
  const [bookingSystem, setBookingSystem] = useState('')
  const [lineAccount, setLineAccount] = useState<LineAccount | ''>('')
  const [problem, setProblem] = useState<Problem[]>([])
  const [contactPref, setContactPref] = useState<ContactPref | ''>('')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)

  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [serverMessage, setServerMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  function toggleProblem(value: Problem) {
    setProblem((prev) => (prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})
    setServerMessage(null)

    const values = {
      url,
      company: company || undefined,
      name,
      email,
      phone: phone || undefined,
      industry: industry || undefined,
      bookingSystem: bookingSystem || undefined,
      lineAccount: lineAccount || undefined,
      problem: problem.length > 0 ? problem : undefined,
      contactPref: contactPref || undefined,
      message: message || undefined,
      consent: consent as true,
    }

    const parsed = clientSchema.safeParse(values)
    if (!parsed.success) {
      const errors: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '')
        if (key === 'url') errors.url = [t.errorUrl]
        else if (key === 'email') errors.email = [t.errorEmail]
        else if (key === 'consent') errors.consent = [t.errorConsent]
      }
      setFieldErrors(errors)
      return
    }

    setStatus('submitting')

    let turnstileToken: string | undefined
    if (typeof window !== 'undefined' && 'turnstile' in window) {
      try {
        turnstileToken = (window.turnstile as { getResponse: () => string }).getResponse() || undefined
      } catch {
        // no widget present
      }
    }

    try {
      const res = await fetch('/api/forms/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsed.data, locale, ...(turnstileToken ? { turnstileToken } : {}) }),
      })

      const json = (await res.json()) as { success: boolean; message?: string; fieldErrors?: FieldErrors }

      if (json.success) {
        const thanksPath = locale === siteConfig.locales.default ? '/thanks' : `/${locale}/thanks`
        router.push(thanksPath)
        return
      }

      setStatus('error')
      setServerMessage(json.message ?? t.error)
      if (json.fieldErrors) {
        const mapped: FieldErrors = {}
        if (json.fieldErrors['url']) mapped.url = [t.errorUrl]
        if (json.fieldErrors['email']) mapped.email = [t.errorEmail]
        if (json.fieldErrors['consent']) mapped.consent = [t.errorConsent]
        setFieldErrors((prev) => ({ ...prev, ...mapped }))
      }
    } catch {
      setStatus('error')
      setServerMessage(t.error)
    }
  }

  const fieldClass =
    'w-full min-h-[48px] rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-base text-[var(--color-text)] placeholder:text-neutral-400 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors'
  const errorClass = 'mt-1 text-sm text-[var(--color-error)]'
  const labelClass = 'flex items-center gap-2 text-sm font-medium text-[var(--color-text)] mb-1'

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={status === 'submitting'} className="space-y-5">
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {status === 'submitting' ? t.submitting : ''}
      </p>

      {/* Honeypot — never shown to real visitors; the shared route handler
          rejects any submission where this has a value. */}
      <input
        type="text"
        name="_hp"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        defaultValue=""
      />

      {/* Website address */}
      <div>
        <label htmlFor="af-url" className={labelClass}>
          {t.url} <Badge variant="accent">{t.required}</Badge>
        </label>
        <input
          id="af-url"
          type="url"
          placeholder={t.urlPlaceholder}
          required
          aria-invalid={Boolean(fieldErrors['url'])}
          aria-describedby={fieldErrors['url'] ? 'af-url-error' : undefined}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className={fieldClass}
        />
        {fieldErrors['url'] && (
          <p id="af-url-error" role="alert" className={errorClass}>{fieldErrors['url'][0]}</p>
        )}
      </div>

      {/* Company / shop name */}
      <div>
        <label htmlFor="af-company" className={labelClass}>{t.company}</label>
        <input
          id="af-company"
          type="text"
          autoComplete="organization"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className={fieldClass}
        />
      </div>

      {/* Name */}
      <div>
        <label htmlFor="af-name" className={labelClass}>
          {t.name} <Badge variant="accent">{t.required}</Badge>
        </label>
        <input
          id="af-name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="af-email" className={labelClass}>
          {t.email} <Badge variant="accent">{t.required}</Badge>
        </label>
        <input
          id="af-email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(fieldErrors['email'])}
          aria-describedby={fieldErrors['email'] ? 'af-email-error' : undefined}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClass}
        />
        {fieldErrors['email'] && (
          <p id="af-email-error" role="alert" className={errorClass}>{fieldErrors['email'][0]}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="af-phone" className={labelClass}>{t.phone}</label>
        <input
          id="af-phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={fieldClass}
        />
      </div>

      {/* Industry */}
      <div>
        <label htmlFor="af-industry" className={labelClass}>{t.industry}</label>
        <select
          id="af-industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value as Industry | '')}
          className={fieldClass}
        >
          <option value="" />
          {(Object.entries(industryOptions[locale]) as [Industry, string][]).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Current booking system */}
      <div>
        <label htmlFor="af-booking-system" className={labelClass}>{t.bookingSystem}</label>
        <input
          id="af-booking-system"
          type="text"
          placeholder={t.bookingSystemPlaceholder}
          value={bookingSystem}
          onChange={(e) => setBookingSystem(e.target.value)}
          className={fieldClass}
        />
      </div>

      {/* LINE Official Account */}
      <div>
        <label htmlFor="af-line-account" className={labelClass}>{t.lineAccount}</label>
        <select
          id="af-line-account"
          value={lineAccount}
          onChange={(e) => setLineAccount(e.target.value as LineAccount | '')}
          className={fieldClass}
        >
          <option value="" />
          {(Object.entries(lineAccountOptions[locale]) as [LineAccount, string][]).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Main problem (multi-select) */}
      <fieldset>
        <legend className={labelClass}>{t.problem}</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {(Object.entries(problemOptions[locale]) as [Problem, string][]).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm text-[var(--color-text)]">
              <input
                type="checkbox"
                checked={problem.includes(value)}
                onChange={() => toggleProblem(value)}
                className="h-4 w-4"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Preferred contact */}
      <div>
        <label htmlFor="af-contact-pref" className={labelClass}>{t.contactPref}</label>
        <select
          id="af-contact-pref"
          value={contactPref}
          onChange={(e) => setContactPref(e.target.value as ContactPref | '')}
          className={fieldClass}
        >
          <option value="" />
          {(Object.entries(contactPrefOptions[locale]) as [ContactPref, string][]).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="af-message" className={labelClass}>{t.message}</label>
        <textarea
          id="af-message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${fieldClass} resize-y min-h-[100px]`}
        />
      </div>

      {/* Consent */}
      <div>
        <label className="flex items-start gap-2 text-sm text-[var(--color-text)]">
          <input
            type="checkbox"
            required
            aria-invalid={Boolean(fieldErrors['consent'])}
            aria-describedby={fieldErrors['consent'] ? 'af-consent-error' : undefined}
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            {t.consent} <Badge variant="accent">{t.required}</Badge> —{' '}
            {/* Pack-4/M1: locale-aware, so /en/assessment links to /en/privacy. */}
            <Link href={siteConfig.legal.privacyPolicySlug} className="underline hover:no-underline">
              {privacyLinkLabels[locale]}
            </Link>
          </span>
        </label>
        {fieldErrors['consent'] && (
          <p id="af-consent-error" role="alert" className={errorClass}>{fieldErrors['consent'][0]}</p>
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
        className="w-full min-h-[48px] rounded-lg bg-[var(--color-primary)] px-6 py-3 text-base font-medium text-white hover:opacity-90 disabled:opacity-60 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
      >
        {status === 'submitting' ? t.submitting : t.submit}
      </button>
    </form>
  )
}
