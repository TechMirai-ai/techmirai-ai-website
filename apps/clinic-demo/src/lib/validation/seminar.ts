import { z } from 'zod'

export const seminarSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  seminarSlug: z.string().min(1),
  message: z.string().optional(),
  locale: z.string().optional(),
  turnstileToken: z.string().optional(),
  _hp: z.string().optional(),
})

export type SeminarInput = z.infer<typeof seminarSchema>
