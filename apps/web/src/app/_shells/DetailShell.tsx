import type { ReactNode } from 'react'
import { DetailAppChrome } from '@/components/AppChrome/DetailAppChrome'

interface DetailShellProps {
  children: ReactNode
}

export function DetailShell({ children }: DetailShellProps) {
  return (
    <>
      <DetailAppChrome>{children}</DetailAppChrome>
    </>
  )
}

