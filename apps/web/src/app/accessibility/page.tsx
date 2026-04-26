import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalDocument, LegalNote } from '@/components/LegalDocument/LegalDocument'
import { WebPageJsonLd } from '@/components/WebPageJsonLd/WebPageJsonLd'
import { discoverSocialMeta } from '@/lib/seoSocial'
import styles from './page.module.css'

export const revalidate = 86_400

const title = 'Accessibility'
const description =
  'MegDB accessibility statement: WCAG 2.2, European Accessibility Act context, known limitations, and how to report barriers — April 2026.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/accessibility' },
  ...discoverSocialMeta(title, description, '/accessibility'),
}

const UPDATED = 'April 21, 2026'

export default function AccessibilityPage() {
  return (
    <>
      <WebPageJsonLd pathname="/accessibility" title={title} description={description} />
      <div className={styles.page}>
      <LegalDocument title="Accessibility" lastUpdated={UPDATED}>
        <h2 id="commitment">1. Commitment</h2>
        <p>
          MegDB is committed to making its web experience perceivable, operable, understandable, and
          robust for people with disabilities. We use the Web Content Accessibility Guidelines (
          <strong>WCAG</strong>) 2.x as a technical reference and continuously remediate issues
          found through testing and user reports.
        </p>

        <h2 id="wcag">2. WCAG 2.2 baseline</h2>
        <p>
          WCAG 2.2 (W3C Recommendation, October 2023) adds success criteria on top of 2.1 —
          including, at Level AA, requirements such as <strong>Focus Not Obscured (Minimum)</strong>{' '}
          (2.4.11), <strong>Dragging Movements</strong> (2.5.7), and{' '}
          <strong>Target Size (Minimum)</strong> (2.5.8). These criteria matter for keyboard users,
          people with motor impairments, and anyone using zoomed or small screens.
        </p>
        <p>
          Authoritative overview from the European Commission’s Accessible EU resource centre:{' '}
          <a
            href="https://accessible-eu-centre.ec.europa.eu/content-corner/digital-library/web-content-accessibility-guidelines-wcag-22_en"
            rel="noopener noreferrer"
          >
            WCAG 2.2 — Accessible EU
          </a>
          .
        </p>

        <h2 id="eaa">3. European Accessibility Act context</h2>
        <p>
          The <strong>European Accessibility Act</strong> (Directive (EU) 2019/882) harmonises
          accessibility requirements for certain products and services in the EU. Member States
          transposed the directive by June 2022; many obligations applying to covered services
          became enforceable from <strong>28 June 2025</strong> onward, with national authorities
          supervising compliance. Harmonised standard <strong>EN 301 549</strong> (which references
          WCAG for ICT) is commonly used to demonstrate technical alignment for covered procurements
          and services.
        </p>
        <LegalNote>
          Whether MegDB falls within every national EAA category depends on how each Member State
          classifies comparable consumer-facing digital services — we nonetheless pursue
          WCAG-aligned engineering because it benefits all users and aligns with public-sector
          procurement expectations across Europe.
        </LegalNote>

        <h2 id="measures">4. Measures we take</h2>
        <ul>
          <li>
            <strong>Keyboard:</strong> skip link to main content; focusable controls on primary
            navigation and shelves where components support it — report gaps.
          </li>
          <li>
            <strong>Semantics:</strong> structured headings, labels on interactive controls, and
            meaningful button/link text where implemented.
          </li>
          <li>
            <strong>Motion:</strong> components should respect <code>prefers-reduced-motion</code>;
            file issues if you encounter parallax or animation that cannot be suppressed.
          </li>
          <li>
            <strong>Contrast &amp; typography:</strong> design tokens target high contrast on dark
            backgrounds; individual components may still need fixes as the UI evolves.
          </li>
          <li>
            <strong>Images:</strong> decorative images should use empty alt text; informative
            posters need human readable descriptions — we improve these incrementally.
          </li>
        </ul>

        <h2 id="compatibility">5. Assistive technology compatibility</h2>
        <p>
          MegDB aims to support recent combinations of browsers and assistive technologies (for
          example NVDA, JAWS, VoiceOver, TalkBack). The web moves quickly — if a release regresses
          your setup, tell us the exact browser, AT version, and URL.
        </p>

        <h2 id="limits">6. Known limitations (April 2026)</h2>
        <ul>
          <li>
            Complex discovery filters and infinite-scroll shelves can be exhausting with screen
            readers — we are evaluating simpler modes.
          </li>
          <li>
            Third-party embeds (trailers, social widgets) may not meet our internal bar — we prefer
            first-party or configurable embeds.
          </li>
          <li>
            Search autocomplete timing may race with screen reader announcements; we welcome
            reproducible tickets.
          </li>
        </ul>

        <h2 id="feedback">7. Feedback &amp; enforcement</h2>
        <p>
          Email <strong>a11y@megdb.com</strong> with:
        </p>
        <ul>
          <li>Page URL and steps to reproduce</li>
          <li>Browser + version, OS, assistive technology + version</li>
          <li>Expected vs actual behaviour</li>
          <li>Screenshot or screen recording if helpful</li>
        </ul>
        <p>
          We track accessibility bugs alongside security and privacy. If national law gives you the
          right to escalate to an equality body or market surveillance authority, you may do so
          without prejudice.
        </p>

        <h2 id="vpat">8. VPAT / ACOP</h2>
        <p>
          Enterprise customers may request a Voluntary Product Accessibility Template (VPAT) or
          similar conformance report for a specific MegDB build — contact{' '}
          <a href="mailto:legal@megdb.com">legal@megdb.com</a> with procurement details. Public
          summaries may be published as the product matures.
        </p>

        <h2 id="roadmap">9. 2026 priorities</h2>
        <p>
          Upcoming work typically includes: broader automated axe-core/Playwright checks in CI,
          manual screen reader passes on home and discover flows, focus management in modals and
          drawers, and ensuring new shelves meet target size and focus visibility criteria
          introduced in WCAG 2.2 AA.
        </p>

        <h2 id="related">10. Related</h2>
        <p>
          <Link href="/help">Help</Link> · <Link href="/settings">Settings</Link> ·{' '}
          <Link href="/privacy">Privacy</Link>
        </p>
      </LegalDocument>
    </div>
    </>
  )
}
