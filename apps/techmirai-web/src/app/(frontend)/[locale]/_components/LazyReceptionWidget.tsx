'use client'

import dynamic from 'next/dynamic'
import type { ReceptionWidgetProps } from '@techmirai/cms-core/reception/ui'

// The chat launcher is not needed for first paint; loading it as a separate chunk
// keeps the reception engine and booking flow out of every page's initial JS.
const ReceptionWidget = dynamic(
  () => import('@techmirai/cms-core/reception/ui').then((mod) => mod.ReceptionWidget),
  { ssr: false },
)

export function LazyReceptionWidget(props: ReceptionWidgetProps) {
  return <ReceptionWidget {...props} />
}
