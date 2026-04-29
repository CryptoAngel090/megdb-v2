'use client'
// client: needs useState for filters + spin animation + fetch on demand

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { detailPathForShelfItem } from '@/lib/slug'
import { movieGenrePathById } from '@/lib/movieGenreRoute'
import { Dice5, Star, Clock, Calendar, Play, ArrowRight, Filter, RotateCw } from 'lucide-react'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import styles from './RandomMoviePage.module.css'

// ── Types ────────────────────────────────────────────────

interface Genre {
  id: number
  name: string
}

interface RandomMovie {
  id: number
  title: string
  overview: string
  posterPath: string | null
  backdropPath: string | null
  voteAverage: number
  voteCount: number
  releaseDate: string | null
  runtime: number | null
  genres: string[]
  popularity: number
}

interface RandomMoviePageProps {
  genres: Genre[]
}

// ── Constants ────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1969 }, (_, i) => CURRENT_YEAR - i)

const RATING_OPTIONS = [
  { label: 'Any rating', value: '' },
  { label: '9+ Masterpiece', value: '9' },
  { label: '8+ Excellent', value: '8' },
  { label: '7+ Great', value: '7' },
  { label: '6+ Good', value: '6' },
]

const TMDB_IMAGE = 'https://image.tmdb.org/t/p'
const POSTER_BLUR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

// ── Helpers ──────────────────────────────────────────────

function formatRuntime(min: number): string {
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatVotes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(n)
}

function getRatingColor(r: number): string {
  if (r >= 8.5) return '#22d3ee'
  if (r >= 7.5) return '#38bdf8'
  if (r >= 6.5) return '#a78bfa'
  if (r >= 5.5) return '#c084fc'
  return '#818cf8'
}

function getRatingLabel(r: number): string {
  if (r >= 8.5) return 'Exceptional'
  if (r >= 7.5) return 'Great'
  if (r >= 6.5) return 'Good'
  if (r >= 5.5) return 'Mixed'
  return 'Below avg'
}

// ── Icons ────────────────────────────────────────────────

// ── Main component ───────────────────────────────────────

export function RandomMoviePage({ genres }: RandomMoviePageProps) {
  const [movie, setMovie] = useState<RandomMovie | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSpun, setHasSpun] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedRating, setSelectedRating] = useState('')
  const [yearMode, setYearMode] = useState<'any' | 'exact' | 'decade'>('any')
  const [selectedDecade, setSelectedDecade] = useState('')

  const spinCount = useRef(0)

  const activeFilterCount = [selectedGenre, selectedYear || selectedDecade, selectedRating].filter(
    Boolean
  ).length

  const fetchRandom = useCallback(async () => {
    if (isSpinning) return
    setIsSpinning(true)
    setError(null)
    spinCount.current += 1

    try {
      const params = new URLSearchParams()
      if (selectedGenre) params.set('genre', selectedGenre)
      if (yearMode === 'exact' && selectedYear) params.set('year', selectedYear)
      if (yearMode === 'decade' && selectedDecade) params.set('decade', selectedDecade)
      if (selectedRating) params.set('minRating', selectedRating)

      const res = await fetch(`/api/random-movie?${params.toString()}`)
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? 'Failed to fetch')
      }
      const data = (await res.json()) as RandomMovie
      setMovie(data)
      setHasSpun(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSpinning(false)
    }
  }, [isSpinning, selectedGenre, selectedYear, selectedRating, yearMode, selectedDecade])

  const decadeOptions = Array.from({ length: Math.ceil((CURRENT_YEAR - 1920) / 10) }, (_, i) => {
    const start = CURRENT_YEAR - i * 10 - (CURRENT_YEAR % 10)
    return { label: `${start}s`, value: String(start) }
  }).filter((d) => Number(d.value) >= 1920)

  return (
    <main className={styles.root}>
      {/* Ambient backdrop */}
      {movie?.backdropPath && (
        <div key={movie.id} className={styles.ambient} aria-hidden>
          <Image
            src={`${TMDB_IMAGE}/w1280${movie.backdropPath}`}
            alt=""
            fill
            className={styles.ambientImg}
            priority={false}
            sizes="100vw"
          />
          <div className={styles.ambientOverlay} />
        </div>
      )}

      <div className={styles.container}>
        {/* Page header */}
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderText}>
            <h1 className={styles.pageTitle}>
              <span className={styles.pageTitleAccent}>Random</span> Movie
            </h1>
            <p className={styles.pageSubtitle}>Can&apos;t decide? Let us pick something for you.</p>
          </div>

          {/* Filter toggle */}
          <button
            className={`${styles.filterToggle} ${showFilters ? styles.filterToggleActive : ''}`}
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            aria-controls="filter-panel"
          >
            <Filter className={`${iconSlot.block} ${iconSlot.sm}`} aria-hidden />
            Filters
          </button>
        </header>

        {/* Filter panel */}
        {showFilters && (
          <section
              id="filter-panel"
              className={styles.filterPanel}
              aria-label="Movie filters"
          >
              <div className={styles.filterGrid}>
                {/* Genre */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel} htmlFor="filter-genre">
                    Genre
                  </label>
                  <select
                    id="filter-genre"
                    className={styles.filterSelect}
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                  >
                    <option value="">Any genre</option>
                    {genres.map((g) => (
                      <option key={g.id} value={String(g.id)}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year mode */}
                <div className={styles.filterGroup}>
                  <fieldset className={styles.filterFieldset}>
                    <legend className={styles.filterLabel}>Year</legend>
                    <div className={styles.yearModeRow}>
                      {(['any', 'exact', 'decade'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          className={`${styles.yearModeBtn} ${yearMode === mode ? styles.yearModeBtnActive : ''}`}
                          onClick={() => {
                            setYearMode(mode)
                            setSelectedYear('')
                            setSelectedDecade('')
                          }}
                        >
                          {mode === 'any' ? 'Any' : mode === 'exact' ? 'Exact' : 'Decade'}
                        </button>
                      ))}
                    </div>
                    {yearMode === 'exact' && (
                      <select
                        className={styles.filterSelect}
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        aria-label="Select exact year"
                      >
                        <option value="">Any year</option>
                        {YEAR_OPTIONS.map((y) => (
                          <option key={y} value={String(y)}>
                            {y}
                          </option>
                        ))}
                      </select>
                    )}
                    {yearMode === 'decade' && (
                      <select
                        className={styles.filterSelect}
                        value={selectedDecade}
                        onChange={(e) => setSelectedDecade(e.target.value)}
                        aria-label="Select decade"
                      >
                        <option value="">Any decade</option>
                        {decadeOptions.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </fieldset>
                </div>

                {/* Rating */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel} htmlFor="filter-rating">
                    Min rating
                  </label>
                  <select
                    id="filter-rating"
                    className={styles.filterSelect}
                    value={selectedRating}
                    onChange={(e) => setSelectedRating(e.target.value)}
                  >
                    {RATING_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reset filters */}
              {activeFilterCount > 0 && (
                <button
                  className={styles.resetFilters}
                  onClick={() => {
                    setSelectedGenre('')
                    setSelectedYear('')
                    setSelectedDecade('')
                    setSelectedRating('')
                    setYearMode('any')
                  }}
                >
                  Clear all filters
                </button>
              )}
          </section>
        )}

        {/* Spin button */}
        <div className={styles.spinArea}>
          <button
            className={`${styles.spinBtn} ${isSpinning ? styles.spinBtnSpinning : ''}`}
            onClick={() => {
              void fetchRandom()
            }}
            disabled={isSpinning}
            aria-label={isSpinning ? 'Finding a random movie…' : 'Pick a random movie'}
          >
            <span
              className={styles.spinBtnIcon}
            >
              {hasSpun ? (
                <RotateCw className={`${iconSlot.block} ${iconSlot.inline18}`} aria-hidden />
              ) : (
                <Dice5 className={`${iconSlot.block} ${iconSlot.inline22}`} aria-hidden />
              )}
            </span>
            <span>{isSpinning ? 'Finding…' : hasSpun ? 'Try another' : 'Pick for me'}</span>
          </button>

          {hasSpun && !isSpinning && (
            <p className={styles.spinHint}>
              Not feeling it?{' '}
              <button
                type="button"
                className={styles.spinHintBtn}
                onClick={() => {
                  void fetchRandom()
                }}
              >
                Roll again
              </button>
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className={styles.errorBox} role="alert">
            <p>{error}</p>
            <button
              type="button"
              className={styles.errorRetry}
              onClick={() => {
                void fetchRandom()
              }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Result card */}
        {movie && !isSpinning && (
          <article
              key={movie.id}
              className={styles.resultCard}
              aria-label={`Random pick: ${movie.title}`}
          >
              {/* Poster */}
              <div className={`${styles.posterWrap} card-hover hover-lift-card`}>
                {movie.posterPath ? (
                  <Image
                    src={`${TMDB_IMAGE}/w500${movie.posterPath}`}
                    alt={`Poster for ${movie.title}`}
                    fill
                    className={styles.poster}
                    sizes="(max-width: 639px) 140px, 220px"
                    placeholder="blur"
                    blurDataURL={POSTER_BLUR}
                    priority
                  />
                ) : (
                  <div className={styles.posterFallback} aria-hidden>
                    🎬
                  </div>
                )}

                {/* Rating badge on poster */}
                {movie.voteAverage > 0 && (
                  <div
                    className={styles.posterRating}
                    style={{ color: getRatingColor(movie.voteAverage) }}
                    aria-hidden
                  >
                    <Star
                      className={`${iconSlot.block} ${iconSlot.inline14}`}
                      fill="currentColor"
                      aria-hidden
                    />
                    {movie.voteAverage.toFixed(1)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className={styles.info}>
                {/* Genres */}
                {movie.genres.length > 0 && (
                  <div className={styles.genreRow} aria-label="Genres">
                    {movie.genres.slice(0, 3).map((g) => (
                      <span key={g} className={styles.genrePill}>
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                <h2 className={styles.movieTitle}>{movie.title}</h2>

                {/* Meta row */}
                <div className={styles.metaRow} role="group" aria-label="Movie details">
                  {movie.releaseDate && (
                    <span className={styles.metaItem}>
                      <Calendar className={`${iconSlot.block} ${iconSlot.inline14}`} aria-hidden />
                      {new Date(movie.releaseDate).getFullYear()}
                    </span>
                  )}
                  {movie.runtime != null && movie.runtime > 0 && (
                    <span className={styles.metaItem}>
                      <Clock className={`${iconSlot.block} ${iconSlot.inline14}`} aria-hidden />
                      {formatRuntime(movie.runtime)}
                    </span>
                  )}
                  {movie.voteAverage > 0 && (
                    <span
                      className={styles.metaItem}
                      style={{ color: getRatingColor(movie.voteAverage) }}
                    >
                      <Star
                        className={`${iconSlot.block} ${iconSlot.inline14}`}
                        fill="currentColor"
                        aria-hidden
                      />
                      {movie.voteAverage.toFixed(1)}
                      <span className={styles.metaRatingLabel}>
                        {getRatingLabel(movie.voteAverage)}
                      </span>
                    </span>
                  )}
                  {movie.voteCount > 0 && (
                    <span className={styles.metaItem}>{formatVotes(movie.voteCount)} votes</span>
                  )}
                </div>

                {/* Overview */}
                {movie.overview && <p className={styles.overview}>{movie.overview}</p>}

                {/* Actions */}
                <div className={styles.actions}>
                  <Link
                    href={detailPathForShelfItem({
                      type: 'movie',
                      title: movie.title,
                      releaseDate: movie.releaseDate,
                    })}
                    className={styles.actionPrimary}
                    aria-label={`View details for ${movie.title}`}
                  >
                    <Play
                      className={`${iconSlot.block} ${iconSlot.inline18}`}
                      fill="currentColor"
                      aria-hidden
                    />
                    View details
                  </Link>
                  <button
                    type="button"
                    className={styles.actionSecondary}
                    onClick={() => {
                      void fetchRandom()
                    }}
                    aria-label="Pick another random movie"
                  >
                    <RotateCw className={`${iconSlot.block} ${iconSlot.inline18}`} aria-hidden />
                    Another one
                  </button>
                  <Link
                    href={movieGenrePathById(selectedGenre) ?? '/movies'}
                    className={styles.actionGhost}
                    aria-label="Browse similar movies"
                  >
                    Browse similar
                    <ArrowRight className={`${iconSlot.block} ${iconSlot.sm}`} aria-hidden />
                  </Link>
                </div>
              </div>
          </article>
        )}

        {/* Skeleton while spinning */}
        {isSpinning && (
          <div
              className={styles.skeleton}
              aria-hidden
            >
              <div className={styles.skeletonPoster} />
              <div className={styles.skeletonInfo}>
                <div className={styles.skeletonGenres} />
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonMeta} />
                <div className={styles.skeletonText} />
                <div className={styles.skeletonText} style={{ width: '80%' }} />
                <div className={styles.skeletonText} style={{ width: '60%' }} />
              </div>
          </div>
        )}

        {/* Empty state — first visit */}
        {!hasSpun && !isSpinning && !error && (
          <div className={styles.emptyState} aria-live="polite">
            <div className={styles.emptyIcon} aria-hidden>
              🎲
            </div>
            <p className={styles.emptyTitle}>Ready to discover something new?</p>
            <p className={styles.emptyText}>
              Hit the button above and we&apos;ll find a movie for you. Use filters to narrow it
              down by genre, year, or rating.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
