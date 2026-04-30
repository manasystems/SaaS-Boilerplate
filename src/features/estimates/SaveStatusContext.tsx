'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type SaveStatusContextValue = {
  saveStatus: SaveStatus;
  setSaveStatus: (s: SaveStatus) => void;
  lastSavedAt: Date | null;
  setLastSavedAt: (d: Date | null) => void;
};

const SaveStatusContext = createContext<SaveStatusContextValue>({
  saveStatus: 'idle',
  setSaveStatus: () => {},
  lastSavedAt: null,
  setLastSavedAt: () => {},
});

export function SaveStatusProvider({ children }: { children: React.ReactNode }) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const value = useMemo(
    () => ({ saveStatus, setSaveStatus, lastSavedAt, setLastSavedAt }),
    [saveStatus, lastSavedAt],
  );
  return (
    <SaveStatusContext.Provider value={value}>
      {children}
    </SaveStatusContext.Provider>
  );
}

export function useSaveStatus() {
  return useContext(SaveStatusContext);
}

function useRelativeTime(date: Date | null): string {
  const [, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!date) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => setTick(t => t + 1), 10_000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [date]);

  if (!date) {
    return '';
  }
  const elapsed = Math.floor((Date.now() - date.getTime()) / 1000);
  if (elapsed < 10) {
    return 'just now';
  }
  if (elapsed < 60) {
    return `${Math.floor(elapsed / 10) * 10}s ago`;
  }
  const mins = Math.floor(elapsed / 60);
  return `${mins}m ago`;
}

export function GlobalSaveIndicator() {
  const { saveStatus, lastSavedAt } = useSaveStatus();
  const relativeTime = useRelativeTime(saveStatus === 'saved' ? lastSavedAt : null);

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
          <span className="text-stone-600">
            Saved
            {relativeTime ? ` · ${relativeTime}` : ''}
          </span>
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
