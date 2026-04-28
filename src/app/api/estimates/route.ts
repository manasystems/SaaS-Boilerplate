import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getOrCreateEstimate } from '@/features/estimates/queries';
import { createClient } from '@/libs/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projectId = request.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  const estimate = await getOrCreateEstimate(projectId, user.id);
  return NextResponse.json(estimate);
}
