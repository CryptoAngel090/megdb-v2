import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { z } from 'zod'
import { and, db, eq, movieFeedbackVotes, sql, users } from '@repo/db'

const app = new Hono()

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

app.get('/health', (c) => c.json({ status: 'ok', ts: Date.now() }))

// ── Auth: Register ────────────────────────────

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
})

app.post('/api/auth/register', async (c) => {
  const body = await c.req.json().catch(() => null)
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

  const { email, username, password } = parsed.data

  // Check if email already exists
  const existingEmail = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existingEmail.length > 0) {
    return c.json({ success: false, error: 'Email already registered' }, 409)
  }

  // Check if username already exists
  const existingUsername = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1)

  if (existingUsername.length > 0) {
    return c.json({ success: false, error: 'Username already taken' }, 409)
  }

  // Hash password (using Bun's built-in password hashing)
  const passwordHash = await Bun.password.hash(password, {
    algorithm: 'bcrypt',
    cost: 10,
  })

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      email,
      username,
      passwordHash,
      name: username, // Default name to username
      role: 'user',
    })
    .returning({
      id: users.id,
      email: users.email,
      username: users.username,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    })

  return c.json(
    {
      success: true,
      data: {
        user: newUser,
      },
    },
    201
  )
})

const tmdbMovieIdSchema = z.coerce.number().int().positive()
const voteBodySchema = z.object({
  vote: z.enum(['like', 'dislike']),
})
const visitorIdSchema = z
  .string()
  .trim()
  .min(8)
  .max(128)
  .regex(/^[a-zA-Z0-9:_-]+$/)

async function getMovieFeedbackCounts(
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

function readVisitorId(raw: string | undefined): string | null {
  if (!raw) return null
  const parsed = visitorIdSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}

app.get('/api/movie-feedback/:tmdbMovieId', async (c) => {
  const parsedMovieId = tmdbMovieIdSchema.safeParse(c.req.param('tmdbMovieId'))
  if (!parsedMovieId.success) {
    return c.json({ success: false, error: 'Invalid movie id' }, 400)
  }

  const tmdbMovieId = parsedMovieId.data
  const visitorId = readVisitorId(c.req.header('x-visitor-id'))

  const counts = await getMovieFeedbackCounts(tmdbMovieId)

  let userVote: 'like' | 'dislike' | null = null
  if (visitorId) {
    const existing = await db
      .select({ vote: movieFeedbackVotes.vote })
      .from(movieFeedbackVotes)
      .where(
        and(
          eq(movieFeedbackVotes.tmdbMovieId, tmdbMovieId),
          eq(movieFeedbackVotes.visitorId, visitorId)
        )
      )
      .limit(1)

    userVote = existing[0]?.vote ?? null
  }

  return c.json({
    success: true,
    data: {
      tmdbMovieId,
      likeCount: counts.likeCount,
      dislikeCount: counts.dislikeCount,
      userVote,
    },
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

  const existing = await db
    .select({ vote: movieFeedbackVotes.vote })
    .from(movieFeedbackVotes)
    .where(
      and(
        eq(movieFeedbackVotes.tmdbMovieId, tmdbMovieId),
        eq(movieFeedbackVotes.visitorId, visitorId)
      )
    )
    .limit(1)

  if (existing.length > 0 && existing[0]!.vote !== vote) {
    await db
      .update(movieFeedbackVotes)
      .set({ vote })
      .where(
        and(
          eq(movieFeedbackVotes.tmdbMovieId, tmdbMovieId),
          eq(movieFeedbackVotes.visitorId, visitorId)
        )
      )
  } else if (existing.length === 0) {
    await db.insert(movieFeedbackVotes).values({
      tmdbMovieId,
      visitorId,
      vote,
    })
  }

  const counts = await getMovieFeedbackCounts(tmdbMovieId)

  return c.json(
    {
      success: true,
      data: {
        tmdbMovieId,
        likeCount: counts.likeCount,
        dislikeCount: counts.dislikeCount,
        userVote: vote,
      },
    },
    existing.length === 0 ? 201 : 200
  )
})

export default {
  port: process.env.PORT ?? 5000,
  fetch: app.fetch,
}
