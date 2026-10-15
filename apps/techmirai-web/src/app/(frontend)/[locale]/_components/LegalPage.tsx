import { Container, Section, Heading, Text } from '@techmirai/cms-core/components/ui'
import { legalPageContent, type LegalPageKey } from '@/lib/legal-headings'

interface LegalPageProps {
  locale: string
  page: LegalPageKey
}

// Pack-4/M1, CLAUDE.md rule 7: a legal page is its Spec §4 title, the Spec §18
// headings, and under each one the approved placeholder (plus a confirmed
// config fact where one exists). No legal wording — see lib/legal-headings.ts
// and docs/PLACEHOLDER-REGISTER.md (E2-01, M1-*).
export function LegalPage({ locale, page }: LegalPageProps) {
  const { title, sections } = legalPageContent(page, locale)

  return (
    <Section className="py-24 md:py-32">
      <Container className="max-w-2xl space-y-10">
        <Heading level={1} className="text-2xl md:text-3xl">
          {title}
        </Heading>
        {sections.map((section) => (
          <section key={section.heading} className="space-y-2">
            <Heading level={2} className="text-lg md:text-xl">
              {section.heading}
            </Heading>
            {section.fact && <Text>{section.fact}</Text>}
            <Text className="text-text-secondary italic">{section.placeholder}</Text>
          </section>
        ))}
      </Container>
    </Section>
  )
}
