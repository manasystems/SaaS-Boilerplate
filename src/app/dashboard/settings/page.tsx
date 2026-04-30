'use client';

import { useEffect, useRef, useState } from 'react';

type ProfileData = {
  companyName?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
};

type FieldKey = keyof ProfileData;

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

export default function SettingsPage() {
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

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#C2410C' }}>Settings</h1>
            <p className="mt-0.5 text-xs text-stone-400">Your company information</p>
          </div>
          <a
            href="/dashboard"
            className="text-sm text-stone-400 transition-colors hover:text-stone-600"
          >
            ← Projects
          </a>
        </div>

        {loading
          ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <div key={i} className="flex flex-col gap-1">
                    <div className="h-4 w-28 animate-pulse rounded bg-stone-100" />
                    <div className="h-10 w-full animate-pulse rounded bg-stone-100" />
                  </div>
                ))}
              </div>
            )
          : (
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
                  Changes are saved automatically when you click out of a field.
                </p>
              </div>
            )}
      </div>
    </main>
  );
}
