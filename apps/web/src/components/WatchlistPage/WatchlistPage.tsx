'use client'

import type { MediaType } from '@repo/types'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  clearLocalWatchlist,
  getLocalWatchlistItems,
  type LocalWatchlistItem,
  moveLocalWatchlistItem,
  removeLocalWatchlistItems,
  toggleLocalWatchlistPinned,
} from '@/lib/localWatchlist'
import { getImageUrl } from '@/lib/tmdb'
import styles from './WatchlistPage.module.css'

interface WatchlistMovie {
  mediaId: number
  mediaType: MediaType
  title: string
  releaseDate: string | null
  posterPath: string | null
  voteAverage: number
  runtimeMinutes: number | null
  genres: string[]
  addedAt: string
  pinned: boolean
  manualOrder: number | null
  href: string
}

const PREFS_KEY = 'megdb.watchlist.ui-prefs.v1'

function isWatchlistMovie(value: unknown): value is WatchlistMovie {
  if (typeof value !== 'object' || value == null) return false
  const v = value as Record<string, unknown>
  const mediaType = v.mediaType
  return (
    typeof v.mediaId === 'number' &&
    Number.isInteger(v.mediaId) &&
    v.mediaId > 0 &&
    (mediaType === 'movie' ||
      mediaType === 'series' ||
      mediaType === 'cartoon' ||
      mediaType === 'tvshow') &&
    typeof v.title === 'string' &&
    (typeof v.releaseDate === 'string' || v.releaseDate == null) &&
    (typeof v.posterPath === 'string' || v.posterPath == null) &&
    typeof v.voteAverage === 'number' &&
    (typeof v.runtimeMinutes === 'number' || v.runtimeMinutes == null) &&
    Array.isArray(v.genres) &&
    typeof v.addedAt === 'string' &&
    typeof v.pinned === 'boolean' &&
    (typeof v.manualOrder === 'number' || v.manualOrder === null) &&
    typeof v.href === 'string'
  )
}

function formatRuntime(minutes: number | null): string {
  if (minutes == null || minutes <= 0) return 'TBA'
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function extractYear(releaseDate: string | null): string {
  if (!releaseDate) return 'TBA'
  return releaseDate.slice(0, 4) || 'TBA'
}

type WatchlistFilter = 'all' | 'movie' | 'series' | 'cartoon' | 'tvshow'
type WatchlistSort = 'added-desc' | 'rating-desc' | 'year-desc' | 'title-asc'

const FILTERS: Array<{ id: WatchlistFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'movie', label: 'Movies' },
  { id: 'series', label: 'Series' },
  { id: 'cartoon', label: 'Cartoons' },
  { id: 'tvshow', label: 'TV Shows' },
]

function mediaLabel(mediaType: MediaType): string {
  if (mediaType === 'movie') return 'Movie'
  if (mediaType === 'series') return 'Series'
  if (mediaType === 'cartoon') return 'Cartoon'
  return 'TV Show'
}

export function WatchlistPage() {
  const [sourceItems, setSourceItems] = useState<LocalWatchlistItem[]>([])
  const [items, setItems] = useState<WatchlistMovie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<WatchlistFilter>('all')
  const [sort, setSort] = useState<WatchlistSort>('added-desc')
  const [query, setQuery] = useState('')
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(PREFS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as unknown
      if (typeof parsed !== 'object' || parsed == null) return
      const p = parsed as Record<string, unknown>
      if (
        p.filter === 'all' ||
        p.filter === 'movie' ||
        p.filter === 'series' ||
        p.filter === 'cartoon' ||
        p.filter === 'tvshow'
      ) {
        setFilter(p.filter)
      }
      if (
        p.sort === 'added-desc' ||
        p.sort === 'rating-desc' ||
        p.sort === 'year-desc' ||
        p.sort === 'title-asc'
      ) {
        setSort(p.sort)
      }
      if (typeof p.query === 'string') {
        setQuery(p.query)
      }
    } catch {
      // no-op
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(PREFS_KEY, JSON.stringify({ filter, sort, query }))
  }, [filter, sort, query])

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    const localItems = getLocalWatchlistItems()
    setSourceItems(localItems)
    if (localItems.length === 0) {
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        const res = await fetch('/api/watchlist-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: localItems }),
        })
        if (!res.ok) throw new Error('Failed to load watchlist movies')
        const raw = (await res.json()) as unknown
        if (
          typeof raw !== 'object' ||
          raw == null ||
          !Array.isArray((raw as { items?: unknown }).items)
        ) {
          throw new Error('Invalid watchlist payload')
        }
        const rows = (raw as { items: unknown[] }).items.filter(isWatchlistMovie)
        setItems(rows)
        setError(null)
      } catch {
        setError('Failed to load watchlist. Please refresh.')
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const cards = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = items.filter((item) => {
      if (filter !== 'all' && item.mediaType !== filter) return false
      if (!q) return true
      return item.title.toLowerCase().includes(q) || item.genres.join(' ').toLowerCase().includes(q)
    })

    return filtered.slice().sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      const aOrder = a.manualOrder ?? Number.MAX_SAFE_INTEGER
      const bOrder = b.manualOrder ?? Number.MAX_SAFE_INTEGER
      if (aOrder !== bOrder) return aOrder - bOrder
      if (sort === 'rating-desc') return b.voteAverage - a.voteAverage
      if (sort === 'year-desc')
        return extractYear(b.releaseDate).localeCompare(extractYear(a.releaseDate))
      if (sort === 'title-asc') return a.title.localeCompare(b.title)
      return b.addedAt.localeCompare(a.addedAt)
    })
  }, [items, filter, query, sort])

  const summary = useMemo(() => {
    const counts = { movie: 0, series: 0, cartoon: 0, tvshow: 0 }
    let ratingSum = 0
    let ratingCount = 0
    let totalRuntime = 0
    for (const item of items) {
      counts[item.mediaType] += 1
      if (item.voteAverage > 0) {
        ratingSum += item.voteAverage
        ratingCount += 1
      }
      if (item.runtimeMinutes != null && item.runtimeMinutes > 0) {
        totalRuntime += item.runtimeMinutes
      }
    }
    return {
      counts,
      total: items.length,
      avgRating: ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : '—',
      runtime: formatRuntime(totalRuntime > 0 ? totalRuntime : null),
    }
  }, [items])

  const removeSingle = (item: WatchlistMovie) => {
    removeLocalWatchlistItems([{ mediaType: item.mediaType, mediaId: item.mediaId }])
    setSourceItems((prev) =>
      prev.filter((row) => !(row.mediaType === item.mediaType && row.mediaId === item.mediaId))
    )
    setItems((prev) =>
      prev.filter((row) => !(row.mediaType === item.mediaType && row.mediaId === item.mediaId))
    )
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      next.delete(`${item.mediaType}:${item.mediaId}`)
      return next
    })
  }

  const togglePin = (item: WatchlistMovie) => {
    const nextPinned = toggleLocalWatchlistPinned(item.mediaType, item.mediaId)
    setItems((prev) =>
      prev.map((row) =>
        row.mediaId === item.mediaId && row.mediaType === item.mediaType
          ? { ...row, pinned: nextPinned }
          : row
      )
    )
    setSourceItems((prev) =>
      prev.map((row) =>
        row.mediaId === item.mediaId && row.mediaType === item.mediaType
          ? { ...row, pinned: nextPinned }
          : row
      )
    )
  }

  const moveItem = (item: WatchlistMovie, direction: 'up' | 'down') => {
    moveLocalWatchlistItem(item.mediaType, item.mediaId, direction)
    const next = getLocalWatchlistItems()
    setSourceItems(next)
    setItems((prev) => {
      const map = new Map(next.map((row) => [`${row.mediaType}:${row.mediaId}`, row]))
      return prev.map((row) => {
        const k = `${row.mediaType}:${row.mediaId}`
        const m = map.get(k)
        if (!m) return row
        return {
          ...row,
          manualOrder: m.manualOrder,
          pinned: m.pinned,
          title: m.title || row.title,
          releaseDate: m.releaseDate ?? row.releaseDate,
        }
      })
    })
  }

  const removeSelected = () => {
    if (selectedKeys.size === 0) return
    if (!window.confirm('Remove selected items from watchlist?')) return
    const keys = [...selectedKeys].map((k) => {
      const [mediaType, mediaIdRaw] = k.split(':')
      return { mediaType: mediaType as MediaType, mediaId: Number(mediaIdRaw) }
    })
    removeLocalWatchlistItems(keys)
    const blocked = new Set(selectedKeys)
    setSourceItems((prev) => prev.filter((row) => !blocked.has(`${row.mediaType}:${row.mediaId}`)))
    setItems((prev) => prev.filter((row) => !blocked.has(`${row.mediaType}:${row.mediaId}`)))
    setSelectedKeys(new Set())
  }

  const clearFiltered = () => {
    if (cards.length === 0) return
    if (!window.confirm('Clear all currently filtered items?')) return
    const keys = cards.map((item) => ({ mediaType: item.mediaType, mediaId: item.mediaId }))
    removeLocalWatchlistItems(keys)
    const blocked = new Set(cards.map((item) => `${item.mediaType}:${item.mediaId}`))
    setSourceItems((prev) => prev.filter((row) => !blocked.has(`${row.mediaType}:${row.mediaId}`)))
    setItems((prev) => prev.filter((row) => !blocked.has(`${row.mediaType}:${row.mediaId}`)))
    setSelectedKeys(new Set())
  }

  const clearAll = () => {
    if (!window.confirm('Clear all watchlist items?')) return
    clearLocalWatchlist()
    setSourceItems([])
    setItems([])
    setSelectedKeys(new Set())
  }

  const toggleSelected = (item: WatchlistMovie) => {
    const key = `${item.mediaType}:${item.mediaId}`
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <div className={styles.page}>
      <section className={`container ${styles.wrap}`} aria-labelledby="watchlist-heading">
        <div className={styles.head}>
          <h1 id="watchlist-heading" className={styles.title}>
            My Watchlist
          </h1>
          <p className={styles.sub}>
            All saved media in one place: movies, series, cartoons and TV shows.
          </p>
        </div>

        <div className={styles.statsGrid}>
          <article className={styles.statCard}>
            <span>Total</span>
            <strong>{summary.total}</strong>
          </article>
          <article className={styles.statCard}>
            <span>Avg rating</span>
            <strong>{summary.avgRating}</strong>
          </article>
          <article className={styles.statCard}>
            <span>Runtime</span>
            <strong>{summary.runtime}</strong>
          </article>
          <article className={styles.statCard}>
            <span>Movies</span>
            <strong>{summary.counts.movie}</strong>
          </article>
          <article className={styles.statCard}>
            <span>Series</span>
            <strong>{summary.counts.series}</strong>
          </article>
          <article className={styles.statCard}>
            <span>Cartoons</span>
            <strong>{summary.counts.cartoon}</strong>
          </article>
          <article className={styles.statCard}>
            <span>TV Shows</span>
            <strong>{summary.counts.tvshow}</strong>
          </article>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.filters}>
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`${styles.filterBtn} ${filter === f.id ? styles.filterBtnActive : ''}`}
                aria-pressed={filter === f.id}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className={styles.controls}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={styles.search}
              placeholder="Search title or genre..."
              aria-label="Search watchlist"
            />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as WatchlistSort)}
              className={styles.select}
              aria-label="Sort watchlist"
            >
              <option value="added-desc">Newest added</option>
              <option value="rating-desc">Highest rating</option>
              <option value="year-desc">Newest year</option>
              <option value="title-asc">Title A-Z</option>
            </select>
          </div>
        </div>

        <div className={styles.bulkActions}>
          <button
            type="button"
            className={styles.bulkBtn}
            onClick={removeSelected}
            disabled={selectedKeys.size === 0}
          >
            Remove selected ({selectedKeys.size})
          </button>
          <button
            type="button"
            className={styles.bulkBtn}
            onClick={clearFiltered}
            disabled={cards.length === 0}
          >
            Clear filtered ({cards.length})
          </button>
          <button
            type="button"
            className={styles.bulkDanger}
            onClick={clearAll}
            disabled={sourceItems.length === 0}
          >
            Clear all
          </button>
        </div>

        {loading ? <p className={styles.state}>Loading watchlist...</p> : null}
        {!loading && error ? <p className={styles.state}>{error}</p> : null}

        {!loading && cards.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.state}>Your watchlist is empty.</p>
            <Link href="/movies" className={styles.browseLink}>
              Browse movies
            </Link>
          </div>
        ) : null}

        {cards.length > 0 ? (
          <ul className={styles.grid}>
            {cards.map((item) => {
              const key = `${item.mediaType}:${item.mediaId}`
              const poster = getImageUrl(item.posterPath, 'w500')
              const isSelected = selectedKeys.has(key)
              return (
                <li key={key} className={styles.card}>
                  <Link href={item.href} className={styles.posterLink}>
                    {poster ? (
                      <Image
                        src={poster}
                        alt={`Poster for ${item.title}`}
                        width={500}
                        height={750}
                        className={styles.poster}
                        sizes="(max-width: 767px) 45vw, (max-width: 1023px) 30vw, 220px"
                      />
                    ) : (
                      <div className={styles.posterFallback} aria-hidden>
                        🎬
                      </div>
                    )}
                  </Link>
                  <div className={styles.meta}>
                    <Link href={item.href} className={styles.movieTitle}>
                      {item.title}
                    </Link>
                    <p className={styles.typeBadge}>{mediaLabel(item.mediaType)}</p>
                    <p className={styles.movieInfo}>
                      {extractYear(item.releaseDate)} •{' '}
                      {item.voteAverage > 0 ? item.voteAverage.toFixed(1) : 'NR'} •{' '}
                      {formatRuntime(item.runtimeMinutes)}
                    </p>
                    {item.genres.length > 0 ? (
                      <p className={styles.genres}>{item.genres.join(' • ')}</p>
                    ) : null}
                    <label className={styles.selectRow}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelected(item)}
                      />
                      Select
                    </label>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() => togglePin(item)}
                        aria-label={`${item.pinned ? 'Unpin' : 'Pin'} ${item.title}`}
                      >
                        {item.pinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() => moveItem(item, 'up')}
                        aria-label={`Move ${item.title} up`}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() => moveItem(item, 'down')}
                        aria-label={`Move ${item.title} down`}
                      >
                        Down
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSingle(item)}
                      className={styles.removeBtn}
                      aria-label={`Remove ${item.title} from watchlist`}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : null}
      </section>
    </div>
  )
}
