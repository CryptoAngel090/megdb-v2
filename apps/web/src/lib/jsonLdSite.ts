import {
  SEO_CONTACT_EMAIL,
  SEO_FOUNDED_DATE,
  SEO_KNOWS_ABOUT,
  SEO_LAST_REVIEWED_AT,
} from '@/lib/seoFreshness'
import { SITE_URL } from '@/lib/site'

/** Stable @id for Organization — reused on home and about for entity consolidation. */
const ORGANIZATION_ID = `${SITE_URL}/#organization`

const WEBSITE_ID = `${SITE_URL}/#website`

const LOGO_URL = `${SITE_URL}/icon`

const SAME_AS = ['https://www.instagram.com/megdb_com', 'https://twitter.com/megdb'] as const

const HOMEPAGE_WEBPAGE_ID = `${SITE_URL}/#homepage`

/** Fragment for static `WebPage` / hub pages (distinct from `#main-entity` on work detail). */
const JSON_LD_PAGE_ENTITY_FRAGMENT = 'page'

/** Fragment for `CollectionPage` primary entity @id. */
const JSON_LD_COLLECTION_ENTITY_FRAGMENT = 'collection'

/**
 * Homepage graph: Organization + WebSite + WebPage (root URL), for entity + page clarity.
 * @see https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
 */
export function buildHomeStructuredData(opts: { pageName: string; pageDescription: string }) {
  const organization = {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'MegDB',
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: LOGO_URL },
    sameAs: [...SAME_AS],
    description:
      'MegDB helps people discover movies, series, cartoons and TV shows with fast search and structured discovery.',
    foundingDate: SEO_FOUNDED_DATE,
    email: SEO_CONTACT_EMAIL,
    knowsAbout: [...SEO_KNOWS_ABOUT],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: `${SITE_URL}/contact`,
      email: SEO_CONTACT_EMAIL,
      areaServed: 'Worldwide',
      availableLanguage: ['en'],
    },
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
    dateModified: SEO_LAST_REVIEWED_AT,
  }

  const webPage = {
    '@type': 'WebPage',
    '@id': HOMEPAGE_WEBPAGE_ID,
    name: opts.pageName,
    description: opts.pageDescription,
    url: SITE_URL,
    isPartOf: { '@type': 'WebSite', '@id': WEBSITE_ID },
    publisher: { '@id': ORGANIZATION_ID },
    dateModified: SEO_LAST_REVIEWED_AT,
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [organization, website, webPage],
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
      email: SEO_CONTACT_EMAIL,
      areaServed: 'Worldwide',
      availableLanguage: ['en'],
    },
    foundingDate: SEO_FOUNDED_DATE,
    knowsAbout: [...SEO_KNOWS_ABOUT],
  }
}

/** Discover hub pages (e.g. `/cartoons`, `/movies`) — CollectionPage tied to WebSite graph id. */
function buildCollectionPageJsonLd(opts: {
  name: string
  description: string
  /** Path + optional query, e.g. `/cartoons` or `/cartoons?genre=16` */
  pathname: string
}) {
  const base = SITE_URL.replace(/\/$/, '')
  const path = opts.pathname.startsWith('/') ? opts.pathname : `/${opts.pathname}`
  const url = `${base}${path}`
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#${JSON_LD_COLLECTION_ENTITY_FRAGMENT}`,
    name: opts.name,
    description: opts.description,
    url,
    isPartOf: { '@type': 'WebSite', '@id': WEBSITE_ID },
    publisher: { '@id': ORGANIZATION_ID },
    dateModified: SEO_LAST_REVIEWED_AT,
  }
}

/** CollectionPage JSON-LD + BreadcrumbList for discover hubs (indexable facet baseline only). */
export function buildCollectionPageStructuredData(
  opts: Parameters<typeof buildCollectionPageJsonLd>[0] & {
    breadcrumbParent?: { name: string; pathname: string }
  }
) {
  return {
    collectionPage: buildCollectionPageJsonLd(opts),
    breadcrumb: buildSiteHubBreadcrumbJsonLd({
      pathname: opts.pathname,
      name: opts.name,
      ...(opts.breadcrumbParent ? { parent: opts.breadcrumbParent } : {}),
    }),
  }
}

/** Breadcrumb: Home → optional parent hub → current (canonical URL for `pathname`). */
export function buildSiteHubBreadcrumbJsonLd(opts: {
  pathname: string
  name: string
  parent?: { name: string; pathname: string }
}) {
  const base = SITE_URL.replace(/\/$/, '')
  const path = opts.pathname.startsWith('/') ? opts.pathname : `/${opts.pathname}`
  const url = `${base}${path}`
  const parentPath =
    opts.parent == null
      ? null
      : opts.parent.pathname.startsWith('/')
        ? opts.parent.pathname
        : `/${opts.parent.pathname}`

  const items: Array<{ '@type': 'ListItem'; position: number; name: string; item: string }> = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
  ]
  let position = 2
  if (opts.parent && parentPath && parentPath !== path) {
    items.push({
      '@type': 'ListItem',
      position,
      name: opts.parent.name,
      item: `${base}${parentPath}`,
    })
    position += 1
  }
  items.push({ '@type': 'ListItem', position, name: opts.name, item: url })
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  }
}

/** Indexed utility pages (e.g. `/movies/random`) — WebPage, not a media collection. */
export function buildWebPageJsonLd(opts: { name: string; description: string; pathname: string }) {
  const base = SITE_URL.replace(/\/$/, '')
  const path = opts.pathname.startsWith('/') ? opts.pathname : `/${opts.pathname}`
  const url = `${base}${path}`
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}#${JSON_LD_PAGE_ENTITY_FRAGMENT}`,
    name: opts.name,
    description: opts.description,
    url,
    isPartOf: { '@type': 'WebSite', '@id': WEBSITE_ID },
    publisher: { '@id': ORGANIZATION_ID },
    dateModified: SEO_LAST_REVIEWED_AT,
  }
}
