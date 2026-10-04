"use client"

import { useLocale } from 'next-intl'
import { LanguageSwitcher } from '@techmirai/cms-core/components/LanguageSwitcher'
import { useRouter, usePathname } from '@/i18n/routing'

interface LocaleSwitcherProps {
  locales: string[]
  localeLabels: Record<string, string>
}

export function LocaleSwitcher({ locales, localeLabels }: LocaleSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale()

  function handleSwitch(locale: string) {
    router.replace(pathname, { locale })
  }

  return (
    <LanguageSwitcher
      locales={locales}
      currentLocale={currentLocale}
      localeLabels={localeLabels}
      onLocaleSwitch={handleSwitch}
    />
  )
}
