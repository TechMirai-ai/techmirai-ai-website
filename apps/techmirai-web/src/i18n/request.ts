import { getRequestConfig } from 'next-intl/server'
import type { AbstractIntlMessages } from 'next-intl'
import siteConfig from '../../site.config'

type MsgLoader = () => Promise<{ default: AbstractIntlMessages }>

const messageLoaders: Record<string, MsgLoader> = {
  en: () => import('../messages/en.json') as Promise<{ default: AbstractIntlMessages }>,
  ja: () => import('../messages/ja.json') as Promise<{ default: AbstractIntlMessages }>,
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale: string = (await requestLocale) ?? siteConfig.locales.default

  if (!siteConfig.locales.enabled?.includes(locale)) {
    locale = siteConfig.locales.default
  }

  const loader = messageLoaders[locale] ?? messageLoaders[siteConfig.locales.default]
  const { default: messages } = await loader!()

  return { locale, messages }
})
