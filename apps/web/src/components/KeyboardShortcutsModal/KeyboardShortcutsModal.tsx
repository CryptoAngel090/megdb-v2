'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './KeyboardShortcutsModal.module.css'

interface ShortcutRow {
  keys: string[]
  label: string
}

const SHORTCUTS: ShortcutRow[] = [
  { keys: ['/'], label: 'Open search' },
  { keys: ['?'], label: 'Show shortcuts' },
  { keys: ['Esc'], label: 'Close / dismiss' },
  { keys: ['g', 'h'], label: 'Go to Home' },
  { keys: ['g', 'm'], label: 'Go to Movies' },
  { keys: ['g', 's'], label: 'Go to Series' },
  { keys: ['g', 'c'], label: 'Go to Cartoons' },
  { keys: ['↑', '↓'], label: 'Navigate search results' },
  { keys: ['Enter'], label: 'Open selected result' },
]

interface KeyboardShortcutsModalProps {
  open: boolean
  onClose: () => void
}

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Блокируем скролл
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.header}>
              <h2 id="shortcuts-title" className={styles.title}>
                Keyboard Shortcuts
              </h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close shortcuts"
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

            <ul className={styles.list} role="list">
              {SHORTCUTS.map((s) => (
                <li key={s.label} className={styles.row}>
                  <span className={styles.keys}>
                    {s.keys.map((k, i) => (
                      <span key={k}>
                        <kbd className={styles.kbd}>{k}</kbd>
                        {i < s.keys.length - 1 && <span className={styles.then}>then</span>}
                      </span>
                    ))}
                  </span>
                  <span className={styles.label}>{s.label}</span>
                </li>
              ))}
            </ul>

            <p className={styles.hint}>
              Press <kbd className={styles.kbd}>?</kbd> anytime to show this panel
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
