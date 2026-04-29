import fs from 'node:fs'
import path from 'node:path'
import type { NextConfig } from 'next'
import bundleAnalyzer from '@next/bundle-analyzer'

/**
 * Monorepo: Next only auto-loads `apps/web/.env*`. If `TMDB_API_KEY` lives in the
 * repo root (common when sharing with `apps/api`), merge root `.env.local` / `.env`
 * into `process.env` before the app boots — without overriding values already set
 * for this package (e.g. `apps/web/.env.local` wins when both define the same key).
 */
function mergeMonorepoRootEnvIntoProcess(): void {
  const repoRoot = path.resolve(process.cwd(), '..', '..')
  for (const name of ['.env.local', '.env'] as const) {
    const filePath = path.join(repoRoot, name)
    if (!fs.existsSync(filePath)) continue
    let raw: string
    try {
      raw = fs.readFileSync(filePath, 'utf8')
    } catch {
      continue
    }
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      const current = process.env[key]
      if (current === undefined || current === '') {
        process.env[key] = value
      }
    }
  }
}

mergeMonorepoRootEnvIntoProcess()

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
})

/**
 * Stage 8 — Early Hints (CDN) + HTTP/3
 *
 * - Cloudflare: Speed → Optimization → Content Optimization → **Early Hints** ON.
 * - Cloudflare: Network → **HTTP/3** ON (edge terminates QUIC; origin may stay HTTP/2).
 *
 * A `Link` response header with `rel=preconnect` lets Cloudflare emit **103 Early Hints**
 * so the browser opens TMDB connections while the origin is still computing TTFB.
 * Applied on all routes via `/:path*` so we never duplicate security headers from a
 * second matching rule.
 *
 * Note: We do not preload a fixed `inter.woff2` path — `next/font/google` serves hashed
 * files under `/_next/static/media/…` per build. Poster URLs are per-title on TMDB;
 * preconnect to `image.tmdb.org` covers hero/list posters without a wrong static URL.
 */
const EARLY_HINT_LINK_TMDB =
  '<https://image.tmdb.org>; rel=preconnect; crossorigin, <https://api.themoviedb.org>; rel=preconnect; crossorigin'

const config: NextConfig = {
  transpilePackages: ['@repo/ui'],
  reactCompiler: true,
  headers() {
    const base = [{ key: 'X-DNS-Prefetch-Control', value: 'on' }] as {
      key: string
      value: string
    }[]
    /**
     * Single `/:path*` rule avoids duplicate security headers when both `/movie/:path*`
     * and `/:path*` would match. TMDB preconnect is cheap on non-movie routes and helps
     * any page that embeds posters (home, discover, detail).
     */
    return Promise.resolve([
      {
        source: '/_next/static/:path*',
        headers: [
          ...base,
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Link', value: EARLY_HINT_LINK_TMDB },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          ...base,
          { key: 'Cache-Control', value: 'public, max-age=2592000' },
          { key: 'Link', value: EARLY_HINT_LINK_TMDB },
        ],
      },
      {
        source: '/api/movies/:path*',
        headers: [
          ...base,
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
          { key: 'Link', value: EARLY_HINT_LINK_TMDB },
        ],
      },
      { source: '/:path*', headers: [...base, { key: 'Link', value: EARLY_HINT_LINK_TMDB }] },
    ])
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'imagedelivery.net' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31_536_000,
  },
  experimental: {
    viewTransition: true,
    inlineCss: true,
    optimizePackageImports: ['framer-motion'],
  },
}

export default withBundleAnalyzer(config)
