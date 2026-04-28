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

const config: NextConfig = {
  transpilePackages: ['@repo/ui'],
  eslint: {
    /** `pnpm lint` must pass; build-time lint re-enabled after fixing ESLint debt (level-1). */
    ignoreDuringBuilds: false,
  },
  headers() {
    const base = [
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
    ] as { key: string; value: string }[]
    if (process.env.NODE_ENV === 'production') {
      base.splice(1, 0, {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      })
    }
    return Promise.resolve([{ source: '/:path*', headers: base }])
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'imagedelivery.net' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
}

export default withBundleAnalyzer(config)
