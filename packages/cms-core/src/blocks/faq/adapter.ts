import type { FAQBlockProps, FAQItem } from './types'

// 🛠️ Type definitions for what Payload outputs under the hood
interface PayloadRawFAQDoc {
  id: string
  question: string
  answer: any // Payload RichText structure or raw string
  _status?: string
}

interface PayloadRawFAQBlock {
  blockType: 'faq'
  id?: string
  sectionHeading?: string
  variant?: 'accordion' | 'grid'
  items?: (string | PayloadRawFAQDoc)[]
}

/**
 * Safely parses the rich text block payload structure from Payload CMS fields 
 * into a standard clean text string for the front-end layout components.
 */
function extractAnswerText(answerField: any): string {
  if (!answerField) return ''
  if (typeof answerField === 'string') return answerField

  // Lexical rich text parser fallback
  const nodes = answerField?.root?.children || answerField?.children || (Array.isArray(answerField) ? answerField : null)
  if (Array.isArray(nodes)) {
    return nodes
      .map((node: any) => {
        if (node.children) {
          return node.children.map((c: any) => c.text || '').join('')
        }
        return node.text || ''
      })
      .join('\n')
  }

  return ''
}

export function adaptFAQBlock(raw: unknown): FAQBlockProps {
  if (!raw || typeof raw !== 'object') {
    return { sectionHeading: '', items: [], variant: 'accordion' }
  }

  const block = raw as PayloadRawFAQBlock

 // 🛠️ FIX: Explicitly type the map argument to align perfectly with FAQItem
const formattedItems: FAQItem[] = (block.items || [])
  .map((item): FAQItem | null => {
    // Guard against cases where relation is not populated yet (just an ID string)
    if (!item || typeof item === 'string') return null

    return {
      id: item.id,
      question: item.question || '',
      answer: extractAnswerText(item.answer),
    }
  })
  .filter((item): item is FAQItem => item !== null)
  
  return {
    sectionHeading: block.sectionHeading || '',
    variant: block.variant || 'accordion',
    items: formattedItems,
  }
}