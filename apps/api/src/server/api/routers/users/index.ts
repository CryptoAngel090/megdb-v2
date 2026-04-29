import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { publicProcedure, router } from '../../../trpc'
import { loginUser, registerUser } from './service'

const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const userRouter = router({
  register: publicProcedure.input(registerSchema).mutation(async ({ input }) => {
    const result = await registerUser(input)

    if (!result.ok) {
      if (result.reason === 'email_taken') {
        throw new TRPCError({ code: 'CONFLICT', message: 'Email already registered' })
      }

      throw new TRPCError({ code: 'CONFLICT', message: 'Username already taken' })
    }

    return { user: result.user }
  }),
  login: publicProcedure.input(loginSchema).mutation(async ({ input }) => {
    const result = await loginUser(input)

    if (!result.ok) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid email or password' })
    }

    return { user: result.user }
  }),
})
