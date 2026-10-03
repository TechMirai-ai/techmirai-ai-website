import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(1),
  furigana: z.string().optional(),
  email: z.string().email(),
  company: z.string().optional(),
  inquiryType: z.enum(['general', 'visa', 'recruitment', 'other']),
  message: z.string().min(10),
  locale: z.string().optional(),
  turnstileToken: z.string().optional(),
  _hp: z.string().optional(),
})

export type ContactInput = z.infer<typeof contactSchema>
