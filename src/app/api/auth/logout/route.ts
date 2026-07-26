import { NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server-auth';

export async function POST() {
  try {
    const supabase = await createSupabaseRouteHandlerClient();
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
