import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { publicProcedure, router } from '../../../trpc'
import {
  ensureMovieVisualMetadata,
  getMovieFeedback,
  readVisitorId,
  voteMovieFeedback,
} from './service'

const tmdbMovieIdSchema = z.coerce.number().int().positive()

const getFeedbackSchema = z.object({
  tmdbMovieId: tmdbMovieIdSchema,
  visitorId: z.string().optional(),
})

const voteSchema = z.object({
  tmdbMovieId: tmdbMovieIdSchema,
  visitorId: z.string(),
  vote: z.enum(['like', 'dislike']),
})

const ensureVisualMetadataSchema = z.object({
  tmdbMovieId: tmdbMovieIdSchema,
  tmdbBackdropPath: z.string().min(1).optional(),
})

export const movieRouter = router({
  feedback: publicProcedure.input(getFeedbackSchema).query(async ({ input }) => {
    const payload: { tmdbMovieId: number; visitorId?: string } = {
      tmdbMovieId: input.tmdbMovieId,
    }
    if (input.visitorId !== undefined) {
      payload.visitorId = input.visitorId
    }

    const data = await getMovieFeedback(payload)

    return data
  }),
  vote: publicProcedure.input(voteSchema).mutation(async ({ input }) => {
    const visitorId = readVisitorId(input.visitorId)
    if (!visitorId) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Missing or invalid visitor id' })
    }

    const result = await voteMovieFeedback({
      tmdbMovieId: input.tmdbMovieId,
      visitorId,
      vote: input.vote,
    })

    return result.data
  }),
  ensureVisualMetadata: publicProcedure.input(ensureVisualMetadataSchema).mutation(({ input }) => {
    return ensureMovieVisualMetadata({
      tmdbMovieId: input.tmdbMovieId,
      tmdbBackdropPath: input.tmdbBackdropPath ?? null,
    })
  }),
})
