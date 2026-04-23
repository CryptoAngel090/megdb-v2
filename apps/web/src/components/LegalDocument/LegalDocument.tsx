import type { ReactNode } from 'react'
import styles from './LegalDocument.module.css'

interface LegalDocumentProps {
  title: string
  lastUpdated: string
  children: ReactNode
}

export function LegalNote({ children }: { children: ReactNode }) {
  return <p className={styles.note}>{children}</p>
}

export function LegalDocument({ title, lastUpdated, children }: LegalDocumentProps) {
  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.h1}>{title}</h1>
        <p className={styles.meta}>Last updated: {lastUpdated}</p>
      </header>
      <p className={styles.disclaimer}>
        This page is provided for general information only. It does not constitute legal,
        professional, or regulatory advice. If you need advice about your specific situation,
        consult a qualified professional.
      </p>
      <article className={styles.article}>{children}</article>
    </div>
  )
}
