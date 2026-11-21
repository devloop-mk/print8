import fs from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin/api-auth';
import {
  destAbs,
  ensureOrigBackup,
  listLogoEditorItems,
  logoFileAbs,
  type LogoVariant,
} from '@/lib/catalog/logo-editor';

export const runtime = 'nodejs';

function contentTypeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.svg') return 'image/svg+xml';
  return 'application/octet-stream';
}

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const kind = request.nextUrl.searchParams.get('kind');
  if (kind === 'logo') {
    const variantParam = request.nextUrl.searchParams.get('variant') ?? 'dark';
    const variant: LogoVariant =
      variantParam === 'light' || variantParam === 'white' ? variantParam : 'dark';
    const file = logoFileAbs(variant);
    if (!fs.existsSync(file)) {
      return NextResponse.json({ error: 'Logo missing' }, { status: 404 });
    }
    const body = fs.readFileSync(file);
    return new NextResponse(body, {
      headers: {
        'Content-Type': contentTypeFromPath(file),
        'Cache-Control': 'no-store',
      },
    });
  }

  const id = request.nextUrl.searchParams.get('id')?.trim();
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const item = listLogoEditorItems().find((entry) => entry.id === id);
  if (!item) {
    return NextResponse.json({ error: 'Unknown product' }, { status: 404 });
  }

  const file =
    kind === 'dest' ? destAbs(item.destRel) : ensureOrigBackup(id, item.destRel);
  if (!fs.existsSync(file)) {
    return NextResponse.json({ error: 'File missing' }, { status: 404 });
  }
  const body = fs.readFileSync(file);
  return new NextResponse(body, {
    headers: {
      'Content-Type': contentTypeFromPath(file),
      'Cache-Control': 'no-store',
    },
  });
}
