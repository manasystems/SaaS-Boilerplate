import Link from 'next/link';

import { FeedbackButton } from '@/components/FeedbackButton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <footer className="border-t border-stone-100 bg-stone-50 py-4">
        <div className="flex items-center justify-center gap-6 text-xs text-stone-400">
          <span>
            ©
            {new Date().getFullYear()}
            {' '}
            Mana Systems
          </span>
          <Link href="/terms" className="transition-colors hover:text-stone-600">Terms of Service</Link>
          <Link href="/privacy" className="transition-colors hover:text-stone-600">Privacy Policy</Link>
        </div>
      </footer>
      <FeedbackButton />
    </>
  );
}
