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
  return (
    <section className={styles.faq} aria-labelledby="faq-h">
      <h2 id="faq-h" className={styles.sectionHeading}>
        <span className={styles.sectionBar} aria-hidden />
        Frequently Asked Questions about {movieTitle}
      </h2>
      <div className={styles.faqList}>
        {items.map((item, idx) => {
          const panelId = `faq-panel-${idx}`
          const summaryId = `faq-summary-${idx}`

          return (
            <details key={item.question} className={styles.faqDetails} open={idx === 0}>
              <summary id={summaryId} className={styles.faqSummaryBtn}>
                <span className={styles.faqQ}>{item.question}</span>
                <span className={styles.faqToggle} aria-hidden>
                  +
                </span>
              </summary>
              <div id={panelId} className={styles.faqContent} role="region" aria-labelledby={summaryId}>
                <div className={styles.faqContentInner}>
                  <p className={styles.faqA}>{item.answer}</p>
                </div>
              </div>
            </details>
          )
        })}
      </div>
    </section>
  )
}
