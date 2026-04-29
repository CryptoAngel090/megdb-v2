import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema/index.js'

export { and, eq, sql } from 'drizzle-orm'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })

export type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
export * from './schema/index.js'
