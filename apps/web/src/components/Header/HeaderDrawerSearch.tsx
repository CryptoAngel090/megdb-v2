'use client'

import Image from 'next/image'
import type { KeyboardEvent, RefObject } from 'react'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import styles from './Header.module.css'

export interface DrawerSearchResult {
  id: number
  type: 'movie' | 'series' | 'person'
  title: string
  subtitle?: string
  year?: string
  posterPath?: string | null
}

interface HeaderDrawerSearchProps {
  containerRef: RefObject<HTMLDivElement | null>
  inputRef: RefObject<HTMLInputElement | null>
  query: string
  loading: boolean
  focused: boolean
  results: DrawerSearchResult[]
  selectedIndex: number
  onQueryChange: (value: string) => void
  onInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  onFocus: () => void
  onBlur: () => void
  onResultClick: (result: DrawerSearchResult) => void
}

export function HeaderDrawerSearch({
  containerRef,
  inputRef,
  query,
  loading,
  focused,
  results,
  selectedIndex,
  onQueryChange,
  onInputKeyDown,
  onFocus,
  onBlur,
  onResultClick,
}: HeaderDrawerSearchProps) {
  const showDropdown = focused && (loading || results.length > 0 || query.trim().length >= 2)

  return (
    <div ref={containerRef} className={styles.drawerSearch}>
      <div className={styles.drawerSearchWrap}>
        <svg
          className={`${styles.drawerSearchIcon} ${iconSlot.block} ${iconSlot.sm}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          id="drawer-search-input"
          name="q"
          type="text"
          className={styles.drawerSearchInput}
          placeholder="Search movies, series..."
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={onInputKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          aria-label="Search"
          aria-expanded={showDropdown}
          aria-controls="drawer-search-results"
        />
      </div>
      {showDropdown && (
        <div id="drawer-search-results" className={styles.drawerSearchDropdown} role="listbox">
          {loading ? (
            <div className={styles.drawerSearchStatus}>Searching...</div>
          ) : results.length === 0 ? (
            <div className={styles.drawerSearchStatus}>Nothing found</div>
          ) : (
            results.map((result, index) => (
              <button
                key={`${result.type}-${result.id}`}
                type="button"
                className={`${styles.drawerSearchResult} ${selectedIndex === index ? styles.drawerSearchResultActive : ''}`}
                onClick={() => onResultClick(result)}
                role="option"
                aria-selected={selectedIndex === index}
              >
                <div className={styles.drawerSearchResultThumb}>
                  {result.posterPath ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w92${result.posterPath}`}
                      alt=""
                      width={36}
                      height={56}
                      className={styles.drawerSearchResultImg}
                    />
                  ) : (
                    <div className={styles.drawerSearchResultThumbPlaceholder} aria-hidden />
                  )}
                </div>
                <span className={styles.drawerSearchResultText}>
                  <span className={styles.drawerSearchResultTitle}>{result.title}</span>
                  <span className={styles.drawerSearchResultMeta}>
                    {result.subtitle ?? result.year ?? result.type}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
