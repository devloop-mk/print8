import type { OrderStatus } from '@/lib/db';
import {
  catalogDesignsDb,
  type CatalogDesignRecord,
} from '@/lib/db/catalog-designs';
import {
  getExclusiveBusinessCardTemplate,
  isExclusiveBusinessCardId,
  toExclusiveBusinessCardRecordInput,
} from '@/lib/data/exclusive-business-cards';
import type { CheckoutInput } from '@/lib/validations/order';

const SOLD_STATUSES: OrderStatus[] = ['delivered'];
const ACTIVE_RESERVATION_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'printing',
  'ready',
];
const RELEASE_STATUSES: OrderStatus[] = ['cancelled'];

export function extractExclusiveDesignIds(
  items: CheckoutInput['items'],
): string[] {
  const ids = new Set<string>();
  for (const item of items) {
    if (item.type !== 'design') continue;
    const designId = item.metadata?.designTemplateId;
    if (typeof designId === 'string' && designId.length > 0) {
      ids.add(designId);
    }
  }
  return [...ids];
}

async function ensureExclusiveDesignRecord(
  designId: string,
): Promise<CatalogDesignRecord | null> {
  const existing = await catalogDesignsDb.findById(designId);
  if (existing) return existing;

  if (!isExclusiveBusinessCardId(designId)) return null;

  const packTemplate = getExclusiveBusinessCardTemplate(designId);
  if (!packTemplate) return null;

  return catalogDesignsDb.upsert(toExclusiveBusinessCardRecordInput(packTemplate));
}

export async function getExclusiveDesignsInOrder(
  items: CheckoutInput['items'],
): Promise<CatalogDesignRecord[]> {
  const ids = extractExclusiveDesignIds(items);
  if (ids.length === 0) return [];

  const records = await Promise.all(
    ids.map((designId) => ensureExclusiveDesignRecord(designId)),
  );

  return records.filter(
    (record): record is CatalogDesignRecord => Boolean(record?.exclusive),
  );
}

export async function validateExclusiveDesignsAvailable(
  items: CheckoutInput['items'],
): Promise<{ ok: true } | { ok: false; unavailable: string[] }> {
  const exclusive = await getExclusiveDesignsInOrder(items);
  const unavailable = exclusive
    .filter((record) => record.availability !== 'available')
    .map((record) => record.id);

  if (unavailable.length > 0) {
    return { ok: false, unavailable };
  }
  return { ok: true };
}

export async function reserveExclusiveDesignsForOrder(
  orderId: string,
  items: CheckoutInput['items'],
) {
  const exclusive = await getExclusiveDesignsInOrder(items);
  const reserved: string[] = [];

  try {
    for (const record of exclusive) {
      await catalogDesignsDb.reserveForOrder(record.id, orderId);
      reserved.push(record.id);
    }
  } catch (error) {
    await Promise.all(
      reserved.map((designId) =>
        catalogDesignsDb.releaseReservation(designId, orderId),
      ),
    );
    throw error;
  }
}

export async function syncExclusiveDesignsForOrderStatus(
  orderId: string,
  status: OrderStatus,
  items: CheckoutInput['items'],
) {
  const exclusive = await getExclusiveDesignsInOrder(items);
  if (exclusive.length === 0) return;

  if (SOLD_STATUSES.includes(status)) {
    for (const record of exclusive) {
      if (
        record.reservedOrderId === orderId ||
        record.availability === 'reserved'
      ) {
        await catalogDesignsDb.markSold(record.id, orderId);
      }
    }
    return;
  }

  if (RELEASE_STATUSES.includes(status)) {
    for (const record of exclusive) {
      if (record.reservedOrderId === orderId) {
        await catalogDesignsDb.releaseReservation(record.id, orderId);
      }
    }
    return;
  }

  if (ACTIVE_RESERVATION_STATUSES.includes(status)) {
    for (const record of exclusive) {
      if (
        record.availability === 'available' &&
        record.exclusive
      ) {
        await catalogDesignsDb.reserveForOrder(record.id, orderId);
      }
    }
  }
}

export function isDesignPubliclyAvailable(record: CatalogDesignRecord) {
  return record.availability === 'available';
}

export function getDesignAvailabilityLabel(
  availability: CatalogDesignRecord['availability'],
) {
  switch (availability) {
    case 'available':
      return 'Достапен';
    case 'reserved':
      return 'Резервиран';
    case 'sold':
      return 'Продаден';
    case 'draft':
      return 'Нацрт';
    case 'archived':
      return 'Архивиран';
    default:
      return availability;
  }
}
