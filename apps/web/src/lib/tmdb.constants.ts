import {
  FETCH_REVALIDATE_ALL_TIME,
  FETCH_REVALIDATE_DEFAULT,
  FETCH_REVALIDATE_ENRICHMENT,
  FETCH_REVALIDATE_FAST,
  FETCH_REVALIDATE_MODERATE,
  FETCH_REVALIDATE_PEOPLE,
} from './cachePolicy'

export const TMDB_BASE = 'https://api.themoviedb.org/3'

export const TMDB_REVALIDATE_DEFAULT = FETCH_REVALIDATE_DEFAULT
export const TMDB_REVALIDATE_FAST = FETCH_REVALIDATE_FAST
export const TMDB_REVALIDATE_MODERATE = FETCH_REVALIDATE_MODERATE
export const TMDB_REVALIDATE_PEOPLE = FETCH_REVALIDATE_PEOPLE
export const TMDB_REVALIDATE_ALL_TIME = FETCH_REVALIDATE_ALL_TIME
export const TMDB_REVALIDATE_ENRICHMENT = FETCH_REVALIDATE_ENRICHMENT

export const GENRE_NAMES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  14: 'Fantasy',
  27: 'Horror',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  53: 'Thriller',
  10759: 'Action & Adventure',
  10765: 'Sci-Fi & Fantasy',
  37: 'Western',
  36: 'History',
  10402: 'Music',
  10751: 'Family',
  10752: 'War',
  10770: 'TV Movie',
  10768: 'War & Politics',
  10769: 'Foreign',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10766: 'Soap',
  10767: 'Talk',
}

export const HERO_EXCLUDE = new Set([16, 18, 35, 36, 37, 99, 10402, 10749, 10763, 10764, 10766, 10767])
export const SHELF_EXCLUDE = '16,99,10402,10764,10767,10763,10766'
export const SHELF_EXCLUDED_GENRE_IDS = new Set(
  SHELF_EXCLUDE.split(',')
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n))
)

export const TV_MOVIE_GENRE_ID = 10770
export const TRENDING_MIN_VOTE_COUNT = 25

export const COMING_BLOCKBUSTER_MOVIE_VOTE_MIN = 120
export const COMING_BLOCKBUSTER_TV_VOTE_MIN = 70
export const COMING_SHELF_FETCH_MAX_PAGES = 14
export const COMING_UPCOMING_ENDPOINT_MAX_PAGES = 5
export const EXPECTED_MONTH_POPULARITY_DISCOVER_PAGES = 12

export const COMING_SOON_VOTE_TIERS: { movie: number; tv: number }[] = [
  { movie: 380, tv: 220 },
  { movie: 300, tv: 170 },
  { movie: 240, tv: 130 },
  { movie: 190, tv: 100 },
  { movie: 150, tv: 75 },
]

export const COMING_HYPE_PHASES: (number | null)[] = [34, 22, null]

export const COMING_LOOSE_VOTE_TIERS: { movie: number; tv: number }[] = [
  { movie: 120, tv: 65 },
  { movie: 90, tv: 50 },
  { movie: 60, tv: 35 },
]

export const COMBAT_SPORTS_PROGRAM_RE = new RegExp(
  [
    '\\bWWE\\b',
    'WrestleMania',
    'Wrestlemania',
    '\\bAEW\\b',
    'All Elite Wrestling',
    'Impact Wrestling',
    'Ring of Honor',
    '\\bNJPW\\b',
    'New Japan Pro',
    '\\bBellator\\b',
    '\\bUFC\\s+[0-9]{2,4}\\b',
    'UFC Fight Night',
    'ONE Championship:\\s*Fight',
    'mixed martial arts event',
    'pay-per-view\\s+(?:wrestling|mma|boxing)',
  ].join('|'),
  'i'
)
