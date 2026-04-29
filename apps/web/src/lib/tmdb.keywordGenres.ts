import { GENRE_NAMES } from './tmdb.constants'

const KEYWORD_SKIP = /^(based on|sequel|prequel|spin-?off|remake|part \d)/i
const KEYWORD_META =
  /(stinger|imdb|reference to|after credits|during credits|aftercredits|duringcredits)/i

export function matchGenreLabelsFromKeywordResults(
  results: { name: string }[] | undefined,
  genres: string[]
): string[] {
  if (genres.length >= 2) return genres.slice(0, 2)
  const have = new Set(genres.map((g) => g.trim().toLowerCase()).filter(Boolean))
  const genreLabels = Object.values(GENRE_NAMES)

  for (const { name } of results ?? []) {
    const raw = name.trim()
    if (!raw || KEYWORD_SKIP.test(raw)) continue
    const k = raw.toLowerCase()
    for (const label of genreLabels) {
      const gl = label.toLowerCase()
      if (gl.length < 3) continue
      if (gl === k && !have.has(gl)) {
        have.add(gl)
        return [...genres, label].slice(0, 2)
      }
    }
  }
  for (const { name } of results ?? []) {
    const raw = name.trim()
    if (!raw || KEYWORD_SKIP.test(raw)) continue
    const k = raw.toLowerCase()
    for (const label of genreLabels) {
      const gl = label.toLowerCase()
      if (gl.length < 4) continue
      if (k.includes(gl) && !have.has(gl)) {
        return [...genres, label].slice(0, 2)
      }
    }
  }
  return genres.slice(0, 2)
}

export function pickThematicKeywordLabel(
  results: { name: string }[] | undefined,
  primaryGenre: string
): string | null {
  const p = primaryGenre.trim().toLowerCase()
  for (const { name } of results ?? []) {
    let raw = name.trim()
    if (!raw || KEYWORD_SKIP.test(raw) || KEYWORD_META.test(raw)) continue
    raw = raw.split(',')[0]!.trim()
    if (raw.length < 3 || raw.length > 28) continue
    const low = raw.toLowerCase()
    if (low === p) continue
    if (p.length >= 4 && (low === `${p} movie` || low === `${p} film` || low === `${p} series`))
      continue
    const words = raw.split(/\s+/).slice(0, 4).join(' ')
    if (words.length < 3) continue
    return words
  }
  return null
}
