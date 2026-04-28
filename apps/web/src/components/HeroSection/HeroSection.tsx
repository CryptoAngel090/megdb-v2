'use client'

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import {
  buildHeroContentVariants,
  buildHeroTitleVariants,
  buildHeroMetaVariants,
  buildHeroButtonsVariants,
  buildHeroOverviewVariants,
  buildSlideVariants,
  btnPrimaryVariants,
  btnSecondaryVariants,
} from './HeroSection.animations'
import styles from './HeroSection.module.css'
import type { MediaType } from '@repo/types'

const TYPE_PATHS: Record<MediaType, string> = {
  movie: 'movie',
  series: 'series',
  cartoon: 'cartoon',
  tvshow: 'tvshow',
}
const TMDB_IMAGE = 'https://image.tmdb.org/t/p'
const AUTO_ROTATION_INTERVAL = 6000
const SWIPE_THRESHOLD_PX = 50

interface HeroSlide {
  id: number
  type: MediaType
  title: string
  overview: string
  backdropPath: string | null
  voteAverage: number
  releaseDate?: Date | null
  runtime?: number | null
  genres?: string[]
  trailerKey?: string | null
}

interface HeroSectionProps {
  slides: HeroSlide[]
}

export function HeroSection({ slides }: HeroSectionProps) {
  // Backdrop is required; TMDB often returns vote_average 0 for new titles — do not drop those.
  const validSlides = slides.filter((slide) => Boolean(slide.backdropPath?.trim()))

  const reduceMotion = usePrefersReducedMotion()
  const heroContentVariants = buildHeroContentVariants(reduceMotion)
  const heroTitleVariants = buildHeroTitleVariants(reduceMotion)
  const heroMetaVariants = buildHeroMetaVariants(reduceMotion)
  const heroButtonsVariants = buildHeroButtonsVariants(reduceMotion)
  const heroOverviewVariants = buildHeroOverviewVariants(reduceMotion)
  const slideVariants = buildSlideVariants(reduceMotion)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTrailerKey, setModalTrailerKey] = useState<string | null>(null)
  const [isCarouselPaused, setIsCarouselPaused] = useState(false)
  const [portalReady, setPortalReady] = useState(false)

  useEffect(() => {
    setPortalReady(true)
  }, [])

  const touchStartX = useRef<number | null>(null)
  const slideProgressFillRef = useRef<HTMLDivElement>(null)

  const currentSlide = validSlides[currentIndex]

  // Do not pause auto-rotate on whole-hero hover: the block is huge, so the cursor is almost always "inside"
  // and the timer would never run. User can pause via the control next to indicators.
  const shouldAutoRotate = validSlides.length > 1 && !isModalOpen && !isCarouselPaused

  useEffect(() => {
    setCurrentIndex((i) => {
      if (validSlides.length === 0) return 0
      return Math.min(i, validSlides.length - 1)
    })
  }, [validSlides.length])

  /**
   * Auto-advance + red progress line (always rendered — not gated on prefers-reduced-motion,
   * otherwise the bar DOM/ref never mounts for many users and nothing appears).
   * useLayoutEffect: ref to the fill is ready before first paint of the tick loop.
   */
  useLayoutEffect(() => {
    if (validSlides.length <= 1) return
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
        setCurrentIndex((prev) => (prev + 1) % validSlides.length)
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
  }, [currentIndex, shouldAutoRotate, validSlides.length])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + validSlides.length) % validSlides.length)
  }, [validSlides.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % validSlides.length)
  }, [validSlides.length])

  const openTrailer = useCallback((trailerKey: string) => {
    setModalTrailerKey(trailerKey)
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setModalTrailerKey(null)
  }, [])

  useEffect(() => {
    if (!isModalOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeModal()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isModalOpen, closeModal])

  const handleSectionKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (isModalOpen) return
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return

      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      e.preventDefault()
      if (e.key === 'ArrowLeft') goToPrev()
      else goToNext()
    },
    [goToPrev, goToNext, isModalOpen]
  )

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || validSlides.length <= 1) return
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
    [goToPrev, goToNext, validSlides.length]
  )

  const toggleCarouselPause = useCallback(() => {
    setIsCarouselPaused((v) => !v)
  }, [])

  if (!currentSlide) return null

  const year = currentSlide.releaseDate ? new Date(currentSlide.releaseDate).getFullYear() : null
  const rating = currentSlide.voteAverage > 0 ? currentSlide.voteAverage.toFixed(1) : null
  const href = `/${TYPE_PATHS[currentSlide.type]}/${currentSlide.id}`
  const imgSrc = currentSlide.backdropPath
    ? `${TMDB_IMAGE}/w1280${currentSlide.backdropPath}`
    : null

  /* Hover/active только через CSS (.btnPrimary / .btnSecondary) — без Framer scale на обёртке. */
  const motionBtnProps = { initial: 'idle' as const }

  return (
    <>
      <section
        className={styles.hero}
        aria-label={`Featured: ${currentSlide.title}`}
        aria-describedby="hero-carousel-label"
        aria-roledescription="carousel"
        onKeyDown={handleSectionKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <span id="hero-carousel-label" className={styles.srOnly}>
          Featured titles carousel. Use previous and next controls, swipe on touch devices, or arrow
          keys when focus is inside this section.
        </span>

        <AnimatePresence mode="wait">
          {imgSrc && (
            <motion.div
              key={currentSlide.id}
              className={`${styles.backdrop} ${styles.backdropDissolve}`}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <div className={styles.backdropParallax}>
                <Image
                  src={imgSrc}
                  alt=""
                  fill
                  priority={currentIndex === 0}
                  fetchPriority={currentIndex === 0 ? 'high' : 'low'}
                  sizes="100vw"
                  className={styles.backdropImg}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={styles.gradientBottom} aria-hidden />
        <div className={styles.gradientLeft} aria-hidden />
        <div className={styles.vignette} aria-hidden />
        <div className={styles.ambientGlow} aria-hidden />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            className={styles.content}
            variants={heroContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className={styles.contentMain}>
              <motion.h1 className={styles.title} variants={heroTitleVariants}>
                {currentSlide.title}
              </motion.h1>

              <motion.div className={styles.meta} variants={heroMetaVariants}>
                {rating && <span className={styles.rating}>★ {rating}</span>}
                {rating && <span className={styles.separator} />}
                {year && <span className={styles.year}>{year}</span>}
                {currentSlide.runtime && (
                  <>
                    <span className={styles.separator} />
                    <span className={styles.runtime}>
                      {Math.floor(currentSlide.runtime / 60)}h {currentSlide.runtime % 60}m
                    </span>
                  </>
                )}
                {currentSlide.genres?.slice(0, 2).map((g) => (
                  <span key={g} className={styles.genre}>
                    {g}
                  </span>
                ))}
              </motion.div>

              <motion.p className={styles.overview} variants={heroOverviewVariants}>
                {currentSlide.overview}
              </motion.p>

              <motion.div className={styles.buttons} variants={heroButtonsVariants}>
                <motion.div variants={btnPrimaryVariants} {...motionBtnProps}>
                  {currentSlide.trailerKey ? (
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={() => openTrailer(currentSlide.trailerKey!)}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Watch Trailer
                    </button>
                  ) : (
                    <Link href={href} className={styles.btnPrimary}>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Watch Now
                    </Link>
                  )}
                </motion.div>

                <motion.div variants={btnSecondaryVariants} {...motionBtnProps}>
                  <Link href={href} className={styles.btnSecondary}>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Movie Details
                  </Link>
                </motion.div>

                {validSlides.length > 1 && (
                  <div className={styles.navArrows}>
                    <motion.button
                      type="button"
                      className={styles.navArrow}
                      onClick={goToPrev}
                      aria-label="Previous slide"
                      {...(!reduceMotion ? { whileTap: { scale: 0.9 } } : {})}
                      transition={{ type: 'spring', stiffness: 520, damping: 22 }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        aria-hidden
                      >
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </motion.button>
                    <motion.button
                      type="button"
                      className={styles.navArrow}
                      onClick={goToNext}
                      aria-label="Next slide"
                      {...(!reduceMotion ? { whileTap: { scale: 0.9 } } : {})}
                      transition={{ type: 'spring', stiffness: 520, damping: 22 }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        aria-hidden
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {validSlides.length > 1 && (
          <>
            <div className={styles.carouselControls} aria-label="Carousel controls">
              <button
                type="button"
                className={styles.pauseToggle}
                onClick={toggleCarouselPause}
                aria-pressed={isCarouselPaused}
                aria-label={
                  isCarouselPaused ? 'Play automatic slideshow' : 'Pause automatic slideshow'
                }
                title={isCarouselPaused ? 'Play slideshow' : 'Pause slideshow'}
              >
                {isCarouselPaused ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                )}
              </button>
              <div className={styles.indicators} role="group" aria-label="Slide selection">
                {validSlides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    className={`${styles.indicator} ${index === currentIndex ? styles.indicatorActive : ''}`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Slide ${index + 1}: ${slide.title}`}
                    aria-current={index === currentIndex ? 'true' : undefined}
                  />
                ))}
              </div>
            </div>
            <div className={styles.slideProgressTrack} aria-hidden="true">
              <div ref={slideProgressFillRef} className={styles.slideProgressFill} />
            </div>
          </>
        )}
      </section>

      {portalReady
        ? createPortal(
            <AnimatePresence>
              {isModalOpen && modalTrailerKey && (
                <motion.div
                  className={styles.modal}
                  role="presentation"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={closeModal}
                >
                  <motion.div
                    className={styles.modalContent}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="hero-trailer-dialog-title"
                    initial={{ scale: reduceMotion ? 1 : 0.9, opacity: reduceMotion ? 1 : 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: reduceMotion ? 1 : 0.9, opacity: reduceMotion ? 1 : 0 }}
                    transition={reduceMotion ? { duration: 0 } : { type: 'tween', duration: 0.25 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h2 id="hero-trailer-dialog-title" className={styles.srOnly}>
                      Trailer: {currentSlide.title}
                    </h2>
                    <button
                      type="button"
                      className={styles.modalClose}
                      onClick={closeModal}
                      aria-label="Close trailer"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                    <div className={styles.modalVideo}>
                      <iframe
                        src={`https://www.youtube.com/embed/${modalTrailerKey}?autoplay=1`}
                        title={`Trailer: ${currentSlide.title}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )
        : null}
    </>
  )
}
