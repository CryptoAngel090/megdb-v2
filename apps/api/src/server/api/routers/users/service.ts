import { Resend } from 'resend'

import { getAdminNotificationEmail } from '../../../../emails/admin-notification'
import { getWelcomeEmail } from '../../../../emails/welcome'
import * as mutations from './mutations'
import * as queries from './queries'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface RegisterUserInput {
  email: string
  username: string
  password: string
}

type RegisterUserPublic = NonNullable<Awaited<ReturnType<typeof mutations.insertUser>>>

type RegisterUserResult =
  | { ok: true; user: RegisterUserPublic }
  | { ok: false; reason: 'email_taken' | 'username_taken' }

interface LoginUserInput {
  email: string
  password: string
}

interface OAuthUserInput {
  provider: 'google' | 'github'
  providerId: string
  email: string
  name?: string | undefined
}

type UserWithPassword = NonNullable<Awaited<ReturnType<typeof queries.getUserByEmail>>>

type LoginUserPublic = Omit<UserWithPassword, 'passwordHash'>

type LoginUserResult =
  | { ok: true; user: LoginUserPublic }
  | { ok: false; reason: 'invalid_credentials' }

type OAuthUserResult = { ok: true; user: LoginUserPublic }

function normalizeUsernameSeed(email: string, name?: string | undefined): string {
  const fromName = (name ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
  const fromEmail =
    email
      .split('@')[0]
      ?.toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_') ?? 'user'
  const base = (fromName || fromEmail || 'user').replace(/^_+|_+$/g, '')
  return (base.length >= 3 ? base : `user_${base}`).slice(0, 32)
}

async function generateUniqueUsername(seed: string): Promise<string> {
  const base = seed || 'user'
  for (let i = 0; i < 100; i += 1) {
    const suffix = i === 0 ? '' : `_${Math.floor(1000 + Math.random() * 9000)}`
    const candidate = `${base}${suffix}`.slice(0, 50)
    const taken = await queries.getUserIdByUsername(candidate)
    if (taken === undefined) return candidate
  }
  return `user_${Date.now()}`
}

export async function registerUser(data: RegisterUserInput): Promise<RegisterUserResult> {
  const existingEmail = await queries.getUserByEmail(data.email)
  if (existingEmail) {
    return { ok: false, reason: 'email_taken' }
  }

  const existingUsernameId = await queries.getUserIdByUsername(data.username)
  if (existingUsernameId !== undefined) {
    return { ok: false, reason: 'username_taken' }
  }

  const passwordHash = await Bun.password.hash(data.password, {
    algorithm: 'bcrypt',
    cost: 10,
  })

  const user = await mutations.insertUser({
    email: data.email,
    username: data.username,
    passwordHash,
    name: data.username,
    role: 'user',
  })

  if (!user) {
    throw new Error('[registerUser] insert returned no row')
  }

  const RESEND_VERIFIED_EMAIL = process.env.RESEND_VERIFIED_EMAIL
  if (resend) {
    try {
      const welcomeEmail = getWelcomeEmail(data.username)
      await resend.emails.send({
        from: 'MegDB <onboarding@resend.dev>',
        to: RESEND_VERIFIED_EMAIL ?? data.email,
        subject: welcomeEmail.subject,
        html: welcomeEmail.html,
      })
      console.log(`[register] Welcome email sent to ${RESEND_VERIFIED_EMAIL ?? data.email}`)
    } catch (emailError) {
      console.error('[register] Failed to send welcome email:', emailError)
    }
  } else {
    console.warn('[register] Resend not configured, skipping welcome email')
  }

  if (resend) {
    try {
      const adminEmail = getAdminNotificationEmail({
        email: data.email,
        username: data.username,
        createdAt: user.createdAt!,
      })
      await resend.emails.send({
        from: 'MegDB Notifications <notifications@resend.dev>',
        to: 'vkkoder@gmail.com',
        subject: adminEmail.subject,
        html: adminEmail.html,
      })
      console.log('[register] Admin notification sent to vkkoder@gmail.com')
    } catch (emailError) {
      console.error('[register] Failed to send admin notification:', emailError)
    }
  } else {
    console.warn('[register] Resend not configured, skipping admin notification')
  }

  return { ok: true, user }
}

export async function loginUser(data: LoginUserInput): Promise<LoginUserResult> {
  const user = await queries.getUserByEmail(data.email)
  if (!user) {
    return { ok: false, reason: 'invalid_credentials' }
  }

  const isValidPassword = await Bun.password.verify(data.password, user.passwordHash)
  if (!isValidPassword) {
    return { ok: false, reason: 'invalid_credentials' }
  }

  const { passwordHash, ...publicUser } = user
  void passwordHash
  return { ok: true, user: publicUser }
}

export async function registerOAuthUser(input: OAuthUserInput): Promise<OAuthUserResult> {
  const existing = await queries.getUserByEmail(input.email)
  if (existing) {
    const { passwordHash, ...publicUser } = existing
    void passwordHash
    return { ok: true, user: publicUser }
  }

  const usernameSeed = normalizeUsernameSeed(input.email, input.name)
  const username = await generateUniqueUsername(usernameSeed)
  const passwordHash = await Bun.password.hash(
    `${input.provider}:${input.providerId}:${crypto.randomUUID()}`,
    { algorithm: 'bcrypt', cost: 10 }
  )

  const user = await mutations.insertUser({
    email: input.email,
    username,
    passwordHash,
    name: input.name?.trim() || username,
    role: 'user',
  })

  if (!user) {
    throw new Error('[registerOAuthUser] insert returned no row')
  }

  return { ok: true, user }
}
