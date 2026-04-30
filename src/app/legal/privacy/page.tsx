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
          <p className="mt-1 text-sm text-stone-400">Last updated: April 30, 2025</p>
        </div>

        <div className="prose-sm prose prose-stone max-w-none">
          <p>
            Mana Systems ("we," "us," or "our") operates the Mana construction estimating platform.
            This Privacy Policy describes how we collect, use, and protect your information.
          </p>

          <h2>1. What Data We Collect</h2>
          <p>
            When you create an account, we collect your email address and password (stored as a
            secure hash via Supabase Auth). You may optionally provide company information (name,
            address, phone, email) in your account settings.
          </p>
          <p>
            We store the projects, estimates, line items, markup rows, and other content you create
            in the Service. This data is associated with your account and isolated from other users.
          </p>
          <p>
            If you submit feedback through the in-app feedback tool, we store the message text and
            your user ID to help us improve the Service.
          </p>

          <h2>2. How It's Stored</h2>
          <p>
            Your estimate data is stored in a managed PostgreSQL database hosted on
            {' '}
            <strong>Neon</strong>
            {' '}
            (us-east-1). Authentication is handled by
            {' '}
            <strong>Supabase</strong>
            . The application is hosted on
            <strong>Vercel</strong>
            . All
            three providers maintain industry-standard security including encryption at rest and in
            transit. We do not sell your data to third parties or use it to train machine learning
            models.
          </p>

          <h2>3. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>
              Request deletion of your account and associated data — deleting your account removes
              all your projects, estimates, and profile data within 30 days
            </li>
          </ul>
          <p>
            To exercise any of these rights, contact us at
            {' '}
            <a href="mailto:admin@manasystems.us" className="text-orange-700 hover:underline">
              admin@manasystems.us
            </a>
            .
          </p>

          <h2>4. Contact</h2>
          <p>
            Questions about this Privacy Policy? Contact us at
            {' '}
            <a href="mailto:admin@manasystems.us" className="text-orange-700 hover:underline">
              admin@manasystems.us
            </a>
            . See also our
            {' '}
            <Link href="/legal/terms" className="text-orange-700 hover:underline">Terms of Service</Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
