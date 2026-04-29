'use client'
// client: defers Framer / ripple chrome that is not needed for first paint (INP / main-thread)

import { Ripple } from '@/components/Ripple/Ripple'
import { ScrollProgressBar } from '@/components/ScrollProgressBar/ScrollProgressBar'
import { BackToTop } from '@/components/BackToTop/BackToTop'

export function DeferredRippleScroll() {
  return (
    <>
      <Ripple />
      <ScrollProgressBar />
    </>
  )
}

export function DeferredBackToTop() {
  return <BackToTop />
}
