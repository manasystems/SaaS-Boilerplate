import { and, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { ensureDefaultMarkupRows } from '@/features/estimates/queries';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { estimates } from '@/models/Schema';

type Params = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user owns this estimate
  const [est] = await db
    .select()
    .from(estimates)
    .where(and(eq(estimates.id, params.id), eq(estimates.userId, user.id)))
    .limit(1);
  if (!est) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const rows = await ensureDefaultMarkupRows(params.id);
  return NextResponse.json(rows);
}
