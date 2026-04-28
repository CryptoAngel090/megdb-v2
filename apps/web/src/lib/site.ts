/**
 * Site URL for canonical links and JSON-LD. Override per deploy with NEXT_PUBLIC_SITE_URL.
 */
const DEFAULT_SITE_URL = 'https://megdb.com'

function normalizeSiteUrl(raw: string | undefined): string {
  const candidate = (raw || DEFAULT_SITE_URL).trim()
  try {
    const url = new URL(candidate)
    return url.toString().replace(/\/$/, '')
  } catch {
    return DEFAULT_SITE_URL
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)
