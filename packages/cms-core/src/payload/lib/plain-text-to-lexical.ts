/**
 * Builds a minimal Lexical SerializedEditorState from plain-text paragraphs.
 * Used to seed richText field defaultValues without hand-writing the Lexical
 * node shape at every call site.
 */
export function plainTextToLexical(...paragraphs: string[]) {
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
