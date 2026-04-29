import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { headers } from 'next/headers'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { SEO_CONTACT_EMAIL, SEO_LAST_REVIEWED_AT, SEO_PUBLISHER_NAME } from '@/lib/seoFreshness'
import { SITE_URL } from '@/lib/site'
import '@/styles/globals.css'
import '@/styles/design-tokens.generated.css'
import '@/styles/tailwind.css'
import '@/styles/base.css'
import '@/styles/keyframes-motion.css'
import '@/styles/app-layers.css'

const speculationRules = {
  prerender: [
    {
      where: { href_matches: '/movie/*' },
      eagerness: 'moderate',
    },
  ],
  prefetch: [
    {
      where: { href_matches: '/person/*' },
      eagerness: 'conservative',
    },
  ],
} as const

const localhostServiceWorkerResetScript = `
(() => {
  try {
    const host = window.location.hostname;
    const isLocalhost = host === 'localhost' || host === '127.0.0.1';
    if (!isLocalhost) return;
    const marker = 'megdb-sw-reset-v1';
    if (sessionStorage.getItem(marker) === '1') return;
    sessionStorage.setItem(marker, '1');
    const reset = async () => {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((reg) => reg.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(
          keys.filter((key) => key.startsWith('megdb-')).map((key) => caches.delete(key))
        );
      }
      window.location.reload();
    };
    void reset();
  } catch {}
})();
`

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

// JetBrains Mono is NOT loaded here — it is only needed on /ui-kit and
// components that explicitly use --font-mono (KeyboardShortcutsModal, error pages).
// Those fall back to ui-monospace / system-mono defined in globals.css --font-mono.
// /ui-kit has its own layout that injects the variable for the design-system showcase.

export const metadata: Metadata = {
  title: {
    template: '%s | MegDB',
    default: 'MegDB — Movies, Series, Cartoons & TV Shows',
  },
  description: 'Discover and explore the best movies, series, cartoons and TV shows online.',
  applicationName: 'MegDB',
  creator: SEO_PUBLISHER_NAME,
  publisher: SEO_PUBLISHER_NAME,
  authors: [{ name: SEO_PUBLISHER_NAME, url: SITE_URL }],
  metadataBase: new URL(SITE_URL),
  openGraph: {
    siteName: 'MegDB',
    type: 'website',
    locale: 'en_US',
    /** Fallback when a route does not pass route-level social images. */
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'MegDB' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@megdb',
    images: ['/twitter-image'],
  },
  icons: {
    icon: [
      { url: '/icon', sizes: 'any', type: 'image/png' },
      { url: '/icon', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icon', sizes: '180x180', type: 'image/png' }],
    shortcut: '/icon',
  },
  manifest: '/manifest.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  category: 'entertainment',
  other: {
    'contact:email': SEO_CONTACT_EMAIL,
    'article:modified_time': SEO_LAST_REVIEWED_AT,
  },
}

export default async function SiteRootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <head>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: localhostServiceWorkerResetScript }}
        />
        {/* Preconnect для быстрой загрузки TMDB изображений (улучшает LCP) */}
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://api.themoviedb.org" />
        <script
          type="speculationrules"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(speculationRules) }}
        />
      </head>
      <body>
        {children}
        <ServiceWorkerRegistration />
        {/* Last in <body> so portaled overlays (e.g. episode modal) stack above app chrome */}
        <div id="megdb-portal-root" />
      </body>
    </html>
  )
}
