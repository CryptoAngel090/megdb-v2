import type {
  ShelfItem,
  TmdbGenreListItem,
  TmdbStudioListItem,
  WatchProviderListItem,
} from '@/lib/tmdb'
import { COUNTRY_OPTIONS, LANG_OPTIONS, SORT_OPTIONS } from './MoviesDiscoverPage.constants'
import type {
  ActiveChip,
  DiscoverPageState,
  MoviesFilterDraft,
  RuntimeOption,
} from './MoviesDiscoverPage.types'

export function expectedBrowseChipLabel(isoMonth: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(isoMonth)
  if (!m) return `Expected: ${isoMonth}`
  const y = Number(m[1])
  const mo = Number(m[2])
  const label = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(Date.UTC(y, mo - 1, 1))
  )
  return `Expected: ${label}`
}

export function browseDraftFromState(s: DiscoverPageState): MoviesFilterDraft {
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

export function toBrowsePath(d: MoviesFilterDraft, basePath: string): string {
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
export function countActiveBrowseDraft(d: MoviesFilterDraft): number {
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

export function getShelfItemKey(item: ShelfItem): string {
  return `${item.type}-${item.id}`
}

export function appendUniqueShelfItems(prev: ShelfItem[], next: ShelfItem[]): ShelfItem[] {
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

export function discoverScrollStorageKey(basePath: string): string {
  return `megdb-discover-scroll-${basePath}`
}

export function getModalFocusables(root: HTMLElement): HTMLElement[] {
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

export function buildActiveBrowseChips(input: {
  draft: MoviesFilterDraft
  genres: TmdbGenreListItem[]
  providers: WatchProviderListItem[]
  studios: TmdbStudioListItem[]
  runtimeFilterLabel: string
  runtimeOptions: RuntimeOption[]
}): ActiveChip[] {
  const { draft, genres, providers, studios, runtimeFilterLabel, runtimeOptions } = input
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
  return activeChips
}
