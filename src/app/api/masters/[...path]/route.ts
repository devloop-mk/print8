import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MASTER_ROOTS = [
  path.resolve(process.cwd(), 'print-masters'),
  path.resolve(process.cwd(), 'public', 'masters'),
] as const;

function isSafeSegment(segment: string): boolean {
  if (!segment || segment === '.' || segment === '..') return false;
  if (segment.includes('\0')) return false;
  if (path.isAbsolute(segment)) return false;
  if (segment.includes('/') || segment.includes('\\')) return false;
  return true;
}

function isInsideRoot(filePath: string, root: string): boolean {
  const resolved = path.resolve(filePath);
  const relative = path.relative(root, resolved);
  return (
    relative !== '' &&
    !relative.startsWith('..') &&
    !path.isAbsolute(relative)
  );
}

function resolveLocalMasterPath(segments: string[]) {
  if (!segments.length || !segments.every(isSafeSegment)) {
    return null;
  }

  const relative = segments.join(path.sep);

  for (const root of MASTER_ROOTS) {
    const candidate = path.resolve(root, relative);
    if (!isInsideRoot(candidate, root)) continue;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production'
  ) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const { path: segments } = await context.params;
  const filePath = resolveLocalMasterPath(segments);

  if (!filePath) {
    return NextResponse.json({ error: 'Master asset not found' }, { status: 404 });
  }

  const body = fs.readFileSync(filePath);
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
