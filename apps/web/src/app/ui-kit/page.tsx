import type { Metadata } from 'next'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Input } from '@repo/ui/input'
import { Skeleton } from '@repo/ui/skeleton'
import { CardsGrid } from '@/components/CardsGrid/CardsGrid'
import { WebPageJsonLd } from '@/components/WebPageJsonLd/WebPageJsonLd'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'
import styles from './page.module.css'

const title = 'UI Kit'
const description =
  'MegDB UI kit (noindex): internal @repo/ui component gallery for developers — not part of the public movie/TV experience.'

export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: true },
  alternates: discoverPageAlternates('/ui-kit'),
  ...discoverSocialMeta(title, description, '/ui-kit'),
}

export default function UiKitPage() {
  return (
    <>
      <WebPageJsonLd pathname="/ui-kit" title={title} description={description} />
      <div className={styles.page}>
        <h1 className={styles.title}>Design System — UI Kit</h1>

      <p className={styles.scopeNote}>
        Витрина компонентов <code>@repo/ui</code> (как в админке). Основной сайт MegDB опирается на
        глобальные токены в <code>apps/web/src/styles/globals.css</code> — значения могут
        отличаться. Подробности: <code>docs/design-system.md</code>.
      </p>

      {/* ── Buttons ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Buttons</h2>
        <div className={styles.row}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
        <div className={styles.row}>
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="primary" size="md">
            Medium
          </Button>
          <Button variant="primary" size="lg">
            Large
          </Button>
        </div>
        <div className={styles.row}>
          <Button variant="primary" loading>
            Loading
          </Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
          <Button variant="primary" fullWidth>
            Full Width
          </Button>
        </div>
        <div className={styles.row}>
          <Button type="button" variant="primary" fab iconOnly aria-label="FAB example">
            ↑
          </Button>
          <Button type="button" variant="primary" fab>
            Extended FAB
          </Button>
        </div>
      </section>

      {/* ── Badges ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Badges</h2>
        <div className={styles.row}>
          <Badge variant="genre">Action</Badge>
          <Badge variant="genre">Drama</Badge>
          <Badge variant="rating">★ 8.4</Badge>
          <Badge variant="type">Movie</Badge>
          <Badge variant="type">Series</Badge>
          <Badge variant="new">New</Badge>
          <Badge variant="status">Ended</Badge>
        </div>
      </section>

      {/* ── Inputs ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Inputs</h2>
        <div className={styles.col}>
          <Input label="Email" placeholder="you@example.com" type="email" />
          <Input label="Search" placeholder="Search movies..." type="search" />
          <Input label="Password" placeholder="••••••••" type="password" />
          <Input label="With error" placeholder="Username" error="This field is required" />
        </div>
      </section>

      {/* ── Skeletons ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Skeletons</h2>
        <CardsGrid>
          <Skeleton variant="card" width={140} />
          <Skeleton variant="card" width={140} />
          <Skeleton variant="card" width={140} />
          <Skeleton variant="card" width={140} />
        </CardsGrid>
        <div className={styles.col}>
          <Skeleton variant="title" width={300} />
          <Skeleton variant="text" width={500} />
          <Skeleton variant="text" width={420} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Skeleton variant="badge" />
            <Skeleton variant="badge" />
            <Skeleton variant="badge" />
          </div>
        </div>
      </section>

      {/* ── Colors ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Colors</h2>
        <div className={styles.colorGrid}>
          {[
            ['--color-accent', 'Accent'],
            ['--color-bg', 'Background'],
            ['--color-surface', 'Surface'],
            ['--color-surface-hover', 'Surface Hover'],
            ['--color-text-primary', 'Text Primary'],
            ['--color-text-secondary', 'Text Secondary'],
            ['--color-text-muted', 'Text Muted'],
            ['--color-success', 'Success'],
            ['--color-error', 'Error'],
            ['--color-rating', 'Rating'],
          ].map(([token, name]) => (
            <div key={token} className={styles.colorItem}>
              <div
                className={styles.colorSwatch}
                style={{ background: `var(${token})`, border: '1px solid var(--color-border)' }}
              />
              <span className={styles.colorName}>{name}</span>
              <code className={styles.colorToken}>{token}</code>
            </div>
          ))}
        </div>
      </section>
      </div>
    </>
  )
}
