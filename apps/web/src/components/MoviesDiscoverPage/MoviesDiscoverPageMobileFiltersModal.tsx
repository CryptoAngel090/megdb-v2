import type { Dispatch, RefObject, SetStateAction } from 'react'
import type { TmdbGenreListItem, TmdbStudioListItem, WatchProviderListItem } from '@/lib/tmdb'
import { COUNTRY_OPTIONS, LANG_OPTIONS, SORT_OPTIONS } from './MoviesDiscoverPage.constants'
import { countActiveBrowseDraft, toBrowsePath } from './MoviesDiscoverPage.helpers'
import styles from './MoviesDiscoverPage.module.css'
import {
  EMPTY_MOVIES_FILTER_DRAFT,
  type MoviesFilterDraft,
  type RuntimeOption,
  type SavedPreset,
  type SuggestedPreset,
} from './MoviesDiscoverPage.types'

export interface MoviesDiscoverPageMobileFiltersModalProps {
  open: boolean
  onClose: () => void
  mobileModalRef: RefObject<HTMLDivElement | null>
  pageTitle: string
  presetSuggestions: SuggestedPreset[]
  savedPresets: SavedPreset[]
  mobileDraft: MoviesFilterDraft
  setMobileDraft: Dispatch<SetStateAction<MoviesFilterDraft>>
  genres: TmdbGenreListItem[]
  providers: WatchProviderListItem[]
  studios: TmdbStudioListItem[]
  years: string[]
  runtimeFilterLabel: string
  runtimeOptions: RuntimeOption[]
  enableDiscoverPolish: boolean
  basePath: string
  browsePush: (href: string) => void
  editingPresetId: string | null
  setEditingPresetId: (id: string | null) => void
  editingPresetName: string
  setEditingPresetName: (name: string) => void
  commitRenamePreset: () => void
  startRenamePreset: (presetId: string) => void
  removePreset: (presetId: string) => void
  togglePinPreset: (presetId: string) => void
  saveCurrentPreset: () => void
}

/**
 * Full-screen mobile filter sheet: suggested/saved presets + duplicate filter fields + apply.
 */
export function MoviesDiscoverPageMobileFiltersModal({
  open,
  onClose,
  mobileModalRef,
  pageTitle,
  presetSuggestions,
  savedPresets,
  mobileDraft,
  setMobileDraft,
  genres,
  providers,
  studios,
  years,
  runtimeFilterLabel,
  runtimeOptions,
  enableDiscoverPolish,
  basePath,
  browsePush,
  editingPresetId,
  setEditingPresetId,
  editingPresetName,
  setEditingPresetName,
  commitRenamePreset,
  startRenamePreset,
  removePreset,
  togglePinPreset,
  saveCurrentPreset,
}: MoviesDiscoverPageMobileFiltersModalProps) {
  if (!open) return null

  return (
    <div className={styles.mobileModalBackdrop} onClick={onClose}>
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
            onClick={onClose}
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
                          onClose()
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
                  onClick={() => setMobileDraft((prev) => ({ ...prev, sort: 'popularity.desc' }))}
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
              onChange={(e) => setMobileDraft((prev) => ({ ...prev, provider: e.target.value }))}
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
              onChange={(e) => setMobileDraft((prev) => ({ ...prev, language: e.target.value }))}
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
              onClick={() => setMobileDraft({ ...EMPTY_MOVIES_FILTER_DRAFT })}
            >
              Clear
            </button>
            <button
              type="button"
              className={styles.mobilePrimaryBtn}
              onClick={() => {
                browsePush(toBrowsePath(mobileDraft, basePath))
                onClose()
              }}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
