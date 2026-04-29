import { db } from '@repo/db'

export const createTRPCContext = () => {
  return {
    db,
    // Later: user: getAuth(req)
  }
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>
