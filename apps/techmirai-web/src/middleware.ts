import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

const intlMiddleware = createMiddleware(routing)

// Pack-2/D2 indexing guard: mirrors robots.ts's SITE_ENV gate with the
// response-header half — a non-production deploy must never be indexed even
// if a crawler ignores robots.txt.
export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request)
  if (process.env['SITE_ENV'] !== 'production') {
    response.headers.set('X-Robots-Tag', 'noindex')
  }
  return response
}

export const config = {
  matcher: ['/((?!api|admin|_next|_vercel|.*\\..*).*)', '/'],
}
