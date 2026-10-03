import type { Payload } from 'payload'

/**
 * Seeds the Header global's phone button.
 *
 * The Hero block config has no phone field of its own — the phone shown in the
 * hero (and in the mobile menu) is injected at render time from this global by
 * `resolveHeaderData()`. So this is where the doc's Hero-block phone number
 * belongs. Per Jamal's decision the Tokyo/Setagaya number is used everywhere,
 * NOT the Gifu number the doc's Hero section literally shows.
 *
 * Written against the `en` locale specifically. `phoneDisplay`/`phoneHref` are
 * NOT localized, so a single write updates them for every locale — but a
 * global update revalidates the whole document, and the `navItems` already in
 * this global carry labels only in `en` (they were authored before
 * `navItems.label` became `localized: true`). Writing against `ja` therefore
 * fails validation on those required, empty ja labels. Rather than invent
 * Japanese navigation labels the content doc says nothing about, this writes
 * the locale that validates and leaves the nav gap alone — it is called out in
 * the handover notes instead.
 */
const CLINIC_PHONE_DISPLAY = '+81-3-5432-1188'
const CLINIC_PHONE_HREF = 'tel:+81354321188'

/**
 * The header global's `lineButton.href` was previously left at an unrelated
 * placeholder handle (@470vmlzv) — a second, inconsistent fake LINE URL
 * living alongside the one already established for this demo project (see
 * site.config.ts's reception.staffLineUrl and its "swap before launch"
 * comment). This reuses that same placeholder value so the whole project
 * points at one fake handle instead of two, without coupling the two
 * settings at runtime — the header's LINE button stays its own
 * independently CMS-configurable field, separate from reception's
 * site.config value.
 */
const LINE_URL = 'https://line.me/R/ti/p/~nahidarahamanrupta'

export async function seedDemoHeader(payload: Payload): Promise<void> {
  await payload.updateGlobal({
    slug: 'header',
    locale: 'en',
    data: {
      phoneButton: {
        phoneDisplay: CLINIC_PHONE_DISPLAY,
        phoneHref: CLINIC_PHONE_HREF,
        // The doc says nothing about these two localized labels, so they carry
        // the values the schema itself defaults them to rather than new copy.
        badgeLabel: 'Call Now',
        subLabel: 'Click to call us',
      },
      lineButton: {
        href: LINE_URL,
      },
    },
  })
}
