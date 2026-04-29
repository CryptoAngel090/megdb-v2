import shelfStyles from './MediaShelf.module.css'
import lightStyles from './MediaShelfSkeletonLight.module.css'

export interface MediaShelfSkeletonLightProps {
  count?: number
}

/**
 * Server-only shelf loading chrome: same header/row shell as `MediaShelf` skeleton
 * without importing `MediaCard` or the interactive `MediaShelf` client module.
 * Used from root `app/loading` and homepage Suspense fallbacks so detail routes
 * do not inherit the full shelf client graph.
 */
export function MediaShelfSkeletonLight({ count = 10 }: MediaShelfSkeletonLightProps) {
  return (
    <section className={shelfStyles.shelf}>
      <div className={shelfStyles.header}>
        <div className={shelfStyles.headerLeft}>
          <div className={shelfStyles.titleBlock}>
            <div className={shelfStyles.skeletonAccent} aria-hidden />
            <div className={shelfStyles.skeletonTitleBar} aria-hidden />
          </div>
        </div>
        <div className={shelfStyles.headerArrows} aria-hidden>
          <div className={shelfStyles.skeletonScrollBtn} aria-hidden />
          <div className={shelfStyles.skeletonScrollBtn} aria-hidden />
        </div>
        <div className={shelfStyles.headerRight} aria-hidden />
      </div>
      <div className={shelfStyles.rowWrap}>
        <div className={shelfStyles.row}>
          <div className={shelfStyles.rowInner}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className={lightStyles.card}>
                <div className={lightStyles.poster} />
                <div className={lightStyles.meta}>
                  <div className={lightStyles.line} />
                  <div className={lightStyles.lineShort} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
