import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalDocument, LegalNote } from '@/components/LegalDocument/LegalDocument'
import styles from './page.module.css'

export const revalidate = 86_400

export const metadata: Metadata = {
  title: 'Help & Support',
  description:
    'MegDB help center: search, browse, accounts, troubleshooting, TMDB data, rate limits, and how to get support in 2026.',
}

const UPDATED = 'April 21, 2026'

export default function HelpPage() {
  return (
    <div className={styles.page}>
      <LegalDocument title="Help &amp; Support" lastUpdated={UPDATED}>
        <h2 id="start">1. Getting started</h2>
        <p>
          MegDB is a discovery service for movies, series, cartoons, TV shows, and people in the
          entertainment catalogue. We help you browse curated shelves, open detail-style routes
          where implemented, and <Link href="/search">search</Link> the catalogue backed by The
          Movie Database (TMDB). MegDB does not replace your streaming provider — check each title’s
          availability in your region on licensed platforms.
        </p>
        <ul>
          <li>
            <strong>Home</strong> — hero and editorial rails (trending, new releases, best-of
            lists).
          </li>
          <li>
            <strong>Browse hubs</strong> — <Link href="/movies">Movies</Link>,{' '}
            <Link href="/series">Series</Link>, <Link href="/cartoons">Cartoons</Link>,{' '}
            <Link href="/tvshows">TV Shows</Link>, <Link href="/categories">Categories</Link>.
          </li>
          <li>
            <strong>Search</strong> — type at least two characters in the header; choose a result or
            open the <Link href="/search">full search page</Link> with <code>?q=</code> in the URL.
          </li>
        </ul>

        <h2 id="search-help">2. Search tips</h2>
        <p>
          Search queries are sent to MegDB’s <code>/api/search</code> endpoint, which calls TMDB’s
          multi-search API. Tips:
        </p>
        <ul>
          <li>Use official title spellings when possible (including punctuation).</li>
          <li>
            Try shorter fragments if a long title fails (for example the unique part of a franchise
            name).
          </li>
          <li>
            People search returns actors and crew; open a person card to see known-for context when
            available.
          </li>
          <li>
            Results are limited to the first page of TMDB results for responsiveness — refine your
            query if you do not see an expected title.
          </li>
        </ul>
        <LegalNote>
          The search API applies a <strong>per-IP rate limit</strong> (approximately several dozen
          requests per rolling minute). If you receive HTTP 429, wait for the indicated{' '}
          <code>Retry-After</code> period. This protects TMDB’s infrastructure and keeps MegDB
          compliant with fair-use expectations.
        </LegalNote>

        <h2 id="data">3. Catalogue data, images, and accuracy</h2>
        <p>
          Posters, backdrops, plot summaries, cast lists, dates, and ratings come from TMDB
          contributors and algorithms. MegDB may cache responses for performance. If you spot an
          error:
        </p>
        <ul>
          <li>
            For catalogue corrections, use TMDB’s own contribution workflows — MegDB cannot edit
            their master record for you.
          </li>
          <li>
            If our site displays stale data after TMDB fixed it, try a hard refresh; caching windows
            vary by route (see our engineering docs or <Link href="/about">About</Link>).
          </li>
        </ul>
        <p>
          By using MegDB you agree to respect{' '}
          <a
            href="https://www.themoviedb.org/documentation/api/terms-of-use"
            rel="noopener noreferrer"
          >
            TMDB API terms
          </a>{' '}
          and attribution rules.
        </p>

        <h2 id="account">4. Accounts, watchlist, and sign-in</h2>
        <p>
          Account features (watchlist, profile, notifications) may roll out progressively. If
          sign-in is unavailable or returns errors, confirm your browser allows cookies for MegDB,
          disable conflicting extensions temporarily, and try another network to rule out corporate
          blocking.
        </p>
        <p>
          Lost access: use your provider’s password reset (email, OAuth, etc.). MegDB support cannot
          bypass your identity provider’s security checks.
        </p>

        <h2 id="devices">5. Browsers, devices, and performance</h2>
        <p>
          MegDB targets modern evergreen browsers (recent Chrome, Firefox, Safari, Edge). For best
          results:
        </p>
        <ul>
          <li>Keep the browser updated and enable JavaScript.</li>
          <li>
            On low-power devices, reduce open tabs; image-heavy shelves stream from TMDB CDNs and
            require bandwidth.
          </li>
          <li>
            If animations feel uncomfortable, enable <strong>Reduce motion</strong> in your OS —
            MegDB respects <code>prefers-reduced-motion</code> in supported components (see{' '}
            <Link href="/accessibility">Accessibility</Link>).
          </li>
        </ul>

        <h2 id="privacy-security">6. Privacy, security, and abuse</h2>
        <p>
          For how we handle personal data, cookies, GDPR-related information, and U.S. state rights,
          read our <Link href="/privacy">Privacy Policy</Link>,{' '}
          <Link href="/cookies">Cookie Policy</Link>, and <Link href="/gdpr">GDPR page</Link>.
          Security practices evolve — as of 2026, industry guidance continues to emphasise layered
          defences (TLS, rate limits, dependency patching, and least-privilege access for
          operators).
        </p>
        <p>
          Report security vulnerabilities to <strong>security@megdb.com</strong> (if published) with
          encrypted detail if needed. Do not perform destructive testing without permission.
        </p>
        <p>
          Report spam, harassment, or copyright issues via <Link href="/contact">Contact</Link> or{' '}
          <Link href="/dmca">DMCA</Link> as appropriate.
        </p>

        <h2 id="legal-streaming">7. Streaming and geo-blocking</h2>
        <p>
          Availability on Netflix, Prime Video, Disney+, regional broadcasters, or cinemas changes
          constantly. MegDB may show metadata for titles that are not licensed where you live.
          Always verify playback rights with the service you pay for or with local distributors.
        </p>

        <h2 id="enterprise">8. API, partnerships, and press</h2>
        <p>
          MegDB’s public HTTP APIs are subject to change and may be rate-limited. Commercial data
          licensing, white-label partnerships, or press inquiries should go through{' '}
          <Link href="/contact">Contact</Link> with a clear subject line — we prioritise good-faith
          technical reports and business development separately from consumer support.
        </p>

        <h2 id="roadmap">9. Product status (spring 2026)</h2>
        <p>
          Streaming and discovery products in 2026 continue to integrate stricter bot detection,
          privacy signals (such as Global Privacy Control in several U.S. states), and accessibility
          expectations tied to WCAG 2.2-level guidance in many procurement and regulatory contexts.
          MegDB iterates on these themes as the stack matures — see{' '}
          <Link href="/accessibility">Accessibility</Link> for our conformance statement direction.
        </p>

        <h2 id="still-stuck">10. Still stuck?</h2>
        <p>
          Email <strong>support@megdb.com</strong> with screenshots, your browser version, and steps
          to reproduce. We cannot guarantee individual response SLAs for free-tier users, but we
          read every good-faith report.
        </p>
        <p>
          <Link href="/contact">Contact page</Link> · <Link href="/settings">Settings</Link>
        </p>
      </LegalDocument>
    </div>
  )
}
