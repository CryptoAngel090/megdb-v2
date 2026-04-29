import { db, eq } from '@repo/db'
import { users } from '@repo/db/schema'

const userRow = {
  id: users.id,
  email: users.email,
  username: users.username,
  name: users.name,
  avatarUrl: users.avatarUrl,
  role: users.role,
  passwordHash: users.passwordHash,
  createdAt: users.createdAt,
} as const

export async function getUserByEmail(email: string) {
  const rows = await db.select(userRow).from(users).where(eq(users.email, email)).limit(1)
  return rows[0]
}

export async function getUserIdByUsername(username: string) {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1)
  return rows[0]?.id
}
