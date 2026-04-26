import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalDocument, LegalNote } from '@/components/LegalDocument/LegalDocument'
import { WebPageJsonLd } from '@/components/WebPageJsonLd/WebPageJsonLd'
import { discoverSocialMeta } from '@/lib/seoSocial'
import styles from './page.module.css'

export const revalidate = 86_400

const title = 'Contact'
const description =
  'Reach MegDB for support, privacy requests, legal notices, security reports, and partnerships — April 2026 routing table.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/contact' },
  ...discoverSocialMeta(title, description, '/contact'),
}

const UPDATED = 'April 21, 2026'

export default function ContactPage() {
  return (
    <>
      <WebPageJsonLd pathname="/contact" title={title} description={description} />
      <div className={styles.page}>
      <LegalDocument title="Contact MegDB" lastUpdated={UPDATED}>
        <h2 id="routing">1. Choose the right inbox</h2>
        <p>
          We route messages faster when the subject line matches the table below. Replace{' '}
          <code>@megdb.com</code> domains with your production domain if different.
        </p>
        <ul>
          <li>
            <strong>General &amp; product feedback</strong> —{' '}
            <a href="mailto:hello@megdb.com">hello@megdb.com</a>
          </li>
          <li>
            <strong>Help &amp; troubleshooting</strong> —{' '}
            <a href="mailto:support@megdb.com">support@megdb.com</a> (see also{' '}
            <Link href="/help">Help &amp; Support</Link>)
          </li>
          <li>
            <strong>Privacy &amp; data rights (GDPR / UK / U.S. states)</strong> —{' '}
            <a href="mailto:privacy@megdb.com">privacy@megdb.com</a>
          </li>
          <li>
            <strong>Legal, contracts, law enforcement</strong> —{' '}
            <a href="mailto:legal@megdb.com">legal@megdb.com</a>
          </li>
          <li>
            <strong>Copyright / DMCA (United States)</strong> —{' '}
            <a href="mailto:dmca@megdb.com">dmca@megdb.com</a> (<Link href="/dmca">policy</Link>)
          </li>
          <li>
            <strong>Security vulnerabilities</strong> —{' '}
            <a href="mailto:security@megdb.com">security@megdb.com</a> (no public exploit code)
          </li>
          <li>
            <strong>Accessibility barriers</strong> —{' '}
            <a href="mailto:a11y@megdb.com">a11y@megdb.com</a> (
            <Link href="/accessibility">statement</Link>)
          </li>
          <li>
            <strong>Press &amp; media</strong> —{' '}
            <a href="mailto:press@megdb.com">press@megdb.com</a>
          </li>
        </ul>
        <LegalNote>
          Mailboxes must be activated on your mail host — the addresses above are the intended
          routing targets for a production MegDB deployment.
        </LegalNote>

        <h2 id="postal">2. Postal &amp; registered entity</h2>
        <p>
          If your jurisdiction requires a postal address for legal notices, publish the registered
          business name and address of the MegDB operator here once finalised. Until then, initiate
          contact through <a href="mailto:legal@megdb.com">legal@megdb.com</a> for the correct
          service address.
        </p>

        <h2 id="social">3. Social</h2>
        <p>
          Instagram:{' '}
          <a href="https://www.instagram.com/megdb_com" rel="noopener noreferrer">
            @megdb_com
          </a>
          . Social DMs are <strong>not</strong> a substitute for legal or privacy requests — use
          email so we can track threads.
        </p>

        <h2 id="response">4. Response times</h2>
        <p>
          Consumer support is best-effort. Many privacy laws require responses within specific
          windows (for example GDPR within one month with possible extension). We prioritise:
        </p>
        <ol>
          <li>Security issues that indicate active abuse or data exposure.</li>
          <li>Verifiable legal process and DMCA notices that meet statutory requirements.</li>
          <li>Data subject requests with sufficient identity verification.</li>
          <li>General feedback and feature ideas.</li>
        </ol>

        <h2 id="verify">5. Verification &amp; scams</h2>
        <p>
          MegDB staff will not ask for your password, one-time codes, or crypto transfers by email.
          Report impersonation to <a href="mailto:security@megdb.com">security@megdb.com</a>. In
          2026 phishing continues to spike around entertainment brands — inspect domains carefully.
        </p>

        <h2 id="eu-rep">6. EU / UK representatives</h2>
        <p>
          If we appoint an EU Article 27 representative or UK representative, their name and contact
          details will appear in the <Link href="/privacy">Privacy Policy</Link> and here. As of
          this revision, check the policy header for the latest entry.
        </p>

        <h2 id="regulators">7. Regulatory contacts (users)</h2>
        <p>
          You may always contact your national data protection authority — links are listed on our{' '}
          <Link href="/gdpr">GDPR page</Link>. MegDB does not require you to contact us before
          escalating to a regulator, though we appreciate the chance to resolve issues first.
        </p>

        <h2 id="related">8. Related pages</h2>
        <p>
          <Link href="/help">Help</Link> · <Link href="/accessibility">Accessibility</Link> ·{' '}
          <Link href="/settings">Settings</Link>
        </p>
      </LegalDocument>
    </div>
    </>
  )
}
