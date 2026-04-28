'use client'

import { useEffect, useMemo, useState } from 'react'
import type { DetailMediaKind } from '@/lib/slug'
import styles from './MovieComments.module.css'

interface MovieCommentRow {
  id: number
  authorName: string
  body: string
  createdAt: string | Date | null
}

interface MovieCommentsProps {
  tmdbMovieId: number
  movieTitle: string
  mediaKind: DetailMediaKind
}

interface CommentsResponse {
  success: boolean
  data?: MovieCommentRow[]
}

export function MovieComments({ tmdbMovieId, movieTitle, mediaKind }: MovieCommentsProps) {
  const apiBase = useMemo(
    () => (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000').replace(/\/+$/, ''),
    []
  )
  const [items, setItems] = useState<MovieCommentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [form, setForm] = useState({ authorName: '', authorEmail: '', body: '' })

  useEffect(() => {
    let cancelled = false
    async function loadApproved() {
      setLoading(true)
      try {
        const res = await fetch(
          `${apiBase}/api/movie-comments/${tmdbMovieId}?mediaType=${encodeURIComponent(mediaKind)}`,
          { cache: 'no-store' }
        )
        const json = (await res.json().catch(() => null)) as CommentsResponse | null
        if (!cancelled && res.ok && json?.success && Array.isArray(json.data)) {
          setItems(json.data)
        }
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadApproved()
    return () => {
      cancelled = true
    }
  }, [apiBase, tmdbMovieId, mediaKind])

  async function submitComment() {
    if (posting) return
    setPosting(true)
    setNotice(null)
    try {
      const res = await fetch(`${apiBase}/api/movie-comments/${tmdbMovieId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: form.authorName.trim(),
          authorEmail: form.authorEmail.trim(),
          body: form.body.trim(),
          movieTitle,
          mediaType: mediaKind,
        }),
      })
      if (!res.ok) {
        setNotice('Failed to send comment. Please try again.')
      } else {
        setNotice('Comment sent for moderation. It will appear after approval.')
        setForm({ authorName: '', authorEmail: '', body: '' })
      }
    } catch {
      setNotice('Failed to send comment. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    void submitComment()
  }

  return (
    <section className={styles.root} aria-label="Comments">
      <h2 className={styles.title}>Comments</h2>

      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          value={form.authorName}
          onChange={(e) => setForm((p) => ({ ...p, authorName: e.target.value }))}
          placeholder="Your name"
          minLength={2}
          maxLength={80}
          required
        />
        <input
          className={styles.input}
          type="email"
          value={form.authorEmail}
          onChange={(e) => setForm((p) => ({ ...p, authorEmail: e.target.value }))}
          placeholder="Your email"
          maxLength={160}
          required
        />
        <textarea
          className={styles.textarea}
          value={form.body}
          onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
          placeholder="Write your comment"
          minLength={3}
          maxLength={2000}
          required
        />
        <button className={styles.submit} type="submit" disabled={posting}>
          {posting ? 'Sending...' : 'Send comment'}
        </button>
      </form>

      {notice && <p className={styles.notice}>{notice}</p>}

      {loading ? (
        <p className={styles.meta}>Loading comments...</p>
      ) : items.length === 0 ? (
        <p className={styles.meta}>No approved comments yet.</p>
      ) : (
        <div className={styles.list}>
          {items.map((comment) => (
            <article key={comment.id} className={styles.item}>
              <header className={styles.itemHead}>
                <strong>{comment.authorName}</strong>
              </header>
              <p className={styles.body}>{comment.body}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
