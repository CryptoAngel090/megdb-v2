import { router } from '../trpc'
import { movieRouter } from './routers/movies'
import { userRouter } from './routers/users'

export const appRouter = router({
  users: userRouter,
  movies: movieRouter,
})
