import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@repo/ui'],
  reactCompiler: true,
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
  },
}

export default config
