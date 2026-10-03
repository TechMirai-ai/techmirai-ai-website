import type {
  HeroBlockProps, HeroSlide, NavItem, ReservationButton, PhoneButton,
  LineButton, HoursTable, HoursRow, NoteItem, AddressInfo, FirstVisitCard,
} from './types'

export function adaptHeroBlock(raw: unknown): HeroBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const bgImage = data['backgroundImage'] as Record<string, unknown> | null | undefined

  const rawSlides = Array.isArray(data['heroSlides']) ? data['heroSlides'] : []
  const heroSlides: HeroSlide[] = rawSlides
    .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
    .map((s) => {
      const img = s['image'] as Record<string, unknown> | null | undefined
      return {
        imageUrl: img && typeof img['url'] === 'string' ? img['url'] : '',
        title: typeof s['title'] === 'string' ? s['title'] : '',
        subtitle: typeof s['subtitle'] === 'string' ? s['subtitle'] : '',
        alt: typeof s['alt'] === 'string' ? s['alt'] : '',
      }
    })
    .filter((s) => s.imageUrl)

  const reservationRaw = data['reservationButton'] as Record<string, unknown> | null | undefined
  const reservationButton: ReservationButton | undefined =
    reservationRaw && typeof reservationRaw['label'] === 'string' && typeof reservationRaw['href'] === 'string'
      ? { label: reservationRaw['label'], href: reservationRaw['href'] }
      : undefined

  // Injected onto the raw block by the homepage route from the Header global
  // (see resolveHeaderData) — not a Hero-block CMS field of its own.
  const phoneRaw = data['phoneButton'] as Record<string, unknown> | null | undefined
  const phoneButton: PhoneButton | undefined =
    phoneRaw && typeof phoneRaw['phoneDisplay'] === 'string' && typeof phoneRaw['phoneHref'] === 'string'
      ? {
          phoneDisplay: phoneRaw['phoneDisplay'],
          phoneHref: phoneRaw['phoneHref'],
          badgeLabel: typeof phoneRaw['badgeLabel'] === 'string' ? phoneRaw['badgeLabel'] : '',
          subLabel: typeof phoneRaw['subLabel'] === 'string' ? phoneRaw['subLabel'] : '',
        }
      : undefined

  const lineRaw = data['lineButton'] as Record<string, unknown> | null | undefined
  const lineButton: LineButton | undefined =
    lineRaw && typeof lineRaw['href'] === 'string'
      ? {
          href: lineRaw['href'],
          label: typeof lineRaw['label'] === 'string' ? lineRaw['label'] : '',
          subLabel: typeof lineRaw['subLabel'] === 'string' ? lineRaw['subLabel'] : '',
        }
      : undefined


  const hoursRaw = data['hoursTable'] as Record<string, unknown> | null | undefined
  const rawHourRows = hoursRaw && Array.isArray(hoursRaw['rows']) ? hoursRaw['rows'] : []
  const hourRows: HoursRow[] = rawHourRows
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      day: typeof r['day'] === 'string' ? r['day'] : '',
      morning: typeof r['morningOpen'] === 'boolean' ? r['morningOpen'] : false,
      afternoon: typeof r['afternoonOpen'] === 'boolean' ? r['afternoonOpen'] : false,
    }))
    .filter((r) => r.day)
  const hoursTable: HoursTable | undefined =
    hoursRaw && hourRows.length > 0
      ? {
          morningLabel: typeof hoursRaw['morningLabel'] === 'string' ? hoursRaw['morningLabel'] : '',
          afternoonLabel: typeof hoursRaw['afternoonLabel'] === 'string' ? hoursRaw['afternoonLabel'] : '',
          rows: hourRows,
        }
      : undefined

  const rawNotes = Array.isArray(data['notes']) ? data['notes'] : []
  const notes: NoteItem[] = rawNotes
    .filter((n): n is Record<string, unknown> => typeof n === 'object' && n !== null)
    .map((n) => ({ text: typeof n['text'] === 'string' ? n['text'] : '' }))
    .filter((n) => n.text)

  const addressRaw = data['address'] as Record<string, unknown> | null | undefined
  const address: AddressInfo | undefined =
    addressRaw && typeof addressRaw['line'] === 'string'
      ? { line: addressRaw['line'], mapHref: typeof addressRaw['mapHref'] === 'string' ? addressRaw['mapHref'] : '#map' }
      : undefined

  const firstVisitRaw = data['firstVisitCard'] as Record<string, unknown> | null | undefined
  const firstVisitCard: FirstVisitCard | undefined =
    firstVisitRaw && typeof firstVisitRaw['heading'] === 'string'
      ? {
          heading: firstVisitRaw['heading'],
          description: typeof firstVisitRaw['description'] === 'string' ? firstVisitRaw['description'] : '',
          linkLabel: typeof firstVisitRaw['linkLabel'] === 'string' ? firstVisitRaw['linkLabel'] : '',
          linkHref: typeof firstVisitRaw['linkHref'] === 'string' ? firstVisitRaw['linkHref'] : '#',
        }
      : undefined

  const subheadlineStr = typeof data['subheadline'] === 'string' && data['subheadline'] ? data['subheadline'] : ''
  const bgImageUrl = bgImage && typeof bgImage['url'] === 'string' ? bgImage['url'] : ''

  const navItemsRaw = Array.isArray(data['navItems']) ? data['navItems'] : []
const navItems: NavItem[] = navItemsRaw
  .filter((n): n is Record<string, unknown> => typeof n === 'object' && n !== null)
  .map((n) => ({
    label: typeof n['label'] === 'string' ? n['label'] : '',
    href: typeof n['href'] === 'string' ? n['href'] : '#',
  }))
  .filter((n) => n.label && n.href)

const logoUrlRaw = typeof data['logoUrl'] === 'string' ? data['logoUrl'] : ''

  return {
    headline: typeof data['headline'] === 'string' ? data['headline'] : '',
    showScrollIndicator:
      typeof data['showScrollIndicator'] === 'boolean' ? data['showScrollIndicator'] : true,
    ...(subheadlineStr ? { subheadline: subheadlineStr } : {}),
    ...(bgImageUrl ? { backgroundImageUrl: bgImageUrl } : {}),
    ...(heroSlides.length > 0 ? { heroSlides } : {}),
    ...(reservationButton ? { reservationButton } : {}),
    ...(phoneButton ? { phoneButton } : {}),
    ...(lineButton ? { lineButton } : {}),
    ...(hoursTable ? { hoursTable } : {}),
    ...(notes.length > 0 ? { notes } : {}),
    ...(address ? { address } : {}),
    ...(firstVisitCard ? { firstVisitCard } : {}),
    ...(navItems.length > 0 ? { navItems } : {}),
    ...(logoUrlRaw ? { logoUrl: logoUrlRaw } : {}),
  }
}