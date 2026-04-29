import type { TmdbGenreListItem, TmdbStudioListItem, WatchProviderListItem } from '@/lib/tmdb'
import { COUNTRY_OPTIONS, LANG_OPTIONS, SORT_OPTIONS } from './MoviesDiscoverPage.constants'
import { toBrowsePath } from './MoviesDiscoverPage.helpers'
import styles from './MoviesDiscoverPage.module.css'
import type { MoviesFilterDraft, RuntimeOption, SavedPreset } from './MoviesDiscoverPage.types'

export interface MoviesDiscoverPageDesktopFiltersProps {
  draft: MoviesFilterDraft
  basePath: string
  years: string[]
  genres: TmdbGenreListItem[]
  providers: WatchProviderListItem[]
  studios: TmdbStudioListItem[]
  savedPresets: SavedPreset[]
  runtimeFilterLabel: string
  runtimeOptions: RuntimeOption[]
  hasActiveFilters: boolean
  browsePush: (href: string) => void
  push: (patch: Partial<MoviesFilterDraft>) => void
  saveCurrentPreset: () => void
}

/**
 * Desktop filter controls + saved preset chips (URL updates via `push` / `browsePush`).
 */
export function MoviesDiscoverPageDesktopFilters({
  draft,
  basePath,
  years,
  genres,
  providers,
  studios,
  savedPresets,
  runtimeFilterLabel,
  runtimeOptions,
  hasActiveFilters,
  browsePush,
  push,
  saveCurrentPreset,
}: MoviesDiscoverPageDesktopFiltersProps) {
  return (
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
  )
}
