import type { HeroItem, ShelfItem } from '@/lib/tmdb'
import { getImageUrl } from '@/lib/tmdb'

const TMDB = 'https://image.tmdb.org/t/p'

/** Same backdrop size as `HeroSection` (`w1280`). */
function heroBackdropUrl(slide: HeroItem): string | null {
  if (!slide.backdropPath?.trim()) return null
  return `${TMDB}/w1280${slide.backdropPath}`
}

function firstShelfPosterW500(items: ShelfItem[]): string | null {
  const path = items.find((x) => x.posterPath)?.posterPath
  return path ? getImageUrl(path, 'w500') : null
}

type Props = {
  heroSlides: HeroItem[]
  /** Try in order when hero has no backdrop (e.g. empty TMDB window). */
  shelfFallbacks: ShelfItem[][]
}

/**
 * Homepage LCP: hero carousel backdrop, else first poster from the first non-empty shelf.
 */
export function HomeLcpPreloadLinks({ heroSlides, shelfFallbacks }: Props) {
  const hero = heroSlides.find((s) => Boolean(s.backdropPath?.trim()))
  const heroUrl = hero ? heroBackdropUrl(hero) : null
  if (heroUrl) {
    return <link rel="preload" as="image" href={heroUrl} fetchPriority="high" />
  }
  for (const shelf of shelfFallbacks) {
    const u = firstShelfPosterW500(shelf)
    if (u) return <link rel="preload" as="image" href={u} fetchPriority="high" />
  }
  return null
}
