'use client'

import { useState } from 'react'
import styles from './MovieDetailPage.module.css'

export type MovieFaqItem = {
  question: string
  answer: string
}

type Props = {
  items: MovieFaqItem[]
  movieTitle: string
}

export function MovieFaqAccordion({ items, movieTitle }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const onToggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx))
  }

  return (
    <section className={styles.faq} aria-labelledby="faq-h">
      <h2 id="faq-h" className={styles.sectionHeading}>
        <span className={styles.sectionBar} aria-hidden />
        Frequently Asked Questions about {movieTitle}
      </h2>
      <div className={styles.faqList}>
        {items.map((item, idx) => {
          const isOpen = openIndex === idx
          const panelId = `faq-panel-${idx}`
          const buttonId = `faq-button-${idx}`

          return (
            <div
              key={item.question}
              className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}
            >
              <button
                id={buttonId}
                type="button"
                className={styles.faqSummaryBtn}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => onToggle(idx)}
              >
                <span className={styles.faqQ}>{item.question}</span>
                <span className={styles.faqToggle} aria-hidden>
                  +
                </span>
              </button>
              <div
                id={panelId}
                className={`${styles.faqContent} ${isOpen ? styles.faqContentOpen : ''}`}
                role="region"
                aria-labelledby={buttonId}
              >
                <div className={styles.faqContentInner}>
                  <p className={styles.faqA}>{item.answer}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
