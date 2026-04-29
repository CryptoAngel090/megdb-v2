import { useEffect, type Dispatch, type RefObject, type SetStateAction } from 'react'
import type { DrawerSearchResult } from './HeaderDrawerSearch'

interface UseHeaderDrawerEffectsParams {
  menuOpen: boolean
  drawerQuery: string
  drawerSearchFocused: boolean
  drawerRef: RefObject<HTMLDivElement | null>
  drawerSearchRef: RefObject<HTMLInputElement | null>
  drawerSearchContainerRef: RefObject<HTMLDivElement | null>
  menuButtonRef: RefObject<HTMLButtonElement | null>
  setMenuOpen: Dispatch<SetStateAction<boolean>>
  setDrawerQuery: Dispatch<SetStateAction<string>>
  setDrawerResults: Dispatch<SetStateAction<DrawerSearchResult[]>>
  setDrawerLoading: Dispatch<SetStateAction<boolean>>
  setDrawerSearchFocused: Dispatch<SetStateAction<boolean>>
  setDrawerSelectedIndex: Dispatch<SetStateAction<number>>
  setDrawerCategoriesOpen: Dispatch<SetStateAction<boolean>>
}

export function useHeaderDrawerEffects({
  menuOpen,
  drawerQuery,
  drawerSearchFocused,
  drawerRef,
  drawerSearchRef,
  drawerSearchContainerRef,
  menuButtonRef,
  setMenuOpen,
  setDrawerQuery,
  setDrawerResults,
  setDrawerLoading,
  setDrawerSearchFocused,
  setDrawerSelectedIndex,
  setDrawerCategoriesOpen,
}: UseHeaderDrawerEffectsParams) {
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
  }, [menuOpen, drawerRef, drawerSearchRef, menuButtonRef, setMenuOpen])

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
  }, [
    drawerQuery,
    menuOpen,
    setDrawerCategoriesOpen,
    setDrawerLoading,
    setDrawerQuery,
    setDrawerResults,
    setDrawerSearchFocused,
    setDrawerSelectedIndex,
  ])

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
  }, [
    menuOpen,
    drawerSearchFocused,
    drawerSearchContainerRef,
    setDrawerSearchFocused,
    setDrawerSelectedIndex,
  ])
}
