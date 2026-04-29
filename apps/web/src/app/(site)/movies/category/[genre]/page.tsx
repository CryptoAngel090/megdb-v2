import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MosaicHeroLcpPreload } from '@/components/MosaicHeroLcpPreload'
import { MoviesDiscoverPage } from '@/components/MoviesDiscoverPage/MoviesDiscoverPage'
import {
  getMoviesDiscoverCanonicalPath,
  getMoviesDiscoverDescription,
  getMoviesDiscoverHeroLead,
  getMoviesDiscoverKeywords,
  getMoviesDiscoverTitle,
} from '@/lib/moviesDiscoverCopy'
import { buildCollectionPageStructuredData } from '@/lib/jsonLdSite'
import { getMovieGenreHubContent } from '@/lib/movieGenreHubContent'
import { buildGenreHubSnippetTemplate } from '@/lib/seoSnippetTemplates'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'
import {
  discoverMoviesBrowse,
  discoverFetchKey,
  discoverStateToFetchParams,
  discoverStateToBrowseInput,
  enrichMovieShelfRuntime,
  getMovieGenresList,
  getMovieStudiosList,
  getTopMovies2026MosaicPosterUrls,
  getWatchProvidersMovieList,
  mapTmdbMovieRowToShelfItem,
  moviesDiscoverActiveFilterKeys,
  parseMoviesDiscoverSearchParams,
} from '@/lib/tmdb'
import { movieGenreSlugToId } from '@/lib/movieGenreRoute'
import hubStyles from './hub.module.css'

/** @sync `ROUTE_REVALIDATE_DISCOVER_HUB` in `@/lib/cachePolicy` */
export const revalidate = 600

type PageProps = {
  params: Promise<{ genre: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function withGenre(
  sp: Record<string, string | string[] | undefined>,
  genreId: string
): Record<string, string | string[] | undefined> {
  return { ...sp, genre: genreId }
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { genre: genreSlug } = await params
  const genreId = movieGenreSlugToId(genreSlug)
  if (!genreId) return { title: 'Not Found — MegDB' }

  const sp = await searchParams
  const state = parseMoviesDiscoverSearchParams(withGenre(sp, genreId))
  const keys = moviesDiscoverActiveFilterKeys(state)
  const genreOnly = state.genre && keys.length === 1 && keys[0] === 'genre'
  const needsGenres = genreOnly || (state.genre != null && keys.length > 1)
  const needsProviders = keys.includes('provider')
  const needsStudios = keys.includes('studio')

  const [allGenresRaw, providers, studios] = await Promise.all([
    needsGenres ? getMovieGenresList().catch(() => []) : Promise.resolve([]),
    needsProviders ? getWatchProvidersMovieList().catch(() => []) : Promise.resolve([]),
    needsStudios ? getMovieStudiosList().catch(() => []) : Promise.resolve([]),
  ])
  const genres = needsGenres ? allGenresRaw : []

  const ctx = { providers, studios }
  const description = getMoviesDiscoverDescription(state, genres, ctx)
  const title = getMoviesDiscoverTitle(state, genres, ctx)
  const path = getMoviesDiscoverCanonicalPath(state, genres, ctx)
  const keywords = getMoviesDiscoverKeywords(state, genres)
  const genreName = genres.find((g) => String(g.id) === genreId)?.name
  const isGenreHub = state.genre && keys.length === 1 && keys[0] === 'genre' && Boolean(genreName)
  const hubSnippet =
    isGenreHub && genreName
      ? buildGenreHubSnippetTemplate({ genreName, year: new Date().getFullYear() })
      : null
  const finalTitle = hubSnippet?.title ?? title
  const finalDescription = hubSnippet?.description ?? description

  if (keys.length > 1) {
    return {
      title: finalTitle,
      description: finalDescription,
      robots: { index: false, follow: true },
      alternates: discoverPageAlternates(path),
      ...discoverSocialMeta(finalTitle, finalDescription, path),
      ...(hubSnippet
        ? {
            other: {
              'megdb:snippet-cohort': hubSnippet.cohort,
            },
          }
        : {}),
    }
  }

  return {
    title: finalTitle,
    description: finalDescription,
    ...(keywords ? { keywords } : {}),
    alternates: discoverPageAlternates(path),
    ...discoverSocialMeta(finalTitle, finalDescription, path),
    ...(hubSnippet
      ? {
          other: {
            'megdb:snippet-cohort': hubSnippet.cohort,
          },
        }
      : {}),
  }
}

export default async function MoviesGenrePage({ params, searchParams }: PageProps) {
  const { genre: genreSlug } = await params
  const genreId = movieGenreSlugToId(genreSlug)
  if (!genreId) notFound()

  const sp = await searchParams
  const state = parseMoviesDiscoverSearchParams(withGenre(sp, genreId))
  const keys = moviesDiscoverActiveFilterKeys(state)
  const { input, mode, comingYear } = discoverStateToBrowseInput(state, 1)
  const fetchParams = discoverStateToFetchParams(state)
  const filterKey = discoverFetchKey(state)

  const MOSAIC_POSTER_CAP = 420

  const [genres, providers, studios, results, mosaicUrls] = await Promise.all([
    getMovieGenresList(),
    getWatchProvidersMovieList(),
    getMovieStudiosList(),
    discoverMoviesBrowse(input, mode, comingYear),
    getTopMovies2026MosaicPosterUrls(MOSAIC_POSTER_CAP),
  ])

  const initialItems = await enrichMovieShelfRuntime(
    results.results.map(mapTmdbMovieRowToShelfItem)
  )
  const currentGenre = genres.find((g) => String(g.id) === genreId)
  const genreName = currentGenre?.name ?? 'Genre'
  const genreHubCopy = getMovieGenreHubContent(genreSlug, genreName)
  const teaserSubtitle = genreHubCopy.intro
  const genreSeoTitle = `${genreName} Movies to Watch Online`
  const genreSeoSubtitle = genreHubCopy.categoryExplainer

  const moviesCopyCtx = { providers, studios }
  const heroDescription = getMoviesDiscoverHeroLead(state, genres, moviesCopyCtx)
  const hubStructured =
    keys.length > 1
      ? null
      : buildCollectionPageStructuredData({
          name: getMoviesDiscoverTitle(state, genres, moviesCopyCtx),
          description: getMoviesDiscoverDescription(state, genres, moviesCopyCtx),
          pathname: getMoviesDiscoverCanonicalPath(state, genres, moviesCopyCtx),
          breadcrumbParent: {
            name: 'Movies',
            pathname: '/movies',
          },
        })
  const trustUpdatedAtLabel = new Date().toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  })

  return (
    <>
      {hubStructured && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(hubStructured.collectionPage) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(hubStructured.breadcrumb) }}
          />
        </>
      )}
      <div className={hubStyles.genrePageShell}>
        {keys.length === 1 && keys[0] === 'genre' && (
          <section className={hubStyles.hub} aria-label={`${genreName} hub teaser`}>
            <article className={hubStyles.teaserCard}>
              <h1 className={hubStyles.teaserTitle}>{genreName} Movies</h1>
              <p className={hubStyles.teaserText}>{teaserSubtitle}</p>
              <Link href={`/movies/category/${genreSlug}/about`} className={hubStyles.teaserAction}>
                Open full genre guide
              </Link>
            </article>
          </section>
        )}
        <MosaicHeroLcpPreload href={mosaicUrls[0]} />
        <MoviesDiscoverPage
          discoverState={state}
          genres={genres}
          providers={providers}
          studios={studios}
          fetchParams={fetchParams}
          filterKey={filterKey}
          basePath="/movies"
          apiPath="/api/discover"
          pageTitle="Movies"
          seoTitle={genreSeoTitle}
          seoSubtitle={genreSeoSubtitle}
          emptyText="No movies match these filters yet."
          contentLabelPlural="movies"
          presetsStorageKey="megdb-movies-filter-presets-v1"
          initialItems={initialItems}
          totalPages={results.total_pages}
          mosaicUrls={mosaicUrls}
          heroDescription={heroDescription}
          enableDiscoverPolish
          trustUpdatedAtLabel={trustUpdatedAtLabel}
        />
      </div>
    </>
  )
}
