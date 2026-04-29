type SnippetVariant = 'intent-first' | 'entity-first'

function pickVariant(seed: string): SnippetVariant {
  let total = 0
  for (const ch of seed) total += ch.charCodeAt(0)
  return total % 2 === 0 ? 'intent-first' : 'entity-first'
}

function truncateDescription(input: string, max = 155): string {
  const clean = input.trim().replace(/\s+/g, ' ')
  if (clean.length <= max) return clean
  const slice = clean.slice(0, max - 1)
  const lastSpace = slice.lastIndexOf(' ')
  return `${(lastSpace > 90 ? slice.slice(0, lastSpace) : slice).trimEnd()}.`
}

type EntitySnippetInput = {
  query: string
  slug: string
}

type GenreSnippetInput = {
  genreName: string
  year: number
}

type DiscoverHubSnippetInput = {
  page: 'movies' | 'series' | 'cartoons'
  year: number
}

type SearchSnippetInput = {
  query: string
}

type SnippetTemplateResult = {
  title: string
  description: string
  cohort: string
}

/**
 * Title/description template for canonical entity hubs.
 * Cohort label is persisted in metadata for Search Console segmentation.
 */
export function buildEntitySnippetTemplate(input: EntitySnippetInput): SnippetTemplateResult {
  const variant = pickVariant(input.slug)
  const normalizedQuery = input.query.trim()
  const title =
    variant === 'intent-first'
      ? `Where to Watch ${normalizedQuery}: Movies, Series, People`
      : `${normalizedQuery} Universe Guide: Related Titles and Cast`
  const description =
    variant === 'intent-first'
      ? truncateDescription(
          `Find what to watch for ${normalizedQuery}. This canonical MegDB hub groups related movies, series and people so you can jump straight from query to watch choices.`
        )
      : truncateDescription(
          `Explore the ${normalizedQuery} universe on MegDB with linked titles, key cast and connected series pages. Built as a canonical entity hub to reduce duplicate result surfaces.`
        )
  return { title, description, cohort: `entity-snippet-${variant}-v1` }
}

/**
 * Genre-hub snippet template focused on transactional "what to watch" intent.
 */
export function buildGenreHubSnippetTemplate(input: GenreSnippetInput): SnippetTemplateResult {
  const variant = pickVariant(input.genreName)
  const title =
    variant === 'intent-first'
      ? `Best ${input.genreName} Movies to Watch (${input.year})`
      : `${input.genreName} Movies Hub (${input.year}): Trends and Picks`
  const description =
    variant === 'intent-first'
      ? truncateDescription(
          `Need something to watch tonight? Browse ${input.genreName.toLowerCase()} movies for ${input.year} with ratings, release context and quick links to related picks on MegDB.`
        )
      : truncateDescription(
          `${input.genreName} movies hub for ${input.year}: discover trend leaders, evergreen picks and related genre paths. Canonical MegDB page for focused genre exploration.`
        )
  return { title, description, cohort: `genre-snippet-${variant}-v1` }
}

export function buildDiscoverHubSnippetTemplate(
  input: DiscoverHubSnippetInput
): SnippetTemplateResult {
  const seed = `${input.page}-${input.year}`
  const variant = pickVariant(seed)
  const nounByPage: Record<DiscoverHubSnippetInput['page'], string> = {
    movies: 'Movies',
    series: 'Series',
    cartoons: 'Cartoons',
  }
  const noun = nounByPage[input.page]
  const lowerNoun = noun.toLowerCase()
  const title =
    variant === 'intent-first'
      ? `Best ${noun} to Watch Online (${input.year})`
      : `${noun} Discovery Hub (${input.year}): Trends, Ratings, Releases`
  const description =
    variant === 'intent-first'
      ? truncateDescription(
          `Find ${lowerNoun} to watch online in ${input.year}. Compare ratings, release timing and platform-focused discovery paths on MegDB.`
        )
      : truncateDescription(
          `${noun} discovery hub for ${input.year}: track trend momentum, evaluate ratings and browse release-driven lists in one canonical MegDB index page.`
        )
  return { title, description, cohort: `${input.page}-snippet-${variant}-v1` }
}

export function buildSearchSnippetTemplate(input: SearchSnippetInput): SnippetTemplateResult {
  const cleanQuery = input.query.trim()
  const hasQuery = cleanQuery.length >= 2
  const seed = hasQuery ? cleanQuery : 'search'
  const variant = pickVariant(seed)
  const title = hasQuery
    ? variant === 'intent-first'
      ? `Find ${cleanQuery}: Movies, Series, People`
      : `${cleanQuery} Results Hub: Related Movies, Series, Cast`
    : variant === 'intent-first'
      ? 'Find Movies, Series, and People'
      : 'Search Hub for Movies, Series, and People'
  const description =
    hasQuery && variant === 'intent-first'
      ? truncateDescription(
          `Search MegDB for ${cleanQuery} and jump to the most relevant movie, series and person pages. Best for direct lookup and fast navigation.`
        )
      : hasQuery
        ? truncateDescription(
            `Explore related results around ${cleanQuery} across titles and cast. Use this search hub as an entry point before moving into canonical entity and genre pages.`
          )
        : variant === 'intent-first'
          ? truncateDescription(
              'Search movies, series and people on MegDB with quick lookup intent, then continue into canonical detail and discovery routes.'
            )
          : truncateDescription(
              'Use the MegDB search hub to explore related titles, people and query clusters before drilling into canonical browsing pages.'
            )
  return { title, description, cohort: `search-snippet-${variant}-v1` }
}
