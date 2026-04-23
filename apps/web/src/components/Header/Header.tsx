'use client'

import type { ReactNode } from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  pillVariants,
  drawerVariants,
  backdropVariants,
  navItemVariants,
  dropdownVariants,
} from './Header.animations'
import { SearchBar } from '@/components/SearchBar/SearchBar'
import { getNextSelectionIndex, hasLikelySessionCookie } from './drawerSearch.utils'
import styles from './Header.module.css'

interface NavLink {
  href: string
  label: string
  icon: ReactNode
  badge?: string
}
interface DrawerSearchResult {
  id: number
  type: 'movie' | 'series' | 'person'
  title: string
  subtitle?: string
  year?: string
  posterPath?: string | null
}

const NAV_LINKS: NavLink[] = [
  {
    href: '/movies',
    label: 'Movies',
    icon: (
      <svg
        width="15"
        height="15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        viewBox="0 0 24 24"
      >
        <rect x="2" y="2" width="20" height="20" rx="2.5" />
        <path d="M7 2v20M17 2v20M2 12h20M2 7h5M17 7h5M2 17h5M17 17h5" />
      </svg>
    ),
  },
  {
    href: '/series',
    label: 'Series',
    icon: (
      <svg
        width="15"
        height="15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        viewBox="0 0 24 24"
      >
        <rect x="2" y="3" width="20" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    href: '/cartoons',
    label: 'Cartoons',
    icon: (
      <svg
        width="15"
        height="15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        viewBox="0 0 24 24"
      >
        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z" />
      </svg>
    ),
  },
  {
    href: '/tvshows',
    label: 'TV Shows',
    badge: 'NEW',
    icon: (
      <svg
        width="15"
        height="15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        viewBox="0 0 24 24"
      >
        <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0" />
        <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: '/categories',
    label: 'Categories',
    icon: (
      <svg
        width="15"
        height="15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
]

/** Persisted unread count until the user opens /notifications (replace with API later). */
const NOTIF_UNREAD_STORAGE_KEY = 'megdb_notifications_unread'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const drawerSearchRef = useRef<HTMLInputElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const drawerSearchContainerRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const userMenuButtonRef = useRef<HTMLButtonElement>(null)

  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [drawerQuery, setDrawerQuery] = useState('')
  const [drawerResults, setDrawerResults] = useState<DrawerSearchResult[]>([])
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [drawerSearchFocused, setDrawerSearchFocused] = useState(false)
  const [drawerSelectedIndex, setDrawerSelectedIndex] = useState(-1)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [notifCount, setNotifCount] = useState(0)

  const markNotificationsSeen = useCallback(() => {
    setNotifCount(0)
    try {
      localStorage.setItem(NOTIF_UNREAD_STORAGE_KEY, '0')
    } catch {
      /* private mode / quota */
    }
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NOTIF_UNREAD_STORAGE_KEY)
      if (raw === null) return
      const n = Number.parseInt(raw, 10)
      if (!Number.isNaN(n) && n >= 0) setNotifCount(n)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const syncAuthState = () => {
      setIsLoggedIn(hasLikelySessionCookie(document.cookie))
    }

    syncAuthState()
    window.addEventListener('focus', syncAuthState)
    document.addEventListener('visibilitychange', syncAuthState)

    return () => {
      window.removeEventListener('focus', syncAuthState)
      document.removeEventListener('visibilitychange', syncAuthState)
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return

    const previousActiveElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    drawerSearchRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        return
      }

      if (event.key !== 'Tab' || !drawerRef.current) {
        return
      }

      const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
      if (focusableElements.length === 0) {
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      if (!firstElement || !lastElement) {
        return
      }
      const activeElement = document.activeElement

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      if (previousActiveElement) {
        previousActiveElement.focus()
      } else {
        menuButtonRef.current?.focus()
      }
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) {
      setDrawerQuery('')
      setDrawerResults([])
      setDrawerLoading(false)
      setDrawerSearchFocused(false)
      setDrawerSelectedIndex(-1)
      return
    }

    if (drawerQuery.trim().length < 2) {
      setDrawerResults([])
      setDrawerLoading(false)
      setDrawerSelectedIndex(-1)
      return
    }

    const controller = new AbortController()
    const loadDrawerResults = async () => {
      setDrawerLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(drawerQuery.trim())}`, {
          signal: controller.signal,
        })
        if (!response.ok) {
          setDrawerResults([])
          return
        }

        const data: unknown = await response.json()
        if (!data || typeof data !== 'object' || !('results' in data)) {
          setDrawerResults([])
          return
        }

        const results = (data as { results?: unknown }).results
        if (!Array.isArray(results)) {
          setDrawerResults([])
          setDrawerSelectedIndex(-1)
          return
        }

        const mappedResults = results as DrawerSearchResult[]
        setDrawerResults(mappedResults)
        setDrawerSelectedIndex((prev) => {
          if (mappedResults.length === 0) {
            return -1
          }
          return Math.min(prev, mappedResults.length - 1)
        })
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setDrawerResults([])
          setDrawerSelectedIndex(-1)
        }
      } finally {
        setDrawerLoading(false)
      }
    }
    const timer = setTimeout(() => {
      void loadDrawerResults()
    }, 250)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [drawerQuery, menuOpen])

  useEffect(() => {
    if (!menuOpen || !drawerSearchFocused) return

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!drawerSearchContainerRef.current?.contains(event.target as Node)) {
        setDrawerSearchFocused(false)
        setDrawerSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [menuOpen, drawerSearchFocused])

  useEffect(() => {
    if (!userMenuOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false)
        userMenuButtonRef.current?.focus()
      }
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [userMenuOpen])

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  const handleDrawerSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      if (drawerResults.length === 0) return
      e.preventDefault()
      setDrawerSelectedIndex((prev) => getNextSelectionIndex(prev, drawerResults.length, 'down'))
      return
    }

    if (e.key === 'ArrowUp') {
      if (drawerResults.length === 0) return
      e.preventDefault()
      setDrawerSelectedIndex((prev) => getNextSelectionIndex(prev, drawerResults.length, 'up'))
      return
    }

    if (e.key === 'Enter' && drawerQuery.trim()) {
      if (drawerSelectedIndex >= 0 && drawerResults[drawerSelectedIndex]) {
        e.preventDefault()
        handleDrawerResultClick(drawerResults[drawerSelectedIndex])
        return
      }
      router.push(`/search?q=${encodeURIComponent(drawerQuery.trim())}`)
      setMenuOpen(false)
      setDrawerQuery('')
    }
  }
  const handleDrawerResultClick = (result: DrawerSearchResult) => {
    router.push(`/${result.type}/${result.id}`)
    setMenuOpen(false)
    setDrawerQuery('')
  }

  const handleRandom = () => router.push('/movies/random')

  return (
    <>
      <div className={styles.navbarWrapper}>
        <motion.div
          className={`${styles.pill} ${scrolled ? styles.pillScrolled : ''}`}
          variants={pillVariants}
          animate={scrolled ? 'scrolled' : 'top'}
        >
          <div className={styles.inner}>
            <Link href="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
              <svg
                className={styles.logoIcon}
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
              <span className={styles.logoText}>
                Meg<span className={styles.logoAccent}>DB</span>
              </span>
            </Link>

            <nav aria-label="Main navigation" className={styles.nav}>
              <ul className={styles.links}>
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`${styles.link} ${isActive(link.href) ? styles.linkActive : ''}`}
                      aria-current={isActive(link.href) ? 'page' : undefined}
                    >
                      <span className={styles.linkIcon}>{link.icon}</span>
                      {link.label}
                      {link.badge && <span className={styles.navBadge}>{link.badge}</span>}
                      {isActive(link.href) && <span className={styles.linkDot} />}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className={styles.actions}>
              {/* Random — desktop */}
              <button
                className={`${styles.iconBtn} ${styles.randomBtn}`}
                onClick={handleRandom}
                aria-label="Random movie"
                title="Random movie"
              >
                <svg
                  width="17"
                  height="17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22M18 2l4 4-4 4M18 14l4 4-4 4" />
                </svg>
              </button>

              <button
                className={`${styles.iconBtn} ${styles.searchToggle}`}
                onClick={() => setSearchOpen((v) => !v)}
                aria-label="Search"
              >
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>

              <div className={styles.notifWrap}>
                <Link
                  href="/notifications"
                  className={styles.iconBtn}
                  aria-label="Notifications"
                  onClick={markNotificationsSeen}
                >
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </Link>
                {notifCount > 0 && <span className={styles.notifBadge}>{notifCount}</span>}
              </div>

              <Link
                href="/watchlist"
                className={`${styles.iconBtn} ${styles.watchlistBtn}`}
                aria-label="Watchlist"
              >
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </Link>

              {isLoggedIn ? (
                <div className={styles.userMenu}>
                  <button
                    ref={userMenuButtonRef}
                    className={styles.avatar}
                    onClick={() => setUserMenuOpen((v) => !v)}
                    aria-expanded={userMenuOpen}
                    aria-label="User menu"
                  >
                    <img src="https://i.pravatar.cc/80" alt="Avatar" className={styles.avatarImg} />
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        ref={userMenuRef}
                        className={styles.userDropdown}
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                      >
                        <Link href="/profile" className={styles.dropdownItem}>
                          Profile
                        </Link>
                        <Link href="/watchlist" className={styles.dropdownItem}>
                          Watchlist
                        </Link>
                        <Link href="/settings" className={styles.dropdownItem}>
                          Settings
                        </Link>
                        <div className={styles.dropdownDivider} />
                        <button className={styles.dropdownItem}>Logout</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link href="/register" className={styles.registerBtn}>
                    Sign Up
                  </Link>
                  <Link href="/login" className={styles.signInBtn}>
                    Sign In
                  </Link>
                </>
              )}

              <button
                ref={menuButtonRef}
                className={`${styles.iconBtn} ${styles.menuBtn}`}
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Open menu"
                aria-expanded={menuOpen}
              >
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating search */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className={styles.searchPanel}
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <SearchBar autoFocus onBlur={() => setSearchOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className={styles.backdrop}
              variants={backdropVariants}
              initial="closed"
              animate="open"
              exit="closed"
              onClick={() => setMenuOpen(false)}
            />

            <motion.div
              ref={drawerRef}
              className={styles.drawer}
              variants={drawerVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              {/* Header */}
              <div className={styles.drawerHeader}>
                <Link href="/" className={styles.drawerLogo} onClick={() => setMenuOpen(false)}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={styles.drawerLogoIcon}
                  >
                    <path d="M5 3l14 9-14 9V3z" />
                  </svg>
                  <span className={styles.drawerLogoText}>
                    Meg<span className={styles.drawerLogoAccent}>DB</span>
                  </span>
                </Link>
                <button
                  className={styles.drawerClose}
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* User */}
              <div className={styles.drawerUser}>
                {isLoggedIn ? (
                  <div className={styles.drawerUserRow}>
                    <img
                      src="https://i.pravatar.cc/80"
                      alt="Avatar"
                      className={styles.drawerAvatar}
                    />
                    <div>
                      <div className={styles.drawerUserName}>John Doe</div>
                      <div className={styles.drawerUserSub}>Member since 2024</div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.drawerAuthButtons}>
                    <Link
                      href="/register"
                      className={styles.drawerRegisterBtn}
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="22" y1="11" x2="16" y2="11" />
                      </svg>
                      Sign Up
                    </Link>
                    <Link
                      href="/login"
                      className={styles.drawerSignIn}
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                      </svg>
                      Sign In
                    </Link>
                  </div>
                )}
              </div>

              {/* Drawer search */}
              <div ref={drawerSearchContainerRef} className={styles.drawerSearch}>
                <div className={styles.drawerSearchWrap}>
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className={styles.drawerSearchIcon}
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    ref={drawerSearchRef}
                    type="text"
                    className={styles.drawerSearchInput}
                    placeholder="Search movies, series..."
                    value={drawerQuery}
                    onChange={(e) => setDrawerQuery(e.target.value)}
                    onKeyDown={handleDrawerSearch}
                    onFocus={() => setDrawerSearchFocused(true)}
                    onBlur={() => {
                      setTimeout(() => setDrawerSearchFocused(false), 120)
                    }}
                    aria-label="Search"
                    aria-expanded={
                      drawerSearchFocused &&
                      (drawerLoading || drawerResults.length > 0 || drawerQuery.trim().length >= 2)
                    }
                    aria-controls="drawer-search-results"
                  />
                </div>
                {drawerSearchFocused &&
                  (drawerLoading || drawerResults.length > 0 || drawerQuery.trim().length >= 2) && (
                    <div
                      id="drawer-search-results"
                      className={styles.drawerSearchDropdown}
                      role="listbox"
                    >
                      {drawerLoading ? (
                        <div className={styles.drawerSearchStatus}>Searching...</div>
                      ) : drawerResults.length === 0 ? (
                        <div className={styles.drawerSearchStatus}>Nothing found</div>
                      ) : (
                        drawerResults.map((result, index) => (
                          <button
                            key={`${result.type}-${result.id}`}
                            type="button"
                            className={`${styles.drawerSearchResult} ${drawerSelectedIndex === index ? styles.drawerSearchResultActive : ''}`}
                            onClick={() => handleDrawerResultClick(result)}
                            role="option"
                            aria-selected={drawerSelectedIndex === index}
                          >
                            <div className={styles.drawerSearchResultThumb}>
                              {result.posterPath ? (
                                <Image
                                  src={`https://image.tmdb.org/t/p/w92${result.posterPath}`}
                                  alt=""
                                  width={36}
                                  height={56}
                                  className={styles.drawerSearchResultImg}
                                />
                              ) : (
                                <div
                                  className={styles.drawerSearchResultThumbPlaceholder}
                                  aria-hidden
                                />
                              )}
                            </div>
                            <span className={styles.drawerSearchResultText}>
                              <span className={styles.drawerSearchResultTitle}>{result.title}</span>
                              <span className={styles.drawerSearchResultMeta}>
                                {result.subtitle ?? result.year ?? result.type}
                              </span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
              </div>

              <div className={styles.drawerDivider} />

              {/* Main nav */}
              <nav className={styles.drawerNav} aria-label="Mobile navigation">
                <motion.div custom={0} variants={navItemVariants} initial="closed" animate="open">
                  <Link
                    href="/"
                    className={`${styles.drawerLink} ${isActive('/') ? styles.drawerLinkActive : ''}`}
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive('/') ? 'page' : undefined}
                  >
                    <span className={styles.drawerLinkIcon}>
                      <svg
                        width="15"
                        height="15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        viewBox="0 0 24 24"
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <path d="M9 22V12h6v10" />
                      </svg>
                    </span>
                    <span className={styles.drawerLinkLabel}>Home</span>
                    <svg
                      className={styles.drawerChevron}
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                </motion.div>
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.href}
                    custom={i + 1}
                    variants={navItemVariants}
                    initial="closed"
                    animate="open"
                  >
                    <Link
                      href={link.href}
                      className={`${styles.drawerLink} ${isActive(link.href) ? styles.drawerLinkActive : ''}`}
                      onClick={() => setMenuOpen(false)}
                      aria-current={isActive(link.href) ? 'page' : undefined}
                    >
                      <span className={styles.drawerLinkIcon}>{link.icon}</span>
                      <span className={styles.drawerLinkLabel}>{link.label}</span>
                      {link.badge && <span className={styles.drawerBadge}>{link.badge}</span>}
                      <svg
                        className={styles.drawerChevron}
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </Link>
                  </motion.div>
                ))}

                {/* Watchlist */}
                <motion.div
                  custom={NAV_LINKS.length + 1}
                  variants={navItemVariants}
                  initial="closed"
                  animate="open"
                >
                  <Link
                    href="/watchlist"
                    className={`${styles.drawerLink} ${isActive('/watchlist') ? styles.drawerLinkActive : ''}`}
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive('/watchlist') ? 'page' : undefined}
                  >
                    <span className={styles.drawerLinkIcon}>
                      <svg
                        width="15"
                        height="15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </span>
                    <span className={styles.drawerLinkLabel}>Watchlist</span>
                    <svg
                      className={styles.drawerChevron}
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                </motion.div>

                {/* Notifications */}
                <motion.div
                  custom={NAV_LINKS.length + 2}
                  variants={navItemVariants}
                  initial="closed"
                  animate="open"
                >
                  <Link
                    href="/notifications"
                    className={styles.drawerLink}
                    onClick={() => {
                      markNotificationsSeen()
                      setMenuOpen(false)
                    }}
                  >
                    <span className={styles.drawerLinkIcon}>
                      <svg
                        width="15"
                        height="15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    </span>
                    <span className={styles.drawerLinkLabel}>Notifications</span>
                    {notifCount > 0 && (
                      <span className={styles.drawerNotifBadge}>{notifCount}</span>
                    )}
                    <svg
                      className={styles.drawerChevron}
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                </motion.div>

                {/* Random */}
                <motion.div
                  custom={NAV_LINKS.length + 3}
                  variants={navItemVariants}
                  initial="closed"
                  animate="open"
                >
                  <button
                    className={`${styles.drawerLink} ${styles.drawerLinkBtn}`}
                    onClick={() => {
                      handleRandom()
                      setMenuOpen(false)
                    }}
                  >
                    <span className={styles.drawerLinkIcon}>
                      <svg
                        width="15"
                        height="15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        viewBox="0 0 24 24"
                      >
                        <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22M18 2l4 4-4 4M18 14l4 4-4 4" />
                      </svg>
                    </span>
                    <span className={styles.drawerLinkLabel}>Random Movie</span>
                    <span className={styles.drawerRandom}>🎲</span>
                  </button>
                </motion.div>

                <motion.div
                  custom={NAV_LINKS.length + 4}
                  variants={navItemVariants}
                  initial="closed"
                  animate="open"
                >
                  <Link
                    href="/profile"
                    className={`${styles.drawerLink} ${isActive('/profile') ? styles.drawerLinkActive : ''}`}
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive('/profile') ? 'page' : undefined}
                  >
                    <span className={styles.drawerLinkIcon}>
                      <svg
                        width="15"
                        height="15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                      </svg>
                    </span>
                    <span className={styles.drawerLinkLabel}>Profile</span>
                    <svg
                      className={styles.drawerChevron}
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                </motion.div>
              </nav>

              <div className={styles.drawerDivider} />

              {/* Utility links */}
              <div className={styles.drawerUtility}>
                <Link
                  href="/settings"
                  className={styles.drawerUtilLink}
                  onClick={() => setMenuOpen(false)}
                >
                  <svg
                    width="15"
                    height="15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                  </svg>
                  Settings
                </Link>
                <Link
                  href="/help"
                  className={styles.drawerUtilLink}
                  onClick={() => setMenuOpen(false)}
                >
                  <svg
                    width="15"
                    height="15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
                  </svg>
                  Help & Support
                </Link>
              </div>

              {/* Footer */}
              <div className={styles.drawerFooter}>
                <span>MegDB</span>
                <span className={styles.drawerFooterDot}>·</span>
                <span>v1.0.0</span>
                <span className={styles.drawerFooterDot}>·</span>
                <span>© 2026</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
