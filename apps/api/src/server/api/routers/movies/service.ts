import { z } from 'zod'

import { generateMovieColors } from '../../../../lib/generateColors'
import * as mutations from './mutations'
import * as queries from './queries'

const visitorIdSchema = z
  .string()
  .trim()
  .min(8)
  .max(128)
  .regex(/^[a-zA-Z0-9:_-]+$/)

type FeedbackVote = 'like' | 'dislike'

interface GetMovieFeedbackInput {
  tmdbMovieId: number
  visitorId?: string
}

interface VoteMovieFeedbackInput {
  tmdbMovieId: number
  visitorId: string
  vote: FeedbackVote
}

interface MovieFeedbackData {
  tmdbMovieId: number
  likeCount: number
  dislikeCount: number
  userVote: FeedbackVote | null
}

interface VoteMovieFeedbackResult {
  data: MovieFeedbackData
  created: boolean
}

interface EnsureMovieVisualMetadataInput {
  tmdbMovieId: number
  tmdbBackdropPath?: string | null
}

interface EnsureMovieVisualMetadataResult {
  saved: boolean
  primaryColor: string | null
  blurHash: string | null
}

export function readVisitorId(raw: string | undefined): string | null {
  if (!raw) return null
  const parsed = visitorIdSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}

export async function getMovieFeedback(input: GetMovieFeedbackInput): Promise<MovieFeedbackData> {
  const visitorId = readVisitorId(input.visitorId)
  const counts = await queries.getMovieFeedbackCounts(input.tmdbMovieId)

  let userVote: FeedbackVote | null = null
  if (visitorId) {
    userVote = await queries.getExistingVote(input.tmdbMovieId, visitorId)
  }

  return {
    tmdbMovieId: input.tmdbMovieId,
    likeCount: counts.likeCount,
    dislikeCount: counts.dislikeCount,
    userVote,
  }
}

export async function voteMovieFeedback(
  input: VoteMovieFeedbackInput
): Promise<VoteMovieFeedbackResult> {
  const existingVote = await queries.getExistingVote(input.tmdbMovieId, input.visitorId)

  if (existingVote === null) {
    await mutations.insertVote(input.tmdbMovieId, input.visitorId, input.vote)
  } else if (existingVote !== input.vote) {
    await mutations.updateVote(input.tmdbMovieId, input.visitorId, input.vote)
  }

  const counts = await queries.getMovieFeedbackCounts(input.tmdbMovieId)

  return {
    created: existingVote === null,
    data: {
      tmdbMovieId: input.tmdbMovieId,
      likeCount: counts.likeCount,
      dislikeCount: counts.dislikeCount,
      userVote: input.vote,
    },
  }
}

/**
 * Computes and persists `primary_color` + `blur_hash` once for a movie.
 * Intended to be called from the first movie-detail read path.
 */
export async function ensureMovieVisualMetadata(
  input: EnsureMovieVisualMetadataInput
): Promise<EnsureMovieVisualMetadataResult> {
  const existing = await queries.getMovieVisualMetadata(input.tmdbMovieId)
  const hasVisuals = Boolean(existing?.primaryColor && existing?.blurHash)

  if (hasVisuals) {
    return {
      saved: false,
      primaryColor: existing?.primaryColor ?? null,
      blurHash: existing?.blurHash ?? null,
    }
  }

  const backdropPath = input.tmdbBackdropPath ?? existing?.backdropPath ?? null
  if (!backdropPath) {
    return { saved: false, primaryColor: null, blurHash: null }
  }

  const generated = await generateMovieColors(backdropPath)
  const updated = await mutations.updateMovieVisualMetadata(input.tmdbMovieId, generated)

  return {
    saved: updated,
    primaryColor: generated.primaryColor,
    blurHash: generated.blurHash,
  }
}
