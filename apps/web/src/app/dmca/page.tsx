import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalDocument, LegalNote } from '@/components/LegalDocument/LegalDocument'
import { WebPageJsonLd } from '@/components/WebPageJsonLd/WebPageJsonLd'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'
import styles from './page.module.css'

/** @sync `ROUTE_REVALIDATE_STATIC_COPY` in `@/lib/cachePolicy` */
export const revalidate = 86_400

const title = 'DMCA policy'
const description =
  'MegDB DMCA: agent contact, notice requirements under 17 U.S.C. § 512, counter-notification, repeat infringer policy, and TMDB/third-party asset context.'

export const metadata: Metadata = {
  title,
  description,
  alternates: discoverPageAlternates('/dmca'),
  ...discoverSocialMeta(title, description, '/dmca'),
}

const UPDATED = 'April 21, 2026'

export default function DmcaPage() {
  return (
    <>
      <WebPageJsonLd
        pathname="/dmca"
        title={title}
        description={description}
        breadcrumbParent={{ name: 'Legal & privacy', pathname: '/privacy' }}
      />
      <div className={styles.page}>
      <LegalDocument title="Digital Millennium Copyright Act (DMCA) policy" lastUpdated={UPDATED}>
        <h2 id="intro">1. Purpose</h2>
        <p>
          MegDB respects intellectual property rights. This policy describes how we respond to
          notices of alleged copyright infringement under the United States Digital Millennium
          Copyright Act (“DMCA”), particularly 17 U.S.C. § 512. It supplements our{' '}
          <Link href="/terms">Terms of Service</Link>.
        </p>
        <p>
          MegDB primarily displays catalogue metadata, posters, and related materials sourced under
          licence from third-party databases (for example TMDB). If you believe{' '}
          <strong>user-generated content</strong> or other material on MegDB infringes your
          copyright, follow the notice procedure below.
        </p>

        <h2 id="agent">2. Designated agent</h2>
        <p>
          DMCA notices must be sent to our designated copyright agent. Until a U.S. Copyright Office
          registration number is published on this page, use:
        </p>
        <ul>
          <li>
            <strong>Email:</strong> dmca@megdb.com
          </li>
          <li>
            <strong>Subject line:</strong> DMCA Notice — [title of work]
          </li>
          <li>
            <strong>Postal:</strong> MegDB Legal — DMCA Agent (address on request via{' '}
            <Link href="/contact">Contact</Link>)
          </li>
        </ul>
        <LegalNote>
          U.S. service providers often register agents with the Copyright Office’s DMCA designated
          agent directory. We will update this section with the official directory link and
          registration details when filing is complete.
        </LegalNote>

        <h2 id="notice">3. Elements of a valid infringement notice</h2>
        <p>
          Under § 512(c)(3), your written notice should include all of the following to be
          actionable:
        </p>
        <ol>
          <li>
            A physical or electronic signature of the person authorised to act on behalf of the
            copyright owner.
          </li>
          <li>
            Identification of the copyrighted work claimed to have been infringed, or, if multiple
            works are covered by a single notification, a representative list of such works.
          </li>
          <li>
            Identification of the material that is claimed to be infringing or to be the subject of
            infringing activity and that is to be removed or access to which is to be disabled, and
            information reasonably sufficient to permit MegDB to locate the material (for example
            exact URL paths, user account, or timestamped screenshots).
          </li>
          <li>
            Information reasonably sufficient to contact you, such as an address, telephone number,
            and email.
          </li>
          <li>
            A statement that you have a good faith belief that use of the material in the manner
            complained of is not authorised by the copyright owner, its agent, or the law.
          </li>
          <li>
            A statement that the information in the notification is accurate, and under penalty of
            perjury, that you are authorised to act on behalf of the owner of an exclusive right
            that is allegedly infringed.
          </li>
        </ol>
        <p>
          Incomplete notices may be rejected or delayed. Consider consulting legal counsel for
          complex matters.
        </p>

        <h2 id="our-response">4. Our response</h2>
        <p>
          When we receive a compliant notice, we will promptly investigate and, where appropriate,
          remove or disable access to the material. We may notify the user who posted the material
          and provide a copy of the notice (with personal data redacted where sensible) so they can
          file a counter-notice if permitted.
        </p>
        <p>
          We may terminate accounts of repeat infringers in appropriate circumstances, consistent
          with § 512(i)(1)(A) safe-harbour conditions.
        </p>

        <h2 id="counter">5. Counter-notice</h2>
        <p>
          If you believe material was removed or disabled by mistake or misidentification, you may
          send a counter-notice containing:
        </p>
        <ul>
          <li>Your physical or electronic signature.</li>
          <li>
            Identification of the material that has been removed or disabled and the location at
            which it appeared before removal.
          </li>
          <li>
            A statement under penalty of perjury that you have a good faith belief the material was
            removed or disabled as a result of mistake or misidentification.
          </li>
          <li>
            Your name, address, telephone number, and consent to the jurisdiction of the Federal
            District Court for the judicial district in which your address is located (or, if
            outside the U.S., consent to jurisdiction where we may be found), and that you will
            accept service of process from the person who provided the original notice or their
            agent.
          </li>
        </ul>
        <p>
          Upon receipt of a valid counter-notice, we may forward it to the original complainant. The
          complainant may have a limited window to seek a court order; if no order is obtained, we
          may restore the material at our discretion under § 512(g).
        </p>

        <h2 id="misrepresentation">6. Misrepresentations</h2>
        <p>
          Under § 512(f), any person who knowingly materially misrepresents that material is
          infringing, or that material was removed by mistake, may be liable for damages, including
          costs and attorneys’ fees. Submit notices in good faith and with accurate facts.
        </p>

        <h2 id="non-us">7. Non-U.S. claims</h2>
        <p>
          The DMCA is U.S. law. If you are outside the United States, you may have additional
          remedies under local copyright or intermediary rules. We will review non-U.S. takedown
          requests where legally compelled or where they provide sufficient detail under comparable
          standards.
        </p>

        <h2 id="trademarks">8. Trade marks</h2>
        <p>
          This DMCA process addresses <strong>copyright</strong>. Trade mark complaints should be
          sent to legal@megdb.com with distinct evidence of confusion, registration numbers where
          applicable, and jurisdiction.
        </p>

        <h2 id="resources">9. Official resources</h2>
        <p>
          For background on the statutory framework, see the U.S. Copyright Office overview of §
          512:{' '}
          <a href="https://www.copyright.gov/512/" rel="noopener noreferrer">
            copyright.gov/512
          </a>
          .
        </p>
        <LegalNote>
          As of April 2026, core § 512 notice-and-takedown rules remain the governing U.S. framework
          for qualifying online service providers. We monitor statutory and case-law developments
          and will update this policy if legal requirements change materially.
        </LegalNote>

        <h2 id="contact">10. Contact</h2>
        <p>
          DMCA agent: <strong>dmca@megdb.com</strong>
          <br />
          General legal: <strong>legal@megdb.com</strong>
          <br />
          <Link href="/contact">Contact page</Link>
        </p>
      </LegalDocument>
    </div>
    </>
  )
}
