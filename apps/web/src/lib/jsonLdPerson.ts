import { jsonLdMainEntityId, jsonLdSameAsPerson } from '@/lib/jsonLdEntity'
import { SITE_URL } from '@/lib/site'
import { containsCyrillic } from '@/lib/textScript'
import type { PersonPageDetail } from '@/lib/tmdb'
import { getImageUrl } from '@/lib/tmdb'

export function buildJsonLdPerson(person: PersonPageDetail, canonicalPath: string) {
  const image = person.profilePath ? getImageUrl(person.profilePath, 'h632') : undefined
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': jsonLdMainEntityId(canonicalPath),
    name: person.name,
    description:
      person.biography && !containsCyrillic(person.biography)
        ? person.biography.slice(0, 5000)
        : undefined,
    image: image || undefined,
    birthDate: person.birthday || undefined,
    deathDate: person.deathday || undefined,
    birthPlace: person.placeOfBirth || undefined,
    url: `${SITE_URL}${canonicalPath}`,
    sameAs: jsonLdSameAsPerson({
      tmdbId: person.id,
      imdbId: person.imdbId,
      homepage: person.homepage,
    }),
    ...(person.knownForDepartment ? { jobTitle: person.knownForDepartment } : {}),
  }
}
