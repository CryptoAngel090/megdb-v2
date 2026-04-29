import type { ReactNode } from 'react'
import { DetailShell } from '@/app/_shells/DetailShell'

export default function DetailGroupLayout({ children }: { children: ReactNode }) {
  return <DetailShell>{children}</DetailShell>
}
