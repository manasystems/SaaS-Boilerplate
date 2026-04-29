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
          <p className="mt-1 text-sm text-stone-400">Last updated: April 29, 2025</p>
        </div>

        <div className="prose-sm prose prose-stone max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Mana ("the Service"), operated by Mana Systems, you agree to be
            bound by these Terms of Service. If you do not agree to these terms, do not use the Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Mana is a web-based construction estimating application that allows users to create
            project estimates, manage line items, apply markup, and export bid documents. The Service
            is provided on a subscription basis.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            You must create an account to use the Service. You are responsible for maintaining the
            confidentiality of your account credentials and for all activity that occurs under your
            account. You must notify us immediately of any unauthorized use of your account.
          </p>
          <p>
            You must be at least 18 years old to use the Service and must provide accurate, current,
            and complete information during registration.
          </p>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose or in violation of any regulations</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
            <li>Upload malicious code, scripts, or content</li>
            <li>Resell or sublicense access to the Service without our written permission</li>
            <li>Use the Service to harm, threaten, or harass others</li>
          </ul>

          <h2>5. Your Data</h2>
          <p>
            You retain ownership of all project data, estimates, and content you create in the Service.
            By using the Service, you grant Mana Systems a limited license to store, process, and
            display your data solely for the purpose of providing the Service to you.
          </p>
          <p>
            We do not sell your data to third parties. See our
            {' '}
            <Link href="/privacy" className="text-orange-700 hover:underline">Privacy Policy</Link>
            {' '}
            for details on how we handle your information.
          </p>

          <h2>6. Intellectual Property</h2>
          <p>
            The Service, including its design, software, and content (excluding your data), is owned
            by Mana Systems and protected by intellectual property laws. You may not copy, modify,
            distribute, or reverse-engineer any part of the Service.
          </p>

          <h2>7. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
            EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS
            FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL
            BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
          </p>
          <p>
            Estimates and calculations produced by the Service are for informational purposes only.
            Mana Systems is not responsible for any financial decisions made based on Service output.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, MANA SYSTEMS SHALL NOT BE LIABLE FOR ANY
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF
            PROFITS, DATA, OR BUSINESS, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE,
            EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
          </p>
          <p>
            OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING FROM THESE TERMS OR YOUR USE OF THE
            SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE MONTHS PRECEDING THE CLAIM.
          </p>

          <h2>9. Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at any time, with or without notice,
            for conduct that violates these Terms or is harmful to other users, us, or third parties.
            You may cancel your account at any time by contacting us. Upon termination, your right to
            use the Service ceases immediately.
          </p>

          <h2>10. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify you of material changes by
            posting the new Terms with an updated date. Continued use of the Service after changes
            constitutes acceptance of the new Terms.
          </p>

          <h2>11. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Texas, without regard to conflict of
            law principles. Any disputes shall be resolved in the courts of Travis County, Texas.
          </p>

          <h2>12. Contact</h2>
          <p>
            Questions about these Terms? Contact us at
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
