import { and, db, eq, media, movieFeedbackVotes, sql } from '@repo/db'

export type FeedbackVote = 'like' | 'dislike'

export async function getMovieFeedbackCounts(
  tmdbMovieId: number
): Promise<{ likeCount: number; dislikeCount: number }> {
  const rows = await db
    .select({
      likeCount: sql<number>`coalesce(sum(case when ${movieFeedbackVotes.vote} = 'like' then 1 else 0 end), 0)`,
      dislikeCount: sql<number>`coalesce(sum(case when ${movieFeedbackVotes.vote} = 'dislike' then 1 else 0 end), 0)`,
    })
    .from(movieFeedbackVotes)
    .where(eq(movieFeedbackVotes.tmdbMovieId, tmdbMovieId))

  const row = rows[0]
  return {
    likeCount: Number(row?.likeCount ?? 0),
    dislikeCount: Number(row?.dislikeCount ?? 0),
  }
}

export async function getExistingVote(tmdbMovieId: number, visitorId: string) {
  const rows = await db
    .select({ vote: movieFeedbackVotes.vote })
    .from(movieFeedbackVotes)
    .where(
      and(
        eq(movieFeedbackVotes.tmdbMovieId, tmdbMovieId),
        eq(movieFeedbackVotes.visitorId, visitorId)
      )
    )
    .limit(1)

  return rows[0]?.vote ?? null
}

export async function getMovieVisualMetadata(tmdbMovieId: number) {
  const rows = await db
    .select({
      backdropPath: media.backdropPath,
      primaryColor: media.primaryColor,
      blurHash: media.blurHash,
    })
    .from(media)
    .where(eq(media.tmdbId, tmdbMovieId))
    .limit(1)

  return rows[0] ?? null
}
