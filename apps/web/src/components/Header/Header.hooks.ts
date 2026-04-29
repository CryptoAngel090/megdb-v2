'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { clearUser, getUser } from '@/lib/auth-client'
import { getNextSelectionIndex } from './drawerSearch.utils'
import { NOTIF_UNREAD_STORAGE_KEY } from './Header.constants'
import type { DrawerSearchResult } from './HeaderDrawerSearch'
import type { HeaderDesktopBarProps } from './HeaderDesktopBar'
import { useNavKeyboard } from './HeaderExtras'
import type { HeaderMobileDrawerProps } from './HeaderMobileDrawer'
import { NAV_LINKS } from './headerNavLinks'

export interface UseHeaderShellResult {
  setContextTinted: (value: boolean) => void
  desktopBarProps: HeaderDesktopBarProps
  mobileDrawerProps: HeaderMobileDrawerProps
}

export function useHeaderShell(): UseHeaderShellResult {
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

  const isActive = useCallback(
    (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href)),
    [pathname]
  )

  const handleDrawerResultClick = useCallback(
    (result: DrawerSearchResult) => {
      router.push(`/${result.type}/${result.id}`)
      setMenuOpen(false)
      setDrawerQuery('')
    },
    [router]
  )

  const handleDrawerSearch = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
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
    },
    [drawerQuery, drawerResults, drawerSelectedIndex, handleDrawerResultClick, router]
  )

  const handleRandom = useCallback(() => {
    router.push('/movies/random')
  }, [router])

  const onClearMegaMenuCloseTimer = useCallback(() => {
    if (megaMenuCloseTimer.current) {
      clearTimeout(megaMenuCloseTimer.current)
      megaMenuCloseTimer.current = null
    }
  }, [])

  const onSetMegaMenuCloseTimer = useCallback((cb: () => void, delayMs: number) => {
    if (megaMenuCloseTimer.current) {
      clearTimeout(megaMenuCloseTimer.current)
      megaMenuCloseTimer.current = null
    }
    megaMenuCloseTimer.current = setTimeout(() => {
      megaMenuCloseTimer.current = null
      cb()
    }, delayMs)
  }, [])

  const onLogout = useCallback(() => {
    clearUser()
    setIsLoggedIn(false)
    setLoggedInUser(null)
    setUserMenuOpen(false)
    router.push('/')
  }, [router])

  const desktopBarProps: HeaderDesktopBarProps = {
    navLinks: NAV_LINKS,
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
    onCloseMenu: () => setMenuOpen(false),
    onUpdateMegaMenuPos: updateMegaMenuPos,
    onSetMegaMenuOpen: setMegaMenuOpen,
    onSetMegaMenuCloseTimer,
    onClearMegaMenuCloseTimer,
    isActive,
    markNotificationsSeen,
    onToggleUserMenu: () => setUserMenuOpen((v) => !v),
    onLogout,
    onOpenMenu: () => setMenuOpen((v) => !v),
  }

  const mobileDrawerProps: HeaderMobileDrawerProps = {
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
    navLinks: NAV_LINKS,
    onCloseMenu: () => setMenuOpen(false),
    onToggleDrawerCategories: () => setDrawerCategoriesOpen((v) => !v),
    onDrawerQueryChange: setDrawerQuery,
    onDrawerSearchFocus: () => setDrawerSearchFocused(true),
    onDrawerSearchBlur: () => {
      setTimeout(() => setDrawerSearchFocused(false), 120)
    },
    onDrawerSearchKeyDown: handleDrawerSearch,
    onDrawerResultClick: handleDrawerResultClick,
    onNotificationsClick: () => {
      markNotificationsSeen()
      setMenuOpen(false)
    },
    onRandomClick: () => {
      handleRandom()
      setMenuOpen(false)
    },
    isActive,
  }

  return {
    setContextTinted,
    desktopBarProps,
    mobileDrawerProps,
  }
}
