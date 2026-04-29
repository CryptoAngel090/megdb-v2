import type { MovieBackdropStill, MoviePageDetail, MoviePageDetailTailPatch } from './tmdb.types'

const HERO_DETAIL_BACKDROP_MAX = 10

export type TmdbBackdropImageRow = {
  file_path?: string | null
  vote_average?: number
  width?: number
  height?: number
}

export function pickHeroBackdropStillsForShell(
  rows: TmdbBackdropImageRow[] | undefined,
  preferredFilePath: string | null | undefined
): MovieBackdropStill[] {
  const normalized = (rows ?? [])
    .map((b) => ({
      filePath: (b.file_path ?? '').trim(),
      width: typeof b.width === 'number' && b.width > 0 ? b.width : 1280,
      height: typeof b.height === 'number' && b.height > 0 ? b.height : 720,
      vote: typeof b.vote_average === 'number' ? b.vote_average : 0,
    }))
    .filter((b) => b.filePath.length > 0)
    .sort((a, b) => b.vote - a.vote)

  const seen = new Set<string>()
  const out: MovieBackdropStill[] = []
  const push = (filePath: string, width: number, height: number) => {
    if (!filePath || seen.has(filePath)) return
    seen.add(filePath)
    out.push({ filePath, width, height })
  }

  const pref = preferredFilePath?.trim()
  if (pref) {
    const hit = normalized.find((r) => r.filePath === pref)
    push(pref, hit?.width ?? 1280, hit?.height ?? 720)
  }
  for (const r of normalized) {
    if (out.length >= HERO_DETAIL_BACKDROP_MAX) break
    push(r.filePath, r.width, r.height)
  }
  return out
}

export function mergeMovieDetailShellAndTail(
  shell: MoviePageDetail,
  tail: MoviePageDetailTailPatch
): MoviePageDetail {
  const { belongsToCollectionMeta: shellMeta, ...shellBase } = shell
  return {
    ...shellBase,
    similar: tail.similar,
    collection: tail.collection,
    backdropGallery: tail.backdropGallery,
    ...(tail.collection == null && shellMeta != null ? { belongsToCollectionMeta: shellMeta } : {}),
  }
}
