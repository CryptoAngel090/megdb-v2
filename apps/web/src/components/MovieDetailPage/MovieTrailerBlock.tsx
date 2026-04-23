'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import blockStyles from './MovieTrailerBlock.module.css'
import { OPEN_MOVIE_TRAILER_EVENT } from './movieTrailerEvents'

type MovieTrailerBlockProps = {
  videoKey: string
  embedTitle: string
  boxClassName: string | undefined
}

function normalizeYoutubeKey(raw: string): string {
  const s = raw.trim()
  const fromQuery = s.match(/[?&]v=([a-zA-Z0-9_-]{6,})/)
  if (fromQuery) return fromQuery[1]!
  const fromShort = s.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/)
  if (fromShort) return fromShort[1]!
  const fromEmbed = s.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/)
  if (fromEmbed) return fromEmbed[1]!
  return s
}

/**
 * Trailer plays in a full-viewport overlay. Rendered via `createPortal(document.body)` so the
 * layer sits above `#main-content` (z-index: 1) and the fixed header (z-index: 1000).
 */
export function MovieTrailerBlock({ videoKey, embedTitle, boxClassName }: MovieTrailerBlockProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [portalReady, setPortalReady] = useState(false)

  const k = normalizeYoutubeKey(videoKey)
  const poster = `https://img.youtube.com/vi/${k}/hqdefault.jpg`

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

  const modalTree = (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          className={blockStyles.modal}
          role="dialog"
          aria-modal="true"
          aria-label={embedTitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
        >
          <motion.div
            className={blockStyles.modalContent}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={blockStyles.modalVideoShell}>
              <button
                type="button"
                className={blockStyles.modalClose}
                onClick={closeModal}
                aria-label="Close trailer"
              >
                <svg
                  width="24"
                  height="24"
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
                src={`https://www.youtube.com/embed/${k}?autoplay=1&mute=1&playsinline=1&rel=0`}
                title={embedTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className={blockStyles.modalIframe}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <div className={blockStyles.wrap}>
        <div className={boxClassName} style={{ background: '#0a0a0a' }}>
          <div
            className={blockStyles.posterLayer}
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.5)), url(${poster})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <button
            type="button"
            onClick={openModal}
            className={blockStyles.playOverlay}
            aria-label={`Play trailer: ${embedTitle}`}
          >
            <span className={blockStyles.playDisc} aria-hidden>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className={blockStyles.playLabel}>Play trailer</span>
          </button>
        </div>
      </div>

      {portalReady ? createPortal(modalTree, document.body) : null}
    </>
  )
}
