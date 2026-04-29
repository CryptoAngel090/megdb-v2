import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/** Exposes IndexNow key at a stable URL used in `keyLocation`. */
export function GET() {
  const key = process.env.INDEXNOW_KEY?.trim()
  if (!key) {
    return new NextResponse('Not configured', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
      },
    })
  }
  return new NextResponse(key, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  })
}
