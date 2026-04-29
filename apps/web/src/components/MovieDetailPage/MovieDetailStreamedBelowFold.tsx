import {
  getMoviePageDataTailMovie,
  getTvPageDataTailTv,
  type MoviePageCastMember,
  type MoviePageDetailTailInput,
} from '@/lib/tmdb'
import type { DetailMediaKind } from '@/lib/slug'
import {
  MovieCastSectionLazy,
  MovieCollectionSectionLazy,
  MoviePhotosSectionLazy,
} from './MovieDetailBelowFoldDynamics'
import { MovieCommentsRoot } from './MovieCommentsRoot.client'
import type { ReactNode } from 'react'

interface MovieDetailStreamedBelowFoldProps {
  tailInput: MoviePageDetailTailInput
  similarMediaKind: DetailMediaKind
  movieTitle: string
  cast: MoviePageCastMember[]
  /** Movie/cartoon use TMDB movie tail; TV uses TV tail (similar + images only). */
  variant?: 'movie' | 'tv'
  /** TV-only episodes block injected from TV routes. */
  tvEpisodesSection?: ReactNode
}

export async function MovieDetailStreamedBelowFold({
  tailInput,
  similarMediaKind,
  movieTitle,
  cast,
  variant = 'movie',
  tvEpisodesSection,
}: MovieDetailStreamedBelowFoldProps) {
  const tail =
    variant === 'tv'
      ? await getTvPageDataTailTv(tailInput)
      : await getMoviePageDataTailMovie(tailInput)
  const mediaId = tailInput.mediaId
  const isCartoonMode = similarMediaKind === 'cartoon'
  const hasAnimationGenre = (genres: string[] | undefined): boolean =>
    Array.isArray(genres) && genres.some((g) => g.toLowerCase() === 'animation')

  const similarOthers = tail.similar.filter((m) => {
    if (m.id === mediaId) return false
    if (!isCartoonMode) return true
    return hasAnimationGenre(m.genres)
  })
  const collectionOthers =
    tail.collection && tail.collection.parts.some((m) => m.id !== mediaId)
      ? {
          ...tail.collection,
          parts: tail.collection.parts.filter((m) => {
            if (m.id === mediaId) return false
            if (!isCartoonMode) return true
            return hasAnimationGenre(m.genres)
          }),
        }
      : null

  return (
    <>
      <MoviePhotosSectionLazy images={tail.backdropGallery} title={movieTitle} />
      <MovieCastSectionLazy cast={cast} />
      {variant === 'tv' && tvEpisodesSection}
      {collectionOthers && collectionOthers.parts.length > 0 && (
        <MovieCollectionSectionLazy
          title={collectionOthers.name}
          parts={collectionOthers.parts}
          mediaKind={similarMediaKind}
        />
      )}
      {similarOthers.length > 0 && (
        <MovieCollectionSectionLazy
          title="More Like This"
          parts={similarOthers}
          mediaKind={similarMediaKind}
        />
      )}
      <MovieCommentsRoot
        tmdbMovieId={tailInput.mediaId}
        movieTitle={movieTitle}
        mediaKind={similarMediaKind}
      />
    </>
  )
}
