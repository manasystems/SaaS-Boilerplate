import { and, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { EstimateTable } from '@/features/estimates/EstimateTable';
import { getOrCreateEstimate } from '@/features/estimates/queries';
import { GlobalSaveIndicator, SaveStatusProvider } from '@/features/estimates/SaveStatusContext';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { projects, userProfiles } from '@/models/Schema';

type Props = { params: { projectId: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { title: 'Mana' };
  }

  const [project] = await db
    .select({ name: projects.name })
    .from(projects)
    .where(and(eq(projects.id, params.projectId), eq(projects.userId, user.id)));

  return { title: project ? `${project.name} | Mana` : 'Mana' };
}

export default async function ProjectPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  } // middleware handles redirect

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, params.projectId), eq(projects.userId, user.id)));

  if (!project) {
    notFound();
  }

  const [profile, estimate] = await Promise.all([
    db.select().from(userProfiles).where(eq(userProfiles.userId, user.id)).then(rows => rows[0] ?? null).catch(() => null),
    getOrCreateEstimate(project.id, user.id),
  ]);

  return (
    <main className="min-h-screen bg-white">
      {/* Breadcrumb header */}
      <div className="flex items-center gap-3 border-b border-stone-200 bg-stone-50 px-6 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm text-stone-400 transition-colors hover:text-stone-600"
        >
          <svg className="size-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 12L6 8l4-4" />
          </svg>
          Projects
        </Link>
        <span className="text-stone-300">/</span>
        <h1 className="text-sm font-semibold text-stone-700">{project.name}</h1>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-stone-800">Estimate</h2>
          <p className="mt-0.5 text-xs text-stone-400">
            Click any cell to edit · Tab to move right · Enter to move down · Esc to cancel
          </p>
        </div>

        <SaveStatusProvider>
          <EstimateTable
            estimateId={estimate.id}
            projectName={project.name}
            companyName={profile?.companyName ?? null}
            companyAddress={profile?.companyAddress ?? null}
            companyPhone={profile?.companyPhone ?? null}
            companyEmail={profile?.companyEmail ?? null}
          />
          <GlobalSaveIndicator />
        </SaveStatusProvider>
      </div>
    </main>
  );
}
