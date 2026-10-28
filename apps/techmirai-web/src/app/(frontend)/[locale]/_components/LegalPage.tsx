import { legalPageContent, type LegalPageKey } from '@/lib/legal-headings'

interface LegalPageProps {
  locale: string
  page: LegalPageKey
}

// Pack-4/M1, CLAUDE.md rule 7: a legal page is its Spec §4 title, the Spec §18
// headings, and under each one the approved placeholder (plus a confirmed
// config fact where one exists). No legal wording — see lib/legal-headings.ts
// and docs/PLACEHOLDER-REGISTER.md (E2-01, M1-*).
// Voice-pivot restyle: same gradient header and rounded cards as the home page.
export function LegalPage({ locale, page }: LegalPageProps) {
  const { title, sections } = legalPageContent(page, locale)

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-white via-bg-tertiary/60 to-white px-4 pb-12 pt-10 sm:px-6 md:pb-16 md:pt-14 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-6 h-80 w-80 rounded-full bg-brand-primary-light/60 blur-3xl" />
      <div className="relative mx-auto max-w-3xl">
        <h1 className="text-[28px] font-bold leading-[1.35] tracking-tight text-text-primary sm:text-4xl">{title}</h1>
        <div className="mt-8 space-y-4">
          {sections.map((section) => (
            <section key={section.heading} className="rounded-2xl border border-border-default bg-white p-6 shadow-sm">
              <h2 className="text-[16px] font-bold text-text-primary">{section.heading}</h2>
              {section.fact && <p className="mt-2 text-[14px] leading-[1.8] text-text-primary">{section.fact}</p>}
              {/* PLACEHOLDER-OFF: legal placeholder body hidden for now; restore when the legal text is written.
              <p className="mt-2 text-[13px] italic leading-[1.8] text-text-secondary">{section.placeholder}</p>
              */}
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}
