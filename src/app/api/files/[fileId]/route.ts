import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/api-auth';
import { getUploadedFile, validateUploadToken } from '@/lib/upload';
import { getUploadObject } from '@/lib/storage/object-storage';
import { contentDispositionInline } from '@/lib/security/sanitize';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    const { fileId } = await params;
    const file = await getUploadedFile(fileId);
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const adminSession = await getAdminSessionFromRequest(request);
    if (!adminSession) {
      const token = request.nextUrl.searchParams.get('token')?.trim();
      if (!token) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const session = await validateUploadToken(token);
      if (!session || file.sessionId !== session.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (new Date(session.expiresAt).getTime() < Date.now()) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { body, contentType } = await getUploadObject(file.storedName);

    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type': contentType ?? file.mimeType,
        'Cache-Control': 'private, no-store',
        'Content-Disposition': contentDispositionInline(file.originalName),
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 },
    );
  }
}
