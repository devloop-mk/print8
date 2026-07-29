import 'server-only';

import fs from 'node:fs';
import path from 'node:path';

import { isRemoteAssetUrl } from '@/lib/storage/asset-url';
import { isR2Configured, r2GetObject } from '@/lib/storage/r2-client';

function getAssetsCdnBase() {
  return process.env.NEXT_PUBLIC_ASSETS_CDN_URL?.replace(/\/$/, '') ?? '';
}

/** Turn order/catalog paths or CDN URLs into an R2 object key when possible. */
export function premadeMasterObjectKey(storagePath: string): string | null {
  const trimmed = storagePath.trim();
  if (!trimmed) return null;

  if (isRemoteAssetUrl(trimmed)) {
    const cdn = getAssetsCdnBase();
    if (!cdn || !trimmed.startsWith(`${cdn}/`)) {
      return null;
    }
    return trimmed.slice(`${cdn}/`.length);
  }

  const normalized = trimmed.replace(/^\//, '');
  if (normalized.startsWith('masters/') || normalized.startsWith('catalog/')) {
    return normalized;
  }
  return `catalog/${normalized}`;
}

async function fetchRemoteMaster(url: string) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return {
    body: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get('content-type') ?? 'image/png',
  };
}

function readLocalMaster(storagePath: string) {
  const normalized = storagePath.replace(/^\//, '');
  const localCandidates: string[] = [];

  if (normalized.startsWith('masters/')) {
    localCandidates.push(
      path.join(
        process.cwd(),
        'print-masters',
        normalized.slice('masters/'.length),
      ),
      path.join(process.cwd(), 'public', normalized),
    );
  } else {
    localCandidates.push(path.join(process.cwd(), 'public', normalized));
  }

  for (const filePath of localCandidates) {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return {
        body: fs.readFileSync(filePath),
        contentType: filePath.endsWith('.png')
          ? 'image/png'
          : filePath.endsWith('.webp')
            ? 'image/webp'
            : undefined,
      };
    }
  }

  return null;
}

/** Load premade print artwork from R2, CDN, or local print-masters/public. */
export async function getPremadeMasterObject(
  storagePath: string,
  fallbackUrl?: string,
): Promise<{
  body: Buffer;
  contentType: string | undefined;
}> {
  const trimmed = storagePath.trim();
  const key = premadeMasterObjectKey(trimmed);

  if (key && isR2Configured()) {
    try {
      return await r2GetObject(key);
    } catch {
      // Fall through to CDN / local.
    }
  }

  const remoteCandidates = [
    isRemoteAssetUrl(trimmed) ? trimmed : null,
    fallbackUrl && isRemoteAssetUrl(fallbackUrl) ? fallbackUrl : null,
  ].filter((value): value is string => Boolean(value));

  for (const url of remoteCandidates) {
    try {
      return await fetchRemoteMaster(url);
    } catch {
      // Try next source.
    }
  }

  const local = readLocalMaster(trimmed);
  if (local) return local;

  throw new Error(`Premade master not found: ${trimmed}`);
}
