export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div style={{ backgroundColor: "#1A1A2E" }} className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <p style={{ color: "#F47C20" }} className="text-sm font-semibold uppercase tracking-widest mb-3">
            Legal
          </p>
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-400 text-base">
            Last updated: May 8, 2026 &nbsp;·&nbsp; Effective: May 8, 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-16 text-gray-700 text-base leading-relaxed space-y-10">

        <section>
          <p>
            Restox LLC ("Restox," "we," "us," or "our") operates the website restox.net and the Restox
            platform (the "Service"). This Privacy Policy explains how we collect, use, disclose, and
            protect your information when you use our Service. By using Restox, you agree to the
            collection and use of information in accordance with this policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>

          <h3 className="text-base font-semibold text-gray-900 mb-2">Information you provide directly</h3>
          <ul className="list-disc list-inside space-y-1 mb-6 text-gray-600">
            <li>Name and email address when you create an account</li>
            <li>Shipping address(es) you add to your profile</li>
            <li>Household size and preferences you set</li>
            <li>Retailer membership and rewards numbers</li>
            <li>Payment information processed securely through Stripe</li>
          </ul>

          <h3 className="text-base font-semibold text-gray-900 mb-2">Information collected automatically</h3>
          <ul className="list-disc list-inside space-y-1 mb-6 text-gray-600">
            <li>Log data including IP address, browser type, pages visited, and timestamps</li>
            <li>Device information including operating system and browser version</li>
            <li>Cookies and similar tracking technologies</li>
            <li>Usage data about how you interact with the Service</li>
          </ul>

          <h3 className="text-base font-semibold text-gray-900 mb-2">Information from third parties</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Authentication data from Google when you sign in with Google</li>
            <li>Financial transaction data from Plaid when you choose to connect your bank account for Spend Intelligence (opt-in only)</li>
            <li>Purchase history from connected retailers</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">We use the information we collect to:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Provide, operate, and improve the Restox Service</li>
            <li>Automate your repeat purchases across connected retailers</li>
            <li>Send you notifications about upcoming and completed orders</li>
            <li>Personalize your experience with AI-powered reorder timing and purchase suggestions</li>
            <li>Process payments and manage your subscription</li>
            <li>Communicate with you about your account, updates, and support</li>
            <li>Comply with legal obligations</li>
            <li>Detect and prevent fraud and abuse</li>
            <li>Display relevant advertisements on the free tier (ad-supported plan only)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">3. Plaid and Financial Data</h2>
          <p className="mb-4">
            Restox uses Plaid Technologies, Inc. ("Plaid") to enable the optional Spend Intelligence
            feature. If you choose to connect your bank or financial accounts, Plaid will collect your
            financial information on our behalf. Your use of Plaid's services is subject to Plaid's
            Privacy Policy, available at{" "}
            <a href="https://plaid.com/legal/privacy-policy/" className="underline" style={{ color: "#F47C20" }}>
              plaid.com/legal/privacy-policy
            </a>.
          </p>
          <p className="mb-4">
            We only read your transaction data to identify recurring purchases. We do not initiate
            payments, transfers, or any financial transactions through Plaid. Connecting your bank
            account is entirely optional and can be disconnected at any time from your Settings page.
          </p>
          <p>
            We do not sell your financial data to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">4. How We Share Your Information</h2>
          <p className="mb-4">We do not sell your personal information. We may share your information with:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li><strong className="text-gray-800">Service providers</strong> — third parties that help us operate the Service, including Supabase (database), Vercel (hosting), Stripe (payments), Plaid (financial data), SendGrid (email), and Twilio (SMS). These providers are contractually obligated to protect your data.</li>
            <li><strong className="text-gray-800">Retailers</strong> — when you connect a retailer account and authorize Restox to place orders on your behalf, we share necessary information with that retailer to fulfill your orders.</li>
            <li><strong className="text-gray-800">Legal requirements</strong> — when required by law, court order, or to protect the rights and safety of Restox and its users.</li>
            <li><strong className="text-gray-800">Business transfers</strong> — in the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">5. Cookies and Tracking</h2>
          <p className="mb-4">
            We use cookies and similar technologies to maintain your session, remember your preferences,
            and improve the Service. We use:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li><strong className="text-gray-800">Essential cookies</strong> — required for authentication and core functionality</li>
            <li><strong className="text-gray-800">Preference cookies</strong> — to remember your settings such as dark mode preference</li>
            <li><strong className="text-gray-800">Analytics cookies</strong> — to understand how users interact with the Service (Vercel Analytics)</li>
            <li><strong className="text-gray-800">Advertising cookies</strong> — on the free tier only, to serve relevant ads through our ad partners</li>
          </ul>
          <p className="mt-4">
            You can control cookies through your browser settings. Disabling essential cookies may
            affect the functionality of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed to
            provide the Service. If you delete your account, we will delete your personal information
            within 30 days, except where we are required to retain it for legal or compliance purposes.
            Transaction history may be retained for up to 7 years for tax and accounting purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">7. Data Security</h2>
          <p>
            We use industry-standard security measures to protect your information, including TLS
            encryption for data in transit and encryption at rest via Supabase. Retailer connections
            use OAuth 2.0 — Restox never stores your retailer login credentials. However, no method
            of transmission over the internet is 100% secure, and we cannot guarantee absolute
            security. We encourage you to use a strong, unique password and to enable two-factor
            authentication on your Google account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">8. Your Rights and Choices</h2>
          <p className="mb-4">You have the right to:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Access the personal information we hold about you</li>
            <li>Correct inaccurate or incomplete information</li>
            <li>Delete your account and personal information</li>
            <li>Disconnect any connected retailer or bank account at any time</li>
            <li>Opt out of marketing communications</li>
            <li>Request a copy of your data in a portable format</li>
          </ul>
          <p className="mt-4">
            To exercise any of these rights, contact us at{" "}
            <a href="mailto:privacy@restox.net" style={{ color: "#F47C20" }} className="underline">
              privacy@restox.net
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
          <p>
            Restox is not directed to children under the age of 13. We do not knowingly collect
            personal information from children under 13. If we become aware that we have collected
            personal information from a child under 13, we will delete it promptly. If you believe
            we may have collected information from a child under 13, please contact us at{" "}
            <a href="mailto:privacy@restox.net" style={{ color: "#F47C20" }} className="underline">
              privacy@restox.net
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">10. California Privacy Rights (CCPA)</h2>
          <p className="mb-4">
            If you are a California resident, you have additional rights under the California Consumer
            Privacy Act (CCPA), including the right to know what personal information we collect, the
            right to delete your personal information, and the right to opt out of the sale of your
            personal information. We do not sell personal information.
          </p>
          <p>
            To submit a CCPA request, contact us at{" "}
            <a href="mailto:privacy@restox.net" style={{ color: "#F47C20" }} className="underline">
              privacy@restox.net
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes
            by email or by posting a prominent notice on the Service. Your continued use of the Service
            after changes become effective constitutes your acceptance of the updated policy. We
            encourage you to review this policy periodically.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us:</p>
          <div className="mt-4 p-6 rounded-xl border border-gray-200 text-gray-600 space-y-1">
            <p className="font-semibold text-gray-900">Restox LLC</p>
            <p>Las Vegas, Nevada</p>
            <p>
              Email:{" "}
              <a href="mailto:privacy@restox.net" style={{ color: "#F47C20" }} className="underline">
                privacy@restox.net
              </a>
            </p>
            <p>
              Website:{" "}
              <a href="https://restox.net" style={{ color: "#F47C20" }} className="underline">
                restox.net
              </a>
            </p>
          </div>
        </section>

      </div>

      {/* Footer */}
      <div style={{ backgroundColor: "#1A1A2E" }} className="py-8 px-6 text-center">
        <p className="text-gray-500 text-sm">
          © 2026 Restox LLC · All rights reserved ·{" "}
          <a href="/terms" style={{ color: "#F47C20" }} className="hover:underline">
            Terms of Service
          </a>
        </p>
      </div>
    </main>
  );
}
