'use client'

import { Button } from '@repo/ui/button'
import Link from 'next/link'
import type { ReactNode, RefObject } from 'react'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import { SearchBar } from '@/components/SearchBar/SearchBar'
import styles from './Header.module.css'

interface NavLink {
  href: string
  label: string
  icon: ReactNode
}

interface HeaderDesktopBarProps {
  navLinks: NavLink[]
  scrolled: boolean
  scrollHidden: boolean
  contextTinted: boolean
  megaMenuOpen: boolean
  menuOpen: boolean
  userMenuOpen: boolean
  isLoggedIn: boolean
  pillRef: RefObject<HTMLDivElement | null>
  navRef: RefObject<HTMLElement | null>
  megaMenuRef: RefObject<HTMLDivElement | null>
  megaMenuTriggerRef: RefObject<HTMLLIElement | null>
  userMenuRef: RefObject<HTMLDivElement | null>
  userMenuButtonRef: RefObject<HTMLButtonElement | null>
  menuButtonRef: RefObject<HTMLButtonElement | null>
  onCloseMenu: () => void
  onUpdateMegaMenuPos: () => void
  onSetMegaMenuOpen: (open: boolean) => void
  onSetMegaMenuCloseTimer: (cb: () => void, delayMs: number) => void
  onClearMegaMenuCloseTimer: () => void
  isActive: (href: string) => boolean
  markNotificationsSeen: () => void
  onToggleUserMenu: () => void
  onLogout: () => void
  onOpenMenu: () => void
}

export function HeaderDesktopBar({
  navLinks,
  scrolled,
  scrollHidden,
  contextTinted,
  megaMenuOpen,
  menuOpen,
  userMenuOpen,
  isLoggedIn,
  pillRef,
  navRef,
  megaMenuRef,
  megaMenuTriggerRef,
  userMenuRef,
  userMenuButtonRef,
  menuButtonRef,
  onCloseMenu,
  onUpdateMegaMenuPos,
  onSetMegaMenuOpen,
  onSetMegaMenuCloseTimer,
  onClearMegaMenuCloseTimer,
  isActive,
  markNotificationsSeen,
  onToggleUserMenu,
  onLogout,
  onOpenMenu,
}: HeaderDesktopBarProps) {
  return (
    <div className={styles.navbarWrapper}>
      <div
        ref={pillRef}
        className={`${styles.pill} ${scrolled ? styles.pillScrolled : ''} ${scrollHidden ? styles.pillHidden : ''} ${contextTinted ? styles.pillContextTinted : ''}`}
      >
        <div className={styles.inner}>
          <Link href="/" className={styles.logo} onClick={onCloseMenu}>
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
              {navLinks.map((link) => {
                const isCat = link.href === '/categories'
                return (
                  <li
                    key={link.href}
                    ref={isCat ? megaMenuTriggerRef : undefined}
                    className={isCat ? styles.megaMenuWrap : undefined}
                    onMouseEnter={
                      isCat
                        ? () => {
                            onClearMegaMenuCloseTimer()
                            onUpdateMegaMenuPos()
                            onSetMegaMenuOpen(true)
                          }
                        : undefined
                    }
                    onMouseLeave={
                      isCat
                        ? () => {
                            onSetMegaMenuCloseTimer(() => onSetMegaMenuOpen(false), 120)
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
                            onMouseEnter={onClearMegaMenuCloseTimer}
                            onMouseLeave={() => {
                              onSetMegaMenuCloseTimer(() => onSetMegaMenuOpen(false), 120)
                            }}
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
                                      onClick={() => onSetMegaMenuOpen(false)}
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
                                      onClick={() => onSetMegaMenuOpen(false)}
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
                  onClick={onToggleUserMenu}
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
                        onClick={onLogout}
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
              onClick={onOpenMenu}
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
  )
}
