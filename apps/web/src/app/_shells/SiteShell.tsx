import type { ReactNode } from 'react'
import { AppChrome } from '@/components/AppChrome/AppChrome'
import { DesignThemeProvider } from '@/components/DesignThemeProvider/DesignThemeProvider'
import { PerformanceMonitor } from '@/components/PerformanceMonitor/PerformanceMonitor'

interface SiteShellProps {
  children: ReactNode
  detailShellOptimizationEnabled: boolean
}

export function SiteShell({ children, detailShellOptimizationEnabled }: SiteShellProps) {
  return (
    <>
      <DesignThemeProvider />
      {process.env.NODE_ENV !== 'production' && <PerformanceMonitor />}
      <AppChrome detailShellOptimizationEnabled={detailShellOptimizationEnabled}>
        {children}
      </AppChrome>
    </>
  )
}
