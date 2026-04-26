import { SITE_URL } from '@/lib/site'

/** Stable @id for Organization — reused on home and about for entity consolidation. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`

const WEBSITE_ID = `${SITE_URL}/#website`

const LOGO_URL = `${SITE_URL}/icon-192.png`

const SAME_AS = ['https://www.instagram.com/megdb_com', 'https://twitter.com/megdb'] as const

/**
 * Homepage graph: Organization + WebSite (publisher link). WebSite is intended only for the domain root.
 * @see https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
 */
export function buildHomeStructuredData() {
  const organization = {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'MegDB',
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: LOGO_URL },
    sameAs: [...SAME_AS],
    description:
      'MegDB helps people discover movies, series, cartoons and TV shows with fast search and structured discovery.',
  }

  const website = {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: 'MegDB',
    alternateName: 'MegDB — Movies, Series, Cartoons & TV Shows',
    publisher: { '@id': ORGANIZATION_ID },
    inLanguage: 'en-US',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [organization, website],
  }
}

/** Richer Organization on the about page; same @id as on the homepage. */
export function buildAboutOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'MegDB',
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: LOGO_URL },
    sameAs: [...SAME_AS],
    description:
      'MegDB is a discovery platform for movies and TV. Catalogue metadata is powered by The Movie Database (TMDB) under their API terms.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: `${SITE_URL}/contact`,
    },
  }
}
