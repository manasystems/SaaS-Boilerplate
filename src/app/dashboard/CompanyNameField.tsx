'use client';

import { useEffect, useRef, useState } from 'react';

export function CompanyNameField({ initialValue }: { initialValue: string | null }) {
  const [value, setValue] = useState(initialValue ?? '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(initialValue ?? '');
  }, [initialValue]);

  const save = (val: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    setStatus('saving');
    debounceTimer.current = setTimeout(async () => {
      await fetch('/api/user-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: val || null }),
      });
      setStatus('saved');
      setTimeout(() => setStatus(s => (s === 'saved' ? 'idle' : s)), 2000);
    }, 600);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="company-name" className="text-xs font-medium text-stone-400">
        Company
      </label>
      <input
        id="company-name"
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          save(e.target.value);
        }}
        placeholder="Your company name"
        className="rounded border border-stone-200 bg-transparent px-2 py-1 text-sm text-stone-700 placeholder:text-stone-300 focus:border-stone-400 focus:outline-none"
      />
      {status === 'saving' && <span className="text-xs text-stone-400">Saving…</span>}
      {status === 'saved' && <span className="text-xs text-green-600">Saved</span>}
    </div>
  );
}
