import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalDocument, LegalNote } from '@/components/LegalDocument/LegalDocument'
import styles from './page.module.css'

export const revalidate = 86_400

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How MegDB collects, uses, and protects personal information when you browse movies, series, and TV discovery features.',
}

const UPDATED = 'April 21, 2026'

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <LegalDocument title="Privacy Policy" lastUpdated={UPDATED}>
        <h2 id="overview">1. Overview</h2>
        <p>
          MegDB (“MegDB”, “we”, “us”) operates a discovery website and related services that help
          you explore movies, television series, cartoons, and people in the entertainment
          catalogue. This Privacy Policy explains what information we may collect, why we process
          it, how long we keep it, whom we share it with, and what choices and rights you may have
          depending on where you live.
        </p>
        <p>
          Catalogue metadata, posters, backdrops, and related media assets are provided by third
          parties such as The Movie Database (TMDB) under their terms. MegDB does not claim
          ownership of that catalogue content. This policy focuses on{' '}
          <strong>your personal information</strong> in connection with our site and services.
        </p>
        <p>
          By using MegDB, you acknowledge that you have read this policy. If you do not agree,
          please discontinue use of the services covered here.
        </p>

        <h2 id="controller">2. Who is responsible?</h2>
        <p>
          The entity responsible for personal data processing (“controller”) is the MegDB operator
          identified on our <Link href="/contact">Contact</Link> page or in commercial
          correspondence. If you need the legal name, registered address, or registration numbers
          for contracts or regulatory requests, request them through{' '}
          <strong>privacy@megdb.com</strong> (or the address published on Contact) so we can route
          your inquiry to the correct legal entity.
        </p>

        <h2 id="collect">3. Information we may collect</h2>
        <p>Depending on how you use MegDB, we may process categories such as:</p>
        <h3>3.1 Technical and usage data (typically automatic)</h3>
        <ul>
          <li>
            <strong>Device and connection data:</strong> IP address, approximate location derived
            from IP, browser type and version, operating system, language preferences, referrer URL,
            and date/time of requests.
          </li>
          <li>
            <strong>Service logs:</strong> server and application logs used for security, abuse
            prevention, debugging, capacity planning, and reliability (for example error rates or
            rate-limit events).
          </li>
          <li>
            <strong>Product analytics (if enabled):</strong> aggregated or pseudonymous information
            about feature usage, scroll depth, or performance metrics. Where required by law, we
            will ask for your consent before using non-essential analytics or advertising
            technologies.
          </li>
        </ul>
        <h3>3.2 Account and profile data (if you register)</h3>
        <ul>
          <li>
            <strong>Credentials and identifiers:</strong> email address, username or display name,
            and authentication tokens or session identifiers managed by our auth provider or our
            systems.
          </li>
          <li>
            <strong>Preferences:</strong> watchlist entries, notification settings, language or
            region preferences, and similar choices you save to your profile.
          </li>
        </ul>
        <h3>3.3 Communications</h3>
        <ul>
          <li>
            If you email us or use support forms, we process the content of your message, your
            contact details, and metadata needed to respond and to maintain support records.
          </li>
        </ul>
        <h3>3.4 Information we do not aim to collect</h3>
        <p>
          We do not intentionally collect special categories of data (such as health or biometric
          data) through the ordinary use of MegDB. Please do not submit such information in
          free-text fields.
        </p>

        <h2 id="sources">4. Sources of information</h2>
        <p>We may obtain personal information from:</p>
        <ul>
          <li>
            <strong>You</strong>, when you browse, register, adjust settings, or contact us.
          </li>
          <li>
            <strong>Your device and browser</strong>, through cookies, local storage, or similar
            technologies described in our <Link href="/cookies">Cookie Policy</Link>.
          </li>
          <li>
            <strong>Service providers</strong> that host infrastructure, deliver email, provide
            analytics, or help detect fraud, subject to contracts and this policy.
          </li>
          <li>
            <strong>Public databases or partners</strong> only where permitted by law and relevant
            to the service (for example fraud intelligence feeds).
          </li>
        </ul>

        <h2 id="purposes">5. Why we use personal information</h2>
        <p>We process personal information for purposes such as:</p>
        <ul>
          <li>
            <strong>Providing the service:</strong> delivering pages, search, recommendations
            surfaces, and account features; caching and CDN delivery; enforcing technical limits
            that keep the API stable.
          </li>
          <li>
            <strong>Security and abuse prevention:</strong> detecting bots, credential stuffing,
            scraping at harmful rates, and other activity that could degrade MegDB or other users’
            experience.
          </li>
          <li>
            <strong>Improving the product:</strong> understanding which features are used, fixing
            bugs, and measuring performance.
          </li>
          <li>
            <strong>Communications:</strong> responding to support requests; sending service or
            policy notices where necessary; marketing emails only if you opt in where required.
          </li>
          <li>
            <strong>Legal compliance:</strong> tax, accounting, responding to lawful requests, and
            establishing or defending legal claims.
          </li>
        </ul>

        <h2 id="legal-bases">6. Legal bases (EEA, UK, and similar regimes)</h2>
        <p>
          Where the GDPR, UK GDPR, or comparable laws apply, we rely on one or more of the following
          legal bases:
        </p>
        <ul>
          <li>
            <strong>Contract</strong> — processing necessary to provide features you request (for
            example maintaining a watchlist tied to your account).
          </li>
          <li>
            <strong>Legitimate interests</strong> — for example securing the site, improving
            reliability, understanding aggregated usage, and preventing abuse, balanced against your
            rights.
          </li>
          <li>
            <strong>Consent</strong> — for optional cookies, certain analytics, or marketing where
            consent is the appropriate basis.
          </li>
          <li>
            <strong>Legal obligation</strong> — where we must retain or disclose information to
            comply with law.
          </li>
        </ul>
        <p>
          You can read more about EU/UK-specific rights in our{' '}
          <Link href="/gdpr">GDPR information page</Link>.
        </p>

        <h2 id="sharing">7. Sharing and recipients</h2>
        <p>We may share personal information with:</p>
        <ul>
          <li>
            <strong>Infrastructure and hosting providers</strong> that store or transmit data (for
            example cloud regions you connect to when loading the site).
          </li>
          <li>
            <strong>TMDB and other media-metadata providers</strong> — your browser requests their
            CDN URLs for images; those requests may reveal IP address and headers to TMDB or their
            delivery partners under their policies.
          </li>
          <li>
            <strong>Analytics or error-reporting vendors</strong> if we enable them, generally under
            data-processing terms and, where required, your consent.
          </li>
          <li>
            <strong>Professional advisers</strong> (lawyers, auditors) where confidential and
            necessary.
          </li>
          <li>
            <strong>Authorities</strong> when we believe disclosure is required by law or to protect
            rights, safety, and security.
          </li>
        </ul>
        <p>
          We do not sell your personal information in the sense of “selling” under U.S. state
          privacy laws where that term is defined narrowly; if we introduce monetisation that
          qualifies as a sale or “sharing” for cross-context behavioural advertising, we will update
          this policy and provide any required controls.
        </p>

        <h2 id="transfers">8. International transfers</h2>
        <p>
          MegDB may be operated from or use servers in multiple countries. If we transfer personal
          data from the EEA, UK, or Switzerland to countries not deemed adequate by the relevant
          authority, we will use appropriate safeguards such as Standard Contractual Clauses (SCCs),
          UK Addendum, or other mechanisms recognised at the time of transfer, plus supplementary
          measures where required by case law and regulatory guidance.
        </p>

        <h2 id="retention">9. Retention</h2>
        <p>
          We keep personal information only as long as needed for the purposes above, including
          legal, accounting, and reporting requirements. Examples:
        </p>
        <ul>
          <li>
            <strong>Security logs:</strong> typically rotated within a limited window unless longer
            retention is needed to investigate an incident.
          </li>
          <li>
            <strong>Account data:</strong> retained while your account is active and for a grace
            period afterward unless you ask for earlier deletion, subject to exceptions (for example
            billing records).
          </li>
          <li>
            <strong>Support tickets:</strong> retained long enough to resolve issues and demonstrate
            good-faith handling of disputes.
          </li>
        </ul>

        <h2 id="security">10. Security</h2>
        <p>
          We implement administrative, technical, and organisational measures appropriate to the
          risk, such as access controls, encryption in transit where standard for web traffic,
          monitoring, and vendor due diligence. No method of transmission or storage is completely
          secure; we encourage you to use unique passwords and protect your devices.
        </p>

        <h2 id="rights">11. Your privacy rights</h2>
        <p>
          Depending on your jurisdiction, you may have rights to access, rectify, erase, restrict,
          or object to certain processing, to data portability, and to withdraw consent where
          processing is consent-based. You may also have the right to lodge a complaint with a
          supervisory authority.
        </p>
        <p>
          To exercise rights, contact <strong>privacy@megdb.com</strong>. We may need to verify your
          identity before fulfilling requests. If you are in the EEA/UK, see also{' '}
          <Link href="/gdpr">our GDPR page</Link>
          for authority links and additional detail.
        </p>
        <h3>11.1 United States — state comprehensive privacy laws (2026)</h3>
        <p>
          By 2026, a large and growing number of U.S. states have “comprehensive” consumer privacy
          statutes (often similar in structure to Virginia/Colorado/California-style models, but
          details differ). Examples of waves that industry trackers highlight around this period
          include new or amended laws taking effect in <strong>early 2026</strong> for several
          states, with further amendments or programmes (for example data-broker registration
          changes) staged later in the year. Because thresholds, definitions, and enforcement differ
          by statute, you should review the law that applies to your residence.
        </p>
        <p>Depending on your state, you may have the right to:</p>
        <ul>
          <li>
            <strong>Know / access</strong> personal information we hold and how we use and disclose
            it.
          </li>
          <li>
            <strong>Delete</strong> personal information, subject to statutory exceptions.
          </li>
          <li>
            <strong>Correct</strong> inaccurate personal information.
          </li>
          <li>
            <strong>Opt out</strong> of the <strong>sale</strong> of personal information, of
            certain <strong>sharing</strong> for cross-context behavioural advertising, or of{' '}
            <strong>profiling</strong> in furtherance of decisions that produce legal or similarly
            significant effects — where those concepts exist in your state’s law.
          </li>
          <li>
            <strong>Appeal</strong> our refusal to act on a request, where required.
          </li>
          <li>
            Use an <strong>authorised agent</strong> in some states, with proof you authorised them.
          </li>
        </ul>
        <p>
          We will not discriminate against you for exercising privacy rights where that prohibition
          applies. Some browsers support a global privacy control (GPC) or similar signal; where a
          state law requires us to treat an opt-out signal as a valid request, we will implement
          that requirement. See also our <Link href="/cookies">Cookie Policy</Link> for storage
          technologies and consent.
        </p>
        <LegalNote>
          State laws and regulatory guidance change frequently. The summary above is not a 50-state
          matrix. If you need the exact effective date or scope for your state, consult your
          Attorney General’s consumer resources or qualified counsel.
        </LegalNote>

        <h2 id="children">12. Children</h2>
        <p>
          MegDB is not directed at children under 16 (or the age required in your jurisdiction). We
          do not knowingly collect personal information from children. If you believe we have
          collected such information, contact us and we will take appropriate steps to delete it.
        </p>

        <h2 id="automated">13. Automated decision-making and AI regulation</h2>
        <p>
          We do not use personal data to make solely automated decisions that produce legal or
          similarly significant effects about you. Ranking and discovery features are based on
          catalogue metadata and general popularity or editorial rules, not on individual profiling
          that would deny you essential services.
        </p>
        <LegalNote>
          <strong>EU AI Act (Regulation EU 2024/1689) — official phased timeline:</strong> the
          European Commission’s AI Act Service Desk publishes an implementation timeline. As
          summarised there, key dates include <strong>2 February 2025</strong> (general provisions
          such as definitions and AI literacy, and <strong>prohibited AI practices</strong>),{' '}
          <strong>2 August 2025</strong> (rules for general-purpose AI models and related
          governance), <strong>2 August 2026</strong> (majority of rules, including many high-risk
          system obligations and transparency rules under Article 50), and{' '}
          <strong>2 August 2027</strong> (further high-risk rules for AI embedded in regulated
          products). The same official resource notes that Digital Omnibus proposals may interact
          with how some high-risk obligations are phased — we monitor those developments. Source:{' '}
          <a
            href="https://ai-act-service-desk.ec.europa.eu/en/ai-act/timeline/timeline-implementation-eu-ai-act"
            rel="noopener noreferrer"
          >
            EU AI Act Service Desk — implementation timeline
          </a>
          .
        </LegalNote>

        <h2 id="changes">14. Changes to this policy</h2>
        <p>
          We may update this Privacy Policy to reflect product changes, legal requirements, or
          regulatory guidance. When we make material changes, we will post the updated version on
          this page and revise the “Last updated” date. Where required, we will provide additional
          notice (for example a banner or email).
        </p>
        <LegalNote>
          Regulatory context (April 2026): debates continue in the EU institutions on the
          Commission’s “Digital Omnibus” proposals (including possible GDPR and digital-rulebook
          adjustments). Unless and until adopted, the GDPR (EU) 2016/679 and related ePrivacy rules
          remain the primary framework for many EU users. We monitor legislative developments and
          will adjust this policy when final rules apply to our processing.
        </LegalNote>

        <h2 id="contact">15. Contact</h2>
        <p>
          Questions about this Privacy Policy: <strong>privacy@megdb.com</strong>
          <br />
          General inquiries: <Link href="/contact">Contact page</Link>
          <br />
          Related: <Link href="/terms">Terms of Service</Link>,{' '}
          <Link href="/cookies">Cookie Policy</Link>, <Link href="/gdpr">GDPR information</Link>
        </p>
      </LegalDocument>
    </div>
  )
}
