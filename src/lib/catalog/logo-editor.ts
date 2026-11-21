import fs from 'node:fs';
import path from 'node:path';
import { PROMO_CATALOG_PRODUCTS } from '@/lib/catalog/promo-catalog';
import {
  DEFAULT_PLACEMENT,
  type LogoPlacement,
  type LogoVariant,
} from '@/lib/catalog/logo-editor-defaults';

export { DEFAULT_PLACEMENT, type LogoPlacement, type LogoVariant };

export type LogoEditorItem = {
  id: string;
  destRel: string;
  origRel: string | null;
  sourceKind: 'backup' | 'override' | 'dest';
};

const REPO = process.cwd();
const PUBLIC_DIR = path.join(REPO, 'public');
const ORIG_DIR = path.join(REPO, '.tmp', 'catalog-orig');
const PLACEMENTS_PATH = path.join(REPO, 'src', 'lib', 'catalog', 'logo-placements.json');
const VERSIONS_PATH = path.join(REPO, 'src', 'lib', 'catalog', 'logo-versions.json');

const LOGO_FILES: Record<Exclude<LogoVariant, 'white'>, string> = {
  dark: path.join(REPO, '.tmp', 'print8-logo-dark.png'),
  light: path.join(REPO, '.tmp', 'print8-logo-light.png'),
};

const LOGO_SVG: Record<Exclude<LogoVariant, 'white'>, string> = {
  dark: path.join(PUBLIC_DIR, 'logo', 'print 8 logo horizontal.svg'),
  light: path.join(PUBLIC_DIR, 'logo', 'print 8 logo horizontal light.svg'),
};

/** Blank mockups that are not the catalog dest file. */
const SOURCE_OVERRIDES: Record<string, string> = {
  classic: 'public/mugs/mug-white-classic-v2.jpg',
  inner: 'public/supplier/koni/B11T-01.jpg',
  stackable: 'public/supplier/koni/BKD6T-MG.jpg',
  tshirt: 'public/t-shirts/unisex/bela-front.jpg',
  bluzonCrew: 'public/hoodies/crewneck/bela-front.jpg',
};

function stripQuery(url: string): string {
  return url.split('?')[0] ?? url;
}

export function catalogDestRel(image: string): string | null {
  const pathname = stripQuery(image);
  if (!pathname.startsWith('/catalog/')) return null;
  return pathname.slice(1);
}

export function destAbs(destRel: string): string {
  return path.join(PUBLIC_DIR, destRel);
}

export function origBackupAbs(destRel: string): string {
  return path.join(ORIG_DIR, destRel);
}

export function resolveOrigAbs(id: string, destRel: string): { abs: string; kind: LogoEditorItem['sourceKind'] } {
  const override = SOURCE_OVERRIDES[id];
  if (override) {
    const abs = path.join(REPO, override);
    if (fs.existsSync(abs)) return { abs, kind: 'override' };
  }
  const backup = origBackupAbs(destRel);
  if (fs.existsSync(backup)) return { abs: backup, kind: 'backup' };
  return { abs: destAbs(destRel), kind: 'dest' };
}

export function listLogoEditorItems(): LogoEditorItem[] {
  const items: LogoEditorItem[] = [];
  for (const product of PROMO_CATALOG_PRODUCTS) {
    const destRel = catalogDestRel(product.image);
    if (!destRel) continue;
    if (!fs.existsSync(destAbs(destRel))) continue;
    const orig = resolveOrigAbs(product.id, destRel);
    items.push({
      id: product.id,
      destRel,
      origRel: path.relative(REPO, orig.abs).replaceAll('\\', '/'),
      sourceKind: orig.kind,
    });
  }
  return items;
}

export function readPlacements(): Record<string, LogoPlacement> {
  try {
    const raw = fs.readFileSync(PLACEMENTS_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, LogoPlacement>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function writePlacements(placements: Record<string, LogoPlacement>): void {
  fs.writeFileSync(PLACEMENTS_PATH, `${JSON.stringify(placements, null, 2)}\n`, 'utf8');
}

export function readVersions(): Record<string, string> {
  try {
    const raw = fs.readFileSync(VERSIONS_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function writeVersions(versions: Record<string, string>): void {
  fs.writeFileSync(VERSIONS_PATH, `${JSON.stringify(versions, null, 2)}\n`, 'utf8');
}

export function bumpVersion(id: string): string {
  const versions = readVersions();
  const next = Date.now().toString(36);
  versions[id] = next;
  writeVersions(versions);
  return next;
}

export function ensureOrigBackup(id: string, destRel: string): string {
  const dest = destAbs(destRel);
  const backup = origBackupAbs(destRel);
  const override = SOURCE_OVERRIDES[id];
  if (override) {
    const abs = path.join(REPO, override);
    if (fs.existsSync(abs)) return abs;
  }
  if (!fs.existsSync(backup) && fs.existsSync(dest)) {
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.copyFileSync(dest, backup);
  }
  if (fs.existsSync(backup)) return backup;
  return dest;
}

export function logoFileAbs(variant: LogoVariant): string {
  if (variant === 'white') {
    if (fs.existsSync(LOGO_FILES.light)) return LOGO_FILES.light;
    return LOGO_SVG.light;
  }
  if (fs.existsSync(LOGO_FILES[variant])) return LOGO_FILES[variant];
  return LOGO_SVG[variant];
}

export function clampPlacement(input: Partial<LogoPlacement>): LogoPlacement {
  const logo: LogoVariant =
    input.logo === 'light' || input.logo === 'white' || input.logo === 'dark'
      ? input.logo
      : DEFAULT_PLACEMENT.logo;
  return {
    logo,
    cx: clamp(Number(input.cx), 0.02, 0.98, DEFAULT_PLACEMENT.cx),
    cy: clamp(Number(input.cy), 0.02, 0.98, DEFAULT_PLACEMENT.cy),
    widthFrac: clamp(Number(input.widthFrac), 0.04, 0.95, DEFAULT_PLACEMENT.widthFrac),
    angle: clamp(Number(input.angle), -180, 180, DEFAULT_PLACEMENT.angle),
  };
}

function clamp(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}
