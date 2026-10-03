import type { ServerFunctionClient } from 'payload'
import type { ReactNode } from 'react'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import config from '@payload-config'
import { importMap } from './importMap'

import '@payloadcms/next/css'

type Args = {
  readonly children: ReactNode
}

export { metadata } from '@payloadcms/next/layouts'

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

export default function Layout({ children }: Args) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}
