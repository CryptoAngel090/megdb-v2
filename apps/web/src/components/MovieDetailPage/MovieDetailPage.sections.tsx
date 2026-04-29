import { FadeInView } from '@/components/FadeInView/FadeInView'
import type { MoviePageDetail } from '@/lib/tmdb'
import { MovieTrailerBlockLazy } from './MovieDetailBelowFoldDynamics'
import { MovieShareButton } from './MovieShareButton'
import { MovieWatchProvidersPanel } from './MovieWatchProvidersPanel'
import styles from './MovieDetailPage.layout.module.css'

interface DetailStatsRailSectionProps {
  title: string
  hasWatchProvidersPanel: boolean
  watchProvidersUs: MoviePageDetail['watchProvidersUs']
}

export function DetailStatsRailSection({
  title,
  hasWatchProvidersPanel,
  watchProvidersUs,
}: DetailStatsRailSectionProps) {
  return (
    <div className={styles.detailStatsRail}>
      <FadeInView delay={0.1}>
        <div className={styles.pageTools} aria-label="Watch and share">
          <div className={styles.pageToolsBtns}>
            <MovieShareButton title={title} className={styles.shareFull ?? ''} />
          </div>
          {hasWatchProvidersPanel && watchProvidersUs && (
            <div className={styles.sidebarProviders}>
              <MovieWatchProvidersPanel
                providers={watchProvidersUs}
                movieTitle={title}
                className={styles.providersSidebar ?? ''}
              />
            </div>
          )}
        </div>
      </FadeInView>
    </div>
  )
}

interface TrailerSectionProps {
  title: string
  trailerName?: string | null | undefined
  trailerKey: string
}

export function TrailerSection({ title, trailerName, trailerKey }: TrailerSectionProps) {
  return (
    <FadeInView delay={0.05}>
      <section id="trailer" className={styles.trailerSection} aria-labelledby="movie-trailer-heading">
        <h2 id="movie-trailer-heading" className={styles.overviewTitle}>
          Trailer
        </h2>
        <MovieTrailerBlockLazy
          videoKey={trailerKey}
          embedTitle={trailerName ? `${title} — ${trailerName}` : `${title} trailer`}
          boxClassName={styles.trailerBox}
        />
      </section>
    </FadeInView>
  )
}

interface ProvidersSectionsProps {
  title: string
  isTvLike: boolean
  hasWatchProvidersPanel: boolean
  watchProvidersUs: MoviePageDetail['watchProvidersUs']
}

export function ProvidersSections({
  title,
  isTvLike,
  hasWatchProvidersPanel,
  watchProvidersUs,
}: ProvidersSectionsProps) {
  if (!hasWatchProvidersPanel || !watchProvidersUs) return null

  return (
    <>
      {isTvLike && (
        <div className={styles.mobileProviders}>
          <MovieWatchProvidersPanel providers={watchProvidersUs} movieTitle={title} />
        </div>
      )}

      <div className={styles.desktopMainProviders}>
        <MovieWatchProvidersPanel
          providers={watchProvidersUs}
          movieTitle={title}
          className={styles.providersSidebar ?? ''}
        />
      </div>

      {!isTvLike && (
        <div className={styles.mobileProviders}>
          <MovieWatchProvidersPanel providers={watchProvidersUs} movieTitle={title} />
        </div>
      )}
    </>
  )
}
