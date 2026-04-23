import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalDocument, LegalNote } from '@/components/LegalDocument/LegalDocument'
import styles from './page.module.css'

export const revalidate = 86_400

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms governing your use of MegDB movie and TV discovery services, content sources, and acceptable use.',
}

const UPDATED = 'April 21, 2026'

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <LegalDocument title="Terms of Service" lastUpdated={UPDATED}>
        <h2 id="agreement">1. Agreement to terms</h2>
        <p>
          These Terms of Service (“Terms”) form a binding agreement between you and the MegDB
          operator (“MegDB”, “we”, “us”) regarding your access to and use of the MegDB website,
          applications, APIs where offered to the public, and related services (collectively, the
          “Services”). By accessing or using the Services, you agree to these Terms and to our{' '}
          <Link href="/privacy">Privacy Policy</Link>
          and <Link href="/cookies">Cookie Policy</Link>, which are incorporated by reference.
        </p>
        <p>
          If you are using the Services on behalf of a company or other legal entity, you represent
          that you have authority to bind that entity, in which case “you” includes the entity.
        </p>

        <h2 id="changes">2. Changes</h2>
        <p>
          We may modify the Services or these Terms to reflect new features, legal requirements, or
          security needs. We will post the updated Terms on this page and update the “Last updated”
          date. For material changes, we may provide additional notice where appropriate. Continued
          use after the effective date constitutes acceptance of the revised Terms. If you do not
          agree, stop using the Services.
        </p>

        <h2 id="eligibility">3. Eligibility</h2>
        <p>
          You must be able to form a legally binding contract in your jurisdiction. If local law
          requires a higher minimum age for certain features (for example account registration), you
          must meet that age. The Services are not intended for children under the age required in
          your region to consent to online data processing without parental permission.
        </p>

        <h2 id="description">4. Description of the Services</h2>
        <p>
          MegDB provides discovery tools — such as browsing, search, curated shelves, and
          informational pages — to help you explore audiovisual works and talent. Unless expressly
          stated, MegDB does not stream full titles inside the player as a licensed video-on-demand
          retailer; primary audiovisual content may be hosted by third parties when you follow
          outbound links or embeds.
        </p>
        <h3>4.1 Third-party catalogue data (TMDB)</h3>
        <p>
          Much of the catalogue information displayed on MegDB is sourced from The Movie Database
          (TMDB) API and related TMDB services. Use of that data is subject to{' '}
          <a
            href="https://www.themoviedb.org/documentation/api/terms-of-use"
            rel="noopener noreferrer"
          >
            TMDB’s API terms of use
          </a>{' '}
          and attribution requirements. You agree not to use MegDB in any way that would cause us to
          violate TMDB’s rules, including excessive automated scraping beyond what our technical
          measures permit.
        </p>
        <p>
          TMDB is operated by an independent third party. We are not responsible for the
          completeness, accuracy, or availability of TMDB data, nor for TMDB’s own policies or
          outages.
        </p>

        <h2 id="account">5. Accounts and security</h2>
        <p>
          Some features may require an account. You agree to provide accurate registration
          information and to keep credentials confidential. You are responsible for activity under
          your account unless you notify us promptly of unauthorised use. We may suspend or
          terminate accounts that violate these Terms or present security risk.
        </p>

        <h2 id="acceptable">6. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>
            Violate applicable laws, third-party rights (including copyright and trade mark rights),
            or industry rules.
          </li>
          <li>
            Attempt to probe, scan, or test the vulnerability of our systems; breach authentication;
            or bypass rate limits, robots rules, or access controls.
          </li>
          <li>
            Use the Services to distribute malware, phishing, spam, or other harmful or deceptive
            content.
          </li>
          <li>
            Harvest or collect personal data about other users without lawful basis and, where
            required, consent.
          </li>
          <li>Misrepresent your identity or affiliation, or impersonate MegDB staff.</li>
          <li>
            Frame or mirror the Services in a way that confuses users about origin or endorsement.
          </li>
          <li>
            Use automated means to access the Services in a manner that sends more requests than a
            human could reasonably produce in the same period, except where we provide an official
            API and key with documented limits.
          </li>
        </ul>
        <p>
          We may investigate violations and cooperate with law enforcement or rights holders. Our{' '}
          <Link href="/dmca">DMCA / copyright policy</Link> describes how we handle copyright
          notices in the United States.
        </p>

        <h2 id="ugc">7. User content</h2>
        <p>
          If we allow you to submit reviews, comments, lists, or other content (“User Content”), you
          retain ownership of your intellectual property rights in that content, but you grant MegDB
          a worldwide, non-exclusive, royalty-free licence to host, store, reproduce, modify (for
          formatting), display, and distribute User Content solely to operate, promote, and improve
          the Services. You represent that you have all rights necessary to grant this licence and
          that User Content does not infringe third-party rights.
        </p>
        <p>
          We may remove or refuse User Content that violates these Terms or applicable law. We are
          not obligated to monitor all User Content but may do so for compliance, quality, or
          security.
        </p>

        <h2 id="ip">8. Intellectual property</h2>
        <p>
          The MegDB name, logo, UI design, and original editorial material are protected by
          intellectual property laws. Except for the limited rights expressly granted in these
          Terms, we reserve all rights. Catalogue metadata and images from TMDB remain subject to
          TMDB and underlying right-holders’ terms; nothing in these Terms assigns theatrical or
          streaming rights to you.
        </p>

        <h2 id="disclaimers">9. Disclaimers</h2>
        <p>
          THE SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM EXTENT PERMITTED BY
          LAW, WE DISCLAIM ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED
          WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND
          NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE,
          OR FREE OF HARMFUL COMPONENTS.
        </p>
        <p>
          Ratings, release dates, cast lists, and plot summaries are informational and may contain
          errors. Always verify availability and licensing with the relevant distributor or
          broadcaster before relying on MegDB for purchase or viewing decisions.
        </p>

        <h2 id="liability">10. Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL MEGDB OR ITS AFFILIATES,
          OFFICERS, DIRECTORS, EMPLOYEES, OR SUPPLIERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
          SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA,
          GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATED TO YOUR USE OF OR
          INABILITY TO USE THE SERVICES, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING
          NEGLIGENCE), STATUTE, OR ANY OTHER LEGAL THEORY, EVEN IF WE HAVE BEEN ADVISED OF THE
          POSSIBILITY OF SUCH DAMAGES.
        </p>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR AGGREGATE LIABILITY FOR ALL CLAIMS RELATING TO
          THE SERVICES IN ANY TWELVE-MONTH PERIOD WILL NOT EXCEED THE GREATER OF (A) ONE HUNDRED
          U.S. DOLLARS (US$100) OR (B) THE AMOUNTS YOU PAID TO MEGDB FOR THE SERVICES IN THAT PERIOD
          (IF ANY). SOME JURISDICTIONS DO NOT ALLOW CERTAIN LIMITATIONS; IN THOSE CASES OUR
          LIABILITY IS LIMITED TO THE FULLEST EXTENT PERMITTED BY LAW.
        </p>

        <h2 id="indemnity">11. Indemnity</h2>
        <p>
          You will defend, indemnify, and hold harmless MegDB and its affiliates from any claims,
          damages, losses, liabilities, costs, and expenses (including reasonable attorneys’ fees)
          arising out of your User Content, your misuse of the Services, or your violation of these
          Terms or applicable law.
        </p>

        <h2 id="suspension">12. Suspension and termination</h2>
        <p>
          We may suspend or terminate access to the Services at any time, with or without notice,
          for conduct that we believe violates these Terms or harms other users, us, or third
          parties. Provisions that by their nature should survive (including intellectual property,
          disclaimers, limitation of liability, indemnity, and governing law) will survive
          termination.
        </p>

        <h2 id="law">13. Governing law and disputes</h2>
        <p>
          Unless mandatory consumer protection laws in your country require otherwise, these Terms
          are governed by the laws of the jurisdiction identified in our commercial registration
          (see <Link href="/contact">Contact</Link>), without regard to conflict-of-law rules.
          Courts in that jurisdiction will have exclusive venue, subject to non-waivable rights you
          may have as a consumer to sue in your home courts.
        </p>
        <LegalNote>
          If you are in the EEA or UK, nothing in this section limits your statutory rights under
          consumer law or your right to complain to a supervisory authority where data protection
          issues arise (see our <Link href="/gdpr">GDPR page</Link>).
        </LegalNote>

        <h2 id="misc">14. General</h2>
        <p>
          These Terms constitute the entire agreement between you and MegDB regarding the Services
          and supersede prior oral or written understandings on the same subject. If any provision
          is held invalid, the remainder remains enforceable. Our failure to enforce a provision is
          not a waiver. You may not assign these Terms without our consent; we may assign them in
          connection with a merger, acquisition, or sale of assets.
        </p>

        <h2 id="contact">15. Contact</h2>
        <p>
          Legal notices and general questions: <strong>legal@megdb.com</strong>
          <br />
          <Link href="/contact">Contact page</Link>
          <br />
          Related: <Link href="/privacy">Privacy Policy</Link>, <Link href="/dmca">DMCA</Link>
        </p>
      </LegalDocument>
    </div>
  )
}
