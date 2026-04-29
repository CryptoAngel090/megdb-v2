'use client'

// client: isolates comments into a separate client chunk (`ssr:false` is allowed here, not in RSC).
import dynamic from 'next/dynamic'
import type { DetailMediaKind } from '@/lib/slug'
import styles from './MovieComments.module.css'

const MovieCommentsClient = dynamic(() => import('./MovieComments'), {
  ssr: false,
  loading: () => <div className={styles.lazyPlaceholder} aria-hidden />,
})

interface MovieCommentsRootProps {
  tmdbMovieId: number
  movieTitle: string
  mediaKind: DetailMediaKind
}

export function MovieCommentsRoot({ tmdbMovieId, movieTitle, mediaKind }: MovieCommentsRootProps) {
  return (
    <MovieCommentsClient tmdbMovieId={tmdbMovieId} movieTitle={movieTitle} mediaKind={mediaKind} />
  )
}
