import { MediaShelfSkeleton } from '@/components/MediaShelf/MediaShelf'

/** Avoid `page.module.css` here — that sheet is homepage-specific; tying it to
 *  root `loading` caused missing layout CSS (e.g. footer) on unknown routes in dev. */
export default function Loading() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        paddingTop: '80svh',
        paddingBottom: 'max(var(--space-8), env(safe-area-inset-bottom, 0px))',
      }}
    >
      <MediaShelfSkeleton count={10} />
      <MediaShelfSkeleton count={10} />
      <MediaShelfSkeleton count={10} />
    </div>
  )
}
