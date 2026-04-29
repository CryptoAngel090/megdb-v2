'use client'

import { useCallback, useEffect, useState } from 'react'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import styles from './BackToTop.module.css'

/** Показывается после скролла на 400px вниз */
const SHOW_THRESHOLD = 400

export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_THRESHOLD)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <>
      {visible && (
        <button
          type="button"
          className={styles.btn}
          onClick={scrollToTop}
          aria-label="Back to top"
          title="Back to top"
        >
          <svg
            className={`${iconSlot.block} ${iconSlot.inline18}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      )}
    </>
  )
}
