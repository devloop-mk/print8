import { NextRequest, NextResponse } from 'next/server';
import { getUploadedFile } from '@/lib/upload';
import { getUploadObject } from '@/lib/storage/object-storage';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    const { fileId } = await params;
    const file = await getUploadedFile(fileId);
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const { body, contentType } = await getUploadObject(file.storedName);

    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type': contentType ?? file.mimeType,
        'Cache-Control': 'private, max-age=3600',
        'Content-Disposition': `inline; filename="${file.originalName}"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 },
    );
  }
}
