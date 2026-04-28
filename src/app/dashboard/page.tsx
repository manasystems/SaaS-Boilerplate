import { ProjectsPanel } from '@/features/projects/ProjectsPanel';

import { SignOutButton } from './sign-out-button';

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-8 px-4 py-16">
      <div className="flex w-full max-w-2xl items-center justify-between">
        <h1 className="text-3xl font-semibold">Mana</h1>
        <SignOutButton />
      </div>
      <ProjectsPanel />
    </main>
  );
}
