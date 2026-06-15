import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin/api-auth';
import { getSiteMetrics } from '@/lib/admin/site-metrics';

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const metrics = await getSiteMetrics();
  return NextResponse.json({ metrics });
}
