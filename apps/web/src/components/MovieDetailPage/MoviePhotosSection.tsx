import Image from 'next/image'
import { useId } from 'react'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import type { MovieBackdropStill } from '@/lib/tmdb'
import { getImageUrl } from '@/lib/tmdb'
import { MoviePhotosSectionClient } from './MoviePhotosSection.client'
import styles from './MoviePhotosSection.module.css'

const BLUR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

type Props = {
  images: MovieBackdropStill[]
  title: string
}

function GalleryIcon({ className }: { className?: string | undefined }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m6 17 4.2-4.2a1 1 0 0 1 1.4 0L15 16l2.1-2.1a1 1 0 0 1 1.4 0L20 15.4" />
    </svg>
  )
}

function _CloseIcon({ className }: { className?: string | undefined }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function ChevronLeftIcon({ className }: { className?: string | undefined }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string | undefined }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export function MoviePhotosSection({ images, title }: Props) {
  const sectionId = useId().replace(/:/g, '')
  const validImages = images.filter((img) => Boolean(img.filePath?.trim()))

  if (!validImages.length) return null

  return (
    <section id={`${sectionId}-shell`} className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.title}>
          <span className={styles.bar} aria-hidden />
          <GalleryIcon
            className={[iconSlot.block, iconSlot.sm, styles.galleryIcon].filter(Boolean).join(' ')}
          />
          Photos
          <span className={styles.count}>{validImages.length}</span>
        </h2>
        <div className={styles.nav}>
          <button
            type="button"
            className={styles.navBtn}
            aria-label="Scroll left"
            data-scroll="left"
          >
            <ChevronLeftIcon className={`${iconSlot.block} ${iconSlot.md}`} />
          </button>
          <button
            type="button"
            className={styles.navBtn}
            aria-label="Scroll right"
            data-scroll="right"
          >
            <ChevronRightIcon className={`${iconSlot.block} ${iconSlot.md}`} />
          </button>
        </div>
      </div>

      <div id={`${sectionId}-track`} className={styles.track}>
        {validImages.map((img, i) => (
          <button key={img.filePath} type="button" className={styles.thumb} data-photo-index={i}>
            <Image
              src={getImageUrl(img.filePath, 'w500')}
              alt={`${title} — still ${i + 1}`}
              width={500}
              height={281}
              className={styles.thumbImg}
              placeholder="blur"
              blurDataURL={BLUR}
              priority={i < 6}
            />
          </button>
        ))}
      </div>
      <MoviePhotosSectionClient sectionId={sectionId} title={title} images={validImages} />
    </section>
  )
}
