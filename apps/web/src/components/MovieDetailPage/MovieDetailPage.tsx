import Image from 'next/image'
import Link from 'next/link'
import type { MoviePageDetail } from '@/lib/tmdb'
import { getImageUrl } from '@/lib/tmdb'
import { containsCyrillic } from '@/lib/textScript'
import { personPath, type DetailMediaKind } from '@/lib/slug'
import { MovieShareButton } from './MovieShareButton'
import { MovieCastSection } from './MovieCastSection'
import { MoviePhotosSection } from './MoviePhotosSection'
import { MovieWatchProvidersPanel } from './MovieWatchProvidersPanel'
import { MovieHeroBackdropImage } from './MovieHeroBackdropImage'
import { MovieTrailerBlock } from './MovieTrailerBlock'
import { MovieHeroTrailerActions } from './MovieHeroTrailerActions'
import { MovieOverviewBlock } from './MovieOverviewBlock'
import { MovieOverviewFeedback } from './MovieOverviewFeedback'
import { MovieUserRatingCard } from './MovieUserRatingCard'
import { MovieFaqAccordion } from './MovieFaqAccordion'
import { MovieCollectionSection } from './MovieCollectionSection'
import { TvSeriesEpisodes } from '@/components/TvSeriesEpisodes/TvSeriesEpisodes'
import styles from './MovieDetailPage.module.css'

const POSTER_BLUR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

function formatRuntimeMinutes(total: number): string {
  if (total < 60) return `${total}m`
  const h = Math.floor(total / 60)
  const m = total % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatMoney(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `$${Math.round(n / 1_000_000)}M`
  return `$${n.toLocaleString()}`
}

/** rule 53: сокращение числа голосов — 128456 → 128K */
function formatVoteCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(n)
}

/** rule 55: <10 оценок = показываем "No ratings yet" */
function isRatingReliable(voteCount: number): boolean {
  return voteCount >= 10
}

function getScoreSentiment(score: number): { label: string; color: string } {
  if (score >= 8.5) return { label: 'Exceptional', color: '#4ade80' }
  if (score >= 7.5) return { label: 'Great', color: '#86efac' }
  if (score >= 6.5) return { label: 'Good', color: '#f4c20d' }
  if (score >= 5.5) return { label: 'Mixed', color: '#fb923c' }
  if (score >= 4.0) return { label: 'Below Avg', color: '#f87171' }
  return { label: 'Poor', color: '#ef4444' }
}

function IconChevronLeft({ className }: { className?: string | undefined }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconStar({ className }: { className?: string | undefined }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

export interface MovieDetailPageNav {
  backHref?: string
  backLabel?: string
  /** e.g. `/series?genre=` — id is appended. */
  genreQueryPrefix?: string
  /** Card type + canonical URLs for “More like this” / collection rail. */
  similarMediaKind?: DetailMediaKind
  /** Hide budget/revenue rows on non-movie pages. */
  showBoxOffice?: boolean
  /** Feedback namespace to avoid movie/tv id collisions. */
  feedbackScope?: 'movie' | 'tv'
}

export function MovieDetailPage({
  movie,
  nav,
}: {
  movie: MoviePageDetail
  nav?: MovieDetailPageNav
}) {
  const backHref = nav?.backHref ?? '/movies'
  const backLabel = nav?.backLabel ?? 'All Movies'
  const genreQueryPrefix = nav?.genreQueryPrefix ?? '/movies?genre='
  const similarMediaKind = nav?.similarMediaKind ?? 'movie'
  const isTvLike = similarMediaKind === 'series' || similarMediaKind === 'tvshow'
  const showBoxOffice = nav?.showBoxOffice ?? !isTvLike
  const feedbackScope = nav?.feedbackScope ?? (isTvLike ? 'tv' : 'movie')
  const runtimeLabel = movie.runtime != null ? formatRuntimeMinutes(movie.runtime) : null
  const year =
    movie.releaseDate && movie.releaseDate.length >= 4
      ? Number(movie.releaseDate.slice(0, 4))
      : null
  const yearLabel = year != null && Number.isFinite(year) ? String(year) : null
  const trailerKey = movie.trailerYoutubeKey
  const imdbUrl = movie.imdbId ? `https://www.imdb.com/title/${movie.imdbId}` : null

  const latinTagline =
    movie.tagline && !containsCyrillic(movie.tagline) ? movie.tagline.trim() : null
  const alternateAsQuotedLine =
    !latinTagline &&
    movie.alternateDisplayTitle &&
    !containsCyrillic(movie.alternateDisplayTitle) &&
    movie.alternateDisplayTitle.trim().toLowerCase() !== movie.title.trim().toLowerCase()
      ? movie.alternateDisplayTitle.trim()
      : null
  const heroQuotedLine = latinTagline ?? alternateAsQuotedLine
  const showOriginalTitle =
    movie.originalTitle.trim().toLowerCase() !== movie.title.trim().toLowerCase() &&
    !containsCyrillic(movie.originalTitle)
  /** Латинское второе имя под теглайном, если оригинальное название на кириллице, а теглайн уже латинский. */
  const mutedSecondTitle = showOriginalTitle
    ? movie.originalTitle.trim()
    : latinTagline &&
        containsCyrillic(movie.originalTitle) &&
        movie.originalTitle.trim().toLowerCase() !== movie.title.trim().toLowerCase() &&
        movie.alternateDisplayTitle &&
        !containsCyrillic(movie.alternateDisplayTitle) &&
        movie.alternateDisplayTitle.trim().toLowerCase() !== movie.title.trim().toLowerCase() &&
        movie.alternateDisplayTitle.trim().toLowerCase() !== latinTagline.toLowerCase()
      ? movie.alternateDisplayTitle.trim()
      : null
  const displayOverview =
    movie.overview.trim() && !containsCyrillic(movie.overview) ? movie.overview.trim() : null

  const backdropUrl = movie.backdropPath ? getImageUrl(movie.backdropPath, 'original') : ''
  /** Full-bleed blur only (no sharp poster card in hero) */
  const posterBlurSrc = movie.posterPath ? getImageUrl(movie.posterPath, 'w500') : null

  const scorePercent = movie.voteAverage > 0 ? (movie.voteAverage / 10) * 100 : 0
  const ringR = 38
  const ringCirc = Number((2 * Math.PI * ringR).toFixed(3))
  const ringOffset = Number((ringCirc * (1 - scorePercent / 100)).toFixed(3))

  const releaseDateFull = movie.releaseDate
    ? new Date(movie.releaseDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const genreNames = movie.genres.map((g) => g.name).join(', ')

  function watchTypeClass(t: (typeof movie.watchRows)[number]['type']): string {
    switch (t) {
      case 'Stream':
        return styles.typeStream ?? ''
      case 'Free':
        return styles.typeFree ?? ''
      case 'Rent':
        return styles.typeRent ?? ''
      default:
        return styles.typeBuy ?? ''
    }
  }

  type MetaRow = {
    label: string
    href: string | null
    text: string
    accent?: 'profit' | 'loss' | 'ok' | 'warn'
  }
  const metaRows: MetaRow[] = [
    ...(imdbUrl
      ? [
          {
            label: 'IMDb Rating',
            href: imdbUrl,
            text: movie.imdbRating != null ? `${movie.imdbRating.toFixed(1)}/10` : 'N/A',
          },
        ]
      : []),
    ...(showBoxOffice && movie.budget > 0
      ? [{ label: 'Budget', href: null, text: formatMoney(movie.budget) }]
      : []),
    ...(showBoxOffice && movie.revenue > 0
      ? [{ label: 'Revenue', href: null, text: formatMoney(movie.revenue) }]
      : []),
    ...(showBoxOffice && movie.budget > 0 && movie.revenue > 0
      ? [
          {
            label: 'Budget Result',
            href: null,
            text:
              movie.revenue >= movie.budget
                ? `In profit (+${formatMoney(Math.abs(movie.revenue - movie.budget))})`
                : `In loss (-${formatMoney(Math.abs(movie.revenue - movie.budget))})`,
            accent: movie.revenue >= movie.budget ? ('profit' as const) : ('loss' as const),
          },
        ]
      : []),
    ...(movie.productionCountries[0]
      ? [{ label: 'Country', href: null, text: movie.productionCountries[0].name }]
      : []),
    ...(movie.originalLanguage
      ? [{ label: 'Language', href: null, text: movie.originalLanguage.toUpperCase() }]
      : []),
    ...(movie.productionCompanies[0]
      ? [{ label: 'Studio', href: null, text: movie.productionCompanies[0].name }]
      : []),
    ...(movie.status
      ? [
          {
            label: 'Status',
            href: null,
            text: movie.status,
            accent: movie.status === 'Released' ? ('ok' as const) : ('warn' as const),
          },
        ]
      : []),
    ...(releaseDateFull ? [{ label: 'Released', href: null, text: releaseDateFull }] : []),
    ...(movie.homepage
      ? [
          {
            label: 'Official Site',
            href: movie.homepage,
            text: 'Official site',
          },
        ]
      : []),
  ]

  const streamOrFree = movie.watchRows.filter((r) => r.type === 'Stream' || r.type === 'Free')
  const tableLead =
    streamOrFree.length > 0
      ? `${movie.title}${yearLabel ? ` (${yearLabel})` : ''} is available on ${streamOrFree.map((r) => r.name).join(', ')}.`
      : `${movie.title}${yearLabel ? ` (${yearLabel})` : ''} streaming availability varies by region.`

  const topCastNames =
    movie.starsForMeta.length > 0
      ? movie.starsForMeta
          .slice(0, 4)
          .map((a) => a.name)
          .join(', ')
      : movie.cast
          .slice(0, 4)
          .map((a) => a.name)
          .join(', ')
  const topProviderNames = streamOrFree
    .slice(0, 4)
    .map((r) => r.name)
    .join(', ')
  const watchCommitment =
    movie.runtime == null
      ? 'Runtime is not listed yet.'
      : movie.runtime <= 95
        ? `It is a short watch at about ${runtimeLabel}.`
        : movie.runtime <= 130
          ? `It runs about ${runtimeLabel}, which is a standard movie length.`
          : `It runs about ${runtimeLabel}, so plan a longer watch session.`
  const ratingRead =
    movie.voteAverage > 0
      ? movie.voteAverage >= 7.5
        ? 'Reception is strong overall.'
        : movie.voteAverage >= 6.5
          ? 'Reception is mixed-to-positive.'
          : 'Reception is mixed, so trailer and genre fit matter more.'
      : 'TMDB rating is not available yet.'
  const collectionHint =
    movie.collection && movie.collection.parts.length > 1
      ? `${movie.title} belongs to the "${movie.collection.name}" collection, so checking previous entries may improve context.`
      : `${movie.title} works as a standalone watch for most viewers.`
  const audienceHint = movie.ageRatingBadge
    ? `Age guidance shown on this page: ${movie.ageRatingBadge}.`
    : 'No age guidance is listed on this page yet.'

  const visibleFaq = [
    {
      question: `Where can I watch ${movie.title}?`,
      answer:
        topProviderNames.length > 0
          ? `${movie.title}${yearLabel ? ` (${yearLabel})` : ''} is currently available on ${topProviderNames}. You can also find rental and purchase options in the "Where to Watch" section. Availability depends on your region and may change over time.`
          : `${movie.title}${yearLabel ? ` (${yearLabel})` : ''} streaming availability varies by region. Check the provider table for the latest streaming, rental, and purchase options.`,
    },
    ...(displayOverview
      ? [
          {
            question: `What is ${movie.title} about?`,
            answer: displayOverview,
          },
        ]
      : []),
    {
      question: `Should I watch ${movie.title} tonight?`,
      answer:
        `${ratingRead} ${watchCommitment} ${genreNames ? `Best match if you enjoy ${genreNames}.` : ''}`.trim(),
    },
    ...(movie.director
      ? [
          {
            question: `Who directed ${movie.title} and who stars in it?`,
            answer: `${movie.director.name} directed ${movie.title}. ${topCastNames ? `Main cast includes ${topCastNames}.` : 'Cast details are listed in the Cast section.'}`,
          },
        ]
      : []),
    ...(releaseDateFull || runtimeLabel || movie.status
      ? [
          {
            question: `When was ${movie.title} released and what is the runtime?`,
            answer:
              `${releaseDateFull ? `Release date: ${releaseDateFull}. ` : ''}${runtimeLabel ? `Runtime: ${runtimeLabel}. ` : ''}${movie.status ? `Current status: ${movie.status}.` : ''}`.trim(),
          },
        ]
      : []),
    ...(genreNames || movie.productionCountries[0] || movie.originalLanguage
      ? [
          {
            question: `What genre is ${movie.title}?`,
            answer:
              `${genreNames ? `Genres: ${genreNames}. ` : ''}${movie.productionCountries[0] ? `Country: ${movie.productionCountries[0].name}. ` : ''}${movie.originalLanguage ? `Original language: ${movie.originalLanguage.toUpperCase()}.` : ''}`.trim(),
          },
        ]
      : []),
    {
      question: `Is ${movie.title} family-friendly?`,
      answer: `${audienceHint} Use the trailer and synopsis to judge fit for younger viewers in your household.`,
    },
    ...(isTvLike
      ? [
          {
            question: `Do I need to watch earlier episodes first?`,
            answer:
              `For the best context, start ${movie.title} from season 1, episode 1. ` +
              `If you prefer a quick check, watch the trailer and read the synopsis first.`,
          },
        ]
      : [
          {
            question: `Do I need to watch previous movies first?`,
            answer: collectionHint,
          },
        ]),
    ...(movie.voteAverage > 0
      ? [
          {
            question: `Is ${movie.title} highly rated?`,
            answer: `${movie.title} has a TMDB score of ${movie.voteAverage.toFixed(1)}/10${movie.voteCount > 0 ? ` based on ${formatVoteCount(movie.voteCount)} votes` : ''}. User taste differs, so check the trailer, synopsis, and cast before deciding.`,
          },
        ]
      : []),
  ]

  const hasWatchProvidersPanel = Boolean(
    movie.watchProvidersUs &&
    (movie.watchProvidersUs.stream.length > 0 ||
      movie.watchProvidersUs.rent.length > 0 ||
      movie.watchProvidersUs.buy.length > 0)
  )
  const hasCrewRows = Boolean(
    movie.director || movie.writers.length > 0 || movie.starsForMeta.length > 0
  )
  const similarOthers = movie.similar.filter((m) => m.id !== movie.id)
  const collectionOthers =
    movie.collection && movie.collection.parts.some((m) => m.id !== movie.id)
      ? { ...movie.collection, parts: movie.collection.parts.filter((m) => m.id !== movie.id) }
      : null
  const genreLinks =
    movie.genres.length > 0
      ? movie.genres.slice(0, 4).map((g) => (
          <Link key={g.id} href={`${genreQueryPrefix}${g.id}`} className={styles.genrePill}>
            {g.name}
          </Link>
        ))
      : null

  return (
    <div className={styles.page}>
      {(backdropUrl || posterBlurSrc) && (
        <div className={styles.pageAmbient} aria-hidden>
          <div
            className={styles.pageAmbientInner}
            style={{ backgroundImage: `url(${backdropUrl || posterBlurSrc})` }}
          />
        </div>
      )}
      <header className={styles.hero}>
        <div className={styles.heroBackdropReveal}>
          {/* Mobile: portrait poster fits portrait screens perfectly */}
          {posterBlurSrc && (
            <div className={`${styles.heroMediaFill} ${styles.heroMobileBg}`}>
              <MovieHeroBackdropImage
                focalAssetKey={`${movie.id}-hero-poster-${movie.posterPath ?? ''}`}
                src={posterBlurSrc}
                alt=""
                fill
                priority
                fetchPriority="high"
                sizes="100vw"
                className={styles.heroImgPoster}
                placeholder="blur"
                blurDataURL={POSTER_BLUR}
              />
            </div>
          )}
          {/* Desktop: landscape backdrop fits wide screens, no cropping */}
          {backdropUrl && (
            <div className={`${styles.heroMediaFill} ${styles.heroDesktopBg}`}>
              <MovieHeroBackdropImage
                focalAssetKey={`${movie.id}-hero-bd-${movie.backdropPath ?? ''}`}
                src={getImageUrl(movie.backdropPath, 'original')}
                alt=""
                fill
                priority
                fetchPriority="high"
                sizes="100vw"
                className={styles.heroImgCover}
                placeholder="blur"
                blurDataURL={POSTER_BLUR}
              />
            </div>
          )}
          {!posterBlurSrc && !backdropUrl && <div className={styles.heroSolid} />}
        </div>

        <div className={styles.heroForeground}>
          <div className={styles.heroNav}>
            <Link href={backHref} className={styles.backLink}>
              <IconChevronLeft />
              {backLabel}
            </Link>
          </div>

          <div className={styles.heroLayoutNoPoster}>
            <div className={styles.heroCopy}>
              {genreLinks != null && <div className={styles.heroGenresAbove}>{genreLinks}</div>}
              <h1 className={styles.heroTitle}>{movie.title.replace(/["""''«»]/g, '')}</h1>
              {heroQuotedLine && <p className={styles.heroTagline}>“{heroQuotedLine}”</p>}
              {mutedSecondTitle && <p className={styles.heroOriginal}>{mutedSecondTitle}</p>}
              <div className={styles.heroMeta}>
                <div
                  className={styles.heroMetaPanel}
                  role="group"
                  aria-label="Release year, runtime, user score, age rating, and genres"
                >
                  <div className={styles.heroMetaTrack}>
                    {yearLabel && <span className={styles.heroYear}>{yearLabel}</span>}
                    {runtimeLabel && (
                      <>
                        {yearLabel && (
                          <span className={styles.metaDot} aria-hidden>
                            ·
                          </span>
                        )}
                        <span className={styles.metaIconRow}>
                          <IconClock />
                          {runtimeLabel}
                        </span>
                      </>
                    )}
                    {movie.voteAverage > 0 && (
                      <>
                        {(yearLabel || runtimeLabel) && (
                          <span className={styles.metaDot} aria-hidden>
                            ·
                          </span>
                        )}
                        <span className={styles.metaIconRow}>
                          <IconStar className={styles.starGold ?? ''} />
                          <strong>{movie.voteAverage.toFixed(1)}</strong>
                          <span className={styles.rateTen}>/ 10</span>
                        </span>
                      </>
                    )}
                    {movie.ageRatingBadge && (
                      <>
                        {(yearLabel || runtimeLabel || movie.voteAverage > 0) && (
                          <span className={styles.metaDot} aria-hidden>
                            ·
                          </span>
                        )}
                        <span className={styles.heroAgeText}>{movie.ageRatingBadge}</span>
                      </>
                    )}
                    {genreLinks != null && (
                      <>
                        {(yearLabel ||
                          runtimeLabel ||
                          movie.voteAverage > 0 ||
                          movie.ageRatingBadge) && (
                          <span className={styles.metaDot} aria-hidden>
                            ·
                          </span>
                        )}
                        <div className={styles.heroGenresInline}>{genreLinks}</div>
                      </>
                    )}
                    {movie.status && movie.status !== 'Released' && (
                      <>
                        <span className={styles.metaDot}>·</span>
                        <span className={styles.statusPill}>{movie.status}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className={styles.desktopMetaFeedback}>
                  <MovieOverviewFeedback movieId={movie.id} feedbackScope={feedbackScope} />
                </div>
                <MovieHeroTrailerActions
                  movieId={movie.id}
                  movieTitle={movie.title}
                  hasTrailer={Boolean(trailerKey)}
                  embedTitle={
                    movie.trailer
                      ? `${movie.title} — ${movie.trailer.name}`
                      : `${movie.title} trailer`
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div id="movie-page-primary" className={styles.container}>
        <div className={styles.twoCol}>
          {/* ── Desktop sidebar: poster + actions + like/dislike + providers ── */}
          <aside className={styles.desktopSidebar}>
            {posterBlurSrc && (
              <Image
                src={posterBlurSrc}
                alt={`${movie.title} poster`}
                width={240}
                height={360}
                sizes="240px"
                className={styles.sidebarPoster}
                placeholder="blur"
                blurDataURL={POSTER_BLUR}
              />
            )}

            <div className={styles.sidebarActionsContext}>
              <MovieHeroTrailerActions
                movieId={movie.id}
                movieTitle={movie.title}
                hasTrailer={Boolean(trailerKey)}
                embedTitle={
                  movie.trailer
                    ? `${movie.title} — ${movie.trailer.name}`
                    : `${movie.title} trailer`
                }
              />
            </div>
          </aside>

          <div className={styles.main}>
            {displayOverview && (
              <>
                <div className={`${styles.overviewFeedbackRow} ${styles.mobileOnlyFeedback}`}>
                  <MovieOverviewFeedback movieId={movie.id} feedbackScope={feedbackScope} />
                </div>
                <div className={styles.scoreGrid}>
                  {/* rule 52: 2 рейтинга — TMDB (критики/зрители) + пользовательский */}
                  {/* rule 55: <10 оценок = "No ratings yet" */}
                  {isRatingReliable(movie.voteCount) && movie.voteAverage > 0 ? (
                    <div className={styles.scoreCard}>
                      <div className={styles.scoreRing}>
                        <svg
                          viewBox="0 0 100 100"
                          className={styles.scoreSvg}
                          aria-hidden
                          style={{ ['--ring-circumference' as string]: String(ringCirc) }}
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r={ringR}
                            fill="none"
                            className={styles.scoreTrack}
                            strokeWidth="8"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r={ringR}
                            fill="none"
                            className={styles.scoreArc}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={ringCirc}
                            strokeDashoffset={ringOffset}
                          />
                        </svg>
                        <div className={styles.scoreCenter}>
                          {/* rule 56: ⭐ для TMDB рейтинга */}
                          <span className={styles.scoreNum}>{movie.voteAverage.toFixed(1)}</span>
                          <span className={styles.scoreFrac}>/10</span>
                        </div>
                      </div>
                      <div className={styles.scoreCaptions}>
                        <span className={styles.scoreLabelMain}>
                          <IconStar className={styles.scoreLabelStar ?? ''} />
                          TMDB Score
                        </span>
                        {movie.voteCount > 0 && (
                          <span className={styles.scoreVotes}>
                            Liked by {formatVoteCount(movie.voteCount)} people
                          </span>
                        )}
                        {(() => {
                          const s = getScoreSentiment(movie.voteAverage)
                          return (
                            <div className={styles.scoreBarWrap}>
                              <div
                                className={styles.scoreBarFill}
                                style={{
                                  width: `${(movie.voteAverage / 10) * 100}%`,
                                  background: s.color,
                                }}
                              />
                            </div>
                          )
                        })()}
                        <span
                          className={styles.scoreSentiment}
                          style={{ color: getScoreSentiment(movie.voteAverage).color }}
                        >
                          {getScoreSentiment(movie.voteAverage).label}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.scoreCard}>
                      <div className={styles.scoreRing}>
                        <svg viewBox="0 0 100 100" className={styles.scoreSvg} aria-hidden>
                          <circle
                            cx="50"
                            cy="50"
                            r={ringR}
                            fill="none"
                            className={styles.scoreTrack}
                            strokeWidth="8"
                          />
                        </svg>
                        <div className={styles.scoreCenter}>
                          <span className={styles.scoreNumMuted}>—</span>
                        </div>
                      </div>
                      <div className={styles.scoreCaptions}>
                        <span className={styles.scoreLabelMain}>
                          <IconStar className={styles.scoreLabelStar ?? ''} />
                          TMDB Score
                        </span>
                        {/* rule 55: честно показываем что оценок нет */}
                        <span className={styles.scoreNoRating}>No ratings yet</span>
                      </div>
                    </div>
                  )}
                  {/* rule 52: второй рейтинг — пользовательский (rule 54: кликабельная звезда) */}
                  <div className={styles.scoreCardMuted}>
                    <MovieUserRatingCard movieId={movie.id} movieTitle={movie.title} />
                  </div>
                </div>
                <section className={styles.overviewBlock} aria-labelledby="movie-overview-heading">
                  <h2 id="movie-overview-heading" className={styles.overviewTitle}>
                    Synopsis
                  </h2>
                  <MovieOverviewBlock text={displayOverview} />
                </section>
              </>
            )}
            <div className={styles.pageTools} aria-label="Watch and share">
              <div className={styles.pageToolsBtns}>
                <MovieShareButton title={movie.title} className={styles.shareFull ?? ''} />
              </div>
              {hasWatchProvidersPanel && movie.watchProvidersUs && (
                <div className={styles.sidebarProviders}>
                  <MovieWatchProvidersPanel
                    providers={movie.watchProvidersUs}
                    movieTitle={movie.title}
                    className={styles.providersSidebar ?? ''}
                  />
                </div>
              )}
            </div>

            {trailerKey && (
              <section
                id="trailer"
                className={styles.trailerSection}
                aria-labelledby="movie-trailer-heading"
              >
                <h2 id="movie-trailer-heading" className={styles.overviewTitle}>
                  Trailer
                </h2>
                <MovieTrailerBlock
                  videoKey={trailerKey}
                  embedTitle={
                    movie.trailer
                      ? `${movie.title} — ${movie.trailer.name}`
                      : `${movie.title} trailer`
                  }
                  boxClassName={styles.trailerBox}
                />
              </section>
            )}

            {(hasCrewRows || metaRows.length > 0) && (
              <div className={styles.factsSplit}>
                {hasCrewRows && (
                  <section className={styles.factsSection} aria-label="Movie credits">
                    <div id="movie-credits" className={styles.crew}>
                      {movie.director && (
                        <div className={styles.crewRow}>
                          <span className={styles.crewKey}>Director</span>
                          <Link
                            href={personPath(movie.director.id, movie.director.name)}
                            className={styles.crewLink}
                          >
                            {movie.director.name}
                          </Link>
                        </div>
                      )}
                      {movie.writers.length > 0 && (
                        <div className={styles.crewRow}>
                          <span className={styles.crewKey}>Writers</span>
                          <div className={styles.crewLinks}>
                            {movie.writers.map((w) => (
                              <Link
                                key={w.id}
                                href={personPath(w.id, w.name)}
                                className={styles.crewLink}
                              >
                                {w.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      {movie.starsForMeta.length > 0 && (
                        <div className={styles.crewRow}>
                          <span className={styles.crewKey}>Stars</span>
                          <div className={styles.crewLinks}>
                            {movie.starsForMeta.slice(0, 6).map((a) => (
                              <Link
                                key={a.id}
                                href={personPath(a.id, a.name)}
                                className={styles.crewLink}
                              >
                                {a.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      {runtimeLabel && (
                        <div className={styles.crewRow}>
                          <span className={styles.crewKey}>Runtime</span>
                          <span className={styles.crewValue}>{runtimeLabel}</span>
                        </div>
                      )}
                      {showOriginalTitle && (
                        <div className={styles.crewRow}>
                          <span className={styles.crewKey}>Original Title</span>
                          <span className={styles.crewValue}>{movie.originalTitle}</span>
                        </div>
                      )}
                      {movie.genres.length > 0 && (
                        <div className={styles.crewRow}>
                          <span className={styles.crewKey}>Genres</span>
                          <div className={styles.crewValues}>
                            {movie.genres.slice(0, 4).map((g) => (
                              <span key={g.id} className={styles.crewValue}>
                                {g.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {movie.collection && (
                        <div className={styles.crewRow}>
                          <span className={styles.crewKey}>Collection</span>
                          <span className={styles.crewValue}>{movie.collection.name}</span>
                        </div>
                      )}
                      {movie.ageRatingBadge && (
                        <div className={styles.crewRow}>
                          <span className={`${styles.crewKey} ${styles.crewKeyWide}`}>
                            Age Rating
                          </span>
                          <span className={styles.crewValue}>{movie.ageRatingBadge}</span>
                        </div>
                      )}
                      {movie.voteCount > 0 && (
                        <div className={styles.crewRow}>
                          <span className={`${styles.crewKey} ${styles.crewKeyWide}`}>
                            TMDB Votes
                          </span>
                          <span className={styles.crewValue}>
                            {formatVoteCount(movie.voteCount)}
                          </span>
                        </div>
                      )}
                      {streamOrFree.length > 0 && (
                        <div className={styles.crewRow}>
                          <span className={styles.crewKey}>Streaming On</span>
                          <span className={styles.crewValue}>
                            {streamOrFree
                              .slice(0, 3)
                              .map((r) => r.name)
                              .join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {metaRows.length > 0 && (
                  <section className={styles.factsSection} aria-label="Movie details">
                    <div className={styles.metaGrid}>
                      {metaRows.map((row) => (
                        <div key={row.label} className={styles.metaChip}>
                          <span className={styles.metaKey}>{row.label}</span>
                          {row.href ? (
                            row.href.startsWith('http') ? (
                              <a
                                href={row.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.metaVal}
                              >
                                {row.text}
                              </a>
                            ) : (
                              <Link href={row.href} className={styles.metaVal}>
                                {row.text}
                              </Link>
                            )
                          ) : (
                            <span
                              className={`${styles.metaVal} ${
                                row.accent === 'profit' || row.accent === 'ok'
                                  ? styles.accentOk
                                  : row.accent === 'loss'
                                    ? styles.accentLoss
                                    : row.accent === 'warn'
                                      ? styles.accentWarn
                                      : ''
                              }`}
                            >
                              {row.text}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {movie.watchRows.length > 0 && (
              <section className={styles.watchTableSection} aria-labelledby="where-heading">
                <h2 id="where-heading" className={styles.sectionHeading}>
                  <span className={styles.sectionBar} aria-hidden />
                  Where to Watch {movie.title}
                </h2>
                <p className={styles.watchLead}>
                  {tableLead}
                  {movie.watchRows.some((r) => r.type === 'Rent')
                    ? ' Also available for digital rental.'
                    : ''}
                  {movie.watchRows.some((r) => r.type === 'Buy') ? ' Available for purchase.' : ''}
                </p>
                <div className={styles.tableScroll}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col">Service</th>
                        <th scope="col">Type</th>
                        <th scope="col">Quality</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movie.watchRows.map((row, i) => (
                        <tr
                          key={`${row.name}-${row.type}-${i}`}
                          className={i % 2 === 1 ? (styles.trAlt ?? '') : ''}
                        >
                          <td>{row.name}</td>
                          <td>
                            <span className={`${styles.typePill} ${watchTypeClass(row.type)}`}>
                              {row.type}
                            </span>
                          </td>
                          <td>{row.quality}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {hasWatchProvidersPanel && movie.watchProvidersUs && (
              <div className={styles.desktopMainProviders}>
                <MovieWatchProvidersPanel
                  providers={movie.watchProvidersUs}
                  movieTitle={movie.title}
                  className={styles.providersSidebar ?? ''}
                />
              </div>
            )}

            <MoviePhotosSection images={movie.backdropGallery} title={movie.title} />
            <MovieCastSection cast={movie.cast} />

            {hasWatchProvidersPanel && <div className={styles.hr} />}

            {hasWatchProvidersPanel && movie.watchProvidersUs && (
              <div className={styles.mobileProviders}>
                <MovieWatchProvidersPanel
                  providers={movie.watchProvidersUs}
                  movieTitle={movie.title}
                />
              </div>
            )}
          </div>
        </div>

        {visibleFaq.length > 0 && <MovieFaqAccordion items={visibleFaq} movieTitle={movie.title} />}

        {isTvLike && <TvSeriesEpisodes seriesId={movie.id} seriesTitle={movie.title} />}

        {collectionOthers && collectionOthers.parts.length > 0 && (
          <MovieCollectionSection
            title={collectionOthers.name}
            parts={collectionOthers.parts}
            mediaKind={similarMediaKind}
          />
        )}

        {similarOthers.length > 0 && (
          <MovieCollectionSection
            title="More Like This"
            parts={similarOthers}
            mediaKind={similarMediaKind}
          />
        )}
      </div>
    </div>
  )
}
