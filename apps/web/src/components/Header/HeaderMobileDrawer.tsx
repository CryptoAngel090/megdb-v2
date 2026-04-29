'use client'

import Link from 'next/link'
import type { RefObject } from 'react'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import { HeaderDrawerSearch, type DrawerSearchResult } from './HeaderDrawerSearch'
import { HeaderDrawerUser } from './HeaderDrawerUser'
import styles from './Header.module.css'

interface NavLink {
  href: string
  label: string
  icon: React.ReactNode
}

export interface HeaderMobileDrawerProps {
  menuOpen: boolean
  drawerRef: RefObject<HTMLDivElement | null>
  drawerSearchContainerRef: RefObject<HTMLDivElement | null>
  drawerSearchRef: RefObject<HTMLInputElement | null>
  isLoggedIn: boolean
  loggedInUser: { name: string; username: string } | null
  drawerQuery: string
  drawerLoading: boolean
  drawerSearchFocused: boolean
  drawerResults: DrawerSearchResult[]
  drawerSelectedIndex: number
  drawerCategoriesOpen: boolean
  navLinks: NavLink[]
  onCloseMenu: () => void
  onToggleDrawerCategories: () => void
  onDrawerQueryChange: (value: string) => void
  onDrawerSearchFocus: () => void
  onDrawerSearchBlur: () => void
  onDrawerSearchKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
  onDrawerResultClick: (result: DrawerSearchResult) => void
  onNotificationsClick: () => void
  onRandomClick: () => void
  isActive: (href: string) => boolean
}

export function HeaderMobileDrawer({
  menuOpen,
  drawerRef,
  drawerSearchContainerRef,
  drawerSearchRef,
  isLoggedIn,
  loggedInUser,
  drawerQuery,
  drawerLoading,
  drawerSearchFocused,
  drawerResults,
  drawerSelectedIndex,
  drawerCategoriesOpen,
  navLinks,
  onCloseMenu,
  onToggleDrawerCategories,
  onDrawerQueryChange,
  onDrawerSearchFocus,
  onDrawerSearchBlur,
  onDrawerSearchKeyDown,
  onDrawerResultClick,
  onNotificationsClick,
  onRandomClick,
  isActive,
}: HeaderMobileDrawerProps) {
  if (!menuOpen) return null

  return (
    <>
      <div className={styles.backdrop} onClick={onCloseMenu} />

      <div ref={drawerRef} className={styles.drawer}>
        <div className={styles.drawerHeader}>
          <Link href="/" className={styles.drawerLogo} onClick={onCloseMenu}>
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
          <button className={styles.drawerClose} onClick={onCloseMenu} aria-label="Close menu">
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

        <HeaderDrawerUser
          isLoggedIn={isLoggedIn}
          loggedInUser={loggedInUser}
          onCloseMenu={onCloseMenu}
        />

        <HeaderDrawerSearch
          containerRef={drawerSearchContainerRef}
          inputRef={drawerSearchRef}
          query={drawerQuery}
          loading={drawerLoading}
          focused={drawerSearchFocused}
          results={drawerResults}
          selectedIndex={drawerSelectedIndex}
          onQueryChange={onDrawerQueryChange}
          onInputKeyDown={onDrawerSearchKeyDown}
          onFocus={onDrawerSearchFocus}
          onBlur={onDrawerSearchBlur}
          onResultClick={onDrawerResultClick}
        />

        <div className={styles.drawerDivider} />

        <nav className={styles.drawerNav} aria-label="Mobile navigation">
          <div>
            <Link
              href="/"
              className={`${styles.drawerLink} ${isActive('/') ? styles.drawerLinkActive : ''}`}
              onClick={onCloseMenu}
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
          {navLinks.map((link, i) => (
            <div key={link.href}>
              {link.href === '/categories' ? (
                <div className={styles.drawerNested}>
                  <button
                    type="button"
                    className={`${styles.drawerLink} ${styles.drawerLinkBtn} ${drawerCategoriesOpen ? styles.drawerLinkActive : ''}`}
                    onClick={onToggleDrawerCategories}
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
                            className={`${styles.drawerSubmenuLink} ${isActive(item.href) ? styles.drawerSubmenuLinkActive : ''}`}
                            onClick={onCloseMenu}
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
                              onClick={onCloseMenu}
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
                  onClick={onCloseMenu}
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

          <div>
            <Link
              href="/watchlist"
              className={`${styles.drawerLink} ${isActive('/watchlist') ? styles.drawerLinkActive : ''}`}
              onClick={onCloseMenu}
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

          <div>
            <Link href="/notifications" className={styles.drawerLink} onClick={onNotificationsClick}>
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

          <div>
            <button className={`${styles.drawerLink} ${styles.drawerLinkBtn}`} onClick={onRandomClick}>
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
              onClick={onCloseMenu}
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

        <div className={styles.drawerUtility}>
          <Link href="/settings" className={styles.drawerUtilLink} onClick={onCloseMenu}>
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
          <Link href="/help" className={styles.drawerUtilLink} onClick={onCloseMenu}>
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

        <div className={styles.drawerFooter}>
          <span>MegDB</span>
          <span className={styles.drawerFooterDot}>·</span>
          <span>v1.0.0</span>
          <span className={styles.drawerFooterDot}>·</span>
          <span>© 2026</span>
        </div>
      </div>
    </>
  )
}
