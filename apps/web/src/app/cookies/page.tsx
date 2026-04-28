import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalDocument, LegalNote } from '@/components/LegalDocument/LegalDocument'
import { WebPageJsonLd } from '@/components/WebPageJsonLd/WebPageJsonLd'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'
import styles from './page.module.css'

/** @sync `ROUTE_REVALIDATE_STATIC_COPY` in `@/lib/cachePolicy` */
export const revalidate = 86_400

const title = 'Cookie Policy'
const description =
  'MegDB Cookie Policy: essential vs optional storage, consent signals (GPC where applicable), EU/UK ePrivacy context, and how to change browser settings — April 2026.'

export const metadata: Metadata = {
  title,
  description,
  alternates: discoverPageAlternates('/cookies'),
  ...discoverSocialMeta(title, description, '/cookies'),
}

const UPDATED = 'April 21, 2026'

export default function CookiesPage() {
  return (
    <>
      <WebPageJsonLd
        pathname="/cookies"
        title={title}
        description={description}
        breadcrumbParent={{ name: 'Legal & privacy', pathname: '/privacy' }}
      />
      <div className={styles.page}>
      <LegalDocument title="Cookie Policy" lastUpdated={UPDATED}>
        <h2 id="intro">1. Introduction</h2>
        <p>
          This Cookie Policy explains how MegDB (“we”, “us”) uses cookies and similar technologies
          that store or access information on your device when you visit our website or use our web
          applications. It should be read together with our{' '}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
        <p>
          Regulators increasingly refer to <strong>storage and access technologies</strong> broadly
          — not only classic HTTP cookies but also pixels, scripts that set identifiers, browser
          storage APIs, and fingerprinting-like signals. Where this policy says “cookies”, it
          includes those comparable technologies unless we specify otherwise.
        </p>

        <h2 id="why">2. Why we use these technologies</h2>
        <p>We use cookies and similar tools for purposes such as:</p>
        <ul>
          <li>
            <strong>Strictly necessary / essential:</strong> enabling core navigation, load
            balancing, security controls, session continuity for logged-in users, and remembering
            privacy choices.
          </li>
          <li>
            <strong>Functional preferences:</strong> remembering interface choices (for example
            theme or language) where we implement them with storage on your device.
          </li>
          <li>
            <strong>Analytics:</strong> understanding aggregate traffic, feature usage, and
            performance (for example which shelves load slowly).
          </li>
          <li>
            <strong>Marketing / attribution (if ever enabled):</strong> measuring campaign
            effectiveness or limiting how often you see a promotion.
          </li>
        </ul>

        <h2 id="consent">3. Consent and lawfulness</h2>
        <p>
          In the European Economic Area, United Kingdom, and several other jurisdictions, storing or
          accessing information on a user’s terminal equipment generally requires a lawful basis.
          For non-essential technologies (most analytics, advertising, and many personalisation
          tools), regulators typically expect <strong>prior, informed consent</strong> that is
          freely given, specific, informed, and unambiguous — not pre-ticked boxes or “bundled”
          consent that hides granular choices.
        </p>
        <p>
          MegDB aims to block or withhold non-essential tags until you opt in where required. You
          can revisit your choices at any time (for example through a “Cookie settings” link or
          banner control when we ship it). Withdrawing consent should be as easy as giving it.
        </p>
        <LegalNote>
          United Kingdom context: the ICO continues to update guidance on storage and access
          technologies. The Data (Use and Access) Act 2025 received Royal Assent on 19 June 2025;
          regulators have been aligning practical guidance with statutory changes. We monitor ICO
          publications and adapt our consent UX and documentation accordingly.
        </LegalNote>

        <h2 id="strictly-necessary">4. “Strictly necessary” exception — narrow scope</h2>
        <p>
          A strictly necessary cookie (or equivalent) is one that is <strong>essential</strong> to
          provide an online service the user explicitly requested — for example maintaining a
          session after login, enforcing security tokens, or storing a consent record so the site
          does not repeatedly ask the same question.
        </p>
        <p>
          General analytics, A/B testing, broad personalisation for convenience, or advertising
          measurement are <strong>not</strong> strictly necessary merely because they “improve” the
          product; those purposes typically require consent in the UK/EEA model unless another
          lawful basis clearly applies and is documented.
        </p>

        <h2 id="inventory">5. Typical cookies you may see</h2>
        <p>
          Exact names and lifetimes can change with deployments. Examples of categories (not an
          exhaustive live list):
        </p>
        <ul>
          <li>
            <strong>Session / auth:</strong> maintains signed-in state; often session-scoped or
            short-lived.
          </li>
          <li>
            <strong>Security:</strong> CSRF tokens, bot-management challenge cookies, or WAF
            identifiers.
          </li>
          <li>
            <strong>Consent state:</strong> records your cookie choices and version of the banner
            text you saw.
          </li>
          <li>
            <strong>Analytics (optional):</strong> pseudonymous identifiers used to measure usage;
            only set after consent where required.
          </li>
          <li>
            <strong>CDN / performance:</strong> some infrastructure providers set cookies for
            routing or abuse protection; we configure vendors to minimise personal data where
            possible.
          </li>
        </ul>

        <h2 id="third">6. Third parties</h2>
        <p>
          Third-party scripts (analytics, error reporting, embedded video players, or social
          widgets) may set their own cookies or read storage. Those providers process data under
          their privacy notices. We seek to load non-essential third parties only after consent and
          to use data-processing terms where we act as a controller jointly or as a processor per
          project structure.
        </p>
        <p>
          Image and metadata requests to TMDB CDNs may transmit standard HTTP headers; see TMDB’s
          documentation for their practices.
        </p>

        <h2 id="browser">7. Browser and device controls</h2>
        <p>You can manage cookies through:</p>
        <ul>
          <li>Our in-product cookie preferences (when available).</li>
          <li>
            Browser settings to block third-party cookies, delete stored data, or warn before
            storage.
          </li>
          <li>
            Industry opt-out tools where applicable (for example advertising self-regulatory
            programmes in your region).
          </li>
        </ul>
        <p>
          Blocking strictly necessary cookies may break login, security checks, or consent memory;
          blocking optional cookies may limit analytics visibility but should not prevent basic
          browsing.
        </p>
        <h3>7.1 United States — opt-out signals (GPC and similar)</h3>
        <p>
          Several U.S. state privacy laws treat browser or device{' '}
          <strong>opt-out preference signals</strong> as legally recognised ways to exercise opt-out
          rights (for example for “sale” or “sharing” of personal information for cross-context
          behavioural advertising), sometimes referred to under frameworks like the{' '}
          <strong>Global Privacy Control (GPC)</strong>. Requirements vary by statute and regulator
          guidance.
        </p>
        <p>
          Where MegDB is subject to such a requirement and your browser transmits a valid signal we
          are configured to honour, we will process it in line with applicable law. This does not
          automatically override EU/UK consent rules where stricter standards apply. For a fuller
          view of U.S. rights, see the U.S. section of our{' '}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <h2 id="retention">8. Retention</h2>
        <p>
          Session cookies expire when you close the browser (unless “remember me” features use
          longer-lived tokens with clear notices). Persistent cookies have Max-Age or Expires
          attributes ranging from days to months depending on purpose — for example consent records
          may be kept long enough to prove compliance. We review retention periodically.
        </p>

        <h2 id="eu-omnibus">9. EU developments (April 2026)</h2>
        <p>
          The European Commission published proposals in late 2025 — sometimes referred to as the
          “Digital Omnibus” — aimed at simplifying overlapping digital rules. Among ideas discussed
          in institutional debate are modernising cookie consent mechanics (for example reducing
          “consent fatigue” through clearer defaults and browser-level tools) and clarifying how
          certain rules interact with the GDPR.
        </p>
        <LegalNote>
          As of April 2026, many Omnibus items remain subject to the ordinary EU legislative process
          (Parliament and Council positions, possible amendments). Until adopted and in force, the
          ePrivacy Directive (and national implementing laws) plus the GDPR remain the key
          references for most EU users. The European Data Protection Board and European Data
          Protection Supervisor have highlighted concerns on specific GDPR amendment ideas; outcomes
          may change before final texts apply.
        </LegalNote>

        <h2 id="changes">10. Updates</h2>
        <p>
          We will update this Cookie Policy when we change technologies, vendors, or legal
          requirements. Check the “Last updated” date and review the{' '}
          <Link href="/privacy">Privacy Policy</Link> for broader data uses.
        </p>

        <h2 id="contact">11. Contact</h2>
        <p>
          Questions: <strong>privacy@megdb.com</strong>
          <br />
          <Link href="/contact">Contact page</Link>
        </p>
      </LegalDocument>
    </div>
    </>
  )
}
