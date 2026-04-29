import { and, db, eq, media, movieFeedbackVotes } from '@repo/db'

import type { FeedbackVote } from './queries'

export async function insertVote(tmdbMovieId: number, visitorId: string, vote: FeedbackVote) {
  await db.insert(movieFeedbackVotes).values({
    tmdbMovieId,
    visitorId,
    vote,
  })
}

export async function updateVote(tmdbMovieId: number, visitorId: string, vote: FeedbackVote) {
  await db
    .update(movieFeedbackVotes)
    .set({ vote })
    .where(
      and(
        eq(movieFeedbackVotes.tmdbMovieId, tmdbMovieId),
        eq(movieFeedbackVotes.visitorId, visitorId)
      )
    )
}

export async function updateMovieVisualMetadata(
  tmdbMovieId: number,
  input: { primaryColor: string; blurHash: string }
) {
  const rows = await db
    .update(media)
    .set({
      primaryColor: input.primaryColor,
      blurHash: input.blurHash,
      updatedAt: new Date(),
    })
    .where(eq(media.tmdbId, tmdbMovieId))
    .returning({ id: media.id })

  return rows.length > 0
}
