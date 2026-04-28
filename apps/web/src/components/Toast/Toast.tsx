'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import styles from './Toast.module.css'

// ── Types ────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration: number
}

interface ToastContextValue {
  show: (message: string, type?: ToastType, duration?: number) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
}

// ── Context ──────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

// ── Provider ─────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counterRef = useRef(0)

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
    const id = `toast-${++counterRef.current}`
    setToasts((prev) => [...prev.slice(-4), { id, message, type, duration }])
  }, [])

  const success = useCallback((m: string, d?: number) => show(m, 'success', d), [show])
  const error = useCallback((m: string, d?: number) => show(m, 'error', d ?? 5000), [show])
  const info = useCallback((m: string, d?: number) => show(m, 'info', d), [show])

  return (
    <ToastContext.Provider value={{ show, success, error, info }}>
      {children}
      <ToastList toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

// ── ToastList ────────────────────────────────────────────

function ToastList({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div
      className={styles.list}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}

// ── ToastItem ────────────────────────────────────────────

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(toast.id), toast.duration)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [toast.id, toast.duration, onDismiss])

  // Пауза при hover
  const pause = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }
  const resume = () => {
    timerRef.current = setTimeout(() => onDismiss(toast.id), 1500)
  }

  return (
    <motion.div
      className={`${styles.toast} ${styles[toast.type]}`}
      role="alert"
      aria-live="assertive"
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.94 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      <span className={styles.icon} aria-hidden="true">
        {ICONS[toast.type]}
      </span>
      <span className={styles.message}>{toast.message}</span>
      <button
        type="button"
        className={styles.close}
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
      >
        <svg
          className={`${iconSlot.block} ${iconSlot.inline14}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  )
}
