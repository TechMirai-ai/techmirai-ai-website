import 'server-only'
import { cache } from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const getCachedPayload = cache(async () =>
  getPayload({ config: await configPromise })
)
