import { MediaShelfSkeletonLight } from '@/components/MediaShelf/MediaShelfSkeletonLight'

interface HomeShelvesFallbackProps {
  className: string
}

/** Server `Suspense` fallback — avoids pulling `MediaShelf` / `MediaCard` into unrelated route JS. */
export function HomeShelvesFallback({ className }: HomeShelvesFallbackProps) {
  return (
    <div className={className} aria-busy="true" aria-label="Loading discover shelves">
      {[1, 2, 3, 4, 5, 6].map((k) => (
        <MediaShelfSkeletonLight key={k} count={10} />
      ))}
    </div>
  )
}
