import { NextRequest, NextResponse } from 'next/server';
import { processPrintUpload } from '@/lib/upload';
import { enforceRateLimit } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  const rateLimited = enforceRateLimit(request, 'upload-print', 20, 60 * 60 * 1000);
  if (rateLimited) return rateLimited;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const token = formData.get('token') as string | null;

    if (!file || !token) {
      return NextResponse.json(
        { error: 'File and token are required' },
        { status: 400 },
      );
    }

    const result = await processPrintUpload(token, file);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
