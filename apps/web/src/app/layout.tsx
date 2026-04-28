import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { Header } from '@/components/Header/Header'
import { Footer } from '@/components/Footer/Footer'
import { DeferredBackToTop, DeferredRippleScroll } from '@/components/DeferredAppChrome/DeferredAppChrome'
import { NavigationProgress } from '@/components/NavigationProgress/NavigationProgress'
import { ToastProvider } from '@/components/Toast/Toast'
import { PerformanceMonitor } from '@/components/PerformanceMonitor/PerformanceMonitor'
import { DesignThemeProvider } from '@/components/DesignThemeProvider/DesignThemeProvider'
import { SessionProvider } from '@/components/Providers/SessionProvider'
import {
  SEO_CONTACT_EMAIL,
  SEO_LAST_REVIEWED_AT,
  SEO_PUBLISHER_NAME,
} from '@/lib/seoFreshness'
import { SITE_URL } from '@/lib/site'
import '@/styles/globals.css'
import '@/styles/design-tokens.generated.css'
import '@/styles/tailwind.css'
import '@/styles/base.css'
import '@/styles/keyframes-motion.css'
import '@/styles/app-layers.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <head>
        {/* Preconnect для быстрой загрузки TMDB изображений (улучшает LCP) */}
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://api.themoviedb.org" />
      </head>
      <body>
        <DesignThemeProvider />
        {/* PerformanceMonitor: FPS sampling — dev/staging only, not in production */}
        {process.env.NODE_ENV !== 'production' && <PerformanceMonitor />}
        <DeferredRippleScroll />
        {/* rule 69: progress bar вверху при навигации */}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <SessionProvider>
          <ToastProvider>
            <Header />
            <main id="main-content" className="layout-main">
              {children}
            </main>
            <Footer />
            <DeferredBackToTop />
          </ToastProvider>
        </SessionProvider>
        {/* Last in <body> so portaled overlays (e.g. episode modal) stack above app chrome */}
        <div id="megdb-portal-root" />
      </body>
    </html>
  )
}
