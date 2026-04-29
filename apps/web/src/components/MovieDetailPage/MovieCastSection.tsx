import Image from 'next/image'
import Link from 'next/link'
import type { MoviePageCastMember } from '@/lib/tmdb'
import { getImageUrl } from '@/lib/tmdb'
import { PERSON_PROFILE_IMAGE_SIZES, PERSON_PROFILE_IMAGE_TMDB_SIZE } from '@/lib/imageSizes'
import { personPath } from '@/lib/slug'
import { Users } from 'lucide-react'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import styles from './MovieCastSection.module.css'

const BLUR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

type Props = {
  cast: MoviePageCastMember[]
  title?: string
}

export function MovieCastSection({ cast, title = 'Cast' }: Props) {
  const castWithPhoto = cast.filter((actor) => Boolean(actor.profilePath))
  if (!castWithPhoto.length) return null

  return (
    <div className={styles.cqRoot}>
      <section id="movie-cast" className={styles.section}>
        <div className={styles.head}>
          <h2 className={styles.title}>
            <span className={styles.bar} aria-hidden />
            <Users
              className={[iconSlot.block, iconSlot.sm, styles.castIcon].filter(Boolean).join(' ')}
              aria-hidden
            />
            {title}
            <span className={styles.count}>{castWithPhoto.length}</span>
          </h2>
        </div>
        <div className={styles.track}>
          {castWithPhoto.map((actor) => {
            const photoUrl = getImageUrl(actor.profilePath, PERSON_PROFILE_IMAGE_TMDB_SIZE)
            return (
              <div key={actor.id} className={styles.card}>
                <Link href={personPath(actor.id, actor.name)} className={styles.cardInner}>
                  <div className={styles.cardBox}>
                    <div className={styles.photo}>
                      <Image
                        src={photoUrl}
                        alt={actor.name}
                        fill
                        sizes={PERSON_PROFILE_IMAGE_SIZES}
                        className={styles.photoImg}
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL={BLUR}
                      />
                    </div>
                    <div className={styles.meta}>
                      <p className={styles.name}>{actor.name}</p>
                      {actor.character ? <p className={styles.char}>{actor.character}</p> : null}
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
          <div className={styles.spacer} aria-hidden />
        </div>
      </section>
    </div>
  )
}
