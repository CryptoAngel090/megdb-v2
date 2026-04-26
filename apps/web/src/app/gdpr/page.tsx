import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalDocument, LegalNote } from '@/components/LegalDocument/LegalDocument'
import { WebPageJsonLd } from '@/components/WebPageJsonLd/WebPageJsonLd'
import { discoverSocialMeta } from '@/lib/seoSocial'
import styles from './page.module.css'

export const revalidate = 86_400

const title = 'GDPR & EU/UK data protection'
const description =
  'MegDB GDPR summary: legal bases, rights, supervisory authorities, transfers, and 2025–2026 EU Digital Omnibus context.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/gdpr' },
  ...discoverSocialMeta(title, description, '/gdpr'),
}

const UPDATED = 'April 21, 2026'

export default function GdprPage() {
  return (
    <>
      <WebPageJsonLd pathname="/gdpr" title={title} description={description} />
      <div className={styles.page}>
      <LegalDocument title="GDPR & EU/UK data protection information" lastUpdated={UPDATED}>
        <h2 id="scope">1. Scope of this page</h2>
        <p>
          This page summarises how MegDB approaches the General Data Protection Regulation (EU)
          2016/679 (“GDPR”), the UK GDPR and Data Protection Act 2018, and closely aligned laws in
          Switzerland, the EEA, and the UK. It expands on our{' '}
          <Link href="/privacy">Privacy Policy</Link> with practical detail for individuals in those
          regions. It is <strong>not</strong> a substitute for the full legal texts or for
          personalised legal advice.
        </p>

        <h2 id="controller">2. Controller and EU/UK representation</h2>
        <p>
          The <strong>controller</strong> determines why and how personal data is processed. The
          MegDB controller is the entity identified on our <Link href="/contact">Contact</Link>{' '}
          page. If we appoint a data protection officer (DPO) or an EU/UK representative under
          Article 27 GDPR, we will publish their contact details in the Privacy Policy or here.
        </p>
        <p>
          For general privacy requests: <strong>privacy@megdb.com</strong>
        </p>

        <h2 id="principles">3. GDPR principles we apply</h2>
        <p>We aim to process personal data in line with GDPR Article 5 principles:</p>
        <ul>
          <li>
            <strong>Lawfulness, fairness, transparency</strong> — we document purposes and provide
            clear notices.
          </li>
          <li>
            <strong>Purpose limitation</strong> — we collect data for specified, explicit, and
            legitimate purposes and avoid incompatible reuse.
          </li>
          <li>
            <strong>Data minimisation</strong> — we limit data to what is adequate, relevant, and
            necessary.
          </li>
          <li>
            <strong>Accuracy</strong> — we correct data when informed of errors when proportionate.
          </li>
          <li>
            <strong>Storage limitation</strong> — we retain data only as long as needed (see Privacy
            Policy).
          </li>
          <li>
            <strong>Integrity and confidentiality</strong> — we apply security measures appropriate
            to risk.
          </li>
          <li>
            <strong>Accountability</strong> — we maintain records of processing where required and
            review vendors.
          </li>
        </ul>

        <h2 id="bases">4. Lawful bases (Article 6)</h2>
        <p>Depending on the processing activity, we may rely on:</p>
        <ul>
          <li>
            <strong>Performance of a contract</strong> (Article 6(1)(b)) — providing account
            features you request.
          </li>
          <li>
            <strong>Legitimate interests</strong> (Article 6(1)(f)) — for example network security,
            fraud prevention, service improvement, and limited internal reporting, balanced against
            your rights; you may object where applicable.
          </li>
          <li>
            <strong>Consent</strong> (Article 6(1)(a)) — for optional cookies, certain marketing, or
            other processing where consent is the appropriate basis.
          </li>
          <li>
            <strong>Legal obligation</strong> (Article 6(1)(c)) — where law requires retention or
            disclosure.
          </li>
        </ul>
        <p>
          For criminal offence data or special categories under Articles 9–10, we generally do not
          intend to process such data through MegDB; any future processing would require an
          additional lawful basis and clear notice.
        </p>

        <h2 id="rights">5. Your rights</h2>
        <p>Subject to conditions and exceptions in the GDPR, you may have the right to:</p>
        <ul>
          <li>
            <strong>Access</strong> (Article 15) — obtain confirmation and a copy of personal data
            we hold about you.
          </li>
          <li>
            <strong>Rectification</strong> (Article 16) — correct inaccurate data.
          </li>
          <li>
            <strong>Erasure (“right to be forgotten”)</strong> (Article 17) — request deletion where
            grounds apply.
          </li>
          <li>
            <strong>Restriction</strong> (Article 18) — limit processing in certain situations.
          </li>
          <li>
            <strong>Data portability</strong> (Article 20) — receive structured, machine-readable
            data you provided where processing is based on consent or contract and carried out by
            automated means.
          </li>
          <li>
            <strong>Object</strong> (Article 21) — object to processing based on legitimate
            interests or to direct marketing.
          </li>
          <li>
            <strong>Withdraw consent</strong> at any time where processing is consent-based, without
            affecting the lawfulness of processing before withdrawal.
          </li>
          <li>
            <strong>Lodge a complaint</strong> with a supervisory authority (Article 77).
          </li>
          <li>
            <strong>Human review</strong> in relation to solely automated decisions with legal or
            similar significant effects (Article 22) — MegDB does not intend to perform such
            decisions as described in the Privacy Policy.
          </li>
        </ul>
        <p>
          To exercise rights, email <strong>privacy@megdb.com</strong>. We may need to verify
          identity. We will respond within one month, extendable where permitted by law with
          explanation.
        </p>

        <h2 id="dpo-sa">6. Supervisory authorities (examples)</h2>
        <p>
          You may contact a supervisory authority in your country of residence or work. Examples
          include:
        </p>
        <ul>
          <li>
            <a href="https://www.dataprotection.ie/" rel="noopener noreferrer">
              Ireland — Data Protection Commission (DPC)
            </a>
          </li>
          <li>
            <a href="https://www.cnil.fr/" rel="noopener noreferrer">
              France — CNIL
            </a>
          </li>
          <li>
            <a href="https://www.bfdi.bund.de/" rel="noopener noreferrer">
              Germany — state DPAs (BfDI federal hub)
            </a>
          </li>
          <li>
            <a href="https://ico.org.uk/" rel="noopener noreferrer">
              United Kingdom — Information Commissioner’s Office (ICO)
            </a>
          </li>
          <li>
            <a
              href="https://edpb.europa.eu/about-edpb/about-edpb/members_en"
              rel="noopener noreferrer"
            >
              Full list via EDPB members
            </a>
          </li>
        </ul>

        <h2 id="transfers">7. International transfers</h2>
        <p>
          When personal data leaves the EEA, UK, or Switzerland, we use appropriate safeguards such
          as Standard Contractual Clauses (Commission Implementing Decision 2021/914), the UK
          International Data Transfer Agreement / Addendum, or other mechanisms recognised at the
          time, supplemented by technical and organisational measures where case law requires
          (“Schrems II” supplementary measures analysis).
        </p>

        <h2 id="dpa">8. Processors and sub-processors</h2>
        <p>
          We use infrastructure, email, security, and analytics vendors as{' '}
          <strong>processors</strong> under Article 28 GDPR. We enter written contracts requiring
          processors to process data only on our instructions, assist with rights requests, delete
          or return data at end of service, and demonstrate compliance. A current list of categories
          of processors is available on request to enterprise customers; consumer-facing detail may
          be summarised in the Privacy Policy.
        </p>

        <h2 id="breach">9. Personal data breach notification</h2>
        <p>
          If a breach is likely to result in risk to individuals’ rights and freedoms, we will
          notify the competent supervisory authority without undue delay and, where high risk
          exists, communicate to affected individuals when required — in line with Articles 33–34
          GDPR and operational playbooks.
        </p>
        <LegalNote>
          Legislative debate (2025–2026): EU institutions are discussing Omnibus proposals that
          could adjust certain procedural aspects (for example centralised breach reporting concepts
          and thresholds). Until final text and implementation, we follow existing GDPR Articles
          33–34 and regulatory guidance from the EDPB.
        </LegalNote>

        <h2 id="omnibus">10. EU “Digital Omnibus” — status April 2026</h2>
        <p>
          In <strong>late 2025</strong> the European Commission published a legislative package
          widely reported as the “Digital Omnibus”, bundling updates across several digital-policy
          files (data, platform rules, and proposed adjustments touching GDPR-related topics).
          Overviews are published by EU institutions and portals such as{' '}
          <a href="https://data.europa.eu/" rel="noopener noreferrer">
            data.europa.eu
          </a>
          . The aim described publicly is to simplify overlapping obligations for businesses while
          preserving fundamental rights — the exact balance is subject to the ordinary EU
          legislative process (Commission proposal → Parliament and Council positions → trilogue →
          adoption).
        </p>
        <p>
          Public debate through early 2026 has included discussion of ideas such as clarifying
          certain personal data scenarios in the age of AI, conditions for processing in AI supply
          chains, and procedural streamlining (for example around assessments or notifications in
          specific contexts). The European Data Protection Board and the European Data Protection
          Supervisor have issued public reactions flagging that some draft GDPR-facing changes could
          affect the level of protection and should be assessed carefully as texts evolve.
        </p>
        <p>
          Separately, EU AI Act implementation interacts with Omnibus politically and technically:
          the official AI Act Service Desk FAQ section on Digital Omnibus explains how Commission
          proposals may link to phasing/support tools for certain high-risk AI rules — see{' '}
          <a
            href="https://ai-act-service-desk.ec.europa.eu/en/faq?faq_category_id=99"
            rel="noopener noreferrer"
          >
            AI Act Service Desk — Digital Omnibus FAQ category
          </a>
          .
        </p>
        <LegalNote>
          <strong>Important:</strong> As of <strong>21 April 2026</strong>, Omnibus texts are{' '}
          <strong>not</strong> final and uniformly applicable EU law for MegDB processing unless and
          until adopted, published in the <em>Official Journal of the European Union</em>, and in
          force. Until then, this page remains grounded in the GDPR and UK GDPR as currently
          applicable. We revise these documents when binding rules change.
        </LegalNote>

        <h2 id="uk">11. United Kingdom</h2>
        <p>
          After Brexit, the UK GDPR and Data Protection Act 2018 form the core UK framework. The UK
          adequacy decision from the EU (2021) remains a reference for EU-to-UK flows, subject to
          periodic review. UK-specific cookie and electronic marketing rules implement PECR; see our{' '}
          <Link href="/cookies">Cookie Policy</Link>.
        </p>

        <h2 id="contact">12. Contact</h2>
        <p>
          <strong>privacy@megdb.com</strong>
          <br />
          <Link href="/contact">Contact page</Link>
          <br />
          <Link href="/privacy">Privacy Policy</Link>
        </p>
      </LegalDocument>
    </div>
    </>
  )
}
