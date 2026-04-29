import type { ReactNode } from 'react'
import { AppChrome } from '@/components/AppChrome/AppChrome'
import { DesignThemeProvider } from '@/components/DesignThemeProvider/DesignThemeProvider'
import { PerformanceMonitor } from '@/components/PerformanceMonitor/PerformanceMonitor'

interface SiteShellProps {
  children: ReactNode
}

export function SiteShell({ children }: SiteShellProps) {
  return (
    <>
      <DesignThemeProvider />
      {process.env.NODE_ENV !== 'production' && <PerformanceMonitor />}
      <AppChrome>{children}</AppChrome>
    </>
  )
}
