interface MovieGenreRouteItem {
  id: string
  slug: string
}

const MOVIE_GENRE_ROUTES: readonly MovieGenreRouteItem[] = [
  { id: '28', slug: 'action' },
  { id: '12', slug: 'adventure' },
  { id: '16', slug: 'animation' },
  { id: '35', slug: 'comedy' },
  { id: '80', slug: 'crime' },
  { id: '99', slug: 'documentary' },
  { id: '18', slug: 'drama' },
  { id: '10751', slug: 'family' },
  { id: '14', slug: 'fantasy' },
  { id: '36', slug: 'history' },
  { id: '27', slug: 'horror' },
  { id: '10402', slug: 'music' },
  { id: '9648', slug: 'mystery' },
  { id: '10749', slug: 'romance' },
  { id: '878', slug: 'sci-fi' },
  { id: '53', slug: 'thriller' },
  { id: '10752', slug: 'war' },
  { id: '37', slug: 'western' },
]

const MOVIE_GENRE_ID_TO_SLUG = new Map(MOVIE_GENRE_ROUTES.map((row) => [row.id, row.slug]))
const MOVIE_GENRE_SLUG_TO_ID = new Map(MOVIE_GENRE_ROUTES.map((row) => [row.slug, row.id]))

export function movieGenreIdToSlug(id: string): string | undefined {
  return MOVIE_GENRE_ID_TO_SLUG.get(id)
}

export function movieGenreSlugToId(slug: string): string | undefined {
  return MOVIE_GENRE_SLUG_TO_ID.get(slug)
}

export function movieGenrePathById(id: string): string | undefined {
  const slug = movieGenreIdToSlug(id)
  return slug ? `/movies/category/${slug}` : undefined
}
