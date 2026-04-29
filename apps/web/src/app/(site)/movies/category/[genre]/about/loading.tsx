import hubStyles from '../hub.module.css'

export default function MoviesGenreAboutLoading() {
  return (
    <section className={hubStyles.hub} aria-label="Loading genre guide">
      <article className={hubStyles.teaserCard}>
        <h1 className={hubStyles.teaserTitle}>Loading genre guide...</h1>
        <p className={hubStyles.teaserText}>Preparing editorial overview and related entities.</p>
      </article>
    </section>
  )
}
