import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../payload.config'
import { contactSchema, type InquiryPath } from '@/lib/validation/contact'
import { seminarSchema } from '@/lib/validation/seminar'
import { downloadSchema } from '@/lib/validation/download'
import { assessmentSchema } from '@/lib/validation/assessment'
import { demoRegisterSchema } from '@/lib/validation/demo-register'
import { checkRateLimit } from '@/lib/rate-limit'
import { extractIp } from '@/lib/request-ip'
import { z } from 'zod'
import siteConfig from '../../../../../site.config'

// ---------------------------------------------------------------------------
// Job-apply schema (inline — only used in this route)
// ---------------------------------------------------------------------------

const jobApplySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  jobSlug: z.string().min(1),
  message: z.string().min(1),
  locale: z.string().optional(),
  turnstileToken: z.string().optional(),
  _hp: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Form type
// ---------------------------------------------------------------------------

const INQUIRY_PATH_LABELS: Record<InquiryPath, string> = {
  adoption: 'AI voice agent adoption',
  partnership: 'White-label partnership',
}

const FORM_TYPES = ['contact', 'job-apply', 'seminar', 'download', 'assessment', 'demo-register'] as const
type FormType = (typeof FORM_TYPES)[number]

function isFormType(s: string): s is FormType {
  return (FORM_TYPES as readonly string[]).includes(s)
}

// ---------------------------------------------------------------------------
// Localized error messages
// ---------------------------------------------------------------------------

const messages = {
  en: {
    required: 'This field is required.',
    turnstileFailed: 'Security check failed. Please refresh and try again.',
    rateLimited: 'Too many requests. Please wait a moment before trying again.',
    serverError: 'Something went wrong. Please try again.',
  },
  ja: {
    required: '必須項目です。',
    turnstileFailed: 'セキュリティチェックに失敗しました。ページを更新してもう一度お試しください。',
    rateLimited: 'リクエストが多すぎます。しばらくお待ちください。',
    serverError: 'エラーが発生しました。もう一度お試しください。',
  },
} satisfies Record<string, Record<string, string>>

function msg(locale: string | undefined, key: keyof (typeof messages)['en']): string {
  const loc =
    locale && locale in messages
      ? (locale as keyof typeof messages)
      : (siteConfig.locales.default as keyof typeof messages)
  return messages[loc][key]
}

// ---------------------------------------------------------------------------
// Security helpers
// ---------------------------------------------------------------------------

function hasHoneypot(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return false
  const hp = (body as Record<string, unknown>)['_hp']
  return typeof hp === 'string' && hp.length > 0
}

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env['TURNSTILE_SECRET_KEY']
  if (!secret) return true

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v1/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
    })
    const data = (await res.json()) as { success: boolean }
    return data.success
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Payload persistence — emails are fired by the afterChange hook on creation
// ---------------------------------------------------------------------------

async function persist(
  formType: FormType,
  email: string,
  locale: string,
  payload: unknown,
): Promise<void> {
  const cms = await getPayload({ config })
  await cms.create({
    collection: 'form-submissions',
    data: {
      formType,
      email,
      locale,
      status: 'new',
      submittedAt: new Date().toISOString(),
      payload,
    },
  })
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

type RouteContext = { params: Promise<{ type: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  const { type } = await context.params

  if (!isFormType(type)) {
    return NextResponse.json({ success: false, message: 'Unknown form type' }, { status: 400 })
  }

  // ── Rate limit ─────────────────────────────────────────────────────────────
  const ip = extractIp(request)
  const rl = await checkRateLimit(`${type}:${ip}`)
  if (!rl.success) {
    return NextResponse.json({ success: false, message: msg(undefined, 'rateLimited') }, { status: 429 })
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 })
  }

  // ── Honeypot ───────────────────────────────────────────────────────────────
  if (hasHoneypot(body)) {
    return NextResponse.json({ success: false, message: 'Bad request' }, { status: 400 })
  }

  const locale =
    typeof body === 'object' && body !== null && 'locale' in body
      ? String((body as Record<string, unknown>)['locale'] ?? siteConfig.locales.default)
      : siteConfig.locales.default

  // ── Validate + Turnstile + Persist ─────────────────────────────────────────

  if (type === 'contact') {
    const parsed = contactSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, fieldErrors: parsed.error.flatten().fieldErrors, message: msg(locale, 'required') },
        { status: 422 },
      )
    }
    if (parsed.data.turnstileToken && !(await verifyTurnstile(parsed.data.turnstileToken))) {
      return NextResponse.json({ success: false, message: msg(locale, 'turnstileFailed') }, { status: 400 })
    }
    try {
      // `inquiryType` and `message` keep the keys the notification email
      // hook (send-form-emails.ts) already prints; the other fields are
      // stored on the JSON payload as-is. Consent is recorded with a
      // timestamp so it can be shown later (ECC prompt v2 §2).
      const { data } = parsed
      await persist('contact', data.email, locale, {
        name: data.name,
        company: data.company,
        role: data.role,
        email: data.email,
        phone: data.phone,
        inquiryPath: data.inquiryPath,
        inquiryType: INQUIRY_PATH_LABELS[data.inquiryPath],
        callVolume: data.callVolume,
        hoursToCover: data.hoursToCover,
        languages: data.languages,
        goal: data.goal,
        message: data.goal ?? '',
        consent: true,
        consentAt: new Date().toISOString(),
      })
    } catch {
      return NextResponse.json({ success: false, message: msg(locale, 'serverError') }, { status: 500 })
    }
    return NextResponse.json({ success: true }, { status: 200 })
  }

  if (type === 'job-apply') {
    const parsed = jobApplySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, fieldErrors: parsed.error.flatten().fieldErrors, message: msg(locale, 'required') },
        { status: 422 },
      )
    }
    if (parsed.data.turnstileToken && !(await verifyTurnstile(parsed.data.turnstileToken))) {
      return NextResponse.json({ success: false, message: msg(locale, 'turnstileFailed') }, { status: 400 })
    }
    try {
      await persist('job-apply', parsed.data.email, locale, {
        name: parsed.data.name,
        email: parsed.data.email,
        jobSlug: parsed.data.jobSlug,
        message: parsed.data.message,
      })
    } catch {
      return NextResponse.json({ success: false, message: msg(locale, 'serverError') }, { status: 500 })
    }
    return NextResponse.json({ success: true }, { status: 200 })
  }

  if (type === 'seminar') {
    const parsed = seminarSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, fieldErrors: parsed.error.flatten().fieldErrors, message: msg(locale, 'required') },
        { status: 422 },
      )
    }
    if (parsed.data.turnstileToken && !(await verifyTurnstile(parsed.data.turnstileToken))) {
      return NextResponse.json({ success: false, message: msg(locale, 'turnstileFailed') }, { status: 400 })
    }
    try {
      await persist('seminar', parsed.data.email, locale, {
        name: parsed.data.name,
        email: parsed.data.email,
        seminarSlug: parsed.data.seminarSlug,
        message: parsed.data.message,
      })
    } catch {
      return NextResponse.json({ success: false, message: msg(locale, 'serverError') }, { status: 500 })
    }
    return NextResponse.json({ success: true }, { status: 200 })
  }

  if (type === 'assessment') {
    const parsed = assessmentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, fieldErrors: parsed.error.flatten().fieldErrors, message: msg(locale, 'required') },
        { status: 422 },
      )
    }
    if (parsed.data.turnstileToken && !(await verifyTurnstile(parsed.data.turnstileToken))) {
      return NextResponse.json({ success: false, message: msg(locale, 'turnstileFailed') }, { status: 400 })
    }
    try {
      await persist('assessment', parsed.data.email, locale, {
        url: parsed.data.url,
        company: parsed.data.company,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        industry: parsed.data.industry,
        bookingSystem: parsed.data.bookingSystem,
        lineAccount: parsed.data.lineAccount,
        problem: parsed.data.problem,
        contactPref: parsed.data.contactPref,
        message: parsed.data.message,
      })
    } catch {
      return NextResponse.json({ success: false, message: msg(locale, 'serverError') }, { status: 500 })
    }
    return NextResponse.json({ success: true }, { status: 200 })
  }

  if (type === 'demo-register') {
    const parsed = demoRegisterSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, fieldErrors: parsed.error.flatten().fieldErrors, message: msg(locale, 'required') },
        { status: 422 },
      )
    }
    if (parsed.data.turnstileToken && !(await verifyTurnstile(parsed.data.turnstileToken))) {
      return NextResponse.json({ success: false, message: msg(locale, 'turnstileFailed') }, { status: 400 })
    }
    try {
      // `phone` and `message` are the keys the notification email hook
      // (send-form-emails.ts) already prints for contactNo and purpose.
      await persist('demo-register', parsed.data.email, locale, {
        name: parsed.data.name,
        email: parsed.data.email,
        company: parsed.data.company,
        phone: parsed.data.contactNo,
        message: parsed.data.purpose,
      })
    } catch {
      return NextResponse.json({ success: false, message: msg(locale, 'serverError') }, { status: 500 })
    }
    return NextResponse.json({ success: true }, { status: 200 })
  }

  // download
  const parsed = downloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, fieldErrors: parsed.error.flatten().fieldErrors, message: msg(locale, 'required') },
      { status: 422 },
    )
  }
  if (parsed.data.turnstileToken && !(await verifyTurnstile(parsed.data.turnstileToken))) {
    return NextResponse.json({ success: false, message: msg(locale, 'turnstileFailed') }, { status: 400 })
  }
  try {
    await persist('download', parsed.data.email, locale, {
      name: parsed.data.name,
      email: parsed.data.email,
      resourceSlug: parsed.data.resourceSlug,
    })
  } catch {
    return NextResponse.json({ success: false, message: msg(locale, 'serverError') }, { status: 500 })
  }
  return NextResponse.json({ success: true }, { status: 200 })
}
