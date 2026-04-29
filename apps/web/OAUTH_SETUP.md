# OAuth Setup Guide

This guide will help you set up Google and GitHub OAuth authentication for the registration page.

## Prerequisites

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Generate a NextAuth secret:
   ```bash
   openssl rand -base64 32
   ```
   Add it to `.env.local` as `NEXTAUTH_SECRET`

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen:
   - Application name: MegDB
   - Authorized domains: `localhost` (for development)
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Copy the **Client ID** and **Client Secret** to `.env.local`:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

## GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the details:
   - Application name: MegDB
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Click **Register application**
5. Copy the **Client ID**
6. Generate a new **Client Secret**
7. Add them to `.env.local`:
   ```
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   ```

## Production Setup

For production, update the URLs:

### Google
- Authorized JavaScript origins: `https://yourdomain.com`
- Authorized redirect URIs: `https://yourdomain.com/api/auth/callback/google`

### GitHub
- Homepage URL: `https://yourdomain.com`
- Authorization callback URL: `https://yourdomain.com/api/auth/callback/github`

### Environment Variables
Update `.env.local` (or your production environment):
```
NEXTAUTH_URL=https://yourdomain.com
```

## Testing

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Navigate to `/register`

3. Click on **Google** or **GitHub** button

4. You should be redirected to the OAuth provider's login page

5. After successful authentication, you'll be redirected back to `/profile`

## Backend Integration

Your backend needs to handle OAuth users. Create an endpoint at `/api/auth/oauth` that accepts:

```json
{
  "provider": "google" | "github",
  "providerId": "string",
  "email": "string",
  "name": "string",
  "image": "string"
}
```

The endpoint should:
1. Check if user exists by email or providerId
2. Create new user if doesn't exist
3. Link OAuth account to existing user if email matches
4. Return user data

## Troubleshooting

### "Redirect URI mismatch" error
- Make sure the redirect URI in your OAuth app settings exactly matches: `http://localhost:3000/api/auth/callback/google` or `/github`
- Check that `NEXTAUTH_URL` in `.env.local` is correct

### "Invalid client" error
- Verify your Client ID and Client Secret are correct
- Make sure there are no extra spaces in `.env.local`

### OAuth button does nothing
- Check browser console for errors
- Verify NextAuth API route is working: visit `http://localhost:3000/api/auth/providers`
- Make sure you've restarted the dev server after adding environment variables

## Security Notes

- Never commit `.env.local` to version control
- Use different OAuth apps for development and production
- Rotate secrets regularly
- Enable 2FA on your Google and GitHub accounts
