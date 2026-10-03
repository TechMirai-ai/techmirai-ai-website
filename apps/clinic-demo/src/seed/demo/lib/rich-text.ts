// Lexical richText stub — matches the shape used across the real seed files
// (see blog.ts's richTextStub / about-section.seed.ts's richText helper).

export function richText(...paragraphs: string[]) {
  return {
    root: {
      type: 'root' as const,
      children: paragraphs.map((text) => ({
        type: 'paragraph' as const,
        children: [
          {
            type: 'text' as const,
            text,
            version: 1,
            detail: 0,
            format: 0,
            mode: 'normal' as const,
            style: '',
          },
        ],
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1,
      })),
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}
