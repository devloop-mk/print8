import type { CheckoutInput } from '@/lib/validations/order';
import { collectOrderFileIds } from '@/lib/orders/order-assets';
import { getUploadedFile, validateUploadToken } from '@/lib/upload';

export async function validateOrderUploadFiles(
  data: CheckoutInput,
): Promise<
  | { ok: true }
  | {
      ok: false;
      code: 'upload_token_required' | 'invalid_upload_token' | 'invalid_file_reference';
    }
> {
  const fileIds = collectOrderFileIds(data);
  if (fileIds.length === 0) return { ok: true };

  if (!data.uploadToken?.trim()) {
    return { ok: false, code: 'upload_token_required' };
  }

  const session = await validateUploadToken(data.uploadToken.trim());
  if (!session) {
    return { ok: false, code: 'invalid_upload_token' };
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    return { ok: false, code: 'invalid_upload_token' };
  }

  for (const fileId of fileIds) {
    const file = await getUploadedFile(fileId);
    if (!file || file.sessionId !== session.id) {
      return { ok: false, code: 'invalid_file_reference' };
    }
  }

  return { ok: true };
}
