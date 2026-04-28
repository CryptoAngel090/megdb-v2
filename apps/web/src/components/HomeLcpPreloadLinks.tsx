import type { HeroItem, ShelfItem } from '@/lib/tmdb'
import { getImageUrl } from '@/lib/tmdb'

const TMDB = 'https://image.tmdb.org/t/p'

/** Same backdrop size as `HeroSection` (`w1280`). */
function heroBackdropUrl(slide: HeroItem): string | null {
  if (!slide.backdropPath?.trim()) return null
  return `${TMDB}/w1280${slide.backdropPath}`
}

/** Mobile-optimised backdrop (`w780`) for the srcset hint. */
function heroBackdropUrlW780(slide: HeroItem): string | null {
  if (!slide.backdropPath?.trim()) return null
  return `${TMDB}/w780${slide.backdropPath}`
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
 * Homepage LCP preload hints.
 *
 * Hero backdrop:
 *   - `imageSrcSet` tells the browser to pick w780 on narrow viewports and w1280 on wide ones,
 *     matching the `sizes="100vw"` used in HeroSection's <Image>.
 *   - Without this hint the browser always fetches the full 1280px image on mobile,
 *     adding ~300–500 ms to LCP on 4G connections.
 *
 * Shelf fallback (when hero has no backdrop):
 *   - Preloads the first poster at w500 — no srcset needed (poster is never the LCP on desktop).
 */
export function HomeLcpPreloadLinks({ heroSlides, shelfFallbacks }: Props) {
  const hero = heroSlides.find((s) => Boolean(s.backdropPath?.trim()))

  if (hero) {
    const url1280 = heroBackdropUrl(hero)
    const url780 = heroBackdropUrlW780(hero)
    if (url1280 && url780) {
      return (
        <link
          rel="preload"
          as="image"
          href={url1280}
          imageSrcSet={`${url780} 780w, ${url1280} 1280w`}
          imageSizes="100vw"
          fetchPriority="high"
        />
      )
    }
    if (url1280) {
      return <link rel="preload" as="image" href={url1280} fetchPriority="high" />
    }
  }

  for (const shelf of shelfFallbacks) {
    const u = firstShelfPosterW500(shelf)
    if (u) return <link rel="preload" as="image" href={u} fetchPriority="high" />
  }
  return null
}
