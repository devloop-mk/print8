import { NextRequest, NextResponse } from 'next/server';
import { getUploadedFile } from '@/lib/upload';
import { supabaseAdmin } from '@/lib/supabase/client';

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET!;

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

    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .download(file.storedName);

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? 'Download failed' },
        { status: 500 },
      );
    }

    // data is a ReadableStream/Blob; use its stream for the response
    const body = (data as any).stream?.() ?? data;

    return new NextResponse(body, {
      headers: {
        'Content-Type': file.mimeType,
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
