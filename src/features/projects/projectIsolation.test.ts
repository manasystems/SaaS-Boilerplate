/**
 * Two-account isolation test.
 *
 * Verifies that application-layer userId filtering is equivalent to row-level
 * security: User A cannot read, rename, or delete projects owned by User B.
 *
 * Uses the real Neon database (DATABASE_URL loaded from .env.local via vitest).
 * All inserted rows are cleaned up in afterEach.
 */
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/libs/DB';
import { projects } from '@/models/Schema';

import { deleteProject, listProjectsForUser, renameProject } from './queries';

// Stable fake UUIDs — not real Supabase users; userId is unconstrained in the schema.
const USER_A = '00000000-aaaa-aaaa-aaaa-000000000001';
const USER_B = '00000000-bbbb-bbbb-bbbb-000000000002';

let userBProjectIds: string[] = [];

beforeEach(async () => {
  const rows = await db
    .insert(projects)
    .values([
      { userId: USER_B, name: 'User B — Project Alpha' },
      { userId: USER_B, name: 'User B — Project Beta' },
    ])
    .returning({ id: projects.id });
  userBProjectIds = rows.map(r => r.id);
});

afterEach(async () => {
  await db.delete(projects).where(eq(projects.userId, USER_B));
  await db.delete(projects).where(eq(projects.userId, USER_A));
});

describe('project isolation — User A cannot access User B data', () => {
  it('GET: User A sees zero rows when only User B has projects', async () => {
    const results = await listProjectsForUser(USER_A);

    expect(results).toHaveLength(0);
  });

  it('GET: User B can still read their own projects', async () => {
    const results = await listProjectsForUser(USER_B);

    expect(results).toHaveLength(2);
  });

  it('DELETE: User A cannot delete a project owned by User B', async () => {
    const targetId = userBProjectIds[0]!;
    const result = await deleteProject(targetId, USER_A);

    // deleteProject returns null when userId does not match
    expect(result).toBeNull();

    // Project must still exist for User B
    const check = await listProjectsForUser(USER_B);

    expect(check).toHaveLength(2);
  });

  it('PATCH: User A cannot rename a project owned by User B', async () => {
    const targetId = userBProjectIds[0]!;
    const result = await renameProject(targetId, USER_A, 'Hijacked Name');

    // renameProject returns null when userId does not match
    expect(result).toBeNull();

    // Original name must be unchanged
    const check = await listProjectsForUser(USER_B);
    const target = check.find(p => p.id === targetId);

    expect(target?.name).toBe('User B — Project Alpha');
  });
});
