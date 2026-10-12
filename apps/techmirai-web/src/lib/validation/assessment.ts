import { z } from 'zod'

// Pack-4/J1: /assessment (Spec §12.2, lines 1031-1047 of
// `docs/_inputs/TechMirai Website — Full Content Spec (EN JA).md`). Field
// names are camelCase per this codebase's existing convention (see
// `contactSchema`'s `inquiryType`, not `inquiry_type`) — the Spec's own
// underscore field names (`booking_system`, `line_account`, `contact_pref`)
// are an implementation detail, not customer-facing copy, so renaming them
// is not a content deviation. Only `url`, `name`, `email` and `consent` are
// required, matching the Spec's own "Required" column exactly — no other
// field is required here even though the Spec marks it with a select/enum.
export const assessmentSchema = z.object({
  url: z.string().url(),
  company: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  industry: z
    .enum(['clinic', 'beauty', 'automobile', 'hotel', 'restaurant', 'real-estate', 'other'])
    .optional(),
  bookingSystem: z.string().optional(),
  lineAccount: z.enum(['yes', 'no', 'not-sure']).optional(),
  problem: z
    .array(z.enum(['missed-calls', 'same-questions', 'after-hours', 'phone-changes', 'foreign-customers', 'other']))
    .optional(),
  contactPref: z.enum(['email', 'phone', 'line']).optional(),
  message: z.string().optional(),
  consent: z.literal(true),
  locale: z.string().optional(),
  turnstileToken: z.string().optional(),
  _hp: z.string().optional(),
})

export type AssessmentInput = z.infer<typeof assessmentSchema>
