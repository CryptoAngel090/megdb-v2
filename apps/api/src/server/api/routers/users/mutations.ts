import { db } from '@repo/db'
import { users } from '@repo/db/schema'

interface InsertUserValues {
  email: string
  username: string
  passwordHash: string
  name: string
  role: 'user' | 'admin'
}

export async function insertUser(values: InsertUserValues) {
  const [row] = await db
    .insert(users)
    .values({
      email: values.email,
      username: values.username,
      passwordHash: values.passwordHash,
      name: values.name,
      role: values.role,
    })
    .returning({
      id: users.id,
      email: users.email,
      username: users.username,
      name: users.name,
      avatarUrl: users.avatarUrl,
      role: users.role,
      createdAt: users.createdAt,
    })

  return row
}
