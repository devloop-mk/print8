import fs from 'node:fs';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin/api-auth';
import { compositeCatalogLogo } from '@/lib/catalog/composite-catalog-logo';
import {
  bumpVersion,
  clampPlacement,
  destAbs,
  ensureOrigBackup,
  listLogoEditorItems,
  origBackupAbs,
  readPlacements,
  writePlacements,
  type LogoPlacement,
} from '@/lib/catalog/logo-editor';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const placements = readPlacements();
  const items = listLogoEditorItems().map((item) => ({
    ...item,
    placement: placements[item.id] ?? null,
    origUrl: `/api/catalog/logo-editor/asset?id=${encodeURIComponent(item.id)}&kind=orig`,
    destUrl: `/${item.destRel}`,
  }));

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  let body: {
    id?: string;
    action?: 'save' | 'restore';
    placement?: Partial<LogoPlacement>;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const id = body.id?.trim();
  if (!id) {
    return NextResponse.json({ error: 'Missing product id' }, { status: 400 });
  }

  const item = listLogoEditorItems().find((entry) => entry.id === id);
  if (!item) {
    return NextResponse.json({ error: 'Unknown product' }, { status: 404 });
  }

  const dest = destAbs(item.destRel);
  const orig = ensureOrigBackup(id, item.destRel);

  if (body.action === 'restore') {
    fs.copyFileSync(orig, dest);
    const placements = readPlacements();
    delete placements[id];
    writePlacements(placements);
    const version = bumpVersion(id);
    return NextResponse.json({ ok: true, version, restored: true });
  }

  const placement = clampPlacement(body.placement ?? {});
  await compositeCatalogLogo(orig, dest, placement);

  const placements = readPlacements();
  placements[id] = placement;
  writePlacements(placements);
  const version = bumpVersion(id);

  return NextResponse.json({ ok: true, version, placement });
}

export async function DELETE(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const id = request.nextUrl.searchParams.get('id')?.trim();
  if (!id) {
    return NextResponse.json({ error: 'Missing product id' }, { status: 400 });
  }
  const item = listLogoEditorItems().find((entry) => entry.id === id);
  if (!item) {
    return NextResponse.json({ error: 'Unknown product' }, { status: 404 });
  }
  const backup = origBackupAbs(item.destRel);
  const dest = destAbs(item.destRel);
  if (fs.existsSync(backup)) {
    fs.copyFileSync(backup, dest);
  }
  const placements = readPlacements();
  delete placements[id];
  writePlacements(placements);
  const version = bumpVersion(id);
  return NextResponse.json({ ok: true, version, restored: true });
}
