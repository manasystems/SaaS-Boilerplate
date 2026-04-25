import { SignOutButton } from './sign-out-button';

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-semibold">Welcome to Mana</h1>
      <SignOutButton />
    </main>
  );
}
