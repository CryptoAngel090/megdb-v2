import { useCallback, type Dispatch, type KeyboardEvent, type SetStateAction } from 'react'
import { getNextSelectionIndex } from './drawerSearch.utils'
import type { DrawerSearchResult } from './HeaderDrawerSearch'

interface UseHeaderDrawerHandlersParams {
  pathname: string
  drawerQuery: string
  drawerResults: DrawerSearchResult[]
  drawerSelectedIndex: number
  setDrawerSelectedIndex: Dispatch<SetStateAction<number>>
  setMenuOpen: Dispatch<SetStateAction<boolean>>
  setDrawerQuery: Dispatch<SetStateAction<string>>
  routerPush: (href: string) => void
}

export function useHeaderDrawerHandlers({
  pathname,
  drawerQuery,
  drawerResults,
  drawerSelectedIndex,
  setDrawerSelectedIndex,
  setMenuOpen,
  setDrawerQuery,
  routerPush,
}: UseHeaderDrawerHandlersParams) {
  const isActive = useCallback(
    (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href)),
    [pathname]
  )

  const handleDrawerResultClick = useCallback(
    (result: DrawerSearchResult) => {
      routerPush(`/${result.type}/${result.id}`)
      setMenuOpen(false)
      setDrawerQuery('')
    },
    [routerPush, setMenuOpen, setDrawerQuery]
  )

  const handleDrawerSearch = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown') {
        if (drawerResults.length === 0) return
        event.preventDefault()
        setDrawerSelectedIndex((prev) => getNextSelectionIndex(prev, drawerResults.length, 'down'))
        return
      }

      if (event.key === 'ArrowUp') {
        if (drawerResults.length === 0) return
        event.preventDefault()
        setDrawerSelectedIndex((prev) => getNextSelectionIndex(prev, drawerResults.length, 'up'))
        return
      }

      if (event.key === 'Enter' && drawerQuery.trim()) {
        if (drawerSelectedIndex >= 0 && drawerResults[drawerSelectedIndex]) {
          event.preventDefault()
          handleDrawerResultClick(drawerResults[drawerSelectedIndex])
          return
        }
        routerPush(`/search?q=${encodeURIComponent(drawerQuery.trim())}`)
        setMenuOpen(false)
        setDrawerQuery('')
      }
    },
    [
      drawerQuery,
      drawerResults,
      drawerSelectedIndex,
      handleDrawerResultClick,
      routerPush,
      setDrawerQuery,
      setDrawerSelectedIndex,
      setMenuOpen,
    ]
  )

  const handleRandom = useCallback(() => {
    routerPush('/movies/random')
  }, [routerPush])

  return { isActive, handleDrawerResultClick, handleDrawerSearch, handleRandom }
}
