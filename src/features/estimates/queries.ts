import { and, asc, eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { estimates, lineItems } from '@/models/Schema';

export async function getOrCreateEstimate(projectId: string, userId: string) {
  const existing = await db
    .select()
    .from(estimates)
    .where(and(eq(estimates.projectId, projectId), eq(estimates.userId, userId)))
    .limit(1);

  if (existing[0]) {
    return existing[0];
  }

  const [created] = await db
    .insert(estimates)
    .values({ projectId, userId })
    .returning();
  return created!;
}

export async function listLineItems(estimateId: string, userId: string) {
  return db
    .select()
    .from(lineItems)
    .where(and(eq(lineItems.estimateId, estimateId), eq(lineItems.userId, userId)))
    .orderBy(asc(lineItems.sortOrder));
}

export async function createLineItem(estimateId: string, userId: string, sortOrder: number) {
  const [item] = await db
    .insert(lineItems)
    .values({ estimateId, userId, description: '', quantity: '1', unitPrice: '0', sortOrder })
    .returning();
  return item!;
}

export async function updateLineItem(
  id: string,
  userId: string,
  patch: {
    description?: string;
    quantity?: string;
    unit?: string | null;
    unitPrice?: string;
    sortOrder?: number;
  },
) {
  const [updated] = await db
    .update(lineItems)
    .set(patch)
    .where(and(eq(lineItems.id, id), eq(lineItems.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function deleteLineItem(id: string, userId: string) {
  const [deleted] = await db
    .delete(lineItems)
    .where(and(eq(lineItems.id, id), eq(lineItems.userId, userId)))
    .returning();
  return deleted ?? null;
}
