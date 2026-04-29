import { ViewTransition, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { MoviePageDetail } from '@/lib/tmdb'
import { getImageUrl } from '@/lib/tmdb'
import { containsCyrillic } from '@/lib/textScript'
import type { DetailMediaKind } from '@/lib/slug'
import { movieGenrePathById } from '@/lib/movieGenreRoute'
import { blurHashToDataUrl } from '@/lib/blurhashToDataUrl'
import { MovieShareButton } from './MovieShareButton'
import { MovieWatchProvidersPanel } from './MovieWatchProvidersPanel'
import { MovieHeroBackdropImage } from './MovieHeroBackdropImage'
import { MovieHeroTrailerActions } from './MovieHeroTrailerActions'
import { MoviePrimarySummaryPanel } from './MoviePrimarySummaryPanel'
import {
  MovieCastSectionLazy,
  MovieCollectionSectionLazy,
  MovieFaqAccordionLazy,
  MoviePhotosSectionLazy,
  MovieTrailerBlockLazy,
} from './MovieDetailBelowFoldDynamics'
import { MovieCommentsRoot } from './MovieCommentsRoot.client'
import { FadeInView } from '@/components/FadeInView/FadeInView'
import { ChevronLeft, Star, Clock } from 'lucide-react'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import styles from './MovieDetailPage.module.css'

const POSTER_BLUR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
const MAX_BLUR_DATA_URL_LENGTH = 1200

function formatRuntimeMinutes(total: number): string {
  if (total < 60) return `${total}m`
  const h = Math.floor(total / 60)
  const m = total % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

/** rule 53: сокращение числа голосов — 128456 → 128K */
function formatVoteCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(n)
}

interface MoviePageBreadcrumbProps {
  movie: MoviePageDetail
}

/** In-content trail — matches JSON-LD labels; not shown in header on `/movie/…`. */
function MoviePageBreadcrumb({ movie }: MoviePageBreadcrumbProps) {
  const y =
    movie.releaseDate && movie.releaseDate.length >= 4
      ? Number(movie.releaseDate.slice(0, 4))
      : null
  const year = y != null && Number.isFinite(y) ? y : null
  const currentLabel = year ? `${movie.title} (${year})` : movie.title

  return (
    <nav className={styles.inlineBreadcrumb} aria-label="Breadcrumb">
      <ol className={styles.inlineBreadcrumbList}>
        <li className={styles.inlineBreadcrumbItem}>
          <Link href="/" className={styles.inlineBreadcrumbLink}>
            Home
          </Link>
        </li>
        <li className={styles.inlineBreadcrumbItem}>
          <Link href="/movies" className={styles.inlineBreadcrumbLink}>
            Movies
          </Link>
        </li>
        <li className={styles.inlineBreadcrumbItem}>
          <span className={styles.inlineBreadcrumbCurrent} aria-current="page">
            {currentLabel}
          </span>
        </li>
      </ol>
    </nav>
  )
}

function IconChevronLeft({ className }: { className?: string | undefined }) {
  return (
    <ChevronLeft
      className={[iconSlot.block, iconSlot.inline14, className].filter(Boolean).join(' ')}
      aria-hidden
    />
  )
}

function IconStar({ className }: { className?: string | undefined }) {
  return (
    <Star
      className={[iconSlot.block, iconSlot.inline14, className].filter(Boolean).join(' ')}
      fill="currentColor"
      aria-hidden
    />
  )
}

function IconClock({ className }: { className?: string | undefined }) {
  return (
    <Clock
      className={[iconSlot.block, iconSlot.inline14, className].filter(Boolean).join(' ')}
      aria-hidden
    />
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
  streamedBelowFold,
  tvEpisodesSection,
}: {
  movie: MoviePageDetail
  nav?: MovieDetailPageNav
  /** When set, photos + collection/similar rails render inside this slot (e.g. Suspense + RSC tail). */
  streamedBelowFold?: ReactNode
  /** TV-only episodes block passed from TV detail routes. */
  tvEpisodesSection?: ReactNode
}) {
  const backHref = nav?.backHref ?? '/movies'
  const backLabel = nav?.backLabel ?? 'All Movies'
  const genreQueryPrefix = nav?.genreQueryPrefix ?? '/movies?genre='
  const similarMediaKind = nav?.similarMediaKind ?? 'movie'
  const isTvLike = similarMediaKind === 'series' || similarMediaKind === 'tvshow'
  const showBoxOffice = nav?.showBoxOffice ?? !isTvLike
  const runtimeLabel = movie.runtime != null ? formatRuntimeMinutes(movie.runtime) : null
  const year =
    movie.releaseDate && movie.releaseDate.length >= 4
      ? Number(movie.releaseDate.slice(0, 4))
      : null
  const yearLabel = year != null && Number.isFinite(year) ? String(year) : null
  const trailerKey = movie.trailerYoutubeKey

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
  /** Full-bleed hero art (poster path for ambient color + Next image placeholder) */
  const posterBlurSrc = movie.posterPath ? getImageUrl(movie.posterPath, 'w500') : null
  const blurFromHash = blurHashToDataUrl(movie.blurHash, 16, 9)
  const heroBlurDataURL =
    blurFromHash && blurFromHash.length <= MAX_BLUR_DATA_URL_LENGTH ? blurFromHash : POSTER_BLUR

  const heroCarouselEnabled = false

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
  const collectionName = movie.collection?.name ?? movie.belongsToCollectionMeta?.name ?? null

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
    ...(movie.director
      ? [
          {
            question: `Who directed ${movie.title}?`,
            answer: `${movie.title} was directed by ${movie.director.name}.`,
          },
        ]
      : []),
    ...(topCastNames
      ? [
          {
            question: `Who are the key cast members in ${movie.title}?`,
            answer: `Key cast members include ${topCastNames}.`,
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
    ...(movie.ageRatingBadge
      ? [
          {
            question: `What is the age rating of ${movie.title}?`,
            answer: `${movie.title} is rated ${movie.ageRatingBadge}.`,
          },
        ]
      : []),
    ...(isTvLike
      ? [
          {
            question: `Do I need to watch earlier episodes before ${movie.title}?`,
            answer: `For full context, start from season 1, episode 1.`,
          },
        ]
      : [
          {
            question: `Is ${movie.title} part of a collection?`,
            answer: collectionName
              ? `${movie.title} is part of the "${collectionName}" collection.`
              : `${movie.title} is presented as a standalone title.`,
          },
        ]),
    ...(movie.voteAverage > 0
      ? [
          {
            question: `What is the TMDB rating of ${movie.title}?`,
            answer: `${movie.title} has a TMDB score of ${movie.voteAverage.toFixed(1)}/10${movie.voteCount > 0 ? ` based on ${formatVoteCount(movie.voteCount)} votes` : ''}.`,
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
  const similarOthers = movie.similar.filter((m) => m.id !== movie.id)
  const collectionOthers =
    movie.collection && movie.collection.parts.some((m) => m.id !== movie.id)
      ? { ...movie.collection, parts: movie.collection.parts.filter((m) => m.id !== movie.id) }
      : null
  const genreLinks =
    movie.genres.length > 0
      ? movie.genres.slice(0, 4).map((g) => (
          <Link
            key={g.id}
            href={movieGenrePathById(String(g.id)) ?? `${genreQueryPrefix}${g.id}`}
            className={styles.genrePill}
          >
            {g.name}
          </Link>
        ))
      : null
  return (
    <div id="movie-detail-page" className={styles.page}>
      <header className={styles.hero}>
          <div
            className={
              heroCarouselEnabled
                ? `${styles.heroBackdropReveal} ${styles.heroBackdropRevealCarousel}`
                : styles.heroBackdropReveal
            }
          >
            {/* Desktop: landscape backdrop fits wide screens, no carousel */}
            {backdropUrl && (
              <div className={`${styles.heroMediaFill} ${styles.heroDesktopBg}`}>
                <MovieHeroBackdropImage
                  focalAssetKey={`${movie.id}-hero-bd-${movie.backdropPath ?? ''}`}
                  disableAutoFocal
                  src={getImageUrl(movie.backdropPath, 'original')}
                  alt=""
                  fill
                  priority
                  fetchPriority="high"
                  sizes="100vw"
                  style={{
                    objectPosition: '100% 20%',
                    transform: 'scale(1.08) translateX(12%)',
                  }}
                  className={styles.heroImgCover}
                  placeholder="blur"
                  blurDataURL={heroBlurDataURL}
                />
              </div>
            )}
            {!posterBlurSrc && !backdropUrl && <div className={styles.heroSolid} />}
            <div className={styles.heroTint} />
            <div className={styles.heroVignette} />
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
                {posterBlurSrc && !heroCarouselEnabled && (
                  <ViewTransition name={`poster-${movie.id}`}>
                    <Image
                      src={posterBlurSrc}
                      alt={`${movie.title} poster`}
                      width={420}
                      height={630}
                      sizes="(max-width: 768px) 100vw, 500px"
                      className={styles.heroOnlyPoster}
                      priority
                      fetchPriority="high"
                      placeholder="blur"
                      blurDataURL={heroBlurDataURL}
                    />
                  </ViewTransition>
                )}
                <div className={styles.heroInfoHidden}>
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
                    <MovieHeroTrailerActions
                      movieId={movie.id}
                      mediaType={similarMediaKind}
                      movieTitle={movie.title}
                      releaseDate={movie.releaseDate}
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
                blurDataURL={heroBlurDataURL}
              />
            )}
          </aside>

          <div className={styles.main}>
            {posterBlurSrc && (
              <div className={styles.mobilePosterWrap}>
                <Image
                  src={posterBlurSrc}
                  alt={`${movie.title} poster`}
                  width={220}
                  height={330}
                  sizes="(max-width: 768px) 46vw, 220px"
                  className={styles.mobilePoster}
                  placeholder="blur"
                  blurDataURL={heroBlurDataURL}
                />
              </div>
            )}
            {!displayOverview && <MoviePageBreadcrumb movie={movie} />}
            {displayOverview && (
              <FadeInView>
                <MoviePrimarySummaryPanel
                  movie={movie}
                  mediaType={similarMediaKind}
                  displayOverview={displayOverview}
                  releaseDateFull={releaseDateFull}
                  runtimeLabel={runtimeLabel}
                  showBoxOffice={showBoxOffice}
                  genreQueryPrefix={genreQueryPrefix}
                  trailerEmbedTitle={
                    movie.trailer
                      ? `${movie.title} — ${movie.trailer.name}`
                      : `${movie.title} trailer`
                  }
                  trailerKey={trailerKey}
                />
                <MoviePageBreadcrumb movie={movie} />
              </FadeInView>
            )}
            <FadeInView delay={0.1}>
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
            </FadeInView>

            {trailerKey && (
              <FadeInView delay={0.05}>
                <section
                  id="trailer"
                  className={styles.trailerSection}
                  aria-labelledby="movie-trailer-heading"
                >
                  <h2 id="movie-trailer-heading" className={styles.overviewTitle}>
                    Trailer
                  </h2>
                  <MovieTrailerBlockLazy
                    videoKey={trailerKey}
                    embedTitle={
                      movie.trailer
                        ? `${movie.title} — ${movie.trailer.name}`
                        : `${movie.title} trailer`
                    }
                    boxClassName={styles.trailerBox}
                  />
                </section>
              </FadeInView>
            )}

            {movie.watchRows.length > 0 && (
              <FadeInView delay={0.05}>
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
                    {movie.watchRows.some((r) => r.type === 'Buy')
                      ? ' Available for purchase.'
                      : ''}
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
              </FadeInView>
            )}

            {isTvLike && hasWatchProvidersPanel && movie.watchProvidersUs && (
              <div className={styles.mobileProviders}>
                <MovieWatchProvidersPanel
                  providers={movie.watchProvidersUs}
                  movieTitle={movie.title}
                />
              </div>
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

            {streamedBelowFold ?? (
              <>
                <MoviePhotosSectionLazy images={movie.backdropGallery} title={movie.title} />
                <MovieCastSectionLazy cast={movie.cast} />
              </>
            )}

            {hasWatchProvidersPanel && <div className={styles.hr} />}

            {!isTvLike && hasWatchProvidersPanel && movie.watchProvidersUs && (
              <div className={styles.mobileProviders}>
                <MovieWatchProvidersPanel
                  providers={movie.watchProvidersUs}
                  movieTitle={movie.title}
                />
              </div>
            )}
          </div>
        </div>

        {visibleFaq.length > 0 && (
          <MovieFaqAccordionLazy items={visibleFaq} movieTitle={movie.title} />
        )}

        {!streamedBelowFold && isTvLike && tvEpisodesSection}

        {!streamedBelowFold && collectionOthers && collectionOthers.parts.length > 0 && (
          <MovieCollectionSectionLazy
            title={collectionOthers.name}
            parts={collectionOthers.parts}
            mediaKind={similarMediaKind}
          />
        )}

        {!streamedBelowFold && similarOthers.length > 0 && (
          <MovieCollectionSectionLazy
            title="More Like This"
            parts={similarOthers}
            mediaKind={similarMediaKind}
          />
        )}
        {!streamedBelowFold && (
          <MovieCommentsRoot
            tmdbMovieId={movie.id}
            movieTitle={movie.title}
            mediaKind={similarMediaKind}
          />
        )}
      </div>
    </div>
  )
}
