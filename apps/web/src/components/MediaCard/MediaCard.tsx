'use client'

import type { MediaType } from '@repo/types'
import { Calendar, Clock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  ViewTransition,
} from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import type { PosterFocalPercent } from '@/lib/posterFaceFocalPoint'
import { detectPosterFocalPoint } from '@/lib/posterFaceFocalPoint'
import { detailPathForShelfItem } from '@/lib/slug'
import type { CardSizeKey } from '@/theme/tokens/size'
import styles from './MediaCard.module.css'

const TMDB_IMAGE = 'https://image.tmdb.org/t/p'

/** Shelf / detail rails — TMDB `w780`; `sizes` track viewport columns (see globals `--rail-tile-*` / `--media-card-rail-*`). */
const POSTER_IMAGE_SIZES_SHELF =
  '(max-width: 47.99rem) 34vw, (max-width: 61.99rem) 27vw, (max-width: 79.99rem) 21vw, min(22vw, 260px)'

/** Discover grids — TMDB `w500`; column widths from CSS grid `minmax`. */
const POSTER_IMAGE_SIZES_GRID =
  '(max-width: 639px) min(92vw, 240px), (max-width: 1023px) min(48vw, 240px), min(280px, 24vw)'
/** Tiny neutral blur for TMDB posters (perceived load, stable layout). */
const TMDB_POSTER_BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

/** Видимый «магнит» (0.1 было почти незаметно на постере). */
const MAGNETIC_MAX_OFFSET_PX = 42
const MAGNETIC_RADIUS_PX = 280
const MAGNETIC_PULL = 0.62
const TILT_MAX_DEG = 15
const TILT_HOVER_SCALE = 1.05

const CARD_SIZE_MOD: Record<CardSizeKey, string> = {
  sm: styles.cardSizeSm ?? '',
  md: styles.cardSizeMd ?? '',
  lg: styles.cardSizeLg ?? '',
}

const SKELETON_CARD_SIZE_MOD: Record<CardSizeKey, string> = {
  sm: styles.skeletonCardSizeSm ?? '',
  md: styles.skeletonCardSizeMd ?? '',
  lg: styles.skeletonCardSizeLg ?? '',
}

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
  return <Calendar className={className} aria-hidden />
}

function IconClock({ className }: { className?: string | undefined }) {
  return <Clock className={className} aria-hidden />
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
   * When `false`, disables magnetic cursor follow and 3D tilt on the card (no pointer-driven motion).
   * Home `MediaShelf` passes `false` for calmer rails.
   * @default true
   */
  enablePointerMotion?: boolean
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
  /** Poster frame preset — `theme/tokens/size.ts` `cardSize`. @default 'md' */
  cardSize?: CardSizeKey
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
  priority = false,
  shelfReveal = true,
  enablePointerMotion = true,
  posterContext = 'grid',
  unifiedDiscoverMeta = false,
  layout = 'default',
  href: hrefOverride,
  hideContextBadgeOnMobile = false,
  cardSize = 'md',
}: MediaCardProps) {
  const genreList = Array.isArray(genres) ? genres : []
  const releaseLabel = formatReleaseLabel(releaseDate, releaseDateDisplay)
  const rating = voteAverage > 0 ? voteAverage.toFixed(1) : null
  const href =
    hrefOverride ?? detailPathForShelfItem({ type, title, releaseDate: releaseDate ?? null })
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
  const isComingDateOnlyPoster = posterBadges === 'comingDateOnly'
  const showPosterRatingBadge = !isComingDateOnlyPoster && rating != null
  const genreChips = genreList
    .slice(0, 2)
    .map((g) => String(g).trim())
    .filter(Boolean)
  const synopsisText = typeof synopsis === 'string' ? synopsis.trim() : ''
  const prefersReducedMotion = usePrefersReducedMotion()
  const allowMagnetic = enablePointerMotion
  const allowTilt = enablePointerMotion
  const [posterFocal, setPosterFocal] = useState<PosterFocalPercent | null>(null)
  const posterPathRef = useRef(posterPath)
  posterPathRef.current = posterPath

  const cardMotionRafRef = useRef<number | null>(null)
  const cardMotionLatestRef = useRef<{ cx: number; cy: number; rect: DOMRectReadOnly } | null>(null)
  const [cardMotion, setCardMotion] = useState<CardMotionState>(CARD_MOTION_IDLE)

  const flushCardMotion = useCallback(() => {
    const L = cardMotionLatestRef.current
    if (!L) return
    const m = computeCardMotion(L.cx, L.cy, L.rect, prefersReducedMotion, allowMagnetic, allowTilt)
    setCardMotion(m)
  }, [prefersReducedMotion, allowMagnetic, allowTilt])

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
    setCardMotion(CARD_MOTION_IDLE)
  }, [])

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
              <ViewTransition name={`poster-${id}`}>
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
                        // transformOrigin only — composite-only property, no layout shift (CLS fix).
                        // objectPosition intentionally omitted: changing it after load causes CLS.
                        style: {
                          transformOrigin: `${posterFocal.x}% ${posterFocal.y}%`,
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
              </ViewTransition>
            ) : (
              <div className={styles.noPoster} aria-hidden="true">
                🎬
              </div>
            )}

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

  // When neither magnetic nor tilt is active, skip wiring motion values to the DOM.
  const motionEnabled = allowMagnetic || allowTilt

  const inner = (
    <Link
      href={href}
      prefetch={false}
      className={`${cardClassWithBadges} ${CARD_SIZE_MOD[cardSize]} card-hover hover-lift-card`}
      data-tmdb-id={id}
    >
      <div className={styles.tiltPerspective}>
        {motionEnabled ? (
          <div
            className={`${styles.magneticRoot} ${styles.cardMotionLayer}`}
            style={{
              transform: `translate3d(${cardMotion.tx}px, ${cardMotion.ty}px, 0) rotateX(${cardMotion.rx}deg) rotateY(${cardMotion.ry}deg) scale(${cardMotion.sc})`,
              transformStyle: 'preserve-3d',
            }}
            onPointerDown={handleCardPointerDown}
            onPointerMove={handleCardPointerMove}
            onPointerLeave={resetCardMotion}
            onPointerCancel={resetCardMotion}
          >
            {cardBody}
          </div>
        ) : (
          <div className={`${styles.magneticRoot} ${styles.cardMotionLayer}`}>{cardBody}</div>
        )}
      </div>
    </Link>
  )

  if (prefersReducedMotion) {
    return <div>{inner}</div>
  }

  if (!shelfReveal) {
    return <div className={styles.cardTapWrapper}>{inner}</div>
  }

  // shelfReveal=true: parent handles entrance animation
  return <div className={styles.cardTapWrapper}>{inner}</div>
}

function _MediaCardSkeleton({ cardSize = 'md' }: { cardSize?: CardSizeKey }) {
  return (
    <div
      className={`${styles.skeletonRoot} ${SKELETON_CARD_SIZE_MOD[cardSize]}`}
      aria-hidden="true"
    >
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
