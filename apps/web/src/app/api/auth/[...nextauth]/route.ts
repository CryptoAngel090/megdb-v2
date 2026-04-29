import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'

interface LoginResponse {
  data?: {
    user?: {
      id?: string
      email?: string
      username?: string
    }
  }
}

function isLoginResponse(value: unknown): value is LoginResponse {
  return value !== null && typeof value === 'object'
}

function getApiUrl(): string {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
}

function getGoogleClientId(): string {
  return process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
}

function getGithubClientId(): string {
  return process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || ''
}

// NextAuth's factory typing resolves to `any` in this setup.
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: getGoogleClientId(),
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: getGithubClientId(),
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const apiUrl = getApiUrl()
          const response = await fetch(`${apiUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          const data: unknown = await response.json()

          if (!response.ok) {
            return null
          }

          if (!isLoginResponse(data)) {
            return null
          }

          const user = data.data?.user
          if (!user?.id || !user.email || !user.username) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.username,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      // Handle OAuth sign in
      if (account?.provider === 'google' || account?.provider === 'github') {
        if (!user.email) {
          console.error('OAuth profile has no email, skipping backend sync')
          return true
        }

        try {
          const apiUrl = getApiUrl()

          // Send OAuth user data to your backend
          const response = await fetch(`${apiUrl}/api/auth/oauth`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              provider: account.provider,
              providerId: account.providerAccountId,
              email: user.email,
              name: user.name,
              image: user.image,
            }),
          })

          if (!response.ok) {
            console.error('OAuth backend sync failed, allowing login')
            return true
          }

          return true
        } catch (error) {
          console.error('OAuth sync error, allowing login:', error)
          return true
        }
      }

      return true
    },
    jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      }
      if (account) {
        token.provider = account.provider
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? ''
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
  ...(process.env.NEXTAUTH_SECRET ? { secret: process.env.NEXTAUTH_SECRET } : {}),
})

export { handler as GET, handler as POST }
