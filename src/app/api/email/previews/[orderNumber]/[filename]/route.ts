import { NextRequest, NextResponse } from 'next/server';
import { getEmailPreviewObject } from '@/lib/storage/object-storage';
import { verifyEmailPreviewSignature } from '@/lib/email/email-preview-sign';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderNumber: string; filename: string }> },
) {
  const { orderNumber, filename } = await context.params;
  const sig = request.nextUrl.searchParams.get('sig') ?? '';

  if (!verifyEmailPreviewSignature(orderNumber, filename, sig)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { body, contentType } = await getEmailPreviewObject(orderNumber, filename);
    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        'Content-Type': contentType ?? 'image/png',
        'Cache-Control': 'private, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
