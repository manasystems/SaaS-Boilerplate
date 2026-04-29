import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';

import { ProjectsPanel } from '@/features/projects/ProjectsPanel';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { users } from '@/models/Schema';

import { CompanyNameField } from './CompanyNameField';
import { SignOutButton } from './sign-out-button';

export const metadata: Metadata = {
  title: 'Projects | Mana',
};

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let companyName: string | null = null;
  if (user) {
    try {
      const [row] = await db.select().from(users).where(eq(users.id, user.id));
      companyName = row?.companyName ?? null;
    } catch {
      // users table may not exist yet if migration 0002 hasn't been applied
    }
  }

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
            <CompanyNameField initialValue={companyName} />
            <SignOutButton />
          </div>
        </div>

        <ProjectsPanel />
      </div>
    </main>
  );
}
