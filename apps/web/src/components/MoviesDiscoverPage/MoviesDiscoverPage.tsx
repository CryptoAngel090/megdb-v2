'use client'

// client: Virtuoso infinite grid, router-driven filters, modal focus trap, session scroll restore

import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_PRESETS_STORAGE_KEY,
  DEFAULT_RUNTIME_OPTIONS,
} from './MoviesDiscoverPage.constants'
import {
  browseDraftFromState,
  buildActiveBrowseChips,
  discoverScrollStorageKey,
  toBrowsePath,
} from './MoviesDiscoverPage.helpers'
import {
  useDiscoverFilterPresets,
  useDiscoverInfiniteGrid,
  useDiscoverMobileSheet,
  useDiscoverScrollRestore,
} from './MoviesDiscoverPage.hooks'
import styles from './MoviesDiscoverPage.module.css'
import type { MoviesDiscoverPageProps } from './MoviesDiscoverPage.types'
import { MoviesDiscoverPageChrome } from './MoviesDiscoverPageChrome'
import { MoviesDiscoverPageDesktopFilters } from './MoviesDiscoverPageDesktopFilters'
import { MoviesDiscoverPageMobileFiltersModal } from './MoviesDiscoverPageMobileFiltersModal'
import { MoviesDiscoverPageResults } from './MoviesDiscoverPageResults'

export type { MoviesDiscoverPageProps } from './MoviesDiscoverPage.types'

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
}: MoviesDiscoverPageProps) {
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

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const mobileModalRef = useRef<HTMLDivElement | null>(null)
  const mobileFilterTriggerRef = useRef<HTMLButtonElement | null>(null)

  const closeMobileFilters = useCallback(() => setMobileFiltersOpen(false), [])
  const openMobileFilters = useCallback(() => setMobileFiltersOpen(true), [])

  const { items, err, busy, hasMore, loadMore } = useDiscoverInfiniteGrid({
    filterKey,
    initialItems,
    totalPages,
    fetchParams,
    apiPath,
    contentLabelPlural,
  })

  useDiscoverScrollRestore({ enableDiscoverPolish, basePath, filterKey })

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

  const {
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
  } = useDiscoverFilterPresets({
    presetsStorageKey,
    draft,
    genres,
    providers,
  })

  useDiscoverMobileSheet({
    open: mobileFiltersOpen,
    modalRef: mobileModalRef,
    triggerRef: mobileFilterTriggerRef,
    onClose: closeMobileFilters,
  })

  const years = Array.from({ length: y - 1949 }, (_, i) => String(y - i))
  const activeChips = buildActiveBrowseChips({
    draft,
    genres,
    providers,
    studios,
    runtimeFilterLabel,
    runtimeOptions,
  })

  return (
    <div className={`${styles.root} ${mobileGridColumns === 3 ? styles.mobileGrid3 : ''}`}>
      <MoviesDiscoverPageChrome
        pageTitle={pageTitle}
        seoTitle={seoTitle}
        seoSubtitle={seoSubtitle}
        heroDescription={heroDescription}
        mobileFilterTriggerRef={mobileFilterTriggerRef}
        onOpenMobileFilters={openMobileFilters}
        discoverBreadcrumbs={discoverBreadcrumbs}
        browsePush={browsePush}
        enableDiscoverPolish={enableDiscoverPolish}
        activeChips={activeChips}
        push={push}
      />

      <MoviesDiscoverPageDesktopFilters
        draft={draft}
        basePath={basePath}
        years={years}
        genres={genres}
        providers={providers}
        studios={studios}
        savedPresets={savedPresets}
        runtimeFilterLabel={runtimeFilterLabel}
        runtimeOptions={runtimeOptions}
        hasActiveFilters={hasActiveFilters}
        browsePush={browsePush}
        push={push}
        saveCurrentPreset={saveCurrentPreset}
      />

      <MoviesDiscoverPageMobileFiltersModal
        open={mobileFiltersOpen}
        onClose={closeMobileFilters}
        mobileModalRef={mobileModalRef}
        pageTitle={pageTitle}
        presetSuggestions={presetSuggestions}
        savedPresets={savedPresets}
        mobileDraft={mobileDraft}
        setMobileDraft={setMobileDraft}
        genres={genres}
        providers={providers}
        studios={studios}
        years={years}
        runtimeFilterLabel={runtimeFilterLabel}
        runtimeOptions={runtimeOptions}
        enableDiscoverPolish={enableDiscoverPolish}
        basePath={basePath}
        browsePush={browsePush}
        editingPresetId={editingPresetId}
        setEditingPresetId={setEditingPresetId}
        editingPresetName={editingPresetName}
        setEditingPresetName={setEditingPresetName}
        commitRenamePreset={commitRenamePreset}
        startRenamePreset={startRenamePreset}
        removePreset={removePreset}
        togglePinPreset={togglePinPreset}
        saveCurrentPreset={saveCurrentPreset}
      />

      <MoviesDiscoverPageResults
        items={items}
        err={err}
        busy={busy}
        hasMore={hasMore}
        loadMore={loadMore}
        emptyText={emptyText}
        hasActiveFilters={hasActiveFilters}
        basePath={basePath}
        browsePush={browsePush}
        contentLabelPlural={contentLabelPlural}
        enableDiscoverPolish={enableDiscoverPolish}
        trustUpdatedAtLabel={trustUpdatedAtLabel}
      />
    </div>
  )
}
