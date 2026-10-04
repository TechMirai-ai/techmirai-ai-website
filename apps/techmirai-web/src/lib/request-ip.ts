import { ipAddress } from '@vercel/functions'
import type { NextRequest } from 'next/server'

/**
 * Delegates to Vercel's own platform helper rather than hand-parsing
 * x-forwarded-for/x-real-ip. On this app's deployment topology (custom
 * domain pointed directly at Vercel, no other CDN/WAF in front), Vercel
 * overwrites x-forwarded-for at their edge specifically to prevent client
 * spoofing (https://vercel.com/docs/headers/request-headers) — ipAddress()
 * gets exactly that platform-guaranteed value instead of a parallel
 * reimplementation that could silently drift from Vercel's own behavior.
 *
 * If a future deployment ever needs a WAF/CDN stacked in front of Vercel,
 * this would need revisiting (Vercel's Enterprise "trusted proxy" feature,
 * or a different IP-resolution strategy) — out of scope until that
 * topology actually exists.
 *
 * Shared with the /api/forms/[type] route.
 */
export function extractIp(request: NextRequest): string {
  return ipAddress(request) ?? 'unknown'
}
