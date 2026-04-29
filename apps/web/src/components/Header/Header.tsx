'use client'
// client: orchestrates desktop pill + mobile drawer via useHeaderShell

import { HeaderBreadcrumb, HeaderContextTint } from './HeaderExtras'
import { HeaderDesktopBar } from './HeaderDesktopBar'
import { useHeaderShell } from './Header.hooks'
import { HeaderMobileDrawer } from './HeaderMobileDrawer'

export function Header() {
  const { setContextTinted, desktopBarProps, mobileDrawerProps } = useHeaderShell()

  return (
    <>
      <HeaderDesktopBar {...desktopBarProps} />
      <HeaderBreadcrumb />
      <HeaderContextTint onTintChange={setContextTinted} />
      <HeaderMobileDrawer {...mobileDrawerProps} />
    </>
  )
}
