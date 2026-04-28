import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'

/** Absolute URL for `path` (must start with `/` or be full URL). */
function absoluteUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `${SITE_URL.replace(/\/$/, '')}${path}`
}

type OgType = 'website' | 'video.movie' | 'video.tv_show' | 'video.other'

type DiscoverOpts = {
  /** Defaults to `website`. */
  type?: OgType
  images?: NonNullable<Metadata['openGraph']>['images']
  releaseDate?: string
}

function twitterImageUrls(
  images: NonNullable<Metadata['openGraph']>['images']
): string[] | undefined {
  if (!images) return undefined
  const list = Array.isArray(images) ? images : [images]
  const urls = list
    .map((entry) => {
      if (typeof entry === 'string') return entry
      if (entry && typeof entry === 'object' && 'url' in entry && entry.url)
        return String(entry.url)
      return ''
    })
    .filter(Boolean)
  return urls.length > 0 ? urls : undefined
}

/**
 * Open Graph + Twitter with absolute `openGraph.url` (aligns with canonical path).
 * Use for discover pages, static pages, and optionally detail pages (with `type` + `images`).
 */
/**
 * Canonical + `hreflang` for a single-locale English site (`en` + `x-default` → same URL).
 * Merge with page metadata as `alternates: discoverPageAlternates(path)`.
 */
export function discoverPageAlternates(canonicalPath: string): NonNullable<Metadata['alternates']> {
  const url = absoluteUrl(canonicalPath)
  return {
    canonical: url,
    languages: {
      'x-default': url,
      en: url,
    },
  }
}

export function discoverSocialMeta(
  title: string,
  description: string,
  canonicalPath: string,
  opts?: DiscoverOpts
): Pick<Metadata, 'openGraph' | 'twitter'> {
  const url = absoluteUrl(canonicalPath)
  const twImages = twitterImageUrls(opts?.images)
  return {
    openGraph: {
      title,
      description,
      url,
      type: opts?.type ?? 'website',
      siteName: 'MegDB',
      ...(opts?.releaseDate ? { releaseDate: opts.releaseDate } : {}),
      ...(opts?.images ? { images: opts.images } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(twImages ? { images: twImages } : {}),
    },
  }
}
