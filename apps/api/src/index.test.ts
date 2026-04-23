import { describe, expect, it } from 'vitest'
import server from './index'

describe('api health endpoint', () => {
  it('returns health payload', async () => {
    const response = await server.fetch(new Request('http://localhost/health'))
    const body = (await response.json()) as { status: string; ts: number }

    expect(response.status).toBe(200)
    expect(body.status).toBe('ok')
    expect(typeof body.ts).toBe('number')
  })
})
