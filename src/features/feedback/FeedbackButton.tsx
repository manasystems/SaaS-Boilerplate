'use client';

import { useRef, useState } from 'react';

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function openModal() {
    setOpen(true);
    setStatus('idle');
    setMessage('');
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function closeModal() {
    setOpen(false);
    setStatus('idle');
    setMessage('');
  }

  async function submit() {
    if (!message.trim() || status === 'submitting') {
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      });
      if (!res.ok) {
        throw new Error('Failed');
      }
      setStatus('done');
      setTimeout(() => closeModal(), 1500);
    } catch {
      setStatus('error');
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="fixed bottom-6 left-6 z-40 rounded-full bg-stone-800 px-4 py-2 text-sm font-medium text-white shadow-lg transition-colors hover:bg-stone-700"
      >
        Feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop — accessible button so click-to-dismiss works without a11y violations */}
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
            aria-label="Close feedback dialog"
            tabIndex={-1}
          />
          <div className="relative">
            <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-base font-semibold text-stone-800">Send feedback</h2>
                  <p className="mt-0.5 text-xs text-stone-400">What's working? What's not?</p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-stone-400 transition-colors hover:text-stone-600"
                  aria-label="Close"
                >
                  <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              </div>

              {status === 'done'
                ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-center">
                      <svg className="size-8 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm font-medium text-stone-700">Thanks — feedback received!</p>
                    </div>
                  )
                : (
                    <>
                      <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Describe what you'd like to see improved..."
                        rows={5}
                        maxLength={2000}
                        className="w-full resize-none rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            submit();
                          }
                        }}
                      />
                      {status === 'error' && (
                        <p className="mt-1 text-xs text-red-500">Something went wrong — please try again.</p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-stone-400">
                          {message.length}
                          /2000
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={closeModal}
                            className="rounded-lg px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-100"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={submit}
                            disabled={!message.trim() || status === 'submitting'}
                            className="rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
                            style={{ backgroundColor: '#C2410C' }}
                          >
                            {status === 'submitting' ? 'Sending…' : 'Send'}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
