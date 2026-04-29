const SW_VERSION = 'v1'

const CACHE_DOCS = `megdb-docs-${SW_VERSION}`
const CACHE_STATIC = `megdb-static-${SW_VERSION}`
const CACHE_API_MOVIES = `megdb-api-movies-${SW_VERSION}`
const CACHE_POSTERS = `megdb-posters-${SW_VERSION}`

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const POSTER_META_PREFIX = 'poster-meta:'

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const expectedCaches = new Set([CACHE_DOCS, CACHE_STATIC, CACHE_API_MOVIES, CACHE_POSTERS])
      const names = await caches.keys()
      await Promise.all(names.map((name) => (expectedCaches.has(name) ? null : caches.delete(name))))
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Documents -> Network First (fresh HTML)
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request, CACHE_DOCS))
    return
  }

  // Posters -> Cache First + TTL 30 days
  if (isPosterRequest(url, request)) {
    event.respondWith(cacheFirstPosterWithTtl(request))
    return
  }

  // API /movies -> Stale While Revalidate
  if (isMoviesApiRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_API_MOVIES, event))
    return
  }

  // Static assets -> Cache First (JS/CSS/fonts/images)
  if (isStaticRequest(url, request)) {
    event.respondWith(cacheFirst(request, CACHE_STATIC))
  }
})

function isMoviesApiRequest(url) {
  return url.origin === self.location.origin && url.pathname.startsWith('/api/movies')
}

function isPosterRequest(url, request) {
  if (request.destination === 'image' && url.origin === 'https://image.tmdb.org') return true
  return (
    url.origin === 'https://image.tmdb.org' &&
    url.pathname.includes('/t/p/') &&
    (url.pathname.includes('/w') || url.pathname.includes('/original'))
  )
}

function isStaticRequest(url, request) {
  if (url.origin !== self.location.origin) return false

  if (url.pathname.startsWith('/_next/static/')) return true

  return (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image'
  )
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const fresh = await fetch(request)
    if (fresh.ok) {
      await cache.put(request, fresh.clone())
    }
    return fresh
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    throw new Error('[sw] network first failed and no cache')
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached

  const fresh = await fetch(request)
  if (fresh.ok) {
    await cache.put(request, fresh.clone())
  }
  return fresh
}

async function staleWhileRevalidate(request, cacheName, event) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const revalidateTask = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => null)

  if (cached) {
    event.waitUntil(revalidateTask)
    return cached
  }

  const fresh = await revalidateTask
  if (fresh) return fresh
  throw new Error('[sw] stale-while-revalidate failed and no cache')
}

async function cacheFirstPosterWithTtl(request) {
  const cache = await caches.open(CACHE_POSTERS)
  const now = Date.now()
  const metaKey = `${POSTER_META_PREFIX}${request.url}`

  const [cachedImage, metaResponse] = await Promise.all([
    cache.match(request),
    cache.match(metaKey),
  ])

  if (cachedImage && metaResponse) {
    const cachedAt = Number(await metaResponse.text())
    if (Number.isFinite(cachedAt) && now - cachedAt <= THIRTY_DAYS_MS) {
      return cachedImage
    }
    await Promise.all([cache.delete(request), cache.delete(metaKey)])
  }

  const fresh = await fetch(request)
  if (fresh.ok) {
    await Promise.all([
      cache.put(request, fresh.clone()),
      cache.put(metaKey, new Response(String(now))),
    ])
  }
  return fresh
}
