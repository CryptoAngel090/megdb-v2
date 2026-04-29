import { cache } from 'react'
import { getPersonCombinedCredits, getPersonImages } from '@/lib/tmdb'

/** Dedupes credits when `generateMetadata` and streamed filmography share one request. */
export const getPersonCreditsCached = cache(getPersonCombinedCredits)

/** Dedupes person images request between route blocks in a single render. */
export const getPersonImagesCached = cache(getPersonImages)
