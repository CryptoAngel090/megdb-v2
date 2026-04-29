import type { ReactNode } from 'react'
import { SiteShell } from '@/app/_shells/SiteShell'

export default function SiteGroupLayout({ children }: { children: ReactNode }) {
  return <SiteShell detailShellOptimizationEnabled={false}>{children}</SiteShell>
}
