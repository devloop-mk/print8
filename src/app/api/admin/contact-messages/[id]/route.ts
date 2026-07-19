import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin/api-auth';
import {
  getContactMessage,
  updateContactMessageStatus,
} from '@/lib/db/contact-messages';

const statusSchema = z.object({
  status: z.enum(['new', 'read', 'archived']),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const { id } = await context.params;
  const message = await getContactMessage(id);
  if (!message) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json({ message });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid status' }, { status: 400 });
  }

  const existing = await getContactMessage(id);
  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  await updateContactMessageStatus(id, parsed.data.status);
  return Response.json({ ok: true });
}
