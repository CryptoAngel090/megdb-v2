import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalDocument, LegalNote } from '@/components/LegalDocument/LegalDocument'
import styles from './page.module.css'

export const revalidate = 86_400

export const metadata: Metadata = {
  title: 'Settings',
  description:
    'MegDB settings: account shortcuts, privacy and cookies, display and motion preferences, notifications, and data requests.',
}

const UPDATED = 'April 21, 2026'

export default function SettingsPage() {
  return (
    <div className={styles.page}>
      <LegalDocument title="Settings" lastUpdated={UPDATED}>
        <h2 id="overview">1. Overview</h2>
        <p>
          This page collects the main controls and policies that affect your MegDB experience. Some
          toggles live inside the product UI when you are signed in; others are managed through your
          browser or operating system. We are expanding account-level settings as authentication and
          profiles mature.
        </p>

        <h2 id="account">2. Account &amp; profile</h2>
        <ul>
          <li>
            <Link href="/login">Sign in</Link> — access registered features when enabled.
          </li>
          <li>
            <Link href="/profile">Profile</Link> — display name, avatar (if supported), and public
            handle settings.
          </li>
          <li>
            <Link href="/watchlist">Watchlist</Link> — saved titles; export or delete may be offered
            as GDPR tooling lands.
          </li>
          <li>
            <Link href="/notifications">Notifications</Link> — email or push preferences where
            implemented.
          </li>
        </ul>
        <p>
          To change the email on your account or delete the account entirely, use in-app flows when
          available or email <strong>privacy@megdb.com</strong> with the subject line{' '}
          <code>Account request</code>.
        </p>

        <h2 id="privacy">3. Privacy, cookies, and data rights</h2>
        <ul>
          <li>
            <Link href="/privacy">Privacy Policy</Link> — what we collect and why.
          </li>
          <li>
            <Link href="/cookies">Cookie Policy</Link> — storage technologies and consent.
          </li>
          <li>
            <Link href="/gdpr">GDPR &amp; EU/UK information</Link> — rights, transfers, and
            supervisory authorities.
          </li>
        </ul>
        <p>
          <strong>Data subject requests:</strong> email <strong>privacy@megdb.com</strong> from the
          address you used to register (or describe your account identifiers). We verify ownership
          before exporting or deleting data where required by law.
        </p>
        <LegalNote>
          U.S. residents: many states now provide opt-out, access, deletion, correction, and appeal
          rights — see the U.S. section of our Privacy Policy. Browser signals such as GPC may be
          honoured where legally required.
        </LegalNote>

        <h2 id="display">4. Display, language, and motion</h2>
        <p>
          <strong>Theme:</strong> MegDB uses a dark-first interface aligned with its design system.
          If we ship explicit light/high-contrast themes, they will appear here or in the header
          menu.
        </p>
        <p>
          <strong>Language:</strong> the interface is English-first in 2026; additional locales may
          roll out with TMDB language parameters for metadata. Your browser’s language header may
          influence auxiliary content where supported.
        </p>
        <p>
          <strong>Reduced motion:</strong> enable “Reduce motion” (macOS), “Show animations in
          Windows” off, or equivalent Android/iOS accessibility settings. Components using Framer
          Motion or CSS transitions should respect <code>prefers-reduced-motion: reduce</code> where
          implemented — report gaps via <Link href="/accessibility">Accessibility</Link>.
        </p>

        <h2 id="search-behavior">5. Search &amp; browse defaults</h2>
        <p>
          Default catalogue language for TMDB-backed API calls may follow product configuration (for
          example regional locale). If titles appear in an unexpected language, check TMDB’s
          translation coverage and our <Link href="/help">Help</Link> page for search tips.
        </p>

        <h2 id="third-party">6. Linked services &amp; sign-in providers</h2>
        <p>
          When OAuth or social login is available, you manage connected apps in the provider’s own
          security dashboard (Google, Apple, GitHub, etc.). Revoking MegDB there may sign you out
          but not automatically erase historical logs — use privacy requests for erasure where
          applicable.
        </p>

        <h2 id="parental">7. Parental and household controls</h2>
        <p>
          MegDB is not a child-directed service. Parents should use device-level parental controls
          and streaming app kid profiles for playback. We may add maturity filters for browse
          surfaces in line with TMDB certification metadata — watch release notes.
        </p>

        <h2 id="danger">8. Danger zone</h2>
        <p>
          <strong>Delete account:</strong> when self-service deletion ships, you will find it under
          Profile or here. Until then, email <strong>privacy@megdb.com</strong> with “Delete my
          account” and your registered email. Some billing or fraud-prevention records may be
          retained as described in the Privacy Policy.
        </p>
        <p>
          <strong>Export data:</strong> request a machine-readable export where legally required;
          allow reasonable processing time.
        </p>

        <h2 id="contact">9. Need help?</h2>
        <p>
          <Link href="/help">Help &amp; Support</Link> · <Link href="/contact">Contact</Link>
        </p>
      </LegalDocument>
    </div>
  )
}
