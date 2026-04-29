'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import styles from './TvSeriesEpisodes.module.css'

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function seasonsFromApiJson(data: unknown): Season[] {
  if (!isRecord(data)) return []
  const arr = data['seasons']
  if (!Array.isArray(arr)) return []
  const out: Season[] = []
  for (const item of arr) {
    if (!isRecord(item)) continue
    const id = item['id']
    const seasonNumber = item['seasonNumber']
    if (typeof id !== 'number' || typeof seasonNumber !== 'number') continue
    const name = item['name']
    const episodeCount = item['episodeCount']
    const airDate = item['airDate']
    const overview = item['overview']
    const posterPath = item['posterPath']
    out.push({
      id,
      name: typeof name === 'string' ? name : `Season ${seasonNumber}`,
      seasonNumber,
      episodeCount: typeof episodeCount === 'number' ? episodeCount : 0,
      airDate: airDate === null || typeof airDate === 'string' ? airDate : null,
      overview: typeof overview === 'string' ? overview : '',
      posterPath: posterPath === null || typeof posterPath === 'string' ? posterPath : null,
    })
  }
  return out
}

function episodesFromApiJson(data: unknown): Episode[] {
  if (!isRecord(data)) return []
  const arr = data['episodes']
  if (!Array.isArray(arr)) return []
  const out: Episode[] = []
  for (const item of arr) {
    if (!isRecord(item)) continue
    const id = item['id']
    const episodeNumber = item['episodeNumber']
    const seasonNumber = item['seasonNumber']
    if (
      typeof id !== 'number' ||
      typeof episodeNumber !== 'number' ||
      typeof seasonNumber !== 'number'
    )
      continue
    const name = item['name']
    const overview = item['overview']
    const stillPath = item['stillPath']
    const airDate = item['airDate']
    const runtime = item['runtime']
    const voteAverage = item['voteAverage']
    out.push({
      id,
      name: typeof name === 'string' ? name : `Episode ${episodeNumber}`,
      overview: typeof overview === 'string' ? overview : '',
      episodeNumber,
      seasonNumber,
      stillPath: stillPath === null || typeof stillPath === 'string' ? stillPath : null,
      airDate: airDate === null || typeof airDate === 'string' ? airDate : null,
      runtime: typeof runtime === 'number' ? runtime : null,
      voteAverage: typeof voteAverage === 'number' ? voteAverage : 0,
    })
  }
  return out
}

type Episode = {
  id: number
  name: string
  overview: string
  episodeNumber: number
  seasonNumber: number
  stillPath: string | null
  airDate: string | null
  runtime: number | null
  voteAverage: number
}

type Season = {
  id: number
  name: string
  seasonNumber: number
  episodeCount: number
  airDate: string | null
  overview: string
  posterPath: string | null
}

type TvSeriesEpisodesProps = {
  seriesId: number
  seriesTitle: string
}

export function TvSeriesEpisodes({ seriesId, seriesTitle }: TvSeriesEpisodesProps) {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [episodesLoading, setEpisodesLoading] = useState(false)
  const [expandedEpisodeId, setExpandedEpisodeId] = useState<number | null>(null)

  useEffect(() => {
    async function loadSeasons() {
      try {
        const response = await fetch(`/api/tv/${seriesId}/seasons`)
        if (!response.ok) {
          setSeasons([])
          return
        }
        const data: unknown = await response.json()
        const list = seasonsFromApiJson(data)
        setSeasons(list)
      } catch (error) {
        console.error('Failed to load seasons:', error)
        setSeasons([])
      } finally {
        setIsLoading(false)
      }
    }

    void loadSeasons()
  }, [seriesId])

  useEffect(() => {
    if (selectedSeason === null) return
    setExpandedEpisodeId(null)

    async function loadEpisodes() {
      setEpisodesLoading(true)
      try {
        const response = await fetch(`/api/tv/${seriesId}/season/${selectedSeason}`)
        if (!response.ok) {
          setEpisodes([])
          return
        }
        const data: unknown = await response.json()
        setEpisodes(episodesFromApiJson(data))
      } catch (error) {
        console.error('Failed to load episodes:', error)
        setEpisodes([])
      } finally {
        setEpisodesLoading(false)
      }
    }

    void loadEpisodes()
  }, [seriesId, selectedSeason])

  const episodesSectionLabel = `Episodes — ${seriesTitle}`

  if (isLoading) {
    return (
      <section className={styles.root} aria-label={episodesSectionLabel}>
        <h2 className={styles.title}>Episodes</h2>
        <div className={styles.loading}>Loading episodes...</div>
      </section>
    )
  }

  if (seasons.length === 0) {
    return null
  }

  return (
    <section className={styles.root} aria-label={episodesSectionLabel}>
      <h2 className={styles.title}>Episodes</h2>

      <div className={styles.seasonTabs}>
        {seasons.map((season) => (
          <button
            key={season.id}
            className={`${styles.seasonTab} ${selectedSeason === season.seasonNumber ? styles.seasonTabActive : ''}`}
            onClick={() =>
              setSelectedSeason((prev) =>
                prev === season.seasonNumber ? null : season.seasonNumber
              )
            }
            aria-pressed={selectedSeason === season.seasonNumber}
          >
            <span className={styles.seasonTabLabel}>{season.name}</span>
            <span className={styles.seasonTabCount}>
              {season.episodeCount} {season.episodeCount === 1 ? 'episode' : 'episodes'}
            </span>
          </button>
        ))}
      </div>

      {selectedSeason == null ? (
        <div className={styles.loading}>Tap a season to open episodes.</div>
      ) : episodesLoading ? (
        <div className={styles.loading}>Loading episodes...</div>
      ) : (
        <div className={styles.episodesList}>
          {episodes.map((episode) => (
            <article key={episode.id} className={styles.episodeCard}>
              <button
                type="button"
                className={styles.episodeToggle}
                aria-expanded={expandedEpisodeId === episode.id}
                aria-controls={`episode-panel-${episode.id}`}
                onClick={() =>
                  setExpandedEpisodeId((prev) => (prev === episode.id ? null : episode.id))
                }
              >
                <div className={styles.episodeToggleMain}>
                  <h3 className={styles.episodeName}>
                    Episode {episode.episodeNumber}: {episode.name}
                  </h3>
                  <span className={styles.episodeChevron} aria-hidden>
                    {expandedEpisodeId === episode.id ? '−' : '+'}
                  </span>
                </div>
              </button>
              {expandedEpisodeId === episode.id && (
                <div
                  id={`episode-panel-${episode.id}`}
                  className={`${styles.episodeExpanded} ${
                    episode.stillPath ? styles.episodeCardWithStill : styles.episodeCardNoStill
                  }`}
                >
                  {episode.stillPath && (
                    <div className={styles.episodeStill}>
                      <Image
                        src={`https://image.tmdb.org/t/p/w300${episode.stillPath}`}
                        alt={episode.name}
                        width={300}
                        height={169}
                        sizes="(max-width: 767px) 92vw, 240px"
                        className={styles.episodeStillImg}
                      />
                      {episode.runtime && (
                        <span className={styles.episodeRuntime}>{episode.runtime}m</span>
                      )}
                    </div>
                  )}
                  <div className={styles.episodeContent}>
                    <div className={styles.episodeHeader}>
                      {episode.voteAverage > 0 && (
                        <div className={styles.episodeRating}>
                          <svg
                            className={`${iconSlot.block} ${iconSlot.inline14}`}
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          {episode.voteAverage.toFixed(1)}
                        </div>
                      )}
                    </div>
                    {episode.airDate && (
                      <div className={styles.episodeAirDate}>
                        {new Date(episode.airDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    )}
                    {episode.overview && (
                      <p className={styles.episodeOverview}>{episode.overview}</p>
                    )}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
