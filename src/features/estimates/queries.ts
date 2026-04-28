import { and, asc, eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { estimates, lineItems, markupRows } from '@/models/Schema';

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

export async function listMarkupRows(estimateId: string) {
  return db
    .select()
    .from(markupRows)
    .where(eq(markupRows.estimateId, estimateId))
    .orderBy(asc(markupRows.sortOrder));
}

export async function ensureDefaultMarkupRows(estimateId: string) {
  const existing = await listMarkupRows(estimateId);
  if (existing.length > 0) {
    return existing;
  }
  const defaults = [
    { estimateId, label: 'Overhead', percentage: '10', sortOrder: 0 },
    { estimateId, label: 'Profit', percentage: '8', sortOrder: 1 },
    { estimateId, label: 'Contingency', percentage: '5', sortOrder: 2 },
  ];
  return db.insert(markupRows).values(defaults).returning();
}

export async function updateMarkupRow(id: string, userId: string, patch: { percentage?: string }) {
  const [row] = await db.select().from(markupRows).where(eq(markupRows.id, id)).limit(1);
  if (!row) {
    return null;
  }
  const [est] = await db
    .select()
    .from(estimates)
    .where(and(eq(estimates.id, row.estimateId), eq(estimates.userId, userId)))
    .limit(1);
  if (!est) {
    return null;
  }
  const [updated] = await db
    .update(markupRows)
    .set(patch)
    .where(eq(markupRows.id, id))
    .returning();
  return updated ?? null;
}
