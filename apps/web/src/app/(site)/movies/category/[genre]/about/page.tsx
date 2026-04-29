import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMovieGenreHubContent } from '@/lib/movieGenreHubContent'
import { buildCollectionPageStructuredData } from '@/lib/jsonLdSite'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'
import {
  discoverMoviesBrowse,
  discoverStateToBrowseInput,
  enrichMovieShelfRuntime,
  getMovieGenresList,
  getMoviePageDataShell,
  getMovieStudiosList,
  mapTmdbMovieRowToShelfItem,
  parseMoviesDiscoverSearchParams,
} from '@/lib/tmdb'
import { movieGenreIdToSlug, movieGenreSlugToId } from '@/lib/movieGenreRoute'
import { buildEntitySearchHref } from '@/lib/entitySearch'
import { detailPathForShelfItem } from '@/lib/slug'
import hubStyles from '../hub.module.css'

/** @sync `ROUTE_REVALIDATE_DISCOVER_HUB` in `@/lib/cachePolicy` */
export const revalidate = 600

type PageProps = {
  params: Promise<{ genre: string }>
}

interface GenreLinkItem {
  href: string
  label: string
}

function lower(s: string): string {
  return s.trim().toLowerCase()
}

function topByCount(counts: Map<string, number>, limit: number, exclude?: Set<string>): string[] {
  return [...counts.entries()]
    .filter(([key]) => (exclude == null ? true : !exclude.has(key)))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { genre: genreSlug } = await params
  const genreId = movieGenreSlugToId(genreSlug)
  if (!genreId) return { title: 'Not Found — MegDB' }

  const genres = await getMovieGenresList().catch(() => [])
  const genreName = genres.find((g) => String(g.id) === genreId)?.name ?? 'Genre'
  const hubContent = getMovieGenreHubContent(genreSlug, genreName)
  const title = `${genreName} Movies Hub Guide — MegDB`
  const description = hubContent.intro
  const path = `/movies/category/${genreSlug}/about`

  return {
    title,
    description,
    alternates: discoverPageAlternates(path),
    ...discoverSocialMeta(title, description, path),
  }
}

export default async function MoviesGenreAboutPage({ params }: PageProps) {
  const { genre: genreSlug } = await params
  const genreId = movieGenreSlugToId(genreSlug)
  if (!genreId) notFound()

  const state = parseMoviesDiscoverSearchParams({ genre: genreId })
  const { input, mode, comingYear } = discoverStateToBrowseInput(state, 1)

  const [genres, studios, results] = await Promise.all([
    getMovieGenresList(),
    getMovieStudiosList(),
    discoverMoviesBrowse(input, mode, comingYear),
  ])

  const initialItems = await enrichMovieShelfRuntime(
    results.results.map(mapTmdbMovieRowToShelfItem)
  )
  const currentGenre = genres.find((g) => String(g.id) === genreId)
  const genreName = currentGenre?.name ?? 'Genre'
  const hubContent = getMovieGenreHubContent(genreSlug, genreName)
  const topMovies = initialItems.slice(0, 12)
  const topMovieIdsForEntitySignals = topMovies.slice(0, 8).map((movie) => movie.id)
  const topMovieShells = (
    await Promise.all(topMovieIdsForEntitySignals.map((id) => getMoviePageDataShell(id)))
  ).filter(
    (item): item is NonNullable<Awaited<ReturnType<typeof getMoviePageDataShell>>> => item != null
  )

  const genreNameToSlug = new Map<string, string>()
  for (const g of genres) {
    const slug = movieGenreIdToSlug(String(g.id))
    if (!slug) continue
    genreNameToSlug.set(lower(g.name), `/movies/category/${slug}`)
  }
  const genreCounts = new Map<string, number>()
  for (let index = 0; index < topMovies.length; index += 1) {
    const movie = topMovies[index]!
    const weight = Math.max(1, 5 - Math.floor(index / 2))
    for (const g of movie.genres) {
      const key = lower(g)
      genreCounts.set(key, (genreCounts.get(key) ?? 0) + weight)
    }
  }

  const fallbackRelatedGenres: GenreLinkItem[] = []
  for (const slug of hubContent.relatedGenreSlugs) {
    const linkedGenreId = movieGenreSlugToId(slug)
    if (!linkedGenreId) continue
    const linkedGenre = genres.find((g) => String(g.id) === linkedGenreId)
    if (!linkedGenre) continue
    fallbackRelatedGenres.push({
      href: `/movies/category/${slug}`,
      label: linkedGenre.name,
    })
  }
  const relatedGenreCandidates = topByCount(genreCounts, 6, new Set([lower(genreName)]))
  const relatedGenreLinks: GenreLinkItem[] = []
  for (const genreLower of relatedGenreCandidates) {
    const href = genreNameToSlug.get(genreLower)
    if (!href) continue
    const label = genres.find((g) => lower(g.name) === genreLower)?.name
    if (!label) continue
    relatedGenreLinks.push({ href, label })
  }
  const semanticRelatedGenres =
    relatedGenreLinks.length > 0 ? relatedGenreLinks : fallbackRelatedGenres

  const actorCounts = new Map<string, { id: number; name: string; score: number }>()
  const studioCounts = new Map<string, { name: string; score: number }>()
  const collectionCounts = new Map<string, number>()
  for (let shellIndex = 0; shellIndex < topMovieShells.length; shellIndex += 1) {
    const shell = topMovieShells[shellIndex]!
    const shellWeight = Math.max(1, 5 - Math.floor(shellIndex / 2))
    for (const cast of shell.cast.slice(0, 8)) {
      const key = String(cast.id)
      actorCounts.set(key, {
        id: cast.id,
        name: cast.name,
        score: (actorCounts.get(key)?.score ?? 0) + shellWeight,
      })
    }
    for (const company of shell.productionCompanies.slice(0, 6)) {
      const key = lower(company.name)
      studioCounts.set(key, {
        name: company.name,
        score: (studioCounts.get(key)?.score ?? 0) + shellWeight,
      })
    }
    if (shell.belongsToCollectionMeta?.name) {
      const key = shell.belongsToCollectionMeta.name.trim()
      collectionCounts.set(key, (collectionCounts.get(key) ?? 0) + shellWeight)
    }
  }
  const semanticActors = [...actorCounts.values()]
    .filter((item) => item.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
  const semanticStudios = [...studioCounts.values()]
    .filter((item) => item.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
  const semanticCollections = [...collectionCounts.entries()]
    .filter(([, score]) => score >= 3)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
    .slice(0, 5)
  const semanticFranchises =
    semanticCollections.length > 0 ? semanticCollections : hubContent.relatedFranchises

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: hubContent.faq.map((qa) => ({
      '@type': 'Question',
      name: qa.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: qa.answer,
      },
    })),
  }
  const hubStructured = buildCollectionPageStructuredData({
    name: `${genreName} Movies Hub`,
    description: hubContent.intro,
    pathname: `/movies/category/${genreSlug}/about`,
    breadcrumbParent: {
      name: 'Movies',
      pathname: '/movies',
    },
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hubStructured.collectionPage) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hubStructured.breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <section className={hubStyles.hub} aria-label={`${genreName} editorial hub`}>
        <article className={hubStyles.teaserCard}>
          <h1 className={hubStyles.teaserTitle}>{genreName} Movies Hub</h1>
          <p className={hubStyles.teaserText}>{hubContent.intro}</p>
          <p className={hubStyles.teaserText}>{hubContent.categoryExplainer}</p>
          <Link href={`/movies/category/${genreSlug}`} className={hubStyles.teaserAction}>
            Back to category
          </Link>
        </article>
        <div className={hubStyles.grid}>
          <article className={hubStyles.card}>
            <h2 className={hubStyles.cardTitle}>How this category differs</h2>
            <ul className={hubStyles.list}>
              {hubContent.differentiators.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className={hubStyles.card}>
            <h2 className={hubStyles.cardTitle}>Common subgenres</h2>
            <ul className={hubStyles.list}>
              {hubContent.subgenres.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className={hubStyles.card}>
            <h2 className={hubStyles.cardTitle}>Top titles in this hub</h2>
            <div className={hubStyles.links}>
              {topMovies.map((movie) => (
                <Link
                  key={`${movie.type}-${movie.id}`}
                  href={detailPathForShelfItem(movie)}
                  className={hubStyles.chipLink}
                >
                  {movie.title}
                </Link>
              ))}
            </div>
          </article>
          <article className={hubStyles.card}>
            <h2 className={hubStyles.cardTitle}>Related entities</h2>
            <ul className={hubStyles.list}>
              {(semanticStudios.length > 0 ? semanticStudios : studios.slice(0, 4)).map(
                (studio) => {
                  const href = buildEntitySearchHref(studio.name)
                  return (
                    <li key={studio.name}>
                      {href ? (
                        <Link href={href} className={hubStyles.chipLink}>
                          {studio.name}
                        </Link>
                      ) : (
                        studio.name
                      )}
                    </li>
                  )
                }
              )}
              {(semanticActors.length > 0 ? semanticActors.slice(0, 4) : []).map((actor) => (
                <li key={actor.id}>
                  <Link href={`/person/${actor.id}`} className={hubStyles.chipLink}>
                    {actor.name}
                  </Link>
                </li>
              ))}
            </ul>
          </article>
          <article className={hubStyles.card}>
            <h2 className={hubStyles.cardTitle}>Similar genres</h2>
            <div className={hubStyles.links}>
              {semanticRelatedGenres.map((genre) => (
                <Link key={genre.href} href={genre.href} className={hubStyles.chipLink}>
                  {genre.label}
                </Link>
              ))}
            </div>
          </article>
          <article className={hubStyles.card}>
            <h2 className={hubStyles.cardTitle}>Franchises often linked with this genre</h2>
            <div className={hubStyles.links}>
              {semanticFranchises.map((item) => {
                const href = buildEntitySearchHref(item)
                if (!href) return <span key={item}>{item}</span>
                return (
                  <Link key={item} href={href} className={hubStyles.chipLink}>
                    {item}
                  </Link>
                )
              })}
            </div>
          </article>
          <article className={hubStyles.card}>
            <h2 className={hubStyles.cardTitle}>Related search hubs</h2>
            <div className={hubStyles.links}>
              <Link href="/search?q=mission+impossible" className={hubStyles.chipLink}>
                Mission Impossible
              </Link>
              <Link href="/search?q=john+wick" className={hubStyles.chipLink}>
                John Wick
              </Link>
              <Link href="/search?q=the+fast+saga" className={hubStyles.chipLink}>
                The Fast Saga
              </Link>
              <Link href="/search?q=mad+max" className={hubStyles.chipLink}>
                Mad Max
              </Link>
              <Link href="/search?q=the+matrix" className={hubStyles.chipLink}>
                The Matrix
              </Link>
              <Link href="/search?q=harry+potter" className={hubStyles.chipLink}>
                Harry Potter
              </Link>
              <Link href="/search?q=star+wars" className={hubStyles.chipLink}>
                Star Wars
              </Link>
              <Link href="/search?q=dune" className={hubStyles.chipLink}>
                Dune
              </Link>
            </div>
          </article>
        </div>
        <article className={hubStyles.card}>
          <h2 className={hubStyles.cardTitle}>FAQ</h2>
          <div className={hubStyles.faqList}>
            {hubContent.faq.map((qa) => (
              <details key={qa.question} className={hubStyles.faqItem}>
                <summary className={hubStyles.faqQuestion}>{qa.question}</summary>
                <p className={hubStyles.faqAnswer}>{qa.answer}</p>
              </details>
            ))}
          </div>
        </article>
      </section>
    </>
  )
}
