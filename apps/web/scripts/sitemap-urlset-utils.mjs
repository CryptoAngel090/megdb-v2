function parseLocs(xml) {
  const locRe = /<loc>\s*([^<\s]+)\s*<\/loc>/gim
  const out = []
  let m
  while ((m = locRe.exec(xml)) != null) {
    if (m[1]) out.push(m[1].trim())
  }
  return out
}

function withTimeoutSignal(timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return { controller, timer }
}

async function fetchText(url, timeoutMs, userAgent) {
  const { controller, timer } = withTimeoutSignal(timeoutMs)
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': userAgent },
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`)
    return await res.text()
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms for ${url}`)
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchSitemapUrlsetUrls(options) {
  const {
    sitemapUrl,
    timeoutMs = 15000,
    maxUrls = 50000,
    maxSitemaps = 50,
    userAgent = 'megdb-sitemap-parser/1.0',
  } = options

  const toVisit = [sitemapUrl]
  const visited = new Set()
  const urls = []

  while (toVisit.length > 0) {
    const current = toVisit.shift()
    if (!current || visited.has(current)) continue
    visited.add(current)
    if (visited.size > maxSitemaps) break

    const xml = await fetchText(current, timeoutMs, userAgent)
    const locs = parseLocs(xml)
    const isSitemapIndex = /<sitemapindex[\s>]/i.test(xml)

    for (const loc of locs) {
      if (isSitemapIndex) {
        toVisit.push(loc)
        continue
      }
      urls.push(loc)
      if (urls.length >= maxUrls) break
    }
    if (urls.length >= maxUrls) break
  }

  return Array.from(new Set(urls))
}
