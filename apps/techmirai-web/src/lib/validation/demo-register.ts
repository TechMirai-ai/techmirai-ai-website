import { z } from 'zod'

// Live-demo registration (/demo). Every field is mandatory; the server enforces
// it no matter what the browser sent.
export const demoRegisterSchema = z.object({
  name: z.string().trim().min(1).max(100),
  contactNo: z.string().trim().min(1).max(40),
  email: z.string().trim().email().max(254),
  company: z.string().trim().min(1).max(150),
  purpose: z.string().trim().min(1).max(1000),
  locale: z.string().optional(),
  turnstileToken: z.string().optional(),
  _hp: z.string().optional(),
})

export type DemoRegisterInput = z.infer<typeof demoRegisterSchema>
