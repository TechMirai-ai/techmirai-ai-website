import { revalidateTag as nextRevalidateTag } from 'next/cache'

export function safeRevalidateTag(tag: string): void {
  try {
    nextRevalidateTag(tag)
  } catch {
    // no-op outside Next.js runtime (e.g., seed scripts)
  }
}
