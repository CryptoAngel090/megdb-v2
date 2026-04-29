'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import { SessionProvider } from '@/components/Providers/SessionProvider'
import { ToastProvider } from '@/components/Toast/Toast'

const Header = dynamic(() => import('@/components/Header/Header').then((m) => m.Header), {
  ssr: false,
})
const Footer = dynamic(() => import('@/components/Footer/Footer').then((m) => m.Footer), {
  ssr: false,
})
const DeferredRippleScroll = dynamic(
  () =>
    import('@/components/DeferredAppChrome/DeferredAppChrome').then((m) => m.DeferredRippleScroll),
  { ssr: false }
)
const DeferredBackToTop = dynamic(
  () => import('@/components/DeferredAppChrome/DeferredAppChrome').then((m) => m.DeferredBackToTop),
  { ssr: false }
)
const NavigationProgress = dynamic(
  () =>
    import('@/components/NavigationProgress/NavigationProgress').then((m) => m.NavigationProgress),
  { ssr: false }
)

interface AppChromeProps {
  children: ReactNode
}

export function AppChrome({ children }: AppChromeProps) {
  return (
    <SessionProvider>
      <ToastProvider>
        <DeferredRippleScroll />
        <NavigationProgress />
        <Header />
        <main id="main-content" className="layout-main">
          {children}
        </main>
        <Footer />
        <DeferredBackToTop />
      </ToastProvider>
    </SessionProvider>
  )
}
