import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { LegalSection } from '../components/LegalSection'
import './PrivacyPage.css'

const UPDATED = '18 October 2026'

export function PrivacyPage() {
  return (
    <div className="site">
      <Header />
      <main className="privacy">
        <h1 className="privacy__title">Privacy</h1>
        <p className="privacy__updated">Updated {UPDATED}</p>

        <LegalSection title="This website">
          <p>
            mintstudio.io uses Google Analytics to count visits and see which pages are read. It collects
            anonymous usage data such as pages viewed, device type and approximate location. No account or
            contact details are collected.
          </p>
        </LegalSection>

        <LegalSection title="mint. control">
          <p>
            mint. control is the internal dashboard Mint Studio uses to monitor its own websites and apps. It
            is only available to Mint Studio staff.
          </p>
          <p>
            When a staff member connects a Google account, the dashboard requests read-only access to AdMob
            and AdSense reports, plus the account email address. This data is used only to show earnings,
            ad performance and account status inside the dashboard. It is stored on Mint Studio servers, is
            never sold, and is never shared with third parties.
          </p>
          <p>
            Use of information received from Google APIs adheres to the{' '}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
          <p>
            Access can be removed at any time from the dashboard or from{' '}
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">
              Google account permissions
            </a>
            . Disconnecting deletes the stored access and all income data.
          </p>
        </LegalSection>

        <LegalSection title="Contact">
          <p>
            Questions or deletion requests: <a href="mailto:hello@mintstudio.io">hello@mintstudio.io</a>
          </p>
        </LegalSection>
      </main>
      <Footer />
    </div>
  )
}
