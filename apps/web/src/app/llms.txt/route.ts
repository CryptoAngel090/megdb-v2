import { SITE_URL } from '@/lib/site'

/**
 * Optional AI / LLM crawler orientation (not a Google SEO requirement).
 * @see https://llmstxt.org/
 */
export function GET(): Response {
  const body = `# MegDB

> Movies, series, cartoons, and TV discovery. Catalogue metadata and imagery are attributed to TMDB and used under their API terms.

## Key pages
- [Home](${SITE_URL}/): Trending rails and discovery
- [Movies](${SITE_URL}/movies): Browse and filter movies
- [Series](${SITE_URL}/series): Scripted TV series
- [TV shows](${SITE_URL}/tvshows): Non-scripted / magazine-style TV
- [Cartoons](${SITE_URL}/cartoons): Animation catalogue
- [About](${SITE_URL}/about): Product, TMDB attribution, and policies
- [Contact](${SITE_URL}/contact): Support and legal routing
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
