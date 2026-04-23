'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import styles from './MovieShareButton.module.css'

type Props = {
  title: string
  className?: string | undefined
  /** When true, only `className` is applied (no default `.root`) — use for hero CTA styling. */
  unstyled?: boolean | undefined
  /** Optional icon / markup before the label (e.g. hero CTAs). */
  icon?: ReactNode | undefined
}

type ShareTarget = {
  id: string
  label: string
  href: (url: string, title: string) => string
}

const SHARE_TARGETS: ShareTarget[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    href: (url, title) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    href: (url, title) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
  },
  {
    id: 'x',
    label: 'X',
    href: (url, title) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: 'viber',
    label: 'Viber',
    href: (url, title) => `viber://forward?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: () => 'https://www.instagram.com/',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}`,
  },
]

function useShareUrl(): string {
  return typeof window !== 'undefined' ? window.location.href : ''
}

export function MovieShareButton({ title, className, unstyled, icon }: Props) {
  const [open, setOpen] = useState(false)
  const [portalReady, setPortalReady] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)
  const [copied, setCopied] = useState(false)
  const titleId = useId()

  useEffect(() => {
    setPortalReady(true)
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const close = useCallback(() => setOpen(false), [])

  const copyLink = useCallback(async () => {
    const url = useShareUrl()
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard denied */
    }
  }, [])

  const nativeShare = useCallback(async () => {
    const url = useShareUrl()
    if (!navigator.share) return
    try {
      await navigator.share({ title, url, text: title })
      close()
    } catch {
      /* cancelled or failed */
    }
  }, [title, close])

  const btnClass = unstyled ? (className ?? '') : [styles.root, className].filter(Boolean).join(' ')

  const urlForLinks = useShareUrl()

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.modalBackdrop}
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className={styles.modalPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 id={titleId} className={styles.modalTitle}>
                  Share
                </h2>
                <p className={styles.modalSubtitle}>{title}</p>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={close}
                aria-label="Close share dialog"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className={styles.modalBody}>
              {canNativeShare && (
                <button
                  type="button"
                  className={styles.actionRow}
                  onClick={() => void nativeShare()}
                >
                  <span className={styles.actionIcon} aria-hidden>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <path d="m8.59 13.51 6.83 3.98M15.41 6.49l-6.82 3.98" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className={styles.actionLabel}>Apps on this device</span>
                  <span className={styles.actionHint}>System share sheet</span>
                </button>
              )}

              <button type="button" className={styles.actionRow} onClick={() => void copyLink()}>
                <span className={styles.actionIcon} aria-hidden>
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </span>
                <span className={styles.actionLabel}>{copied ? 'Link copied' : 'Copy link'}</span>
              </button>

              <p className={styles.gridLabel}>Social & messengers</p>
              <ul className={styles.targetGrid} role="list">
                {SHARE_TARGETS.map((t) => (
                  <li key={t.id}>
                    <a
                      href={t.href(urlForLinks, title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.targetLink}
                      onClick={close}
                    >
                      {t.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n${urlForLinks}`)}`}
                    className={styles.targetLink}
                    onClick={close}
                  >
                    Email
                  </a>
                </li>
              </ul>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <button
        type="button"
        className={btnClass}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {icon}
        Share
      </button>
      {portalReady ? createPortal(modal, document.body) : null}
    </>
  )
}
