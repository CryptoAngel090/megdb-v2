import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import type { ShelfItem, TmdbGenreListItem, WatchProviderListItem } from '@/lib/tmdb'
import { PREFETCH_LOOKAHEAD_PAGES } from './MoviesDiscoverPage.constants'
import {
  appendUniqueShelfItems,
  discoverScrollStorageKey,
  getModalFocusables,
} from './MoviesDiscoverPage.helpers'
import type {
  DiscoverPagePayload,
  MoviesFilterDraft,
  SavedPreset,
} from './MoviesDiscoverPage.types'

export function useDiscoverScrollRestore(input: {
  enableDiscoverPolish: boolean
  basePath: string
  filterKey: string
}): void {
  const { enableDiscoverPolish, basePath, filterKey } = input
  useEffect(() => {
    if (!enableDiscoverPolish) return
    const key = discoverScrollStorageKey(basePath)
    const raw = sessionStorage.getItem(key)
    if (raw == null) return
    sessionStorage.removeItem(key)
    const scrollY = Number(raw)
    if (!Number.isFinite(scrollY)) return
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, left: 0, behavior: 'auto' })
    })
  }, [enableDiscoverPolish, basePath, filterKey])
}

export function useDiscoverInfiniteGrid(input: {
  filterKey: string
  initialItems: ShelfItem[]
  totalPages: number
  fetchParams: Record<string, string>
  apiPath: string
  contentLabelPlural: string
}): {
  items: ShelfItem[]
  err: string | null
  busy: boolean
  hasMore: boolean
  loadMore: () => Promise<void>
} {
  const { filterKey, initialItems, totalPages, fetchParams, apiPath, contentLabelPlural } = input
  const [items, setItems] = useState<ShelfItem[]>(initialItems)
  const [nextPage, setNextPage] = useState(2)
  const [hasMore, setHasMore] = useState(totalPages > 1)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const prefetchedPagesRef = useRef<Map<number, DiscoverPagePayload>>(new Map())
  const prefetchInFlightPagesRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    setItems(initialItems)
    setNextPage(2)
    setHasMore(totalPages > 1)
    setErr(null)
    prefetchedPagesRef.current.clear()
    prefetchInFlightPagesRef.current.clear()
  }, [filterKey, initialItems, totalPages])

  const fetchDiscoverPage = useCallback(
    async (page: number): Promise<DiscoverPagePayload> => {
      const p = new URLSearchParams(fetchParams)
      p.set('page', String(page))
      const res = await fetch(`${apiPath}?${p.toString()}`)
      const data: unknown = await res.json()
      if (!res.ok) {
        const msg =
          data &&
          typeof data === 'object' &&
          'error' in data &&
          typeof (data as { error: unknown }).error === 'string'
            ? (data as { error: string }).error
            : 'Failed to load more'
        throw new Error(msg)
      }
      return data as DiscoverPagePayload
    },
    [apiPath, fetchParams]
  )

  const loadMore = useCallback(async () => {
    if (!hasMore || busy) return
    setBusy(true)
    setErr(null)
    try {
      let body: DiscoverPagePayload
      const prefetched = prefetchedPagesRef.current.get(nextPage)
      if (prefetched != null) {
        body = prefetched
        prefetchedPagesRef.current.delete(nextPage)
      } else {
        body = await fetchDiscoverPage(nextPage)
      }
      setItems((prev) => appendUniqueShelfItems(prev, body.results))
      const done = body.page >= body.total_pages
      setHasMore(!done)
      setNextPage(body.page + 1)
    } catch (e) {
      const fallback = `Could not load more ${contentLabelPlural} right now. Please retry.`
      setErr(e instanceof Error && e.message ? e.message : fallback)
    } finally {
      setBusy(false)
    }
  }, [busy, contentLabelPlural, fetchDiscoverPage, hasMore, nextPage])

  useEffect(() => {
    if (!hasMore || busy) return
    for (let offset = 0; offset < PREFETCH_LOOKAHEAD_PAGES; offset += 1) {
      const targetPage = nextPage + offset
      if (prefetchedPagesRef.current.has(targetPage)) continue
      if (prefetchInFlightPagesRef.current.has(targetPage)) continue
      prefetchInFlightPagesRef.current.add(targetPage)
      void fetchDiscoverPage(targetPage)
        .then((pageData) => {
          if (pageData.page >= nextPage) {
            prefetchedPagesRef.current.set(pageData.page, pageData)
            for (const pageNum of [...prefetchedPagesRef.current.keys()]) {
              if (pageNum < nextPage || pageNum > nextPage + PREFETCH_LOOKAHEAD_PAGES + 1) {
                prefetchedPagesRef.current.delete(pageNum)
              }
            }
          }
        })
        .catch(() => {
          // Silent prefetch failure; normal loadMore path still works.
        })
        .finally(() => {
          prefetchInFlightPagesRef.current.delete(targetPage)
        })
    }
  }, [busy, fetchDiscoverPage, hasMore, nextPage])

  return { items, err, busy, hasMore, loadMore }
}

export function useDiscoverFilterPresets(input: {
  presetsStorageKey: string
  draft: MoviesFilterDraft
  genres: TmdbGenreListItem[]
  providers: WatchProviderListItem[]
}): {
  savedPresets: SavedPreset[]
  editingPresetId: string | null
  setEditingPresetId: (id: string | null) => void
  editingPresetName: string
  setEditingPresetName: (name: string) => void
  saveCurrentPreset: () => void
  removePreset: (presetId: string) => void
  startRenamePreset: (presetId: string) => void
  commitRenamePreset: () => void
  togglePinPreset: (presetId: string) => void
} {
  const { presetsStorageKey, draft, genres, providers } = input
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([])
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null)
  const [editingPresetName, setEditingPresetName] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(presetsStorageKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as SavedPreset[]
      if (Array.isArray(parsed)) setSavedPresets(parsed.slice(0, 6))
    } catch {
      // ignore malformed local storage
    }
  }, [presetsStorageKey])

  const writePresetsToStorage = useCallback(
    (next: SavedPreset[]) => {
      try {
        localStorage.setItem(presetsStorageKey, JSON.stringify(next))
      } catch {
        // ignore quota/private mode errors
      }
    },
    [presetsStorageKey]
  )

  const saveCurrentPreset = useCallback(() => {
    const stamp = new Date().toLocaleDateString('en-GB')
    const baseName = draft.genre
      ? `Genre ${genres.find((g) => String(g.id) === draft.genre)?.name ?? draft.genre}`
      : draft.year
        ? `Year ${draft.year}`
        : draft.provider
          ? `Platform ${providers.find((pr) => String(pr.provider_id) === draft.provider)?.provider_name ?? draft.provider}`
          : 'Custom filters'
    setSavedPresets((prev) => {
      const next: SavedPreset[] = [
        {
          id: `${Date.now()}`,
          name: `${baseName} · ${stamp}`,
          draft,
          pinned: false,
        },
        ...prev,
      ].slice(0, 6)
      writePresetsToStorage(next)
      return next
    })
  }, [draft, genres, providers, writePresetsToStorage])

  const removePreset = useCallback(
    (presetId: string) => {
      setSavedPresets((prev) => {
        const next = prev.filter((p) => p.id !== presetId)
        writePresetsToStorage(next)
        return next
      })
    },
    [writePresetsToStorage]
  )

  const startRenamePreset = useCallback(
    (presetId: string) => {
      const target = savedPresets.find((p) => p.id === presetId)
      if (!target) return
      setEditingPresetId(presetId)
      setEditingPresetName(target.name)
    },
    [savedPresets]
  )

  const commitRenamePreset = useCallback(() => {
    if (editingPresetId == null) return
    const nextName = editingPresetName.trim()
    if (!nextName) return
    const id = editingPresetId
    setSavedPresets((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, name: nextName } : p))
      writePresetsToStorage(next)
      return next
    })
    setEditingPresetId(null)
    setEditingPresetName('')
  }, [editingPresetId, editingPresetName, writePresetsToStorage])

  const togglePinPreset = useCallback(
    (presetId: string) => {
      setSavedPresets((prev) => {
        const toggled = prev.map((p) => (p.id === presetId ? { ...p, pinned: !p.pinned } : p))
        const sorted = [...toggled].sort(
          (a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))
        )
        writePresetsToStorage(sorted)
        return sorted
      })
    },
    [writePresetsToStorage]
  )

  return {
    savedPresets,
    editingPresetId,
    setEditingPresetId,
    editingPresetName,
    setEditingPresetName,
    saveCurrentPreset,
    removePreset,
    startRenamePreset,
    commitRenamePreset,
    togglePinPreset,
  }
}

export function useDiscoverMobileSheet(input: {
  open: boolean
  modalRef: RefObject<HTMLDivElement | null>
  triggerRef: RefObject<HTMLButtonElement | null>
  onClose: () => void
}): void {
  const { open, modalRef, triggerRef, onClose } = input

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const root = modalRef.current
    if (!root) return
    const focusables = getModalFocusables(root)
    const first = focusables[0]
    if (first) first.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || focusables.length === 0) return
      const firstEl = focusables[0]!
      const lastEl = focusables[focusables.length - 1]!
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey) {
        if (active === firstEl) {
          e.preventDefault()
          lastEl.focus()
        }
      } else if (active === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    root.addEventListener('keydown', onKeyDown)
    return () => {
      root.removeEventListener('keydown', onKeyDown)
      triggerRef.current?.focus()
    }
  }, [modalRef, onClose, open, triggerRef])
}
