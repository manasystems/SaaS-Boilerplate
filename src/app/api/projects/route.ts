import { NextResponse } from 'next/server';

import { createProject, listProjectsForUser } from '@/features/projects/queries';
import { createClient } from '@/libs/supabase/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await listProjectsForUser(user.id);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const project = await createProject(user.id, name, body.companyName);
  return NextResponse.json(project, { status: 201 });
}
