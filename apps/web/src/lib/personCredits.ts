import type { PersonCreditRowRaw } from '@/lib/tmdb'
import { moviePath, seriesPath } from '@/lib/slug'

/** MegDB canonical path for a TMDB credit row (movies → /movie, TV → /series). */
export function personCreditDetailPath(row: PersonCreditRowRaw): string {
  if (row.kind === 'movie') return moviePath(row.title, row.releaseDate)
  return seriesPath(row.title, row.releaseDate)
}
