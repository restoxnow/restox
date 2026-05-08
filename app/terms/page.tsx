export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div style={{ backgroundColor: "#1A1A2E" }} className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <p style={{ color: "#F47C20" }} className="text-sm font-semibold uppercase tracking-widest mb-3">
            Legal
          </p>
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-gray-400 text-base">
            Last updated: May 8, 2026 &nbsp;·&nbsp; Effective: May 8, 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-16 text-gray-700 text-base leading-relaxed space-y-10">

        <section>
          <p>
            Please read these Terms of Service ("Terms") carefully before using the Restox platform
            operated by Restox LLC ("Restox," "we," "us," or "our"). By accessing or using our Service,
            you agree to be bound by these Terms. If you do not agree to these Terms, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
          <p>
            By creating an account or using the Restox platform, you confirm that you are at least 18
            years of age, have read and understood these Terms, and agree to be legally bound by them.
            If you are using Restox on behalf of a business, you represent that you have authority to
            bind that business to these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
          <p className="mb-4">
            Restox is a cross-retailer automated repeat purchase platform that allows users to connect
            their retailer accounts, set up recurring purchase schedules, and automate reordering of
            products they buy regularly. The Service includes:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>A dashboard to manage connected retailers and reorder schedules</li>
            <li>Automated order placement on connected retailer platforms</li>
            <li>AI-powered reorder timing predictions (paid plans)</li>
            <li>Spend Intelligence powered by Plaid financial data (paid plans, opt-in)</li>
            <li>Price comparison across connected retailers</li>
            <li>Browser extension for one-click product addition</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">3. Account Registration</h2>
          <p className="mb-4">
            To use Restox, you must create an account. You agree to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain the security of your account credentials</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
            <li>Be responsible for all activity that occurs under your account</li>
          </ul>
          <p className="mt-4">
            Restox reserves the right to suspend or terminate accounts that violate these Terms or
            that we believe are being used fraudulently.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">4. Subscription Plans and Billing</h2>
          <p className="mb-4">
            Restox offers the following plans:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600 mb-4">
            <li><strong className="text-gray-800">Free</strong> — Up to 5 reorder schedules, ad-supported</li>
            <li><strong className="text-gray-800">Consumer</strong> — $9.99/month or $89/year, up to 25 schedules, ad-free</li>
            <li><strong className="text-gray-800">Professional</strong> — $29/month or $269/year, unlimited schedules, AI features</li>
            <li><strong className="text-gray-800">Business SMB</strong> — $79/month or $749/year, multi-user, advanced features</li>
          </ul>
          <p className="mb-4">
            Paid subscriptions are billed in advance on a monthly or annual basis through Stripe.
            By providing payment information, you authorize Restox to charge the applicable subscription
            fee. All fees are non-refundable except as required by law or as stated in our refund policy.
          </p>
          <p>
            We reserve the right to change subscription pricing with 30 days&apos; notice. Continued use
            of the Service after a price change constitutes acceptance of the new pricing.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">5. Retailer Account Connections</h2>
          <p className="mb-4">
            Restox allows you to connect your accounts at third-party retailers to automate purchases.
            By connecting a retailer account, you:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Authorize Restox to access your retailer account on your behalf</li>
            <li>Authorize Restox to place orders using your stored payment methods at that retailer</li>
            <li>Acknowledge that Restox is not affiliated with or endorsed by any connected retailer</li>
            <li>Accept responsibility for all orders placed through Restox on your behalf</li>
            <li>Agree to comply with the terms of service of each connected retailer</li>
          </ul>
          <p className="mt-4">
            Restox is not responsible for order fulfillment, product quality, pricing changes, or
            any issues arising from your relationship with connected retailers. All disputes regarding
            orders must be resolved directly with the retailer.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">6. Automated Orders and Notifications</h2>
          <p className="mb-4">
            When you set up a reorder schedule, Restox will automatically place orders on your behalf
            according to your settings. You will receive a notification before each order is placed
            (timing based on your notification preferences). You are responsible for:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Keeping your notification contact information current</li>
            <li>Reviewing and responding to pre-order notifications</li>
            <li>Ensuring your payment methods at connected retailers remain valid</li>
            <li>Any charges incurred from automated orders placed by Restox</li>
          </ul>
          <p className="mt-4">
            Restox is not liable for orders placed due to outdated payment information, expired
            retailer sessions, missed notifications, or changes in product pricing or availability.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">7. Financial Data and Plaid</h2>
          <p>
            The Spend Intelligence feature uses Plaid Technologies, Inc. to access your financial
            transaction data. This feature is entirely opt-in. By connecting your bank account through
            Plaid, you agree to Plaid&apos;s End User Privacy Policy available at plaid.com. Restox uses
            your transaction data solely to identify recurring purchases and suggest automations.
            We do not initiate any financial transactions through Plaid.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">8. Acceptable Use</h2>
          <p className="mb-4">You agree not to use Restox to:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Violate any applicable laws or regulations</li>
            <li>Violate the terms of service of any connected retailer</li>
            <li>Engage in fraudulent activity or place orders you do not intend to pay for</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
            <li>Interfere with or disrupt the Service or its servers</li>
            <li>Use automated scripts or bots beyond the intended functionality of the Service</li>
            <li>Resell or commercially exploit the Service without our written consent</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">9. Intellectual Property</h2>
          <p>
            The Restox name, logo, platform, and all associated content are the intellectual property
            of Restox LLC and are protected by copyright, trademark, and other applicable laws.
            Restox™ is a trademark of Restox LLC (USPTO Serial No. 99809345). You may not use our
            trademarks, logos, or brand assets without our prior written consent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">10. Disclaimers and Limitation of Liability</h2>
          <p className="mb-4">
            THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
            RESTOX DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE
            OF VIRUSES OR OTHER HARMFUL COMPONENTS.
          </p>
          <p className="mb-4">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, RESTOX SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE
            SERVICE, INCLUDING BUT NOT LIMITED TO UNAUTHORIZED ORDERS, FAILED ORDERS, PRICING
            ERRORS, OR DATA LOSS.
          </p>
          <p>
            OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM THESE TERMS OR YOUR USE OF THE
            SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO RESTOX IN THE 12 MONTHS PRECEDING THE CLAIM.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">11. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Restox LLC, its officers, directors, employees,
            and agents from any claims, damages, losses, or expenses (including reasonable attorneys&apos;
            fees) arising from your use of the Service, your violation of these Terms, or your
            violation of any third-party rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">12. Termination</h2>
          <p className="mb-4">
            You may cancel your account at any time from your Settings page. Upon cancellation:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>All active reorder schedules will be paused immediately</li>
            <li>Your data will be deleted within 30 days per our Privacy Policy</li>
            <li>No refunds will be issued for unused subscription time unless required by law</li>
          </ul>
          <p className="mt-4">
            Restox reserves the right to suspend or terminate your account at any time for violation
            of these Terms, with or without notice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">13. Governing Law and Disputes</h2>
          <p>
            These Terms are governed by the laws of the State of Nevada, without regard to its
            conflict of law provisions. Any disputes arising from these Terms or your use of the
            Service shall be resolved through binding arbitration in Las Vegas, Nevada, except that
            either party may seek injunctive relief in court for intellectual property disputes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">14. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify you of material changes by
            email or by posting a prominent notice on the Service at least 30 days before the changes
            take effect. Your continued use of the Service after changes take effect constitutes
            your acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">15. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us:</p>
          <div className="mt-4 p-6 rounded-xl border border-gray-200 text-gray-600 space-y-1">
            <p className="font-semibold text-gray-900">Restox LLC</p>
            <p>Las Vegas, Nevada</p>
            <p>
              Email:{" "}
              <a href="mailto:legal@restox.net" style={{ color: "#F47C20" }} className="underline">
                legal@restox.net
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
          <a href="/privacy" style={{ color: "#F47C20" }} className="hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </main>
  );
}
