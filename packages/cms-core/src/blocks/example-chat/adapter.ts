import type { ExampleChatBlockProps, ExampleChatTurn } from './types'

export function adaptExampleChatBlock(raw: unknown): ExampleChatBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const str = (key: string): string => (typeof data[key] === 'string' ? (data[key] as string) : '')

  const rawTurns = Array.isArray(data['turns']) ? (data['turns'] as { speaker?: unknown; message?: unknown }[]) : []
  const turns: ExampleChatTurn[] = rawTurns
    .map((t) => ({
      speaker: t.speaker === 'ai' ? ('ai' as const) : ('customer' as const),
      message: typeof t.message === 'string' ? t.message : '',
    }))
    .filter((t) => t.message)

  return {
    customerLabel: str('customerLabel'),
    turns,
  }
}
