'use client'

// client: spotlight, count-up, magnetic socials, active link, newsletter, lang switcher, last updated

import { ArrowRight } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import styles from './Footer.module.css'

// ── Spotlight ─────────────────────────────────────────────

export function FooterSpotlight() {
  const ref = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      el.style.setProperty('--sx', `${x}%`)
      el.style.setProperty('--sy', `${y}%`)
      el.style.opacity = '1'
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (ref.current) ref.current.style.opacity = '0'
  }, [])

  useEffect(() => {
    const footer = ref.current?.closest('footer')
    if (!footer) return
    footer.addEventListener('mousemove', handleMouseMove)
    footer.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      footer.removeEventListener('mousemove', handleMouseMove)
      footer.removeEventListener('mouseleave', handleMouseLeave)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [handleMouseMove, handleMouseLeave])

  return <div ref={ref} className={styles.spotlight} aria-hidden="true" style={{ opacity: 0 }} />
}

// ── Count-up ──────────────────────────────────────────────

interface CountUpProps {
  target: number
  suffix?: string
  duration?: number
}

export function CountUp({ target, suffix = '', duration = 1800 }: CountUpProps) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.round(eased * target))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return (
    <span ref={ref}>
      {value.toLocaleString()}
      {suffix}
    </span>
  )
}

// ── Magnetic social link ──────────────────────────────────

interface MagneticProps {
  children: React.ReactNode
  className?: string
  href: string
  label: string
}

export function MagneticLink({ children, className, href, label }: MagneticProps) {
  const ref = useRef<HTMLAnchorElement>(null)
  const rafRef = useRef<number | null>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.35
      const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.35
      el.style.transform = `translate(${dx}px, ${dy}px)`
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (ref.current) ref.current.style.transform = 'translate(0,0)'
  }, [])

  return (
    <a
      ref={ref}
      href={href}
      className={className}
      aria-label={`${label} — opens in new tab`}
      target="_blank"
      rel="noopener noreferrer"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transition:
          'transform 0.18s var(--ease-out), color 150ms ease, background 150ms ease, border-color 150ms ease',
      }}
    >
      {children}
    </a>
  )
}

// ── Active nav link ───────────────────────────────────────

interface ActiveNavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  activeClassName?: string
}

export function ActiveNavLink({
  href,
  children,
  className = '',
  activeClassName = '',
}: ActiveNavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
  return (
    <a href={href} className={`${className}${isActive ? ` ${activeClassName}` : ''}`}>
      {children}
    </a>
  )
}

// ── Newsletter form ───────────────────────────────────────

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!email.trim()) return
      setStatus('loading')
      // Simulate — replace with real API call
      setTimeout(() => {
        setStatus('success')
        setEmail('')
      }, 900)
    },
    [email]
  )

  if (status === 'success') {
    return (
      <div className={styles.newsletterSuccess} role="status">
        <span className={styles.newsletterSuccessIcon}>✓</span>
        <span>You&apos;re in! We&apos;ll keep you updated.</span>
      </div>
    )
  }

  return (
    <form className={styles.newsletterForm} onSubmit={handleSubmit} noValidate>
      <label htmlFor="footer-email" className={styles.newsletterLabel}>
        Get updates
      </label>
      <div className={styles.newsletterRow}>
        <input
          id="footer-email"
          type="email"
          className={styles.newsletterInput}
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          aria-label="Email address for updates"
          disabled={status === 'loading'}
        />
        <button
          type="submit"
          className={styles.newsletterBtn}
          disabled={status === 'loading' || !email.trim()}
          aria-label="Subscribe"
        >
          {status === 'loading' ? (
            <span className={styles.newsletterSpinner} aria-hidden="true" />
          ) : (
            <ArrowRight className={`${iconSlot.block} ${iconSlot.sm}`} aria-hidden={true} />
          )}
        </button>
      </div>
    </form>
  )
}

// ── Last updated ──────────────────────────────────────────

export function LastUpdated() {
  const [label, setLabel] = useState('just now')

  useEffect(() => {
    // Simulate last sync — in production read from API/env
    const syncedAt = Date.now() - 4 * 60 * 1000 // 4 min ago

    function format(ms: number): string {
      const diff = Math.floor((Date.now() - ms) / 1000)
      if (diff < 60) return 'just now'
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
      return `${Math.floor(diff / 86400)}d ago`
    }

    setLabel(format(syncedAt))
    const id = setInterval(() => setLabel(format(syncedAt)), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className={styles.lastUpdated} aria-label={`Data last updated ${label}`}>
      Updated {label}
    </span>
  )
}
