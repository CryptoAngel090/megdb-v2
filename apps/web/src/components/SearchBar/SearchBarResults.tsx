import Image from 'next/image'
import { searchResultTypeLabel } from './SearchBar.helpers'
import type { SearchResult } from './SearchBar.types'
import styles from './SearchBar.module.css'

interface SearchBarResultsProps {
  isLoading: boolean
  results: SearchResult[]
  selectedIndex: number
  onResultClick: (result: SearchResult) => void
}

export function SearchBarResults({
  isLoading,
  results,
  selectedIndex,
  onResultClick,
}: SearchBarResultsProps) {
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        Searching…
      </div>
    )
  }

  return (
    <>
      {results.map((result, index) => {
        const subtitleParts =
          result.type === 'person'
            ? [result.subtitle, searchResultTypeLabel(result.type)]
            : [result.year, searchResultTypeLabel(result.type)]
        const subtitle = subtitleParts.filter(Boolean).join(' · ')

        return (
          <button
            key={`${result.type}-${result.id}`}
            type="button"
            className={`${styles.result} ${selectedIndex === index ? styles.resultSelected : ''}`}
            onClick={() => onResultClick(result)}
            role="option"
            aria-selected={selectedIndex === index}
          >
            <div className={styles.resultPoster}>
              {result.posterPath ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w92${result.posterPath}`}
                  alt={`${result.title} poster`}
                  width={40}
                  height={60}
                  className={styles.resultImg}
                />
              ) : (
                <div className={styles.resultPosterPlaceholder} aria-hidden />
              )}
            </div>
            <div className={styles.resultInfo}>
              <div className={styles.resultTitle}>{result.title}</div>
              {subtitle ? <div className={styles.resultSubtitle}>{subtitle}</div> : null}
            </div>
          </button>
        )
      })}

      {results.length === 0 && !isLoading && <div className={styles.noResults}>No results</div>}
    </>
  )
}
