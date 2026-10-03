'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { AffiliatesBlockProps, AffiliateItem } from './types'

const colsMap: Record<string, string> = {
  '2': 'grid-cols-1 sm:grid-cols-2',
  '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
}

function CardItem({ item }: { item: AffiliateItem }) {
  const inner = (
    <div className="flex h-full flex-col items-center gap-4 rounded-2xl border border-[var(--color-neutral-200,#e5e7eb)] bg-[var(--color-surface)] p-6 text-center shadow-sm transition-shadow duration-150 hover:shadow-md">
      {item.logoUrl ? (
        /* 🛠️ Real colors preserved inside cards */
        <Image src={item.logoUrl} alt={item.name} width={120} height={60} className="h-12 w-auto object-contain" />
      ) : (
        <div className="flex h-12 w-full items-center justify-center rounded-lg bg-[var(--color-neutral-100,#f5f5f5)]">
          <span className="text-sm font-semibold text-[var(--color-muted)]">{item.name}</span>
        </div>
      )}
      <h3 className="text-sm font-bold text-[var(--color-text)]">{item.name}</h3>
      {item.description && (
        <p className="text-xs leading-relaxed text-[var(--color-muted)]">{item.description}</p>
      )}
    </div>
  )
  if (item.href) {
    return <li><Link href={item.href} target="_blank" rel="noopener noreferrer">{inner}</Link></li>
  }
  return <li>{inner}</li>
}

function LogoItem({ item }: { item: AffiliateItem }) {
  const inner = item.logoUrl ? (
    <Image
      src={item.logoUrl}
      alt={item.name}
      width={160}
      height={80}
      /* 🛠️ FIXED: Removed grayscale utility classes so full branding color shows instantly */
      className="h-12 w-auto object-contain transition-transform duration-200 hover:scale-105"
    />
  ) : (
    <span className="text-sm font-semibold text-[var(--color-muted)]">{item.name}</span>
  )
  if (item.href) {
    return (
      <li className="flex items-center justify-center">
        <Link href={item.href} target="_blank" rel="noopener noreferrer">{inner}</Link>
      </li>
    )
  }
  return <li className="flex items-center justify-center">{inner}</li>
}

function ListItem({ item }: { item: AffiliateItem }) {
  const inner = (
    <div className="flex items-start gap-4 py-4 border-b border-[var(--color-neutral-100,#f5f5f5)] last:border-0">
      {item.logoUrl && (
        <Image src={item.logoUrl} alt={item.name} width={64} height={40} className="h-10 w-16 shrink-0 object-contain" />
      )}
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-bold text-[var(--color-text)]">{item.name}</h3>
        {item.description && (
          <p className="text-xs text-[var(--color-muted)]">{item.description}</p>
        )}
      </div>
    </div>
  )
  if (item.href) {
    return <li><Link href={item.href} target="_blank" rel="noopener noreferrer">{inner}</Link></li>
  }
  return <li>{inner}</li>
}

function MarqueeLogos({ items }: { items: AffiliateItem[] }) {
  return (
    <div className="relative overflow-hidden">
      <ul
        className="flex gap-12 items-center animate-marquee whitespace-nowrap"
        aria-label="Partner logos"
        role="list"
        style={{ ['--marquee-duration' as string]: `${Math.max(20, items.length * 3)}s` }}
      >
        {[...items, ...items].map((item, i) => (
          <li key={i} className="inline-flex shrink-0 items-center">
            {item.logoUrl ? (
              <Image
                src={item.logoUrl}
                alt={item.name}
                width={140}
                height={70}
                /* 🛠️ FIXED: Removed grayscale formatting filtering from infinite marquee stream items too */
                className="h-10 w-auto object-contain transition-transform duration-200 hover:scale-105"
              />
            ) : (
              <span className="text-sm font-semibold text-[var(--color-muted)]">{item.name}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AffiliatesBlock({
  heading,
  body,
  items,
  layout = 'cards',
  columns = '3',
  animation = 'none',
}: AffiliatesBlockProps) {
  if (items.length === 0) return null

  const colsClass = colsMap[columns] ?? colsMap['3']
  const isMarquee = layout === 'logos' && animation === 'marquee'

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {(heading || body) && (
          <div className="mb-10 text-center">
            {heading && (
              <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
                {heading}
              </h2>
            )}
            {body && (
              <p className="mt-4 mx-auto max-w-2xl text-base text-[var(--color-muted)]">{body}</p>
            )}
          </div>
        )}

        {layout === 'cards' && (
          <ul className={`grid gap-6 ${colsClass}`} role="list">
            {items.map((item, i) => <CardItem key={i} item={item} />)}
          </ul>
        )}

        {layout === 'logos' && isMarquee && (
          <MarqueeLogos items={items} />
        )}

        {layout === 'logos' && !isMarquee && (
          <ul className={`grid gap-8 items-center ${colsClass}`} role="list">
            {items.map((item, i) => <LogoItem key={i} item={item} />)}
          </ul>
        )}

        {layout === 'list' && (
          <ul role="list">
            {items.map((item, i) => <ListItem key={i} item={item} />)}
          </ul>
        )}
      </div>
    </section>
  )
}