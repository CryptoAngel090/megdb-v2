'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import styles from './TvSeriesEpisodes.module.css'

const PORTAL_ROOT_ID = 'megdb-portal-root'

function getPortalHost(): HTMLElement {
  return document.getElementById(PORTAL_ROOT_ID) ?? document.body
}

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
  const [selectedSeason, setSelectedSeason] = useState<number>(1)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [episodesLoading, setEpisodesLoading] = useState(false)
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)

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
        if (list.length > 0) {
          setSelectedSeason(list[0].seasonNumber)
        }
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

  useEffect(() => {
    if (!selectedEpisode) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedEpisode(null)
      }
    }

    document.addEventListener('keydown', handleEscape)
    const prevBodyOverflow = document.body.style.overflow
    const prevHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = prevBodyOverflow
      document.documentElement.style.overflow = prevHtmlOverflow
    }
  }, [selectedEpisode])

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
            onClick={() => setSelectedSeason(season.seasonNumber)}
            aria-pressed={selectedSeason === season.seasonNumber}
          >
            <span className={styles.seasonTabLabel}>{season.name}</span>
            <span className={styles.seasonTabCount}>
              {season.episodeCount} {season.episodeCount === 1 ? 'episode' : 'episodes'}
            </span>
          </button>
        ))}
      </div>

      {episodesLoading ? (
        <div className={styles.loading}>Loading episodes...</div>
      ) : (
        <div className={styles.episodesList}>
          {episodes.map((episode) => (
            <article
              key={episode.id}
              className={`${styles.episodeCard} ${
                episode.stillPath ? styles.episodeCardWithStill : styles.episodeCardNoStill
              }`}
              onClick={() => {
                setSelectedEpisode(episode)
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedEpisode(episode)
                }
              }}
            >
              <div className={styles.episodeNumber}>
                <span className={styles.episodeNumberLabel}>EP</span>
                <span className={styles.episodeNumberValue}>{episode.episodeNumber}</span>
              </div>

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
                  <h3 className={styles.episodeName}>{episode.name}</h3>
                  {episode.voteAverage > 0 && (
                    <div className={styles.episodeRating}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
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

                {episode.overview && <p className={styles.episodeOverview}>{episode.overview}</p>}
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedEpisode && (
        <EpisodeModal episode={selectedEpisode} onClose={() => setSelectedEpisode(null)} />
      )}
    </section>
  )
}

function EpisodeModal({ episode, onClose }: { episode: Episode; onClose: () => void }) {
  const titleId = `episode-modal-title-${episode.id}`
  const rating =
    typeof episode.voteAverage === 'number' &&
    Number.isFinite(episode.voteAverage) &&
    episode.voteAverage > 0
      ? episode.voteAverage.toFixed(1)
      : null

  return createPortal(
    <div
      className={styles.modalBackdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Close">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {episode.stillPath && (
          <div className={styles.modalImage}>
            <Image
              src={`https://image.tmdb.org/t/p/w780${episode.stillPath}`}
              alt=""
              width={780}
              height={439}
              sizes="(max-width: 768px) 100vw, min(900px, 90vw)"
              className={styles.modalImageImg}
            />
          </div>
        )}

        <div className={styles.modalBody}>
          <div className={styles.modalHeader}>
            <div className={styles.modalEpisodeNumber}>Episode {episode.episodeNumber}</div>
            <h2 id={titleId} className={styles.modalTitle}>
              {episode.name}
            </h2>
          </div>

          <div className={styles.modalMeta}>
            {episode.airDate && (
              <span className={styles.modalMetaItem}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {new Date(episode.airDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            )}
            {episode.runtime != null && episode.runtime > 0 && (
              <span className={styles.modalMetaItem}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                {episode.runtime} minutes
              </span>
            )}
            {rating != null && (
              <span className={styles.modalMetaItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {rating} / 10
              </span>
            )}
          </div>

          {episode.overview && (
            <div className={styles.modalOverview}>
              <h3 className={styles.modalOverviewTitle}>Synopsis</h3>
              <p className={styles.modalOverviewText}>{episode.overview}</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    getPortalHost()
  )
}
