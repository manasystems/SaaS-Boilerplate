import { and, eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { projects } from '@/models/Schema';

export async function listProjectsForUser(userId: string) {
  return db.select().from(projects).where(eq(projects.userId, userId));
}

export async function createProject(userId: string, name: string, companyName?: string) {
  const [project] = await db
    .insert(projects)
    .values({ userId, name, companyName: companyName ?? null })
    .returning();
  return project!;
}

export async function renameProject(id: string, userId: string, name: string) {
  const [updated] = await db
    .update(projects)
    .set({ name })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function deleteProject(id: string, userId: string) {
  const [deleted] = await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning();
  return deleted ?? null;
}
