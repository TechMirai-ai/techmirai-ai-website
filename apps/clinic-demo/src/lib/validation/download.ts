import { z } from 'zod'

export const downloadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  resourceSlug: z.string().min(1),
  locale: z.string().optional(),
  turnstileToken: z.string().optional(),
  _hp: z.string().optional(),
})

export type DownloadInput = z.infer<typeof downloadSchema>
