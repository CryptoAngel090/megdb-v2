/** First mosaic tile URL — matches `MoviesDiscoverPage` LCP (`enableDiscoverPolish`). */
export function MosaicHeroLcpPreload({ href }: { href: string | undefined | null }) {
  if (!href) return null
  return <link rel="preload" as="image" href={href} fetchPriority="high" />
}
