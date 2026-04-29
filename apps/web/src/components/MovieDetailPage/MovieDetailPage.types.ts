import type { DetailMediaKind } from '@/lib/slug'

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
