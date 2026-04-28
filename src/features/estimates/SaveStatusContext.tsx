'use client';

import { createContext, useContext, useMemo, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type SaveStatusContextValue = {
  saveStatus: SaveStatus;
  setSaveStatus: (s: SaveStatus) => void;
};

const SaveStatusContext = createContext<SaveStatusContextValue>({
  saveStatus: 'idle',
  setSaveStatus: () => {},
});

export function SaveStatusProvider({ children }: { children: React.ReactNode }) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const value = useMemo(() => ({ saveStatus, setSaveStatus }), [saveStatus]);
  return (
    <SaveStatusContext.Provider value={value}>
      {children}
    </SaveStatusContext.Provider>
  );
}

export function useSaveStatus() {
  return useContext(SaveStatusContext);
}

export function GlobalSaveIndicator() {
  const { saveStatus } = useSaveStatus();

  if (saveStatus === 'idle') {
    return null;
  }

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-lg"
      style={{ fontSize: '13px' }}
    >
      {saveStatus === 'saving' && (
        <>
          <span className="size-2 animate-pulse rounded-full bg-yellow-400" />
          <span className="text-stone-600">Saving…</span>
        </>
      )}
      {saveStatus === 'saved' && (
        <>
          <span className="size-2 rounded-full bg-green-500" />
          <span className="text-stone-600">Saved ✓</span>
        </>
      )}
      {saveStatus === 'error' && (
        <>
          <span className="size-2 rounded-full bg-red-500" />
          <span className="text-red-600">Save failed</span>
        </>
      )}
    </div>
  );
}
