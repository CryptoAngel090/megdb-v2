'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { VirtuosoGrid } from 'react-virtuoso'
import { MediaCard } from '@/components/MediaCard/MediaCard'
import type {
  ShelfItem,
  TmdbGenreListItem,
  TmdbStudioListItem,
  WatchProviderListItem,
} from '@/lib/tmdb'
import styles from './MoviesDiscoverPage.module.css'

const LANG_OPTIONS = [
  { value: '', label: 'Any language' },
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Russian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' },
  { value: 'hi', label: 'Hindi' },
  { value: 'zh', label: 'Chinese' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
]

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'popularity.desc', label: 'Popularity' },
  { value: 'trending', label: 'Hype (trending)' },
  { value: 'top', label: 'Top rated' },
  { value: 'release_date.desc', label: 'Newest releases' },
  { value: 'vote_average.desc', label: 'Highest user score' },
  { value: 'original_title.asc', label: 'Title A–Z' },
]

const COUNTRY_OPTIONS = [
  { value: '', label: 'Any country' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'KR', label: 'South Korea' },
  { value: 'JP', label: 'Japan' },
  { value: 'FR', label: 'France' },
  { value: 'DE', label: 'Germany' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'IN', label: 'India' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
]

type RuntimeOption = { value: string; label: string }

const DEFAULT_RUNTIME_OPTIONS: RuntimeOption[] = [
  { value: '', label: 'Any duration' },
  { value: '0-90', label: 'Under 90 min' },
  { value: '90-120', label: '90–120 min' },
  { value: '120-150', label: '120–150 min' },
  { value: '150-999', label: '150+ min' },
]

const DEFAULT_PRESETS_STORAGE_KEY = 'megdb-movies-filter-presets-v1'

function expectedBrowseChipLabel(isoMonth: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(isoMonth)
  if (!m) return `Expected: ${isoMonth}`
  const y = Number(m[1])
  const mo = Number(m[2])
  const label = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(Date.UTC(y, mo - 1, 1))
  )
  return `Expected: ${label}`
}

type DiscoverPageState = {
  genre?: string
  year?: string
  sortParam: string
  provider?: string
  studio?: string
  rating?: string
  language?: string
  country?: string
  runtime?: string
  comingYear?: number
  expectedYear?: number
  expectedMonth?: number
}

function browseDraftFromState(s: DiscoverPageState) {
  return {
    genre: s.genre ?? '',
    year: s.year ?? '',
    sort: s.sortParam,
    provider: s.provider ?? '',
    studio: s.studio ?? '',
    rating: s.rating ?? '',
    language: s.language ?? '',
    country: s.country ?? '',
    runtime: s.runtime ?? '',
    coming: s.comingYear != null ? String(s.comingYear) : '',
    expected:
      s.expectedYear != null && s.expectedMonth != null
        ? `${s.expectedYear}-${String(s.expectedMonth).padStart(2, '0')}`
        : '',
  }
}

function toBrowsePath(d: ReturnType<typeof browseDraftFromState>, basePath: string): string {
  const p = new URLSearchParams()
  if (d.genre) p.set('genre', d.genre)
  if (d.year) p.set('year', d.year)
  if (d.sort && d.sort !== 'popularity.desc') p.set('sort', d.sort)
  if (d.provider) p.set('provider', d.provider)
  if (d.studio) p.set('studio', d.studio)
  if (d.rating) p.set('rating', d.rating)
  if (d.language) p.set('language', d.language)
  if (d.country) p.set('country', d.country)
  if (d.runtime) p.set('runtime', d.runtime)
  if (d.coming) p.set('coming', d.coming)
  if (d.expected) p.set('expected', d.expected)
  const qs = p.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

/** Count active browse constraints (matches removable chips + sort override). */
function countActiveBrowseDraft(d: MoviesFilterDraft): number {
  let n = 0
  if (d.genre) n += 1
  if (d.year) n += 1
  if (d.provider) n += 1
  if (d.studio) n += 1
  if (d.rating) n += 1
  if (d.language) n += 1
  if (d.country) n += 1
  if (d.runtime) n += 1
  if (d.coming) n += 1
  if (d.expected) n += 1
  if (d.sort !== 'popularity.desc') n += 1
  return n
}

type MoviesFilterDraft = ReturnType<typeof browseDraftFromState>
type SavedPreset = { id: string; name: string; draft: MoviesFilterDraft; pinned?: boolean }
type SuggestedPreset = { name: string; draft: MoviesFilterDraft; pinned?: boolean }
type DiscoverPagePayload = { results: ShelfItem[]; page: number; total_pages: number }
type ActiveChip = { key: string; label: string; patch: Partial<MoviesFilterDraft> }
const PREFETCH_LOOKAHEAD_PAGES = 2
const VIRTUOSO_OVERSCAN_PX = 900

function getShelfItemKey(item: ShelfItem): string {
  return `${item.type}-${item.id}`
}

function appendUniqueShelfItems(prev: ShelfItem[], next: ShelfItem[]): ShelfItem[] {
  const seen = new Set(prev.map(getShelfItemKey))
  const merged = [...prev]
  for (const item of next) {
    const key = getShelfItemKey(item)
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(item)
  }
  return merged
}

function discoverScrollStorageKey(basePath: string): string {
  return `megdb-discover-scroll-${basePath}`
}

function getModalFocusables(root: HTMLElement): HTMLElement[] {
  const sel = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',')
  return Array.from(root.querySelectorAll<HTMLElement>(sel)).filter((el) => {
    if (el.hasAttribute('disabled')) return false
    if (el.getAttribute('aria-hidden') === 'true') return false
    return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement
  })
}

export function MoviesDiscoverPage({
  discoverState,
  genres,
  providers,
  studios,
  fetchParams,
  filterKey,
  basePath,
  apiPath,
  pageTitle,
  seoTitle,
  seoSubtitle,
  emptyText,
  contentLabelPlural,
  presetsStorageKey = DEFAULT_PRESETS_STORAGE_KEY,
  runtimeFilterLabel = 'Duration',
  runtimeOptions = DEFAULT_RUNTIME_OPTIONS,
  presetSuggestions = [],
  initialItems,
  totalPages,
  mosaicUrls: _mosaicUrls,
  heroDescription,
  enableDiscoverPolish = false,
  mobileGridColumns = 2,
  trustUpdatedAtLabel,
}: {
  discoverState: DiscoverPageState
  genres: TmdbGenreListItem[]
  providers: WatchProviderListItem[]
  studios: TmdbStudioListItem[]
  fetchParams: Record<string, string>
  filterKey: string
  basePath: string
  apiPath: string
  pageTitle: string
  seoTitle?: string
  seoSubtitle?: string
  emptyText: string
  contentLabelPlural: string
  presetsStorageKey?: string
  runtimeFilterLabel?: string
  runtimeOptions?: RuntimeOption[]
  presetSuggestions?: SuggestedPreset[]
  initialItems: ShelfItem[]
  totalPages: number
  mosaicUrls: string[]
  heroDescription: string
  /** Movies `/movies` UX: focus trap, scroll restore, layout modes, TMDB trust line, hero LCP tile. */
  enableDiscoverPolish?: boolean
  /** Mobile-only poster grid columns. @default 2 */
  mobileGridColumns?: 2 | 3
  /** Pre-formatted timestamp (UTC), e.g. from the server render. */
  trustUpdatedAtLabel?: string
}) {
  void _mosaicUrls
  const pathname = usePathname()
  const router = useRouter()
  const y = new Date().getFullYear()

  const discoverBreadcrumbs = (() => {
    if (!pathname.startsWith('/movies/category/')) return null
    const genreSlug = pathname.split('/').filter(Boolean)[2]
    if (!genreSlug) return null
    const genreLabel = genreSlug
      .split('-')
      .map((part) => (part ? `${part[0]!.toUpperCase()}${part.slice(1)}` : part))
      .join(' ')
    return [
      { href: '/', label: 'Home' },
      { href: '/movies', label: 'Movies' },
      { label: genreLabel },
    ] as const
  })()

  const [items, setItems] = useState<ShelfItem[]>(initialItems)
  const [nextPage, setNextPage] = useState(2)
  const [hasMore, setHasMore] = useState(totalPages > 1)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([])
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null)
  const [editingPresetName, setEditingPresetName] = useState('')
  const mobileModalRef = useRef<HTMLDivElement | null>(null)
  const mobileFilterTriggerRef = useRef<HTMLButtonElement | null>(null)
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

  useEffect(() => {
    if (!enableDiscoverPolish) return
    const key = discoverScrollStorageKey(basePath)
    const raw = sessionStorage.getItem(key)
    if (raw == null) return
    sessionStorage.removeItem(key)
    const y = Number(raw)
    if (!Number.isFinite(y)) return
    requestAnimationFrame(() => {
      window.scrollTo({ top: y, left: 0, behavior: 'auto' })
    })
  }, [enableDiscoverPolish, basePath, filterKey])

  const browsePush = useCallback(
    (href: string) => {
      if (enableDiscoverPolish && typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(discoverScrollStorageKey(basePath), String(window.scrollY))
        } catch {
          // ignore
        }
      }
      router.push(href, { scroll: false })
    },
    [basePath, enableDiscoverPolish, router]
  )

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
          // Keep 1-2 page lookahead cache so infinite scroll feels instant.
          if (pageData.page >= nextPage) {
            prefetchedPagesRef.current.set(pageData.page, pageData)
            for (const p of [...prefetchedPagesRef.current.keys()]) {
              if (p < nextPage || p > nextPage + PREFETCH_LOOKAHEAD_PAGES + 1) {
                prefetchedPagesRef.current.delete(p)
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

  const draft = browseDraftFromState(discoverState)
  const [mobileDraft, setMobileDraft] = useState(draft)
  const hasActiveFilters =
    Boolean(draft.genre) ||
    Boolean(draft.year) ||
    Boolean(draft.provider) ||
    Boolean(draft.studio) ||
    Boolean(draft.rating) ||
    Boolean(draft.language) ||
    Boolean(draft.country) ||
    Boolean(draft.runtime) ||
    Boolean(draft.coming) ||
    Boolean(draft.expected) ||
    draft.sort !== 'popularity.desc'
  const push = (patch: Partial<typeof draft>) => {
    browsePush(toBrowsePath({ ...draft, ...patch }, basePath))
  }

  useEffect(() => {
    setMobileDraft(draft)
  }, [filterKey])

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

  const persistPresets = (next: SavedPreset[]) => {
    setSavedPresets(next)
    try {
      localStorage.setItem(presetsStorageKey, JSON.stringify(next))
    } catch {
      // ignore quota/private mode errors
    }
  }

  const saveCurrentPreset = () => {
    const stamp = new Date().toLocaleDateString('en-GB')
    const baseName = draft.genre
      ? `Genre ${genres.find((g) => String(g.id) === draft.genre)?.name ?? draft.genre}`
      : draft.year
        ? `Year ${draft.year}`
        : draft.provider
          ? `Platform ${providers.find((p) => String(p.provider_id) === draft.provider)?.provider_name ?? draft.provider}`
          : 'Custom filters'
    const next: SavedPreset[] = [
      {
        id: `${Date.now()}`,
        name: `${baseName} · ${stamp}`,
        draft,
        pinned: false,
      },
      ...savedPresets,
    ].slice(0, 6)
    persistPresets(next)
  }

  const removePreset = (presetId: string) => {
    persistPresets(savedPresets.filter((p) => p.id !== presetId))
  }

  const startRenamePreset = (presetId: string) => {
    const target = savedPresets.find((p) => p.id === presetId)
    if (!target) return
    setEditingPresetId(presetId)
    setEditingPresetName(target.name)
  }

  const commitRenamePreset = () => {
    if (editingPresetId == null) return
    const nextName = editingPresetName.trim()
    if (!nextName) return
    persistPresets(
      savedPresets.map((p) => (p.id === editingPresetId ? { ...p, name: nextName } : p))
    )
    setEditingPresetId(null)
    setEditingPresetName('')
  }

  const togglePinPreset = (presetId: string) => {
    const toggled = savedPresets.map((p) => (p.id === presetId ? { ...p, pinned: !p.pinned } : p))
    const sorted = [...toggled].sort(
      (a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))
    )
    persistPresets(sorted)
  }

  useEffect(() => {
    if (!mobileFiltersOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileFiltersOpen])

  useEffect(() => {
    if (!mobileFiltersOpen) return
    const root = mobileModalRef.current
    if (!root) return
    const focusables = getModalFocusables(root)
    const first = focusables[0]
    if (first) first.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setMobileFiltersOpen(false)
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
      mobileFilterTriggerRef.current?.focus()
    }
  }, [mobileFiltersOpen])

  const years = Array.from({ length: y - 1949 }, (_, i) => String(y - i))
  const activeChips: ActiveChip[] = []
  if (draft.genre) {
    activeChips.push({
      key: 'genre',
      label: `Genre: ${genres.find((g) => String(g.id) === draft.genre)?.name ?? draft.genre}`,
      patch: { genre: '' },
    })
  }
  if (draft.year)
    activeChips.push({ key: 'year', label: `Year: ${draft.year}`, patch: { year: '' } })
  if (draft.provider) {
    activeChips.push({
      key: 'provider',
      label: `Platform: ${providers.find((p) => String(p.provider_id) === draft.provider)?.provider_name ?? draft.provider}`,
      patch: { provider: '' },
    })
  }
  if (draft.studio) {
    activeChips.push({
      key: 'studio',
      label: `Studio: ${studios.find((s) => String(s.id) === draft.studio)?.name ?? draft.studio}`,
      patch: { studio: '' },
    })
  }
  if (draft.rating)
    activeChips.push({ key: 'rating', label: `Min score: ${draft.rating}+`, patch: { rating: '' } })
  if (draft.language) {
    activeChips.push({
      key: 'language',
      label: `Language: ${LANG_OPTIONS.find((o) => o.value === draft.language)?.label ?? draft.language}`,
      patch: { language: '' },
    })
  }
  if (draft.country) {
    activeChips.push({
      key: 'country',
      label: `Country: ${COUNTRY_OPTIONS.find((o) => o.value === draft.country)?.label ?? draft.country}`,
      patch: { country: '' },
    })
  }
  if (draft.runtime) {
    activeChips.push({
      key: 'runtime',
      label: `${runtimeFilterLabel}: ${runtimeOptions.find((o) => o.value === draft.runtime)?.label ?? draft.runtime}`,
      patch: { runtime: '' },
    })
  }
  if (draft.coming) {
    activeChips.push({
      key: 'coming',
      label: `Coming: ${draft.coming}`,
      patch: { coming: '' },
    })
  }
  if (draft.expected) {
    activeChips.push({
      key: 'expected',
      label: expectedBrowseChipLabel(draft.expected),
      patch: { expected: '' },
    })
  }
  if (draft.sort !== 'popularity.desc') {
    activeChips.push({
      key: 'sort',
      label: `Sort: ${SORT_OPTIONS.find((o) => o.value === draft.sort)?.label ?? draft.sort}`,
      patch: { sort: 'popularity.desc' },
    })
  }
  return (
    <div className={`${styles.root} ${mobileGridColumns === 3 ? styles.mobileGrid3 : ''}`}>
      <section className={styles.seoIntro} aria-label={`${pageTitle} page intro`}>
        <h1 className={styles.seoTitle}>{seoTitle ?? pageTitle}</h1>
        <p className={styles.seoSubtitle}>{seoSubtitle ?? heroDescription}</p>
      </section>

      <div className={styles.mobileFiltersBar}>
        <button
          ref={mobileFilterTriggerRef}
          type="button"
          className={styles.mobileFilterTrigger}
          onClick={() => setMobileFiltersOpen(true)}
          aria-label="Open filters"
        >
          <span>Filters</span>
        </button>
      </div>
      {discoverBreadcrumbs && (
        <nav className={styles.discoverBreadcrumb} aria-label="Breadcrumb">
          {discoverBreadcrumbs.map((crumb, index) => {
            const isLast = index === discoverBreadcrumbs.length - 1
            return (
              <span key={`${crumb.label}-${index}`} className={styles.discoverBreadcrumbItem}>
                {'href' in crumb && crumb.href ? (
                  <button
                    type="button"
                    className={styles.discoverBreadcrumbLink}
                    onClick={() => browsePush(crumb.href)}
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className={styles.discoverBreadcrumbCurrent} aria-current="page">
                    {crumb.label}
                  </span>
                )}
                {!isLast && <span className={styles.discoverBreadcrumbSep}>›</span>}
              </span>
            )
          })}
        </nav>
      )}

      {enableDiscoverPolish && (
        <p className={styles.appliedSummary} aria-live="polite">
          {activeChips.length === 0
            ? 'Applied: 0 filters'
            : `Applied: ${activeChips.length} ${activeChips.length === 1 ? 'filter' : 'filters'}`}
        </p>
      )}

      {activeChips.length > 0 && (
        <div className={styles.appliedRow} aria-label="Applied filters">
          {activeChips.map((chip) => (
            <div key={chip.key} className={styles.appliedChip}>
              <span>{chip.label}</span>
              <button
                type="button"
                className={styles.appliedChipRemove}
                onClick={() => push(chip.patch)}
                title={`Remove ${chip.label}`}
                aria-label={`Remove ${chip.label}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.filters}>
        <div className={styles.presetRow}>
          <button type="button" className={styles.savePreset} onClick={saveCurrentPreset}>
            Save preset
          </button>
          {savedPresets.map((p) => (
            <button
              key={p.id}
              type="button"
              className={styles.presetChip}
              onClick={() => browsePush(toBrowsePath(p.draft, basePath))}
              title={p.name}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="m-genre">
            Genre
          </label>
          <select
            id="m-genre"
            className={styles.select}
            value={draft.genre}
            onChange={(e) => push({ genre: e.target.value, coming: '', expected: '' })}
          >
            <option value="">Any</option>
            {genres.map((g) => (
              <option key={g.id} value={String(g.id)}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="m-year">
            Release year
          </label>
          <select
            id="m-year"
            className={styles.select}
            value={draft.year}
            onChange={(e) => push({ year: e.target.value, coming: '', expected: '' })}
          >
            <option value="">Any</option>
            {years.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="m-sort">
            Sort
          </label>
          <select
            id="m-sort"
            className={styles.select}
            value={draft.sort}
            onChange={(e) => push({ sort: e.target.value })}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="m-provider">
            Platform (US)
          </label>
          <select
            id="m-provider"
            className={styles.select}
            value={draft.provider}
            onChange={(e) => push({ provider: e.target.value })}
          >
            <option value="">Any</option>
            {providers.map((pr) => (
              <option key={pr.provider_id} value={String(pr.provider_id)}>
                {pr.provider_name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="m-studio">
            Studio
          </label>
          <select
            id="m-studio"
            className={styles.select}
            value={draft.studio}
            onChange={(e) => push({ studio: e.target.value })}
          >
            <option value="">Any</option>
            {studios.map((studio) => (
              <option key={studio.id} value={String(studio.id)}>
                {studio.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="m-rating">
            Min score
          </label>
          <select
            id="m-rating"
            className={styles.select}
            value={draft.rating}
            onChange={(e) => push({ rating: e.target.value })}
          >
            <option value="">Any</option>
            <option value="6">6+</option>
            <option value="7">7+</option>
            <option value="8">8+</option>
            <option value="9">9+</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="m-lang">
            Language
          </label>
          <select
            id="m-lang"
            className={styles.select}
            value={draft.language}
            onChange={(e) => push({ language: e.target.value })}
          >
            {LANG_OPTIONS.map((o) => (
              <option key={o.value || 'any'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="m-country">
            Country
          </label>
          <select
            id="m-country"
            className={styles.select}
            value={draft.country}
            onChange={(e) => push({ country: e.target.value })}
          >
            {COUNTRY_OPTIONS.map((o) => (
              <option key={o.value || 'any-country'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="m-runtime">
            {runtimeFilterLabel}
          </label>
          <select
            id="m-runtime"
            className={styles.select}
            value={draft.runtime}
            onChange={(e) => push({ runtime: e.target.value })}
          >
            {runtimeOptions.map((o) => (
              <option key={o.value || 'any-runtime'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className={styles.clearAll}
            onClick={() => browsePush(basePath)}
            aria-label="Clear all filters"
            title="Clear all filters"
          >
            <span className={styles.clearAllIcon} aria-hidden>
              ×
            </span>
            <span>Clear</span>
          </button>
        )}
      </div>

      {mobileFiltersOpen && (
        <div className={styles.mobileModalBackdrop} onClick={() => setMobileFiltersOpen(false)}>
          <div
            ref={mobileModalRef}
            className={styles.mobileModal}
            role="dialog"
            aria-modal="true"
            aria-label={`${pageTitle} filters`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.mobileModalHeader}>
              <h2 className={styles.mobileModalTitle}>Filters</h2>
              <button
                type="button"
                className={styles.mobileModalClose}
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
              >
                ×
              </button>
            </div>

            <div className={styles.mobileModalBody}>
              {presetSuggestions.length > 0 && (
                <section className={styles.modalPresetSection} aria-label="Suggested presets">
                  <p className={styles.modalPresetTitle}>Suggested presets</p>
                  <div className={styles.modalPresetRow}>
                    {presetSuggestions.map((p, i) => (
                      <div key={`${p.name}-${i}`} className={styles.modalPresetChipWrap}>
                        <button
                          type="button"
                          className={styles.modalPresetChip}
                          onClick={() => {
                            setMobileDraft(p.draft)
                          }}
                          title={p.name}
                        >
                          {p.name}
                        </button>
                        <button
                          type="button"
                          className={styles.modalPresetPin}
                          aria-label={p.pinned ? `Pinned preset ${p.name}` : `Preset ${p.name}`}
                          title={p.pinned ? 'Pinned' : 'Preset'}
                          disabled
                        >
                          {p.pinned ? '★' : '☆'}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {savedPresets.length > 0 && (
                <section className={styles.modalPresetSection} aria-label="Saved presets">
                  <p className={styles.modalPresetTitle}>Saved presets</p>
                  <div className={styles.modalPresetRow}>
                    {savedPresets.map((p) => (
                      <div key={p.id} className={styles.modalPresetChipWrap}>
                        {editingPresetId === p.id ? (
                          <div className={styles.modalPresetRenameWrap}>
                            <input
                              className={styles.modalPresetRenameInput}
                              value={editingPresetName}
                              onChange={(e) => setEditingPresetName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitRenamePreset()
                                if (e.key === 'Escape') {
                                  e.stopPropagation()
                                  setEditingPresetId(null)
                                  setEditingPresetName('')
                                }
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              className={styles.modalPresetCommit}
                              onClick={commitRenamePreset}
                              aria-label="Save preset name"
                              title="Save"
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={styles.modalPresetChip}
                            onClick={() => {
                              browsePush(toBrowsePath(p.draft, basePath))
                              setMobileFiltersOpen(false)
                            }}
                            title={p.name}
                          >
                            {p.name}
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.modalPresetPin}
                          onClick={(e) => {
                            e.stopPropagation()
                            togglePinPreset(p.id)
                          }}
                          aria-label={p.pinned ? `Unpin preset ${p.name}` : `Pin preset ${p.name}`}
                          title={p.pinned ? 'Unpin' : 'Pin'}
                        >
                          {p.pinned ? '★' : '☆'}
                        </button>
                        <button
                          type="button"
                          className={styles.modalPresetEdit}
                          onClick={(e) => {
                            e.stopPropagation()
                            startRenamePreset(p.id)
                          }}
                          aria-label={`Rename preset ${p.name}`}
                          title="Rename preset"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className={styles.modalPresetDelete}
                          onClick={(e) => {
                            e.stopPropagation()
                            removePreset(p.id)
                          }}
                          aria-label={`Delete preset ${p.name}`}
                          title="Delete preset"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <div className={styles.modalPresetActions}>
                <button type="button" className={styles.savePreset} onClick={saveCurrentPreset}>
                  Save preset
                </button>
              </div>

              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.label} htmlFor="m-genre-mobile">
                    Genre
                  </label>
                  {mobileDraft.genre !== '' && (
                    <button
                      type="button"
                      className={styles.fieldClearBtn}
                      onClick={() => setMobileDraft((prev) => ({ ...prev, genre: '' }))}
                      aria-label="Clear genre"
                      title="Clear genre"
                    >
                      ×
                    </button>
                  )}
                </div>
                <select
                  id="m-genre-mobile"
                  className={styles.select}
                  value={mobileDraft.genre}
                  onChange={(e) =>
                    setMobileDraft((prev) => ({
                      ...prev,
                      genre: e.target.value,
                      coming: '',
                      expected: '',
                    }))
                  }
                >
                  <option value="">Any</option>
                  {genres.map((g) => (
                    <option key={g.id} value={String(g.id)}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.label} htmlFor="m-year-mobile">
                    Release year
                  </label>
                  {mobileDraft.year !== '' && (
                    <button
                      type="button"
                      className={styles.fieldClearBtn}
                      onClick={() => setMobileDraft((prev) => ({ ...prev, year: '' }))}
                      aria-label="Clear release year"
                      title="Clear release year"
                    >
                      ×
                    </button>
                  )}
                </div>
                <select
                  id="m-year-mobile"
                  className={styles.select}
                  value={mobileDraft.year}
                  onChange={(e) =>
                    setMobileDraft((prev) => ({
                      ...prev,
                      year: e.target.value,
                      coming: '',
                      expected: '',
                    }))
                  }
                >
                  <option value="">Any</option>
                  {years.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.label} htmlFor="m-sort-mobile">
                    Sort
                  </label>
                  {mobileDraft.sort !== 'popularity.desc' && (
                    <button
                      type="button"
                      className={styles.fieldClearBtn}
                      onClick={() =>
                        setMobileDraft((prev) => ({ ...prev, sort: 'popularity.desc' }))
                      }
                      aria-label="Reset sort"
                      title="Reset sort"
                    >
                      ×
                    </button>
                  )}
                </div>
                <select
                  id="m-sort-mobile"
                  className={styles.select}
                  value={mobileDraft.sort}
                  onChange={(e) => setMobileDraft((prev) => ({ ...prev, sort: e.target.value }))}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.label} htmlFor="m-provider-mobile">
                    Platform (US)
                  </label>
                  {mobileDraft.provider !== '' && (
                    <button
                      type="button"
                      className={styles.fieldClearBtn}
                      onClick={() => setMobileDraft((prev) => ({ ...prev, provider: '' }))}
                      aria-label="Clear platform"
                      title="Clear platform"
                    >
                      ×
                    </button>
                  )}
                </div>
                <select
                  id="m-provider-mobile"
                  className={styles.select}
                  value={mobileDraft.provider}
                  onChange={(e) =>
                    setMobileDraft((prev) => ({ ...prev, provider: e.target.value }))
                  }
                >
                  <option value="">{providers.length === 0 ? 'Loading providers…' : 'Any'}</option>
                  {providers.map((pr) => (
                    <option key={pr.provider_id} value={String(pr.provider_id)}>
                      {pr.provider_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.label} htmlFor="m-studio-mobile">
                    Studio
                  </label>
                  {mobileDraft.studio !== '' && (
                    <button
                      type="button"
                      className={styles.fieldClearBtn}
                      onClick={() => setMobileDraft((prev) => ({ ...prev, studio: '' }))}
                      aria-label="Clear studio"
                      title="Clear studio"
                    >
                      ×
                    </button>
                  )}
                </div>
                <select
                  id="m-studio-mobile"
                  className={styles.select}
                  value={mobileDraft.studio}
                  onChange={(e) => setMobileDraft((prev) => ({ ...prev, studio: e.target.value }))}
                >
                  <option value="">{studios.length === 0 ? 'Loading studios…' : 'Any'}</option>
                  {studios.map((studio) => (
                    <option key={studio.id} value={String(studio.id)}>
                      {studio.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.label} htmlFor="m-rating-mobile">
                    Min score
                  </label>
                  {mobileDraft.rating !== '' && (
                    <button
                      type="button"
                      className={styles.fieldClearBtn}
                      onClick={() => setMobileDraft((prev) => ({ ...prev, rating: '' }))}
                      aria-label="Clear minimum score"
                      title="Clear minimum score"
                    >
                      ×
                    </button>
                  )}
                </div>
                <select
                  id="m-rating-mobile"
                  className={styles.select}
                  value={mobileDraft.rating}
                  onChange={(e) => setMobileDraft((prev) => ({ ...prev, rating: e.target.value }))}
                >
                  <option value="">Any</option>
                  <option value="6">6+</option>
                  <option value="7">7+</option>
                  <option value="8">8+</option>
                  <option value="9">9+</option>
                </select>
              </div>

              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.label} htmlFor="m-lang-mobile">
                    Language
                  </label>
                  {mobileDraft.language !== '' && (
                    <button
                      type="button"
                      className={styles.fieldClearBtn}
                      onClick={() => setMobileDraft((prev) => ({ ...prev, language: '' }))}
                      aria-label="Clear language"
                      title="Clear language"
                    >
                      ×
                    </button>
                  )}
                </div>
                <select
                  id="m-lang-mobile"
                  className={styles.select}
                  value={mobileDraft.language}
                  onChange={(e) =>
                    setMobileDraft((prev) => ({ ...prev, language: e.target.value }))
                  }
                >
                  {LANG_OPTIONS.map((o) => (
                    <option key={o.value || 'any'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.label} htmlFor="m-country-mobile">
                    Country
                  </label>
                  {mobileDraft.country !== '' && (
                    <button
                      type="button"
                      className={styles.fieldClearBtn}
                      onClick={() => setMobileDraft((prev) => ({ ...prev, country: '' }))}
                      aria-label="Clear country"
                      title="Clear country"
                    >
                      ×
                    </button>
                  )}
                </div>
                <select
                  id="m-country-mobile"
                  className={styles.select}
                  value={mobileDraft.country}
                  onChange={(e) => setMobileDraft((prev) => ({ ...prev, country: e.target.value }))}
                >
                  {COUNTRY_OPTIONS.map((o) => (
                    <option key={o.value || 'any-country-mobile'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.label} htmlFor="m-runtime-mobile">
                    {runtimeFilterLabel}
                  </label>
                  {mobileDraft.runtime !== '' && (
                    <button
                      type="button"
                      className={styles.fieldClearBtn}
                      onClick={() => setMobileDraft((prev) => ({ ...prev, runtime: '' }))}
                      aria-label={`Clear ${runtimeFilterLabel.toLowerCase()}`}
                      title={`Clear ${runtimeFilterLabel.toLowerCase()}`}
                    >
                      ×
                    </button>
                  )}
                </div>
                <select
                  id="m-runtime-mobile"
                  className={styles.select}
                  value={mobileDraft.runtime}
                  onChange={(e) => setMobileDraft((prev) => ({ ...prev, runtime: e.target.value }))}
                >
                  {runtimeOptions.map((o) => (
                    <option key={o.value || 'any-runtime-mobile'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.mobileModalFooter}>
              {enableDiscoverPolish ? (
                <p className={styles.mobileModalAppliedHint} aria-live="polite">
                  {(() => {
                    const n = countActiveBrowseDraft(mobileDraft)
                    return n === 0
                      ? 'Applied: 0 filters'
                      : `Applied: ${n} ${n === 1 ? 'filter' : 'filters'}`
                  })()}
                </p>
              ) : null}
              <div className={styles.mobileModalFooterActions}>
                <button
                  type="button"
                  className={styles.mobileSecondaryBtn}
                  onClick={() =>
                    setMobileDraft({
                      genre: '',
                      year: '',
                      sort: 'popularity.desc',
                      provider: '',
                      studio: '',
                      rating: '',
                      language: '',
                      country: '',
                      runtime: '',
                      coming: '',
                      expected: '',
                    })
                  }
                >
                  Clear
                </button>
                <button
                  type="button"
                  className={styles.mobilePrimaryBtn}
                  onClick={() => {
                    browsePush(toBrowsePath(mobileDraft, basePath))
                    setMobileFiltersOpen(false)
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className={styles.main}>
        {items.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon} aria-hidden>
              🎬
            </div>
            <p>{emptyText}</p>
            {hasActiveFilters && (
              <button
                type="button"
                className={styles.retryBtn}
                onClick={() => browsePush(basePath)}
              >
                Relax filters
              </button>
            )}
          </div>
        ) : (
          <>
            <VirtuosoGrid<ShelfItem>
              className={styles.gridVirtuoso ?? ''}
              listClassName={styles.grid ?? ''}
              itemClassName={styles.gridItem ?? ''}
              totalCount={items.length}
              useWindowScroll
              overscan={VIRTUOSO_OVERSCAN_PX}
              computeItemKey={(idx, item) => (item ? getShelfItemKey(item) : `idx-${idx}`)}
              endReached={() => void loadMore()}
              itemContent={(idx) => {
                const item = items[idx]
                if (item == null) return null
                return (
                  <MediaCard
                    id={item.id}
                    type={item.type}
                    title={item.title}
                    posterPath={item.posterPath}
                    synopsis={item.overview ?? null}
                    voteAverage={item.voteAverage}
                    releaseDate={item.releaseDate}
                    genres={item.genres}
                    posterContext="grid"
                    {...(item.runtimeMinutes != null
                      ? { runtimeMinutes: item.runtimeMinutes }
                      : {})}
                    listIndex={idx}
                    priority={idx < 8}
                    shelfReveal={false}
                    enablePointerMotion={false}
                    {...(enableDiscoverPolish
                      ? {
                          unifiedDiscoverMeta: true,
                        }
                      : {})}
                  />
                )
              }}
            />
            {err != null && (
              <div className={styles.errorWrap}>
                <p className={styles.error}>{err}</p>
                <button type="button" className={styles.retryBtn} onClick={() => void loadMore()}>
                  Retry
                </button>
              </div>
            )}
            {hasMore && busy && (
              <p className={styles.loadHint}>{`Loading next ${contentLabelPlural}…`}</p>
            )}
          </>
        )}
      </main>

      {enableDiscoverPolish && trustUpdatedAtLabel ? (
        <footer className={styles.trustFooter}>
          <p className={styles.trustFooterText}>
            Metadata and posters from{' '}
            <a
              className={styles.trustFooterLink}
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              TMDB
            </a>
            . Page assembled at {trustUpdatedAtLabel} (UTC).
          </p>
        </footer>
      ) : null}
    </div>
  )
}
