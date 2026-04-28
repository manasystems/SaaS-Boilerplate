import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { users } from '@/models/Schema';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [row] = await db.select().from(users).where(eq(users.id, user.id));
  return NextResponse.json({ companyName: row?.companyName ?? null });
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const companyName = typeof body?.companyName === 'string' ? body.companyName.trim() : null;

  const [row] = await db
    .insert(users)
    .values({ id: user.id, companyName, updatedAt: new Date() })
    .onConflictDoUpdate({ target: users.id, set: { companyName, updatedAt: new Date() } })
    .returning();

  return NextResponse.json({ companyName: row?.companyName ?? null });
}
