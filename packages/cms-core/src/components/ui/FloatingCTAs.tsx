'use client'

import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'

interface FloatingCTAsProps {
  lineUrl?: string | undefined
}

// Fallback only — real value should come from the Header global's
// lineButton.href, same source Hero and the mobile drawer already use.
const DEFAULT_LINE_URL = 'https://line.me/R/ti/p/~techmirai-placeholder'

export function FloatingCTAs({ lineUrl }: FloatingCTAsProps) {
  const [visible, setVisible] = useState(false)
  const resolvedLineUrl = lineUrl || DEFAULT_LINE_URL

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={[
        // Pack-2/E2: shifted up so it doesn't sit on top of the mobile
        // sticky bottom bar HeaderClient.tsx added in E1.
        'md:hidden fixed bottom-[72px] left-4 z-40 transition-transform duration-300',
        visible ? 'translate-y-0' : 'translate-y-24',
      ].join(' ')}
    >
      <a
        href={resolvedLineUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 shadow-md px-4 py-2.5 text-sm font-semibold text-text-primary hover:shadow-lg transition-shadow"
      >
        LINE Booking
        <ExternalLink className="w-3.5 h-3.5 text-text-secondary" strokeWidth={2} />
      </a>
    </div>
  )
}
