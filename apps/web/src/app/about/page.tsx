import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalDocument, LegalNote } from '@/components/LegalDocument/LegalDocument'
import { WebPageJsonLd } from '@/components/WebPageJsonLd/WebPageJsonLd'
import { buildAboutOrganizationStructuredData } from '@/lib/jsonLdSite'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'
import styles from './page.module.css'

/** @sync `ROUTE_REVALIDATE_STATIC_COPY` in `@/lib/cachePolicy` */
export const revalidate = 86_400

const title = 'About MegDB'
const description =
  'MegDB is an English-first movie and TV discovery product: how we use the TMDB API, editorial rules for homepage rails, and what we are not (no streaming host). Updated for 2026.'

export const metadata: Metadata = {
  title,
  description,
  alternates: discoverPageAlternates('/about'),
  ...discoverSocialMeta(title, description, '/about'),
}

const UPDATED = 'April 21, 2026'

export default function AboutPage() {
  const organizationLd = buildAboutOrganizationStructuredData()

  return (
    <>
      <WebPageJsonLd pathname="/about" title={title} description={description} />
      <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <LegalDocument title="About MegDB" lastUpdated={UPDATED}>
        <h2 id="mission">1. Mission</h2>
        <p>
          MegDB helps people decide <strong>what to watch next</strong> by surfacing well-structured
          discovery experiences: curated home rails, genre and studio exploration, fast search, and
          detail pages where implemented. We prioritise clarity, performance, and respect for rights
          holders’ and users’ expectations in 2026’s regulatory environment (privacy, accessibility,
          and fair API use).
        </p>

        <h2 id="catalogue">2. Catalogue and TMDB</h2>
        <p>
          MegDB’s catalogue metadata, imagery, and much of its search index are powered by{' '}
          <a href="https://www.themoviedb.org/" rel="noopener noreferrer">
            The Movie Database (TMDB)
          </a>
          , a community-driven database. TMDB is an independent project — MegDB is not endorsed by
          or affiliated with TMDB beyond API usage under their terms.
        </p>
        <ul>
          <li>
            We store and display TMDB paths (for example poster filenames) and compose CDN URLs at
            render time.
          </li>
          <li>
            Ratings, popularity, and release dates reflect TMDB’s algorithms and contributor edits
            at the time our caches refresh.
          </li>
          <li>
            You can contribute corrections directly on TMDB; those improvements propagate to
            ecosystem partners over time.
          </li>
        </ul>
        <p>
          Required reading:{' '}
          <a
            href="https://www.themoviedb.org/documentation/api/terms-of-use"
            rel="noopener noreferrer"
          >
            TMDB API terms of use
          </a>
          .
        </p>

        <h2 id="editorial">3. Editorial approach</h2>
        <p>
          Beyond raw popularity, MegDB experiments with rails that emphasise{' '}
          <strong>recency</strong>, <strong>critical acclaim</strong>, and{' '}
          <strong>mainstream blockbuster</strong> filters so shelves feel purposeful rather than
          random TMDB dumps. Logic lives in our open codebase (see{' '}
          <code>apps/web/src/lib/tmdb.ts</code> and related modules) — transparency matters when
          users ask “why is this title here?”.
        </p>

        <h2 id="streaming">4. What MegDB is not</h2>
        <ul>
          <li>
            We are <strong>not</strong> a streaming host — we do not provide licensed playback as a
            primary service.
          </li>
          <li>
            We are <strong>not</strong> a social network — community features may arrive later but
            are not the core in 2026.
          </li>
          <li>
            We are <strong>not</strong> a paywalled critics’ publication — commentary is minimal and
            functional.
          </li>
        </ul>

        <h2 id="tech">5. Technology snapshot (April 2026)</h2>
        <p>
          MegDB is built with <strong>Next.js</strong> (App Router), <strong>React</strong>,
          TypeScript, and CSS modules aligned to a compact design-token system. Data is fetched from
          TMDB over HTTPS with caching tuned per surface (for example faster refresh for trending,
          slower for stable charts). Rate limiting protects shared infrastructure on search and
          discover API routes.
        </p>
        <LegalNote>
          Industry context: EU digital rules debated in 2025–2026 (often summarised as “Digital
          Omnibus”) intersect with how products log data, train models, and document automated
          decisions. MegDB’s current surfaces are metadata-driven discovery — we document
          AI-adjacent regulation on our <Link href="/privacy">Privacy Policy</Link> where relevant.
        </LegalNote>

        <h2 id="brand">6. Brand and community</h2>
        <p>
          Follow updates on{' '}
          <a href="https://www.instagram.com/megdb_com" rel="noopener noreferrer">
            Instagram @megdb_com
          </a>
          . For press, partnerships, or corrections about MegDB itself (not TMDB metadata), use{' '}
          <Link href="/contact">Contact</Link>.
        </p>

        <h2 id="legal">7. Legal &amp; policies</h2>
        <p>
          <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> ·{' '}
          <Link href="/cookies">Cookies</Link> · <Link href="/gdpr">GDPR</Link> ·{' '}
          <Link href="/dmca">DMCA</Link>
        </p>

        <h2 id="thanks">8. Acknowledgements</h2>
        <p>
          Thanks to TMDB contributors worldwide for maintaining an indispensable open catalogue, and
          to users who file thoughtful bug reports. Built with care for keyboard users,
          reduced-motion preferences, and the messy reality of global release windows.
        </p>
      </LegalDocument>
    </div>
    </>
  )
}
