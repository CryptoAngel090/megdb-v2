'use client'
// client: breadcrumb trail + context-aware backdrop color

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect } from 'react'
import styles from './Header.module.css'

// ── Breadcrumb ────────────────────────────────────────────

interface BreadcrumbSegment {
  label: string
  href: string | null
}

const SECTION_LABELS: Record<string, string> = {
  movies: 'Movies',
  series: 'Series',
  cartoons: 'Cartoons',
  tvshows: 'TV Shows',
  movie: 'Movies',
  serie: 'Series',
  cartoon: 'Cartoons',
  tvshow: 'TV Shows',
  person: 'People',
  search: 'Search',
  profile: 'Profile',
  settings: 'Settings',
  categories: 'Browse',
}

function buildBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return []

  const crumbs: BreadcrumbSegment[] = [{ label: 'Home', href: '/' }]

  // /movie/123/the-dark-knight → Movies > The Dark Knight
  // /movies → Movies
  if (parts.length >= 1) {
    const section = parts[0]!
    const sectionLabel = SECTION_LABELS[section]
    if (!sectionLabel) return []

    // Section root (e.g. /movies)
    const sectionHref = `/${section}`
    crumbs.push({ label: sectionLabel, href: parts.length > 1 ? sectionHref : null })

    // Detail page — parts[1] is id, parts[2] is slug
    if (parts.length >= 2) {
      // Try to get title from document title (SSR-safe fallback)
      const slug = parts[2]
      const label = slug
        ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : `#${parts[1]}`
      crumbs.push({ label, href: null })
    }
  }

  return crumbs
}

export function HeaderBreadcrumb() {
  const pathname = usePathname()

  /* Movie detail uses in-page breadcrumb under rating cards (`MovieDetailPage`). */
  if (pathname.startsWith('/movie/')) return null
  /* Person detail uses in-page breadcrumb under avatar. */
  if (pathname.startsWith('/person/')) return null
  /* Discover genre pages render breadcrumbs inside page content under Filters button. */
  if (pathname.startsWith('/movies/category/')) return null

  const crumbs = buildBreadcrumbs(pathname)

  // Only show on detail pages (3+ segments) or search
  const shouldShow = pathname.split('/').filter(Boolean).length >= 2

  if (!shouldShow || crumbs.length < 2) return null

  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={i} style={{ display: 'contents' }}>
            {i > 0 && (
              <span className={styles.breadcrumbSep} aria-hidden="true">
                ›
              </span>
            )}
            {isLast || !crumb.href ? (
              <span
                className={isLast ? styles.breadcrumbCurrent : styles.breadcrumbItem}
                aria-current={isLast ? 'page' : undefined}
              >
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className={styles.breadcrumbItem}>
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}

// ── Context-aware backdrop color ──────────────────────────

interface HeaderContextTintProps {
  onTintChange: (tinted: boolean) => void
}

export function HeaderContextTint({ onTintChange }: HeaderContextTintProps) {
  const pathname = usePathname()

  useEffect(() => {
    // Tint on movie/series/person detail pages
    const isDetailPage = /^\/(movie|series|cartoon|tvshow|person)\/\d+/.test(pathname)
    onTintChange(isDetailPage)
  }, [pathname, onTintChange])

  return null
}

// ── Keyboard nav for desktop nav links ───────────────────

export function useNavKeyboard(navRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const links = Array.from(nav.querySelectorAll<HTMLElement>('a[href], button'))
      const idx = links.indexOf(document.activeElement as HTMLElement)
      if (idx === -1) return
      e.preventDefault()
      const next =
        e.key === 'ArrowRight'
          ? links[(idx + 1) % links.length]
          : links[(idx - 1 + links.length) % links.length]
      next?.focus()
    }

    nav.addEventListener('keydown', handleKeyDown)
    return () => nav.removeEventListener('keydown', handleKeyDown)
  }, [navRef])
}
