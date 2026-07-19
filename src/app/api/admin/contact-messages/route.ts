import { NextRequest } from 'next/server';
import { requireAdminApi } from '@/lib/admin/api-auth';
import {
  listContactMessages,
  type ContactMessageStatus,
} from '@/lib/db/contact-messages';

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const statusParam = request.nextUrl.searchParams.get('status') ?? 'all';
  const status =
    statusParam === 'new' ||
    statusParam === 'read' ||
    statusParam === 'archived' ||
    statusParam === 'all'
      ? statusParam
      : 'all';

  const messages = await listContactMessages({
    status: status as ContactMessageStatus | 'all',
    limit: 100,
  });

  return Response.json({ messages });
}
