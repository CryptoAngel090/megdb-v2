'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { getImageUrl } from '@/lib/tmdb'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import styles from './MoviePhotosSection.module.css'

interface MoviePhotosSectionClientProps {
  sectionId: string
  title: string
  images: Array<{
    filePath: string
    width: number
    height: number
  }>
}

function CloseIcon({ className }: { className?: string | undefined }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function ChevronLeftIcon({ className }: { className?: string | undefined }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string | undefined }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export function MoviePhotosSectionClient({ sectionId, title, images }: MoviePhotosSectionClientProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [portalReady, setPortalReady] = useState(false)

  const trackId = useMemo(() => `${sectionId}-track`, [sectionId])
  const shellId = useMemo(() => `${sectionId}-shell`, [sectionId])

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useEffect(() => {
    const shell = document.getElementById(shellId)
    const track = document.getElementById(trackId)
    if (!shell || !track) return

    const onClick = (event: Event) => {
      const target = event.target as HTMLElement | null
      if (!target) return

      const navBtn = target.closest<HTMLButtonElement>('button[data-scroll]')
      if (navBtn) {
        const dir = navBtn.dataset.scroll
        track.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' })
        return
      }

      const thumbBtn = target.closest<HTMLButtonElement>('button[data-photo-index]')
      if (thumbBtn) {
        const idx = Number(thumbBtn.dataset.photoIndex)
        if (Number.isFinite(idx)) setSelected(idx)
      }
    }

    shell.addEventListener('click', onClick)
    return () => shell.removeEventListener('click', onClick)
  }, [shellId, trackId])

  useEffect(() => {
    if (selected === null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null)
      if (event.key === 'ArrowLeft') setSelected((i) => (i !== null && i > 0 ? i - 1 : i))
      if (event.key === 'ArrowRight')
        setSelected((i) => (i !== null && i < images.length - 1 ? i + 1 : i))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selected, images.length])

  const active = selected !== null ? images[selected] : null

  if (!portalReady) return null

  return createPortal(
    selected !== null && active ? (
      <div className={styles.lightbox} onClick={() => setSelected(null)} role="presentation">
        <button
          type="button"
          className={styles.close}
          aria-label="Close"
          onClick={() => setSelected(null)}
        >
          <CloseIcon className={`${iconSlot.block} ${iconSlot.sm}`} />
        </button>
        {selected > 0 && (
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowLeft}`}
            aria-label="Previous"
            onClick={(e) => {
              e.stopPropagation()
              setSelected((i) => (i !== null && i > 0 ? i - 1 : i))
            }}
          >
            <ChevronLeftIcon className={`${iconSlot.block} ${iconSlot.md}`} />
          </button>
        )}
        {selected < images.length - 1 && (
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowRight}`}
            aria-label="Next"
            onClick={(e) => {
              e.stopPropagation()
              setSelected((i) => (i !== null && i < images.length - 1 ? i + 1 : i))
            }}
          >
            <ChevronRightIcon className={`${iconSlot.block} ${iconSlot.md}`} />
          </button>
        )}
        <div onClick={(e) => e.stopPropagation()} role="presentation">
          <Image
            src={getImageUrl(active.filePath, 'w1280')}
            alt={`${title} — still ${selected + 1} of ${images.length}`}
            width={active.width}
            height={active.height}
            className={styles.lightboxImg}
            priority
          />
        </div>
      </div>
    ) : null,
    document.body
  )
}
