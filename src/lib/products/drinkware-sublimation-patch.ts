import type { PrintAreaInsets } from '@/lib/products/print-area';

export type DrinkwareSublimationPatch = {
  /** Fixed body glaze — patch mugs ignore user color for the non-print area. */
  bodyColor: string;
  patchColor: string;
  /** Printable white field on the flat unwrap (% of canvas). */
  bounds: PrintAreaInsets;
  /** Decorative scalloped border on this vertical edge of the patch. */
  scallopedEdge: 'left' | 'right';
  scallopCount: number;
  /** Scallop depth as a fraction of patch width. */
  scallopDepth: number;
};

/** White sublimation patch on a coloured mug body — design prints only inside the patch. */
export const DRINKWARE_SUBLIMATION_PATCH_BY_PRODUCT_ID: Record<
  string,
  DrinkwareSublimationPatch
> = {
  'mug-red-patch': {
    bodyColor: '#dc2626',
    patchColor: '#ffffff',
    bounds: {
      top: 12,
      right: 29,
      bottom: 16,
      left: 29,
    },
    scallopedEdge: 'left',
    scallopCount: 7,
    scallopDepth: 0.065,
  },
};

export function getDrinkwareSublimationPatch(
  productId?: string,
): DrinkwareSublimationPatch | null {
  if (!productId) return null;
  return DRINKWARE_SUBLIMATION_PATCH_BY_PRODUCT_ID[productId] ?? null;
}

export function getDrinkwareBodyColor(
  productId: string | undefined,
  productColor: string,
): string {
  const patch = getDrinkwareSublimationPatch(productId);
  return patch?.bodyColor ?? productColor;
}

function patchRect(
  patch: DrinkwareSublimationPatch,
  width: number,
  height: number,
) {
  return {
    left: (patch.bounds.left / 100) * width,
    right: width - (patch.bounds.right / 100) * width,
    top: (patch.bounds.top / 100) * height,
    bottom: height - (patch.bounds.bottom / 100) * height,
  };
}

function tornEdgeOffset(t: number, amplitude: number) {
  return (
    amplitude *
    (Math.sin(t * 17 * Math.PI) * 0.55 +
      Math.sin(t * 29 * Math.PI) * 0.35 +
      Math.sin(t * 41 * Math.PI) * 0.15)
  );
}

type PatchPoint = { x: number; y: number };

/** Closed polygon for the white sublimation field (scalloped side + torn top/bottom). */
export function buildSublimationPatchPoints(
  patch: DrinkwareSublimationPatch,
  width: number,
  height: number,
): PatchPoint[] {
  const { left, right, top, bottom } = patchRect(patch, width, height);
  const patchWidth = right - left;
  const patchHeight = bottom - top;
  const amp = patchWidth * patch.scallopDepth;
  const scallops = patch.scallopCount;
  const steps = scallops * 2;
  const tornAmp = patchHeight * 0.022;
  const topSteps = 28;
  const points: PatchPoint[] = [];

  if (patch.scallopedEdge === 'left') {
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = bottom - t * (bottom - top);
      const wave = Math.sin(t * scallops * Math.PI);
      points.push({ x: left - amp * Math.max(0, wave), y });
    }

    for (let i = 1; i <= topSteps; i++) {
      const t = i / topSteps;
      points.push({
        x: left + t * patchWidth,
        y: top + tornEdgeOffset(t, tornAmp),
      });
    }

    const rightAmp = amp * 0.58;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const y = top + t * (bottom - top);
      const wave = Math.sin(t * scallops * Math.PI);
      points.push({ x: right + rightAmp * Math.max(0, wave), y });
    }

    for (let i = topSteps - 1; i >= 0; i--) {
      const t = i / topSteps;
      points.push({
        x: left + t * patchWidth,
        y: bottom + tornEdgeOffset(t + 0.37, tornAmp),
      });
    }
  } else {
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = top + t * (bottom - top);
      const wave = Math.sin(t * scallops * Math.PI);
      points.push({ x: right + amp * Math.max(0, wave), y });
    }

    for (let i = topSteps - 1; i >= 0; i--) {
      const t = i / topSteps;
      points.push({
        x: left + t * patchWidth,
        y: bottom + tornEdgeOffset(t + 0.37, tornAmp),
      });
    }

    for (let i = 0; i <= topSteps; i++) {
      const t = i / topSteps;
      points.push({
        x: left + t * patchWidth,
        y: top + tornEdgeOffset(t, tornAmp),
      });
    }
  }

  return points;
}

/** Trace the white sublimation patch onto a canvas path. */
export function traceSublimationPatchPath(
  ctx: CanvasRenderingContext2D,
  patch: DrinkwareSublimationPatch,
  width: number,
  height: number,
) {
  const points = buildSublimationPatchPoints(patch, width, height);
  if (points.length === 0) return;

  ctx.beginPath();
  ctx.moveTo(points[0]!.x, points[0]!.y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i]!.x, points[i]!.y);
  }
  ctx.closePath();
}

export function paintSublimationPatch(
  ctx: CanvasRenderingContext2D,
  patch: DrinkwareSublimationPatch,
  width: number,
  height: number,
) {
  traceSublimationPatchPath(ctx, patch, width, height);
  ctx.fillStyle = patch.patchColor;
  ctx.fill();

  ctx.save();
  traceSublimationPatchPath(ctx, patch, width, height);
  ctx.clip();
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, 'rgba(0,0,0,0.045)');
  gradient.addColorStop(0.35, 'rgba(255,255,255,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.03)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/** SVG path for the flat editor overlay (viewBox 0 0 width height). */
export function buildSublimationPatchSvgPath(
  patch: DrinkwareSublimationPatch,
  width: number,
  height: number,
): string {
  const points = buildSublimationPatchPoints(patch, width, height);
  if (points.length === 0) return '';

  const [first, ...rest] = points;
  const segments = rest.map((point) => `L ${point.x} ${point.y}`).join(' ');
  return `M ${first!.x} ${first!.y} ${segments} Z`;
}

/** CSS clip-path tracing the patch (for flat editor design layers). */
export function getSublimationPatchCssClipPath(
  patch: DrinkwareSublimationPatch,
  width = 1000,
  height = 1000,
): string {
  const points = buildSublimationPatchPoints(patch, width, height);
  if (points.length === 0) return '';

  const coords = points
    .map((point) => `${(point.x / width) * 100}% ${(point.y / height) * 100}%`)
    .join(', ');
  return `polygon(${coords})`;
}

/** CSS clip-path polygon approximating the patch (rectangular — fallback for clamps). */
export function getSublimationPatchClipPath(
  patch: DrinkwareSublimationPatch,
): string {
  const { top, right, bottom, left } = patch.bounds;
  return `inset(${top}% ${right}% ${bottom}% ${left}%)`;
}
