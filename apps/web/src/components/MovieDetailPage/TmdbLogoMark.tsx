interface TmdbLogoMarkProps {
  /** Optional CSS module class for sizing */
  readonly className?: string | undefined
}

/**
 * Compact TMDB attribution mark — official brand green (#01D277).
 * Stacked white slabs (skewed group) echo TMDB’s short icon at small sizes.
 */
export function TmdbLogoMark({ className }: TmdbLogoMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      width={32}
      height={32}
      role="img"
      aria-label="The Movie Database"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>The Movie Database</title>
      <rect width="32" height="32" rx="6" fill="var(--tmdb-brand-fill)" />
      <g transform="translate(16 16) skewX(-14) translate(-16 -16)">
        <rect x="7" y="9" width="4.2" height="14" rx="1.1" fill="oklch(99% 0 0)" />
        <rect x="12.9" y="8" width="4.2" height="16" rx="1.1" fill="oklch(99% 0 0)" />
        <rect x="18.8" y="9" width="4.2" height="14" rx="1.1" fill="oklch(99% 0 0)" />
      </g>
    </svg>
  )
}
