'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import type { MediaType } from '@repo/types'
import { mediaShelfCardVariants } from '@/lib/shelfAnimations'
import type { PosterFocalPercent } from '@/lib/posterFaceFocalPoint'
import { detectPosterFocalPoint } from '@/lib/posterFaceFocalPoint'
import { useDeviceTier } from '@/hooks/useDeviceTier'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import styles from './MediaCard.module.css'

const TMDB_IMAGE = 'https://image.tmdb.org/t/p'

/** Shelf / detail rails — TMDB `w780`; `sizes` track viewport columns (see globals `--media-card-rail-*`). */
const POSTER_IMAGE_SIZES_SHELF =
  '(max-width: 47.99rem) 34vw, (max-width: 61.99rem) 27vw, (max-width: 79.99rem) 21vw, min(22vw, 260px)'

/** Discover grids — TMDB `w500`; column widths from CSS grid `minmax`. */
const POSTER_IMAGE_SIZES_GRID =
  '(max-width: 639px) min(92vw, 240px), (max-width: 1023px) min(48vw, 240px), min(280px, 24vw)'
const TYPE_LABELS: Record<MediaType, string> = {
  movie: 'Movie',
  series: 'Series',
  cartoon: 'Cartoon',
  tvshow: 'TV Show',
}
const TYPE_PATHS: Record<MediaType, string> = {
  movie: 'movie',
  series: 'series',
  cartoon: 'cartoon',
  tvshow: 'tvshow',
}

/** Tiny neutral blur for TMDB posters (perceived load, stable layout). */
export const TMDB_POSTER_BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

/** Видимый «магнит» (0.1 было почти незаметно на постере). */
const MAGNETIC_MAX_OFFSET_PX = 42
const MAGNETIC_RADIUS_PX = 280
const MAGNETIC_PULL = 0.62
const TILT_MAX_DEG = 15
const TILT_HOVER_SCALE = 1.05

/** Пружина для магнита + tilt (как в чеклисте ~300 / 20) */
const CARD_SPRING = { stiffness: 300, damping: 20, mass: 0.72 }
const CARD_SPRING_REDUCED = { stiffness: 520, damping: 40, mass: 0.48 }

type CardMotionState = { tx: number; ty: number; rx: number; ry: number; sc: number }

const CARD_MOTION_IDLE: CardMotionState = { tx: 0, ty: 0, rx: 0, ry: 0, sc: 1 }

function computeCardMotion(
  clientX: number,
  clientY: number,
  rect: DOMRectReadOnly,
  prefersReducedMotion: boolean,
  allowMagnetic: boolean,
  allowTilt: boolean
): CardMotionState {
  if (rect.width <= 0 || rect.height <= 0) {
    return CARD_MOTION_IDLE
  }

  const halfW = rect.width / 2
  const halfH = rect.height / 2
  const cx = clientX - rect.left - halfW
  const cy = clientY - rect.top - halfH
  const dist = Math.hypot(cx, cy)

  let tx = 0
  let ty = 0
  if (allowMagnetic && dist < MAGNETIC_RADIUS_PX && dist > 0.001) {
    const strength = 1 - dist / MAGNETIC_RADIUS_PX
    let nx = cx * strength * MAGNETIC_PULL
    let ny = cy * strength * MAGNETIC_PULL
    const len = Math.hypot(nx, ny)
    if (len > MAGNETIC_MAX_OFFSET_PX) {
      const s = MAGNETIC_MAX_OFFSET_PX / len
      nx *= s
      ny *= s
    }
    tx = nx
    ty = ny
  }

  /* RM: оставляем «магнит» к курсору; отключаем только 3D и scale — иначе кажется, что тянется только CSS постера */
  if (prefersReducedMotion) {
    return { tx, ty, rx: 0, ry: 0, sc: 1 }
  }

  if (!allowTilt) {
    return { tx, ty, rx: 0, ry: 0, sc: 1 }
  }

  const nxN = (clientX - rect.left) / rect.width - 0.5
  const nyN = (clientY - rect.top) / rect.height - 0.5
  const rx = nyN * TILT_MAX_DEG
  const ry = -nxN * TILT_MAX_DEG
  const sc = Math.abs(rx) > 0.02 || Math.abs(ry) > 0.02 ? TILT_HOVER_SCALE : 1

  return { tx, ty, rx, ry, sc }
}

function formatRuntimeMinutes(total: number): string {
  if (total < 60) return `${total}m`
  const h = Math.floor(total / 60)
  const m = total % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

/** TMDB list dates are often `YYYY-MM-DD`; parse as local calendar date to avoid UTC off-by-one. */
function toLocalCalendarDate(releaseDate: Date | string | null | undefined): Date | null {
  if (releaseDate == null) return null
  if (releaseDate instanceof Date) {
    return Number.isNaN(releaseDate.getTime()) ? null : releaseDate
  }
  const s = String(releaseDate).trim()
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (m) {
    const y = Number(m[1])
    const mo = Number(m[2])
    const d = Number(m[3])
    if (Number.isFinite(y) && Number.isFinite(mo) && Number.isFinite(d))
      return new Date(y, mo - 1, d)
  }
  const parsed = new Date(s)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** `full` → day month year (e.g. 15 May 2026); `year` → calendar year only. */
function formatReleaseLabel(
  releaseDate: Date | string | null | undefined,
  mode: 'year' | 'full'
): string | null {
  const d = toLocalCalendarDate(releaseDate)
  if (d == null) return null
  if (mode === 'year') {
    const y = d.getFullYear()
    return Number.isFinite(y) ? String(y) : null
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

function IconCalendar({ className }: { className?: string | undefined }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function IconClock({ className }: { className?: string | undefined }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

interface MediaCardProps {
  id: number
  type: MediaType
  title: string
  posterPath: string | null
  synopsis?: string | null
  voteAverage: number
  releaseDate?: Date | string | null
  /** Default `year`; `full` shows calendar day + month + year (e.g. upcoming shelf). */
  releaseDateDisplay?: 'year' | 'full'
  /**
   * Homepage “Coming in …” shelf: poster shows only the release date (centered top);
   * rating, status (New / Coming soon), and type badges are hidden on the poster.
   */
  posterBadges?: 'default' | 'comingDateOnly'
  genres?: string[]
  runtimeMinutes?: number | null
  listIndex?: number
  priority?: boolean
  /**
   * When `true` (default), card expects a parent `motion` row with stagger variants (`MediaShelf`).
   * Set `false` for grids or other layouts without that parent.
   */
  shelfReveal?: boolean
  /**
   * TMDB poster width + `sizes`: `shelf` → `w780` (homepage / detail rails); `grid` → `w500` (discover grids).
   * Layout size still comes from CSS (rail slot, grid `minmax`, etc.).
   */
  posterContext?: 'shelf' | 'grid'
  /** Discover grid: always show year · rating · runtime with TBA/NR fallbacks. */
  unifiedDiscoverMeta?: boolean
  /** Layout density for discover-style grids. */
  layout?: 'default' | 'compact' | 'list'
  /** Override link target (e.g. slug URL on movie detail carousels). */
  href?: string
  /** Hide context badge (Trending/New) on narrow screens. */
  hideContextBadgeOnMobile?: boolean
}

export function MediaCard({
  id,
  type,
  title,
  posterPath,
  synopsis,
  voteAverage,
  releaseDate,
  releaseDateDisplay = 'year',
  posterBadges = 'default',
  genres = [],
  runtimeMinutes,
  listIndex = 0,
  priority = false,
  shelfReveal = true,
  posterContext = 'grid',
  unifiedDiscoverMeta = false,
  layout = 'default',
  href: hrefOverride,
  hideContextBadgeOnMobile = false,
}: MediaCardProps) {
  const genreList = Array.isArray(genres) ? genres : []
  const releaseLabel = formatReleaseLabel(releaseDate, releaseDateDisplay)
  const rating = voteAverage > 0 ? voteAverage.toFixed(1) : null
  const href = hrefOverride ?? `/${TYPE_PATHS[type]}/${id}`
  const tmdbPosterProfile = posterContext === 'shelf' ? 'w780' : 'w500'
  const imgSrc = posterPath ? `${TMDB_IMAGE}/${tmdbPosterProfile}${posterPath}` : null
  const posterImageSizes =
    posterContext === 'shelf' ? POSTER_IMAGE_SIZES_SHELF : POSTER_IMAGE_SIZES_GRID
  const runtimeLabel =
    runtimeMinutes != null && runtimeMinutes > 0 ? formatRuntimeMinutes(runtimeMinutes) : null
  const runtimeFallbackLabel =
    runtimeLabel ?? (type === 'cartoon' || type === 'movie' ? 'TBA' : null)
  const yearDiscoverLabel = releaseLabel ?? 'TBA'
  const runtimeDiscoverLabel = runtimeLabel ?? 'TBA'
  const releaseDateObj = toLocalCalendarDate(releaseDate)
  const now = new Date()
  const releaseYear = releaseDateObj?.getFullYear()
  const ratingNumber = rating != null ? Number(rating) : null
  const topRatedLabel = ratingNumber != null && ratingNumber >= 8.5 ? 'Top rated' : null

  // Global movie-only context badge (shows anywhere we render movie posters).
  const movieContextLabel =
    type === 'movie'
      ? (topRatedLabel ??
        (releaseDateObj != null && releaseDateObj.getTime() > now.getTime()
          ? 'Coming soon'
          : releaseYear != null && releaseYear >= now.getFullYear() - 1
            ? 'New'
            : listIndex < 12
              ? 'Trending'
              : null))
      : null
  const isComingDateOnlyPoster = posterBadges === 'comingDateOnly'
  const showPosterRatingBadge = !isComingDateOnlyPoster && rating != null
  // Remove MOVIE badge site-wide; keep type for non-movies.
  const showTypeBadge = !isComingDateOnlyPoster && type !== 'movie'
  const movieContextLabelForPoster = isComingDateOnlyPoster ? null : movieContextLabel
  const hasPosterRightStack =
    movieContextLabelForPoster != null ||
    showTypeBadge ||
    (!isComingDateOnlyPoster && releaseDateDisplay === 'full' && releaseLabel != null)
  const genreChips = genreList
    .slice(0, 2)
    .map((g) => String(g).trim())
    .filter(Boolean)
  const synopsisText = typeof synopsis === 'string' ? synopsis.trim() : ''
  const prefersReducedMotion = usePrefersReducedMotion()
  const { shouldEnableEffect, tier: deviceTier } = useDeviceTier()
  const allowMagnetic = shouldEnableEffect('magnetic')
  const allowTilt = shouldEnableEffect('tilt')
  const [posterFocal, setPosterFocal] = useState<PosterFocalPercent | null>(null)
  const posterPathRef = useRef(posterPath)
  posterPathRef.current = posterPath

  const cardMotionRafRef = useRef<number | null>(null)
  const cardMotionLatestRef = useRef<{ cx: number; cy: number; rect: DOMRectReadOnly } | null>(null)

  const targetTx = useMotionValue(0)
  const targetTy = useMotionValue(0)
  const targetRx = useMotionValue(0)
  const targetRy = useMotionValue(0)
  const targetSc = useMotionValue(1)

  const springOpts = useMemo(
    () => (prefersReducedMotion || deviceTier === 'low' ? CARD_SPRING_REDUCED : CARD_SPRING),
    [prefersReducedMotion, deviceTier]
  )

  const springTx = useSpring(targetTx, springOpts)
  const springTy = useSpring(targetTy, springOpts)
  const springRx = useSpring(targetRx, springOpts)
  const springRy = useSpring(targetRy, springOpts)
  const springSc = useSpring(targetSc, springOpts)

  const flushCardMotion = useCallback(() => {
    const L = cardMotionLatestRef.current
    if (!L) return
    const m = computeCardMotion(L.cx, L.cy, L.rect, prefersReducedMotion, allowMagnetic, allowTilt)
    targetTx.set(m.tx)
    targetTy.set(m.ty)
    targetRx.set(m.rx)
    targetRy.set(m.ry)
    targetSc.set(m.sc)
  }, [
    prefersReducedMotion,
    allowMagnetic,
    allowTilt,
    targetTx,
    targetTy,
    targetRx,
    targetRy,
    targetSc,
  ])

  const handleCardPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen' && e.pointerType !== 'touch') {
        return
      }
      const rect = e.currentTarget.getBoundingClientRect()
      cardMotionLatestRef.current = { cx: e.clientX, cy: e.clientY, rect }
      flushCardMotion()
      if (cardMotionRafRef.current != null) return
      cardMotionRafRef.current = requestAnimationFrame(() => {
        cardMotionRafRef.current = null
        flushCardMotion()
      })
    },
    [flushCardMotion]
  )

  const handleCardPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== 'touch') return
      const rect = e.currentTarget.getBoundingClientRect()
      cardMotionLatestRef.current = { cx: e.clientX, cy: e.clientY, rect }
      flushCardMotion()
    },
    [flushCardMotion]
  )

  const resetCardMotion = useCallback(() => {
    if (cardMotionRafRef.current != null) {
      cancelAnimationFrame(cardMotionRafRef.current)
      cardMotionRafRef.current = null
    }
    cardMotionLatestRef.current = null
    targetTx.set(CARD_MOTION_IDLE.tx)
    targetTy.set(CARD_MOTION_IDLE.ty)
    targetRx.set(CARD_MOTION_IDLE.rx)
    targetRy.set(CARD_MOTION_IDLE.ry)
    targetSc.set(CARD_MOTION_IDLE.sc)
  }, [targetTx, targetTy, targetRx, targetRy, targetSc])

  useEffect(() => {
    setPosterFocal(null)
  }, [posterPath, posterContext])

  const onPosterLoadingComplete = useCallback(
    (img: HTMLImageElement) => {
      if (!posterPath) return
      const pathWhenLoaded = posterPath
      const run = () => {
        void detectPosterFocalPoint(img).then((p) => {
          if (p != null && pathWhenLoaded === posterPathRef.current) setPosterFocal(p)
        })
      }
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(run, { timeout: 2000 })
      } else {
        globalThis.setTimeout(run, 0)
      }
    },
    [posterPath]
  )

  const ariaParts = unifiedDiscoverMeta
    ? [
        title,
        TYPE_LABELS[type],
        `release ${yearDiscoverLabel}`,
        `rating ${rating != null ? rating : 'not rated'}`,
        `duration ${runtimeDiscoverLabel}`,
        topRatedLabel != null ? `badge ${topRatedLabel}` : null,
        movieContextLabel != null ? `status ${movieContextLabel}` : null,
        genreChips.length ? `genres: ${genreChips.join(', ')}` : null,
      ]
    : [
        title,
        TYPE_LABELS[type],
        releaseLabel != null ? `release ${releaseLabel}` : null,
        rating ? `rating ${rating}` : null,
        runtimeFallbackLabel ? runtimeFallbackLabel : null,
        genreChips.length ? `genres: ${genreChips.join(', ')}` : null,
      ]
  const cardAriaLabel = `${ariaParts.filter(Boolean).join('. ')}. Open details.`

  const metaBelowHasDate = releaseDateDisplay !== 'full' && releaseLabel != null
  const metaBelowHasRuntime = Boolean(runtimeFallbackLabel)
  const metaBarVisible = unifiedDiscoverMeta || metaBelowHasDate || metaBelowHasRuntime

  const cardClass =
    layout === 'list'
      ? `${styles.card} ${styles.cardList}`
      : layout === 'compact'
        ? `${styles.card} ${styles.cardCompact}`
        : styles.card
  const cardClassWithBadges = hideContextBadgeOnMobile
    ? `${cardClass} ${styles.hideContextBadgeOnMobile}`
    : cardClass

  const cardBody = (
    <>
      <div className={styles.posterBlock}>
        <div className={styles.inner}>
          <div className={styles.poster}>
            {imgSrc ? (
              <Image
                src={imgSrc}
                alt=""
                fill
                sizes={posterImageSizes}
                className={styles.image}
                priority={priority}
                onLoadingComplete={onPosterLoadingComplete}
                {...(posterFocal
                  ? {
                      style: {
                        transformOrigin: `${posterFocal.x}% ${posterFocal.y}%`,
                        objectPosition: `${posterFocal.x}% ${posterFocal.y}%`,
                      },
                    }
                  : {})}
                {...(!shelfReveal
                  ? {
                      placeholder: 'blur' as const,
                      blurDataURL: TMDB_POSTER_BLUR_DATA_URL,
                    }
                  : {})}
                {...(priority ? { fetchPriority: 'high' as const } : {})}
              />
            ) : (
              <div className={styles.noPoster} aria-hidden="true">
                🎬
              </div>
            )}

            {isComingDateOnlyPoster && releaseDateDisplay === 'full' && releaseLabel != null && (
              <div
                className={`${styles.releaseDateBadge} ${styles.releaseDateBadgeCentered}`}
                aria-hidden="true"
              >
                {releaseLabel}
              </div>
            )}

            {hasPosterRightStack ? (
              <div className={styles.badgeStack} aria-hidden="true">
                {movieContextLabelForPoster != null && (
                  <div className={styles.statusBadge}>{movieContextLabelForPoster}</div>
                )}
                {showTypeBadge && <div className={styles.typeBadge}>{TYPE_LABELS[type]}</div>}
                {!isComingDateOnlyPoster &&
                  releaseDateDisplay === 'full' &&
                  releaseLabel != null && (
                    <div className={styles.releaseDateBadge}>{releaseLabel}</div>
                  )}
              </div>
            ) : null}

            {showPosterRatingBadge && (
              <div className={styles.ratingBadge} aria-hidden="true">
                ★ {rating}
              </div>
            )}

            <div className={styles.overlay} aria-hidden="true">
              <p className={styles.overlayTitle}>{title}</p>
              {releaseDateDisplay !== 'full' && releaseLabel != null && (
                <div className={styles.overlayMeta}>
                  <span className={styles.overlayYear}>{releaseLabel}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`${styles.infoPanel} ${
          unifiedDiscoverMeta && layout !== 'list' ? styles.infoPanelDiscover : ''
        }`}
      >
        <p className={styles.title} aria-hidden="true">
          {title}
        </p>
        <div className={styles.titleDivider} role="presentation" />
        <div className={styles.infoBody}>
          <div
            className={`${styles.metaBar} ${unifiedDiscoverMeta ? styles.metaBarDiscover : ''}`}
            {...(metaBarVisible
              ? {
                  role: 'group' as const,
                  'aria-label': unifiedDiscoverMeta
                    ? 'Release year and duration'
                    : metaBelowHasDate && metaBelowHasRuntime
                      ? 'Release year and duration'
                      : metaBelowHasDate
                        ? 'Release year'
                        : 'Duration',
                }
              : { 'aria-hidden': true as const })}
          >
            {unifiedDiscoverMeta ? (
              <>
                <span
                  className={`${styles.metaItem} ${layout === 'list' ? styles.metaItemListBtn : ''}`}
                >
                  <IconCalendar className={styles.metaIcon} />
                  {yearDiscoverLabel}
                </span>
                <span
                  className={`${styles.metaItem} ${layout === 'list' ? styles.metaItemListBtn : ''}`}
                >
                  <IconClock className={styles.metaIcon} />
                  {runtimeDiscoverLabel}
                </span>
              </>
            ) : (
              <>
                {metaBelowHasDate && (
                  <span className={styles.metaItem}>
                    <IconCalendar className={styles.metaIcon} />
                    {releaseLabel}
                  </span>
                )}
                {runtimeFallbackLabel && (
                  <span className={styles.metaItem}>
                    <IconClock className={styles.metaIcon} />
                    {runtimeFallbackLabel}
                  </span>
                )}
              </>
            )}
          </div>
          <div
            className={`${styles.genreSlot} ${layout === 'list' ? styles.genreSlotList : ''}`}
            {...(genreChips.length === 0
              ? { 'aria-hidden': true as const }
              : { role: 'group' as const, 'aria-label': 'Genres' })}
          >
            {[0, 1].map((slot) => {
              const g = genreChips[slot]
              if (!g) {
                return (
                  <span
                    key={`genre-ph-${slot}`}
                    className={styles.genrePillPlaceholder}
                    aria-hidden
                  />
                )
              }
              return (
                <span key={`${g}-${slot}`} className={styles.genrePill}>
                  <span className={styles.genreDot} aria-hidden />
                  <span className={styles.genreText}>{g.toUpperCase()}</span>
                </span>
              )
            })}
          </div>
          {layout === 'list' && synopsisText.length > 0 && (
            <p className={styles.synopsis} aria-label="Synopsis">
              {synopsisText}
            </p>
          )}
        </div>
      </div>
    </>
  )

  const inner = (
    <Link href={href} className={cardClassWithBadges} aria-label={cardAriaLabel}>
      <div className={styles.tiltPerspective}>
        <motion.div
          className={`${styles.magneticRoot} ${styles.cardMotionLayer}`}
          style={{
            x: springTx,
            y: springTy,
            rotateX: springRx,
            rotateY: springRy,
            scale: springSc,
            transformStyle: 'preserve-3d',
          }}
          onPointerDown={handleCardPointerDown}
          onPointerMove={handleCardPointerMove}
          onPointerLeave={resetCardMotion}
          onPointerCancel={resetCardMotion}
        >
          {cardBody}
        </motion.div>
      </div>
    </Link>
  )

  if (prefersReducedMotion) {
    return <div>{inner}</div>
  }

  if (!shelfReveal) {
    return (
      <motion.div
        whileTap={{ scale: 0.988 }}
        transition={{ scale: { type: 'spring', stiffness: 520, damping: 28 } }}
      >
        {inner}
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={mediaShelfCardVariants}
      whileTap={{ scale: 0.988 }}
      transition={{ scale: { type: 'spring', stiffness: 520, damping: 28 } }}
    >
      {inner}
    </motion.div>
  )
}

export function MediaCardSkeleton() {
  return (
    <div className={styles.skeletonRoot} aria-hidden="true">
      <div className={styles.skeletonPoster} />
      <div className={styles.infoPanel}>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonDivider} />
        <div className={styles.infoBody}>
          <div className={styles.skeletonMeta} />
          <div className={styles.skeletonGenreSlot} aria-hidden>
            <div className={styles.skeletonGenrePill} />
            <div className={styles.skeletonGenrePill} />
          </div>
        </div>
      </div>
    </div>
  )
}
