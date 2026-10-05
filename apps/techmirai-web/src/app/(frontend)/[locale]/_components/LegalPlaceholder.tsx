import { Container, Section, Heading, Text } from '@techmirai/cms-core/components/ui'

interface LegalPlaceholderProps {
  locale: string
  titleEn: string
  titleJa: string
}

// Pack-2/E2, CLAUDE.md rule 7: legal pages get the Spec's heading and a
// clearly marked placeholder body — never invented legal/tax/medical text.
// See docs/PLACEHOLDER-REGISTER.md.
export function LegalPlaceholder({ locale, titleEn, titleJa }: LegalPlaceholderProps) {
  const title = locale === 'ja' ? titleJa : titleEn
  const body =
    locale === 'ja'
      ? '[PLACEHOLDER：正式な文面は追って追加されます。]'
      : '[PLACEHOLDER: final legal text to be added.]'

  return (
    <Section className="py-24 md:py-32">
      <Container className="max-w-2xl space-y-4">
        <Heading level={1} className="text-2xl md:text-3xl">
          {title}
        </Heading>
        <Text className="text-text-secondary italic">{body}</Text>
      </Container>
    </Section>
  )
}
