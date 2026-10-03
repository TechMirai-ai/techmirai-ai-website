import type { Access } from 'payload'

type UserRecord = Record<string, unknown> | null | undefined

function role(user: UserRecord): string | undefined {
  return user?.['role'] as string | undefined
}

/** Full access — admin users only */
export const adminOnly: Access = ({ req }) => role(req.user as UserRecord) === 'admin'

/** Any authenticated user */
export const authenticated: Access = ({ req }) => Boolean(req.user)

/** Admin or editor (any authenticated user for content ops) */
export const adminOrEditor: Access = ({ req }) => {
  const r = role(req.user as UserRecord)
  return r === 'admin' || r === 'editor'
}

/** Public — no auth required (used for form submission create) */
export const publicAccess: Access = () => true
