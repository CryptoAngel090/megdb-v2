'use client'

import { useState } from 'react'
import styles from './MovieOverviewBlock.module.css'

type MovieOverviewBlockProps = {
  text: string
}

export function MovieOverviewBlock({ text }: MovieOverviewBlockProps) {
  const [expanded, setExpanded] = useState(true)
  const isCollapsed = !expanded

  return (
    <div className={styles.root}>
      <p className={`${styles.overview} ${isCollapsed ? styles.overviewCollapsed : ''}`}>{text}</p>
      <button
        type="button"
        className={styles.readMoreButton}
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        {expanded ? 'Read less' : 'Read more'}
      </button>
    </div>
  )
}
