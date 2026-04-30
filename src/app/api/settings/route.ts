import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { userProfiles } from '@/models/Schema';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [row] = await db.select().from(userProfiles).where(eq(userProfiles.userId, user.id));
  return NextResponse.json(row ?? {});
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const patch: Partial<typeof userProfiles.$inferInsert> = {};
  if ('companyName' in body) {
    patch.companyName = typeof body.companyName === 'string' ? body.companyName.trim() || null : null;
  }
  if ('companyAddress' in body) {
    patch.companyAddress = typeof body.companyAddress === 'string' ? body.companyAddress.trim() || null : null;
  }
  if ('companyPhone' in body) {
    patch.companyPhone = typeof body.companyPhone === 'string' ? body.companyPhone.trim() || null : null;
  }
  if ('companyEmail' in body) {
    patch.companyEmail = typeof body.companyEmail === 'string' ? body.companyEmail.trim() || null : null;
  }

  const [row] = await db
    .insert(userProfiles)
    .values({ userId: user.id, ...patch, updatedAt: new Date() })
    .onConflictDoUpdate({ target: userProfiles.userId, set: { ...patch, updatedAt: new Date() } })
    .returning();

  return NextResponse.json(row ?? {});
}
