/** Cyrillic Unicode block (e.g. Russian) — English UI skips these strings from TMDB when they slip through. */
const CYRILLIC_RE = /[\u0400-\u04FF]/

export function containsCyrillic(text: string): boolean {
  return CYRILLIC_RE.test(text)
}
