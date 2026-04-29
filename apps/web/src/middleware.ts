import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const requestHeaders = new Headers(request.headers)
  const nonce = btoa(crypto.randomUUID())
  const hostname = request.nextUrl.hostname
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
  const connectSources = isLocalhost
    ? [
        "'self'",
        'https:',
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        'ws://localhost:3000',
        'ws://127.0.0.1:3000',
        'ws://localhost:3100',
        'ws://127.0.0.1:3100',
      ]
    : ["'self'", 'https:']
  const csp = [
    "default-src 'self'",
    // Temporary compatibility mode: Next runtime still injects inline scripts.
    // Keep nonce for controlled script tags, but also allow inline scripts to
    // prevent shell breakage while we harden CSP incrementally.
    `script-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
    // Keep style CSP compatibility for runtime style attributes.
    // When nonce is present, browsers ignore 'unsafe-inline' for style-src.
    `style-src 'self' 'unsafe-inline'`,
    `connect-src ${connectSources.join(' ')}`,
    "img-src 'self' data: https: blob:",
    "font-src 'self'",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
    "child-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
    "frame-ancestors 'none'",
    ...(isLocalhost ? [] : ['upgrade-insecure-requests']),
  ].join('; ')
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  const isHtmlPageRequest =
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next/static') &&
    !pathname.startsWith('/images/') &&
    pathname !== '/sw.js' &&
    pathname !== '/favicon.ico' &&
    pathname !== '/manifest.webmanifest'

  if (isHtmlPageRequest) {
    response.headers.set(
      'Cache-Control',
      isLocalhost ? 'no-store, max-age=0' : 'public, s-maxage=300, stale-while-revalidate=600'
    )
  }

  return response
}

export const config = {
  matcher: '/:path*',
}
