import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin/api-auth';
import { collectOrderFileIds, getAdminOrder } from '@/lib/admin/orders';
import {
  collectOrderItemUploadFileIds,
  extractUploadedFileIdFromPreviewSrc,
  getOrderItemPreviewImages,
} from '@/lib/orders/order-item-previews';
import { getUploadedFile } from '@/lib/upload';
import { getUploadObject } from '@/lib/storage/object-storage';
import {
  contentDispositionAttachment,
  contentDispositionInline,
} from '@/lib/security/sanitize';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> },
) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  try {
    const { id, fileId } = await params;
    const order = await getAdminOrder(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const allowed = new Set(
      collectOrderFileIds({
        items: order.items,
        fileIds: order.fileIds,
      }),
    );
    for (const item of order.items) {
      for (const uploadedId of collectOrderItemUploadFileIds(item)) {
        allowed.add(uploadedId);
      }
      for (const preview of getOrderItemPreviewImages(item)) {
        const previewFileId = extractUploadedFileIdFromPreviewSrc(preview.src);
        if (previewFileId) allowed.add(previewFileId);
      }
    }
    if (!allowed.has(fileId)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const file = await getUploadedFile(fileId);
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const { body, contentType } = await getUploadObject(file.storedName);
    const asDownload = request.nextUrl.searchParams.get('download') === '1';

    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type': contentType ?? file.mimeType,
        'Cache-Control': 'private, no-store',
        'Content-Disposition': asDownload
          ? contentDispositionAttachment(file.originalName)
          : contentDispositionInline(file.originalName),
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error('[admin/orders/files] download failed', err);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
