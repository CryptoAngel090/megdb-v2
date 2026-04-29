import { describe, expect, it } from 'vitest'
import { normalizeAndDedupeUrls, runIndexNowPipeline } from './indexnowPipeline'

describe('normalizeAndDedupeUrls', () => {
  it('removes invalid, blank and duplicate urls', () => {
    const input = [
      'https://megdb.com/movies',
      ' https://megdb.com/movies ',
      'not-a-url',
      '',
      'https://megdb.com/series#fragment',
    ]
    const out = normalizeAndDedupeUrls(input)
    expect(out).toEqual(['https://megdb.com/movies', 'https://megdb.com/series'])
  })
})

describe('runIndexNowPipeline', () => {
  it('splits into batches and retries failed batch', async () => {
    const calls: string[][] = []
    let firstBatchAttempts = 0

    const result = await runIndexNowPipeline({
      urls: [
        'https://megdb.com/a',
        'https://megdb.com/b',
        'https://megdb.com/c',
        'https://megdb.com/d',
      ],
      batchSize: 2,
      maxAttempts: 3,
      initialBackoffMs: 1,
      sleep: (ms) => {
        void ms
        return Promise.resolve()
      },
      submitBatch: async (batch) => {
        await Promise.resolve()
        calls.push(batch)
        if (batch[0]?.endsWith('/a')) {
          firstBatchAttempts += 1
          if (firstBatchAttempts === 1) throw new Error('temporary failure')
        }
      },
    })

    expect(calls.length).toBe(3)
    expect(result.uniqueUrls).toBe(4)
    expect(result.submittedUrls).toBe(4)
    expect(result.failedUrls).toBe(0)
    expect(result.batches).toHaveLength(2)
    expect(result.batches[0]).toMatchObject({ ok: true, attempts: 2, size: 2 })
    expect(result.batches[1]).toMatchObject({ ok: true, attempts: 1, size: 2 })
  })

  it('tracks failed urls when attempts exhausted', async () => {
    const result = await runIndexNowPipeline({
      urls: ['https://megdb.com/a', 'https://megdb.com/b'],
      batchSize: 1,
      maxAttempts: 2,
      initialBackoffMs: 1,
      sleep: (ms) => {
        void ms
        return Promise.resolve()
      },
      submitBatch: async (batch) => {
        await Promise.resolve()
        if (batch[0]?.endsWith('/b')) throw new Error('hard failure')
      },
    })

    expect(result.submittedUrls).toBe(1)
    expect(result.failedUrls).toBe(1)
    expect(result.batches[1]).toMatchObject({
      ok: false,
      attempts: 2,
      size: 1,
      error: 'hard failure',
    })
  })
})
