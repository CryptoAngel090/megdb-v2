const WATCH_NOW_URLS: Record<number, string> = {
  8: 'https://www.netflix.com/search?q=%s',
  1796: 'https://www.netflix.com/search?q=%s',
  9: 'https://www.primevideo.com/search/ref=atv_sr_sug_4?phrase=%s',
  10: 'https://www.amazon.com/s?k=%s&i=instant-video',
  119: 'https://www.primevideo.com/search/ref=atv_sr_sug_4?phrase=%s',
  2100: 'https://www.primevideo.com/search/ref=atv_sr_sug_4?phrase=%s',
  337: 'https://www.disneyplus.com/search?q=%s',
  15: 'https://www.hulu.com/search?q=%s',
  384: 'https://www.max.com/search?q=%s',
  1899: 'https://www.max.com/search?q=%s',
  386: 'https://www.peacocktv.com/search?q=%s',
  387: 'https://www.peacocktv.com/search?q=%s',
  531: 'https://www.paramountplus.com/search/?q=%s',
  2: 'https://tv.apple.com/search?term=%s',
  350: 'https://tv.apple.com/search?term=%s',
  300: 'https://tv.apple.com/search?term=%s',
  192: 'https://www.youtube.com/results?search_query=%s',
  73: 'https://tubitv.com/search?q=%s',
  538: 'https://watch.plex.tv/search?q=%s',
  283: 'https://www.crunchyroll.com/search?q=%s',
}

export function buildWatchNowUrl(providerId: number, title: string, fallback: string): string {
  const template = WATCH_NOW_URLS[providerId]
  return template ? template.replace('%s', encodeURIComponent(title)) : fallback
}

export function buildWatchProviderUrl(
  providerId: number,
  providerName: string,
  title: string,
  fallback: string | null | undefined
): string {
  const directById = WATCH_NOW_URLS[providerId]
  if (directById) return directById.replace('%s', encodeURIComponent(title))

  const normalized = providerName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
  const byNameTemplate =
    normalized.includes('fandango at home') || normalized.includes('vudu')
      ? 'https://www.vudu.com/content/movies/search?searchString=%s'
      : normalized.includes('google play')
        ? 'https://play.google.com/store/search?q=%s&c=movies'
        : normalized.includes('microsoft store')
          ? 'https://www.microsoft.com/en-us/search/shop/movies?q=%s'
          : normalized.includes('amc+')
            ? 'https://www.amcplus.com/'
            : normalized.includes('starz')
              ? 'https://www.starz.com/'
              : normalized.includes('showtime')
                ? 'https://www.paramountplus.com/shows/showtime/'
                : normalized.includes('mubi')
                  ? 'https://mubi.com/search?query=%s'
                  : normalized.includes('kanopy')
                    ? 'https://www.kanopy.com/en/search?query=%s'
                    : normalized.includes('hoopla')
                      ? 'https://www.hoopladigital.com/search?q=%s'
                      : normalized.includes('roku channel')
                        ? 'https://therokuchannel.roku.com/'
                        : normalized.includes('pluto')
                          ? 'https://pluto.tv/'
                          : null

  if (byNameTemplate) {
    return byNameTemplate.includes('%s')
      ? byNameTemplate.replace('%s', encodeURIComponent(title))
      : byNameTemplate
  }

  const safeFallback = fallback?.trim() ? fallback.trim() : ''
  if (safeFallback && !safeFallback.includes('tmdb.org')) return safeFallback

  return `https://www.google.com/search?q=${encodeURIComponent(`${providerName} ${title} watch`)}`
}
