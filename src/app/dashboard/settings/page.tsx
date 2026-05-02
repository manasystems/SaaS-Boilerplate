'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

import { LogoUpload } from '@/features/settings/LogoUpload';

type ProfileData = {
  companyName?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  logoUrl?: string | null;
};

type FieldKey = keyof ProfileData;

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'company', label: 'Company' },
  { id: 'defaults', label: 'Defaults' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'ai', label: 'AI' },
] as const;

type TabId = typeof TABS[number]['id'];

function SettingsField({
  label,
  fieldKey,
  value,
  onChange,
  onBlur,
  savedField,
  type,
}: {
  label: string;
  fieldKey: FieldKey;
  value: string;
  onChange: (key: FieldKey, val: string) => void;
  onBlur: (key: FieldKey) => void;
  savedField: FieldKey | null;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldKey} className="text-sm font-medium text-stone-700">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={fieldKey}
          type={type ?? 'text'}
          value={value}
          onChange={e => onChange(fieldKey, e.target.value)}
          onBlur={() => onBlur(fieldKey)}
          className="flex-1 rounded border border-stone-200 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-300 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-300"
          placeholder={label}
        />
        {savedField === fieldKey && (
          <span className="text-xs font-medium text-green-600">Saved</span>
        )}
      </div>
    </div>
  );
}

function CompanyTab() {
  const [form, setForm] = useState<ProfileData>({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
  });
  const [loading, setLoading] = useState(true);
  const [savedField, setSavedField] = useState<FieldKey | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then((data: ProfileData) => {
        setForm({
          companyName: data.companyName ?? '',
          companyAddress: data.companyAddress ?? '',
          companyPhone: data.companyPhone ?? '',
          companyEmail: data.companyEmail ?? '',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  function handleChange(key: FieldKey, val: string) {
    setForm(prev => ({ ...prev, [key]: val }));
    if (savedField === key) {
      setSavedField(null);
    }
  }

  async function handleBlur(key: FieldKey) {
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: form[key] }),
    });
    if (savedTimer.current) {
      clearTimeout(savedTimer.current);
    }
    setSavedField(key);
    savedTimer.current = setTimeout(() => setSavedField(null), 3000);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={i} className="flex flex-col gap-1">
            <div className="h-4 w-28 animate-pulse rounded bg-stone-100" />
            <div className="h-10 w-full animate-pulse rounded bg-stone-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <SettingsField
        label="Company Name"
        fieldKey="companyName"
        value={form.companyName ?? ''}
        onChange={handleChange}
        onBlur={handleBlur}
        savedField={savedField}
      />
      <SettingsField
        label="Company Address"
        fieldKey="companyAddress"
        value={form.companyAddress ?? ''}
        onChange={handleChange}
        onBlur={handleBlur}
        savedField={savedField}
      />
      <SettingsField
        label="Phone"
        fieldKey="companyPhone"
        value={form.companyPhone ?? ''}
        onChange={handleChange}
        onBlur={handleBlur}
        savedField={savedField}
        type="tel"
      />
      <SettingsField
        label="Email"
        fieldKey="companyEmail"
        value={form.companyEmail ?? ''}
        onChange={handleChange}
        onBlur={handleBlur}
        savedField={savedField}
        type="email"
      />
      <p className="pt-2 text-xs text-stone-400">
        Changes save automatically when you click out of a field.
      </p>
    </div>
  );
}

function ShellTab({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-stone-400">{message}</p>
    </div>
  );
}

function AppearanceTab() {
  const [logoUrl, setLogoUrl] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then((data: ProfileData) => setLogoUrl(data.logoUrl ?? null));
  }, []);

  if (logoUrl === undefined) {
    return (
      <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-28 animate-pulse rounded bg-stone-100" />
        <div className="h-10 w-full animate-pulse rounded bg-stone-100" />
      </div>
    );
  }

  return <LogoUpload initialLogoUrl={logoUrl} />;
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab: TabId = (searchParams.get('tab') as TabId | null) ?? 'profile';

  function setTab(id: TabId) {
    router.replace(`/dashboard/settings?tab=${id}`);
  }

  return (
    <>
      {/* Tab nav */}
      <div className="mb-6 border-b border-stone-200">
        <nav className="-mb-px flex gap-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={[
                'px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-b-2 text-stone-900'
                  : 'border-b-2 border-transparent text-stone-500 hover:text-stone-700',
              ].join(' ')}
              style={activeTab === tab.id ? { borderColor: 'var(--brand-orange)', color: 'var(--brand-orange)' } : {}}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && (
        <ShellTab message="Profile settings coming soon." />
      )}
      {activeTab === 'company' && <CompanyTab />}
      {activeTab === 'defaults' && (
        <ShellTab message="Default estimate settings coming soon." />
      )}
      {activeTab === 'appearance' && <AppearanceTab />}
      {activeTab === 'ai' && (
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-stone-700">AI features coming in Beta 2.</p>
        </div>
      )}
    </>
  );
}

export default function SettingsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-8 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1
              className="text-2xl tracking-tight"
              style={{ color: 'var(--brand-orange)', fontFamily: 'var(--font-archivo-black)' }}
            >
              Mana Build
            </h1>
            <p className="mt-0.5 text-[11px] text-stone-500">Construction Estimating Software</p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-stone-400 transition-colors hover:text-stone-600"
          >
            ← Projects
          </Link>
        </div>

        <h2 className="mb-5 text-base font-semibold text-stone-800">Settings</h2>

        <Suspense>
          <SettingsContent />
        </Suspense>
      </div>
    </main>
  );
}
