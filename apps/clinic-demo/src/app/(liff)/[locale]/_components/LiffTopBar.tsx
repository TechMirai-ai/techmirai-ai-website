'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/routing'

interface LiffTopBarProps {
  locale: string
  locales: string[]
  clinicName: string
}

// Language names are shown in their own language, not translated — the
// standard convention for a language switcher (a Japanese speaker on the
// English screen still needs to recognize "日本語").
const LOCALE_LABELS: Record<string, string> = { ja: '日本語', en: 'English' }

/**
 * Slim top bar for the LIFF route group — the compact language control the
 * (liff) shell deliberately never got when Header/Footer were excluded
 * (see (liff)/layout.tsx doc comment). Uses the same next-intl routing
 * (@/i18n/routing) as the main site's LocaleSwitcher, so switching is a
 * client-side locale-prefix navigation rather than a full reload — this
 * keeps LiffBookingClient/LiffManageClient mounted and their in-memory
 * step state intact instead of resetting the caller back to step 1.
 */
export function LiffTopBar({ locale, locales, clinicName }: LiffTopBarProps) {
  const t = useTranslations('liffTopBar')
  const router = useRouter()
  const pathname = usePathname()

  function handleSwitch(nextLocale: string): void {
    if (nextLocale === locale) return
    router.replace(pathname, { locale: nextLocale })
  }

  return (
    <div
      className="sticky top-0 z-40 mb-8 flex items-center justify-between gap-3 border-b px-4 pt-4 pb-3"
      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-default)' }}
    >
      <Image
        src="/brand/Sakura-clinic-logo.png"
        alt={`${clinicName} Logo`}
        width={300}
        height={200}
        sizes="300px"
        priority
        className="h-16 w-auto shrink-0 object-contain object-left sm:h-16"
      />

      <div
        role="group"
        aria-label={t('languageLabel')}
        className="inline-flex shrink-0 overflow-hidden rounded-full border"
        style={{ borderColor: 'var(--color-border-default)' }}
      >
        {locales.map((loc) => {
          const active = loc === locale
          return (
            <button
              key={loc}
              type="button"
              onClick={() => handleSwitch(loc)}
              aria-current={active ? 'true' : undefined}
              className="min-h-[36px] px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              style={
                active
                  ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-surface)' }
                  : { color: 'var(--color-text)' }
              }
            >
              {LOCALE_LABELS[loc] ?? loc.toUpperCase()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
