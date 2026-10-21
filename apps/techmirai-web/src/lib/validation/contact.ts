import { z } from 'zod'

// Voice-pivot (docs/ECC MASTER PROMPT TechMirai Voice Website v2 §2, §9):
// short B2B form with two inquiry paths. Consent is mandatory and enforced
// here on the server — a request without `consent: true` is rejected no
// matter what the browser sent.
export const INQUIRY_PATHS = ['adoption', 'partnership'] as const
export type InquiryPath = (typeof INQUIRY_PATHS)[number]

const optionalText = (max: number) => z.string().trim().max(max).optional()

export const contactSchema = z.object({
  inquiryPath: z.enum(INQUIRY_PATHS),
  name: z.string().trim().min(1).max(100),
  company: z.string().trim().min(1).max(150),
  role: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  phone: optionalText(40),
  callVolume: optionalText(100),
  hoursToCover: optionalText(100),
  languages: optionalText(100),
  goal: optionalText(1000),
  consent: z.literal(true),
  locale: z.string().optional(),
  turnstileToken: z.string().optional(),
  _hp: z.string().optional(),
})

export type ContactInput = z.infer<typeof contactSchema>
