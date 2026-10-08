export interface ExampleChatTurn {
  speaker: 'customer' | 'ai'
  message: string
}

export interface ExampleChatBlockProps {
  customerLabel: string
  turns: ExampleChatTurn[]
}
