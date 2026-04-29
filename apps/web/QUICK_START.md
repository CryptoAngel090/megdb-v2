# Quick Start - OAuth Authentication

## ✅ What's Done

1. ✅ NextAuth.js installed and configured
2. ✅ Google OAuth provider added
3. ✅ GitHub OAuth provider added
4. ✅ OAuth buttons connected on registration page
5. ✅ SessionProvider added to app layout
6. ✅ API routes created for authentication

## 🚀 How to Enable OAuth

### Step 1: Copy environment file
```bash
cp .env.example .env.local
```

### Step 2: Generate NextAuth secret
```bash
openssl rand -base64 32
```
Copy the output and add to `.env.local`:
```
NEXTAUTH_SECRET=paste_generated_secret_here
```

### Step 3: Set up Google OAuth (5 minutes)

1. Go to https://console.cloud.google.com/
2. Create project → Enable Google+ API
3. Credentials → Create OAuth 2.0 Client ID
4. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Secret to `.env.local`

### Step 4: Set up GitHub OAuth (3 minutes)

1. Go to https://github.com/settings/developers
2. New OAuth App
3. Callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Secret to `.env.local`

### Step 5: Restart dev server
```bash
pnpm dev
```

## 🎉 Test It

1. Go to http://localhost:3000/register
2. Click **Google** or **GitHub** button
3. You'll be redirected to OAuth provider
4. After login, you'll be back at `/profile`

## 📖 Full Documentation

See [OAUTH_SETUP.md](./OAUTH_SETUP.md) for detailed instructions.

## ⚠️ Important Notes

- OAuth buttons will show an error if credentials are not configured
- For production, update redirect URIs to your domain
- Never commit `.env.local` to git
- Backend needs to handle OAuth endpoint at `/api/auth/oauth`
