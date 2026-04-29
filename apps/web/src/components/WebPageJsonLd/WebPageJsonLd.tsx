import { buildSiteHubBreadcrumbJsonLd, buildWebPageJsonLd } from '@/lib/jsonLdSite'

type WebPageJsonLdProps = {
  pathname: string
  title: string
  description: string
  /** When false, skip `BreadcrumbList` (e.g. detail pages that emit their own trail). */
  includeBreadcrumb?: boolean
  /** Optional middle crumb (e.g. legal hub). Omit when parent pathname equals current. */
  breadcrumbParent?: { name: string; pathname: string }
}

/** Server-rendered `WebPage` + hub-style breadcrumb — use on static routes; discover hubs use `buildCollectionPageStructuredData`. */
export function WebPageJsonLd({
  pathname,
  title,
  description,
  includeBreadcrumb = true,
  breadcrumbParent,
}: WebPageJsonLdProps) {
  const ld = buildWebPageJsonLd({ name: title, description, pathname })
  const crumb = includeBreadcrumb
    ? buildSiteHubBreadcrumbJsonLd(
        breadcrumbParent
          ? { pathname, name: title, parent: breadcrumbParent }
          : { pathname, name: title }
      )
    : null
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      {crumb && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(crumb) }}
        />
      )}
    </>
  )
}
