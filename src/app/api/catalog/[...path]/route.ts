import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { isR2NoSuchKeyError } from '@/lib/storage/r2-client';
import { getCatalogObject } from '@/lib/storage/object-storage';

export const runtime = 'nodejs';

const ALLOWED_PREFIXES = ['NEW_DESIGNS/', 'product-designs/'];

function isSafeSegment(segment: string): boolean {
  if (!segment || segment === '.' || segment === '..') return false;
  if (segment.includes('\0')) return false;
  if (segment.includes('/') || segment.includes('\\')) return false;
  return true;
}

function isAllowedCatalogPath(relativePath: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => relativePath.startsWith(prefix));
}

function contentTypeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
  };
  return map[ext] ?? 'application/octet-stream';
}

function resolveLocalCatalogPath(relativePath: string): string | null {
  const segments = relativePath.split('/');
  if (!segments.every(isSafeSegment)) return null;

  const publicRoot = path.resolve(process.cwd(), 'public');
  const candidate = path.resolve(publicRoot, relativePath);
  const relative = path.relative(publicRoot, candidate);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) return null;
  return candidate;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params;
  if (!segments?.length || !segments.every(isSafeSegment)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const relativePath = segments.join('/');
  if (!isAllowedCatalogPath(relativePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const { body, contentType } = await getCatalogObject(relativePath);
    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType ?? contentTypeFromPath(relativePath),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (!isR2NoSuchKeyError(error)) {
      console.error('[catalog] R2 fetch failed:', relativePath, error);
    }
  }

  const localPath = resolveLocalCatalogPath(relativePath);
  if (!localPath) {
    return NextResponse.json({ error: 'Catalog asset not found' }, { status: 404 });
  }

  const body = fs.readFileSync(localPath);
  return new NextResponse(body, {
    headers: {
      'Content-Type': contentTypeFromPath(localPath),
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
