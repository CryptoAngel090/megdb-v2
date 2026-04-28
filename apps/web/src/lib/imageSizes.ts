import type { CardSizeKey } from '@/theme/tokens/size'

/** Homepage source of truth for actor portrait image width profile. */
export const PERSON_PROFILE_IMAGE_TMDB_SIZE = 'w342' as const

/** Homepage source of truth for actor portrait responsive sizes. */
export const PERSON_PROFILE_IMAGE_SIZES =
  '(max-width: 767px) 32vw, (max-width: 1279px) 18vw, 148px'

/** Homepage source of truth for rail poster card size preset. */
const HOME_RAIL_POSTER_CARD_SIZE: CardSizeKey = 'md'
