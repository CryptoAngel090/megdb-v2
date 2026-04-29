import type { MetadataRoute } from 'next'

export function chunkSitemapEntries(
  entries: MetadataRoute.Sitemap,
  chunkSize: number
): MetadataRoute.Sitemap[] {
  const safeChunkSize = Number.isFinite(chunkSize) ? Math.max(1, Math.floor(chunkSize)) : 5000
  if (entries.length === 0) return [[]]
  const chunks: MetadataRoute.Sitemap[] = []
  for (let i = 0; i < entries.length; i += safeChunkSize) {
    chunks.push(entries.slice(i, i + safeChunkSize))
  }
  return chunks
}

export function toSitemapIds(totalChunks: number): Array<{ id: number }> {
  const safeTotal = Number.isFinite(totalChunks) ? Math.max(1, Math.floor(totalChunks)) : 1
  return Array.from({ length: safeTotal }, (_, id) => ({ id }))
}
