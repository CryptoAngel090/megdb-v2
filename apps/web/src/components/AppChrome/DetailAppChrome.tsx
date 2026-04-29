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

interface DetailAppChromeProps {
  children: ReactNode
}

export function DetailAppChrome({ children }: DetailAppChromeProps) {
  return (
    <SessionProvider>
      <ToastProvider>
        <Header />
        <main id="main-content" className="layout-main layout-main--detail-opt">
          {children}
        </main>
        <Footer />
      </ToastProvider>
    </SessionProvider>
  )
}
