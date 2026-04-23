'use client'

import { useEffect, useState } from 'react'
import styles from './MovieOverviewFeedback.module.css'

type FeedbackVote = 'like' | 'dislike'
type VoteCounts = { like: number; dislike: number }

type MovieOverviewFeedbackProps = {
  movieId: number
  feedbackScope?: 'movie' | 'tv'
}

type FeedbackResponse = {
  success: boolean
  data?: { likeCount: number; dislikeCount: number; userVote: FeedbackVote | null }
}

const TV_FEEDBACK_ID_OFFSET = 1_000_000_000

function scopedFeedbackId(movieId: number, feedbackScope: 'movie' | 'tv'): number {
  return feedbackScope === 'tv' ? movieId + TV_FEEDBACK_ID_OFFSET : movieId
}

function voteChoiceKey(movieId: number, feedbackScope: 'movie' | 'tv'): string {
  return `megdb:${feedbackScope}-feedback-vote:${movieId}`
}

function visitorIdStorageKey(): string {
  return 'megdb:visitor-id'
}

function IconThumbsUp() {
  return (
    <svg viewBox="0 0 24 24" className={styles.feedbackIcon} aria-hidden>
      <path
        d="M14 9V5.7c0-.9-.73-1.7-1.7-1.7-.4 0-.79.15-1.08.42L7 8.5V20h10.2c1.05 0 1.96-.73 2.2-1.75l1.48-6.25A2.25 2.25 0 0018.7 9H14Zm-9 0H3.5A1.5 1.5 0 002 10.5v8A1.5 1.5 0 003.5 20H5V9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconThumbsDown() {
  return (
    <svg viewBox="0 0 24 24" className={styles.feedbackIcon} aria-hidden>
      <path
        d="M10 15v3.3c0 .9.73 1.7 1.7 1.7.4 0 .79-.15 1.08-.42L17 15.5V4H6.8c-1.05 0-1.96.73-2.2 1.75L3.12 12A2.25 2.25 0 005.3 15H10Zm9 0h1.5a1.5 1.5 0 001.5-1.5v-8A1.5 1.5 0 0020.5 4H19v11Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function MovieOverviewFeedback({
  movieId,
  feedbackScope = 'movie',
}: MovieOverviewFeedbackProps) {
  const [visitorId, setVisitorId] = useState<string | null>(null)
  const [vote, setVote] = useState<FeedbackVote | null>(null)
  const [counts, setCounts] = useState<VoteCounts>({ like: 0, dislike: 0 })
  const [pulseVote, setPulseVote] = useState<FeedbackVote | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000').replace(/\/+$/, '')

  useEffect(() => {
    try {
      const rawVisitorId = window.localStorage.getItem(visitorIdStorageKey())
      if (rawVisitorId && rawVisitorId.length >= 8) {
        setVisitorId(rawVisitorId)
        return
      }
      const nextVisitorId =
        window.crypto?.randomUUID?.() ??
        `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      window.localStorage.setItem(visitorIdStorageKey(), nextVisitorId)
      setVisitorId(nextVisitorId)
    } catch {
      setVisitorId(`anon-${Date.now()}`)
    }
  }, [])

  const feedbackEntityId = scopedFeedbackId(movieId, feedbackScope)

  useEffect(() => {
    if (!visitorId) return

    let cancelled = false
    const endpoint = `${apiBase}/api/movie-feedback/${feedbackEntityId}`

    async function loadFeedback(): Promise<void> {
      try {
        const res = await fetch(endpoint, {
          method: 'GET',
          headers: {
            ...(visitorId ? { 'x-visitor-id': visitorId } : {}),
          },
          cache: 'no-store',
        })
        const json = (await res.json()) as FeedbackResponse

        if (!cancelled && json.success && json.data) {
          setCounts({
            like: json.data.likeCount,
            dislike: json.data.dislikeCount,
          })
          setVote(json.data.userVote)
        }
      } catch {
        if (!cancelled) {
          setCounts({ like: 0, dislike: 0 })
          setVote(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadFeedback()
    return () => {
      cancelled = true
    }
  }, [apiBase, feedbackEntityId, visitorId])

  function handleVote(nextVote: FeedbackVote): void {
    if (isLoading || !visitorId || vote === nextVote) return

    const endpoint = `${apiBase}/api/movie-feedback/${feedbackEntityId}/vote`
    const prevVote = vote
    const prevCounts = counts
    const optimisticCounts: VoteCounts = { ...counts }

    if (prevVote === 'like') optimisticCounts.like = Math.max(0, optimisticCounts.like - 1)
    if (prevVote === 'dislike') optimisticCounts.dislike = Math.max(0, optimisticCounts.dislike - 1)
    if (nextVote === 'like') optimisticCounts.like += 1
    if (nextVote === 'dislike') optimisticCounts.dislike += 1

    setVote(nextVote)
    setCounts(optimisticCounts)
    setPulseVote(nextVote)
    window.setTimeout(() => setPulseVote(null), 420)

    void fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-visitor-id': visitorId,
      },
      body: JSON.stringify({ vote: nextVote }),
    })
      .then(async (res) => {
        const json = (await res.json()) as FeedbackResponse
        if (json.data) {
          setCounts({
            like: json.data.likeCount,
            dislike: json.data.dislikeCount,
          })
          setVote(json.data.userVote)
          try {
            window.localStorage.setItem(
              voteChoiceKey(movieId, feedbackScope),
              json.data.userVote ?? ''
            )
          } catch {
            // Ignore storage errors.
          }
        } else if (!res.ok) {
          setVote(prevVote)
          setCounts(prevCounts)
        }
      })
      .catch(() => {
        setVote(prevVote)
        setCounts(prevCounts)
      })
  }

  return (
    <div
      className={styles.feedbackPanel}
      aria-label={feedbackScope === 'tv' ? 'TV series feedback' : 'Movie feedback'}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px',
        margin: '0 0 0.8rem',
        width: '100%',
      }}
    >
      <div
        key="like-group"
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '20px' }}
      >
        <button
          type="button"
          className={`${styles.feedbackButton} ${styles.likeButton} ${
            vote === 'like' ? styles.feedbackButtonSelected : ''
          } ${pulseVote === 'like' ? styles.feedbackButtonPulse : ''}`}
          onClick={() => handleVote('like')}
          disabled={isLoading}
          aria-pressed={vote === 'like'}
        >
          <IconThumbsUp />
          <span>Like</span>
        </button>
        <span className={`${styles.count} ${styles.countLike}`}>
          {counts.like.toLocaleString('en-US')}
        </span>
      </div>
      <div
        key="dislike-group"
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '20px' }}
      >
        <button
          type="button"
          className={`${styles.feedbackButton} ${styles.dislikeButton} ${
            vote === 'dislike' ? styles.feedbackButtonSelected : ''
          } ${pulseVote === 'dislike' ? styles.feedbackButtonPulse : ''}`}
          onClick={() => handleVote('dislike')}
          disabled={isLoading}
          aria-pressed={vote === 'dislike'}
        >
          <IconThumbsDown />
          <span>Dislike</span>
        </button>
        <span className={`${styles.count} ${styles.countDislike}`}>
          {counts.dislike.toLocaleString('en-US')}
        </span>
      </div>
    </div>
  )
}
