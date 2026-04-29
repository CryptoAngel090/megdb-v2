'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import blockStyles from './MovieTrailerBlock.module.css'
import { OPEN_MOVIE_TRAILER_EVENT } from './movieTrailerEvents'

type MovieTrailerBlockClientProps = {
  sectionId: string
  videoKey: string
  embedTitle: string
}

export function MovieTrailerBlockClient({
  sectionId,
  videoKey,
  embedTitle,
}: MovieTrailerBlockClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [portalReady, setPortalReady] = useState(false)

  useEffect(() => {
    setPortalReady(true)
  }, [])

  const openModal = useCallback(() => {
    setIsModalOpen(true)
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.overflow = 'hidden'
    document.body.dataset.scrollY = String(scrollY)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    const scrollY = parseInt(document.body.dataset.scrollY || '0', 10)
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.overflow = ''
    delete document.body.dataset.scrollY
    window.scrollTo(0, scrollY)
  }, [])

  useEffect(() => {
    const shell = document.getElementById(sectionId)
    if (!shell) return
    const onClick = (event: Event) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (target.closest('[data-trailer-play="true"]')) openModal()
    }
    shell.addEventListener('click', onClick)
    return () => shell.removeEventListener('click', onClick)
  }, [sectionId, openModal])

  useEffect(() => {
    return () => {
      const scrollY = parseInt(document.body.dataset.scrollY || '0', 10)
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.overflow = ''
      delete document.body.dataset.scrollY
      if (scrollY) window.scrollTo(0, scrollY)
    }
  }, [])

  useEffect(() => {
    if (!isModalOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isModalOpen, closeModal])

  useEffect(() => {
    const onOpen = () => openModal()
    window.addEventListener(OPEN_MOVIE_TRAILER_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_MOVIE_TRAILER_EVENT, onOpen)
  }, [openModal])

  if (!portalReady) return null

  return createPortal(
    isModalOpen ? (
      <div
        className={blockStyles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={embedTitle}
        onClick={closeModal}
      >
        <div className={blockStyles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={blockStyles.modalVideoShell}>
            <button
              type="button"
              className={blockStyles.modalClose}
              onClick={closeModal}
              aria-label="Close trailer"
            >
              <svg
                className={`${iconSlot.block} ${iconSlot.lg}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&mute=1&playsinline=1&rel=0`}
              title={embedTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className={blockStyles.modalIframe}
            />
          </div>
        </div>
      </div>
    ) : null,
    document.body
  )
}
