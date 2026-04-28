'use client'

// client: carousel state, auto-advance, swipe, pause, and Framer Motion transitions (same behavior as homepage HeroSection).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { buildSlideVariants } from '@/components/HeroSection/HeroSection.animations'
import { MovieHeroBackdropImage } from './MovieHeroBackdropImage'
import styles from './MovieHeroBackdropCarousel.module.css'

const AUTO_ROTATION_INTERVAL = 6000
const SWIPE_THRESHOLD_PX = 50

interface MovieHeroCarouselContextValue {
  currentIndex: number
  slideUrls: string[]
  movieId: number
  movieTitle: string
  blurDataURL: string
  goToSlide: (index: number) => void
  goToPrev: () => void
  goToNext: () => void
  isCarouselPaused: boolean
  toggleCarouselPause: () => void
  slideProgressFillRef: React.RefObject<HTMLDivElement | null>
  shouldAutoRotate: boolean
  reduceMotion: boolean
  slideVariants: ReturnType<typeof buildSlideVariants>
  touchStartX: React.MutableRefObject<number | null>
}

const MovieHeroCarouselContext = createContext<MovieHeroCarouselContextValue | null>(null)

function useMovieHeroCarouselContext(): MovieHeroCarouselContextValue {
  const ctx = useContext(MovieHeroCarouselContext)
  if (!ctx) {
    throw new Error('Movie hero carousel components require MovieHeroCarouselProvider')
  }
  return ctx
}

interface MovieHeroCarouselProviderProps {
  movieId: number
  movieTitle: string
  slideUrls: string[]
  blurDataURL: string
  children: ReactNode
}

export function MovieHeroCarouselProvider({
  movieId,
  movieTitle,
  slideUrls,
  blurDataURL,
  children,
}: MovieHeroCarouselProviderProps) {
  const reduceMotion = usePrefersReducedMotion()
  const slideVariants = useMemo(() => buildSlideVariants(reduceMotion), [reduceMotion])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isCarouselPaused, setIsCarouselPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const slideProgressFillRef = useRef<HTMLDivElement>(null)

  const n = slideUrls.length
  const shouldAutoRotate = n > 1 && !isCarouselPaused

  useEffect(() => {
    setCurrentIndex((i) => {
      if (n === 0) return 0
      return Math.min(i, n - 1)
    })
  }, [n])

  const goToSlide = useCallback(
    (index: number) => {
      if (n === 0) return
      setCurrentIndex(((index % n) + n) % n)
    },
    [n]
  )

  const goToPrev = useCallback(() => {
    if (n <= 1) return
    setCurrentIndex((prev) => (prev - 1 + n) % n)
  }, [n])

  const goToNext = useCallback(() => {
    if (n <= 1) return
    setCurrentIndex((prev) => (prev + 1) % n)
  }, [n])

  const toggleCarouselPause = useCallback(() => {
    setIsCarouselPaused((v) => !v)
  }, [])

  useLayoutEffect(() => {
    if (n <= 1) return
    if (!shouldAutoRotate) return

    let raf = 0
    let cancelled = false
    const start = performance.now()

    const tick = () => {
      if (cancelled) return
      const elapsed = performance.now() - start
      const p = Math.min(1, elapsed / AUTO_ROTATION_INTERVAL)
      const el = slideProgressFillRef.current
      if (el) el.style.transform = `scaleX(${p})`
      if (p >= 1) {
        setCurrentIndex((prev) => (prev + 1) % n)
        return
      }
      raf = requestAnimationFrame(tick)
    }

    const el = slideProgressFillRef.current
    if (el) el.style.transform = 'scaleX(0)'
    raf = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [currentIndex, shouldAutoRotate, n])

  const value = useMemo(
    (): MovieHeroCarouselContextValue => ({
      currentIndex,
      slideUrls,
      movieId,
      movieTitle,
      blurDataURL,
      goToSlide,
      goToPrev,
      goToNext,
      isCarouselPaused,
      toggleCarouselPause,
      slideProgressFillRef,
      shouldAutoRotate,
      reduceMotion,
      slideVariants,
      touchStartX,
    }),
    [
      blurDataURL,
      currentIndex,
      goToNext,
      goToPrev,
      goToSlide,
      isCarouselPaused,
      movieId,
      movieTitle,
      reduceMotion,
      shouldAutoRotate,
      slideUrls,
      slideVariants,
      toggleCarouselPause,
    ]
  )

  return (
    <MovieHeroCarouselContext.Provider value={value}>{children}</MovieHeroCarouselContext.Provider>
  )
}

interface MovieHeroCarouselBackdropProps {
  /** e.g. `MovieDetailPage.module.css` `heroImgCover` for landscape treatment */
  slideImageClassName: string
}

export function MovieHeroCarouselBackdrop({ slideImageClassName }: MovieHeroCarouselBackdropProps) {
  const {
    currentIndex,
    slideUrls,
    movieId,
    movieTitle,
    blurDataURL,
    goToPrev,
    goToNext,
    slideVariants,
    touchStartX,
  } = useMovieHeroCarouselContext()

  const currentUrl = slideUrls[currentIndex]
  if (!currentUrl) return null

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      touchStartX.current = e.changedTouches[0]?.clientX ?? null
    },
    [touchStartX]
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current == null || slideUrls.length <= 1) return
      const endX = e.changedTouches[0]?.clientX
      if (endX === undefined) {
        touchStartX.current = null
        return
      }
      const dx = endX - touchStartX.current
      touchStartX.current = null
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return
      if (dx > 0) goToPrev()
      else goToNext()
    },
    [goToNext, goToPrev, slideUrls.length, touchStartX]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }
      e.preventDefault()
      if (e.key === 'ArrowLeft') goToPrev()
      else goToNext()
    },
    [goToNext, goToPrev]
  )

  return (
    <div
      className={styles.backdropRoot}
      role="region"
      aria-roledescription="carousel"
      aria-label={`${movieTitle} — backdrop stills`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <span className={styles.srOnly}>
        Backdrop stills from this title. Use arrow keys when focused here, or the pause and slide
        controls below.
      </span>
      <AnimatePresence mode="sync">
        <motion.div
          key={`${currentIndex}-${currentUrl}`}
          className={styles.slideLayer}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          <div className={styles.slideInner}>
            <MovieHeroBackdropImage
              focalAssetKey={`${movieId}-hero-carousel-${currentIndex}-${currentUrl.slice(-40)}`}
              disableAutoFocal
              src={currentUrl}
              alt=""
              fill
              priority={currentIndex === 0}
              fetchPriority={currentIndex === 0 ? 'high' : 'low'}
              sizes="100vw"
              className={slideImageClassName}
              placeholder="blur"
              blurDataURL={blurDataURL}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
