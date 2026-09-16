import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { isR2Configured, isR2NoSuchKeyError, r2GetObject } from '@/lib/storage/r2-client';

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

function contentTypeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  return map[ext] ?? 'image/png';
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
  if (!segments?.length || !segments.every(isSafeSegment)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const relative = segments.join('/');
  const filePath = resolveLocalMasterPath(segments);

  if (filePath) {
    const body = fs.readFileSync(filePath);
    return new NextResponse(body, {
      headers: {
        'Content-Type': contentTypeFromPath(filePath),
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  if (isR2Configured()) {
    try {
      const { body, contentType } = await r2GetObject(`masters/${relative}`);
      return new NextResponse(new Uint8Array(body), {
        headers: {
          'Content-Type': contentType ?? contentTypeFromPath(relative),
          'Cache-Control': 'public, max-age=3600',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch (error) {
      if (!isR2NoSuchKeyError(error)) {
        console.error('[masters] R2 fetch failed:', relative, error);
      }
    }
  }

  return NextResponse.json({ error: 'Master asset not found' }, { status: 404 });
}
