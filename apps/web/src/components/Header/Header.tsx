'use client'

import { Button } from '@repo/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import { SearchBar } from '@/components/SearchBar/SearchBar'
import { clearUser, getUser } from '@/lib/auth-client'
import { getNextSelectionIndex } from './drawerSearch.utils'
import styles from './Header.module.css'
import { HeaderBreadcrumb, HeaderContextTint, useNavKeyboard } from './HeaderExtras'

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
    href: '/categories',
    label: 'Browse',
    icon: (
      <svg
        className={`${iconSlot.block} ${iconSlot.inline15}`}
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
  const [scrollHidden, setScrollHidden] = useState(false)
  const [contextTinted, setContextTinted] = useState(false)
  const lastScrollY = useRef(0)
  const navRef = useRef<HTMLElement>(null)
  useNavKeyboard(navRef)
  const [menuOpen, setMenuOpen] = useState(false)
  const [drawerCategoriesOpen, setDrawerCategoriesOpen] = useState(false)
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const megaMenuRef = useRef<HTMLDivElement>(null)
  const megaMenuTriggerRef = useRef<HTMLLIElement>(null)
  const megaMenuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pillRef = useRef<HTMLDivElement>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [drawerQuery, setDrawerQuery] = useState('')
  const [drawerResults, setDrawerResults] = useState<DrawerSearchResult[]>([])
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [drawerSearchFocused, setDrawerSearchFocused] = useState(false)
  const [drawerSelectedIndex, setDrawerSelectedIndex] = useState(-1)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<{ name: string; username: string } | null>(null)
  const markNotificationsSeen = useCallback(() => {
    try {
      localStorage.setItem(NOTIF_UNREAD_STORAGE_KEY, '0')
    } catch {
      /* private mode / quota */
    }
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 40)
      if (y > lastScrollY.current && y > 120) {
        setScrollHidden(true)
      } else {
        setScrollHidden(false)
      }
      lastScrollY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const syncAuthState = () => {
      const user = getUser()
      setIsLoggedIn(user !== null)
      setLoggedInUser(user ? { name: user.name, username: user.username } : null)
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
      setDrawerCategoriesOpen(false)
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
    if (!megaMenuOpen) return
    const handlePointerDown = (e: MouseEvent) => {
      if (
        !megaMenuRef.current?.contains(e.target as Node) &&
        !megaMenuTriggerRef.current?.contains(e.target as Node)
      ) {
        setMegaMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [megaMenuOpen])

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

  const updateMegaMenuPos = useCallback(() => {
    const pill = pillRef.current
    if (!pill) return
    const rect = pill.getBoundingClientRect()
    document.documentElement.style.setProperty('--mega-menu-top', `${rect.bottom + 8}px`)
  }, [])

  useEffect(() => {
    if (!megaMenuOpen) return
    window.addEventListener('resize', updateMegaMenuPos)
    return () => window.removeEventListener('resize', updateMegaMenuPos)
  }, [megaMenuOpen, updateMegaMenuPos])

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
        <div
          ref={pillRef}
          className={`${styles.pill} ${scrolled ? styles.pillScrolled : ''} ${scrollHidden ? styles.pillHidden : ''} ${contextTinted ? styles.pillContextTinted : ''}`}
        >
          <div className={styles.inner}>
            <Link href="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
              <svg
                className={`${styles.logoIcon} ${iconSlot.block} ${iconSlot.inline22}`}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
              <span className={styles.logoText}>
                <span className={styles.logoLetterM}>M</span>
                <span className={styles.logoLetterE}>e</span>
                <span className={styles.logoLetterG}>g</span>
                <span className={styles.logoAccent}>DB</span>
              </span>
            </Link>

            <div className={styles.inlineSearch}>
              <SearchBar />
            </div>

            <nav aria-label="Main navigation" className={styles.nav} ref={navRef}>
              <ul className={styles.links}>
                {NAV_LINKS.map((link) => {
                  const isCat = link.href === '/categories'
                  return (
                    <li
                      key={link.href}
                      ref={isCat ? megaMenuTriggerRef : undefined}
                      className={isCat ? styles.megaMenuWrap : undefined}
                      onMouseEnter={
                        isCat
                          ? () => {
                              if (megaMenuCloseTimer.current) {
                                clearTimeout(megaMenuCloseTimer.current)
                                megaMenuCloseTimer.current = null
                              }
                              // Position mega menu centered under the pill
                              updateMegaMenuPos()
                              setMegaMenuOpen(true)
                            }
                          : undefined
                      }
                      onMouseLeave={
                        isCat
                          ? () => {
                              megaMenuCloseTimer.current = setTimeout(
                                () => setMegaMenuOpen(false),
                                120
                              )
                            }
                          : undefined
                      }
                    >
                      <Link
                        href={link.href}
                        className={`${styles.link} ${isActive(link.href) ? styles.linkActive : ''}`}
                        aria-current={isActive(link.href) ? 'page' : undefined}
                        aria-haspopup={isCat ? 'true' : undefined}
                        aria-expanded={isCat ? megaMenuOpen : undefined}
                      >
                        {link.label}
                        {isActive(link.href) && <span className={styles.linkDot} />}
                      </Link>

                      {isCat && (
                        <>
                          {megaMenuOpen && (
                            <div
                              ref={megaMenuRef}
                              className={styles.megaMenu}
                              role="menu"
                              aria-label="Browse by genre"
                              onMouseEnter={() => {
                                if (megaMenuCloseTimer.current) {
                                  clearTimeout(megaMenuCloseTimer.current)
                                  megaMenuCloseTimer.current = null
                                }
                              }}
                              onMouseLeave={() => {
                                megaMenuCloseTimer.current = setTimeout(
                                  () => setMegaMenuOpen(false),
                                  120
                                )
                              }}
                            >
                              <div className={styles.megaMenuBody}>
                                {/* ── Left: Browse ── */}
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
                                            <circle
                                              cx="12"
                                              cy="20"
                                              r="1"
                                              fill="currentColor"
                                              stroke="none"
                                            />
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
                                        onClick={() => setMegaMenuOpen(false)}
                                      >
                                        <span className={styles.megaMenuBrowseIcon}>
                                          {item.icon}
                                        </span>
                                        {item.label}
                                      </Link>
                                    ))}
                                  </div>
                                </div>

                                {/* ── Divider ── */}
                                <div className={styles.megaMenuDivider} aria-hidden />

                                {/* ── Right: Genres ── */}
                                <div className={styles.megaMenuLeft}>
                                  <p className={styles.megaMenuTitle}>Genres</p>
                                  <div className={styles.megaMenuGrid}>
                                    {[
                                      { label: 'Action', href: '/movies/category/action' },
                                      { label: 'Adventure', href: '/movies/category/adventure' },
                                      { label: 'Animation', href: '/movies/category/animation' },
                                      { label: 'Comedy', href: '/movies/category/comedy' },
                                      { label: 'Crime', href: '/movies/category/crime' },
                                      {
                                        label: 'Documentary',
                                        href: '/movies/category/documentary',
                                      },
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
                                        onClick={() => setMegaMenuOpen(false)}
                                      >
                                        {g.label}
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </li>
                  )
                })}
                <li>
                  <Link
                    href="/watchlist"
                    className={`${styles.link} ${isActive('/watchlist') ? styles.linkActive : ''}`}
                    aria-current={isActive('/watchlist') ? 'page' : undefined}
                  >
                    Watchlist
                    {isActive('/watchlist') && <span className={styles.linkDot} />}
                  </Link>
                </li>
              </ul>
            </nav>

            <div className={styles.actions}>
              <div className={styles.notifWrap}>
                <Link
                  href="/notifications"
                  className={styles.iconBtn}
                  aria-label="Notifications"
                  onClick={markNotificationsSeen}
                >
                  <svg
                    className={`${iconSlot.block} ${iconSlot.inline18}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </Link>
              </div>

              {isLoggedIn ? (
                <div className={styles.userMenu}>
                  <button
                    ref={userMenuButtonRef}
                    className={styles.avatar}
                    onClick={() => setUserMenuOpen((v) => !v)}
                    aria-expanded={userMenuOpen}
                    aria-label="User menu"
                  >
                    <img
                      src="https://i.pravatar.cc/80"
                      alt="User profile avatar"
                      className={styles.avatarImg}
                    />
                  </button>
                  <>
                    {userMenuOpen && (
                      <div ref={userMenuRef} className={styles.userDropdown}>
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={styles.dropdownItem}
                          onClick={() => {
                            clearUser()
                            setIsLoggedIn(false)
                            setLoggedInUser(null)
                            setUserMenuOpen(false)
                            router.push('/')
                          }}
                        >
                          Logout
                        </Button>
                      </div>
                    )}
                  </>
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
                  className={`${iconSlot.block} ${iconSlot.inline18}`}
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
        </div>
      </div>

      <HeaderBreadcrumb />

      {/* Context-aware tint — changes pill bg on movie/series pages */}
      <HeaderContextTint onTintChange={setContextTinted} />

      {/* Mobile drawer */}
      <>
        {menuOpen && (
          <>
            <div className={styles.backdrop} onClick={() => setMenuOpen(false)} />

            <div ref={drawerRef} className={styles.drawer}>
              {/* Header */}
              <div className={styles.drawerHeader}>
                <Link href="/" className={styles.drawerLogo} onClick={() => setMenuOpen(false)}>
                  <svg
                    className={`${styles.drawerLogoIcon} ${iconSlot.block} ${iconSlot.lg}`}
                    viewBox="0 0 24 24"
                    fill="currentColor"
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
                    className={`${iconSlot.block} ${iconSlot.inline18}`}
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
                      alt="User profile avatar"
                      className={styles.drawerAvatar}
                    />
                    <div>
                      <div className={styles.drawerUserName}>
                        {loggedInUser?.name ?? loggedInUser?.username ?? 'User'}
                      </div>
                      <div className={styles.drawerUserSub}>@{loggedInUser?.username}</div>
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
                        className={`${iconSlot.block} ${iconSlot.inline18}`}
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
                        className={`${iconSlot.block} ${iconSlot.inline18}`}
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
                    className={`${styles.drawerSearchIcon} ${iconSlot.block} ${iconSlot.sm}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
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
                <div>
                  <Link
                    href="/"
                    className={`${styles.drawerLink} ${isActive('/') ? styles.drawerLinkActive : ''}`}
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive('/') ? 'page' : undefined}
                  >
                    <span className={styles.drawerLinkIcon}>
                      <svg
                        className={`${iconSlot.block} ${iconSlot.inline15}`}
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
                      className={`${styles.drawerChevron} ${iconSlot.block} ${iconSlot.sm}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                </div>
                {NAV_LINKS.map((link, i) => (
                  <div key={link.href}>
                    {link.href === '/categories' ? (
                      <div className={styles.drawerNested}>
                        <button
                          type="button"
                          className={`${styles.drawerLink} ${styles.drawerLinkBtn} ${drawerCategoriesOpen ? styles.drawerLinkActive : ''}`}
                          onClick={() => setDrawerCategoriesOpen((v) => !v)}
                          aria-expanded={drawerCategoriesOpen}
                          aria-controls="drawer-categories-submenu"
                        >
                          <span className={styles.drawerLinkIcon}>{link.icon}</span>
                          <span className={styles.drawerLinkLabel}>{link.label}</span>
                          <svg
                            className={`${styles.drawerChevron} ${styles.drawerChevronToggle} ${drawerCategoriesOpen ? styles.drawerChevronOpen : ''} ${iconSlot.block} ${iconSlot.sm}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </button>

                        {drawerCategoriesOpen && (
                          <div id="drawer-categories-submenu" className={styles.drawerSubmenu}>
                            <div className={styles.drawerSubmenuGroup}>
                              <p className={styles.drawerSubmenuTitle}>Browse</p>
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
                                      <circle
                                        cx="12"
                                        cy="20"
                                        r="1"
                                        fill="currentColor"
                                        stroke="none"
                                      />
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
                                  className={`${styles.drawerSubmenuLink} ${isActive(item.href) ? styles.drawerSubmenuLinkActive : ''}`}
                                  onClick={() => setMenuOpen(false)}
                                >
                                  <span className={styles.drawerSubmenuIcon} aria-hidden>
                                    {item.icon}
                                  </span>
                                  {item.label}
                                </Link>
                              ))}
                            </div>

                            <div className={styles.drawerSubmenuGroup}>
                              <p className={styles.drawerSubmenuTitle}>Genres</p>
                              <div className={styles.drawerSubmenuGrid}>
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
                                ].map((genre) => (
                                  <Link
                                    key={genre.href}
                                    href={genre.href}
                                    className={`${styles.drawerSubmenuLink} ${isActive(genre.href) ? styles.drawerSubmenuLinkActive : ''}`}
                                    onClick={() => setMenuOpen(false)}
                                  >
                                    {genre.label}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={link.href}
                        className={`${styles.drawerLink} ${isActive(link.href) ? styles.drawerLinkActive : ''}`}
                        onClick={() => setMenuOpen(false)}
                        aria-current={isActive(link.href) ? 'page' : undefined}
                      >
                        <span className={styles.drawerLinkIcon}>{link.icon}</span>
                        <span className={styles.drawerLinkLabel}>{link.label}</span>
                        <svg
                          className={`${styles.drawerChevron} ${iconSlot.block} ${iconSlot.sm}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </Link>
                    )}
                  </div>
                ))}

                {/* Watchlist */}
                <div>
                  <Link
                    href="/watchlist"
                    className={`${styles.drawerLink} ${isActive('/watchlist') ? styles.drawerLinkActive : ''}`}
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive('/watchlist') ? 'page' : undefined}
                  >
                    <span className={styles.drawerLinkIcon}>
                      <svg
                        className={`${iconSlot.block} ${iconSlot.inline15}`}
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
                      className={`${styles.drawerChevron} ${iconSlot.block} ${iconSlot.sm}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                </div>

                {/* Notifications */}
                <div>
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
                        className={`${iconSlot.block} ${iconSlot.inline15}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    </span>
                    <span className={styles.drawerLinkLabel}>Notifications</span>
                    <svg
                      className={`${styles.drawerChevron} ${iconSlot.block} ${iconSlot.sm}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                </div>

                {/* Random */}
                <div>
                  <button
                    className={`${styles.drawerLink} ${styles.drawerLinkBtn}`}
                    onClick={() => {
                      handleRandom()
                      setMenuOpen(false)
                    }}
                  >
                    <span className={styles.drawerLinkIcon}>
                      <svg
                        className={`${iconSlot.block} ${iconSlot.inline15}`}
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
                </div>

                <div>
                  <Link
                    href="/profile"
                    className={`${styles.drawerLink} ${isActive('/profile') ? styles.drawerLinkActive : ''}`}
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive('/profile') ? 'page' : undefined}
                  >
                    <span className={styles.drawerLinkIcon}>
                      <svg
                        className={`${iconSlot.block} ${iconSlot.inline15}`}
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
                      className={`${styles.drawerChevron} ${iconSlot.block} ${iconSlot.sm}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                </div>
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
                    className={`${iconSlot.block} ${iconSlot.inline15}`}
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
                    className={`${iconSlot.block} ${iconSlot.inline15}`}
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
            </div>
          </>
        )}
      </>
    </>
  )
}
