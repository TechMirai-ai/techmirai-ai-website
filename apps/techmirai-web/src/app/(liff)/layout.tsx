import type { ReactNode } from 'react'
import "../globals.css"
import siteConfig from '../../../site.config'

/**
 * Root layout for the LIFF route group — separate from (frontend)/layout.tsx
 * so a LIFF webview never inherits the marketing site's Header/Footer/
 * ReceptionWidget/FloatingCTAs (STEP 2 Part 2 item 1's "thin page shell").
 * Still imports the same global stylesheet, so Tailwind/booking-flow CSS
 * variables work identically to the rest of the site.
 */
export default function LiffRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={siteConfig.locales.default} suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  )
}
