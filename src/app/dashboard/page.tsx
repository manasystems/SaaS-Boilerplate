import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import Image from 'next/image';

import { ProjectsPanel } from '@/features/projects/ProjectsPanel';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { userProfiles } from '@/models/Schema';

import { SignOutButton } from './sign-out-button';

export const metadata: Metadata = {
  title: 'Projects | Mana Build',
};

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let logoUrl: string | null = null;
  if (user) {
    const [profile] = await db
      .select({ logoUrl: userProfiles.logoUrl })
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id));
    logoUrl = profile?.logoUrl ?? null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl && (
              <div className="relative h-10 w-28 shrink-0 overflow-hidden rounded">
                <Image
                  src={logoUrl}
                  alt="Company logo"
                  fill
                  className="object-contain object-left"
                  unoptimized
                />
              </div>
            )}
            <div>
              <h1
                className="text-2xl tracking-tight"
                style={{ color: 'var(--brand-orange)', fontFamily: 'var(--font-archivo-black)' }}
              >
                Mana Build
              </h1>
              <p className="mt-0.5 text-[11px] text-stone-500">Construction Estimating Software</p>
            </div>
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
