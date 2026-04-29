import { containsCyrillic } from '@/lib/textScript'
import type { MoviePageDetail } from '@/lib/tmdb'

export function formatRuntimeMinutes(total: number): string {
  if (total < 60) return `${total}m`
  const h = Math.floor(total / 60)
  const m = total % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

/** rule 53: сокращение числа голосов — 128456 → 128K */
export function formatVoteCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(n)
}

interface BuildVisibleFaqInput {
  movie: MoviePageDetail
  displayOverview: string | null
  isTvLike: boolean
  yearLabel: string | null
  releaseDateFull: string | null
  runtimeLabel: string | null
  topCastNames: string
  topProviderNames: string
  collectionName: string | null
}

export function buildVisibleFaq({
  movie,
  displayOverview,
  isTvLike,
  yearLabel,
  releaseDateFull,
  runtimeLabel,
  topCastNames,
  topProviderNames,
  collectionName,
}: BuildVisibleFaqInput): Array<{ question: string; answer: string }> {
  const genreNames = movie.genres.map((g) => g.name).join(', ')

  return [
    {
      question: `Where can I watch ${movie.title}?`,
      answer:
        topProviderNames.length > 0
          ? `${movie.title}${yearLabel ? ` (${yearLabel})` : ''} is currently available on ${topProviderNames}. You can also find rental and purchase options in the "Where to Watch" section. Availability depends on your region and may change over time.`
          : `${movie.title}${yearLabel ? ` (${yearLabel})` : ''} streaming availability varies by region. Check the provider table for the latest streaming, rental, and purchase options.`,
    },
    ...(displayOverview
      ? [
          {
            question: `What is ${movie.title} about?`,
            answer: displayOverview,
          },
        ]
      : []),
    ...(movie.director
      ? [
          {
            question: `Who directed ${movie.title}?`,
            answer: `${movie.title} was directed by ${movie.director.name}.`,
          },
        ]
      : []),
    ...(topCastNames
      ? [
          {
            question: `Who are the key cast members in ${movie.title}?`,
            answer: `Key cast members include ${topCastNames}.`,
          },
        ]
      : []),
    ...(releaseDateFull || runtimeLabel || movie.status
      ? [
          {
            question: `When was ${movie.title} released and what is the runtime?`,
            answer:
              `${releaseDateFull ? `Release date: ${releaseDateFull}. ` : ''}${runtimeLabel ? `Runtime: ${runtimeLabel}. ` : ''}${movie.status ? `Current status: ${movie.status}.` : ''}`.trim(),
          },
        ]
      : []),
    ...(genreNames || movie.productionCountries[0] || movie.originalLanguage
      ? [
          {
            question: `What genre is ${movie.title}?`,
            answer:
              `${genreNames ? `Genres: ${genreNames}. ` : ''}${movie.productionCountries[0] ? `Country: ${movie.productionCountries[0].name}. ` : ''}${movie.originalLanguage ? `Original language: ${movie.originalLanguage.toUpperCase()}.` : ''}`.trim(),
          },
        ]
      : []),
    ...(movie.ageRatingBadge
      ? [
          {
            question: `What is the age rating of ${movie.title}?`,
            answer: `${movie.title} is rated ${movie.ageRatingBadge}.`,
          },
        ]
      : []),
    ...(isTvLike
      ? [
          {
            question: `Do I need to watch earlier episodes before ${movie.title}?`,
            answer: 'For full context, start from season 1, episode 1.',
          },
        ]
      : [
          {
            question: `Is ${movie.title} part of a collection?`,
            answer: collectionName
              ? `${movie.title} is part of the "${collectionName}" collection.`
              : `${movie.title} is presented as a standalone title.`,
          },
        ]),
    ...(movie.voteAverage > 0
      ? [
          {
            question: `What is the TMDB rating of ${movie.title}?`,
            answer: `${movie.title} has a TMDB score of ${movie.voteAverage.toFixed(1)}/10${movie.voteCount > 0 ? ` based on ${formatVoteCount(movie.voteCount)} votes` : ''}.`,
          },
        ]
      : []),
  ]
}

export function getDisplayOverview(overview: string): string | null {
  const normalized = overview.trim()
  if (!normalized) return null
  return containsCyrillic(normalized) ? null : normalized
}
