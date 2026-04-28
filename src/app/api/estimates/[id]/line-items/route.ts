import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createLineItem, listLineItems } from '@/features/estimates/queries';
import { createClient } from '@/libs/supabase/server';

type Params = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = await listLineItems(params.id, user.id);
  return NextResponse.json(items);
}

export async function POST(request: NextRequest, { params }: Params) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const item = await createLineItem(params.id, user.id, body.sortOrder ?? 0);
  return NextResponse.json(item, { status: 201 });
}
