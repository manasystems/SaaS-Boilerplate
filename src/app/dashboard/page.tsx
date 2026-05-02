import type { Metadata } from 'next';

import { ProjectsPanel } from '@/features/projects/ProjectsPanel';

import { SignOutButton } from './sign-out-button';

export const metadata: Metadata = {
  title: 'Projects | Mana',
};

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-8 px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#C2410C' }}>Mana</h1>
            <p className="mt-0.5 text-xs text-stone-400">Construction Estimating</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/dashboard/settings"
              className="text-sm text-stone-500 transition-colors hover:text-stone-800"
            >
              Settings
            </a>
            <SignOutButton />
          </div>
        </div>

        <ProjectsPanel />
      </div>
    </main>
  );
}
