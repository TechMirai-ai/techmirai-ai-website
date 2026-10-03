import type { ReactNode } from 'react'
import Script from 'next/script'
import "../globals.css" // <-- This restores Tailwind to all your frontend pages!
import { ScrollToTop } from '@techmirai/cms-core/components/ui'
import siteConfig from '../../../site.config'

// ReceptionWidget is NOT rendered here. This root layout is a parent of
// [locale]/layout.tsx (where NextIntlClientProvider lives), so anything
// rendered as a sibling of {children} here — including everything the
// reception chat can mount, like BookingFlow — sits outside next-intl's
// React context tree and throws "NextIntlClientProvider was not found".
// See [locale]/layout.tsx for the actual reception widget wiring.
export default function FrontendRootLayout({
  children,
}: {
  children: ReactNode
}) {
  const chatWidget = siteConfig.integrations.chatWidget
  const showChatWidget = siteConfig.features.aiAgent && chatWidget

  return (
    <html lang={siteConfig.locales.default} suppressHydrationWarning>
      <body className="antialiased">
        {children}
        <ScrollToTop />
        {showChatWidget && (
          <>
            <link rel="stylesheet" href={chatWidget.url.replace(/widget\.js$/, 'widget.css')} />
            <Script
              src={chatWidget.url}
              strategy="lazyOnload"
              data-staff-whatsapp={chatWidget.whatsappNumber}
              data-avatar={chatWidget.avatarUrl}
              data-color={chatWidget.color}
            />
          </>
        )}
      </body>
    </html>
  )
}