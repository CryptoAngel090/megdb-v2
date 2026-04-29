import { VirtuosoGrid } from 'react-virtuoso'
import { MediaCard } from '@/components/MediaCard/MediaCard'
import type { ShelfItem } from '@/lib/tmdb'
import { VIRTUOSO_OVERSCAN_PX } from './MoviesDiscoverPage.constants'
import { getShelfItemKey } from './MoviesDiscoverPage.helpers'
import styles from './MoviesDiscoverPage.module.css'
import { VirtuosoGridItem, VirtuosoGridList } from './MoviesDiscoverPageVirtuosoGrid'

export interface MoviesDiscoverPageResultsProps {
  items: ShelfItem[]
  err: string | null
  busy: boolean
  hasMore: boolean
  loadMore: () => Promise<void>
  emptyText: string
  hasActiveFilters: boolean
  basePath: string
  browsePush: (href: string) => void
  contentLabelPlural: string
  enableDiscoverPolish: boolean
  trustUpdatedAtLabel?: string | undefined
}

/**
 * Discover grid (Virtuoso), empty state, load error/retry, optional TMDB trust footer.
 */
export function MoviesDiscoverPageResults({
  items,
  err,
  busy,
  hasMore,
  loadMore,
  emptyText,
  hasActiveFilters,
  basePath,
  browsePush,
  contentLabelPlural,
  enableDiscoverPolish,
  trustUpdatedAtLabel,
}: MoviesDiscoverPageResultsProps) {
  return (
    <>
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
              totalCount={items.length}
              useWindowScroll
              overscan={VIRTUOSO_OVERSCAN_PX}
              components={{
                List: VirtuosoGridList,
                Item: VirtuosoGridItem,
              }}
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
    </>
  )
}
