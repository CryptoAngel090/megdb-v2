'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { SearchBar } from '@/components/SearchBar/SearchBar'
import { getImageUrl } from '@/lib/tmdb'
import styles from './SearchPage.module.css'

type ResultType = 'movie' | 'series' | 'person'

interface SearchHit {
  id: number
  type: ResultType
  title: string
  subtitle?: string
  posterPath?: string | null
  year?: string
}

interface SearchApiResponse {
  results?: SearchHit[]
  error?: string
  retryAfter?: number
}

function isSearchApiResponse(value: unknown): value is SearchApiResponse {
  return Boolean(value && typeof value === 'object')
}

export function SearchPageClient({ initialQuery }: { initialQuery: string }) {
  const [results, setResults] = useState<SearchHit[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'done'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (trimmed.length < 2) {
      setResults([])
      setStatus('idle')
      setErrorMessage(null)
      return
    }
    setStatus('loading')
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
      const raw: unknown = await res.json()
      if (!isSearchApiResponse(raw)) {
        throw new Error('Invalid response')
      }
      if (!res.ok) {
        if (res.status === 429) {
          const sec = raw.retryAfter ?? 60
          throw new Error(`Too many requests. Try again in about ${sec} seconds.`)
        }
        throw new Error(raw.error ?? 'Search failed')
      }
      setResults(raw.results ?? [])
      setStatus('done')
    } catch (e) {
      setResults([])
      setStatus('error')
      setErrorMessage(e instanceof Error ? e.message : 'Search failed')
    }
  }, [])

  useEffect(() => {
    void runSearch(initialQuery)
  }, [initialQuery, runSearch])

  const q = initialQuery.trim()
  const showGrid = q.length >= 2 && status !== 'idle' && status !== 'loading' && !errorMessage

  return (
    <div className={styles.shell}>
      <h1 className={styles.h1}>Search</h1>
      <p className={styles.intro}>
        Find movies, series, and people from the TMDB catalogue. Type at least two characters.
        Results open the corresponding title or person page. Search uses MegDB’s rate-limited API —
        if you hit the limit, wait briefly and retry.
      </p>
      <div className={styles.searchRow}>
        <SearchBar autoFocus={q.length === 0} />
      </div>

      {q.length > 0 && q.length < 2 && (
        <p className={styles.meta}>Enter at least 2 characters to search.</p>
      )}

      {q.length >= 2 && (
        <p className={styles.meta}>
          {status === 'loading' && `Searching for “${q}”…`}
          {status === 'done' &&
            `${results.length} result${results.length === 1 ? '' : 's'} for “${q}”`}
          {status === 'error' && 'Search could not be completed.'}
        </p>
      )}

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      {showGrid && results.length === 0 && (
        <div className={styles.empty}>
          No matches for your query. Try different spelling or a shorter term.
        </div>
      )}

      {showGrid && results.length > 0 && (
        <div className={styles.grid}>
          {results.map((item) => (
            <Link
              key={`${item.type}-${item.id}`}
              href={`/${item.type}/${item.id}`}
              className={styles.card}
            >
              <div className={styles.posterWrap}>
                <span className={styles.typeBadge}>{item.type}</span>
                {item.posterPath ? (
                  <Image
                    src={getImageUrl(item.posterPath, 'w185')}
                    alt=""
                    fill
                    sizes="185px"
                    className={styles.coverImg}
                  />
                ) : (
                  <div className={styles.posterFallback}>No image</div>
                )}
              </div>
              <p className={styles.title}>{item.title}</p>
              <p className={styles.sub}>
                {[item.year, item.subtitle].filter(Boolean).join(' · ') || '\u00a0'}
              </p>
            </Link>
          ))}
        </div>
      )}

      <p className={styles.rateHint}>
        This search uses The Movie Database (TMDB). By using search you agree to respect TMDB’s{' '}
        <a
          href="https://www.themoviedb.org/documentation/api/terms-of-use"
          rel="noopener noreferrer"
        >
          API terms
        </a>
        . MegDB applies per-IP rate limits to keep the service fair.
      </p>
    </div>
  )
}
