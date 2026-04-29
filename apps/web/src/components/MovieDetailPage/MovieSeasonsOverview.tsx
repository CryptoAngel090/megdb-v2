import styles from './MovieSeasonsOverview.module.css'

interface TvSeasonSummary {
  seasonNumber: number
  name: string
  episodeCount: number
}

interface MovieSeasonsOverviewProps {
  title: string
  seasons: TvSeasonSummary[]
}

export function MovieSeasonsOverview({ title, seasons }: MovieSeasonsOverviewProps) {
  const totalEpisodes = seasons.reduce((sum, season) => sum + season.episodeCount, 0)

  return (
    <section className={styles.seasonsOverview} aria-label={`Seasons overview for ${title}`}>
      <h2 className={styles.overviewTitle}>Seasons overview</h2>
      <p className={styles.seasonsLead}>
        {seasons.length} seasons
        {totalEpisodes > 0 ? ` · ${totalEpisodes} episodes` : ''}
      </p>
      <div className={styles.seasonsList}>
        {seasons.slice(0, 8).map((season) => (
          <span key={`season-${season.seasonNumber}`} className={styles.seasonPill}>
            {season.name}
            {season.episodeCount > 0 ? ` (${season.episodeCount})` : ''}
          </span>
        ))}
      </div>
    </section>
  )
}
