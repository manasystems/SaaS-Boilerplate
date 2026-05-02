'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/svg+xml'];

export function LogoUpload({ initialLogoUrl }: { initialLogoUrl?: string | null }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl ?? null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setErrorMsg('');
    setStatus('idle');

    if (!ALLOWED_MIME.includes(file.type)) {
      setErrorMsg('File must be PNG, JPG, or SVG.');
      return;
    }

    if (file.size > MAX_BYTES) {
      setErrorMsg('File must be 2 MB or smaller.');
      return;
    }

    setStatus('uploading');

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/upload-logo', { method: 'POST', body: form });
      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error ?? 'Upload failed.');
        setStatus('error');
        return;
      }

      setLogoUrl(json.logoUrl);
      setStatus('idle');
    } catch {
      setErrorMsg('Network error — please try again.');
      setStatus('error');
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // reset input so re-selecting the same file triggers onChange
    e.target.value = '';
  }

  return (
    <div className="space-y-5 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div>
        <p className="mb-1 text-sm font-medium text-stone-700">Company Logo</p>
        <p className="text-xs text-stone-400">PNG, JPG, or SVG · max 2 MB · displayed in the dashboard header</p>
      </div>

      {/* Preview */}
      {logoUrl && (
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-40 overflow-hidden rounded border border-stone-100 bg-stone-50">
            <Image
              src={logoUrl}
              alt="Company logo preview"
              fill
              className="object-contain p-1"
              unoptimized
            />
          </div>
          <span className="text-xs font-medium text-green-600">Uploaded</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={status === 'uploading'}
          className="rounded border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'uploading'
            ? 'Uploading…'
            : logoUrl
              ? 'Replace logo'
              : 'Upload logo'}
        </button>

        {logoUrl && status === 'idle' && (
          <button
            type="button"
            onClick={async () => {
              await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logoUrl: null }),
              });
              setLogoUrl(null);
            }}
            className="text-xs text-stone-400 underline hover:text-red-500"
          >
            Remove
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {errorMsg && (
        <p className="text-sm text-red-500">{errorMsg}</p>
      )}

      <p className="pt-1 text-xs text-stone-400">
        Changes save automatically on upload.
      </p>
    </div>
  );
}
