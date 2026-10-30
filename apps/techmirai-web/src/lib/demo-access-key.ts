import { createHash, timingSafeEqual } from 'node:crypto'

const digest = (value: string): Buffer => createHash('sha256').update(value).digest()

/**
 * Checks a visitor's live-demo key against the server-only DEMO_ACCESS_KEYS list
 * (comma-separated). Keys are hashed first so the comparison is constant-time
 * whatever their length. An unset or empty list accepts nothing.
 */
export function isValidDemoKey(input: string, rawKeys: string | undefined): boolean {
  const key = input.trim()
  if (!key) return false

  const keys = (rawKeys ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)

  const candidate = digest(key)
  // Every key is compared (no early exit) so timing does not reveal which one matched.
  return keys.reduce((found, k) => timingSafeEqual(candidate, digest(k)) || found, false)
}

export type DemoKeyTier = 'access' | 'normal'

/**
 * Tells which list (if any) a visitor's key belongs to. DEMO_ACCESS_KEYS wins when
 * a key is in both. Both lists are always checked so timing does not reveal which matched.
 */
export function getDemoKeyTier(
  input: string,
  rawAccessKeys: string | undefined,
  rawNormalKeys: string | undefined,
): DemoKeyTier | null {
  const isAccess = isValidDemoKey(input, rawAccessKeys)
  const isNormal = isValidDemoKey(input, rawNormalKeys)
  if (isAccess) return 'access'
  return isNormal ? 'normal' : null
}
