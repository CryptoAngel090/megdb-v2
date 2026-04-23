'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import {
  searchBarVariants,
  dropdownVariants,
  dropdownVariantsReduced,
} from './SearchBar.animations'
import styles from './SearchBar.module.css'

const PLACEHOLDERS = ['Search movies...', 'Search actors...', 'Search series...']
const PLACEHOLDER_INTERVAL = 5000 // 5s — rotating placeholder; readable pace
const MIN_SEARCH_LENGTH = 2 // rule 42: autocomplete from 2+ chars

interface SearchResult {
  id: number
  type: 'movie' | 'series' | 'person'
  title: string
  subtitle?: string
  posterPath?: string | null
  year?: string
}

interface SearchBarProps {
  onFocus?: () => void
  onBlur?: () => void
  autoFocus?: boolean
}

interface SearchApiResponse {
  results?: SearchResult[]
}

function isSearchApiResponse(value: unknown): value is SearchApiResponse {
  if (!value || typeof value !== 'object') {
    return false
  }
  if (!('results' in value)) {
    return true
  }

  const candidate = value as { results?: unknown }
  return candidate.results === undefined || Array.isArray(candidate.results)
}

function searchResultTypeLabel(type: SearchResult['type']): string {
  if (type === 'movie') return 'Movie'
  if (type === 'series') return 'TV series'
  return 'Person'
}

export function SearchBar({ onFocus, onBlur, autoFocus }: SearchBarProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // rule 45: rotating placeholder copy
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length)
    }, PLACEHOLDER_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  // rule 42: autocomplete after 2+ characters
  useEffect(() => {
    if (query.length < MIN_SEARCH_LENGTH) {
      setResults([])
      return
    }

    const loadResults = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const rawData: unknown = await response.json()
          if (isSearchApiResponse(rawData)) {
            setResults(rawData.results ?? [])
          } else {
            setResults([])
          }
        } else {
          setResults([])
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoading(false)
      }
    }
    const timer = setTimeout(() => {
      void loadResults()
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // rule 44: Esc clears, Enter submits or opens selection
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setQuery('')
        setResults([])
        setIsFocused(false)
        inputRef.current?.blur()
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && results[selectedIndex]) {
          const result = results[selectedIndex]
          router.push(`/${result.type}/${result.id}`)
          setQuery('')
          setResults([])
          setIsFocused(false)
        } else if (query.trim()) {
          router.push(`/search?q=${encodeURIComponent(query)}`)
          setIsFocused(false)
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, -1))
      }
    },
    [query, results, selectedIndex, router]
  )

  const handleFocus = () => {
    setIsFocused(true)
    onFocus?.()
  }

  const handleBlur = () => {
    // Delay so mousedown on a result runs before blur closes the list
    setTimeout(() => {
      setIsFocused(false)
      onBlur?.()
    }, 200)
  }

  const handleResultClick = (result: SearchResult) => {
    router.push(`/${result.type}/${result.id}`)
    setQuery('')
    setResults([])
    setIsFocused(false)
  }

  const showDropdown = isFocused && (results.length > 0 || isLoading)

  return (
    <div className={styles.searchBar}>
      <motion.div
        className={styles.inputWrapper}
        variants={searchBarVariants}
        animate={isFocused ? 'focused' : 'idle'}
      >
        <svg
          className={styles.searchIcon}
          width="20"
          height="20"
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
          type="text"
          className={styles.input}
          placeholder={PLACEHOLDERS[placeholderIndex]}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          aria-label="Search movies, series, and people"
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-expanded={showDropdown}
        />

        {!query && !isFocused && (
          <div className={styles.kbdHint}>
            <span className={styles.kbd}>Ctrl</span>
            <span className={styles.kbd}>K</span>
          </div>
        )}

        {query && (
          <button
            className={styles.clearBtn}
            onClick={() => {
              setQuery('')
              setResults([])
              inputRef.current?.focus()
            }}
            aria-label="Clear search"
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </motion.div>

      {/* Newest releases first (API order); flat list so sort matches /search */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            ref={dropdownRef}
            id="search-results"
            className={styles.dropdown}
            variants={prefersReducedMotion ? dropdownVariantsReduced : dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            role="listbox"
          >
            {isLoading ? (
              <div className={styles.loading}>
                <div className={styles.spinner} />
                Searching…
              </div>
            ) : (
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
                      onClick={() => handleResultClick(result)}
                      role="option"
                      aria-selected={selectedIndex === index}
                    >
                      <div className={styles.resultPoster}>
                        {result.posterPath ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w92${result.posterPath}`}
                            alt=""
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

                {results.length === 0 && !isLoading && (
                  <div className={styles.noResults}>No results</div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
