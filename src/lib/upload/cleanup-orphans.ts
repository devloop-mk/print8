import { getSupabaseAdmin } from '@/lib/supabase/client';
import { collectOrderFileIds } from '@/lib/orders/order-assets';
import { deleteUploadObject } from '@/lib/storage/object-storage';

/** Orphan uploads: not linked to any order after this age. */
export const ORPHAN_UPLOAD_MAX_AGE_MS = 72 * 60 * 60 * 1000;

export const ORPHAN_CLEANUP_BATCH_SIZE = 150;

type UploadedFileRow = {
  id: string;
  stored_name: string;
  original_stored_name: string | null;
  created_at: string;
};

type OrderFileRow = {
  file_ids: string[] | null;
  items: unknown;
};

export async function collectReferencedUploadFileIds(): Promise<Set<string>> {
  const ids = new Set<string>();
  const { data, error } = await getSupabaseAdmin()
    .from('orders')
    .select('file_ids, items');

  if (error) throw new Error(error.message);

  for (const row of (data ?? []) as OrderFileRow[]) {
    const orderFileIds = Array.isArray(row.file_ids) ? row.file_ids : [];
    const items = Array.isArray(row.items) ? row.items : [];
    for (const id of collectOrderFileIds({ items, fileIds: orderFileIds })) {
      ids.add(id);
    }
  }

  return ids;
}

export async function cleanupOrphanUploads(options?: {
  maxAgeMs?: number;
  batchSize?: number;
  dryRun?: boolean;
}): Promise<{
  scanned: number;
  deleted: number;
  skippedReferenced: number;
  errors: number;
  expiredSessionsRemoved: number;
}> {
  const maxAgeMs = options?.maxAgeMs ?? ORPHAN_UPLOAD_MAX_AGE_MS;
  const batchSize = options?.batchSize ?? ORPHAN_CLEANUP_BATCH_SIZE;
  const dryRun = options?.dryRun ?? false;
  const cutoff = new Date(Date.now() - maxAgeMs).toISOString();

  const referenced = await collectReferencedUploadFileIds();

  const { data: candidates, error } = await getSupabaseAdmin()
    .from('uploaded_files')
    .select('id, stored_name, original_stored_name, created_at')
    .lt('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(batchSize);

  if (error) throw new Error(error.message);

  let deleted = 0;
  let skippedReferenced = 0;
  let errors = 0;

  for (const file of (candidates ?? []) as UploadedFileRow[]) {
    if (referenced.has(file.id)) {
      skippedReferenced += 1;
      continue;
    }

    if (dryRun) {
      deleted += 1;
      continue;
    }

    try {
      await deleteUploadObject(file.stored_name);
      if (file.original_stored_name) {
        await deleteUploadObject(file.original_stored_name);
      }
      const { error: delErr } = await getSupabaseAdmin()
        .from('uploaded_files')
        .delete()
        .eq('id', file.id);
      if (delErr) throw new Error(delErr.message);
      deleted += 1;
    } catch (err) {
      console.error('[cleanup-orphan-uploads] failed', file.id, err);
      errors += 1;
    }
  }

  return {
    scanned: candidates?.length ?? 0,
    deleted,
    skippedReferenced,
    errors,
    expiredSessionsRemoved: 0,
  };
}
