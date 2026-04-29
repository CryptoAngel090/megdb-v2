'use client'

import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { ToastProvider } from '@/components/Toast/Toast'
import { SessionProvider } from '@/components/Providers/SessionProvider'

const Header = dynamic(() => import('@/components/Header/Header').then((m) => m.Header), {
  ssr: false,
})
const Footer = dynamic(() => import('@/components/Footer/Footer').then((m) => m.Footer), {
  ssr: false,
})
const DeferredRippleScroll = dynamic(
  () => import('@/components/DeferredAppChrome/DeferredAppChrome').then((m) => m.DeferredRippleScroll),
  { ssr: false }
)
const DeferredBackToTop = dynamic(
  () => import('@/components/DeferredAppChrome/DeferredAppChrome').then((m) => m.DeferredBackToTop),
  { ssr: false }
)
const NavigationProgress = dynamic(
  () => import('@/components/NavigationProgress/NavigationProgress').then((m) => m.NavigationProgress),
  { ssr: false }
)

interface AppChromeProps {
  children: ReactNode
  detailShellOptimizationEnabled?: boolean
}

export function AppChrome({ children, detailShellOptimizationEnabled = false }: AppChromeProps) {
  const shellFlagClassName = detailShellOptimizationEnabled
    ? 'layout-main layout-main--detail-opt'
    : 'layout-main'

  return (
    <SessionProvider>
      <ToastProvider>
        <DeferredRippleScroll />
        <NavigationProgress />
        <Header />
        <main id="main-content" className={shellFlagClassName}>
          {children}
        </main>
        <Footer />
        <DeferredBackToTop />
      </ToastProvider>
    </SessionProvider>
  )
}
