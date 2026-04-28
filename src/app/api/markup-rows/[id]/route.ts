import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { updateMarkupRow } from '@/features/estimates/queries';
import { createClient } from '@/libs/supabase/server';

type Params = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Params) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const updated = await updateMarkupRow(params.id, user.id, { percentage: body.percentage });
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(updated);
}
