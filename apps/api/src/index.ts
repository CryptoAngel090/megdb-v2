import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { z } from 'zod'
import { Resend } from 'resend'
import { and, db, eq, movieComments, sql } from '@repo/db'
import { appRouter } from './server/api/root'
import {
  ensureMovieVisualMetadata,
  getMovieFeedback,
  readVisitorId,
  voteMovieFeedback,
} from './server/api/routers/movies/service'
import { loginUser, registerOAuthUser, registerUser } from './server/api/routers/users/service'
import { createTRPCContext } from './server/context'
import { getCommentModerationEmail } from './emails/comment-moderation'

const app = new Hono()
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

app.use('*', logger())
app.use(
  '/api/*',
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.WEB_URL ?? '',
      process.env.ADMIN_URL ?? '',
    ],
    credentials: true,
  })
)
app.use(
  '/trpc/*',
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.WEB_URL ?? '',
      process.env.ADMIN_URL ?? '',
    ],
    credentials: true,
  })
)

app.get('/health', (c) => c.json({ status: 'ok', ts: Date.now() }))
app.all('/trpc/*', (c) => {
  return fetchRequestHandler({
    endpoint: '/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext: createTRPCContext,
  })
})

// ── Auth: Register ────────────────────────────

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
})

app.post('/api/auth/register', async (c) => {
  const body: unknown = await c.req.json().catch(() => null)
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: 'Invalid input',
        details: parsed.error.flatten().fieldErrors,
      },
      400
    )
  }

  const result = await registerUser(parsed.data)
  if (!result.ok) {
    if (result.reason === 'email_taken') {
      return c.json({ success: false, error: 'Email already registered' }, 409)
    }
    return c.json({ success: false, error: 'Username already taken' }, 409)
  }

  return c.json(
    {
      success: true,
      data: {
        user: result.user,
      },
    },
    201
  )
})

// ── Auth: Login ────────────────────────────

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const oauthSchema = z.object({
  provider: z.enum(['google', 'github']),
  providerId: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1).max(120).optional(),
  image: z.string().url().optional(),
})

app.post('/api/auth/login', async (c) => {
  const body: unknown = await c.req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: 'Invalid input',
        details: parsed.error.flatten().fieldErrors,
      },
      400
    )
  }

  const result = await loginUser(parsed.data)
  if (!result.ok) {
    return c.json({ success: false, error: 'Invalid email or password' }, 401)
  }

  return c.json({
    success: true,
    data: {
      user: result.user,
    },
  })
})

app.post('/api/auth/oauth', async (c) => {
  const body: unknown = await c.req.json().catch(() => null)
  const parsed = oauthSchema.safeParse(body)

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: 'Invalid OAuth payload',
        details: parsed.error.flatten().fieldErrors,
      },
      400
    )
  }

  const result = await registerOAuthUser(parsed.data)
  return c.json({
    success: true,
    data: {
      user: result.user,
    },
  })
})

const tmdbMovieIdSchema = z.coerce.number().int().positive()
const voteBodySchema = z.object({
  vote: z.enum(['like', 'dislike']),
})
const ensureVisualMetadataBodySchema = z.object({
  tmdbBackdropPath: z.string().min(1).optional(),
})
const commentBodySchema = z.object({
  authorName: z.string().trim().min(2).max(80),
  authorEmail: z.string().trim().email().max(160),
  body: z.string().trim().min(3).max(2000),
  movieTitle: z.string().trim().min(1).max(240),
  mediaType: z.enum(['movie', 'series', 'cartoon', 'tvshow']),
})
const moderateActionSchema = z.enum(['approve', 'reject'])

app.get('/api/movie-feedback/:tmdbMovieId', async (c) => {
  const parsedMovieId = tmdbMovieIdSchema.safeParse(c.req.param('tmdbMovieId'))
  if (!parsedMovieId.success) {
    return c.json({ success: false, error: 'Invalid movie id' }, 400)
  }

  const tmdbMovieId = parsedMovieId.data
  const rawVisitorId = c.req.header('x-visitor-id')
  const payload: { tmdbMovieId: number; visitorId?: string } = { tmdbMovieId }
  if (rawVisitorId !== undefined) {
    payload.visitorId = rawVisitorId
  }

  const data = await getMovieFeedback(payload)

  return c.json({
    success: true,
    data,
  })
})

app.post('/api/movie-feedback/:tmdbMovieId/vote', async (c) => {
  const parsedMovieId = tmdbMovieIdSchema.safeParse(c.req.param('tmdbMovieId'))
  if (!parsedMovieId.success) {
    return c.json({ success: false, error: 'Invalid movie id' }, 400)
  }

  const parsedBody = voteBodySchema.safeParse(await c.req.json().catch(() => null))
  if (!parsedBody.success) {
    return c.json({ success: false, error: 'Invalid vote payload' }, 400)
  }

  const visitorId = readVisitorId(c.req.header('x-visitor-id'))
  if (!visitorId) {
    return c.json({ success: false, error: 'Missing or invalid visitor id' }, 400)
  }

  const tmdbMovieId = parsedMovieId.data
  const vote = parsedBody.data.vote

  const result = await voteMovieFeedback({
    tmdbMovieId,
    visitorId,
    vote,
  })

  return c.json(
    {
      success: true,
      data: result.data,
    },
    result.created ? 201 : 200
  )
})

app.post('/api/movie-visuals/:tmdbMovieId/ensure', async (c) => {
  const parsedMovieId = tmdbMovieIdSchema.safeParse(c.req.param('tmdbMovieId'))
  if (!parsedMovieId.success) {
    return c.json({ success: false, error: 'Invalid movie id' }, 400)
  }

  const parsedBody = ensureVisualMetadataBodySchema.safeParse(await c.req.json().catch(() => null))
  if (!parsedBody.success) {
    return c.json({ success: false, error: 'Invalid payload' }, 400)
  }

  try {
    const result = await ensureMovieVisualMetadata({
      tmdbMovieId: parsedMovieId.data,
      tmdbBackdropPath: parsedBody.data.tmdbBackdropPath ?? null,
    })
    return c.json({ success: true, data: result })
  } catch (error) {
    console.error('[ensureMovieVisualMetadata]', error)
    return c.json({ success: false, error: 'Failed to generate visual metadata' }, 500)
  }
})

app.get('/api/movie-comments/:tmdbMovieId', async (c) => {
  const parsedMovieId = tmdbMovieIdSchema.safeParse(c.req.param('tmdbMovieId'))
  if (!parsedMovieId.success) {
    return c.json({ success: false, error: 'Invalid movie id' }, 400)
  }

  const tmdbMovieId = parsedMovieId.data
  const mediaType = z
    .enum(['movie', 'series', 'cartoon', 'tvshow'])
    .catch('movie')
    .parse(c.req.query('mediaType'))
  const rows = await db
    .select({
      id: movieComments.id,
      authorName: movieComments.authorName,
      body: movieComments.body,
      createdAt: movieComments.createdAt,
    })
    .from(movieComments)
    .where(
      and(
        eq(movieComments.tmdbMovieId, tmdbMovieId),
        eq(movieComments.mediaType, mediaType),
        eq(movieComments.status, 'approved')
      )
    )
    .orderBy(sql`${movieComments.createdAt} desc`)

  return c.json({ success: true, data: rows })
})

app.post('/api/movie-comments/:tmdbMovieId', async (c) => {
  const parsedMovieId = tmdbMovieIdSchema.safeParse(c.req.param('tmdbMovieId'))
  if (!parsedMovieId.success) {
    return c.json({ success: false, error: 'Invalid movie id' }, 400)
  }

  const parsedBody = commentBodySchema.safeParse(await c.req.json().catch(() => null))
  if (!parsedBody.success) {
    return c.json(
      { success: false, error: 'Invalid payload', details: parsedBody.error.flatten().fieldErrors },
      400
    )
  }

  const tmdbMovieId = parsedMovieId.data
  const moderationToken = crypto.randomUUID()
  const createdRows = await db
    .insert(movieComments)
    .values({
      tmdbMovieId,
      mediaType: parsedBody.data.mediaType,
      authorName: parsedBody.data.authorName,
      authorEmail: parsedBody.data.authorEmail,
      body: parsedBody.data.body,
      moderationToken,
      status: 'pending',
    })
    .returning({ id: movieComments.id })

  const created = createdRows[0]
  const adminEmail = process.env.COMMENT_MODERATION_EMAIL ?? 'vkkoder@gmail.com'
  const publicApiUrl = (process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 5000}`).replace(
    /\/+$/,
    ''
  )

  if (resend) {
    try {
      const approveUrl = `${publicApiUrl}/api/movie-comments/moderate?token=${encodeURIComponent(moderationToken)}&action=approve`
      const rejectUrl = `${publicApiUrl}/api/movie-comments/moderate?token=${encodeURIComponent(moderationToken)}&action=reject`
      const email = getCommentModerationEmail({
        movieTitle: parsedBody.data.movieTitle,
        authorName: parsedBody.data.authorName,
        authorEmail: parsedBody.data.authorEmail,
        body: parsedBody.data.body,
        approveUrl,
        rejectUrl,
      })

      await resend.emails.send({
        from: 'MegDB Comments <notifications@resend.dev>',
        to: adminEmail,
        subject: email.subject,
        html: email.html,
      })
    } catch (error) {
      console.error('[movie-comments] failed to send moderation email', error)
    }
  } else {
    console.warn('[movie-comments] Resend not configured; moderation email not sent')
  }

  return c.json({ success: true, data: { id: created?.id ?? null, status: 'pending' } }, 201)
})

app.get('/api/movie-comments/moderate', async (c) => {
  const token = c.req.query('token')
  const actionRaw = c.req.query('action')
  const parsedAction = moderateActionSchema.safeParse(actionRaw)

  if (!token || !parsedAction.success) {
    return c.html('<h2>Invalid moderation link.</h2>', 400)
  }

  const rows = await db
    .select({ id: movieComments.id, status: movieComments.status })
    .from(movieComments)
    .where(eq(movieComments.moderationToken, token))
    .limit(1)
  const target = rows[0]
  if (!target) {
    return c.html('<h2>Comment not found or link expired.</h2>', 404)
  }

  const nextStatus = parsedAction.data === 'approve' ? 'approved' : 'rejected'
  await db
    .update(movieComments)
    .set({ status: nextStatus, reviewedAt: new Date() })
    .where(eq(movieComments.id, target.id))

  return c.html(
    `<h2 style="font-family:Arial,sans-serif;">Comment ${nextStatus} successfully.</h2>`,
    200
  )
})

export default {
  port: process.env.PORT ?? 5000,
  fetch: app.fetch,
}
