import type { JsonLd as JsonLdData } from './json-ld'

// Pack-4/L2: renders one JSON-LD block. `<` is escaped so no value (CMS text
// included) can close the <script> element early.
export function JsonLd({ data }: { data: JsonLdData }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
