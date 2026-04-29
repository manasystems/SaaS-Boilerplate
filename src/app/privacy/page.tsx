import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Mana',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10">
          <Link
            href="/dashboard"
            className="text-sm text-stone-400 transition-colors hover:text-stone-600"
          >
            ← Back to Mana
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-stone-900">Privacy Policy</h1>
          <p className="mt-1 text-sm text-stone-400">Last updated: April 29, 2025</p>
        </div>

        <div className="prose-sm prose prose-stone max-w-none">
          <p>
            Mana Systems ("we," "us," or "our") operates the Mana construction estimating platform.
            This Privacy Policy describes how we collect, use, and protect your information when you
            use our Service.
          </p>

          <h2>1. Information We Collect</h2>

          <h3>Account Information</h3>
          <p>
            When you create an account, we collect your email address and password (stored as a
            secure hash). You may optionally provide a company name.
          </p>

          <h3>Project and Estimate Data</h3>
          <p>
            We store the projects, estimates, line items, and other content you create in the Service.
            This data is associated with your account and isolated from other users.
          </p>

          <h3>Usage Data</h3>
          <p>
            We may collect basic technical information such as browser type, pages visited, and
            timestamps to help us improve the Service. We do not sell or share this data for
            advertising purposes.
          </p>

          <h3>Feedback</h3>
          <p>
            If you submit feedback through the in-app feedback tool, we store the message text and
            your user ID to help us improve the Service.
          </p>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, operate, and maintain the Service</li>
            <li>Authenticate your identity and secure your account</li>
            <li>Respond to your feedback and support requests</li>
            <li>Improve the Service based on usage patterns</li>
            <li>Send transactional emails (account confirmation, password reset)</li>
          </ul>
          <p>We do not use your data to train machine learning models or sell it to advertisers.</p>

          <h2>3. Data Storage and Security</h2>
          <p>
            Your data is stored in a managed PostgreSQL database hosted on Neon. Authentication is
            handled by Supabase. The Service is hosted on Vercel. All three providers maintain
            industry-standard security practices including encryption at rest and in transit.
          </p>
          <p>
            We implement reasonable administrative, technical, and physical safeguards to protect
            your information. However, no method of transmission over the internet is 100% secure.
          </p>

          <h2>4. Third-Party Services</h2>
          <p>We use the following third-party services to operate the platform:</p>
          <ul>
            <li>
              <strong>Supabase</strong>
              {' '}
              — authentication and session management
            </li>
            <li>
              <strong>Neon</strong>
              {' '}
              — PostgreSQL database hosting
            </li>
            <li>
              <strong>Vercel</strong>
              {' '}
              — application hosting and edge delivery
            </li>
            <li>
              <strong>Resend</strong>
              {' '}
              — transactional email delivery
            </li>
          </ul>
          <p>
            Each of these providers has their own privacy policies and security practices. We do not
            share your personal data with any other third parties.
          </p>

          <h2>5. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active. If you delete your
            account, we will delete your personal information within 30 days, except where we are
            required to retain it for legal or compliance purposes.
          </p>

          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Export your project and estimate data</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at
            {' '}
            <a href="mailto:hello@manasystems.us" className="text-orange-700 hover:underline">
              hello@manasystems.us
            </a>
            .
          </p>

          <h2>7. Cookies</h2>
          <p>
            We use session cookies to keep you logged in. We do not use tracking cookies or
            third-party advertising cookies. You can disable cookies in your browser settings, but
            doing so will prevent you from logging in to the Service.
          </p>

          <h2>8. Children's Privacy</h2>
          <p>
            The Service is not directed at children under 18. We do not knowingly collect personal
            information from children. If you believe we have inadvertently collected such
            information, please contact us immediately.
          </p>

          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material
            changes by posting the updated policy with a new effective date. Your continued use of
            the Service after changes constitutes acceptance of the updated policy.
          </p>

          <h2>10. Contact</h2>
          <p>
            Questions about this Privacy Policy? Contact us at
            {' '}
            <a href="mailto:hello@manasystems.us" className="text-orange-700 hover:underline">
              hello@manasystems.us
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
