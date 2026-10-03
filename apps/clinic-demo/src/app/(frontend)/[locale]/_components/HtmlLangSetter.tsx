'use client'

import { useEffect } from 'react'

interface HtmlLangSetterProps {
  locale: string
  dir: 'ltr' | 'rtl'
}

export function HtmlLangSetter({ locale, dir }: HtmlLangSetterProps) {
  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = dir
  }, [locale, dir])

  return null
}
