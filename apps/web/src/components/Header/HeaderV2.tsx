'use client'

// client: scroll state, auth state, mobile sheet/menu state

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { clearUser, getUser } from '@/lib/auth-client'
import { SearchBar } from '@/components/SearchBar/SearchBar'
import { HeaderBreadcrumb } from './HeaderExtras'
import styles from './HeaderV2.module.css'

/* ── Navigation ──────────────────────────────────────────────────── */

/** Desktop nav — visible ≥1024px */
const DESKTOP_LINKS = [
  { href: '/categories', label: 'Browse' },
  { href: '/movies', label: 'Movies' },
  { href: '/series', label: 'Series' },
  { href: '/watchlist', label: 'Watchlist' },
] as const

const BROWSE_GENRES = [
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
] as const

/** Sheet nav — visible in drawer on tablet + mobile */
const SHEET_LINKS = [
  { href: '/', label: 'Home', icon: <HomeIcon /> },
  { href: '/movies', label: 'Movies', icon: <FilmIcon /> },
  { href: '/series', label: 'Series', icon: <TvIcon /> },
  { href: '/people', label: 'People', icon: <PersonIcon /> },
  { href: '/watchlist', label: 'Watchlist', icon: <BookmarkIcon /> },
] as const

/** Bottom nav — mobile only (<768px) */
const BOTTOM_NAV = [
  { href: '/', label: 'Home', icon: <HomeIcon size={22} />, activeIcon: <HomeIconFilled size={22} /> },
  { href: '/search', label: 'Search', icon: <SearchIcon size={22} />, activeIcon: <SearchIconFilled size={22} /> },
  { href: '/movies', label: 'Browse', icon: <GridIcon size={22} />, activeIcon: <GridIconFilled size={22} /> },
  { href: '/watchlist', label: 'Saved', icon: <BookmarkIcon size={22} />, activeIcon: <BookmarkIconFilled size={22} /> },
  { href: '/profile', label: 'Profile', icon: <PersonIcon size={22} />, activeIcon: <PersonIconFilled size={22} /> },
] as const

/* ── Component ───────────────────────────────────────────────────── */

export function HeaderV2() {
  const pathname = usePathname()
  const router = useRouter()

  const [scrolled, setScrolled] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [browseOpen, setBrowseOpen] = useState(false)

  const sheetRef = useRef<HTMLDivElement>(null)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const browseCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Scroll watcher */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Auth sync */
  useEffect(() => {
    const sync = () => setIsLoggedIn(getUser() !== null)
    sync()
    window.addEventListener('focus', sync)
    document.addEventListener('visibilitychange', sync)
    return () => {
      window.removeEventListener('focus', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])

  /* Close sheet on route change */
  useEffect(() => {
    setMenuOpen(false)
    setBrowseOpen(false)
  }, [pathname])

  useEffect(
    () => () => {
      if (browseCloseTimerRef.current) {
        clearTimeout(browseCloseTimerRef.current)
      }
    },
    [],
  )

  /* Trap focus / close on Escape */
  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        menuBtnRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    menuBtnRef.current?.focus()
  }, [])

  const handleLogout = useCallback(() => {
    clearUser()
    setIsLoggedIn(false)
    router.push('/')
  }, [router])

  const isActive = useCallback(
    (href: string) =>
      href === '/' ? pathname === '/' : pathname.startsWith(href),
    [pathname],
  )

  const openBrowseMenu = useCallback(() => {
    if (browseCloseTimerRef.current) {
      clearTimeout(browseCloseTimerRef.current)
    }
    setBrowseOpen(true)
  }, [])

  const closeBrowseMenuDelayed = useCallback(() => {
    if (browseCloseTimerRef.current) {
      clearTimeout(browseCloseTimerRef.current)
    }
    browseCloseTimerRef.current = setTimeout(() => {
      setBrowseOpen(false)
    }, 140)
  }, [])

  return (
    <>
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <header
        className={`${styles.root} ${scrolled ? styles.rootScrolled : ''}`}
        role="banner"
      >
        <div className={styles.inner}>
          {/* Logo */}
          <Link href="/" className={styles.logo} aria-label="MegDB — home">
            <LogoIcon />
            <span className={styles.logoWord}>
              <span className={styles.logoMeg}>Meg</span>
              <span className={styles.logoDB}>DB</span>
            </span>
          </Link>

          {/* Search — hidden on mobile, visible tablet+ */}
          <div className={styles.search}>
            <SearchBar />
          </div>

          {/* Desktop nav links */}
          <nav className={styles.nav} aria-label="Main navigation">
            <ul className={styles.navList} role="list">
              {DESKTOP_LINKS.map((link) => {
                const isBrowse = link.href === '/categories'
                const browseActive =
                  isActive('/categories') || pathname.startsWith('/movies/category/')
                const linkActive = isBrowse ? browseActive : isActive(link.href)
                return (
                  <li
                    key={link.href}
                    className={`${styles.navItem} ${isBrowse ? styles.navItemWithMenu : ''}`}
                    onMouseEnter={isBrowse ? openBrowseMenu : undefined}
                    onMouseLeave={isBrowse ? closeBrowseMenuDelayed : undefined}
                  >
                    <Link
                      href={link.href}
                      className={`${styles.navLink} ${linkActive ? styles.navLinkActive : ''}`}
                      aria-current={linkActive ? 'page' : undefined}
                      aria-haspopup={isBrowse ? 'menu' : undefined}
                      aria-expanded={isBrowse ? browseOpen : undefined}
                      onFocus={isBrowse ? openBrowseMenu : undefined}
                    >
                      {link.label}
                    </Link>
                    {isBrowse && browseOpen && (
                      <div
                        className={styles.browseMenu}
                        role="menu"
                        aria-label="Browse by genre"
                        onMouseEnter={openBrowseMenu}
                        onMouseLeave={closeBrowseMenuDelayed}
                      >
                        <p className={styles.browseMenuTitle}>Genres</p>
                        <div className={styles.browseMenuGrid}>
                          {BROWSE_GENRES.map((genre) => (
                            <Link
                              key={genre.href}
                              href={genre.href}
                              role="menuitem"
                              className={`${styles.browseMenuItem} ${isActive(genre.href) ? styles.browseMenuItemActive : ''}`}
                              onClick={() => setBrowseOpen(false)}
                            >
                              {genre.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Actions */}
          <div className={styles.actions}>
            <Link
              href="/notifications"
              className={styles.iconBtn}
              aria-label="Notifications"
            >
              <BellIcon />
            </Link>

            {/* Auth — desktop only (CTAs hidden on tablet via CSS) */}
            {isLoggedIn ? (
              <Link href="/profile" className={styles.iconBtn} aria-label="Your profile">
                <PersonIcon />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className={`${styles.ctaBtn} ${styles.ctaPrimary}`}
                >
                  Sign Up
                </Link>
                <Link href="/login" className={styles.ctaBtn}>
                  Sign In
                </Link>
              </>
            )}

            {/* Mobile / tablet menu button */}
            <button
              ref={menuBtnRef}
              type="button"
              className={styles.menuBtn}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="header-sheet"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Slide-in sheet (tablet + mobile) ─────────────────────── */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className={styles.sheetBackdrop}
            aria-hidden="true"
            onClick={closeMenu}
          />

          {/* Sheet panel */}
          <div
            id="header-sheet"
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className={styles.sheet}
          >
            {SHEET_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.sheetLink} ${isActive(link.href) ? styles.sheetLinkActive : ''}`}
                aria-current={isActive(link.href) ? 'page' : undefined}
                onClick={closeMenu}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}

            <div className={styles.sheetDivider} role="separator" />

            {/* Auth section at bottom of sheet */}
            <div className={styles.sheetAuthGroup}>
              {isLoggedIn ? (
                <button
                  type="button"
                  className={`${styles.sheetAuthBtn} ${styles.sheetAuthSignIn}`}
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              ) : (
                <>
                  <Link
                    href="/register"
                    className={`${styles.sheetAuthBtn} ${styles.sheetAuthSignUp}`}
                    onClick={closeMenu}
                  >
                    Sign Up — it&apos;s free
                  </Link>
                  <Link
                    href="/login"
                    className={`${styles.sheetAuthBtn} ${styles.sheetAuthSignIn}`}
                    onClick={closeMenu}
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Bottom navigation (mobile ≤767px) ────────────────────── */}
      <nav className={styles.bottomNav} aria-label="Bottom navigation">
        {BOTTOM_NAV.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.bnItem} ${active ? styles.bnItemActive : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {active ? item.activeIcon : item.icon}
              <span className={styles.bnLabel}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <HeaderBreadcrumb />
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   SVG Icon Components
   All icons use currentColor, sized via width/height props.
   ═══════════════════════════════════════════════════════════════════ */

interface IconProps {
  size?: number
}

/** Logo mark: rounded square with bold M letterform */
function LogoIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.logoIcon}
      aria-hidden="true"
    >
      <rect width="28" height="28" rx="7.5" fill="currentColor" />
      {/* Bold angular M — aggressive, sharp corners */}
      <path
        d="M5 20V9L14 16.5L23 9V20"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

/* ── Sheet icons ─────────────────────────────────────────────────── */

function HomeIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12L12 3l9 9" />
      <path d="M5 10v10a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V10" />
    </svg>
  )
}

function HomeIconFilled({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.1L2 11.5V21a1 1 0 001 1h6v-5h6v5h6a1 1 0 001-1V11.5L12 2.1z" />
    </svg>
  )
}

function FilmIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  )
}

function TvIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="15" rx="2" />
      <polyline points="17 2 12 7 7 2" />
    </svg>
  )
}

function PersonIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function PersonIconFilled({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4z" />
    </svg>
  )
}

function BookmarkIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function BookmarkIconFilled({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function SearchIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function SearchIconFilled({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function GridIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}

function GridIconFilled({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}
