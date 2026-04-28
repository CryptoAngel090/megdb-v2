import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import type { MovieWatchProvidersUs } from '@/lib/tmdb'
import { buildWatchProviderUrl, getImageUrl } from '@/lib/tmdb'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import styles from './MovieWatchProvidersPanel.module.css'

function ProviderLink({
  providerId,
  movieTitle,
  name,
  logoPath,
  fallbackUrl,
}: {
  providerId: number
  movieTitle: string
  name: string
  logoPath: string | null
  fallbackUrl: string
}) {
  const logoUrl = logoPath ? getImageUrl(logoPath, 'w92') : ''
  const href = buildWatchProviderUrl(providerId, name, movieTitle, fallbackUrl)
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.link}
      title={`Open ${name}`}
    >
      <div className={styles.logo}>
        {logoUrl ? (
          <Image src={logoUrl} alt="" width={24} height={24} className={styles.logoImg} />
        ) : (
          <span className={styles.logoFallback}>{name.charAt(0)}</span>
        )}
      </div>
      <span className={styles.name}>{name}</span>
      <ExternalLink className={[iconSlot.block, iconSlot.inline12, styles.ext].filter(Boolean).join(' ')} aria-hidden />
    </a>
  )
}

type Props = {
  providers: MovieWatchProvidersUs
  movieTitle: string
  className?: string | undefined
}

export function MovieWatchProvidersPanel({ providers, movieTitle, className }: Props) {
  const fallbackUrl = providers.link ?? '#'
  const sections = [
    { key: 'stream', label: 'Stream', items: providers.stream },
    { key: 'rent', label: 'Rent', items: providers.rent },
    { key: 'buy', label: 'Buy', items: providers.buy },
  ].filter((s) => s.items.length > 0)

  if (!sections.length) return null

  return (
    <section
      className={[styles.section, className].filter(Boolean).join(' ')}
      aria-label={`Where to watch ${movieTitle}`}
    >
      <div className={styles.head}>
        <h2 className={styles.title}>
          <span className={styles.bar} aria-hidden />
          Where to Watch
        </h2>
      </div>
      <div className={styles.groups}>
        {sections.map(({ key, label, items }) => (
          <div key={key}>
            <p className={styles.label}>{label}</p>
            <div className={styles.row}>
              {items.map((p) => (
                <ProviderLink
                  key={`${key}-${p.providerId}`}
                  providerId={p.providerId}
                  movieTitle={movieTitle}
                  name={p.providerName}
                  logoPath={p.logoPath}
                  fallbackUrl={fallbackUrl}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
