import { type NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret')

  if (secret !== process.env['PAYLOAD_SECRET']) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)

  if (body === null) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }

  const { path, tag } = body as { path?: string; tag?: string }

  if (path) revalidatePath(path)
  if (tag) revalidateTag(tag)

  return NextResponse.json({ success: true, data: { path, tag } })
}
