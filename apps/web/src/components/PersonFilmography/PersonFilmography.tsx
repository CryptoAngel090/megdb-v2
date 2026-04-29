// client: uses interactive filters/sorting/load-more controls
'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { PersonCreditRowRaw } from '@/lib/tmdb'
import { personCreditDetailPath } from '@/lib/personCredits'
import { buildEntitySearchHref } from '@/lib/entitySearch'
import styles from './PersonFilmography.module.css'

interface FranchiseCluster {
  key: string
  label: string
  count: number
  hasSequelSignal: boolean
  variants: Set<string>
}

function toFranchiseSeed(title: string): string | null {
  const normalized = title
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[()]/g, '')
    .replace(/\b(part|chapter|episode|vol(?:ume)?|season)\b.*$/i, '')
    .trim()
  if (!normalized) return null
  const colonIdx = normalized.indexOf(':')
  const base = (colonIdx > 0 ? normalized.slice(0, colonIdx) : normalized)
    .replace(/\s+(ii|iii|iv|v|vi|vii|viii|ix|x|\d+)$/i, '')
    .trim()
  if (base.length < 3) return null
  return base
}

function hasSequelSignal(title: string): boolean {
  return (
    /:\s*\S/.test(title) ||
    /\b(part|chapter|episode|vol(?:ume)?|season)\b/i.test(title) ||
    /\s(ii|iii|iv|v|vi|vii|viii|ix|x|\d+)\b/i.test(title)
  )
}

function buildFranchiseClusters(credits: PersonCreditRowRaw[]): FranchiseCluster[] {
  const clusters = new Map<string, FranchiseCluster>()
  for (const row of credits) {
    const seed = toFranchiseSeed(row.title)
    if (!seed) continue
    const key = seed.toLowerCase()
    const current = clusters.get(key)
    if (current) {
      current.count += 1
      current.variants.add(row.title.trim())
      current.hasSequelSignal = current.hasSequelSignal || hasSequelSignal(row.title)
      continue
    }
    clusters.set(key, {
      key,
      label: seed,
      count: 1,
      hasSequelSignal: hasSequelSignal(row.title),
      variants: new Set([row.title.trim()]),
    })
  }
  return [...clusters.values()]
    .filter((item) => item.count >= 2 && (item.hasSequelSignal || item.variants.size >= 3))
    .filter((item) => buildEntitySearchHref(item.label) != null)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
}

export function PersonFilmography({ credits }: { credits: PersonCreditRowRaw[] }) {
  if (credits.length === 0) return null
  const franchises = buildFranchiseClusters(credits)
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest')
  const [visibleCount, setVisibleCount] = useState(20)

  const rows = useMemo(() => {
    const filtered = credits.filter((row) => filter === 'all' || row.kind === filter)
    return filtered.slice().sort((a, b) => {
      if (sortBy === 'popular') return b.popularity - a.popularity
      const ay = a.releaseDate?.slice(0, 4) ?? '0000'
      const by = b.releaseDate?.slice(0, 4) ?? '0000'
      return sortBy === 'newest' ? by.localeCompare(ay) : ay.localeCompare(by)
    })
  }, [credits, filter, sortBy])
  const visibleRows = rows.slice(0, visibleCount)
  const canLoadMore = visibleCount < rows.length

  return (
    <section className={styles.section} aria-labelledby="filmography-heading">
      <h2 id="filmography-heading" className={styles.h2}>
        Known for & credits
      </h2>
      <div className={styles.controls} aria-label="Filmography controls">
        <div className={styles.controlGroup}>
          <button
            type="button"
            aria-pressed={filter === 'all'}
            onClick={() => {
              setFilter('all')
              setVisibleCount(20)
            }}
            className={`${styles.controlBtn} ${filter === 'all' ? styles.controlBtnActive : ''}`}
          >
            All
          </button>
          <button
            type="button"
            aria-pressed={filter === 'movie'}
            onClick={() => {
              setFilter('movie')
              setVisibleCount(20)
            }}
            className={`${styles.controlBtn} ${filter === 'movie' ? styles.controlBtnActive : ''}`}
          >
            Movies
          </button>
          <button
            type="button"
            aria-pressed={filter === 'tv'}
            onClick={() => {
              setFilter('tv')
              setVisibleCount(20)
            }}
            className={`${styles.controlBtn} ${filter === 'tv' ? styles.controlBtnActive : ''}`}
          >
            TV
          </button>
        </div>
        <div className={styles.controlGroup}>
          <button
            type="button"
            aria-pressed={sortBy === 'newest'}
            onClick={() => setSortBy('newest')}
            className={`${styles.controlBtn} ${sortBy === 'newest' ? styles.controlBtnActive : ''}`}
          >
            Newest
          </button>
          <button
            type="button"
            aria-pressed={sortBy === 'oldest'}
            onClick={() => setSortBy('oldest')}
            className={`${styles.controlBtn} ${sortBy === 'oldest' ? styles.controlBtnActive : ''}`}
          >
            Oldest
          </button>
          <button
            type="button"
            aria-pressed={sortBy === 'popular'}
            onClick={() => setSortBy('popular')}
            className={`${styles.controlBtn} ${sortBy === 'popular' ? styles.controlBtnActive : ''}`}
          >
            Popular
          </button>
        </div>
      </div>
      {franchises.length > 0 && (
        <div className={styles.franchiseBlock} aria-label="Related franchises">
          <h3 className={styles.h3}>Franchises and recurring universes</h3>
          <div className={styles.chips}>
            {franchises.map((item) => {
              const href = buildEntitySearchHref(item.label)
              if (!href) return null
              return (
                <Link key={item.key} href={href} className={styles.chipLink}>
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
      <ul className={styles.list}>
        {visibleRows.map((row, idx) => {
          const itemKey = `${row.kind}-${row.workId}-${idx}`
          const href = personCreditDetailPath(row)
          const y =
            row.releaseDate && row.releaseDate.length >= 4 ? row.releaseDate.slice(0, 4) : null
          return (
            <li key={itemKey} className={styles.item}>
              <Link href={href} className={styles.link}>
                <span>{row.title}</span>
                {y ? <span className={styles.meta}>{y}</span> : null}
                <span className={styles.kind}>{row.kind === 'movie' ? 'Movie' : 'TV'}</span>
              </Link>
              {row.character ? <p className={styles.character}>as {row.character}</p> : null}
            </li>
          )
        })}
      </ul>
      {rows.length === 0 ? (
        <p className={styles.emptyState}>No credits found for this filter.</p>
      ) : null}
      {canLoadMore ? (
        <div className={styles.loadMoreWrap}>
          <button
            type="button"
            className={styles.loadMoreBtn}
            onClick={() => setVisibleCount((v) => v + 20)}
          >
            Load more
          </button>
        </div>
      ) : null}
      {!canLoadMore && visibleCount > 20 && rows.length > 20 ? (
        <div className={styles.loadMoreWrap}>
          <button type="button" className={styles.loadMoreBtn} onClick={() => setVisibleCount(20)}>
            Show less
          </button>
        </div>
      ) : null}
    </section>
  )
}
