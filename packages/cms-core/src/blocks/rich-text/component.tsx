import type { RichTextBlockProps } from './types'
import { RichText } from '@payloadcms/richtext-lexical/react'

export function RichTextBlock({ content, maxWidth = 'prose' }: RichTextBlockProps) {
  if (!content) return null

  return (
    <section className="py-16 bg-gray-50">
      <div className={`mx-auto px-6 ${maxWidth === 'wide' ? 'max-w-5xl' : 'max-w-4xl'}`}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 md:p-12">
          <div className="prose prose-lg max-w-none 
                          prose-headings:font-semibold prose-headings:text-gray-900
                          prose-p:text-gray-700 prose-p:leading-relaxed
                          prose-li:text-gray-700 prose-li:my-2.5
                          prose-strong:font-semibold prose-strong:text-gray-900
                          prose-ul:pl-6 prose-ol:pl-6">
            
            <RichText data={content} />
          </div>
        </div>
      </div>
    </section>
  )
}