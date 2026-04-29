import { ExternalLink, Play } from 'lucide-react'
import Link from 'next/link'
import { FadeInView } from '@/components/FadeInView/FadeInView'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import styles from './Footer.module.css'
import {
  ActiveNavLink,
  CountUp,
  FooterSpotlight,
  LastUpdated,
  MagneticLink,
  NewsletterForm,
} from './FooterClient'

// ── Data ─────────────────────────────────────────────────

interface FooterLink {
  href: string
  label: string
  isNew?: boolean
}

interface FooterSection {
  id: string
  title: string
  links: readonly FooterLink[]
}

const FOOTER_SECTIONS: readonly FooterSection[] = [
  {
    id: 'browse',
    title: 'Browse',
    links: [
      { href: '/movies', label: 'Movies' },
      { href: '/series', label: 'Series' },
      { href: '/cartoons', label: 'Cartoons' },
      { href: '/tvshows', label: 'TV Shows' },
      { href: '/categories', label: 'Categories' },
      { href: '/movies/random', label: 'Random Pick', isNew: true },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    links: [
      { href: '/profile', label: 'My Profile' },
      { href: '/settings', label: 'Settings' },
      { href: '/login', label: 'Sign In' },
      { href: '/register', label: 'Register' },
    ],
  },
  {
    id: 'support',
    title: 'Support',
    links: [
      { href: '/help', label: 'Help & FAQ' },
      { href: '/about', label: 'About MegDB' },
      { href: '/contact', label: 'Contact' },
      { href: '/accessibility', label: 'Accessibility' },
      { href: '/search', label: 'Search' },
    ],
  },
  {
    id: 'legal',
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Use' },
      { href: '/cookies', label: 'Cookie Policy' },
      { href: '/gdpr', label: 'GDPR' },
      { href: '/dmca', label: 'DMCA' },
    ],
  },
] as const

const SOCIALS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/megdb_com',
    icon: (
      <svg
        className={`${iconSlot.block} ${iconSlot.inline18}`}
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
] as const

const MARQUEE_ITEMS = [
  'Action',
  'Drama',
  'Thriller',
  'Sci-Fi',
  'Horror',
  'Comedy',
  'Romance',
  'Animation',
  'Documentary',
  'Crime',
  'Fantasy',
  'Mystery',
  'Adventure',
  'Family',
  'History',
  'War',
  'Western',
  'Music',
]

// ── Icons ─────────────────────────────────────────────────

function IconPlay() {
  return (
    <Play className={`${iconSlot.block} ${iconSlot.sm}`} fill="currentColor" aria-hidden={true} />
  )
}

function IconExternal() {
  return (
    <ExternalLink
      className={`${styles.externalIcon} ${iconSlot.block} ${iconSlot.inline11}`}
      aria-hidden={true}
    />
  )
}

// ── Component ─────────────────────────────────────────────

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.grain} aria-hidden="true" />
      <FooterSpotlight />
      <div className={styles.topDivider} aria-hidden="true" />

      <div className={styles.inner}>
        {/* ── Stats bar ── */}
        <FadeInView delay={0.05}>
          <div className={styles.statsBar} aria-label="MegDB statistics">
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                <CountUp target={850000} suffix="+" />
              </span>
              <span className={styles.statLabel}>Movies &amp; Shows</span>
            </div>
            <div className={styles.statDivider} aria-hidden="true" />
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                <CountUp target={18} suffix=" genres" />
              </span>
              <span className={styles.statLabel}>Categories</span>
            </div>
            <div className={styles.statDivider} aria-hidden="true" />
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                <CountUp target={195} suffix=" countries" />
              </span>
              <span className={styles.statLabel}>Worldwide</span>
            </div>
            <div className={styles.statDivider} aria-hidden="true" />
            <div className={styles.statItem}>
              <span className={styles.statusRow}>
                <span className={styles.statusDot} aria-hidden="true" />
                <span className={styles.statusText}>All systems operational</span>
              </span>
              <span className={styles.statLabel}>System status</span>
            </div>
          </div>
        </FadeInView>

        {/* ── Main row ── */}
        <FadeInView delay={0.1}>
          <div className={styles.mainRow}>
            {/* Brand + newsletter */}
            <div className={styles.brand}>
              <Link href="/" className={styles.logo} aria-label="MegDB — Home">
                <span className={styles.logoIcon}>
                  <IconPlay />
                </span>
                Meg<span className={styles.logoAccent}>DB</span>
              </Link>

              <p className={styles.tagline}>
                Discover movies and TV series. Browse, compare ratings, and find what to watch next
                — powered by TMDB.
              </p>

              <ul className={styles.socials} aria-label="Social media">
                {SOCIALS.map(({ label, href, icon }) => (
                  <li key={label}>
                    <MagneticLink href={href} label={label} className={styles.socialLink ?? ''}>
                      {icon}
                    </MagneticLink>
                  </li>
                ))}
              </ul>

              {/* Newsletter */}
              <NewsletterForm />
            </div>

            {/* Nav with column dividers */}
            <nav className={styles.navOuter} aria-label="Footer navigation">
              <div className={styles.navGrid}>
                {FOOTER_SECTIONS.map((section, idx) => {
                  const headingId = `footer-nav-${section.id}`
                  return (
                    <div key={section.id} className={styles.navCol}>
                      {/* Vertical divider before each column except first */}
                      {idx > 0 && <div className={styles.colDivider} aria-hidden="true" />}
                      <section className={styles.navSection} aria-labelledby={headingId}>
                        <p id={headingId} className={styles.navTitle}>
                          {section.title}
                        </p>
                        <ul className={styles.navList}>
                          {section.links.map(({ href, label }) => (
                            <li key={href}>
                              <ActiveNavLink
                                href={href}
                                className={styles.navLink ?? ''}
                                activeClassName={styles.navLinkActive ?? ''}
                              >
                                <span className={styles.navLinkInner}>
                                  <span className={styles.navLinkText}>{label}</span>
                                  <span className={styles.navLinkTextHover} aria-hidden="true">
                                    {label}
                                  </span>
                                </span>
                              </ActiveNavLink>
                            </li>
                          ))}
                        </ul>
                      </section>
                    </div>
                  )
                })}
              </div>
            </nav>
          </div>
        </FadeInView>

        {/* ── Marquee ── */}
        <div className={styles.marqueeWrap} aria-hidden="true">
          <div className={styles.marqueeTrack}>
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span key={i} className={styles.marqueeItem}>
                {item}
                <span className={styles.marqueeDot}>·</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Watermark ── */}
        <div className={styles.watermark} aria-hidden="true">
          MEGDB
        </div>

        {/* ── Bottom bar ── */}
        <FadeInView delay={0.05}>
          <div className={styles.bottomBar}>
            <div className={styles.bottomLeft}>
              <p className={styles.copyright}>
                © {year} <span className={styles.copyrightBrand}>MegDB</span>. All rights reserved.
              </p>
              <LastUpdated />
            </div>

            <div className={styles.bottomRight}>
              <p className={styles.tmdbNotice}>
                Data by{' '}
                <a
                  href="https://www.themoviedb.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.tmdbLink}
                >
                  TMDB
                  <IconExternal />
                </a>{' '}
                — not endorsed by TMDB.
              </p>
            </div>
          </div>
        </FadeInView>
      </div>
    </footer>
  )
}
