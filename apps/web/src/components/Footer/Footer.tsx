import Link from 'next/link'
import styles from './Footer.module.css'

interface FooterLink {
  href: string
  label: string
}

interface FooterSection {
  id: string
  title: string
  links: readonly FooterLink[]
}

/** 2×2: row1 Browse | Account — row2 Support | Legal */
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
    ],
  },
  {
    id: 'account',
    title: 'Account',
    links: [
      /* /watchlist, /profile, /notifications, /login — нет роутов в app; не ведём на 404 для SEO/UX */
      { href: '/settings', label: 'Settings' },
    ],
  },
  {
    id: 'support',
    title: 'Support',
    links: [
      { href: '/help', label: 'Help & Support' },
      { href: '/settings', label: 'Settings' },
      { href: '/search', label: 'Search' },
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
      { href: '/accessibility', label: 'Accessibility' },
    ],
  },
  {
    id: 'legal',
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: '/cookies', label: 'Cookies' },
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
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
] as const

function ExternalIcon() {
  return (
    <svg
      className={styles.externalIcon}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden="true"
    >
      <path
        d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.inner}>
        <div className={styles.brandStack}>
          <Link href="/" className={styles.logo} aria-label="MegDB — Home">
            Meg<span className={styles.logoAccent}>DB</span>
          </Link>
          <p className={styles.tagline}>
            Discover movies and TV series: browse, compare ratings, and pick what to watch next —
            powered by TMDB data.
          </p>
        </div>

        <nav className={styles.navWrap} aria-label="Footer navigation">
          <div className={styles.menuGrid}>
            {FOOTER_SECTIONS.map((section) => {
              const headingId = `footer-${section.id}`
              return (
                <section key={section.id} className={styles.menuBlock} aria-labelledby={headingId}>
                  <p id={headingId} className={styles.menuTitle}>
                    {section.title}
                  </p>
                  <ul className={styles.menuList}>
                    {section.links.map(({ href, label }) => (
                      <li key={href} className={styles.menuListItem}>
                        <Link href={href} className={styles.navLink}>
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        </nav>

        <ul className={styles.socials} aria-label="Social media">
          {SOCIALS.map(({ label, href, icon }) => (
            <li key={label}>
              <a
                href={href}
                className={styles.socialLink}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
              >
                {icon}
              </a>
            </li>
          ))}
        </ul>

        <p className={styles.copyright}>
          © {year} <span className={styles.copyrightBrand}>MegDB</span>. All rights reserved. Data
          provided by{' '}
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.copyrightLink}
          >
            TMDB
            <ExternalIcon />
          </a>
          . This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </div>
    </footer>
  )
}
