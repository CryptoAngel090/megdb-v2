import { cache } from 'react'
import { getMoviePageDataShell, getTvPageDataShell } from '@/lib/tmdb'

/** Dedupes shell TMDB work when `generateMetadata` and the page run in the same request. */
export const getMoviePageDataShellCached = cache(getMoviePageDataShell)

export const getTvPageDataShellCached = cache(getTvPageDataShell)
