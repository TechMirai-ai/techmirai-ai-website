import { Container, Section, Heading, Text } from '@techmirai/cms-core/components/ui'

interface ComingSoonStubProps {
  locale: string
  titleEn: string
  titleJa: string
}

// Pack-2/E1 step 5: temporary placeholder for header/nav links that don't
// have real content yet. Replaced page by page as later packs build them.
export function ComingSoonStub({ locale, titleEn, titleJa }: ComingSoonStubProps) {
  const title = locale === 'ja' ? titleJa : titleEn
  const body = locale === 'ja' ? 'このページは近日公開予定です。' : 'This page is coming soon.'

  return (
    <Section className="py-24 md:py-32">
      <Container className="text-center space-y-4">
        <Heading level={1} className="text-2xl md:text-3xl">
          {title}
        </Heading>
        <Text className="text-text-secondary">{body}</Text>
      </Container>
    </Section>
  )
}
