import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google'
import { Header } from '@/components/Header/Header'
import { Footer } from '@/components/Footer/Footer'
import { ScrollProgressBar } from '@/components/ScrollProgressBar/ScrollProgressBar'
import { NavigationProgress } from '@/components/NavigationProgress/NavigationProgress'
import { ToastProvider } from '@/components/Toast/Toast'
import { BackToTop } from '@/components/BackToTop/BackToTop'
import { Ripple } from '@/components/Ripple/Ripple'
import { PerformanceMonitor } from '@/components/PerformanceMonitor/PerformanceMonitor'
import '@/styles/globals.css'
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

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | MegDB',
    default: 'MegDB — Movies, Series, Cartoons & TV Shows',
  },
  description: 'Discover and explore the best movies, series, cartoons and TV shows online.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://megdb.com'),
  openGraph: {
    siteName: 'MegDB',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@megdb',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* Preconnect для быстрой загрузки TMDB изображений (улучшает LCP) */}
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://api.themoviedb.org" />
      </head>
      <body>
        <PerformanceMonitor />
        <Ripple />
        <ScrollProgressBar />
        {/* rule 69: progress bar вверху при навигации */}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <ToastProvider>
          <Header />
          <main id="main-content" className="layout-main">
            {children}
          </main>
          <Footer />
          <BackToTop />
        </ToastProvider>
        {/* Last in <body> so portaled overlays (e.g. episode modal) stack above app chrome */}
        <div id="megdb-portal-root" />
      </body>
    </html>
  )
}
