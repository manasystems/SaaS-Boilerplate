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
  defaultOverhead?: string | null;
  defaultProfit?: string | null;
  defaultContingency?: string | null;
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

function DefaultsTab() {
  const [overhead, setOverhead] = useState('10');
  const [profit, setProfit] = useState('8');
  const [contingency, setContingency] = useState('5');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then((data: ProfileData) => {
        setOverhead(data.defaultOverhead ?? '10');
        setProfit(data.defaultProfit ?? '8');
        setContingency(data.defaultContingency ?? '5');
      })
      .finally(() => setLoading(false));
  }, []);

  const oh = Number.parseFloat(overhead) || 0;
  const pr = Number.parseFloat(profit) || 0;
  const co = Number.parseFloat(contingency) || 0;
  const subtotal = 10000;
  const afterOverhead = subtotal * (1 + oh / 100);
  const afterProfit = afterOverhead * (1 + pr / 100);
  const afterContingency = afterProfit * (1 + co / 100);

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  async function handleSave() {
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        defaultOverhead: overhead,
        defaultProfit: profit,
        defaultContingency: contingency,
      }),
    });
    if (savedTimer.current) {
      clearTimeout(savedTimer.current);
    }
    setSaved(true);
    savedTimer.current = setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
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
    <div className="space-y-6">
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-stone-700">Default Markup Rates</h3>
        <div className="space-y-4">
          {[
            { label: 'Overhead %', value: overhead, set: setOverhead },
            { label: 'Profit %', value: profit, set: setProfit },
            { label: 'Contingency %', value: contingency, set: setContingency },
          ].map(({ label, value, set }) => (
            <div key={label} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-stone-700">{label}</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={value}
                onChange={e => set(e.target.value)}
                className="w-40 rounded border border-stone-200 px-3 py-2 text-sm text-stone-800 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-300"
              />
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="rounded px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--brand-orange)' }}
          >
            Save Defaults
          </button>
          {saved && (
            <span className="text-xs font-medium text-green-600">Saved ✓</span>
          )}
        </div>
        <p className="mt-3 text-xs text-stone-400">
          Applied automatically to new estimates.
        </p>
      </div>

      {/* Live preview */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-stone-700">
          Live Preview — $10,000 Subtotal
        </h3>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-stone-100">
              <td className="py-2 text-stone-600">Subtotal</td>
              <td className="py-2 text-right font-mono text-stone-800">{fmt(subtotal)}</td>
            </tr>
            <tr className="border-b border-stone-100">
              <td className="py-2 text-stone-600">
                + Overhead (
                {oh}
                %)
              </td>
              <td className="py-2 text-right font-mono text-stone-800">{fmt(afterOverhead)}</td>
            </tr>
            <tr className="border-b border-stone-100">
              <td className="py-2 text-stone-600">
                + Profit (
                {pr}
                %)
              </td>
              <td className="py-2 text-right font-mono text-stone-800">{fmt(afterProfit)}</td>
            </tr>
            <tr className="border-b border-stone-100">
              <td className="py-2 text-stone-600">
                + Contingency (
                {co}
                %)
              </td>
              <td className="py-2 text-right font-mono text-stone-800">{fmt(afterContingency)}</td>
            </tr>
            <tr>
              <td className="py-2 font-semibold text-stone-800">Grand Total</td>
              <td className="py-2 text-right font-mono font-semibold text-stone-800">
                {fmt(afterContingency)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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
      {activeTab === 'defaults' && <DefaultsTab />}
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
