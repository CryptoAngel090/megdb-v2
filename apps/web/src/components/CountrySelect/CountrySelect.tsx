'use client'

import * as Flags from 'country-flag-icons/react/3x2'
import { useEffect, useRef, useState } from 'react'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import styles from './CountrySelect.module.css'

interface Country {
  code: string
  name: string
}

interface CountrySelectProps {
  value: string
  onChange: (code: string) => void
  disabled?: boolean
  countries: Country[]
}

export function CountrySelect({ value, onChange, disabled, countries }: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedCountry = countries.find((c) => c.code === value)
  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  function handleSelect(code: string) {
    onChange(code)
    setIsOpen(false)
    setSearch('')
  }

  function getFlagComponent(countryCode: string) {
    const FlagComponent = Flags[countryCode as keyof typeof Flags]
    return FlagComponent
  }

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <div className={styles.triggerContent}>
          {selectedCountry ? (
            <>
              <div className={styles.flagWrapper}>
                {(() => {
                  const FlagComponent = getFlagComponent(selectedCountry.code)
                  return FlagComponent ? <FlagComponent className={styles.flag} /> : null
                })()}
              </div>
              <span className={styles.countryName}>{selectedCountry.name}</span>
            </>
          ) : (
            <>
              <svg
                className={`${styles.globeIcon} ${iconSlot.block} ${iconSlot.md}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span className={styles.placeholder}>Select country</span>
            </>
          )}
        </div>
        <svg
          className={`${styles.arrow} ${iconSlot.block} ${iconSlot.md}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.optionsList}>
            {filteredCountries.map((country) => {
              const FlagComponent = getFlagComponent(country.code)
              return (
                <button
                  key={country.code}
                  type="button"
                  className={`${styles.option} ${value === country.code ? styles.optionSelected : ''}`}
                  onClick={() => handleSelect(country.code)}
                >
                  <div className={styles.flagWrapper}>
                    {FlagComponent && <FlagComponent className={styles.flag} />}
                  </div>
                  <span className={styles.optionName}>{country.name}</span>
                </button>
              )
            })}
            {filteredCountries.length === 0 && (
              <div className={styles.noResults}>No countries found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
