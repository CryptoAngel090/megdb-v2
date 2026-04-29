'use client'

import Link from 'next/link'
import type { RefObject } from 'react'
import styles from './Header.module.css'

export interface HeaderMegaMenuPanelProps {
  panelRef: RefObject<HTMLDivElement | null>
  onPanelMouseEnter: () => void
  onPanelMouseLeave: () => void
  onItemNavigate: () => void
}

/**
 * Desktop mega-menu body (Browse + Genres). Parent owns hover timing and `megaMenuOpen` gate.
 */
export function HeaderMegaMenuPanel({
  panelRef,
  onPanelMouseEnter,
  onPanelMouseLeave,
  onItemNavigate,
}: HeaderMegaMenuPanelProps) {
  return (
    <div
      ref={panelRef}
      className={styles.megaMenu}
      role="menu"
      aria-label="Browse by genre"
      onMouseEnter={onPanelMouseEnter}
      onMouseLeave={onPanelMouseLeave}
    >
      <div className={styles.megaMenuBody}>
        <div className={styles.megaMenuRight}>
          <p className={styles.megaMenuTitle}>Browse</p>
          <div className={styles.megaMenuBrowseList}>
            {[
              {
                label: 'Movies',
                href: '/movies',
                icon: (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    aria-hidden
                  >
                    <rect x="2" y="2" width="20" height="20" rx="2.5" />
                    <path d="M7 2v20M17 2v20M2 12h20M2 7h5M17 7h5M2 17h5M17 17h5" />
                  </svg>
                ),
              },
              {
                label: 'Series',
                href: '/series',
                icon: (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    aria-hidden
                  >
                    <rect x="2" y="3" width="20" height="13" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                  </svg>
                ),
              },
              {
                label: 'Cartoons',
                href: '/cartoons',
                icon: (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    aria-hidden
                  >
                    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z" />
                  </svg>
                ),
              },
              {
                label: 'TV Shows',
                href: '/tvshows',
                icon: (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    aria-hidden
                  >
                    <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0" />
                    <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
                  </svg>
                ),
              },
              {
                label: 'Random Movie',
                href: '/movies/random',
                icon: (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    aria-hidden
                  >
                    <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22M18 2l4 4-4 4M18 14l4 4-4 4" />
                  </svg>
                ),
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={styles.megaMenuBrowseItem}
                role="menuitem"
                onClick={onItemNavigate}
              >
                <span className={styles.megaMenuBrowseIcon}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.megaMenuDivider} aria-hidden />

        <div className={styles.megaMenuLeft}>
          <p className={styles.megaMenuTitle}>Genres</p>
          <div className={styles.megaMenuGrid}>
            {[
              { label: 'Action', href: '/movies/category/action' },
              { label: 'Adventure', href: '/movies/category/adventure' },
              { label: 'Animation', href: '/movies/category/animation' },
              { label: 'Comedy', href: '/movies/category/comedy' },
              { label: 'Crime', href: '/movies/category/crime' },
              { label: 'Documentary', href: '/movies/category/documentary' },
              { label: 'Drama', href: '/movies/category/drama' },
              { label: 'Family', href: '/movies/category/family' },
              { label: 'Fantasy', href: '/movies/category/fantasy' },
              { label: 'History', href: '/movies/category/history' },
              { label: 'Horror', href: '/movies/category/horror' },
              { label: 'Music', href: '/movies/category/music' },
              { label: 'Mystery', href: '/movies/category/mystery' },
              { label: 'Romance', href: '/movies/category/romance' },
              { label: 'Sci-Fi', href: '/movies/category/sci-fi' },
              { label: 'Thriller', href: '/movies/category/thriller' },
              { label: 'War', href: '/movies/category/war' },
              { label: 'Western', href: '/movies/category/western' },
            ].map((g) => (
              <Link
                key={g.href}
                href={g.href}
                className={styles.megaMenuItem}
                role="menuitem"
                onClick={onItemNavigate}
              >
                {g.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
