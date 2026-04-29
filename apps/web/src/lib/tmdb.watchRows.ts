import type {
  MovieWatchProviderItem,
  MovieWatchProviderRow,
  MovieWatchProvidersUs,
  TmdbWatchCountry,
  TmdbWatchProviderRef,
} from './tmdb.types'

const PROVIDER_QUALITY: Record<number, string> = {
  8: '4K HDR',
  1796: '4K HDR',
  9: '4K HDR',
  10: '4K HDR',
  119: '4K HDR',
  2100: '4K HDR',
  337: '4K HDR',
  384: '4K HDR',
  1899: '4K HDR',
  2: '4K HDR',
  350: '4K HDR',
  300: '4K HDR',
  15: 'Full HD',
  531: 'Full HD',
  386: 'HD',
  387: 'HD',
  283: 'HD',
  73: 'HD',
  192: 'HD',
  538: 'HD',
}

export function buildWatchRows(us: TmdbWatchCountry | undefined): MovieWatchProviderRow[] {
  if (!us) return []
  const rows: MovieWatchProviderRow[] = []
  for (const p of us.flatrate ?? []) {
    rows.push({
      providerId: p.provider_id,
      name: p.provider_name,
      logoPath: p.logo_path ?? null,
      type: 'Stream',
      quality: PROVIDER_QUALITY[p.provider_id] ?? 'HD',
    })
  }
  for (const p of us.free ?? []) {
    rows.push({
      providerId: p.provider_id,
      name: p.provider_name,
      logoPath: p.logo_path ?? null,
      type: 'Free',
      quality: PROVIDER_QUALITY[p.provider_id] ?? 'HD',
    })
  }
  for (const p of us.rent ?? []) {
    rows.push({
      providerId: p.provider_id,
      name: p.provider_name,
      logoPath: p.logo_path ?? null,
      type: 'Rent',
      quality: PROVIDER_QUALITY[p.provider_id] ?? 'HD',
    })
  }
  for (const p of us.buy ?? []) {
    rows.push({
      providerId: p.provider_id,
      name: p.provider_name,
      logoPath: p.logo_path ?? null,
      type: 'Buy',
      quality: PROVIDER_QUALITY[p.provider_id] ?? 'HD',
    })
  }
  return rows.slice(0, 8)
}

function mapProviderRef(p: TmdbWatchProviderRef): MovieWatchProviderItem {
  return {
    providerId: p.provider_id,
    providerName: p.provider_name,
    logoPath: p.logo_path ?? null,
  }
}

export function buildWatchProvidersUs(us: TmdbWatchCountry | undefined): MovieWatchProvidersUs | null {
  if (!us) return null
  const seen = new Set<number>()
  const stream: MovieWatchProviderItem[] = []
  for (const p of [...(us.flatrate ?? []), ...(us.free ?? [])]) {
    if (seen.has(p.provider_id)) continue
    seen.add(p.provider_id)
    stream.push(mapProviderRef(p))
  }
  const rent = (us.rent ?? []).map(mapProviderRef)
  const buy = (us.buy ?? []).map(mapProviderRef)
  const hasAny = stream.length > 0 || rent.length > 0 || buy.length > 0
  if (!hasAny) return null
  return {
    link: us.link?.trim() ? us.link.trim() : null,
    stream,
    rent,
    buy,
  }
}
