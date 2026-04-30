import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Mana',
};

export default function TermsPage() {
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
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-stone-900">Terms of Service</h1>
          <p className="mt-1 text-sm text-stone-400">Last updated: April 30, 2025</p>
        </div>

        <div className="prose-sm prose prose-stone max-w-none">
          <h2>1. Service Description</h2>
          <p>
            Mana is a web-based construction estimating application that allows users to create
            project estimates, manage line items, apply markup, and export bid documents. The Service
            is operated by Mana Systems and provided on a subscription basis.
          </p>

          <h2>2. User Responsibilities</h2>
          <p>
            You must create an account to use the Service. You are responsible for maintaining the
            confidentiality of your account credentials and for all activity that occurs under your
            account. You agree not to:
          </p>
          <ul>
            <li>Use the Service for any unlawful purpose or in violation of any regulations</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
            <li>Upload malicious code, scripts, or content</li>
            <li>Resell or sublicense access to the Service without written permission</li>
          </ul>
          <p>
            You retain ownership of all project data, estimates, and content you create in the Service.
            By using the Service, you grant Mana Systems a limited license to store, process, and
            display your data solely for the purpose of providing the Service to you.
          </p>

          <h2>3. Limitation of Liability</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. MANA SYSTEMS SHALL NOT
            BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF
            OR IN CONNECTION WITH YOUR USE OF THE SERVICE. ESTIMATES AND CALCULATIONS ARE FOR
            INFORMATIONAL PURPOSES ONLY — MANA SYSTEMS IS NOT RESPONSIBLE FOR FINANCIAL DECISIONS
            MADE BASED ON SERVICE OUTPUT.
          </p>
          <p>
            OUR TOTAL LIABILITY FOR ANY CLAIM SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE
            TWELVE MONTHS PRECEDING THE CLAIM.
          </p>

          <h2>4. Contact</h2>
          <p>
            Questions about these Terms? Contact us at
            {' '}
            <a href="mailto:admin@manasystems.us" className="text-orange-700 hover:underline">
              admin@manasystems.us
            </a>
            . See also our
            {' '}
            <Link href="/legal/privacy" className="text-orange-700 hover:underline">Privacy Policy</Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
