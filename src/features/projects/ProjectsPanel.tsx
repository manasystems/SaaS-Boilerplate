'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Project = {
  id: string;
  name: string;
  companyName: string | null;
  createdAt: string;
};

export function ProjectsPanel() {
  const router = useRouter();
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  return (
    <div className="w-full max-w-2xl">
      <h2 className="mb-4 text-xl font-semibold">Projects</h2>

      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <Input
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
        ? <p className="text-sm text-muted-foreground">Loading…</p>
        : projectList.length === 0
          ? <p className="text-sm text-muted-foreground">No projects yet. Create your first one above.</p>
          : (
              <ul className="space-y-2">
                {projectList.map(project => (
                  <li
                    key={project.id}
                    className="flex items-center gap-2 rounded-lg border px-4 py-3"
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
                              className="flex-1 text-left font-medium transition-colors hover:text-[#C2410C]"
                              onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                            >
                              {project.name}
                            </button>
                            {project.companyName && (
                              <span className="text-sm text-muted-foreground">{project.companyName}</span>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
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
                              className="text-destructive hover:text-destructive"
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
