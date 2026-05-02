import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { userProfiles } from '@/models/Schema';

const BUCKET = 'workspace-assets';
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/svg+xml']);

function extFromMime(mime: string) {
  if (mime === 'image/png') {
    return 'png';
  }
  if (mime === 'image/jpeg') {
    return 'jpg';
  }
  return 'svg';
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: 'File must be PNG, JPG, or SVG' }, { status: 422 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File exceeds 2 MB limit' }, { status: 422 });
  }

  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
  );

  // Create bucket on first use — idempotent, ignore already-exists error
  await admin.storage.createBucket(BUCKET, { public: true });

  const ext = extFromMime(file.type);
  const path = `${user.id}/logo.${ext}`;
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path);

  // Cache-bust so the browser replaces the old image without a hard reload
  const logoUrl = `${publicUrl}?v=${Date.now()}`;

  await db
    .insert(userProfiles)
    .values({ userId: user.id, logoUrl, updatedAt: new Date() })
    .onConflictDoUpdate({ target: userProfiles.userId, set: { logoUrl, updatedAt: new Date() } });

  return NextResponse.json({ logoUrl });
}
