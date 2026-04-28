'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Project = {
  id: string;
  name: string;
  companyName: string | null;
  createdAt: string;
};

function SkeletonCard() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-stone-100 bg-stone-50 px-4 py-3">
      <div className="h-4 w-48 animate-pulse rounded bg-stone-200" />
      <div className="ml-auto h-3 w-16 animate-pulse rounded bg-stone-200" />
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 py-16 text-center">
      <svg
        className="mb-4 size-12 text-stone-300"
        fill="none"
        viewBox="0 0 48 48"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <rect x="6" y="10" width="36" height="30" rx="3" />
        <path d="M6 18h36" />
        <path d="M16 10V6M32 10V6" />
      </svg>
      <h3 className="mb-1 text-base font-semibold text-stone-700">No projects yet</h3>
      <p className="mb-6 text-sm text-stone-400">Get started by creating your first estimate.</p>
      <Button
        onClick={onCreateClick}
        style={{ backgroundColor: '#C2410C' }}
        className="text-white hover:opacity-90"
      >
        Create your first project
      </Button>
    </div>
  );
}

export function ProjectsPanel() {
  const router = useRouter();
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const newNameInputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjectList(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      return;
    }
    setCreating(true);
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    setNewName('');
    setCreating(false);
    refresh();
  };

  const handleRename = async (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      return;
    }
    await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    setEditingId(null);
    refresh();
  };

  const handleDelete = async (id: string, name: string) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      return;
    }
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    refresh();
  };

  const focusNewNameInput = () => {
    newNameInputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-2xl">
      <h2 className="mb-4 text-xl font-semibold text-stone-800">Projects</h2>

      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <Input
          ref={newNameInputRef}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New project name"
          className="flex-1"
        />
        <Button type="submit" disabled={creating || !newName.trim()}>
          {creating ? 'Creating…' : 'New Project'}
        </Button>
      </form>

      {loading
        ? (
            <div className="space-y-2">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )
        : projectList.length === 0
          ? <EmptyState onCreateClick={focusNewNameInput} />
          : (
              <ul className="space-y-2">
                {projectList.map(project => (
                  <li
                    key={project.id}
                    className="flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-3 transition-colors hover:border-stone-300 hover:bg-stone-50"
                  >
                    {editingId === project.id
                      ? (
                          <>
                            <Input
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              className="flex-1"
                              // eslint-disable-next-line jsx-a11y/no-autofocus
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleRename(project.id);
                                }
                                if (e.key === 'Escape') {
                                  setEditingId(null);
                                }
                              }}
                            />
                            <Button size="sm" onClick={() => handleRename(project.id)}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                          </>
                        )
                      : (
                          <>
                            <button
                              type="button"
                              className="flex-1 text-left font-medium text-stone-800 transition-colors hover:text-[#C2410C]"
                              onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                            >
                              {project.name}
                            </button>
                            {project.companyName && (
                              <span className="text-xs text-stone-400">{project.companyName}</span>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-stone-400 hover:text-stone-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(project.id);
                                setEditName(project.name);
                              }}
                            >
                              Rename
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-stone-400 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(project.id, project.name);
                              }}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                  </li>
                ))}
              </ul>
            )}
    </div>
  );
}
