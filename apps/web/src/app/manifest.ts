import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MegDB — Movies & TV',
    short_name: 'MegDB',
    description: 'Discover and explore the best movies, series, cartoons and TV shows online.',
    start_url: '/',
    display: 'standalone',
    background_color: '#121212',
    theme_color: '#E50914',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['entertainment', 'movies', 'tv'],
    lang: 'en',
    dir: 'ltr',
    scope: '/',
    prefer_related_applications: false,
  }
}
