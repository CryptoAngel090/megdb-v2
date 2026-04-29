import type { MoviePageDetail } from '@/lib/tmdb'
import styles from './MovieWatchTableSection.module.css'

interface MovieWatchTableSectionProps {
  title: string
  yearLabel: string | null
  watchRows: MoviePageDetail['watchRows']
}

function watchTypeClass(t: MoviePageDetail['watchRows'][number]['type']): string {
  switch (t) {
    case 'Stream':
      return styles.typeStream ?? ''
    case 'Free':
      return styles.typeFree ?? ''
    case 'Rent':
      return styles.typeRent ?? ''
    default:
      return styles.typeBuy ?? ''
  }
}

export function MovieWatchTableSection({ title, yearLabel, watchRows }: MovieWatchTableSectionProps) {
  const streamOrFree = watchRows.filter((r) => r.type === 'Stream' || r.type === 'Free')
  const tableLead =
    streamOrFree.length > 0
      ? `${title}${yearLabel ? ` (${yearLabel})` : ''} is available on ${streamOrFree.map((r) => r.name).join(', ')}.`
      : `${title}${yearLabel ? ` (${yearLabel})` : ''} streaming availability varies by region.`

  return (
    <section className={styles.watchTableSection} aria-labelledby="where-heading">
      <h2 id="where-heading" className={styles.sectionHeading}>
        <span className={styles.sectionBar} aria-hidden />
        Where to Watch {title}
      </h2>
      <p className={styles.watchLead}>
        {tableLead}
        {watchRows.some((r) => r.type === 'Rent') ? ' Also available for digital rental.' : ''}
        {watchRows.some((r) => r.type === 'Buy') ? ' Available for purchase.' : ''}
      </p>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Service</th>
              <th scope="col">Type</th>
              <th scope="col">Quality</th>
            </tr>
          </thead>
          <tbody>
            {watchRows.map((row, i) => (
              <tr key={`${row.name}-${row.type}-${i}`} className={i % 2 === 1 ? styles.trAlt : ''}>
                <td>{row.name}</td>
                <td>
                  <span className={`${styles.typePill} ${watchTypeClass(row.type)}`}>{row.type}</span>
                </td>
                <td>{row.quality}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
