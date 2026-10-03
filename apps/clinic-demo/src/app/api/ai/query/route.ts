import { type NextRequest, NextResponse } from 'next/server'
import siteConfig from '../../../../../site.config'

export async function POST(request: NextRequest) {
  if (!siteConfig.features.aiAgent) {
    return NextResponse.json(
      { success: false, error: 'AI agent not enabled', code: 'AI_AGENT_DISABLED' },
      { status: 404 },
    )
  }

  const baseUrl = process.env['AI_AGENT_BASE_URL']
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, error: 'AI agent not configured', code: 'AI_AGENT_MISSING' },
      { status: 503 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const upstream = await fetch(`${baseUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env['AI_AGENT_API_KEY']
          ? { Authorization: `Bearer ${process.env['AI_AGENT_API_KEY']}` }
          : {}),
      },
      body: JSON.stringify(body),
    })

    const data: unknown = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch {
    return NextResponse.json(
      { success: false, error: 'AI agent unreachable' },
      { status: 502 },
    )
  }
}
