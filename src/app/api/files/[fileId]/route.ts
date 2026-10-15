import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/api-auth';
import { getUploadedFile, validateUploadToken } from '@/lib/upload';
import { serveUploadedFile } from '@/lib/upload/serve-uploaded-file';
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

    const served = await serveUploadedFile(file, { preferOriginal: false });

    return new NextResponse(new Uint8Array(served.body), {
      headers: {
        'Content-Type': served.contentType,
        'Cache-Control': 'private, no-store',
        'Content-Disposition': contentDispositionInline(served.filename),
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
