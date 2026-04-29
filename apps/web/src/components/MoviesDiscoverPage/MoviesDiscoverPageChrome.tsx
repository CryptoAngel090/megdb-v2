import type { RefObject } from 'react'
import styles from './MoviesDiscoverPage.module.css'
import type { ActiveChip, MoviesFilterDraft } from './MoviesDiscoverPage.types'

type BreadcrumbCrumb = { href: string; label: string } | { label: string }

export interface MoviesDiscoverPageChromeProps {
  pageTitle: string
  seoTitle?: string | undefined
  seoSubtitle?: string | undefined
  heroDescription: string
  mobileFilterTriggerRef: RefObject<HTMLButtonElement | null>
  onOpenMobileFilters: () => void
  discoverBreadcrumbs: readonly BreadcrumbCrumb[] | null
  browsePush: (href: string) => void
  enableDiscoverPolish: boolean
  activeChips: ActiveChip[]
  push: (patch: Partial<MoviesFilterDraft>) => void
}

/**
 * Discover page chrome: SEO heading, mobile filter entry, optional category breadcrumb, applied chips.
 */
export function MoviesDiscoverPageChrome({
  pageTitle,
  seoTitle,
  seoSubtitle,
  heroDescription,
  mobileFilterTriggerRef,
  onOpenMobileFilters,
  discoverBreadcrumbs,
  browsePush,
  enableDiscoverPolish,
  activeChips,
  push,
}: MoviesDiscoverPageChromeProps) {
  return (
    <>
      <section className={styles.seoIntro} aria-label={`${pageTitle} page intro`}>
        <h1 className={styles.seoTitle}>{seoTitle ?? pageTitle}</h1>
        <p className={styles.seoSubtitle}>{seoSubtitle ?? heroDescription}</p>
      </section>

      <div className={styles.mobileFiltersBar}>
        <button
          ref={mobileFilterTriggerRef}
          type="button"
          className={styles.mobileFilterTrigger}
          onClick={onOpenMobileFilters}
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
    </>
  )
}
