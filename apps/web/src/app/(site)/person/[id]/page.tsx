import type { Metadata } from 'next'
import { cache, Suspense, type ReactNode } from 'react'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Share2 } from 'lucide-react'
import { PersonFilmographyStream } from '@/components/PersonFilmography/PersonFilmographyStream'
import { PersonPhotosRail } from '@/components/PersonPhotosRail/PersonPhotosRail'
import { MovieShareButton } from '@/components/MovieDetailPage/MovieShareButton'
import { WebPageJsonLd } from '@/components/WebPageJsonLd/WebPageJsonLd'
import { buildJsonLdPerson } from '@/lib/jsonLdPerson'
import { movieGenrePathById } from '@/lib/movieGenreRoute'
import { personCreditDetailPath } from '@/lib/personCredits'
import { getPersonCreditsCached, getPersonImagesCached } from '@/lib/personPageDataCache'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'
import { getImageUrl, getPersonPageData, type PersonPageDetail } from '@/lib/tmdb'
import { containsCyrillic } from '@/lib/textScript'
import { personPath, resolvePersonIdFromParam } from '@/lib/slug'
import styles from './page.module.css'

/** @sync `ROUTE_REVALIDATE_MEDIA_DETAIL` in `@/lib/cachePolicy` */
export const revalidate = 3600

type Props = { params: Promise<{ id: string }> }

const getPersonPageDataCached = cache(async (id: number) => getPersonPageData(id))
const GENRE_LABELS: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: "Kids'",
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
}

function formatDateLabel(input: string | null): string | null {
  if (!input) return null
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function extractYear(input: string | null): number | null {
  if (!input || input.length < 4) return null
  const y = Number(input.slice(0, 4))
  return Number.isFinite(y) ? y : null
}

function getReasonableCareerRange(
  years: number[],
  birthYear: number | null
): { start: number | null; end: number | null } {
  if (years.length === 0) return { start: null, end: null }
  const currentYear = new Date().getFullYear()
  const maxYear = currentYear + 2
  const minYear = birthYear != null ? birthYear + 8 : 1900
  const filtered = years.filter((y) => y >= minYear && y <= maxYear)
  if (filtered.length === 0) return { start: null, end: null }
  return { start: Math.min(...filtered), end: Math.max(...filtered) }
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

function getGenderLabel(gender: number | null): string | null {
  if (gender === 1) return 'Female'
  if (gender === 2) return 'Male'
  if (gender === 3) return 'Non-binary'
  return null
}

function getAgeLabel(birthday: string | null, deathday: string | null): string | null {
  if (!birthday) return null
  const birth = new Date(birthday).getTime()
  if (Number.isNaN(birth)) return null
  const end = deathday ? new Date(deathday).getTime() : Date.now()
  if (Number.isNaN(end) || end < birth) return null
  const years = Math.floor((end - birth) / (1000 * 60 * 60 * 24 * 365.25))
  return years > 0 ? `${years} years` : null
}

function getZodiacSignLabel(birthday: string | null): string | null {
  if (!birthday) return null
  const date = new Date(birthday)
  if (Number.isNaN(date.getTime())) return null
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  const signs = [
    { label: 'Capricorn', month: 1, day: 20 },
    { label: 'Aquarius', month: 2, day: 19 },
    { label: 'Pisces', month: 3, day: 21 },
    { label: 'Aries', month: 4, day: 20 },
    { label: 'Taurus', month: 5, day: 21 },
    { label: 'Gemini', month: 6, day: 21 },
    { label: 'Cancer', month: 7, day: 23 },
    { label: 'Leo', month: 8, day: 23 },
    { label: 'Virgo', month: 9, day: 23 },
    { label: 'Libra', month: 10, day: 23 },
    { label: 'Scorpio', month: 11, day: 22 },
    { label: 'Sagittarius', month: 12, day: 22 },
    { label: 'Capricorn', month: 12, day: 32 },
  ]
  const sign = signs.find((item) => month < item.month || (month === item.month && day < item.day))
  return sign?.label ?? null
}

function socialIcon(kind: 'facebook' | 'instagram' | 'youtube' | 'website'): ReactNode {
  if (kind === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" className={styles.socialSvg}>
        <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />
      </svg>
    )
  }
  if (kind === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" className={styles.socialSvg}>
        <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm8.5 1.8h-8.5A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Zm5.25-2a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z" />
      </svg>
    )
  }
  if (kind === 'youtube') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" className={styles.socialSvg}>
        <path d="M23.5 8.2a3 3 0 0 0-2.1-2.12C19.5 5.5 12 5.5 12 5.5s-7.5 0-9.4.58A3 3 0 0 0 .5 8.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 3.8 3 3 0 0 0 2.1 2.12c1.9.58 9.4.58 9.4.58s7.5 0 9.4-.58a3 3 0 0 0 2.1-2.12A31 31 0 0 0 24 12a31 31 0 0 0-.5-3.8ZM9.6 15.2V8.8L15.6 12l-6 3.2Z" />
      </svg>
    )
  }
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={styles.socialSvg}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  )
}

function leadDescription(person: PersonPageDetail, creditCount: number): string {
  const dept = person.knownForDepartment ? `${person.knownForDepartment}. ` : ''
  const bio = person.biography.trim()
  const creditLine = creditCount > 0 ? `Film and TV credits: ${creditCount}+ roles (TMDB). ` : ''
  if (bio && !containsCyrillic(bio)) {
    const short = bio.length > 320 ? `${bio.slice(0, 317)}…` : bio
    return `${creditLine}${dept}${short}`
  }
  return `${creditLine}${dept}Profile and filmography on MegDB — discovery powered by TMDB.`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: idStr } = await params
  const id = resolvePersonIdFromParam(idStr)
  if (id == null) {
    return {
      title: 'Person',
      description: 'People and credits on MegDB.',
      robots: { index: false, follow: true },
    }
  }
  const [data, credits] = await Promise.all([
    getPersonPageDataCached(id),
    getPersonCreditsCached(id),
  ])
  if (!data) {
    return {
      title: 'Not found',
      description: 'This person page is unavailable on MegDB.',
      robots: { index: false, follow: true },
    }
  }
  const canonicalPath = personPath(data.id, data.name)
  const description = leadDescription(data, credits.length)
  const ogImage = data.profilePath ? getImageUrl(data.profilePath, 'w780') : undefined
  const role = data.knownForDepartment ? data.knownForDepartment.toLowerCase() : 'person'
  const birthYear = extractYear(data.birthday)
  const titleSuffix = birthYear ? `${data.name} (${birthYear})` : data.name
  return {
    title: `${titleSuffix} — ${role === 'acting' ? 'Movies, TV Shows, Biography' : 'Biography & Credits'} | MegDB`,
    description: description.length > 155 ? `${description.slice(0, 152)}...` : description,
    alternates: discoverPageAlternates(canonicalPath),
    robots: { index: true, follow: true },
    ...discoverSocialMeta(data.name, description, canonicalPath, {
      ...(ogImage ? { images: [{ url: ogImage, width: 780, height: 1170, alt: data.name }] } : {}),
    }),
  }
}

export default async function PersonPage({ params }: Props) {
  const { id: idStr } = await params
  const id = resolvePersonIdFromParam(idStr)
  if (id == null) {
    notFound()
  }
  const data = await getPersonPageDataCached(id)
  if (!data) {
    notFound()
  }

  const canonicalPath = personPath(data.id, data.name)
  if (`/person/${idStr}` !== canonicalPath) {
    redirect(canonicalPath)
  }

  const [credits, personImages] = await Promise.all([
    getPersonCreditsCached(id),
    getPersonImagesCached(id),
  ])
  const description = leadDescription(data, credits.length)
  const personLd = buildJsonLdPerson(data, canonicalPath)
  const profileImage = data.profilePath ? getImageUrl(data.profilePath, 'w780') : null
  const bornLabel = formatDateLabel(data.birthday)
  const diedLabel = formatDateLabel(data.deathday)
  const ageLabel = getAgeLabel(data.birthday, data.deathday)
  const zodiacLabel = getZodiacSignLabel(data.birthday)
  const genderLabel = getGenderLabel(data.gender)
  const movieWorksCount = new Set(
    credits.filter((item) => item.kind === 'movie').map((item) => item.workId)
  ).size
  const tvWorksCount = new Set(
    credits.filter((item) => item.kind === 'tv').map((item) => item.workId)
  ).size
  const years = credits
    .map((item) => extractYear(item.releaseDate))
    .filter((item): item is number => item != null)
  const birthYear = extractYear(data.birthday)
  const careerRange = getReasonableCareerRange(years, birthYear)
  const firstKnownYear = careerRange.start
  const latestKnownYear = careerRange.end
  const biographyText = data.biography.trim()
  const yearsActive =
    firstKnownYear != null && latestKnownYear != null && latestKnownYear >= firstKnownYear
      ? `${latestKnownYear - firstKnownYear + 1} years`
      : null
  const knownAsList = data.alsoKnownAs.slice(0, 8)
  const genreCount = new Map<number, number>()
  for (const row of credits) {
    for (const genreId of row.genreIds) {
      genreCount.set(genreId, (genreCount.get(genreId) ?? 0) + 1)
    }
  }
  const topGenres = [...genreCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genreId]) => {
      const label = GENRE_LABELS[genreId]
      if (!label) return null
      const movieGenreHref = movieGenrePathById(String(genreId))
      return { label, href: movieGenreHref ?? `/search?q=${encodeURIComponent(label)}` }
    })
    .filter((item): item is { label: string; href: string } => item != null)
  const knownForItems = [
    ...new Map(
      credits
        .filter((item) => item.posterPath)
        .slice()
        .sort((a, b) => b.popularity - a.popularity)
        .map((item) => [`${item.kind}-${item.workId}`, item])
    ).values(),
  ].slice(0, 6)
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Who is ${data.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: biographyText || `${data.name} is listed on MegDB with filmography data from TMDB.`,
        },
      },
      {
        '@type': 'Question',
        name: `What is ${data.name} known for?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            knownForItems.length > 0
              ? knownForItems.map((item) => item.title).join(', ')
              : `${data.name} has credits across films and TV shows listed on this page.`,
        },
      },
      {
        '@type': 'Question',
        name: `Where can I find ${data.name}'s full credits?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Use the Known for & credits section below to browse all listed movie and TV credits.',
        },
      },
    ],
  }
  const hasAboutBlock = Boolean(
    data.biography ||
      bornLabel ||
      diedLabel ||
      data.placeOfBirth ||
      genderLabel ||
      ageLabel ||
      zodiacLabel ||
      data.knownForDepartment ||
      data.popularity != null ||
      knownAsList.length > 0 ||
      movieWorksCount > 0 ||
      tvWorksCount > 0
  )
  const hasExternalLinks = Boolean(data.imdbId || data.homepage)
  const hasLongBiography = biographyText.length > 520
  const personalFacts: Array<{ label: string; value: string }> = []
  const careerFacts: Array<{ label: string; value: string }> = []

  if (bornLabel) personalFacts.push({ label: 'Born', value: bornLabel })
  if (diedLabel) personalFacts.push({ label: 'Died', value: diedLabel })
  if (data.placeOfBirth) personalFacts.push({ label: 'Place of birth', value: data.placeOfBirth })
  if (ageLabel) personalFacts.push({ label: 'Age', value: ageLabel })
  if (zodiacLabel) personalFacts.push({ label: 'Zodiac', value: zodiacLabel })
  if (genderLabel) personalFacts.push({ label: 'Gender', value: genderLabel })

  if (movieWorksCount > 0)
    careerFacts.push({ label: 'Movies', value: formatInteger(movieWorksCount) })
  if (tvWorksCount > 0) careerFacts.push({ label: 'TV shows', value: formatInteger(tvWorksCount) })
  if (firstKnownYear != null)
    careerFacts.push({ label: 'Career start', value: String(firstKnownYear) })
  if (latestKnownYear != null)
    careerFacts.push({ label: 'Latest known work', value: String(latestKnownYear) })
  if (yearsActive) careerFacts.push({ label: 'Years active', value: yearsActive })
  careerFacts.push({ label: 'Total works', value: formatInteger(credits.length) })
  if (data.popularity != null)
    careerFacts.push({ label: 'TMDB popularity', value: data.popularity.toFixed(1) })
  const balancedFactsCount = Math.min(personalFacts.length, careerFacts.length)
  const personalFactsVisible = personalFacts.slice(0, balancedFactsCount)
  const careerFactsVisible = careerFacts.slice(0, balancedFactsCount)
  const socialLinks: Array<{ id: string; label: string; href: string; icon: ReactNode }> = []
  if (data.facebookId) {
    socialLinks.push({
      id: 'facebook',
      label: 'Facebook',
      href: `https://www.facebook.com/${data.facebookId}`,
      icon: socialIcon('facebook'),
    })
  }
  if (data.instagramId) {
    socialLinks.push({
      id: 'instagram',
      label: 'Instagram',
      href: `https://www.instagram.com/${data.instagramId}`,
      icon: socialIcon('instagram'),
    })
  }
  if (data.xId) {
    socialLinks.push({
      id: 'x',
      label: 'X',
      href: `https://x.com/${data.xId}`,
      icon: (
        <span className={styles.xMark} aria-hidden>
          X
        </span>
      ),
    })
  }
  if (data.youtubeId) {
    socialLinks.push({
      id: 'youtube',
      label: 'YouTube',
      href: `https://www.youtube.com/${data.youtubeId}`,
      icon: socialIcon('youtube'),
    })
  }
  if (data.tiktokId) {
    socialLinks.push({
      id: 'tiktok',
      label: 'TikTok',
      href: `https://www.tiktok.com/@${data.tiktokId}`,
      icon: (
        <span className={styles.xMark} aria-hidden>
          TT
        </span>
      ),
    })
  }
  if (data.homepage) {
    socialLinks.push({
      id: 'website',
      label: 'Website',
      href: data.homepage,
      icon: socialIcon('website'),
    })
  }
  if (data.imdbId) {
    socialLinks.push({
      id: 'imdb',
      label: 'IMDb',
      href: `https://www.imdb.com/name/${data.imdbId}/`,
      icon: (
        <span className={styles.imdbMark} aria-hidden>
          IMDb
        </span>
      ),
    })
  }
  const hasSocialLinks = socialLinks.length > 0
  const exploreLinks = [
    { href: `/search?q=${encodeURIComponent(data.name)}`, label: `Search "${data.name}"` },
    { href: '/movies', label: 'Browse movies' },
    { href: '/series', label: 'Browse series' },
    { href: '/categories', label: 'Explore categories' },
  ]

  return (
    <>
      <WebPageJsonLd pathname={canonicalPath} title={data.name} description={description} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <div className={styles.page}>
        <section className={`container ${styles.hero}`} aria-labelledby="person-overview-heading">
          <div className={styles.posterCol}>
            {profileImage ? (
              <div className={styles.posterFrame}>
                <Image
                  src={profileImage}
                  alt={`Portrait of ${data.name}`}
                  width={780}
                  height={1170}
                  className={styles.poster}
                  sizes="(max-width: 767px) 52vw, (max-width: 1023px) 32vw, 260px"
                  priority
                />
              </div>
            ) : (
              <div className={styles.posterFallback} aria-hidden>
                <span>{data.name.slice(0, 1)}</span>
              </div>
            )}
            <nav className={styles.personBreadcrumb} aria-label="Breadcrumb">
              <Link href="/" className={styles.personBreadcrumbItem}>
                Home
              </Link>
              <span className={styles.personBreadcrumbSep} aria-hidden>
                ›
              </span>
              <Link href="/person" className={styles.personBreadcrumbItem}>
                People
              </Link>
              <span className={styles.personBreadcrumbSep} aria-hidden>
                ›
              </span>
              <span className={styles.personBreadcrumbCurrent} aria-current="page">
                {data.name}
              </span>
            </nav>
          </div>
          <div className={styles.contentCol}>
            <div className={styles.titleRow}>
              <h2 id="person-overview-heading" className={styles.overviewTitle}>
                {data.name}
              </h2>
              {data.knownForDepartment ? (
                <span className={styles.departmentBadge}>{data.knownForDepartment}</span>
              ) : null}
            </div>
            {hasAboutBlock ? (
              <div className={styles.factsColumns}>
                <section className={styles.factsGroup} aria-label="Personal details">
                  <h3 className={styles.factsGroupTitle}>Personal</h3>
                  <dl className={styles.factsList}>
                    {personalFactsVisible.map((item) => (
                      <div key={item.label} className={styles.factRow}>
                        <dt className={styles.factLabel}>{item.label}</dt>
                        <dd className={styles.factValue}>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
                <section className={styles.factsGroup} aria-label="Career details">
                  <h3 className={styles.factsGroupTitle}>Career</h3>
                  <dl className={styles.factsList}>
                    {careerFactsVisible.map((item) => (
                      <div key={item.label} className={styles.factRow}>
                        <dt className={styles.factLabel}>{item.label}</dt>
                        <dd className={styles.factValue}>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              </div>
            ) : null}
            {biographyText ? (
              hasLongBiography ? (
                <div className={styles.biographyDetails}>
                  <p className={styles.biographyPreview}>{biographyText}</p>
                  <details className={styles.biographyExpand}>
                    <summary className={styles.biographyToggle} aria-label="Toggle full biography">
                      <span className={styles.biographyToggleMore}>Read more</span>
                      <span className={styles.biographyToggleLess}>Show less</span>
                    </summary>
                    <p className={styles.biographyFull}>{biographyText}</p>
                  </details>
                </div>
              ) : (
                <p className={styles.biography}>{biographyText}</p>
              )
            ) : (
              <p className={styles.biographyMuted}>
                Biography is not available for this profile yet. Filmography is listed below.
              </p>
            )}
            {hasSocialLinks || hasExternalLinks ? (
              <div className={styles.linksRow} aria-label="External social links">
                {hasSocialLinks
                  ? socialLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.socialLink}
                        aria-label={link.label}
                        title={link.label}
                      >
                        {link.icon}
                      </a>
                    ))
                  : null}
                <MovieShareButton
                  title={`${data.name} — profile on MegDB`}
                  className={styles.shareButton}
                  unstyled
                  icon={<Share2 aria-hidden size={16} />}
                  iconOnly
                />
                <span className={styles.shareLabel}>Share profile</span>
              </div>
            ) : null}
            {!hasSocialLinks ? (
              <p className={styles.sectionHint}>No official social links available.</p>
            ) : null}
            {knownAsList.length > 0 ? (
              <div className={styles.aliasesBlock}>
                <p className={styles.aliasesLabel}>Also known as</p>
                <ul className={styles.aliasesList}>
                  {knownAsList.map((alias) => (
                    <li key={alias} className={styles.aliasItem}>
                      {alias}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className={styles.sectionHint}>No alternative names listed.</p>
            )}
            {topGenres.length > 0 ? (
              <div className={styles.aliasesBlock}>
                <p className={styles.aliasesLabel}>Top genres</p>
                <ul className={styles.aliasesList}>
                  {topGenres.map((genre) => (
                    <li key={genre.label}>
                      <Link href={genre.href} className={styles.aliasLink}>
                        {genre.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className={styles.sectionHint}>Not enough data to infer top genres.</p>
            )}
            {knownForItems.length > 0 ? (
              <div className={styles.knownForBlock}>
                <p className={styles.aliasesLabel}>Known for</p>
                <div className={styles.knownForGrid}>
                  {knownForItems.map((item) => {
                    const href = personCreditDetailPath(item)
                    const poster = getImageUrl(item.posterPath, 'w342')
                    const year = item.releaseDate?.slice(0, 4) ?? null
                    return (
                      <Link
                        key={`${item.kind}-${item.workId}-${item.title}`}
                        href={href}
                        className={styles.knownForCard}
                      >
                        <Image
                          src={poster}
                          alt={item.title}
                          width={342}
                          height={513}
                          className={styles.knownForPoster}
                          sizes="(max-width: 767px) 28vw, 120px"
                        />
                        <span className={styles.knownForTitle}>{item.title}</span>
                        <span className={styles.knownForMeta}>
                          {item.kind === 'movie' ? 'Movie' : 'TV'}
                          {year ? ` • ${year}` : ''}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ) : null}
            <div className={styles.aliasesBlock}>
              <p className={styles.aliasesLabel}>Explore more</p>
              <ul className={styles.aliasesList}>
                {exploreLinks.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={styles.aliasLink}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
        <div className={`container ${styles.filmographyWrap}`}>
          <PersonPhotosRail personName={data.name} images={personImages} />
          <Suspense fallback={<div className={styles.filmographyStreamFallback} aria-hidden />}>
            <PersonFilmographyStream personId={id} />
          </Suspense>
        </div>
      </div>
    </>
  )
}
