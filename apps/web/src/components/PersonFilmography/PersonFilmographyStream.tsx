import { getPersonCreditsCached } from '@/lib/personPageDataCache'
import { PersonFilmography } from './PersonFilmography'

export async function PersonFilmographyStream({ personId }: { personId: number }) {
  const credits = await getPersonCreditsCached(personId)
  return <PersonFilmography credits={credits} />
}
