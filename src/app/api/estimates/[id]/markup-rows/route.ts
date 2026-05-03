import { and, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { ensureDefaultMarkupRows } from '@/features/estimates/queries';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { estimates, userProfiles } from '@/models/Schema';

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

  const [profile] = await db
    .select({
      defaultOverhead: userProfiles.defaultOverhead,
      defaultProfit: userProfiles.defaultProfit,
      defaultContingency: userProfiles.defaultContingency,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  const userDefaults = profile
    ? {
        overhead: Number.parseFloat(profile.defaultOverhead ?? '10'),
        profit: Number.parseFloat(profile.defaultProfit ?? '8'),
        contingency: Number.parseFloat(profile.defaultContingency ?? '5'),
      }
    : undefined;

  const rows = await ensureDefaultMarkupRows(params.id, userDefaults);
  return NextResponse.json(rows);
}
